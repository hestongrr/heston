# Geotech 3D Game — Development Notes

## Project Context

### Existing Showcase Tools (showcase-tools/)
1. **redrock-3d.html** (326 lines) — Three.js terrain model with USGS elevation data,
   subsurface geology cross-section walls (alluvium/caliche/weathered sandstone/bedrock),
   automated pad-finding algorithm. Uses procedural terrain from Base64-encoded height data.
   Style: dark theme (#0b1016), teal accent (#4fd0d8), OrbitControls, PMREM env map.

2. **soilbox.html** (319 lines) — Canvas2D falling-sand physics toy. Cellular automaton
   with Sand/Water/Mud/Stone/Spring materials. Maps each behavior to real geotech physics
   (angle of repose, cohesion, buoyancy, effective stress). Style: dark gradient theme,
   GameApplication schema type.

3. **subdivision-build-sequence.html** (1105 lines) — Three.js 11-phase construction sequence.
   Procedural equipment models (drill rig, dozer, scraper, excavator, compactor, paver, etc.),
   terrain as heightmap grid (97×53, feet), computed earthwork volumes, cutaway section
   showing strata. Style: light/dark theme switcher, earth-tone palette (#0E6C77 accent).

4. **cavity-detection-sim.html** — 2D elastic FD seismic simulator (canvas-based).

### Codebase Patterns
- All interactive 3D uses: `/lib/three.min.js` + `/lib/OrbitControls.js` (r155-ish, no GLTFLoader)
- Everything built with procedural geometry (BoxGeometry, CylinderGeometry, SphereGeometry,
  custom BufferGeometry from heightmaps)
- No external model loading; GLTFLoader not available
- CSS variables for theming, dark backgrounds, monospace fonts for HUD
- `/lib/three.min.js` is 603KB minified, no GLTF support detected
- Three.js loaded from `/lib/` (relative to web root, deployed at thebigpicture.tech)

### 3D Assets (3d-assets/)
- **commercial-safe/ai-generated/**: TRELLIS-generated glTF vehicles:
  - excavator_trellis.glb (2.9MB), bulldozer_trellis.glb (4.7MB),
    dump_truck_trellis.glb (3.9MB), backhoe_trellis.glb (3.3MB)
  - generate_vehicles.py script: "TRELLIS vehicle generation script for geotech game"
- **commercial-safe/cc0-downloads/**: Textures (asphalt, concrete, soil, rock, metal, sand,
  grass), HDRIs, glTF models (Buggy, CesiumMilkTruck, coast rocks, coffee cart)
- **experimental/**: Game extracts (HS2, Paralives) — NOT for commercial use

### Python Environment (geotech_3d/)
- venv with: gempy (3D geological modeling), meshio, pyvista, openseespylinux (structural
  FEA), numpy, pandas, matplotlib, pydantic, cyclopts
- Used for 3D geotech diagrams in pe-diagrams/ (Boussinesq, Rankine, slip surfaces, seepage)

## Game Design: "Grade Commander"

### Core Mechanics
- Top-down 3D perspective of a terrain heightmap grid
- Operate a bulldozer to grade terrain to meet objectives
- Blade physics: cut high soil, push to fill low areas
- Angle of repose: steep slopes avalanche to natural angle
- Real-time cut/fill volume tracking

### Soil Types (mapped to real geotech properties)
- Sand: φ'=34°, angle of repose ~34°, granular, drains fast
- Clay/Mud: c>0, φ'=30°, angle of repose ~45°, cohesive, stands steeper
- Rock: immovable bedrock outcrop

### Objectives
1. Grade a building pad to target elevation (±0.1 ft tolerance)
2. Achieve 2% minimum drainage slope away from pad
3. Balance cut/fill (net volume near zero)
4. Complete within move budget

### Controls
- WASD: move dozer (forward/back/strafe)
- A/D or Arrow keys: rotate dozer
- Space: lower/raise blade
- Q/E: angle blade left/right
- Mouse: orbit camera, scroll to zoom
- P: pause menu

### UI Layout (matching showcase-tools style)
- Dark theme, teal accent (#4fd0d8)
- Top HUD: score, moves, timer
- Side panel: objective status, pad elevation, cut/fill volumes
- Footer: controls hint

---

## Existing Game: grade-it.html

Discovered `grade-it.html` (1217 lines) — the implemented "3D model geotech game":
- **3 progressive jobs**: Grade Pad A, Build Foundations, Subdivision (3 pads)
- **Tools**: Blade/Cut, Haul/Fill, Vibratory Roller, Nuclear Density Gauge Test
- **Terrain**: heightmap grid (24m Jobs 1-2, 40m Job 3), elevations 616-622, pads at EL ~620
- **Style**: dark theme (#0b1016), teal accent (#4fd0d8), procedural vehicle models

## Rock Type System Implementation

Added 8 distinct material types to `grade-it.html`:

### Soil types (3) — movable by dozer
| Type | Color | φ' | Cost | Description |
|------|-------|-----|------|-------------|
| Sand | 0xd6be78 | 34° | 1.0x | Loose, drains fast |
| Clay | 0x7a5c3a | 30° | 1.3x | Cohesive, holds shape |
| Gravel | 0x8b8577 | 40° | 1.1x | Coarse fragment |

### Bedrock types (5) — subsurface, varies by hardness
| Type | Color | Hardness | Cuttable? | Cost | Description |
|------|-------|----------|-----------|------|-------------|
| Granite | 0xb9b9b9 | 999 | No (solid) | 5.0x | Hard intrusive rock |
| Limestone | 0xd4c8a0 | 25 | Yes (slow) | 3.5x | Sedimentary, breakable |
| Sandstone | 0xa87c52 | 10 | Yes (slow) | 2.5x | Weathered, soft |
| Basalt | 0x4a4a4a | 999 | No (solid) | 5.0x | Volcanic, very hard |
| Shale | 0x6b7a8c | 3 | Yes (slow) | 1.5x | Weak, splits easily |

### Implementation details
1. **Type definitions**: SOIL_TYPES, ROCK_TYPES constants with colors, φ', hardness, cost, descriptions
2. **Terrain generation**: `buildHeights()` assigns soil types (fine noise) + bedrock types (zonal patches), ~8% rock outcrops (bedrock near surface at EL 616-622)
3. **Terrain coloring**: `recolor()` colors soil/bedrock by type instead of elevation gradient; bedrock shown when cut to bedrock elevation (h <= bedrockElev + 0.15)
4. **Brush physics**: `applyBrush()` uses SOIL_TYPES cost multiplier; hard bedrock (granite/basalt, hardness >= 999) blocks cutting — "solid rock"; soft bedrock (shale/sandstone/limestone) cuts at 40% speed with type-specific cost
5. **UI legend**: Each rock/soil type has a swatch with CSS class, tooltip showing φ'/friction/cost/hardness, red border + "solid rock" label for impenetrable types
6. **Material HUD**: `#matInfo` overlay shows material under brush (color-coded, "impenetrable" for hard rock)
7. **Job report**: Includes bedrock types found (granite, limestone, sandstone, basalt, shale)
8. **Start overlay**: Rule added about geological variety (granite/basalt can't be cut, shale/sandstone/limestone slow to cut)
9. **Debug**: `__game.info()` includes `rockTypes` field with counts per type

### Syntax check
- `node --check` passes on extracted JS — no syntax errors
- Braces/parens/brackets all balanced (292/292, 1209/1209, 302/302)

## Terrain Rework (fractal noise mountains)

User feedback: original terrain (sum of sine waves, hard-clamped to 616/622) looked
like a flat wavy plain with one mesa blob — "not right for a game."

### Old terrain problems
- Sine-based → smooth artificial swells, visible diagonal striping
- Hard clamp at MAXH=622 created flat-topped mesa plateaus (the "small mountain section")
- 92% of map was uniform low flat

### New terrain (`terH` rewrite)
- **Value noise** `noise2()` with smoothstep interpolation + bilinear blend
- **fBm** `fbm()` multi-octave fractal (amp halves, freq doubles per octave)
- 4 octave bands scaled relative to map size S:
  - `fbm(u*2.2)*5.5` — broad mountain masses (±2.75 m)
  - `abs(fbm(u*3.5))*2.5` — ridged noise → peaks/ridgelines
  - `fbm(u*7)*1.0` — mid detail
  - `fbm(u*18)*0.4` — fine detail
- Base 619.5, clamped 616–622 (rarely hits clamp now)
- Relief ~4–5 m across map, natural mountain/ridge/valley structure

### Per-level terrain seed
- `terrSeed=[0,5,3,1][level]` set in `startLevel` → each job gets a different layout

### Pad bias (gradable starts)
- In `buildHeights()`, cells inside a pad footprint blended toward target:
  `h = p.el + (h-p.el)*0.35` → pads start within ~±0.5 m of target elevation
  (not pre-graded flat, still needs cut/fill work)

### Verification
- JS `terH` output matches Python simulation (min 618.3, max 621.4, mean 619.8, seed 5)
- Pad area (L1, 24m) starts 619.85–620.36 vs target 620.0
- `node --check` passes

### Open feedback (not yet addressed)
- "Can see the land from below better than from above" → camera too steep/top-down, terrain
  relief hard to read. Fix ideas: more oblique camera, hillshade/slope shading in `recolor()`.
- "Why are we making the land so small" → maps are 24m (L1/L2) / 40m (L3). Fix idea: bump to
  60m / 100m (S=60 N=120, S=100 N=200, cell 0.5).
- "Lets try something else for a map" → investigate existing GitHub map-generation projects.

## GitHub map-generation projects (candidates)

Research 2026-08-02. User's setup constraint: vanilla JS + single-file `three.min.js` (r155-ish),
no build step, no npm. Keep everything drop-in via `<script>` tags.

1. **jwagner/simplex-noise** — https://github.com/jwagner/simplex-noise
   - Single-file, MIT, tiny. Natural multi-octave simplex noise.
   - BEST FIT: drop-in `<script>` swap for hand-rolled value noise; no three.js version bump.
   - Older v2.x had UMD `build/simplex-noise.min.js`; newer v4.x is ESM (`dist/simplex-noise.mjs`).

2. **IceCreamYou/THREE.Terrain** — https://github.com/IceCreamYou/THREE.Terrain (MIT, ~870 stars)
   - Full procedural terrain engine FOR Three.js: DiamondSquare, fault lines, perlin/simplex,
     value noise, worley, Brownian motion, blending, heightmap import/export.
   - v3.0.0 (2026-05-26) is ES module and REQUIRES three r160+ — needs lib bump to use.
   - mattes3/THREE.Terrain is the older fork.

3. **redblobgames/mapgen2** (Amit Patel) — https://github.com/redblobgames/mapgen2
   - Polygon/Voronoi island map generator: elevation, rivers, biomes.
   - Heavy, module-based (simplex-noise + delaunator + poisson-disk-sampling + dual-mesh).
   - Good reference for map topology, less for this heightmap game.

4. **yantra-core/Labyrinthos.js** — https://github.com/yantra-core/Labyrinthos.js
   - Procedural mazes/terrain/biomes, TileMap + TileSet, ES modules.
   - More than needed; module-based.

5. **ghomsi/ProceduralTerrains** — https://github.com/ghomsi/ProceduralTerrains
   - React + Vite + Three.js WebGL2, GPU shader terrain (tile/infinite/planet), GLB export.
   - React stack — not compatible with this vanilla game.

6. **MushroomFleet/3D-Procedural-Terrain-V2-JSX** — React + Three.js, simplex multi-octave,
   biomes, structure placement. React stack — not compatible.

7. **kenjinp/hello-terrain** — https://github.com/kenjinp/hello-terrain
   - Realtime WebGPU terrain (R3F), variable LOD, earth-scale. Too heavy / different stack.

### Recommendation
Try **simplex-noise** first (jwagner/simplex-noise) — smallest integration, directly replaces
the value-noise in `terH()` and gives more organic land. Keep custom `fbm()`/`noise2()` as
fallback if the swap is troublesome.

## AI terrain generation projects (candidates)

Research 2026-08-02. Most are Python/PyTorch diffusion/GAN models — NOT drop-in for the vanilla
JS game, but can generate heightmaps offline to bake in (game already uses a heightmap grid).

1. **xandergos/terrain-diffusion** — https://github.com/xandergos/terrain-diffusion (MIT, ~460★)
   - Diffusion models as a *learned replacement for Perlin noise* (SIGGRAPH '26 paper).
   - Infinite, deterministic, seed-consistent, O(1) random access — Perlin-like interface.
   - `InfiniteDiffusion` (training-free lazy diffusion) + hierarchical coarse→detail stack.
   - Ships a Minecraft mod; models on Hugging Face (30m/px playable, 90m/px realistic).
   - Backend: Python/PyTorch + infinite-tensor. Needs GPU for realtime.

2. **PaulBorneP/MESA** — https://github.com/PaulBorneP/MESA (CVPR '25 workshop)
   - Text-prompt → terrain: latent diffusion trained on global Copernicus DEM data.
   - Outputs co-registered optical + depth (DEM) maps. HF models + Gradio demo.
   - `pipe("A sentinel-2 image of montane forests...", ...)` → image + DEM.

3. **ruipreis/terrain-dreamer** — https://github.com/ruipreis/terrain-dreamer
   - Seamless tile-based terrain: ProGAN satellite tiles + pix2pix RGB→DEM + inpainting
     to fill gaps. GAN stack.

4. **Pratham-Dabhane/Terrain-Sim-and-Mission** — https://github.com/Pratham-Dabhane/Terrain-Sim-and-Mission
   - fBm + domain warping + hydraulic/thermal erosion + optional SD+ControlNet texture
     remaster. Also DEM-statistics calibration + A* path planning. Good pipeline reference.

5. **tomicz/one-shot-prompt-world-generation-unity** — https://github.com/tomicz/one-shot-prompt-world-generation-unity
   - One LLM prompt → AI agent builds a full Unity landscape (terrain, water, forest, sky)
     via Unity MCP. Unity-only.

6. **IvanMurzak/Unity-AI-Terrain** — https://github.com/IvanMurzak/Unity-AI-Terrain
   - Natural-language Unity Terrain tooling via MCP. Unity-only.

7. **pkunjam/LLM-Driven-Procedural-Terrain-Generator** — https://github.com/pkunjam/LLM-Driven-Procedural-Terrain-Generator
   - C++/OpenGL Perlin terrain + LLM function-calling to tweak params by text. Native stack.

### Fit assessment for grade-it.html
- Quick browser try: **simplex-noise** (no AI, but fast win)
- Realistic baked heightmap: **terrain-diffusion** or **MESA** (offline, needs PyTorch+GPU),
  then export DEM → JSON/PNG → load as the game's heightmap array

## Simplex-noise integration (DONE)

- Installed `lib/simplex-noise.js` (v2.4.0 UMD, `window.SimplexNoise`, MIT) + `simplex-noise.LICENSE` + `simplex-noise.d.ts`
  (both renamed from the upstream `LICENSE`/`index.d.ts` so it's clear they cover simplex-noise, not all of `lib/`;
  see [`THIRD-PARTY.md`](THIRD-PARTY.md))
- Added `<script src="/lib/simplex-noise.js"></script>` to grade-it.html
- Added `mulberry32` seeded PRNG; `simNoise=new SimplexNoise(mulberry32(terrSeed*12345+1))`
  set in `startLevel` (deterministic per level)
- Replaced value-noise `noise2()`/`fbm()` in `terH()` with simplex `simNoise.noise2D()` fBm
- Retuned amplitudes for simplex (range ±~0.93 vs ±0.5 for value noise):
  `fbm(u*2.2)*3.2` broad, `abs(fbm(u*3.5))*1.5` ridge, `fbm(u*7)*0.7` mid, `fbm(u*18)*0.3` fine
- Kept `hash()` (still used for soil/rock/outcrop assignment + recolor variation)
- Verified: terrain range ~617-621.5 (only ~1% summit clamp at 622), L1 pad starts 619.2-620.7
- `node --check` passes

---

## Geotech 3D worlds — shared improvements must be cross-ported

There are FOUR Three.js worlds in showcase-tools/. Any visual/technique improvement made
to one should be ported to the others (same libs, same procedural approach):

| File | What it is | Has rocks? | Has equipment? |
|------|------------|-----------|----------------|
| grade-it.html | Earthworks/compaction GAME (3 jobs, cut/fill/roller/gauge) | Flat colors only (outcrops recolor to bedrock) | Dozer, roller, gauge |
| rocks-demo.html | NEW flat-world prototype: textbook rock specimens + field crew | YES — 3D boulders + per-type textures + labels | Backhoe, loader, dump truck, drill rig |
| subdivision-build-sequence.html | 11-phase construction video | No (sphere scrub-rocks) | Drill rig, dozer, scraper, excavator, compactor, paver |
| redrock-3d.html | Terrain model + subsurface cross-section walls | No (visual strata walls only) | No |

### Shared patterns (keep consistent across all 4)
- Load `/lib/three.min.js` + `/lib/OrbitControls.js` (r155-ish, NO GLTFLoader) + `/lib/simplex-noise.js`
- All models procedural: Box/Cylinder/Sphere/DodecahedronGeometry, custom BufferGeometry heightmaps
- Dark theme (#0b1016), teal accent (#4fd0d8), serif fonts read "textbook" well
- `mq()` + `mat()` helpers for machine building; `hash()` seeded PRNG for deterministic layout

### Improvements to port when ready
- **Procedural 3D rocks** (dodecahedron boulder, vertex-displaced + `computeVertexNormals`) — see below
- **Per-type canvas textures** (`rockTexture()`) for granite/sandstone/basalt/limestone/shale
- **Textbook specimen labels** (sprite label plates w/ pointer notch + leader line)
- **Machine builders** — backhoe/loader/truck now in rocks-demo.html; drill rig/excavator/scraper/
  compactor in subdivision-build-sequence.html. Ideally one shared builder set ported everywhere.
- **Shale = fissile**: flat-squashed (0.5 Y) rock geometry to read as thin sheets
- Hillshading, oblique camera, bigger maps (already applied to grade-it; see above)

## 3D Rock Specimens — rocks-demo.html (prototype)

Flat-world geology display built to nail the rock look before integrating into the game.

### Procedural rock geometry (`rockGeom(id,seed)`)
- `THREE.DodecahedronGeometry(1,1)` → ~60 faces (one subdivision). **Important:** at detail 0 the
  12 faces + independent random per-vertex displacement looked like SHARDS — keep displacement SMOOTH.
- Displace by low-frequency sinusoids of the vertex's lat/long angles (no per-vertex hash spikes):
  `r = 1 + a·sin(u·2π·f1+seed) + b·sin(v·π·f2+seed·2) + 0.6b·sin(...)` then `x,y,z *= r*s`
- Per-type params (id → {a,b,f1,f2,s}): granite 10 blocky, limestone 11 rounded,
  sandstone 12 rough, basalt 13 roundest/smoother, shale 14 s:0.5 flat fissile slab
- `computeVertexNormals()` + `flatShading:true` → faceted but ROUNDED solid boulder silhouette
- Pooling (game-side): `buildRockPool()` creates ~min(400, V²·3%) meshes, `syncRocks()` assigns
  geometry/material per cell, hides when covered. Free-stack (`rockFree`) avoids GC churn.
- Sparse placement: only 40% of exposed cells get a boulder (via `hash(i*3.7,j*7.3)<0.4`)

### Per-type canvas textures (`rockTexture(id)`) — 128px canvas, CanvasTexture, RepeatWrapping
- **Granite** (0xece4d2 base): 70 random 3-6px squares of gray / pink feldspar / dark mica / white
- **Sandstone** (0xc9a268): 110 tiny grain arcs + 6 faint horizontal bedding bands
- **Basalt** (0x3b3e43): 50 mottled dark-gray blobs
- **Limestone** (0xd8d0c0): 30 soft cream patches (smooth motley)
- **Shale** (0x5d6775): 90 thin horizontal lamination lines
- Material: `roughness:0.95, metalness:0.02, flatShading:true`

### Textbook label plates (`rockLabel(id)`) — sprite, 640x176 canvas
- White index-card plate (#f5f0e4) with pointer notch at bottom center pointing at the rock
- Rock color swatch circle + bold serif name + italic Georgia descriptor
- `depthTest:true`, `anisotropy` max; leader line = thin THREE.Line to the specimen
- Descriptors reuse the game's ROCK_TYPES.desc strings (keep in sync!)

### Field crew (flat world, procedural)
- `buildBackhoe()` — tracks, cab, front loader bucket, rear articulated backhoe arm + bucket
- `buildDumpTruck()` — 4 wheels, cab, dump bed with dirt interior, tilt cylinders
- `buildLoader()` — wheels, cab, front arms + bucket
- `buildDrillRig()` — 6-wheel truck, cab, tank, lattice mast + drill stem + core boxes
- ALL machines: yellow (#e0a62a) + dark track + steel, `g.traverse` sets cast/receiveShadow
- User goal: "truck, backhoe, front-end loader, drill rig. Maybe all of them" → that's the roster
- Note: user asked for a SIMPLE flat world with rocks FIRST, then "build out the prototype" —
  the flat-world rock display may become the game's visual identity

## Pending: integrate 3D rocks into grade-it.html

**UPDATE 2026-08-03 — WIRED IN, but not visually verified yet.**
- Added `buildRockPool()` call in `startLevel()` inside the `!reuseTerrain` block (after target
  grids, before placedGrp clear)
- Added `syncRocks()` at end of `refreshMesh()` (so rocks appear/hide live as you cut/reveal
  and re-cover bedrock)
- Level flow is safe: L1 regenerates (V=121), L2 reuses L1 terrain (same V), L3 regenerates
  (V=201) — pool is rebuilt only on `!reuseTerrain`
- `node --check` PASSES on the extracted main script (53.8KB). Runtime NOT yet confirmed in-browser.
- Remaining (from earlier): "label when we find them" textbook sprite + discovery toast feature.

### How to verify (do this in a real browser next session)
- Open http://localhost:8099/grade-it.html → Start Job 1 → exposed bedrock outcrops should show
  3D boulders (textured, flat-shaded); cutting soil onto an outcrop region reveals them live.
- Watch console for errors; check perf (pool ≤400 meshes + shadows).

### Headless testing notes (what wedges things / what works)
- `google-chrome --headless=new --screenshot=out.png --virtual-time-budget=4000 URL` is the
  reliable one-shot path (used for rocks-demo verification). Works with `--enable-unsafe-swiftshader`
  for software GL; screenshots must be pixel-checked (avg RGB / stddev via PIL) since blank black
  frames mean a page error (e.g. the `zf()` ReferenceError).
- CDP (`--remote-debugging-port` + python websocket) works but the backgrounded chrome process
  wedges the opencode bash tool at 120s even with `setsid`/`disown`/`start_new_session` — do NOT
  launch chrome in the background from the tool; use the one-shot `--screenshot` flag instead.
- The game requires a click on Start Job 1, so a plain `--screenshot` of grade-it shows only the
  start overlay — need either an auto-start hook or an iframe harness to capture in-game visuals.

## GMOD sandbox look (user direction 2026-08-03)

User is intentionally steering the visual style toward **Garry's Mod** (flat sandbox, bright even
lighting, low-poly flat-shaded props). Applied to rocks-demo.html:
- Bright blue gradient sky (CanvasTexture) + light haze fog (0xb9c9d4, 180→1100)
- Brighter hemisphere light (1.05) + soft directional fill; sun intensity 1.35, `shadow.radius=5`
- Sandbox floor: lighter tan (0x6f6854) + THREE.GridHelper(1000, 100) at 0.03, 35% opacity
  (classic gm_construct grid vibe)
- **World enlarged 140 → 1000m** (`WORLD=1000`), camera far 2000, controls.maxDistance 1200
- **Mountain ring** at world edges: 230×230 PlaneGeometry, simplex fBm (6 octaves) ramped by
  distance from center (`t=(d-0.42)/0.58^1.6`), peaks ~120-230 tall, per-vertex colors
  snow→peak→rock→grass→base, flatShading. Sits at y=-0.18 over the ground plane
- GOTCHA: a stray `zf()` in a noise2D call black-screened the whole page (uncaught ReferenceError)
  — always check console; headless screenshot avg-RGB check catches blank renders

## Local AI fleet (Ollama over LAN) — discovered 2026-08-03

User wants the LOCAL AI (not just Claude) building the geotech 3D worlds, using "all my machines we
can." LAN scan (port 11434) found 6 Ollama endpoints on `192.168.12.0/24`:

| Host | Hardware/known | Models | Best role |
|------|----------------|--------|-----------|
| dadbox (.228/.149) | RTX 3060 12GB, 12 cores, 23GB RAM, `dadbox` hostname | qwen2.5-coder:14b (9GB), moondream (1.7GB), nomic-embed-text | code gen + fast render QA |
| .168 | unknown | llama3.2 (2GB) | light text (naming/cleanup) |
| .169 | unknown | llama3.2 (2GB) | light text (naming/cleanup) |
| .197 | unknown | llama3.2, llama3.1 8B (4.9GB), **gemma3** (3.3GB), nomic-embed-text | visual reviewer (gemma3 has vision) + reasoning |
| .205 | unknown | llama3.2, llama3.1 8B, **gemma3**, nomic-embed-text | visual reviewer + reasoning |

- No SSH config on dadbox; known_hosts is hashed (hostnames unreadable). No other auth discovered —
  all endpoints answer `/api/tags` with no key. Treat the LAN as trusted (home network).
- `gemma3` (4B, 3.3GB) is multimodal in Ollama → those two boxes can look at screenshots too.
- 100.114.237.18/32 = Tailscale IP (dadbox). Docker bridges 172.17-24.x exist (ignore).

### Division of labor for the build loop (user picked "Full gen→render→crit")
1. **dadbox**: qwen2.5-coder:14b writes/ports feature code (this codebase is complex vanilla
   Three.js; 14b is competent but weaker than Claude — ALWAYS review its diff before applying).
2. **dadbox**: headless render each world (`--screenshot` one-shot, see headless notes above).
3. **moondream + gemma3 (.197/.205)**: look at the screenshot, flag visual bugs (black screen,
   wrong colors, missing labels, empty sky) → feed back into next gen pass.
- Planned tool: `locai` CLI in showcase-tools/ (gen → render → crit loop). NOT YET BUILT (as of
  this note). Model load costs matter: moondream cold ~50s first call, ~0.4s warm.

## moondream image-captioning — done 2026-08-03 (veracrypt volume)

- Pulled `ollama pull moondream` (1.7GB). Test: `POST /api/generate {"model":"moondream",
  "images":[base64]}`. Cold first inference ~50s (model load), warm ~0.4s/image on the 3060.
- `/media/veracrypt1/images/` (554 files) renamed to `prefix_id_<caption>.ext` (kept orig/crop/nobg
  prefix + original ID, caption appended). Resumable script `/tmp/opencode/organize_images.py`,
  old→new mapping in `/media/veracrypt1/.caption_log.tsv` (on the volume, reversible).
- Quality: **219 good, 335 junk** of 554. Known moondream quirks: "urn" fixation (hallucinates
  urns), "!!!IMAGE NOT GENERATED BY PIXELATE!!!", empty/gibberish for ~30%. For REAL QA use
  gemma3/llava on the remote boxes instead; moondream only for fast pass.
- User chose to accept as-is (did NOT re-run junk with llava). Revert anytime from the TSV log.
- Volume since dismounted (user). `/media/veracrypt1` gone until remounted.

## locai CLI + first fleet build loop — 2026-08-03

Built `/home/heston/showcase-tools/locai` (stdlib Python, executable) to drive the fleet:

- **`locai fleet`** — pings all 6 hosts, lists models. All OK; `gemma3:4b` confirmed on .197/.205.
- **`locai render <world.html>`** — one-shot `google-chrome --headless=new --screenshot` against
  `http://127.0.0.1:8099/<world>` (auto-starts `python3 -m http.server 8099 --directory <wdir>`),
  `--virtual-time-budget=6000 --enable-unsafe-swiftshader`, prints avg-RGB/stddev via PIL.
- **`locai crit <shot.png>`** — sends screenshot to EVERY host's vision model (moondream on dadbox,
  gemma3:4b on .197/.205), asks for a PASS/FAIL + reason. Prints each verdict.
- **`locai gen "<task>" --world <file> [--apply]`** — qwen2.5-coder:14b on dadbox edits the file.
  Prompt includes the full file + project conventions; model must reply with ONLY a unified diff
  (`--- a/.. / +++ b/..`). Parsed to `locai-gen/<id>/patch.diff`, applied via `patch -p1 --fuzz=3`
  with a `.bak` backup. No-diff or failed apply => saved for manual review, file untouched.
- **`locai loop "<task>" --world <file> --max-iters N`** — gen(--apply) -> render -> crit -> if FAIL
  appends the vision feedback to the request and regenerates. Stops on PASS.

Added `?autostart=1` hook to grade-it.html (after `try{init()}catch`, clicks `#startBtn`) so headless
renders capture the game world instead of the start overlay. Terrain builds at load (init ->
startLevel(1)), Start button only hides the overlay — that's why the hook works.

### First run results (grade-it + rocks)
- `locai render grade-it.html?autostart=1` -> 83KB PNG, avg RGB **(14,20,26)** stddev (14,11,11) —
  dark theme, NOT a blank screen (stddev > 0). Autostart works, game renders.
- `locai crit` -> **dadbox/moondream: FAIL "Yes"** (unreliable, ignore); **box197 & box205 gemma3:
  "FAIL - terrain and UI elements present but partially obscured"** (vague but confirms scene loaded).
- Timings: moondream cold ~50s / warm ~3s. **gemma3:4b first call ~224s (model load)**, warm ~2s.
- My own model can't read image attachments — the fleet (gemma3) is the image reviewer, not me.

### Open questions / next
- "Partially obscured" is too vague to drive the loop hard. Improve QA_PROMPT (specific checklist,
  e.g. "is any HUD panel covering >30% of the frame?", "is the terrain mostly in shadow?").
- Rocks in grade-it still not positively confirmed on screen (dark theme + small boulders). Consider
  a closer camera for the QA shot, or a `--noHUD` QA param.
- **Existing tools to evaluate instead of hand-rolling** (user directive: don't reinvent): Aider
  (gen/apply/git loop, supports ollama + vision image input), LiteLLM proxy (route/load-balance
  across all 4 Ollama boxes), Open WebUI (multi-server via OLLAMA_BASE_URLS), Exo (distributed
  inference across the home fleet). Research results appended next session.

## Existing GitHub tools — research 2026-08-03 (don't reinvent)

### Aider — STRONG RECOMMEND for the gen/apply side
- https://github.com/Aider-AI/aider (Apache-2.0, ~42k★). Terminal AI pair programmer, git-native
  (auto-commits each edit, `/undo`, `/diff`). Works with Ollama: `--model ollama_chat/qwen2.5-coder:14b`
  + `OLLAMA_API_BASE=http://127.0.0.1:11434`. **Use `ollama_chat/` prefix, not `ollama/`** (chat
  endpoint gives proper instruction-following).
- GOTCHA: Ollama defaults to a 2048-token context and silently truncates → set `OLLAMA_CONTEXT_LENGTH=16384`
  (or 32768) before `ollama serve`. qwen2.5-coder supports up to 128k.
- Repo map = skeleton of whole repo in context → small local models punch above weight. Architect mode
  (`--architect`) splits plan/editor into two models. `weak-model` for cheap commit messages.
- **Vision**: `/add screenshot.png` works on vision-capable models — feed our headless renders back
  in as visual QA. This is the mature version of my hand-rolled `locai loop`.
- Needs a git repo (showcase-tools is NOT one — would need `git init`).
- Autonomous wrapper: **PerryLink/loop-aider** (11-phase loop w/ safety gates) and the sibling
  **loop-ollama** for Ollama-only. Worth a look before I grow my own loop further.

### LiteLLM proxy — use for "all my machines" as one endpoint
- https://github.com/BerriAI/litellm (pip `litellm[proxy]`). OpenAI-compatible gateway; register the
  SAME model_name against MULTIPLE `api_base` → automatic load balancing across the fleet (simple-shuffle,
  least-busy, latency-based). Also fallback chains, cooldowns, cost tracking.
- Config sketch: two `gemma3:4b` entries (box197, box205) under one name → vision calls round-robin;
  `ollama/qwen2.5-coder:14b` on dadbox. `drop_params: true` strips unsupported fields (Ollama tools etc.).
- This is the proper "use all 4 machines" router instead of my manual HOSTS list.

### Open WebUI
- Multi-server via `OLLAMA_BASE_URLS` (comma-separated). Web chat UI for the fleet; not needed for the
  build loop itself, but handy for talking to the fleet manually.

### Exo — SKIP (not for our hardware)
- https://github.com/exo-explore/exo (~45k★) distributes one big model across machines. BUT: GPU only on
  Apple Silicon (MLX); **Linux runs on CPU**. Our fleet is Linux + NVIDIA → exo would be slow. Keep Ollama
  per-box + LiteLLM router instead.

### Decision
- Short term: keep hand-rolled `locai` (works, tiny), but swap gen to Aider-style prompting if quality
  suffers. Long term: `git init` showcase-tools + Aider for edits + LiteLLM proxy on dadbox for fleet
  routing. Loop is my own thin orchestrator around render+crit regardless.

## locai build loop — RUN 2 findings (big ones)

### qwen2.5-coder:14b context/VRAM cliff (CRITICAL for local gen)
- At num_ctx **16384**: 12GB model + KV cache won't fit VRAM → 14%/86% CPU/GPU spill → **~1 tok/s**.
  A 10-char prompt took 58s; a real gen request timed out at 600-1200s. Use `ollama ps` to see the
  CPU/GPU split — that's the tell.
- At num_ctx **4096**: 100% GPU, 9.5GB, tiny prompt 1.0s, real rock-snippet gen 19s. 
- FIX baked into `locai gen --kw ...` (excerpt mode): send only line-numbered regions around matching
  keywords (pad 15, cap 14k chars) at 4096 ctx. Full-file/diff mode (32768 ctx) is effectively dead
  on this box — never use it.
- **qwen2.5-coder:14b quality verdict**: ignored the "output ONLY code" instruction and wrote a
  prose summary of the existing code instead of the requested feature. It CANNOT author a complex
  multi-part feature (rock labels) reliably. Division of labor that works: **qwen = small snippets /
  second opinion; Claude = integration; gemma3 boxes = visual QA**. Aider adoption recommended for
  real gen (it manages context + repo map so 14b isn't handed a 55KB file).

### grade-it rocks: TWO pre-existing runtime bugs found (never rendered!)
The "rocks wired but NOT runtime-verified" mystery solved — they were crash-on-load:
1. grade-it main script has `"use strict";` (line 208). `rockGeos`/`rockMats` were assigned without
   declaration → `ReferenceError: rockGeos is not defined` → init threw → whole game dead in browser
   (headless black screen; that's why avg-RGB check mattered). FIX: declared in the `let` globals line.
2. `new THREE.Mesh(null, material)` THROWS in three r155's Mesh constructor
   (`updateMorphTargets` reads `geometry.isBufferGeometry`). FIX: pool meshes start with an empty
   `new THREE.BufferGeometry()` placeholder, swapped for the real dodecahedron in syncRocks.
- Verification trick (no CDP needed): `google-chrome --headless=new --dump-dom --virtual-time-budget=6000 URL`
   → grep `#loadTxt`/`#loadErr` (game's own try/catch writes the stack there). Fast, safe, non-wedging.

### Rock discovery feature — built by Claude, QA'd by the fleet
- Added to grade-it: `rockLabel(id)` (640x176 index-card sprite, pointer notch, color swatch, bold
  serif name + italic desc, reused from rocks-demo), `leaderLine()`, `discoverRock(tid,i,j)` →
  toasts "Granite found!" + pins a label above the first boulder of each type. Max 5 labels (one per
  type), `discovered[]` + `rockLabels` group reset in `buildRockPool()` (per job). Label scale 6.4x1.76
  (grade-it maps are 60m/100m, NOT 24m as notes once said — startLevel: `S=n===3?100:60`).
- Wired: `discoverRock()` called in `syncRocks()` exposed-branch. Autostart order note: startLevel's
  discovery toast gets overwritten by the startBtn click toast — cosmetic only, labels persist.

### Fleet QA results after fix (all confirmed)
- `loadTxt: done`, no loadErr. Screenshot went dark (14,20,26 avg / 83KB) → **bright (131,131,120 / 261KB)**.
- gemma3 both boxes: "terrain and equipment visible" (rocks now render!).
- Targeted question ("are there white index-card labels floating above the terrain?"): both gemma3
  boxes = **YES, several, with names like Sandstone, Limestone** — discovery feature VERIFIED visible.
- LESSON: generic PASS/FAIL QA prompt returns vague "UI overlaps significantly" every time. Ask a
  SPECIFIC yes/no question about the thing you changed → precise, actionable answers. Keep a bank of
  task-specific QA questions for the loop.
- moondream (1.8B) still junk for QA ("(1) Yes" every time) — never trust it; rely on gemma3:4b.

## Subdivision build-sequence — rock outcrops cross-ported (2026-08-03)
- **Ported the portable rock system** (ROCK_TYPES, `rockTexture(id)`, `rockGeom(id,seed)`,
  `buildCluster()`, `plate()` label) into subdivision-build-sequence.html. Desert outcrop clusters
  sit beyond the lot lines (present every phase — they're never disturbed); the field-geologist
  index-card plates appear in **phase 0** (Granite + Sandstone, near/center view), and a
  **"Caliche — ripped, proof-rolled"** plate + boulder cluster appears in **phases 2-3** at
  x=100,z=-85 (computed cut lot: lot 6 south = +2.06ft cut).
- **New URL hooks added**: `?phase=N` (jump to phase, set before init) and `?qa=1` (hide header/side
  panel, canvas = full window) — both useful for headless QA renders.
- **Scale lesson**: grade-it's 6.4x1.76 label scale is TOO SMALL for this world. This world is 480x260
  with the camera at ~560 units from origin; 6.4-unit cards projected to ~17px and gemma3 said NO to
  "labels visible". Bumped plate scale to **14.4x3.96** → cards render ~38px wide in the establishing
  shot (visible as cards; text legible only when zoomed in — acceptable for a video).
- **QA pitfalls hit this session**:
  - `pkill -f chrome` SELF-MATCHES the pkill command's own cmdline and kills the shell — use
    `pkill -9 -x chrome` (exact process name) instead.
  - Headless chrome sometimes lingers after `--screenshot`; wrap with `timeout 55 google-chrome ...`
    to guarantee exit (a lingering child holds the shell's stdout pipe and wedges every later command).
  - The page layout is NOT full-bleed: the 3D canvas is an inset rect (window 1600x1000 → canvas
    1140x943 at offset 230,56). Projecting world→screen must use the CANVAS aspect, not the window.
    The `?qa=1` hook fixes this for future renders.
  - Label cream #f5f0e4 is shifted by ACES tone mapping → ~228,230,227 on screen; raw-color blob
    detection fails unless you search for the tone-mapped value.
- Verified by pixel analysis: sandstone plate blob at screen (459,579), granite at (1478,502),
  caliche at (1111,453) — all match the projected positions exactly.
- **Final QA verdicts (gemma3 both boxes)**: 4x-zoomed crops of all three cards = **YES** "white
  index-card label with a colored circle and dark bold text." Full-frame wide shots = NO (cards are
  ~38px accents at this world's establishing camera, ~560 units out — too small for the vision model).
  **User decision (2026-08-03): keep subtle** — cards are natural field-geologist accents, readable on
  zoom, no visual clash with equipment. Cross-port of the rock system to subdivision is DONE.

## External research — realistic 3D land + 3D sand (2026-08-03)
### Realistic 3D terrain on GitHub (don't reinvent)
- **Erosion-simulated terrain** (hydraulic/thermal erosion = the "realistic" part):
  - `taesiri/soilwebgpu` — browser WebGPU erosion, WebGL2 fallback, 1024² ranges carved in seconds,
    exports PNG-16/TIFF/EXR heightmaps + GLB/OBJ meshes. Closest fit to our Three.js stack.
  - `erosiv/soillib` — the classic particle-erosion reference lib (powered the above).
  - `liminalfield/ymir` — node-based terrain gen, native Linux (Rust/wgpu), fBm + thermal/hydraulic/stream.
  - `karsaroth/peakgen` — geology-driven (uplift + thermal-shock resistance), exports glTF 2.0.
  - `CK42BB/procedural-landscapes-threejs` — a Claude Code SKILL for procedural Three.js terrain
    (WebGPU-first, WebGL fallback) — same workflow we already use.
- KEY CAVEAT: "realistic" generation = plausible FANTASY terrain. Real ground comes from DATA (USGS/
  SRTM/DEM) — which redrock-3d.html already does correctly. Generation is for demo/artistic side.
### 3D sand — yes, possible (levels of realism)
- **Real granular physics:** `Zarathos94/mls-mpm-gpu` — Material Point Method, Disney sand model
  (Klár et al. 2016, Drucker-Prager), tens of thousands of particles, browser WebGPU compute.
- **Falling-sand 3D:** `NicksterSand/3D-Falling-Sand` (WebGL + marching cubes), `silvernio/gpu-sand`,
  `DeckardGer/Powder-Sim` (WebGPU cellular automata).
- **Three.js-native:** `markeasting/THREE-XPBD` (position-based dynamics), `baditaflorin/granular-physics-lab`
  (teaching sand/gravel/snow, WASM + Three.js WebGPU/WebGL).
- **OUR constraint:** lib is three.min.js r155 (WebGL, no WebGPU compute) → MPM route won't run as-is.
  Practical 3D sand for geotech visuals = instanced grain particles settling to ~34° angle of repose,
  or static repose cones. Mirrors the physics soilbox.html teaches in 2D.
- **Vegas relevance (user 2026-08-03):** sand is central — alluvial fan deposits, pipe-bedding sand
  (sewer/water in the subdivision world), trench backfill compaction, MSE fill. Natural next beats:
  sand bedding visible in the phase-4 trench cutaway; angle-of-repose spoil piles beside the scraper
  in phase 2.

## 3D sand world (sand-3d.html) — plan + OSHA tie-in (2026-08-03)
- **Goal:** working 3D sand in the browser (three r155, WebGL, NO WebGPU compute). InstancedMesh grain
  particles (sphere/dodecahedron per grain), CPU-settled.
- **Settle algorithm (no physics engine):** column-surface heightmap grid (cell ≈ grain size). Each
  grain falls with gravity; on landing, rolls to the lowest of its 8 neighbors while the drop exceeds
  `CELL*tan(repose)` — this yields piles at the true angle of repose (~30-40°), no solver needed.
- **OSHA tie-in (user asked for OSHA content):** sand angle of repose ≈ 34° = **OSHA Type C soil
  max allowable slope 1.5H:1V** (29 CFR 1926 Subpart P). The world shows the live pile, measures its
  slope, and draws a 1.5H:1V guide line from the peak — pile poking above the line = steeper than
  OSHA allows. Also: >5 ft deep excavation requires shoring/shielding/sloping; >4 ft requires egress
  ladder; competent-person inspection; silica dust (29 CFR 1926.1153) note.
- Reuse the codebase conventions: /lib/three.min.js + /lib/OrbitControls.js, dark theme, monospace HUD.

## 3D sand world (sand-3d.html) — DONE + verified (2026-08-03)
- InstancedMesh grains (DodecahedronGeometry per grain), CPU settle on a column-surface heightmap
  (GN=GRID/CELL cols; grain rolls to lowest 8-neighbor while drop > CELL*tan(repose)). CAP=14000.
- Verified: autostart run → 9359 grains, pile height 5.09 ft, measured slope 35.8° (≈ 34° repose
  setpoint), dynamic OSHA readout fires "SHORING/SLOPE (≥5 ft)". box197 + vegas-linux-farm gemma3
  both PASS "tan sand mound + bright yellow diagonal guide line down its slope".
- OSHA tie-in: yellow 1.5H:1V guide box drawn from pile crest along steepest descent (toneMapped:false
  MeshBasicMaterial, BoxGeometry 0.30 cross-section, quaternion.setFromUnitVectors(+Y→slope), floats
  0.16 above surface). Side panel: Subpart P summary (Type C / 1.5H:1V = 34°, ≥4ft egress ladder,
  ≥5ft protection, 2ft spoil setback, competent person), silica 1926.1153, PPE 1926.95. Live readouts
  map pile height → trench depth. Repose slider 26-42° = loose→dense.
- **LESSONS (headless QA + three r155):**
  - three r155 applies ACES tone mapping to EVERYTHING incl. MeshBasicMaterial → #ffb03a renders as
    ~(204,177,102). For a bright UI accent use `toneMapped:false` (guide line). Detection thresholds
    must match post-tone-map color.
  - headless --virtual-time-budget fires only ~30-70 REAL rAF frames (frame loop is sync/slow), so a
    falling-sand sim never drains → any "when falling==0" logic never triggers. Fix: `?autostart`
    bootstrapPile() pre-settles a repose cone (R=1.3) directly into surf+positions at frame 0, then a
    short visible pour. Deterministic for QA and a better first impression.
  - `let frame` collides with `function frame()` → SyntaxError kills the whole page (canvas black).
  - Syntax check must extract the LAST inline <script> (scripts[-1]); scripts[0] is the gtag block so
    checks silently passed on the wrong file.
  - `.01` `.0x` color/style tokens must not be shared with heavy feature tokens (thickness/verifiability).
- **Fleet changes:** user pointed out extra boxes. locai HOSTS now also lists linuxbox
  (100.113.191.120, gemma3:4b + moondream) and vegas-linux-farm (100.79.121.53, gemma3:4b) — the
  "vegas" box the user sees being used. the-dell (100.83.223.46) currently offline (port 8080 alive,
  no Ollama on 11434). raspberrypi ≈ pihole (100.111.119.83 / 192.168.12.169 = box169, llama3.2 only,
  no vision). linuxbox gemma3 rejected the chat-style payload → locai uses /api/generate + images.
  vegas-linux-farm is effectively a twin of box197/box205 (same model set).





