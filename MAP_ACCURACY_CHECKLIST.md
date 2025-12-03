# Map Accuracy Checklist - What We Need to Accurately Mirror UO Classic Maps

## ✅ Currently Implemented

1. **Land Tiles** - Reading tile IDs from `map0.mul`
2. **Z-Height** - Reading and rendering Z-heights correctly
3. **3D Height Rendering** - WebGL stretched tiles (like ClassicUO)
4. **Embankment Detection** - Detecting and preserving embankment tiles at water edges
5. **Biome Detection** - Basic biome detection from tile IDs

## ❌ Missing for Full Accuracy

### 1. **Static Objects** (HIGH PRIORITY)
**Files Needed:**
- `statics0.mul` - Static object data (trees, rocks, buildings, etc.)
- `staidx0.mul` - Static object index file

**What We're Missing:**
- Trees (oak, pine, etc.)
- Rocks and boulders
- Buildings and structures
- Decorative objects (signs, benches, etc.)
- Items placed on the ground

**Structure:**
- `StaidxBlock`: 12 bytes per block (Position: uint32, Size: uint32, Unknown: uint32)
- `StaticsBlock`: 7 bytes per static (Graphic: ushort, X: byte, Y: byte, Z: sbyte, Hue: ushort)
- Note: In ClassicUO, `Color` field is actually the Graphic/ItemID!

**Impact:** Without statics, maps look empty - no trees, no buildings, no environmental objects.

---

### 2. **Tile Variants** (MEDIUM PRIORITY)
**What We're Missing:**
- UO uses multiple variants of the same tile type for visual variety
- Example: Grass tiles 0x0003-0x0015 are all "grass" but look different
- We should randomly select from variants instead of always using the same tile

**Impact:** Maps look repetitive without tile variants.

---

### 3. **Transition Tiles Between Biomes** (MEDIUM PRIORITY)
**What We're Missing:**
- Transition tiles between grass/dirt/sand/rock (not just water edges)
- UO uses specific transition tiles for smooth biome blending
- We have some transition logic but it's not applied to real maps

**Impact:** Sharp, blocky transitions between different terrain types.

---

### 4. **Proper Biome Detection** (LOW PRIORITY)
**What We're Missing:**
- More accurate biome detection using `tiledata.mul`
- Tile flags (impassable, wet, etc.)
- Better categorization of tile types

**Impact:** Some tiles might be misclassified.

---

### 5. **Seasonal Variations** (LOW PRIORITY)
**What We're Missing:**
- UO changes tile graphics based on season
- Winter: Snow on grass
- Spring/Summer/Fall: Different grass colors
- This is handled by ClassicUO's SeasonManager

**Impact:** Maps always look the same regardless of season.

---

### 6. **Map Differences (Dif Files)** (LOW PRIORITY)
**Files Needed:**
- `mapdif0.mul` / `mapdifl0.mul` - Map differences
- `stadif0.mul` / `stadifl0.mul` / `stadifi0.mul` - Static differences

**What We're Missing:**
- Custom map modifications
- Player-built structures
- Server-specific changes

**Impact:** Custom modifications won't show up.

---

## Priority Order for Implementation

1. **STATICS** - Most important! Without trees/buildings, maps look empty
2. **Tile Variants** - Easy to add, big visual impact
3. **Transition Tiles** - Improves terrain blending
4. **Better Biome Detection** - Nice to have
5. **Seasonal Variations** - Nice to have
6. **Dif Files** - Only if needed for custom maps

---

## Next Steps

1. **Convert statics files** - Need to convert `statics0LegacyMUL.uop` → `statics0.mul` (similar to map conversion)
2. **Create StaticLoader** - Similar to UOMapLoader, but for statics
3. **Render statics** - Add static objects to WebGL renderer (render after land tiles)
4. **Load static art** - Need to load static graphics from `art.mul` or `artLegacyMUL.uop`

---

## File Structure Reference

### StaidxBlock (12 bytes)
```
Offset  Size  Type    Description
0       4     uint32  Position (offset in statics0.mul)
4       4     uint32  Size (total bytes for this block)
8       4     uint32  Unknown
```

### StaticsBlock (7 bytes)
```
Offset  Size  Type    Description
0       2     ushort  Graphic (ItemID) - NOTE: Called "Color" in ClassicUO!
2       1     byte    X (0-7, position within block)
3       1     byte    Y (0-7, position within block)
4       1     sbyte   Z (height offset)
5       2     ushort  Hue (color hue, 0 = default)
```

### Block Organization
- Each map block is 8×8 tiles
- Each block can have 0-1024 static objects
- Statics are stored per-block in `statics0.mul`
- Index file `staidx0.mul` tells us where each block's statics are









