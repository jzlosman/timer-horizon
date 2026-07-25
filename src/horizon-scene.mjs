import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import { glyphCountForDensity, interpolateSceneTempo, sceneTempo } from './scene-math.mjs';

const glyphCharacters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=×÷<>/\\|[]{}()!?@#$%&*~^:;';
const BODY_LIMIT = 8;

function glyphAtlas() {
  const columns = 16;
  const size = 64;
  const rows = Math.ceil(glyphCharacters.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = columns * size;
  canvas.height = rows * size;
  const context = canvas.getContext('2d');

  context.fillStyle = '#f4e3c6';
  context.font = '500 42px ui-monospace, SFMono-Regular, Menlo, monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  glyphCharacters.split('').forEach((glyph, index) => {
    const x = (index % columns) * size + size / 2;
    const y = Math.floor(index / columns) * size + size / 2;
    context.fillText(glyph, x, y + 2);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { texture, columns, rows };
}

function glyphMaterial(atlas) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uAtlas: { value: atlas.texture },
      uColumns: { value: atlas.columns },
      uRows: { value: atlas.rows },
      uHorizonOffset: { value: 0.11 },
      uAspect: { value: window.innerWidth / window.innerHeight },
      uPointer: { value: new THREE.Vector2(2, 2) },
      uPointerVelocity: { value: new THREE.Vector2() },
      uPointerEnergy: { value: 0 },
      uSignalOrigin: { value: new THREE.Vector2(2, 2) },
      uSignalProgress: { value: 1 },
      uBodies: { value: Array.from({ length: BODY_LIMIT }, () => new THREE.Vector2(2, 2)) },
      uBodyStrength: { value: new Float32Array(BODY_LIMIT) },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aGlyph;
      attribute float aDepth;
      varying float vGlyph;
      varying float vAlpha;
      varying float vHeat;
      varying float vTint;
      varying float vSignal;
      varying float vSpectrum;
      varying float vBodyOrbit;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uHorizonOffset;
      uniform float uAspect;
      uniform vec2 uPointer;
      uniform vec2 uPointerVelocity;
      uniform float uPointerEnergy;
      uniform vec2 uSignalOrigin;
      uniform float uSignalProgress;
      uniform vec2 uBodies[8];
      uniform float uBodyStrength[8];

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        float rate = mix(0.010, 0.062, pow(hash(aSeed * 3.7), 1.35));
        float cycle = fract(uTime * rate + aSeed);
        float side = step(0.5, hash(aSeed * 11.2)) * 2.0 - 1.0;
        float entry = (hash(aSeed * 7.9) - 0.5) * 1.45;
        float radius = mix(1.55, 0.145, pow(cycle, 0.72));
        float bend = (1.0 - radius / 1.55) * (1.45 + hash(aSeed * 5.3) * 1.25) * side;
        float angle = entry + bend + (side < 0.0 ? 0.0 : 3.14159265);
        vec2 point = vec2(cos(angle) * radius, sin(angle) * radius * 0.68);
        float upperStratum = step(0.72, hash(aSeed * 17.4));
        vec2 upperPoint = vec2(
          side * (1.6 - cycle * 2.1),
          0.65 - cycle * 0.58 + sin(uTime * 0.06 + aSeed * 23.0) * 0.04
        );
        point = mix(point, upperPoint, upperStratum);
        float volumeStratum = step(0.46, hash(aSeed * 47.6));
        float volumeAngle = hash(aSeed * 29.7) * 6.2831853;
        float volumeRadius = mix(0.52, 2.0, hash(aSeed * 13.1));
        float collapse = pow(cycle, 0.78);
        float volumeTurn = side * collapse * (0.55 + hash(aSeed * 19.8));
        mat2 volumeRotation = mat2(cos(volumeTurn), -sin(volumeTurn), sin(volumeTurn), cos(volumeTurn));
        vec2 volumeSource = vec2(cos(volumeAngle) * volumeRadius, sin(volumeAngle) * volumeRadius * 0.72);
        vec2 volumePoint = volumeRotation * volumeSource * (1.0 - collapse);
        point = mix(point, volumePoint, volumeStratum);
        point.y += uHorizonOffset + sin(uTime * 0.08 + aSeed * 31.0) * 0.026;
        float heat = 1.0 - smoothstep(0.12, 0.54, radius);
        float driftRate = 0.14 + hash(aSeed * 61.0) * 0.42;
        float driftAmount = 0.004 + hash(aSeed * 67.0) * 0.014;
        point += vec2(sin(uTime * driftRate + aSeed * 43.0), cos(uTime * driftRate * 0.73 + aSeed * 71.0)) * driftAmount * (1.0 - heat);
        vec2 wakeDelta = point - uPointer;
        float wake = exp(-dot(wakeDelta, wakeDelta) * 11.0) * uPointerEnergy;
        vec2 wakeDirection = normalize(wakeDelta + vec2(0.0001));
        vec2 wakeTangent = vec2(-wakeDirection.y, wakeDirection.x);
        point += wakeDirection * wake * 0.075 + wakeTangent * wake * 0.025 + uPointerVelocity * wake * 0.28;
        vec2 signalVector = vec2(0.0, uHorizonOffset) - uSignalOrigin;
        float signalLength = max(length(signalVector), 0.001);
        vec2 signalDirection = signalVector / signalLength;
        vec2 signalDelta = point - uSignalOrigin;
        float signalAlong = dot(signalDelta, signalDirection) / signalLength;
        float signalAcross = abs(signalDirection.x * signalDelta.y - signalDirection.y * signalDelta.x);
        float signalHead = mix(-0.06, 1.06, uSignalProgress);
        float signalFade = 1.0 - smoothstep(0.58, 1.0, uSignalProgress);
        float signal = exp(-signalAcross * signalAcross * 260.0) * exp(-pow((signalAlong - signalHead) * 13.0, 2.0)) * signalFade;
        point += signalDirection * signal * 0.042;
        float bodyOrbit = 0.0;
        for (int i = 0; i < 8; i++) {
          vec2 bodyDelta = point - uBodies[i];
          float bodyDistance = length(bodyDelta) + 0.0001;
          float orbit = uBodyStrength[i] * exp(-bodyDistance * bodyDistance * 16.0);
          bodyOrbit = max(bodyOrbit, orbit);
          vec2 bodyDirection = bodyDelta / bodyDistance;
          vec2 bodyTangent = vec2(-bodyDirection.y, bodyDirection.x);
          point += bodyTangent * orbit * 0.13 + bodyDirection * orbit * 0.022;
        }
        vec2 voidPoint = (point - vec2(0.0, uHorizonOffset)) * 0.5;
        voidPoint.x *= uAspect * 0.58;
        float voidMask = smoothstep(0.148, 0.195, length(voidPoint));
        float fadeIn = smoothstep(0.0, 0.08, cycle);
        float fadeOut = 1.0 - smoothstep(0.76, 1.0, cycle);
        float twinkle = 0.72 + sin(uTime * (0.55 + hash(aSeed * 37.0)) + aSeed * 89.0) * 0.18;
        float scale = mix(0.52, 2.7, pow(hash(aSeed * 73.0), 1.6));
        vGlyph = aGlyph;
        vAlpha = (0.18 + aDepth * 0.46 + heat * 0.16 + bodyOrbit * 0.30 + signal * 0.34) * twinkle * fadeIn * fadeOut * voidMask * mix(1.0, 0.78, upperStratum) * mix(1.0, 0.9, volumeStratum);
        vHeat = max(max(heat, bodyOrbit * 0.74), signal * 0.86);
        vTint = hash(aSeed * 97.0);
        vSignal = signal;
        vSpectrum = 0.5 + 0.5 * sin(point.x * 1.7 - point.y * 1.1 + uTime * 0.08);
        vBodyOrbit = bodyOrbit;
        gl_PointSize = (3.0 + aDepth * 7.2 + heat * 2.0 + upperStratum * 1.5 + bodyOrbit * 3.6 + signal * 3.4) * scale * mix(1.0, 0.94, volumeStratum) * uPixelRatio;
        gl_Position = vec4(point, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uColumns;
      uniform float uRows;
      varying float vGlyph;
      varying float vAlpha;
      varying float vHeat;
      varying float vTint;
      varying float vSignal;
      varying float vSpectrum;
      varying float vBodyOrbit;

      void main() {
        float column = mod(vGlyph, uColumns);
        float row = floor(vGlyph / uColumns);
        vec2 uv = (vec2(column, row) + gl_PointCoord) / vec2(uColumns, uRows);
        float mark = texture2D(uAtlas, uv).a;
        vec3 cold = mix(vec3(0.42, 0.34, 0.24), vec3(0.82, 0.74, 0.58), vTint);
        vec3 hot = mix(vec3(0.92, 0.12, 0.02), vec3(1.0, 0.62, 0.18), vTint);
        vec3 green = vec3(0.08, 0.78, 0.52);
        vec3 blue = vec3(0.10, 0.40, 1.0);
        vec3 violet = vec3(0.52, 0.16, 0.98);
        vec3 spectrum = mix(mix(green, blue, vSpectrum), violet, smoothstep(0.66, 1.0, vSpectrum));
        vec3 color = mix(cold, hot, vHeat);
        color = mix(color, spectrum, 0.24);
        color = mix(color, spectrum, vBodyOrbit * 0.85);
        vec3 signalColor = mix(spectrum, vec3(0.76, 0.90, 1.0), 0.18);
        color = mix(color, signalColor, vSignal * 0.78);
        gl_FragColor = vec4(color, mark * vAlpha);
      }
    `,
  });
}

function ringMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAspect: { value: window.innerWidth / window.innerHeight }, uCenterY: { value: 0.055 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uAspect;
      uniform float uCenterY;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.19, 289.77))) * 45758.5453); }
      void main() {
        vec2 p = vUv - vec2(0.5, 0.5 + uCenterY);
        p.x *= uAspect * 0.58;
        float angle = atan(p.y, p.x);
        float radius = length(p);
        float orbitalTime = uTime * 0.48;
        float drift = sin(angle * 3.0 + orbitalTime * 0.62) * 0.0028 + sin(angle * 5.0 - orbitalTime * 0.35) * 0.0016;
        float ringRadius = 0.160 + drift;
        float outerRadius = ringRadius + 0.021 + sin(angle * 4.0 - orbitalTime * 1.12) * 0.0032;
        float middleRadius = ringRadius + sin(angle * 3.0 + orbitalTime * 0.74) * 0.0024;
        float innerRadius = ringRadius - 0.016 + sin(angle * 5.0 - orbitalTime * 0.92) * 0.0021;
        float outerBand = 1.0 - smoothstep(0.002, 0.0115, abs(radius - outerRadius));
        float middleBand = 1.0 - smoothstep(0.0015, 0.0068, abs(radius - middleRadius));
        float innerBand = 1.0 - smoothstep(0.001, 0.0048, abs(radius - innerRadius));
        float outerFlow = 0.24 + 0.76 * pow(0.5 + 0.5 * sin(angle * 3.0 - orbitalTime * 1.12), 1.45);
        float middleFlow = 0.34 + 0.66 * pow(0.5 + 0.5 * sin(angle * 4.0 + orbitalTime * 0.74 + 1.2), 1.25);
        float innerFlow = 0.46 + 0.54 * pow(0.5 + 0.5 * sin(angle * 5.0 - orbitalTime * 0.92 - 0.8), 1.1);
        float outerHue = 0.5 + 0.5 * sin(angle * 1.4 + orbitalTime * 0.36 - 0.8);
        float middleHue = 0.5 + 0.5 * sin(angle * 1.9 - orbitalTime * 0.48 + 1.1);
        float innerHue = 0.5 + 0.5 * sin(angle * 2.3 + orbitalTime * 0.56 - 1.7);
        vec3 violet = vec3(0.46, 0.12, 0.92);
        vec3 blue = vec3(0.08, 0.38, 1.0);
        vec3 green = vec3(0.05, 0.80, 0.46);
        vec3 outerColor = mix(vec3(0.64, 0.045, 0.008), violet, outerHue * 0.76);
        vec3 middleColor = mix(vec3(1.0, 0.30, 0.025), blue, middleHue * 0.60);
        vec3 innerColor = mix(vec3(1.0, 0.83, 0.46), green, innerHue * 0.42);
        vec3 color = outerColor * outerBand * outerFlow + middleColor * middleBand * middleFlow + innerColor * innerBand * innerFlow;
        float alpha = outerBand * outerFlow * 0.32 + middleBand * middleFlow * 0.50 + innerBand * innerFlow * 0.62;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

export function createHorizonScene(canvas, { reducedMotion = false, onContextLost } = {}) {
  if (reducedMotion) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const atlas = glyphAtlas();
  const count = glyphCountForDensity(window.innerWidth < 700 ? 7000 : 24000, false);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));
  geometry.setAttribute('aGlyph', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.floor(Math.random() * glyphCharacters.length)), 1));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));

  const points = new THREE.Points(geometry, glyphMaterial(atlas));
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ringMaterial());
  const bodyTargets = Array.from({ length: BODY_LIMIT }, () => new THREE.Vector2(2, 2));
  const bodyStrengthTargets = new Float32Array(BODY_LIMIT);
  const bodyIds = Array(BODY_LIMIT).fill(null);
  scene.add(points, ring);

  let frame;
  let active = true;
  let rendering = false;
  let elapsed = 0;
  let sceneTimeScale = sceneTempo(false);
  let isDilated = false;
  let pointerEnergy = 0;
  let signalProgress = 1;
  const pointer = new THREE.Vector2(2, 2);
  const pointerVelocity = new THREE.Vector2();
  const signalOrigin = new THREE.Vector2(2, 2);
  const clock = new THREE.Clock(false);
  const handlePointerMove = ({ clientX, clientY }) => {
    const next = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, 1 - (clientY / window.innerHeight) * 2);
    pointerVelocity.copy(next).sub(pointer).clampLength(0, 0.36);
    pointer.copy(next);
    pointerEnergy = 1;
  };
  const resize = () => {
    const aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    points.material.uniforms.uAspect.value = aspect;
    ring.material.uniforms.uAspect.value = aspect;
  };
  const animate = () => {
    if (!rendering) return;
    sceneTimeScale = interpolateSceneTempo(sceneTimeScale, isDilated, 0.08);
    const delta = clock.getDelta();
    elapsed += delta * sceneTimeScale;
    signalProgress = Math.min(1, signalProgress + delta / 0.82);
    pointerEnergy *= 0.92;
    pointerVelocity.multiplyScalar(0.88);
    points.material.uniforms.uTime.value = elapsed;
    points.material.uniforms.uPointer.value.copy(pointer);
    points.material.uniforms.uPointerVelocity.value.copy(pointerVelocity);
    points.material.uniforms.uPointerEnergy.value = pointerEnergy;
    points.material.uniforms.uSignalProgress.value = signalProgress;
    points.material.uniforms.uBodies.value.forEach((body, index) => {
      body.lerp(bodyTargets[index], 0.08);
      points.material.uniforms.uBodyStrength.value[index] += (bodyStrengthTargets[index] - points.material.uniforms.uBodyStrength.value[index]) * 0.08;
    });
    ring.material.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    if (rendering) frame = requestAnimationFrame(animate);
  };
  const startRendering = () => {
    if (!active || rendering || document.hidden) return;
    rendering = true;
    clock.start();
    frame = requestAnimationFrame(animate);
  };
  const stopRendering = () => {
    if (!rendering) return;
    rendering = false;
    clock.stop();
    cancelAnimationFrame(frame);
  };
  const handleVisibilityChange = () => {
    if (document.hidden) stopRendering();
    else startRendering();
  };
  const handleContextLost = (event) => {
    event.preventDefault();
    active = false;
    stopRendering();
    onContextLost?.();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost, { once: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  resize();
  startRendering();

  return {
    setBodies(bodies) {
      const bodiesById = new Map(bodies.map((body) => [body.id, body]));
      for (let index = 0; index < BODY_LIMIT; index += 1) {
        const body = bodiesById.get(bodyIds[index]);
        if (body) {
          bodyTargets[index].set(body.x * 0.02 - 1, 1 - body.y * 0.02);
          bodyStrengthTargets[index] = body.strength;
          continue;
        }
        bodyTargets[index].set(2, 2);
        bodyStrengthTargets[index] = 0;
        if (points.material.uniforms.uBodyStrength.value[index] < 0.02) bodyIds[index] = null;
      }
      for (const body of bodies) {
        if (bodyIds.includes(body.id)) continue;
        const index = bodyIds.indexOf(null);
        if (index < 0) break;
        bodyIds[index] = body.id;
        bodyTargets[index].set(body.x * 0.02 - 1, 1 - body.y * 0.02);
        bodyStrengthTargets[index] = body.strength;
      }
    },
    setDilation(dilated) {
      isDilated = Boolean(dilated);
    },
    signalAt(clientX, clientY) {
      signalOrigin.set((clientX / window.innerWidth) * 2 - 1, 1 - (clientY / window.innerHeight) * 2);
      points.material.uniforms.uSignalOrigin.value.copy(signalOrigin);
      signalProgress = 0;
    },
    destroy() {
      active = false;
      stopRendering();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      geometry.dispose();
      points.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      atlas.texture.dispose();
      renderer.dispose();
    },
  };
}
