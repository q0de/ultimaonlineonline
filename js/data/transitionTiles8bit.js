/**
 * UO Transition Tiles - Marching Squares System
 * 
 * CORRECT APPROACH: Generate corners FIRST using noise at corner positions,
 * THEN derive tiles from corners. Not the other way around.
 * 
 * Corner positions:     Corner bit values:
 *   TL----TR              TL=8  TR=4
 *   |      |               |      |
 *   BL----BR              BL=1  BR=2
 * 
 * Case Index = (TL×8) + (TR×4) + (BR×2) + (BL×1)
 * Where: 0 = grass (biome A), 1 = sand (biome B)
 * 
 * RENDERING NOTES:
 * - Tiles must overlap by 50% (spacing = tileSize / 2) for proper tessellation
 * - Black corners must be made transparent using diamond test:
 *   |x-center|/half + |y-center|/half > 1 = outside diamond
 */

// =============================================================================
// MARCHING SQUARES TILE MAPPING - 16 Cases for Grass/Sand
// =============================================================================

const GRASS_SAND_TILES = {
    0:  { id: '0x0003', name: 'Pure Grass', tiles: ['0x0003', '0x0004', '0x0005', '0x0006'] },
    1:  { id: '0x0036', name: 'Outer NW (BL sand)' },      // Sand pokes into grass from BL
    2:  { id: '0x0033', name: 'Outer SE (BR sand)' },      // Sand pokes into grass from BR
    3:  { id: '0x0038', name: 'Edge W (bottom sand)' },    // Sand on bottom edge
    4:  { id: '0x0034', name: 'Outer SW (TR sand)' },      // Sand pokes into grass from TR
    5:  { id: '0x0037', name: 'Saddle 1 (TR+BL sand)' },   // Diagonal sand pattern
    6:  { id: '0x003a', name: 'Edge E (right sand)' },     // Sand on right edge
    7:  { id: '0x003b', name: 'Inner SE (only TL grass)' },// Grass pokes into sand from TL
    8:  { id: '0x0035', name: 'Outer NE (TL sand)' },      // Sand pokes into grass from TL
    9:  { id: '0x0039', name: 'Edge S (left sand)' },      // Sand on left edge
    10: { id: '0x0004', name: 'Saddle 2 (TL+BR sand)' },   // Diagonal sand pattern (alt)
    11: { id: '0x003c', name: 'Inner SW (only TR grass)' },// Grass pokes into sand from TR
    12: { id: '0x0005', name: 'Edge N (top sand)' },       // Sand on top edge
    13: { id: '0x003d', name: 'Inner NE (only BR grass)' },// Grass pokes into sand from BR
    14: { id: '0x003e', name: 'Inner NW (only BL grass)' },// Grass pokes into sand from BL
    15: { id: '0x0016', name: 'Pure Sand', tiles: ['0x0016', '0x0017', '0x0018', '0x0019'] }
};

// Smooth curve tiles for more natural transitions (optional enhancement)
const SMOOTH_CURVE_TILES = {
    // These can replace outer corners for smoother curves
    outerNW: ['0x03B7', '0x03B8', '0x03B9'],
    outerNE: ['0x03BA', '0x03BB', '0x03BC'],
    outerSE: ['0x03BD', '0x03BE', '0x03BF'],
    outerSW: ['0x03C0', '0x03C1', '0x03C2'],
};

// =============================================================================
// PURE BIOME TILES - For non-transition areas
// =============================================================================

const BIOME_TILES = {
    grass: ['0x0003', '0x0004', '0x0005', '0x0006'],
    sand: ['0x0016', '0x0017', '0x0018', '0x0019'],
    water: ['0x00A8', '0x00A9', '0x00AA', '0x00AB'],
    forest: ['0x00C4', '0x00C5', '0x00C6', '0x00C7'],
    jungle: ['0x00AC', '0x00AD', '0x00AE', '0x00AF'],
    dirt: ['0x0071', '0x0072', '0x0073', '0x0074'],
    rock: ['0x00E4', '0x00E5', '0x00E6', '0x00E7'],  // Grey rocky mountain tiles
    snow: ['0x011A', '0x011B', '0x011C', '0x011D'],
    cave: ['0x0245', '0x0246', '0x0247', '0x0248'],
    lava: ['0x01F4', '0x01F5', '0x01F6', '0x01F7'],
    void: ['0x01FA', '0x01FB', '0x01FC', '0x01FD'],
    furrows: ['0x0009', '0x000A', '0x000B', '0x000C'],  // Plowed farmland (like in UO screenshot)
};

// Grass with foliage for variety
const GRASS_FOLIAGE_TILES = ['0x00C0', '0x00C1', '0x00C2', '0x00C3'];
const GRASS_VARIED_TILES = ['0x007D', '0x007E', '0x007F'];

// =============================================================================
// ADDITIONAL TRANSITION TILE MAPPINGS
// For biome pairs other than grass/sand
// These use the grass-with-foliage tiles for softer transitions
// =============================================================================

/**
 * Grass-to-Forest transitions
 * Uses foliage tiles (0x00C0-0x00C3) for grass edge meeting forest
 * Forest encroaches with darker grass tiles
 */
const GRASS_FOREST_TILES = {
    0:  { id: '0x0003', name: 'Pure Grass', tiles: ['0x0003', '0x0004', '0x0005', '0x0006'] },
    1:  { id: '0x00C0', name: 'Grass with forest debris (BL)' },
    2:  { id: '0x00C1', name: 'Grass with forest debris (BR)' },
    3:  { id: '0x00C2', name: 'Forest debris edge (bottom)' },
    4:  { id: '0x00C3', name: 'Grass with forest debris (TR)' },
    5:  { id: '0x00C0', name: 'Diagonal forest pattern' },
    6:  { id: '0x00C1', name: 'Forest debris edge (right)' },
    7:  { id: '0x00C8', name: 'Mostly forest (only TL grass)' },
    8:  { id: '0x00C0', name: 'Grass with forest debris (TL)' },
    9:  { id: '0x00C3', name: 'Forest debris edge (left)' },
    10: { id: '0x00C2', name: 'Diagonal forest pattern alt' },
    11: { id: '0x00C9', name: 'Mostly forest (only TR grass)' },
    12: { id: '0x00C1', name: 'Forest debris edge (top)' },
    13: { id: '0x00CA', name: 'Mostly forest (only BR grass)' },
    14: { id: '0x00CB', name: 'Mostly forest (only BL grass)' },
    15: { id: '0x00C4', name: 'Pure Forest', tiles: ['0x00C4', '0x00C5', '0x00C6', '0x00C7'] }
};

/**
 * Grass-to-Dirt transitions
 * Uses lighter dirt tiles transitioning to grass
 */
const GRASS_DIRT_TILES = {
    0:  { id: '0x0003', name: 'Pure Grass', tiles: ['0x0003', '0x0004', '0x0005', '0x0006'] },
    1:  { id: '0x0079', name: 'Dirt pokes into grass (BL)' },
    2:  { id: '0x007A', name: 'Dirt pokes into grass (BR)' },
    3:  { id: '0x007B', name: 'Dirt edge (bottom)' },
    4:  { id: '0x007C', name: 'Dirt pokes into grass (TR)' },
    5:  { id: '0x0079', name: 'Diagonal dirt' },
    6:  { id: '0x007A', name: 'Dirt edge (right)' },
    7:  { id: '0x0082', name: 'Mostly dirt (only TL grass)' },
    8:  { id: '0x0079', name: 'Dirt pokes into grass (TL)' },
    9:  { id: '0x007B', name: 'Dirt edge (left)' },
    10: { id: '0x007C', name: 'Diagonal dirt alt' },
    11: { id: '0x0083', name: 'Mostly dirt (only TR grass)' },
    12: { id: '0x007A', name: 'Dirt edge (top)' },
    13: { id: '0x0085', name: 'Mostly dirt (only BR grass)' },
    14: { id: '0x0086', name: 'Mostly dirt (only BL grass)' },
    15: { id: '0x0071', name: 'Pure Dirt', tiles: ['0x0071', '0x0072', '0x0073', '0x0074'] }
};

/**
 * Grass-to-Rock transitions (for mountain bases)
 * Uses rock tiles with grass showing through cracks
 */
const GRASS_ROCK_TILES = {
    0:  { id: '0x0003', name: 'Pure Grass', tiles: ['0x0003', '0x0004', '0x0005', '0x0006'] },
    1:  { id: '0x00E8', name: 'Rock pokes into grass (BL)' },
    2:  { id: '0x00E9', name: 'Rock pokes into grass (BR)' },
    3:  { id: '0x00EA', name: 'Rock edge (bottom)' },
    4:  { id: '0x00EB', name: 'Rock pokes into grass (TR)' },
    5:  { id: '0x00E8', name: 'Diagonal rock' },
    6:  { id: '0x00E9', name: 'Rock edge (right)' },
    7:  { id: '0x00F4', name: 'Mostly rock (only TL grass)' },
    8:  { id: '0x00E8', name: 'Rock pokes into grass (TL)' },
    9:  { id: '0x00EA', name: 'Rock edge (left)' },
    10: { id: '0x00EB', name: 'Diagonal rock alt' },
    11: { id: '0x00F5', name: 'Mostly rock (only TR grass)' },
    12: { id: '0x00E9', name: 'Rock edge (top)' },
    13: { id: '0x00F6', name: 'Mostly rock (only BR grass)' },
    14: { id: '0x00F7', name: 'Mostly rock (only BL grass)' },
    15: { id: '0x00E4', name: 'Pure Rock', tiles: ['0x00E4', '0x00E5', '0x00E6', '0x00E7'] }
};

/**
 * Forest-to-Jungle transitions
 * For tropical forest edges
 */
const FOREST_JUNGLE_TILES = {
    0:  { id: '0x00C4', name: 'Pure Forest', tiles: ['0x00C4', '0x00C5', '0x00C6', '0x00C7'] },
    1:  { id: '0x00D0', name: 'Jungle edge (BL)' },
    2:  { id: '0x00D1', name: 'Jungle edge (BR)' },
    3:  { id: '0x00D2', name: 'Jungle edge (bottom)' },
    4:  { id: '0x00D3', name: 'Jungle edge (TR)' },
    5:  { id: '0x00D4', name: 'Diagonal pattern' },
    6:  { id: '0x00D5', name: 'Jungle edge (right)' },
    7:  { id: '0x00B0', name: 'Mostly jungle (TL forest)' },
    8:  { id: '0x00D6', name: 'Jungle edge (TL)' },
    9:  { id: '0x00D7', name: 'Jungle edge (left)' },
    10: { id: '0x00D4', name: 'Diagonal pattern alt' },
    11: { id: '0x00B3', name: 'Mostly jungle (TR forest)' },
    12: { id: '0x00D5', name: 'Jungle edge (top)' },
    13: { id: '0x00B6', name: 'Mostly jungle (BR forest)' },
    14: { id: '0x00B9', name: 'Mostly jungle (BL forest)' },
    15: { id: '0x00AC', name: 'Pure Jungle', tiles: ['0x00AC', '0x00AD', '0x00AE', '0x00AF'] }
};

/**
 * Default transition mappings lookup
 * Maps biome pair keys to their transition tile definitions
 * 
 * NOTE: grass_sand transitions are the ONLY ones that look correct in UO
 * Other biome pairs (grass_dirt, grass_rock, etc.) don't have proper transition
 * tiles in the original UO data - they use abrupt boundaries or the same tiles
 * as grass_sand which doesn't look right.
 * 
 * For now, ONLY use grass_sand transitions - the rest will use pure biome tiles
 */
export const DEFAULT_TRANSITION_MAPPINGS = {
    'grass_sand': GRASS_SAND_TILES,
    // Disabled - these don't have proper UO transition tiles:
    // 'forest_grass': GRASS_FOREST_TILES,
    // 'grass_forest': GRASS_FOREST_TILES,
    // 'dirt_grass': GRASS_DIRT_TILES,
    // 'grass_dirt': GRASS_DIRT_TILES,
    // 'grass_rock': GRASS_ROCK_TILES,
    // 'rock_grass': GRASS_ROCK_TILES,
    // 'forest_jungle': FOREST_JUNGLE_TILES,
    // 'jungle_forest': FOREST_JUNGLE_TILES,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getTileAtPosition(tiles, x, y) {
    // Use position-based selection for proper tessellation (2x2 pattern)
    const index = ((x % 2) + (y % 2) * 2) % tiles.length;
    return tiles[index];
}

function isSandLike(biome) {
    return biome === 'sand';
}

function isGrassLike(biome) {
    return biome === 'grass' || biome === 'forest' || biome === 'jungle' || 
           biome === 'dirt' || biome === 'rock' || biome === 'snow';
}

// =============================================================================
// CORNER-BASED BIOME GENERATION - CORRECT APPROACH
// =============================================================================

/**
 * Generate corner biomes DIRECTLY using a noise function.
 * 
 * IMPORTANT: Corners should be generated FIRST, then tiles derived from corners.
 * This avoids the chicken-and-egg problem of deriving corners from tiles.
 * 
 * Uses the SAME noise scales and normalization as terrainGeneratorV2.js generateMap()
 * to ensure corners match the tile biomes.
 * 
 * @param {number} width - Map width in tiles
 * @param {number} height - Map height in tiles  
 * @param {Function} noiseFunc - Noise function that takes (x, y) and returns value
 * @param {number} waterThreshold - Elevation below this = water (default 0.35)
 */
export function generateCornerBiomesFromNoise(width, height, noiseFunc, waterThreshold = 0.35) {
    const corners = [];
    
    // Use the SAME scales as terrainGeneratorV2.js generateMap()
    const scale1 = 0.02;
    const scale2 = 0.05;
    const scale3 = 0.1;
    
    for (let cy = 0; cy <= height; cy++) {
        corners[cy] = [];
        for (let cx = 0; cx <= width; cx++) {
            // Sample noise EXACTLY like generateMap() does
            const e1 = noiseFunc(cx * scale1, cy * scale1);
            const e2 = noiseFunc(cx * scale2 + 100, cy * scale2 + 100) * 0.5;
            const e3 = noiseFunc(cx * scale3 + 200, cy * scale3 + 200) * 0.25;
            const elevation = (e1 + e2 + e3 + 1.75) / 3.5; // Same normalization
            
            // Moisture uses same offset as generateMap()
            const m1 = noiseFunc(cx * scale1 + 500, cy * scale1 + 500);
            const m2 = noiseFunc(cx * scale2 + 600, cy * scale2 + 600) * 0.5;
            const moisture = (m1 + m2 + 1.5) / 3; // Same normalization
            
            // Determine biome - EXACTLY matching getBiome() in terrainGeneratorV2.js
            let biome = 'grass';
            
            // Water
            if (elevation < 0.35) {
                biome = 'water';
            }
            // Beach/Sand zone - MORE LIKELY near water but not guaranteed
            // Creates varied coastlines: beaches, cliffs, rocky shores, jungle coasts
            else if (elevation < 0.42) {
                // Use position-based pseudo-random to decide if this coast tile is sandy
                // ~60% chance of sand near water (was 100% before)
                const beachNoise = ((cx * 13 + cy * 7) % 100) / 100;
                
                // Higher chance of sand in dry areas, lower in wet areas (jungle coasts)
                const sandChance = 0.5 + (1 - moisture) * 0.3; // 50-80% based on moisture
                
                if (beachNoise < sandChance) {
                    biome = 'sand';
                }
                // Otherwise, continue to determine other biome (grass, jungle, etc. at coast)
                else if (moisture > 0.6) {
                    biome = 'jungle';
                } else if (moisture > 0.4) {
                    biome = 'forest';
                } else {
                    biome = 'grass';
                }
            }
            // RARE desert patches - only in VERY dry, low areas
            else if (elevation < 0.50 && moisture < 0.20) {
                const desertChance = ((cx * 17 + cy * 23) % 100) / 100;
                if (desertChance < 0.12) {
                    biome = 'sand';
                }
            }
            // Low elevation (if not already assigned)
            if (biome === 'grass' && elevation >= 0.42 && elevation < 0.55) {
                if (moisture > 0.6) {
                    biome = 'jungle';
                } else if (moisture > 0.4) {
                    biome = 'forest';
                }
            }
            // Medium elevation
            else if (elevation < 0.70) {
                if (moisture > 0.5) {
                    biome = 'forest';
                } else if (moisture < 0.3) {
                    biome = 'dirt';
                } else {
                    biome = 'grass';
                }
            }
            // High elevation
            else if (elevation < 0.85) {
                biome = 'rock';
            }
            // Very high = rock
            else {
                biome = 'rock';
            }
            
            corners[cy][cx] = {
                biome: biome,
                elevation: elevation,
                moisture: moisture
            };
        }
    }
    
    return corners;
}

/**
 * Fallback: Generate corner biomes from existing tile map
 * Used when noise function is not available (legacy support)
 */
function generateCornerBiomesFromMap(map, width, height) {
    const corners = [];
    const SAND_THRESHOLD = 0.40;
    
    for (let cy = 0; cy <= height; cy++) {
        corners[cy] = [];
        for (let cx = 0; cx <= width; cx++) {
            // Get elevation from adjacent tiles and average them
            const elevations = [];
            
            if (cy > 0 && cx > 0 && map[cy-1] && map[cy-1][cx-1]) {
                elevations.push(map[cy-1][cx-1].elevation || 0.5);
            }
            if (cy > 0 && cx < width && map[cy-1] && map[cy-1][cx]) {
                elevations.push(map[cy-1][cx].elevation || 0.5);
            }
            if (cy < height && cx > 0 && map[cy] && map[cy][cx-1]) {
                elevations.push(map[cy][cx-1].elevation || 0.5);
            }
            if (cy < height && cx < width && map[cy] && map[cy][cx]) {
                elevations.push(map[cy][cx].elevation || 0.5);
            }
            
            const avgElevation = elevations.length > 0 
                ? elevations.reduce((a, b) => a + b, 0) / elevations.length
                : 0.5;
            
            corners[cy][cx] = {
                biome: avgElevation < SAND_THRESHOLD ? 'sand' : 'grass',
                elevation: avgElevation
            };
        }
    }
    
    return corners;
}

/**
 * Calculate Marching Squares case index from 4 corners
 * TL=8, TR=4, BR=2, BL=1
 */
function calculateCaseIndex(tl, tr, br, bl) {
    const tlBit = isSandLike(tl) ? 8 : 0;
    const trBit = isSandLike(tr) ? 4 : 0;
    const brBit = isSandLike(br) ? 2 : 0;
    const blBit = isSandLike(bl) ? 1 : 0;
    return tlBit | trBit | brBit | blBit;
}

/**
 * Get the appropriate tile for a Marching Squares case
 */
function getTileForCase(caseIndex, x, y, useSmoothCurves = true, customMapping = null) {
    // Use custom mapping if provided (from Tile Teacher), otherwise use default
    const tileData = customMapping ? customMapping[caseIndex] : GRASS_SAND_TILES[caseIndex];
    
    // If customMapping is a simple string (from EDITABLE_TILE_DATA format)
    if (typeof tileData === 'string') {
        return tileData;
    }
    
    if (!tileData) {
        console.warn(`Unknown case index: ${caseIndex}`);
        return '0x0003'; // Default to grass
    }
    
    // For pure biomes (case 0 and 15), use tessellating tiles
    if (tileData.tiles) {
        return getTileAtPosition(tileData.tiles, x, y);
    }
    
    // For outer corners, optionally use smooth curves (only if not using custom mapping)
    if (useSmoothCurves && !customMapping) {
        switch (caseIndex) {
            case 1: return randomChoice(SMOOTH_CURVE_TILES.outerNW);
            case 2: return randomChoice(SMOOTH_CURVE_TILES.outerNE);
            case 4: return randomChoice(SMOOTH_CURVE_TILES.outerSE);
            case 8: return randomChoice(SMOOTH_CURVE_TILES.outerSW);
        }
    }
    
    return tileData.id;
}

// =============================================================================
// MAIN TRANSITION APPLICATION
// =============================================================================

/**
 * Get the transition key for a biome pair (e.g., "grass_sand")
 * Always returns the key in alphabetical order for consistency
 */
function getTransitionKey(biomeA, biomeB) {
    const sorted = [biomeA, biomeB].sort();
    return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Calculate case index for ANY two biomes
 * biomeA is considered "0" (like grass), biomeB is considered "1" (like sand)
 */
function calculateCaseIndexForBiomes(tl, tr, br, bl, biomeB) {
    const tlBit = (tl === biomeB) ? 8 : 0;
    const trBit = (tr === biomeB) ? 4 : 0;
    const brBit = (br === biomeB) ? 2 : 0;
    const blBit = (bl === biomeB) ? 1 : 0;
    return tlBit | trBit | brBit | blBit;
}

/**
 * Apply Marching Squares transitions to the map
 * 
 * ENHANCED: Now supports multiple biome pair transitions, not just grass/sand
 * Uses DEFAULT_TRANSITION_MAPPINGS for common biome pairs when custom mappings not provided
 * 
 * @param {Array} map - 2D array of tiles with biome and elevation data
 * @param {number} width - Map width
 * @param {number} height - Map height
 * @param {Array} corners - Optional pre-generated corners (from generateCornerBiomesFromNoise)
 * @param {Object} allTransitionMappings - Object containing ALL transition mappings keyed by transition type
 *                                         e.g., { grass_sand: {...}, grass_dirt: {...}, ... }
 */
export function apply8BitTransitions(map, width, height, corners = null, allTransitionMappings = null) {
    let transitionCount = 0;
    
    // Merge custom mappings with defaults - custom takes precedence
    const effectiveMappings = {
        ...DEFAULT_TRANSITION_MAPPINGS,
        ...(allTransitionMappings || {})
    };
    
    // DEBUG: Check mappings
    const customKeys = allTransitionMappings ? Object.keys(allTransitionMappings) : [];
    const defaultKeys = Object.keys(DEFAULT_TRANSITION_MAPPINGS);
    const allKeys = Object.keys(effectiveMappings);
    
    if (customKeys.length > 0) {
        console.log(`✅ Using ${customKeys.length} CUSTOM + ${defaultKeys.length} DEFAULT transition mappings`);
    } else {
        console.log(`📋 Using ${allKeys.length} DEFAULT transition mappings: ${allKeys.join(', ')}`);
    }
    
    // Step 1: Generate corner biomes (use provided corners or fallback to map-based)
    if (!corners) {
        corners = generateCornerBiomesFromMap(map, width, height);
    }
    
    // Step 2: For each tile, calculate its case and assign the appropriate tile
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = map[y][x];
            const biome = tile.biome;
            
            // Get the 4 corners of this tile
            // Standard corner assignment - no rotation
            // TL = top-left corner of the tile
            // TR = top-right corner of the tile
            // BL = bottom-left corner of the tile
            // BR = bottom-right corner of the tile
            const tl = corners[y][x].biome;
            const tr = corners[y][x + 1].biome;
            const bl = corners[y + 1][x].biome;
            const br = corners[y + 1][x + 1].biome;
            
            // Get all unique biomes at corners
            const cornerBiomes = new Set([tl, tr, bl, br]);
            const uniqueBiomes = Array.from(cornerBiomes);
            
            // If all corners are same biome, use pure tile
            if (uniqueBiomes.length === 1) {
                const pureBiome = uniqueBiomes[0];
                const pureTiles = BIOME_TILES[pureBiome];
                if (pureTiles) {
                    tile.id = getTileAtPosition(pureTiles, x, y);
                }
                continue;
            }
            
            // If exactly 2 biomes, look for a transition mapping
            if (uniqueBiomes.length === 2) {
                const [biomeA, biomeB] = uniqueBiomes.sort();
                const transitionKey = `${biomeA}_${biomeB}`;
                
                // Check for mapping in effective mappings (custom + defaults)
                let mapping = effectiveMappings[transitionKey] || null;
                
                // Calculate case index (biomeB is the "1" biome)
                const caseIndex = calculateCaseIndexForBiomes(tl, tr, br, bl, biomeB);
                
                // Get tile from mapping
                if (mapping) {
                    const mappingEntry = mapping[caseIndex];
                    if (mappingEntry) {
                        // Handle both string and object formats
                        if (typeof mappingEntry === 'string') {
                            tile.id = mappingEntry;
                        } else if (typeof mappingEntry === 'object') {
                            // For pure biomes (case 0 and 15) with multiple tiles, use position-based selection
                            if (mappingEntry.tiles && (caseIndex === 0 || caseIndex === 15)) {
                                tile.id = getTileAtPosition(mappingEntry.tiles, x, y);
                            } else if (mappingEntry.id) {
                                tile.id = mappingEntry.id;
                            } else {
                                // Fallback: use first key that looks like a tile ID
                                console.warn(`Invalid mapping entry for case ${caseIndex}:`, mappingEntry);
                                continue;
                            }
                        }
                        tile.isTransition = true;
                        tile.caseIndex = caseIndex;
                        tile.transitionType = transitionKey;
                        transitionCount++;
                        continue;
                    }
                }
                
                // Fallback to grass/sand if no mapping found
                if (transitionKey === 'grass_sand' || 
                    (biomeA === 'grass' && biomeB === 'sand') ||
                    (biomeA === 'sand' && biomeB === 'grass')) {
                    
                    // Use grass/sand mapping from effective mappings
                    const grassSandMapping = effectiveMappings['grass_sand'] || null;
                    
                    // Helper to extract tile ID from mapping entry
                    const extractTileId = (entry, defaultTiles, x, y) => {
                        if (!entry) return getTileAtPosition(defaultTiles, x, y);
                        if (typeof entry === 'string') return entry;
                        if (entry.tiles) return getTileAtPosition(entry.tiles, x, y);
                        if (entry.id) return entry.id;
                        return getTileAtPosition(defaultTiles, x, y);
                    };
                    
                    // Case 0 = all grass corners, Case 15 = all sand corners
                    if (caseIndex === 0) {
                        // Pure grass - add variety
                        if (grassSandMapping && grassSandMapping[0]) {
                            tile.id = extractTileId(grassSandMapping[0], BIOME_TILES.grass, x, y);
                        } else {
                            const roll = Math.random();
                            if (roll < 0.60) {
                                tile.id = getTileAtPosition(BIOME_TILES.grass, x, y);
                            } else if (roll < 0.85) {
                                tile.id = randomChoice(GRASS_FOLIAGE_TILES);
                            } else {
                                tile.id = randomChoice(GRASS_VARIED_TILES);
                            }
                        }
                    } else if (caseIndex === 15) {
                        // Pure sand
                        if (grassSandMapping && grassSandMapping[15]) {
                            tile.id = extractTileId(grassSandMapping[15], BIOME_TILES.sand, x, y);
                        } else {
                            tile.id = getTileAtPosition(BIOME_TILES.sand, x, y);
                        }
                    } else {
                        // Transition tile - use grass/sand mapping
                        tile.id = getTileForCase(caseIndex, x, y, !grassSandMapping, grassSandMapping);
                        tile.isTransition = true;
                        tile.caseIndex = caseIndex;
                        tile.transitionType = 'grass_sand';
                        transitionCount++;
                    }
                    continue;
                }
            }
            
            // For 3+ biomes at corners or no mapping found, use the tile's base biome
            const biomeTiles = BIOME_TILES[biome];
            if (biomeTiles) {
                tile.id = getTileAtPosition(biomeTiles, x, y);
            }
        }
    }
    
    console.log(`Applied ${transitionCount} Marching Squares transitions`);
    return transitionCount;
}

// Alias for compatibility
export function applyBoundaryTransitions(map, width, height, corners = null) {
    return apply8BitTransitions(map, width, height, corners);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export tile definitions for other modules
export const SAND_TILES = {
    pure: BIOME_TILES.sand,
    edgeN: '0x0039',
    edgeE: '0x003A',
    edgeS: '0x0037',
    edgeW: '0x0038',
    cornerNE: '0x003E',
    cornerSE: '0x003B',
    cornerSW: '0x003C',
    cornerNW: '0x003D',
    innerNE: '0x0036',
    innerSE: '0x0033',
    innerSW: '0x0034',
    innerNW: '0x0035',
};

export const GRASS_TILES = {
    pure: BIOME_TILES.grass,
    withFoliage: GRASS_FOLIAGE_TILES,
    varied: GRASS_VARIED_TILES,
    all: [...BIOME_TILES.grass, ...GRASS_FOLIAGE_TILES, ...GRASS_VARIED_TILES],
};

export const WATER_TILES = {
    pure: BIOME_TILES.water,
};

export { 
    GRASS_SAND_TILES, 
    SMOOTH_CURVE_TILES, 
    BIOME_TILES,
    GRASS_FOREST_TILES,
    GRASS_DIRT_TILES,
    GRASS_ROCK_TILES,
    FOREST_JUNGLE_TILES
};

// Legacy exports for compatibility
export function calculate8BitBitmask() { return 0; }
export function getSandToGrassTile() { return null; }
export function getTileFromLookup() { return null; }
export function getGrassToSandTile8Bit() { return null; }
export function getSandToGrassTile8Bit() { return null; }
export function getGrassToSandTransition() { return null; }
export function getSandToGrassTransition() { return null; }

export default { 
    apply8BitTransitions, 
    applyBoundaryTransitions, 
    generateCornerBiomesFromNoise,
    GRASS_SAND_TILES,
    DEFAULT_TRANSITION_MAPPINGS,
    BIOME_TILES
};
