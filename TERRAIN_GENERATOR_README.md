# 🌍 UO Terrain Generator

A realistic procedural terrain generation system using Ultima Online land tile data exported from UOFiddler.

## 🎯 Features

- **Realistic Biome Transitions**: Grass blends into sand near water, forests transition to grass, etc.
- **Water Bodies**: Automatic lake and river generation with beach transitions
- **UO-Authentic Tiles**: Uses actual UO land tile data from your CSV export
- **Seeded Generation**: Generate the same map multiple times with a seed
- **Export Support**: Export generated maps as JSON for use in your game

## 📋 How to Use

### 1. Export Land Tiles from UOFiddler

1. Open **UOFiddler**
2. Go to **LandTiles** tab
3. Click **"Export To CSV"**
4. Save the file as `LandData.csv` in `assets/tiles/`

### 2. Open the Demo

Open `terrain_generator_demo.html` in your browser (or serve via your local server).

### 3. Generate Terrain

- **Map Width/Height**: Set the size of your terrain (10-200 tiles)
- **Generation Type**: 
  - **Basic Terrain**: Simple biome generation
  - **With Water Bodies**: Includes lakes and rivers with beaches
- **Seed** (optional): Enter a number to generate the same map again
- Click **"Generate Terrain"**

### 4. Export Map

Click **"Export Map Data"** to save the generated terrain as JSON for use in your game.

## 🔧 Using in Your Game

### Basic Usage

```javascript
import { LandTileLoader } from './js/modules/landTileLoader.js';
import { TerrainGenerator } from './js/modules/terrainGenerator.js';

// Load land tile data
const tiles = await LandTileLoader.loadFromURL('./assets/tiles/LandData.csv');

// Create generator
const generator = new TerrainGenerator(tiles);

// Generate a 100x100 map
const map = generator.generateMap(100, 100);

// Access tiles
const tile = map[y][x];
console.log(`Tile at (${x}, ${y}): ${tile.name} (${tile.biome})`);
console.log(`Tile ID: ${tile.id}`);
```

### With Water Bodies

```javascript
// Generate map with lakes and rivers
const map = generator.generateMapWithWater(100, 100, {
    waterChance: 0.15,    // 15% chance for water tiles
    lakeSize: 8,          // Average lake size
    riverCount: 3         // Number of rivers
});
```

### Seeded Generation

```javascript
// Generate the same map every time
const map1 = generator.generateMap(50, 50, 12345);
const map2 = generator.generateMap(50, 50, 12345);
// map1 and map2 will be identical
```

## 🎨 Biome Types

The generator supports these biomes with realistic transitions:

- **🌱 Grass** (40% base chance)
  - Transitions to: sand, dirt, forest, water
  
- **🏖️ Sand** (15% base chance)
  - Transitions to: water (beaches!), grass, dirt
  
- **🟤 Dirt** (20% base chance)
  - Transitions to: grass, furrows (farmland), sand
  
- **💧 Water** (10% base chance)
  - Transitions to: sand (beaches!), grass, dirt
  
- **🌲 Forest** (10% base chance)
  - Transitions to: grass, dirt, jungle
  
- **🌴 Jungle** (3% base chance)
  - Transitions to: forest, grass
  
- **🌾 Furrows** (2% base chance - farmland)
  - Transitions to: dirt, grass

## 📊 Map Data Structure

Generated maps are 2D arrays where each cell contains:

```javascript
{
    id: 0x0003,              // Hex tile ID
    name: "grass",           // Tile name
    biome: "grass",          // Biome type
    tile: { ... }            // Full tile data from CSV
}
```

## 🎮 Integration Example

```javascript
// In your game's map rendering system
function renderTerrain(map, camera) {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const tile = map[y][x];
            const tileSprite = getTileSprite(tile.id);
            
            // Draw tile at world position
            drawTile(tileSprite, x * 44, y * 44);
        }
    }
}
```

## 🔍 Advanced: Custom Biome Rules

You can modify biome transition probabilities in `terrainGenerator.js`:

```javascript
defineBiomes() {
    return {
        grass: {
            weight: 0.4,  // Change base probability
            transitions: {
                'sand': 0.1,   // Change transition chance
                // ... etc
            }
        }
    };
}
```

## 📝 Notes

- **Tile Selection**: The generator randomly selects from all available tiles of each type
- **Neighbor Awareness**: Tiles consider their neighbors for realistic transitions
- **Water Bodies**: Lakes and rivers automatically get sand beaches
- **Performance**: Generation is fast even for large maps (200x200 generates in <100ms)

## 🐛 Troubleshooting

**"Failed to load CSV"**
- Make sure `LandData.csv` is in `assets/sprites/animations/`
- Check that the CSV file is properly formatted (semicolon-separated)

**"No tiles found for biome"**
- Some biomes might not have tiles in your CSV export
- The generator will fallback to grass tiles

**Map looks too random**
- Adjust biome weights in `defineBiomes()`
- Increase transition probabilities for smoother blending

## 🚀 Next Steps

- Integrate into your game's map system
- Add custom biome types (snow, desert, etc.)
- Implement height-based terrain (mountains, valleys)
- Add structures (buildings, roads) on top of terrain

