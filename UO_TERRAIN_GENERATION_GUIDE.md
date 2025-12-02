# Ultima Online Terrain Generation System - Complete Guide

## Overview

This project recreates the terrain generation system from Ultima Online (UO), a classic MMORPG from 1997. The goal is to generate realistic, seamless terrain maps using UO's original tile assets while achieving natural-looking transitions between different biomes (grass, sand, water, etc.).

---

## Core Concepts

### 1. Isometric Tile System

UO uses **isometric diamond-shaped tiles** (44x44 pixels) that create a pseudo-3D effect when rendered correctly:

```
     /\
    /  \
   /    \
  /      \
  \      /
   \    /
    \  /
     \/
```

**Key rendering rules:**
- Tiles are drawn back-to-front (painter's algorithm)
- Each tile overlaps its neighbors - the diamond shape has transparent corners
- Position formula: `isoX = centerX + (x - y) * (tileWidth / 2)`, `isoY = startY + (x + y) * (tileHeight / 4)`
- Black pixels (RGB 0,0,0) in tile images must be made transparent

### 2. Tile Categories

UO tiles are organized into categories based on their visual appearance:

| Category | Description | Example IDs |
|----------|-------------|-------------|
| **Pure Grass** | Solid grass tiles | 0x0003, 0x0004, 0x0005, 0x0006 |
| **Pure Sand** | Solid sand tiles | 0x0016, 0x0017, 0x0018, 0x0019 |
| **Water** | Water tiles | 0x00A8 - 0x00AB |
| **Sand Transitions** | Sand-to-grass blends | 0x0033 - 0x003E |
| **Grass Transitions** | Grass near sand (better blending) | 0x01A5 - 0x01AB |
| **Feathered Grass** | Grass with subtle sand hints | 0x0375, 0x037E, 0x0684, 0x012A, 0x012C |
| **Smooth Curves** | Natural curved transitions | 0x03B7 - 0x03C8 |

### 3. Transition Tile System (Critical!)

This is the most complex part. UO uses specific tiles to create smooth transitions between biomes. For sand-to-grass transitions:

#### Inner Corner Tiles (0x0033-0x0036)
- **Mostly grass** with a small sand corner
- Used where grass surrounds a sand corner (sand peninsula tips)
- Each tile has sand in a specific corner:
  - `0x0033` = Sand in SE (bottom-right) corner
  - `0x0034` = Sand in SW (bottom-left) corner
  - `0x0035` = Sand in NW (top-left) corner
  - `0x0036` = Sand in NE (top-right) corner

#### Edge Tiles (0x0037-0x003A)
- **Half sand, half grass** - split down the middle
- Used along straight boundaries between biomes:
  - `0x0037` = Sand on South (bottom) half
  - `0x0038` = Sand on West (left) half
  - `0x0039` = Sand on North (top) half
  - `0x003A` = Sand on East (right) half

#### Outer Corner Tiles (0x003B-0x003E)
- **Mostly sand** with a small grass corner
- Used where sand surrounds a grass corner:
  - `0x003B` = Grass in SE (bottom-right) corner
  - `0x003C` = Grass in SW (bottom-left) corner
  - `0x003D` = Grass in NW (top-left) corner
  - `0x003E` = Grass in NE (top-right) corner

---

## Transition System (Current Implementation)

### Three-Pass Approach
The system applies transitions in three passes:
1. **First pass**: Set all pure biome tiles (grass, sand, water)
2. **Second pass**: Apply sand transitions (sand cells next to grass get edge/corner tiles)
3. **Third pass**: Apply grass transitions (grass cells next to sand get special blending tiles)

### How It Works

```javascript
// Pass 1: Set pure tiles with variety
for each cell:
    if grass:
        60% → basic grass (0x0003-0x0006)
        25% → foliage grass (0x00C0-0x00C3)
        15% → varied grass (0x007D-0x007F)
    if sand  → randomChoice(['0x0016', '0x0017', '0x0018', '0x0019'])
    if water → randomChoice(['0x00A8', '0x00A9', '0x00AA', '0x00AB'])

// Pass 2: Sand cells next to grass get transition tiles
for each sand cell with grass neighbor:
    neighbors = getNeighbors(map, x, y)  // Returns { n, ne, e, se, s, sw, w, nw }
    tile = getSandTransitionTile(neighbors)

// Pass 3: Grass cells next to sand get blending tiles
for each grass cell with sand neighbor:
    if only diagonal sand → use feathered grass (0x0375, etc.)
    if cardinal sand → use grass transition tiles (0x01A5-0x01AB)
```

### Sand Transition Tile Selection (8-Neighbor Context)

```javascript
function getSandTransitionTile(neighbors) {
    const cardinalGrassCount = count grass in N, E, S, W
    
    // CASE 1: No grass neighbors - pure sand
    if (no grass anywhere) return PURE_SAND;
    
    // CASE 2: 3+ cardinal grass neighbors - inner corner (peninsula tip)
    if (cardinalGrassCount >= 3) {
        if (grass N, E, S but not W) return innerSW; // 0x0034
        if (grass E, S, W but not N) return innerNW; // 0x0035
        // ... etc
    }
    
    // CASE 3: 2 adjacent cardinal grass neighbors - outer corner
    if (cardinalGrassCount === 2) {
        if (grass N and E) return cornerNE; // 0x003E
        if (grass E and S) return cornerSE; // 0x003B
        // ... etc
    }
    
    // CASE 4: 1 cardinal grass neighbor - edge tile
    if (cardinalGrassCount === 1) {
        if (grass N) return edgeN; // 0x0039
        if (grass E) return edgeE; // 0x003A
        // ... etc
    }
    
    // CASE 5: Only diagonal grass neighbors - outer corners
    if (cardinalGrassCount === 0) {
        if (grass NE) return cornerNE; // 0x003E
        // ... etc
    }
}
```

### Grass Transition Tile Selection

```javascript
function getGrassTransitionTile(neighbors) {
    const cardinalSandCount = count sand in N, E, S, W
    const diagonalSandCount = count sand in NE, SE, SW, NW
    
    // Only diagonal sand - use feathered grass (subtle hints)
    if (cardinalSandCount === 0 && diagonalSandCount > 0) {
        return randomChoice(['0x0375', '0x037E', '0x0684', '0x012A', '0x012C']);
    }
    
    // Cardinal sand - use grass transition tiles (better blending)
    if (cardinalSandCount > 0 || diagonalSandCount > 0) {
        return randomChoice(['0x01A5', '0x01A6', '0x01A7', '0x01A8', 
                            '0x01A9', '0x01AA', '0x01AB']);
    }
    
    // No sand nearby - pure grass
    return randomChoice(['0x0003', '0x0004', '0x0005', '0x0006']);
}
```

### Tile Definitions

```javascript
// SAND TILES
const SAND_TILES = {
    pure: ['0x0016', '0x0017', '0x0018', '0x0019'],
    
    // Edge tiles - grass on one side
    edgeN: '0x0039', edgeE: '0x003A', edgeS: '0x0037', edgeW: '0x0038',
    
    // Outer corners - mostly sand with grass corner
    cornerNE: '0x003E', cornerSE: '0x003B', cornerSW: '0x003C', cornerNW: '0x003D',
    
    // Inner corners - mostly grass with sand corner (peninsula tips)
    innerNE: '0x0036', innerSE: '0x0033', innerSW: '0x0034', innerNW: '0x0035',
};

// GRASS TILES - Multiple sets for variety
const GRASS_TILES = {
    pure: ['0x0003', '0x0004', '0x0005', '0x0006'],        // Basic green
    withFoliage: ['0x00C0', '0x00C1', '0x00C2', '0x00C3'], // With plants
    varied: ['0x007D', '0x007E', '0x007F'],                // Other variations
};

// GRASS TRANSITION TILES - grass that blends better at sand boundaries
const GRASS_TRANSITION_TILES = {
    nearSand: ['0x01A5', '0x01A6', '0x01A7', '0x01A8', '0x01A9', '0x01AA', '0x01AB'],
};

// FEATHERED GRASS TILES - grass with subtle sand hints for layered effects
const FEATHERED_GRASS_TILES = {
    subtle: ['0x0375', '0x037E', '0x0684', '0x012A', '0x012C'],
};

// SMOOTH CURVE TILES - for natural curved transitions (optional enhancement)
const SMOOTH_CURVE_TILES = {
    curves: ['0x03B7', '0x03B8', '0x03B9', '0x03BA', '0x03BB', '0x03BC',
             '0x03BD', '0x03BE', '0x03BF', '0x03C0', '0x03C1', '0x03C2',
             '0x03C3', '0x03C4', '0x03C5', '0x03C6', '0x03C7', '0x03C8'],
};
```

---

## How to Test

### Quick Test (Recommended)
1. Start the server: `python -m http.server 8000`
2. Open: `http://localhost:8000/terrain_generator_demo.html`
3. Click **"🧪 Test Sand+Water"** button
4. Look for:
   - ✅ Smooth edges (no jagged staircases)
   - ✅ Correct corner tiles at direction changes
   - ✅ Inner corners on sand peninsulas
   - ✅ Pure grass/sand in biome centers

### Full Terrain Test
1. Click **"✨ Generate V2 (Proper Tiles)"**
2. Check transitions at all biome boundaries
3. Use **"🔢 Show Tile IDs"** checkbox to see which tiles are placed

### Paint Mode (Manual Correction)
1. Click **"🖌️ Paint Mode"**
2. Select a tile from the palette
3. Click on the map to place tiles
4. Use this to identify incorrect transitions

### Console Debugging
Open browser DevTools (F12) and check console for:
```
Found 48 sand boundary cells
Traced 2 boundary paths
Applied 48 transition tiles using boundary tracing
```

### Visual Checklist

| What to Check | Good | Bad |
|---------------|------|-----|
| Diagonal boundaries | Smooth curve | Staircase pattern |
| Corners | Single corner tile | Multiple misaligned tiles |
| Straight edges | Consistent edge tiles | Random tiles |
| Peninsula tips | Inner corner tiles | Wrong corner type |
| Biome centers | Pure tiles with variation | Transition tiles in middle |

---

## Key Files in Project

| File | Purpose |
|------|---------|
| `terrain_generator_demo.html` | Main terrain generator with paint mode |
| `js/data/transitionTiles8bit.js` | **Boundary tracing logic and tile mappings** |
| `js/modules/terrainGeneratorV2.js` | Biome generation with Simplex noise |
| `js/data/uoTileSetsClean.js` | Pure biome tile sets (tessellation) |
| `tile_catalog.html` | Visual reference of all 16,384 tiles |
| `tile_placement_test.html` | Interactive tile placement testing |
| `curve_tester_simple.html` | Training UI for curve approval |
| `assets/tiles/*.bmp` | Actual UO tile images |
| `assets/tiles/LandData.csv` | UO tile metadata (names, flags) |

---

## Data Structures

### Map Cell
```javascript
map[y][x] = {
    id: "0x0003",        // Tile ID (hex string)
    biome: "grass",      // Biome type: grass, sand, water, forest, jungle
    elevation: 0.5,      // 0-1 normalized (for noise generation)
    moisture: 0.5,       // 0-1 normalized (for noise generation)
    setIndex: 0,         // Which tile set variation
    isTransition: false  // True if this is a boundary transition tile
};
```

### Neighbor Object
```javascript
neighbors = {
    n:  'grass',  // North (y-1)
    ne: 'grass',  // Northeast (x+1, y-1)
    e:  'sand',   // East (x+1)
    se: 'sand',   // Southeast (x+1, y+1)
    s:  'sand',   // South (y+1)
    sw: 'sand',   // Southwest (x-1, y+1)
    w:  'grass',  // West (x-1)
    nw: 'grass',  // Northwest (x-1, y-1)
};
```

---

## Common Mistakes to Avoid

1. **Using random tiles** - Each transition tile has a specific direction. 0x0033 ≠ 0x0034!

2. **Only checking 4 neighbors** - Must check all 8 (including diagonals) for proper corner detection

3. **Wrong tile category** - Inner corners (mostly grass) vs outer corners (mostly sand) are opposites

4. **Not processing transparency** - Black corners must be made transparent or tiles won't overlap correctly

5. **Mixing transition types** - Sand-to-grass tiles can't be used for sand-to-water transitions

6. **Ignoring case hierarchy** - Must check 3+ grass neighbors before 2, before 1, before 0

---

## Current Status

- ✅ Basic transition tiles working (edges, corners)
- ✅ 8-neighbor boundary tracing system
- ✅ Inner corner detection (sand peninsula tips)
- ✅ Paint mode for manual correction
- ✅ Tile catalog (16,384 tiles)
- ✅ Training UI built
- 🔄 Smooth curve tiles (optional enhancement)
- ⏳ Water-to-sand transitions
- ⏳ Cliff/elevation system (requires Statics)

---

## How to Help (For Other AIs)

If you're another AI helping with this project:

1. **Understand the tile system** - Each tile ID has a specific visual appearance and directional meaning

2. **Use the boundary tracing approach** - Don't use per-tile lookup tables, use the 8-neighbor context system

3. **Test visually** - Generate terrain and check for staircases or misaligned transitions

4. **Preserve the case hierarchy** - 3+ grass → 2 adjacent grass → 1 grass → diagonal only

5. **Check the console** - Debug output shows boundary cell counts and path tracing

6. **Ask for clarification** - If a transition looks wrong, ask which tile should be used instead

---

## Testing Commands

```bash
# Start the server
cd C:\Users\micha\Projects\utlima-onmind
python -m http.server 8000

# Open in browser
# http://localhost:8000/terrain_generator_demo.html

# Quick tests:
# - Click "Test Sand+Water" for diamond pattern test
# - Click "Generate V2" for full terrain
# - Enable "Show Tile IDs" to see hex codes
# - Use "Paint Mode" to manually correct tiles
```

---

## Tile Reference Quick Guide

```
SAND-TO-GRASS TRANSITIONS (placed on SAND cells):

EDGES (grass on one side):
┌─────────┬─────────┬─────────┬─────────┐
│ 0x0039  │ 0x003A  │ 0x0037  │ 0x0038  │
│ Grass N │ Grass E │ Grass S │ Grass W │
└─────────┴─────────┴─────────┴─────────┘

OUTER CORNERS (grass in one corner):
┌─────────┬─────────┬─────────┬─────────┐
│ 0x003E  │ 0x003B  │ 0x003C  │ 0x003D  │
│ Grass   │ Grass   │ Grass   │ Grass   │
│ NE      │ SE      │ SW      │ NW      │
└─────────┴─────────┴─────────┴─────────┘

INNER CORNERS (sand peninsula tips - grass on 3 sides):
┌─────────┬─────────┬─────────┬─────────┐
│ 0x0036  │ 0x0033  │ 0x0034  │ 0x0035  │
│ Sand    │ Sand    │ Sand    │ Sand    │
│ NE tip  │ SE tip  │ SW tip  │ NW tip  │
└─────────┴─────────┴─────────┴─────────┘

PURE TILES:
- Grass: 0x0003, 0x0004, 0x0005, 0x0006
- Sand:  0x0016, 0x0017, 0x0018, 0x0019
- Water: 0x00A8, 0x00A9, 0x00AA, 0x00AB
```
