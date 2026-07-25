# Timer Horizon — Wallpaper Engine

This folder is a self-contained Web wallpaper package. It has no runtime network dependencies: Three.js, the fact catalogue, and background audio are included locally.

## Install locally

1. Open the Wallpaper Engine editor and create/import a **Web** wallpaper from this folder.
2. Use `index.html` as the entry file (the included `project.json` declares it too).
3. Set `preview.png` as the preview if the editor does not pick it up automatically.

The timer begins when Wallpaper Engine loads the wallpaper. Click the central timer to choose an earlier local starting time. Background sound remains off until the sound control is clicked, avoiding unwanted desktop autoplay.

Keep this directory together when copying or publishing it; `index.html` depends on its local `src/`, `vendor/`, and `assets/` directories.
