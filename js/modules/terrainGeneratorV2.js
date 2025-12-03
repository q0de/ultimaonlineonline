/**
 * Terrain Generator V2 - Proper UO Tile Tessellation
 * 
 * KEY INSIGHT: UO tiles come in GROUPS OF 4 that tessellate together.
 * You must use ALL 4 tiles from the same group for a region - they're designed
 * to fit together like puzzle pieces.
 * 
 * This generator:
 * 1. Uses noise to determine biome regions
 * 2. Picks ONE tile set per region (group of 4 tiles)
 * 3. Uses all 4 tiles from that set within the region
 * 4. Handles transitions at biome boundaries
 */

import { UO_TILE_SETS, getTileFromSet } from '../data/uoTileSets.js';
import { 
    UO_TILE_SETS_CLEAN, 
    getCleanTileAtPosition,
    getContextualTile,
    getGrassFoliageTile,
    getDarkForestTile,
    getMountainRockTile,
    BIOME_VARIANT_WEIGHTS
} from '../data/uoTileSetsClean.js';
import { 
    SAND_TO_GRASS_TRANSITIONS,
    GRASS_TO_SAND_TRANSITIONS, 
    calculateTransitionBitmask, 
    getTransitionTile 
} from '../data/transitionTiles.js';
// Note: If you're not seeing updated tile mappings, try hard refresh (Ctrl+Shift+R)
import { 
    apply8BitTransitions,
    generateCornerBiomesFromNoise,
    getGrassToSandTransition,
    calculate8BitBitmask
} from '../data/transitionTiles8bit.js?v=20251130c';
import { determineSurfaceClass, normalizeTileId } from '../data/landSurfaceClassifier.js';

// Simplex Noise for coherent terrain
class SimplexNoise {
    constructor(seed = Math.random() * 10000) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            const j = s % (i + 1);
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
        
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        
        this.F2 = 0.5 * (Math.sqrt(3) - 1);
        this.G2 = (3 - Math.sqrt(3)) / 6;
    }
    
    dot2(g, x, y) {
        return g[0] * x + g[1] * y;
    }
    
    noise2D(x, y) {
        const { F2, G2, perm, permMod12, grad3 } = this;
        
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        
        let n0 = 0, n1 = 0, n2 = 0;
        
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            t0 *= t0;
            n0 = t0 * t0 * this.dot2(grad3[permMod12[ii + perm[jj]]], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            t1 *= t1;
            n1 = t1 * t1 * this.dot2(grad3[permMod12[ii + i1 + perm[jj + j1]]], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            t2 *= t2;
            n2 = t2 * t2 * this.dot2(grad3[permMod12[ii + 1 + perm[jj + 1]]], x2, y2);
        }
        
        return 70 * (n0 + n1 + n2);
    }
}

export class TerrainGeneratorV2 {
    constructor(seed = Date.now(), allTransitionMappings = null, options = {}) {
        this.seed = seed;
        this.noise = new SimplexNoise(seed);
        this.tileSetNoise = new SimplexNoise(seed + 1000); // For tile set variation
        // ALL transition mappings from Tile Teacher (grass_sand, grass_dirt, jungle_sand, etc.)
        this.allTransitionMappings = allTransitionMappings;

        // Store generator options (allows overrides from UI/tests)
        this.options = options || {};

        // Procedural regioning is effectively enabled when we have explicit transition mappings
        // or when the caller opts in via options.
        const hasMappings = allTransitionMappings && typeof allTransitionMappings === 'object'
            ? Object.keys(allTransitionMappings).length > 0
            : false;
        this.proceduralRegioningEnabled = this.options.enableProceduralRegioning ?? hasMappings;

        // Fallback embankment chance is lower when we have no procedural region data,
        // which keeps coastlines from being overrun with cliffs in simplified mode.
        const fallbackChance = this.proceduralRegioningEnabled ? 0.7 : 0.35;
        const optionChance = typeof this.options.embankmentChance === 'number'
            ? this.options.embankmentChance
            : null;
        this.embankmentChance = optionChance != null
            ? Math.min(1, Math.max(0, optionChance))
            : fallbackChance;
    }
    
    /**
     * Get biome based on elevation and moisture
     * 
     * Sand Logic: Sand appears PRIMARILY near water (beaches).
     * - Primary: Narrow band just above water level (elevation 0.35-0.39)
     * - Secondary: RARE desert patches in very dry, low areas (10% chance)
     */
    getBiome(elevation, moisture, x = 0, y = 0) {
        // Water
        if (elevation < 0.35) return 'water';
        
        // Beach/Sand zone - MORE LIKELY near water but not guaranteed
        // This creates varied coastlines: beaches, cliffs, rocky shores, jungle coasts
        const coastZone = elevation < 0.42; // Near water
        if (coastZone) {
            // Use position-based pseudo-random to decide if this coast tile is sandy
            // ~60% chance of sand near water (was 100% before)
            const beachNoise = ((x * 13 + y * 7) % 100) / 100;
            
            // Higher chance of sand in dry areas, lower in wet areas (jungle coasts)
            const sandChance = 0.5 + (1 - moisture) * 0.3; // 50-80% based on moisture
            
            if (beachNoise < sandChance) {
                return 'sand';
            }
            // Otherwise, continue to determine other biome (grass, jungle, etc. at coast)
        }
        
        // RARE desert patches - only in VERY dry, low areas
        // 10% chance in specific conditions
        if (elevation < 0.50 && moisture < 0.20) {
            const desertChance = ((x * 17 + y * 23) % 100) / 100;
            if (desertChance < 0.12) return 'sand';
        }
        
        // Low elevation
        if (elevation < 0.55) {
            if (moisture > 0.6) return 'jungle';
            if (moisture > 0.4) return 'forest';
            return 'grass';
        }
        
        // Medium elevation
        if (elevation < 0.70) {
            if (moisture > 0.5) return 'forest';
            if (moisture < 0.3) return 'dirt';
            return 'grass';
        }
        
        // High elevation
        if (elevation < 0.85) {
            return 'rock';
        }
        
        // Very high = snow/rock
        return 'rock';
    }
    
    /**
     * Pick a tile from the CLEAN tile set using position-based indexing
     * Uses only pure center tiles - no edges or transitions
     * 
     * ENHANCED: Now uses contextual tile selection for more natural variety
     */
    getTileFromSetAtPosition(biome, x, y, setIndex = 0, context = null) {
        // If context is provided, use contextual tile selection for authentic look
        if (context) {
            return getContextualTile(biome, x, y, context);
        }
        
        // Default: use clean tile sets with variant support for variety
        return getCleanTileAtPosition(biome, x, y, true);
    }
    
    /**
     * Determine which tile set to use for a region
     * Uses noise to create coherent regions that use the same tile set
     */
    getTileSetIndex(biome, x, y) {
        const sets = UO_TILE_SETS[biome];
        if (!sets || sets.length <= 1) return 0;
        
        // Use noise at a larger scale to create coherent regions
        const scale = 0.05; // Larger regions
        const noiseVal = (this.tileSetNoise.noise2D(x * scale, y * scale) + 1) / 2;
        
        return Math.floor(noiseVal * sets.length) % sets.length;
    }
    
    /**
     * Generate a map using proper UO tile tessellation
     * 
     * ENHANCED: Now uses contextual tile selection for more authentic UO Classic look:
     * - Grass near forests gets foliage tiles
     * - Forest interiors get darker tiles
     * - High elevation rock gets mountain textures
     * - Dirt near water gets wet variants
     */
    generateMap(width, height) {
        const map = [];
        
        // First pass: determine biomes, elevation, moisture
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                // Use multiple octaves of noise for natural terrain
                const scale1 = 0.02;
                const scale2 = 0.05;
                const scale3 = 0.1;
                
                const e1 = this.noise.noise2D(x * scale1, y * scale1);
                const e2 = this.noise.noise2D(x * scale2 + 100, y * scale2 + 100) * 0.5;
                const e3 = this.noise.noise2D(x * scale3 + 200, y * scale3 + 200) * 0.25;
                
                const elevation = (e1 + e2 + e3 + 1.75) / 3.5; // Normalize to 0-1
                
                // Moisture uses different noise offset
                const m1 = this.noise.noise2D(x * scale1 + 500, y * scale1 + 500);
                const m2 = this.noise.noise2D(x * scale2 + 600, y * scale2 + 600) * 0.5;
                const moisture = (m1 + m2 + 1.5) / 3; // Normalize to 0-1
                
                const biome = this.getBiome(elevation, moisture, x, y);
                
                // Store preliminary data (tiles assigned in second pass with context)
                map[y][x] = {
                    id: null,  // Assigned later with context
                    biome: biome,
                    elevation: elevation,
                    moisture: moisture,
                    z: 0,
                    surfaceClass: determineSurfaceClass({ biome })
                };
            }
        }
        
        // Second pass: Assign tiles with contextual awareness
        // This creates more natural variety based on neighboring biomes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                const biome = tile.biome;
                
                // Determine context from neighbors
                const context = this.getTerrainContext(map, x, y, width, height);
                
                // Get tile set for this region
                const setIndex = this.getTileSetIndex(biome, x, y);
                
                // Get specific tile from the set based on position and context
                tile.id = this.getTileFromSetAtPosition(biome, x, y, setIndex, context);
                tile.setIndex = setIndex;
                const numericTileId = normalizeTileId(tile.id);
                tile.surfaceClass = determineSurfaceClass({ tileId: numericTileId, biome });
            }
        }
        
        // Third pass: Calculate Z-heights with smoothing
        // UO requires gradual elevation changes for proper tile tessellation
        this.calculateZHeights(map, width, height);
        
        // Fourth pass: Apply transitions at biome boundaries
        this.applyTransitions(map, width, height);
        
        return map;
    }
    
    /**
     * Analyze surrounding tiles to determine context for tile selection
     * Returns context object with flags like nearForest, nearWater, isInterior, etc.
     */
    getTerrainContext(map, x, y, width, height) {
        const tile = map[y][x];
        const biome = tile.biome;
        
        let nearForest = false;
        let nearWater = false;
        let nearGrass = false;
        let nearRock = false;
        let isInterior = true;  // Assume interior until proven otherwise
        let forestNeighborCount = 0;
        let sameTypeNeighbors = 0;
        
        // Check 8 surrounding tiles
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dy, dx] of directions) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const neighborBiome = map[ny][nx].biome;
                
                if (neighborBiome === 'water') nearWater = true;
                if (neighborBiome === 'forest' || neighborBiome === 'jungle') {
                    nearForest = true;
                    forestNeighborCount++;
                }
                if (neighborBiome === 'grass') nearGrass = true;
                if (neighborBiome === 'rock') nearRock = true;
                
                if (neighborBiome === biome) {
                    sameTypeNeighbors++;
                } else {
                    isInterior = false;  // Has different neighbor = edge tile
                }
            }
        }
        
        // Forest interior: surrounded by 6+ forest tiles
        const isForestInterior = (biome === 'forest' || biome === 'jungle') && forestNeighborCount >= 6;
        
        return {
            nearForest,
            nearWater,
            nearGrass,
            nearRock,
            isInterior: isInterior && sameTypeNeighbors >= 6,
            isForestInterior,
            elevation: tile.elevation,
            moisture: tile.moisture
        };
    }
    
    /**
     * Calculate Z-heights for all tiles with smoothing
     * UO requires gradual elevation changes (max 2-3 Z between adjacent tiles)
     * for proper tile tessellation without gaps
     * 
     * WATER EDGE SYSTEM (Option A - Authentic UO Style):
     * - Water tiles sit at Z=0 (sea level)
     * - Land tiles adjacent to water get elevated Z (creates cliff effect)
     * - Embankment/cliff tiles are placed at water edges
     */
    calculateZHeights(map, width, height) {
        // First, calculate raw Z from elevation
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (tile.biome === 'water') {
                    tile.z = 0; // Water at sea level
                } else {
                    // Scale elevation above water (0.35-1.0) to Z (0-15)
                    // Using smaller range (0-15) for gentler slopes
                    const elevAboveWater = Math.max(0, tile.elevation - 0.35) / 0.65;
                    tile.z = Math.floor(elevAboveWater * 15);
                }
            }
        }
        
        // Mark tiles adjacent to water for special handling
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (tile.biome === 'water') continue;
                
                // Check if this tile is adjacent to water
                const isAdjacentToWater = this.isAdjacentToWater(map, x, y, width, height);
                tile.isWaterEdge = isAdjacentToWater;
                
                // Tiles adjacent to water should have minimum Z height for cliff effect
                if (isAdjacentToWater) {
                    tile.z = Math.max(tile.z, 3); // Minimum Z=3 for visible cliff
                }
            }
        }
        
        // Smooth Z-heights: ensure adjacent tiles differ by at most 2 Z
        // Multiple passes for better smoothing
        const maxZDiff = 2;
        for (let pass = 0; pass < 3; pass++) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tile = map[y][x];
                    if (tile.biome === 'water') continue; // Don't smooth water
                    
                    // Get neighbor Z values
                    const neighbors = [];
                    if (y > 0) neighbors.push(map[y-1][x].z);
                    if (y < height-1) neighbors.push(map[y+1][x].z);
                    if (x > 0) neighbors.push(map[y][x-1].z);
                    if (x < width-1) neighbors.push(map[y][x+1].z);
                    
                    if (neighbors.length === 0) continue;
                    
                    // Calculate average neighbor Z
                    const avgNeighborZ = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
                    
                    // If current Z is too different from neighbors, adjust it
                    // But keep water edge tiles at minimum Z=3
                    const minZ = tile.isWaterEdge ? 3 : 0;
                    if (tile.z > avgNeighborZ + maxZDiff) {
                        tile.z = Math.max(minZ, Math.floor(avgNeighborZ + maxZDiff));
                    } else if (tile.z < avgNeighborZ - maxZDiff) {
                        tile.z = Math.max(minZ, Math.ceil(avgNeighborZ - maxZDiff));
                    }
                }
            }
        }
    }
    
    /**
     * Check if a tile is adjacent to water (including diagonals)
     */
    isAdjacentToWater(map, x, y, width, height) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dy, dx] of directions) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                if (map[ny][nx].biome === 'water') {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Get the direction of water relative to this tile
     * Returns an object with flags for each direction
     */
    getWaterDirection(map, x, y, width, height) {
        const directions = {
            north: y > 0 && map[y-1][x].biome === 'water',
            south: y < height-1 && map[y+1][x].biome === 'water',
            east: x < width-1 && map[y][x+1].biome === 'water',
            west: x > 0 && map[y][x-1].biome === 'water',
            northEast: y > 0 && x < width-1 && map[y-1][x+1].biome === 'water',
            northWest: y > 0 && x > 0 && map[y-1][x-1].biome === 'water',
            southEast: y < height-1 && x < width-1 && map[y+1][x+1].biome === 'water',
            southWest: y < height-1 && x > 0 && map[y+1][x-1].biome === 'water'
        };
        return directions;
    }
    
    /**
     * Apply transition tiles where different biomes meet
     * 
     * CORRECT APPROACH: Generate corners FIRST using noise at corner positions,
     * THEN derive tiles from corners. Not the other way around.
     * 
     * WATER EDGE SYSTEM: After transitions, apply embankment tiles at water edges
     */
    applyTransitions(map, width, height) {
        // Generate corners DIRECTLY from noise - the correct approach!
        // Corners are generated at corner positions, not derived from tiles
        const noiseFunc = (x, y) => this.noise.noise2D(x, y);
        const corners = generateCornerBiomesFromNoise(width, height, noiseFunc, 0.40);
        
        // Apply transitions using pre-generated corners
        // Pass ALL custom tile mappings (from Tile Teacher) - not just one!
        apply8BitTransitions(map, width, height, corners, this.allTransitionMappings);
        
        // Apply water edge tiles (embankment/cliff tiles) - UO Style
        this.applyWaterEdgeTiles(map, width, height);
        
        // Debug: Log some transition info
        let transitionCount = 0;
        let waterEdgeCount = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x].isTransition) {
                    transitionCount++;
                }
                if (map[y][x].isWaterEdge) {
                    waterEdgeCount++;
                }
            }
        }
        console.log(`Applied ${transitionCount} transition tiles using Marching Squares`);
        console.log(`Applied ${waterEdgeCount} water edge tiles (embankment/cliff)`);
    }
    
    /**
     * Apply embankment/cliff tiles at water edges
     * 
     * Based on UO analysis:
     * - Embankment tiles are NOT used everywhere - only where there's a significant cliff
     * - They're mainly used around WATERWAYS (rivers, lakes, ocean edges)
     * - Regular land-to-land height differences don't use embankment tiles
     * - The 3D stretching handles most elevation changes
     * 
     * When to use embankment tiles:
     * 1. Land tile adjacent to water
     * 2. Land tile has Z-height >= 3 (significant cliff)
     * 3. NOT every water edge - use probability for natural variation
     */
    applyWaterEdgeTiles(map, width, height) {
        // Configuration - how often to apply embankment tiles
        // When procedural regioning (tile teacher data) is unavailable we lower this automatically.
        const EMBANKMENT_CHANCE = Math.min(1, Math.max(0, this.embankmentChance ?? 0.7));
        const MIN_Z_FOR_EMBANKMENT = 3; // Minimum Z-height difference to show cliff
        // GRASS/DIRT EMBANKMENT TILES (0x098C-0x09BF)
        // These show grass on top with a darker cliff face below
        // Organized by which direction the cliff DROPS toward (water direction)
        const GRASS_EMBANKMENT = {
            // Edge tiles - cliff drops toward water on one side
            // Water to the NORTH (cliff faces north/up-left)
            waterNorth: ['0x098C', '0x098D', '0x098E', '0x098F'],
            // Water to the SOUTH (cliff faces south/down-right)
            waterSouth: ['0x0990', '0x0991', '0x0992', '0x0993'],
            // Water to the EAST (cliff faces east/up-right)
            waterEast:  ['0x0994', '0x0995', '0x0996', '0x0997'],
            // Water to the WEST (cliff faces west/down-left)
            waterWest:  ['0x0998', '0x0999', '0x099A', '0x099B'],
            
            // Outer corner tiles - water on two adjacent sides
            // Water to NE (cliff faces NE corner)
            waterNE: ['0x099C', '0x099D'],
            // Water to NW (cliff faces NW corner)
            waterNW: ['0x099E', '0x099F'],
            // Water to SE (cliff faces SE corner)
            waterSE: ['0x09A0', '0x09A1'],
            // Water to SW (cliff faces SW corner)
            waterSW: ['0x09A2', '0x09A3'],
            
            // Inner corner tiles - land pokes into water (peninsula)
            // Land extends to NE (water on 3 sides except NE)
            landNE: ['0x09A4', '0x09A5'],
            // Land extends to NW (water on 3 sides except NW)
            landNW: ['0x09A6', '0x09A7'],
            // Land extends to SE (water on 3 sides except SE)
            landSE: ['0x09A8', '0x09A9'],
            // Land extends to SW (water on 3 sides except SW)
            landSW: ['0x09AA', '0x09AB'],
            
            // Surrounded or special cases
            surrounded: ['0x09AC', '0x09AD', '0x09AE', '0x09AF']
        };
        
        // SAND EMBANKMENT TILES (for sandy beaches meeting water)
        // These show sand transitioning to water with cliff effect
        const SAND_EMBANKMENT = {
            // Edge tiles
            waterNorth: ['0x001C', '0x001D', '0x001E', '0x001F'],
            waterSouth: ['0x0020', '0x0021', '0x0022', '0x0023'],
            waterEast:  ['0x0024', '0x0025', '0x0026', '0x0027'],
            waterWest:  ['0x0028', '0x0029', '0x002A', '0x002B'],
            
            // Outer corners
            waterNE: ['0x002C', '0x002D'],
            waterNW: ['0x002E', '0x002F'],
            waterSE: ['0x0030', '0x0031'],
            waterSW: ['0x0032', '0x0033'],
            
            // Inner corners (peninsula)
            landNE: ['0x0044', '0x0045'],
            landNW: ['0x0046', '0x0047'],
            landSE: ['0x0048', '0x0049'],
            landSW: ['0x004A', '0x004B'],
            
            // Surrounded
            surrounded: ['0x0016', '0x0017', '0x0018', '0x0019'] // Pure sand
        };
        
        // Select the right embankment tiles based on biome
        const getEmbankmentTiles = (biome) => {
            if (biome === 'sand') return SAND_EMBANKMENT;
            return GRASS_EMBANKMENT;
        };
        
        let appliedCount = 0;
        let skippedLowZ = 0;
        let skippedRandom = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                
                // Skip water tiles and non-water-edge tiles
                if (tile.biome === 'water' || !tile.isWaterEdge) continue;
                
                // Only apply embankment if Z-height is significant (cliff effect)
                if (tile.z < MIN_Z_FOR_EMBANKMENT) {
                    skippedLowZ++;
                    continue;
                }
                
                // Random chance - not every water edge needs embankment
                // Use position-based randomness for consistency
                const randomValue = ((x * 17 + y * 31) % 100) / 100;
                if (randomValue > EMBANKMENT_CHANCE) {
                    skippedRandom++;
                    continue;
                }
                
                const EMBANKMENT = getEmbankmentTiles(tile.biome);
                const waterDir = this.getWaterDirection(map, x, y, width, height);
                
                // Count cardinal and diagonal water neighbors
                const cardinalWater = [waterDir.north, waterDir.south, waterDir.east, waterDir.west]
                    .filter(Boolean).length;
                const diagonalWater = [waterDir.northEast, waterDir.northWest, waterDir.southEast, waterDir.southWest]
                    .filter(Boolean).length;
                
                let embankTiles = null;
                
                // CASE 1: Almost surrounded by water (3+ cardinal sides)
                // This is a peninsula tip - use inner corner tiles
                if (cardinalWater >= 3) {
                    // Which direction does land extend? (opposite of water)
                    if (!waterDir.south && !waterDir.east) {
                        embankTiles = EMBANKMENT.landSE;
                    } else if (!waterDir.south && !waterDir.west) {
                        embankTiles = EMBANKMENT.landSW;
                    } else if (!waterDir.north && !waterDir.east) {
                        embankTiles = EMBANKMENT.landNE;
                    } else if (!waterDir.north && !waterDir.west) {
                        embankTiles = EMBANKMENT.landNW;
                    } else if (!waterDir.north) {
                        embankTiles = EMBANKMENT.landNE; // Default
                    } else if (!waterDir.south) {
                        embankTiles = EMBANKMENT.landSW;
                    } else if (!waterDir.east) {
                        embankTiles = EMBANKMENT.landNW;
                    } else if (!waterDir.west) {
                        embankTiles = EMBANKMENT.landSE;
                    } else {
                        embankTiles = EMBANKMENT.surrounded;
                    }
                }
                // CASE 2: Two adjacent cardinal sides have water (outer corner)
                else if (cardinalWater === 2) {
                    if (waterDir.north && waterDir.east) {
                        embankTiles = EMBANKMENT.waterNE;
                    } else if (waterDir.north && waterDir.west) {
                        embankTiles = EMBANKMENT.waterNW;
                    } else if (waterDir.south && waterDir.east) {
                        embankTiles = EMBANKMENT.waterSE;
                    } else if (waterDir.south && waterDir.west) {
                        embankTiles = EMBANKMENT.waterSW;
                    } else if (waterDir.north && waterDir.south) {
                        // Water on opposite sides (narrow strip) - use north facing
                        embankTiles = EMBANKMENT.waterNorth;
                    } else if (waterDir.east && waterDir.west) {
                        // Water on opposite sides - use east facing
                        embankTiles = EMBANKMENT.waterEast;
                    }
                }
                // CASE 3: One cardinal side has water (edge)
                else if (cardinalWater === 1) {
                    if (waterDir.north) {
                        embankTiles = EMBANKMENT.waterNorth;
                    } else if (waterDir.south) {
                        embankTiles = EMBANKMENT.waterSouth;
                    } else if (waterDir.east) {
                        embankTiles = EMBANKMENT.waterEast;
                    } else if (waterDir.west) {
                        embankTiles = EMBANKMENT.waterWest;
                    }
                }
                // CASE 4: Only diagonal water (corner poke)
                else if (diagonalWater > 0) {
                    // Water only touches diagonally - use appropriate corner
                    if (waterDir.northEast) {
                        embankTiles = EMBANKMENT.waterNE;
                    } else if (waterDir.northWest) {
                        embankTiles = EMBANKMENT.waterNW;
                    } else if (waterDir.southEast) {
                        embankTiles = EMBANKMENT.waterSE;
                    } else if (waterDir.southWest) {
                        embankTiles = EMBANKMENT.waterSW;
                    }
                }
                
                // Apply the embankment tile
                if (embankTiles && embankTiles.length > 0) {
                    // Use position-based selection for variety within the tile set
                    const index = ((x * 7 + y * 13) % embankTiles.length);
                    tile.id = embankTiles[index];
                    tile.isEmbankment = true;
                    appliedCount++;
                }
            }
        }
        
        console.log(`Embankment tiles: ${appliedCount} applied, ${skippedLowZ} skipped (low Z), ${skippedRandom} skipped (random)`);
    }
    
    /**
     * Generate a specific map to test "Rock Face" cliff generation
     * Creates a high cliff wall on the left transitioning to low ground on the right
     * Designed to mirror the "Classic UO Mountain" look (vertical rock face)
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {string} mode - 'rough' (default), 'cave', 'match' (Mountain Rock), or 'custom_pattern'
     * @param {Array<Array<string>>} customPattern - Optional 4x4 pattern
     */
    generateCliffTestMap(width = 40, height = 40, mode = 'rough', customPattern = null) {
        console.log(`[TerrainGeneratorV2] generateCliffTestMap called. Mode: ${mode}`, customPattern ? 'Has Pattern' : 'No Pattern');
        const map = [];
        
        // Configuration for the cliff
        const cliffX = Math.floor(width * 0.35); // Cliff edge at 35% width
        const topZ = 25; // High plateau (very high to show texture wall)
        const bottomZ = 0; // Low ground
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                let biome = 'grass';
                let z = bottomZ;
                let elevation = 0.5;
                
                // Add some noise to the cliff edge so it's jagged like real UO mountains
                const edgeNoise = Math.floor(this.noise.noise2D(y * 0.15, 0) * 4);
                const currentCliffX = cliffX + edgeNoise;
                
                if (x < currentCliffX) {
                    // High plateau
                    z = topZ;
                    elevation = 0.95; // Very high
                    
                    if (mode === 'cave') {
                        biome = 'cave';
                    } else if (mode === 'match' || mode === 'custom_pattern') {
                        biome = 'rock';
                        // 'match' uses Mountain Rock tiles (0x01D3)
                    } else {
                        biome = 'rock'; // Default rough rock
                    }
                } else {
                    // Low ground (Grass/Forest)
                    biome = 'grass';
                    // Add tree clumps (forest) near the cliff base like the image
                    const forestNoise = this.noise.noise2D(x * 0.1, y * 0.1);
                    if (forestNoise > 0.1 || x < currentCliffX + 3) {
                        // More forest near the cliff base
                        biome = 'forest';
                    }
                    z = bottomZ;
                    elevation = 0.3;
                }
                
                // Initialize tile object
                map[y][x] = {
                    id: null, 
                    biome: biome,
                    elevation: elevation,
                    moisture: 0.6, // Moist enough for forest
                    z: z,
                    forceMountain: (mode === 'match' && x < currentCliffX),
                    forceCustom: (mode === 'custom_pattern' && x < currentCliffX)
                };
            }
        }
        
        // Second pass: Assign tiles with context
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                
                // Handle Custom Pattern
                if (tile.forceCustom && customPattern) {
                    // Use custom 4x4 pattern provided by Stitch Designer
                    const px = x % 4;
                    const py = y % 4;
                    tile.id = customPattern[py][px];
                    tile.setIndex = 0;
                }
                // Handle Mountain Match
                else if (tile.forceMountain) {
                    // 0x01D3 - 0x01DA are Mountain Rock land tiles (8 tiles total, 2 sets of 4)
                    // Use noise to mix between the two sets for variety (stitching effect)
                    // Use position to tessellate them properly within each set
                    
                    const set1 = ['0x01D3', '0x01D4', '0x01D5', '0x01D6'];
                    const set2 = ['0x01D7', '0x01D8', '0x01D9', '0x01DA'];
                    
                    // Large noise pattern to switch sets - creates patches of different texture
                    const setNoise = this.noise.noise2D(x * 0.15, y * 0.15);
                    const activeSet = setNoise > 0.2 ? set2 : set1;
                    
                    const tileIndex = ((x % 2) + (y % 2) * 2) % 4;
                    tile.id = activeSet[tileIndex];
                    tile.setIndex = setNoise > 0.2 ? 1 : 0;
                } else {
                    // Normal assignment with context
                    const context = this.getTerrainContext(map, x, y, width, height);
                    const setIndex = this.getTileSetIndex(tile.biome, x, y);
                    tile.id = this.getTileFromSetAtPosition(tile.biome, x, y, setIndex, context);
                    tile.setIndex = setIndex;
                }
            }
        }
        
        // Skip Z-smoothing to preserve the sharp vertical cliff
        // We only apply transitions
        this.applyTransitions(map, width, height);
        
        return map;
    }

    /**
     * Generate a simple test map - SAND in center, GRASS around
     * This is the layout that was working correctly!
     */
    generateTestMap(width = 30, height = 30) {
        const map = [];
        
        // Sand strip in the CENTER
        const sandStart = Math.floor(width / 3);
        const sandEnd = Math.floor(width * 2 / 3);
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                let biome = 'grass';
                
                // Center: Sand strip
                if (x >= sandStart && x < sandEnd) {
                    biome = 'sand';
                }
                
                // Get tile set for this region
                const setIndex = this.getTileSetIndex(biome, x, y);
                
                // Get specific tile from the set based on position
                const tileId = this.getTileFromSetAtPosition(biome, x, y, setIndex);
                
                map[y][x] = {
                    id: tileId,
                    biome: biome,
                    elevation: 0.5,
                    moisture: 0.5,
                    setIndex: setIndex
                };
            }
        }
        
        // Apply transitions at biome boundaries
        this.applyTransitions(map, width, height);
        
        return map;
    }
}

export default TerrainGeneratorV2;

