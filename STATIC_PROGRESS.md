# Static Objects Implementation Progress

## ✅ Completed

1. **UOStaticLoader Module** - Created `js/modules/uoStaticLoader.js`
   - Reads `staidx0.mul` (index file)
   - Reads `statics0.mul` (static data)
   - Extracts static objects per block
   - Converts to world coordinates

2. **Integration Started** - Added to `loadRealUOMap()`
   - Loads statics files (if available)
   - Extracts statics for the region
   - Logs static objects found

## 🔄 Next Steps

### Step 1: Copy Static Files
```powershell
Copy-Item "Ultima Online Classic\statics0.mul" "assets\mul\statics0.mul"
Copy-Item "Ultima Online Classic\staidx0.mul" "assets\mul\staidx0.mul"
```

### Step 2: Add Static Rendering to WebGL
- Modify `WebGLTerrainRenderer.render()` to accept statics array
- Render statics after land tiles (so they appear on top)
- Need to load static graphics from `art.mul` or `artLegacyMUL.uop`

### Step 3: Load Static Art Graphics
- Static objects use graphics from `art.mul` (items/statics)
- Different from land tiles (which use `art.mul` land section)
- Need to extract/load static graphics

## Current Status

**Static Loading:** ✅ Working (if files exist)
**Static Rendering:** ❌ Not implemented yet
**Static Graphics:** ❌ Not loaded yet

## 🌲 Tree Prefab Workflow (2025-12-02)

- Added `scripts/extract_tree_prefabs.js` to mine real multi-part trees from `assets/mul/staidx0.mul` + `statics0.mul`.
  - Run with defaults:  
    ```powershell
    node scripts/extract_tree_prefabs.js --width 512 --height 512
    ```
  - Outputs individual JSON prefabs and `tree_prefabs_manifest.json` under `assets/prefabs/trees/`.
- Created `js/modules/prefabLoader.js` so the browser fetches prefab manifests + JSON files at runtime.
- `BiomeStaticPlacer` now understands `prefab` entries (falls back to single `graphic` if prefabs are missing).
- `terrain_generator_demo.html` loads prefabs before `placeStatics()` so procedural statics spawn aligned, multi-part trees.
- Test via **Generate Procedural Terrain** ➜ confirm console logs like  
  `Generated N statics` and `prefab` names, then visually inspect trees for aligned canopies.
- **Environmental constraints (2025-12-03):** Tree placement now skips pure water/ocean tiles entirely and only allows a deterministic ~1% of road/bridge tiles to receive a tree, matching classic map etiquette (no more forests covering highways or docks).
- **Surface classifier (2025-12-03):** Added `landSurfaceClassifier` which tags every land tile with a surface class via LandData.csv metadata. `BiomeStaticPlacer` and the hybrid overlay now respect these tags so trees only spawn on grass/forest/jungle/dirt/sand/swamp surfaces.

## Test It

1. Copy statics files to `assets/mul/`
2. Load a map - console will show how many statics found
3. Next: Add rendering support








