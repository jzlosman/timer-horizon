import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import { glyphCountForDensity } from './scene-math.mjs';

const glyphCharacters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=×÷<>/\\|[]{}()!?@#$%&*~^:;';

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
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aGlyph;
      attribute float aDepth;
      varying float vGlyph;
      varying float vAlpha;
      varying float vHeat;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uHorizonOffset;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        float rate = 0.018 + hash(aSeed * 3.7) * 0.028;
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
        point.y += uHorizonOffset + sin(uTime * 0.08 + aSeed * 31.0) * 0.026;
        float heat = 1.0 - smoothstep(0.12, 0.54, radius);
        float fadeIn = smoothstep(0.0, 0.08, cycle);
        float fadeOut = 1.0 - smoothstep(0.76, 1.0, cycle);
        vGlyph = aGlyph;
        vAlpha = (0.18 + aDepth * 0.46 + heat * 0.16) * fadeIn * fadeOut * mix(1.0, 0.78, upperStratum);
        vHeat = heat;
        gl_PointSize = (1.8 + aDepth * 4.8 + heat * 1.4 + upperStratum * 1.1) * uPixelRatio;
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

      void main() {
        float column = mod(vGlyph, uColumns);
        float row = floor(vGlyph / uColumns);
        vec2 uv = (vec2(column, row) + gl_PointCoord) / vec2(uColumns, uRows);
        float mark = texture2D(uAtlas, uv).a;
        vec3 cold = vec3(0.68, 0.61, 0.49);
        vec3 hot = vec3(1.0, 0.24, 0.035);
        gl_FragColor = vec4(mix(cold, hot, vHeat), mark * vAlpha);
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
        float turbulence = sin(angle * 8.0 + uTime * 0.38) * 0.005 + sin(angle * 21.0 - uTime * 0.21) * 0.002;
        float rim = 1.0 - smoothstep(0.003, 0.018, abs(radius - 0.205 - turbulence));
        float halo = 1.0 - smoothstep(0.015, 0.072, abs(radius - 0.205 - turbulence));
        float brokenLight = 0.58 + sin(angle * 11.0 + uTime * 0.3) * 0.14 + sin(angle * 29.0 - uTime * 0.12) * 0.08;
        float innerHeat = 1.0 - smoothstep(0.188, 0.255, radius);
        vec3 ember = mix(vec3(0.92, 0.10, 0.015), vec3(1.0, 0.85, 0.56), innerHeat);
        float alpha = rim * brokenLight * 0.92 + halo * 0.08;
        gl_FragColor = vec4(ember, alpha);
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
  const count = glyphCountForDensity(window.innerWidth < 700 ? 1800 : 7200, false);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));
  geometry.setAttribute('aGlyph', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.floor(Math.random() * glyphCharacters.length)), 1));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));

  const points = new THREE.Points(geometry, glyphMaterial(atlas));
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ringMaterial());
  scene.add(points, ring);

  let frame;
  let active = true;
  const clock = new THREE.Clock();
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    ring.material.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  };
  const animate = () => {
    if (!active) return;
    const elapsed = clock.getElapsedTime();
    points.material.uniforms.uTime.value = elapsed;
    ring.material.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  const handleContextLost = (event) => {
    event.preventDefault();
    active = false;
    cancelAnimationFrame(frame);
    onContextLost?.();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost, { once: true });
  window.addEventListener('resize', resize);
  resize();
  animate();

  return {
    destroy() {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
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
