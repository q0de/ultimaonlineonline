/**
 * UO Tile Sets - ENHANCED VERSION
 * Expanded to include more terrain variety for authentic UO Classic landscapes
 * 
 * KEY INSIGHT: UO tiles come in groups of 4 that tessellate together.
 * These are the PURE CENTER tiles - no edges or transitions.
 * 
 * IMPROVEMENTS based on UO Classic analysis:
 * 1. Multiple grass variants (plain, foliage, flowers)
 * 2. Multiple forest types (light, dark, with debris)
 * 3. Rock/mountain variations
 * 4. Cave floor types
 * 5. Lava and void terrains
 */

export const UO_TILE_SETS_CLEAN = {
    // =========================================================================
    // GRASS TILES - Multiple variants for natural variety
    // =========================================================================
    
    // Pure grass - the most basic green grass tiles
    'grass': [
        ['0x0003', '0x0004', '0x0005', '0x0006'],  // Basic green grass (primary)
    ],
    
    // Grass with foliage/leaves - for forested areas edges
    'grass_foliage': [
        ['0x00C0', '0x00C1', '0x00C2', '0x00C3'],  // Grass with fallen leaves/debris
    ],
    
    // Alternative grass - slightly different texture
    'grass_alt': [
        ['0x007D', '0x007E', '0x007F', '0x0003'],  // Varied grass textures
        ['0x01A4', '0x01A5', '0x01A6', '0x01A7'],  // Another grass variant
    ],
    
    // Light grass - brighter meadow grass
    'grass_light': [
        ['0x00D8', '0x00D9', '0x00DA', '0x00DB'],  // Lighter grass tones
    ],
    
    // =========================================================================
    // SAND TILES - Beach and desert
    // =========================================================================
    
    'sand': [
        ['0x0016', '0x0017', '0x0018', '0x0019'],  // Basic sand
    ],
    
    // Alternative sand - different texture
    'sand_alt': [
        ['0x011E', '0x011F', '0x0120', '0x0121'],  // Variant sand
        ['0x01A8', '0x01A9', '0x01AA', '0x01AB'],  // Another sand variant
    ],
    
    // =========================================================================
    // WATER TILES
    // =========================================================================
    
    'water': [
        ['0x00A8', '0x00A9', '0x00AA', '0x00AB'],  // Basic blue water
    ],
    
    // Lava water (red/orange)
    'water_lava': [
        ['0x0136', '0x0137', '0x0136', '0x0137'],  // Lava/hot water
    ],
    
    // =========================================================================
    // FOREST TILES - Multiple density levels
    // =========================================================================
    
    // Basic forest floor - medium density
    'forest': [
        ['0x00C4', '0x00C5', '0x00C6', '0x00C7'],  // Basic forest floor
    ],
    
    // Dense forest floor - darker
    'forest_dark': [
        ['0x00C8', '0x00C9', '0x00CA', '0x00CB'],  // Darker forest
        ['0x00CC', '0x00CD', '0x00CE', '0x00CF'],  // Very dense forest
    ],
    
    // Light forest floor
    'forest_light': [
        ['0x00D0', '0x00D1', '0x00D2', '0x00D3'],  // Lighter forest
        ['0x015D', '0x015E', '0x015F', '0x0160'],  // Another light variant
    ],
    
    // Forest with more debris/twigs
    'forest_debris': [
        ['0x00D4', '0x00D5', '0x00D6', '0x00D7'],  // Forest with fallen material
        ['0x00F0', '0x00F1', '0x00F2', '0x00F3'],  // More debris variant
    ],
    
    // =========================================================================
    // JUNGLE TILES - Tropical variants
    // =========================================================================
    
    'jungle': [
        ['0x00AC', '0x00AD', '0x00AE', '0x00AF'],  // Basic jungle
    ],
    
    'jungle_dense': [
        ['0x00B0', '0x00B3', '0x00B6', '0x00B9'],  // Denser jungle floor
        ['0x00BC', '0x00BD', '0x00BE', '0x00BF'],  // Very dense
    ],
    
    'jungle_alt': [
        ['0x0100', '0x0101', '0x0102', '0x0103'],  // Alternative jungle
        ['0x0108', '0x0109', '0x010A', '0x010B'],  // Another variant
        ['0x01F0', '0x01F1', '0x01F0', '0x01F1'],  // Sparse jungle variant
    ],
    
    // =========================================================================
    // DIRT TILES - Various earth types
    // =========================================================================
    
    // Basic brown dirt
    'dirt': [
        ['0x0071', '0x0072', '0x0073', '0x0074'],  // Basic brown dirt
    ],
    
    // Packed/hard dirt
    'dirt_packed': [
        ['0x0075', '0x0076', '0x0077', '0x0078'],  // Harder/packed dirt
        ['0x0079', '0x007A', '0x007B', '0x007C'],  // Variant packed dirt
    ],
    
    // Muddy/wet dirt
    'dirt_wet': [
        ['0x0082', '0x0083', '0x0085', '0x0086'],  // Wet/muddy dirt
        ['0x0087', '0x0088', '0x0089', '0x008A'],  // More mud
    ],
    
    // Light colored dirt
    'dirt_light': [
        ['0x00E8', '0x00E9', '0x00EA', '0x00EB'],  // Light brown dirt
        ['0x0141', '0x0142', '0x0143', '0x0144'],  // Another light dirt
    ],
    
    // Dark colored dirt  
    'dirt_dark': [
        ['0x014C', '0x014D', '0x014E', '0x014F'],  // Dark earth
        ['0x0169', '0x016A', '0x016B', '0x016C'],  // Very dark dirt
    ],
    
    // Cracked/dry dirt (like in image 3)
    'dirt_cracked': [
        ['0x01DC', '0x01DD', '0x01DE', '0x01DF'],  // Cracked dirt
        ['0x01E0', '0x01E1', '0x01E2', '0x01E3'],  // More cracked variants
    ],
    
    // =========================================================================
    // ROCK/MOUNTAIN TILES - For elevated terrain
    // =========================================================================
    
    // Basic grey rock
    'rock': [
        ['0x00E4', '0x00E5', '0x00E6', '0x00E7'],  // Basic grey rock
    ],
    
    // Dark mountain rock (like in image 1)
    'rock_dark': [
        ['0x00F4', '0x00F5', '0x00F6', '0x00F7'],  // Darker rock
        ['0x0104', '0x0105', '0x0106', '0x0107'],  // Dark mountain rock
    ],
    
    // Light rock/stone
    'rock_light': [
        ['0x0110', '0x0111', '0x0112', '0x0113'],  // Light grey rock
        ['0x0122', '0x0123', '0x0124', '0x0125'],  // Another light rock
    ],
    
    // Mountain face rock (high elevation)
    'rock_mountain': [
        ['0x01D3', '0x01D4', '0x01D5', '0x01D6'],  // Mountain rock face
        ['0x01D7', '0x01D8', '0x01D9', '0x01DA'],  // More mountain rock
    ],
    
    // Cliff/steep rock (for embankments)
    'rock_cliff': [
        ['0x09EC', '0x09ED', '0x09EE', '0x09EF'],  // Cliff face rock
        ['0x09F0', '0x09F1', '0x09F2', '0x09F3'],  // More cliff rock
    ],
    
    // =========================================================================
    // FURROWS - Plowed/farmed land
    // =========================================================================
    
    'furrows': [
        ['0x0009', '0x000A', '0x000B', '0x000C'],  // Basic furrows
    ],
    
    'furrows_alt': [
        ['0x000D', '0x000E', '0x000F', '0x0010'],  // Alternative furrows
        ['0x0150', '0x0151', '0x0152', '0x0153'],  // Another furrows variant
    ],
    
    // =========================================================================
    // CAVE TILES - Underground areas
    // =========================================================================
    
    // Basic cave floor
    'cave': [
        ['0x0245', '0x0246', '0x0247', '0x0248'],  // Cave floor
    ],
    
    // Dark cave (deeper areas)
    'cave_dark': [
        ['0x0249', '0x024A', '0x024B', '0x024C'],  // Dark cave floor
        ['0x02BC', '0x02BD', '0x02BE', '0x02BF'],  // Very dark cave
    ],
    
    // Cave with debris
    'cave_debris': [
        ['0x024D', '0x024E', '0x024F', '0x0250'],  // Cave with rocks
        ['0x063B', '0x063C', '0x063D', '0x063E'],  // Cave variant
    ],
    
    // =========================================================================
    // SNOW TILES - Winter/mountain top
    // =========================================================================
    
    'snow': [
        ['0x011A', '0x011B', '0x011C', '0x011D'],  // Basic snow
    ],
    
    'snow_packed': [
        ['0x010C', '0x010D', '0x010E', '0x010F'],  // Hard packed snow
        ['0x0114', '0x0115', '0x0116', '0x0117'],  // Ice/hard snow
    ],
    
    'snow_light': [
        ['0x012E', '0x012F', '0x0130', '0x0131'],  // Light/fresh snow
        ['0x0179', '0x017A', '0x017B', '0x017C'],  // Powder snow
    ],
    
    // =========================================================================
    // SPECIAL TERRAIN
    // =========================================================================
    
    // Lava (dangerous terrain)
    'lava': [
        ['0x01F4', '0x01F5', '0x01F6', '0x01F7'],  // Molten lava
    ],
    
    // Void (impassable/edge of world)
    'void': [
        ['0x01FA', '0x01FB', '0x01FC', '0x01FD'],  // Black void
        ['0x01FE', '0x01FF', '0x01FE', '0x01FF'],  // Pure void
    ],
};

// =========================================================================
// BIOME VARIANT WEIGHTS - How often each variant appears
// =========================================================================
export const BIOME_VARIANT_WEIGHTS = {
    'grass': {
        'grass': 0.60,           // Basic grass - most common
        'grass_foliage': 0.20,   // Grass with leaves - near forests
        'grass_alt': 0.10,       // Alternative texture - variety
        'grass_light': 0.10,     // Light grass - meadows
    },
    'forest': {
        'forest': 0.40,          // Basic forest
        'forest_dark': 0.20,     // Dense forest interior
        'forest_light': 0.25,    // Forest edges
        'forest_debris': 0.15,   // Forest with debris
    },
    'jungle': {
        'jungle': 0.50,          // Basic jungle
        'jungle_dense': 0.30,    // Dense jungle
        'jungle_alt': 0.20,      // Variants
    },
    'dirt': {
        'dirt': 0.40,            // Basic dirt
        'dirt_packed': 0.20,     // Hard dirt - paths
        'dirt_wet': 0.15,        // Near water
        'dirt_light': 0.15,      // Dry areas
        'dirt_dark': 0.10,       // Shaded areas
    },
    'rock': {
        'rock': 0.40,            // Basic rock
        'rock_dark': 0.25,       // Mountain sides
        'rock_light': 0.15,      // Exposed areas
        'rock_mountain': 0.20,   // High elevation
    },
    'sand': {
        'sand': 0.70,            // Basic sand
        'sand_alt': 0.30,        // Variety
    },
    'snow': {
        'snow': 0.50,            // Basic snow
        'snow_packed': 0.30,     // Older snow
        'snow_light': 0.20,      // Fresh snow
    },
    'cave': {
        'cave': 0.50,            // Basic cave
        'cave_dark': 0.30,       // Deep cave
        'cave_debris': 0.20,     // Cave with rocks
    },
};

// =========================================================================
// DYNAMIC SET GENERATION
// =========================================================================

/**
 * Initialize dynamic tile sets from loaded data
 * Merges discovered sets with the hardcoded ones
 * @param {Object} discoveredSets - Sets generated by LandTileLoader
 */
export function initializeDynamicSets(discoveredSets) {
    console.log('[UO_TILE_SETS_CLEAN] Initializing dynamic sets...');
    
    // Merge discovered sets into the main collection
    for (const [category, sets] of Object.entries(discoveredSets)) {
        if (sets && sets.length > 0) {
            // If we have this category, add the new sets to it
            // We prefer to APPEND them to the 'basic' variant (e.g. 'grass', 'dirt')
            // This dramatically increases variety for the base biomes
            
            if (UO_TILE_SETS_CLEAN[category]) {
                // Filter out sets that are already present (by checking first ID)
                const existingFirstIds = new Set();
                UO_TILE_SETS_CLEAN[category].forEach(set => existingFirstIds.add(set[0]));
                
                // Also check variants
                if (category === 'grass') {
                    UO_TILE_SETS_CLEAN['grass_alt'].forEach(set => existingFirstIds.add(set[0]));
                    UO_TILE_SETS_CLEAN['grass_light'].forEach(set => existingFirstIds.add(set[0]));
                }
                
                let addedCount = 0;
                sets.forEach(set => {
                    if (!existingFirstIds.has(set[0])) {
                        UO_TILE_SETS_CLEAN[category].push(set);
                        addedCount++;
                    }
                });
                
                console.log(`[UO_TILE_SETS_CLEAN] Added ${addedCount} new sets to '${category}'`);
            } else {
                // New category entirely
                UO_TILE_SETS_CLEAN[category] = sets;
                console.log(`[UO_TILE_SETS_CLEAN] Created new category '${category}' with ${sets.length} sets`);
            }
        }
    }
}

/**
 * Get a tile from a clean tile set using position-based indexing
 * This ensures adjacent tiles use different tiles from the same set for proper tessellation
 * 
 * @param {string} biome - The biome type (grass, sand, forest, etc.)
 * @param {number} x - X position on map
 * @param {number} y - Y position on map
 * @param {boolean} useVariants - Whether to randomly pick a variant (default: false for backwards compat)
 */
export function getCleanTileAtPosition(biome, x, y, useVariants = false) {
    // For rock biome, check saved patterns
    if (biome === 'rock') {
        // Try rock_mountain pattern first (Mountain/Rock in dropdown)
        const mtnPattern = getBlobPatternTile('rock_mountain', x, y);
        if (mtnPattern) return mtnPattern;
        
        // Then try rock pattern (Grey Rock in dropdown)
        const rockPattern = getBlobPatternTile('rock', x, y);
        if (rockPattern) return rockPattern;
    }
    
    // Check for user-defined blob pattern (other biomes)
    const patternTile = getBlobPatternTile(biome, x, y);
    if (patternTile) return patternTile;
    
    let sets = UO_TILE_SETS_CLEAN[biome];
    
    // If using variants, pick a weighted random variant
    if (useVariants && BIOME_VARIANT_WEIGHTS[biome]) {
        const variant = pickWeightedVariant(biome, x, y);
        const variantSets = UO_TILE_SETS_CLEAN[variant];
        // Only use variant if it exists
        if (variantSets && variantSets.length > 0) {
            sets = variantSets;
        }
    }
    
    if (!sets || sets.length === 0) {
        console.warn(`No clean tile set for biome: ${biome}, using grass`);
        return UO_TILE_SETS_CLEAN['grass'][0][0];
    }
    
    // Pick which tile set to use based on position (for larger-scale variation)
    // This creates regions that use the same tile set
    const setIndex = Math.floor(((x * 7 + y * 13) % 1000) / 1000 * sets.length);
    const set = sets[Math.min(setIndex, sets.length - 1)];
    
    if (!set || set.length === 0) {
        console.warn(`Empty tile set for biome: ${biome}, using grass`);
        return UO_TILE_SETS_CLEAN['grass'][0][0];
    }
    
    // Use position to pick which of the 4 tiles to use
    // This creates a 2x2 repeating pattern that tessellates perfectly
    const tileIndex = ((x % 2) + (y % 2) * 2) % set.length;
    
    const tile = set[tileIndex];
    if (!tile) {
        console.warn(`No tile at index ${tileIndex} for biome: ${biome}, using grass`);
        return UO_TILE_SETS_CLEAN['grass'][0][0];
    }
    
    return tile;
}

/**
 * Pick a variant based on weighted probability
 * Uses position-based pseudo-random for consistency
 */
function pickWeightedVariant(biome, x, y) {
    const weights = BIOME_VARIANT_WEIGHTS[biome];
    if (!weights) return biome;
    
    // Position-based pseudo-random (consistent for same position)
    const noise = ((x * 17 + y * 31 + x * y * 13) % 1000) / 1000;
    
    let cumulative = 0;
    for (const [variant, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (noise < cumulative) {
            return variant;
        }
    }
    
    // Fallback to first variant
    return Object.keys(weights)[0];
}

/**
 * Get a tile specifically for grass with foliage (near forests)
 */
export function getGrassFoliageTile(x, y) {
    const set = UO_TILE_SETS_CLEAN['grass_foliage'][0];
    const tileIndex = ((x % 2) + (y % 2) * 2) % set.length;
    return set[tileIndex];
}

/**
 * Get a tile specifically for dark forest (interior)
 */
export function getDarkForestTile(x, y) {
    const sets = UO_TILE_SETS_CLEAN['forest_dark'];
    if (!sets || sets.length === 0) {
        return getCleanTileAtPosition('forest', x, y);
    }
    const setIndex = Math.floor(((x * 7 + y * 13) % 100) / 100 * sets.length);
    const set = sets[Math.min(setIndex, sets.length - 1)];
    if (!set || set.length === 0) {
        return getCleanTileAtPosition('forest', x, y);
    }
    const tileIndex = ((x % 2) + (y % 2) * 2) % set.length;
    return set[tileIndex] || getCleanTileAtPosition('forest', x, y);
}

/**
 * Get a tile from a saved blob pattern (4x4 tessellation)
 * Patterns are saved in localStorage by the Blob Pattern Configurator
 * @param {string} biome - The biome key (e.g., 'rock_mountain', 'grass', 'dirt')
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number|null} Tile ID if pattern exists, null otherwise
 */
export function getBlobPatternTile(biome, x, y) {
    try {
        const patterns = JSON.parse(localStorage.getItem('blobPatterns') || '{}');
        const pattern = patterns[biome];
        
        // Debug: log what keys exist on first call
        if (!getBlobPatternTile._keysLogged) {
            console.log('[BlobPattern] Available keys in localStorage:', Object.keys(patterns));
            console.log('[BlobPattern] rock (Grey Rock) pattern exists:', !!patterns['rock']);
            console.log('[BlobPattern] rock_mountain pattern exists:', !!patterns['rock_mountain']);
            getBlobPatternTile._keysLogged = true;
        }
        
        if (pattern && pattern.length === 16) {
            // Use 4x4 pattern tiled across the blob
            const patternX = ((x % 4) + 4) % 4; // Handle negative coords
            const patternY = ((y % 4) + 4) % 4;
            const tileId = pattern[patternY * 4 + patternX];
            
            if (tileId && tileId !== '0x0000') {
                // Convert hex string to integer
                const result = parseInt(tileId.replace('0x', ''), 16);
                // Debug: log first time each pattern type is used
                const logKey = `_logged_${biome}`;
                if (!getBlobPatternTile[logKey]) {
                    console.log(`[BlobPattern] Using saved ${biome} pattern! Tile at (${x},${y}) = ${tileId}`);
                    getBlobPatternTile[logKey] = true;
                }
                return result;
            }
        }
    } catch (e) {
        console.warn('[getBlobPatternTile] Error loading pattern:', e);
    }
    return null; // No pattern found
}

/**
 * Get a tile specifically for mountain rock
 * Now checks for saved blob patterns first
 */
export function getMountainRockTile(x, y) {
    // Check for saved blob pattern first
    const patternTile = getBlobPatternTile('rock_mountain', x, y);
    if (patternTile) return patternTile;
    
    // Fallback to original behavior
    const sets = UO_TILE_SETS_CLEAN['rock_mountain'];
    if (!sets || sets.length === 0) {
        return getCleanTileAtPosition('rock', x, y);
    }
    const setIndex = Math.floor(((x * 7 + y * 13) % 100) / 100 * sets.length);
    const set = sets[Math.min(setIndex, sets.length - 1)];
    if (!set || set.length === 0) {
        return getCleanTileAtPosition('rock', x, y);
    }
    const tileIndex = ((x % 2) + (y % 2) * 2) % set.length;
    return set[tileIndex] || getCleanTileAtPosition('rock', x, y);
}

/**
 * Get a tile based on context (neighbors, elevation, moisture)
 * This provides more intelligent tile selection for authentic UO look
 * Now checks for user-defined blob patterns first
 */
export function getContextualTile(biome, x, y, context = {}) {
    const { 
        nearForest = false, 
        nearWater = false, 
        elevation = 0.5,
        moisture = 0.5,
        isInterior = false 
    } = context;
    
    // For rock biome, check saved patterns
    if (biome === 'rock') {
        // Try rock_mountain pattern first (Mountain/Rock in dropdown)
        const mtnPattern = getBlobPatternTile('rock_mountain', x, y);
        if (mtnPattern) return mtnPattern;
        
        // Then try rock pattern (Grey Rock in dropdown)
        const rockPattern = getBlobPatternTile('rock', x, y);
        if (rockPattern) return rockPattern;
    }
    
    // Check for user-defined blob pattern (other biomes)
    const patternTile = getBlobPatternTile(biome, x, y);
    if (patternTile) return patternTile;

    // Grass near forest should use foliage variant
    if (biome === 'grass' && nearForest) {
        const roll = ((x * 11 + y * 23) % 100) / 100;
        if (roll < 0.4) {
            return getCleanTileAtPosition('grass_foliage', x, y);
        }
    }
    
    // Forest interior should be darker
    if (biome === 'forest' && isInterior) {
        const roll = ((x * 17 + y * 29) % 100) / 100;
        if (roll < 0.6) {
            const tile = getDarkForestTile(x, y);
            if (tile) return tile;
        }
    }
    
    // Rock at high elevation should use mountain variant
    if (biome === 'rock' && elevation > 0.8) {
        const tile = getMountainRockTile(x, y);
        if (tile) return tile;
    }
    
    // Dirt near water should be wetter
    if (biome === 'dirt' && nearWater) {
        const sets = UO_TILE_SETS_CLEAN['dirt_wet'];
        if (sets && sets.length > 0) {
            const setIndex = Math.floor(((x * 7 + y * 13) % 100) / 100 * sets.length);
            const set = sets[Math.min(setIndex, sets.length - 1)];
            if (set && set.length > 0) {
                const tileIndex = ((x % 2) + (y % 2) * 2) % set.length;
                if (set[tileIndex]) return set[tileIndex];
            }
        }
    }
    
    // Default: use basic variant with random variation
    return getCleanTileAtPosition(biome, x, y, true);
}

export default UO_TILE_SETS_CLEAN;
