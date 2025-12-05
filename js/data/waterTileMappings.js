/**
 * Water Tile Mappings for UO Terrain Generator
 * 
 * These mappings are configured via the Biome Edge Configurator (biome_edge_configurator.html)
 * Each mapping specifies which tile to use for a specific water transition scenario.
 * 
 * Scenario types:
 * - shallow_*: Smooth water-to-land transitions (no height difference, no cliff)
 * - cliff_*: Embankment transitions with height difference (cliff/wall effect)
 * - water_*: Pure water tiles for variety
 * - rock_grass_*: Rock to grass transitions
 * - sand_grass_*: Sand to grass transitions
 * - etc.
 */

// Default mappings - these are always available even if localStorage is empty
export const DEFAULT_WATER_TILE_MAPPINGS = {
    // ============ WATER CLIFF TRANSITIONS ============
    cliff_north: '0x098C',
    cliff_south: '0x0994',
    cliff_east: '0x0990',
    cliff_west: '0x0988',
    cliff_corner_ne: '0x099C',
    cliff_corner_nw: '0x0998',
    cliff_corner_se: '0x09A0',
    cliff_corner_sw: '0x099C',
    cliff_inner_ne: '0x0997',
    cliff_inner_nw: '0x0996',
    cliff_inner_se: '0x098D',
    cliff_inner_sw: '0x098E',
    
    // ============ WATER SHALLOW TRANSITIONS ============
    shallow_north: '0x00A8',
    shallow_south: '0x00A8',
    shallow_east: '0x00A8',
    shallow_west: '0x00A8',
    shallow_corner_ne: '0x00A8',
    shallow_corner_nw: '0x00A8',
    shallow_corner_se: '0x00A8',
    shallow_corner_sw: '0x00A8',
    
    // ============ TERRAIN TRANSITIONS ============
    // These are intentionally left EMPTY - user must configure via Tile Teacher
    // Using placeholder tiles causes black squares if the tile ID doesn't exist
    // rock_grass_*, sand_grass_*, forest_grass_*, dirt_grass_* should be configured by user
    
    // ============ WATER VARIETY TILES ============
    water_center: '0x00A8',
    water_variant1: '0x00A9',
    water_variant2: '0x00AA',
};

// Water edge configuration
export const WATER_EDGE_CONFIG = {
    // Chance of shallow vs cliff (0-1)
    // 0.15 = 15% shallow (rare), 85% cliff (most common)
    shallowChance: 0.15,
    
    // Z-height for cliff edges (higher = taller cliff)
    cliffZHeight: 3,
    
    // Z-height for shallow edges (minimal or no height difference)
    shallowZHeight: 1,
    
    // Pixels per Z unit for rendering
    pixelsPerZ: 2,
};

/**
 * Get water tile mappings (merges defaults with user selections from localStorage)
 */
export function getWaterTileMappings() {
    // Try to load user mappings from localStorage (only works in browser)
    let userMappings = {};
    
    if (typeof localStorage !== 'undefined') {
        try {
            // Check both old key (waterTileMappings) and new key (terrainTileMappings)
            const storedOld = localStorage.getItem('waterTileMappings');
            const storedNew = localStorage.getItem('terrainTileMappings');
            
            if (storedOld) {
                userMappings = { ...userMappings, ...JSON.parse(storedOld) };
            }
            if (storedNew) {
                userMappings = { ...userMappings, ...JSON.parse(storedNew) };
            }
            
            if (Object.keys(userMappings).length > 0) {
                console.log('Loaded user tile mappings:', Object.keys(userMappings).length, 'entries');
            }
        } catch (e) {
            console.warn('Failed to load water tile mappings from localStorage:', e);
        }
    }
    
    // Merge defaults with user mappings (user overrides defaults)
    return { ...DEFAULT_WATER_TILE_MAPPINGS, ...userMappings };
}

/**
 * Get the appropriate tile ID for a water edge scenario
 * 
 * @param {string} scenarioId - The scenario identifier (e.g., 'cliff_north', 'shallow_east')
 * @param {Object} mappings - The tile mappings object
 * @returns {string|null} - The tile ID or null if not configured
 */
export function getWaterTileForScenario(scenarioId, mappings = null) {
    const m = mappings || getWaterTileMappings();
    return m[scenarioId] || null;
}

/**
 * Determine the scenario ID based on water neighbor positions
 * 
 * @param {boolean} isShallow - Whether this is a shallow edge (vs cliff)
 * @param {Object} waterNeighbors - { north, south, east, west } booleans
 * @returns {string} - The scenario ID
 */
export function determineWaterScenario(isShallow, waterNeighbors) {
    const { north, south, east, west } = waterNeighbors;
    const prefix = isShallow ? 'shallow' : 'cliff';
    
    // Count water neighbors
    const count = [north, south, east, west].filter(Boolean).length;
    
    // Single direction
    if (count === 1) {
        if (north) return `${prefix}_north`;
        if (south) return `${prefix}_south`;
        if (east) return `${prefix}_east`;
        if (west) return `${prefix}_west`;
    }
    
    // Corner (two adjacent directions)
    if (count === 2) {
        if (north && east) return `${prefix}_corner_ne`;
        if (north && west) return `${prefix}_corner_nw`;
        if (south && east) return `${prefix}_corner_se`;
        if (south && west) return `${prefix}_corner_sw`;
    }
    
    // Inner corner / peninsula (water on three sides)
    if (count === 3 && !isShallow) {
        if (!north) return 'cliff_inner_sw'; // Water on S, E, W
        if (!south) return 'cliff_inner_ne'; // Water on N, E, W
        if (!east) return 'cliff_inner_nw';  // Water on N, S, W
        if (!west) return 'cliff_inner_se';  // Water on N, S, E
    }
    
    // Default to single direction based on first found
    if (north) return `${prefix}_north`;
    if (south) return `${prefix}_south`;
    if (east) return `${prefix}_east`;
    if (west) return `${prefix}_west`;
    
    return null;
}

/**
 * Decide if a water edge should be shallow or cliff
 * Uses weighted random with configurable chance
 * 
 * @param {number} shallowChance - Probability of shallow (0-1)
 * @returns {boolean} - True if shallow, false if cliff
 */
export function shouldBeShallowEdge(shallowChance = WATER_EDGE_CONFIG.shallowChance) {
    return Math.random() < shallowChance;
}

/**
 * Get biome edge patterns for 3x3 pattern matching
 * These are saved by biome_edge_configurator.html
 * @returns {Array} Array of pattern objects with shape and centerTileId
 */
export function getBiomeEdgePatterns() {
    if (typeof localStorage === 'undefined') return [];
    
    try {
        const stored = localStorage.getItem('biomeEdgePatterns');
        if (stored) {
            const patterns = JSON.parse(stored);
            // Check if patterns have the new positionTiles format
            const hasPositions = patterns.length > 0 && patterns[0].positionTiles;
            console.log(`[PatternMatcher] Loaded ${patterns.length} 3x3 patterns from biomeEdgePatterns`);
            console.log(`[PatternMatcher] Pattern format: ${hasPositions ? 'NEW (positionTiles)' : 'OLD (centerTileId only)'}`);
            if (hasPositions && patterns.length > 0) {
                console.log(`[PatternMatcher] Sample positionTiles:`, patterns[0].positionTiles);
            }
            return patterns;
        }
    } catch (e) {
        console.warn('Failed to load biome edge patterns:', e);
    }
    
    return [];
}

/**
 * Get the 3x3 neighborhood biomes around a tile
 * @param {Array} map - The terrain map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Array<Array<string>>} 3x3 array of biome types
 */
export function get3x3Neighborhood(map, x, y) {
    const neighborhood = [];
    
    for (let dy = -1; dy <= 1; dy++) {
        const row = [];
        for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            // Check bounds
            if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
                row.push(map[ny][nx].biome || 'unknown');
            } else {
                // Out of bounds - use edge biome or center biome
                row.push(map[y][x].biome || 'unknown');
            }
        }
        neighborhood.push(row);
    }
    
    return neighborhood;
}

/**
 * Convert a 3x3 neighborhood to a binary pattern
 * @param {Array<Array<string>>} neighborhood - The 3x3 biome neighborhood
 * @param {string} centerBiome - The biome we consider "1" (primary biome)
 * @param {string} otherBiome - The biome we consider "0" (secondary biome)
 * @returns {Array<Array<number|string>>} Binary pattern (1 = center biome, 0 = other, E = edge)
 */
export function toBinaryPattern(neighborhood, centerBiome, otherBiome = null) {
    return neighborhood.map((row, rowIdx) => 
        row.map((biome, colIdx) => {
            // Mark center as 'E' for edge
            if (rowIdx === 1 && colIdx === 1) return 'E';
            
            // If biome matches center biome, it's 1
            if (biome === centerBiome) return 1;
            
            // Otherwise it's 0 (the "other" biome)
            return 0;
        })
    );
}

/**
 * Create a pattern key string from a binary pattern
 * @param {Array<Array<number|string>>} binaryPattern 
 * @returns {string} Pattern key for matching (e.g., "11E_10E_000")
 */
export function patternToKey(binaryPattern) {
    return binaryPattern.map(row => row.join('')).join('_');
}

/**
 * Find a matching pattern from saved patterns
 * @param {string} actualPatternKey - The actual 3x3 pattern key from the map
 * @param {Array} savedPatterns - Array of saved pattern objects
 * @param {string} setName - The biome transition set to match (e.g., 'rock_grass')
 * @returns {Object|null} Matching pattern with centerTileId, or null if no match
 */
export function findMatchingPattern(actualPatternKey, savedPatterns, setName = null) {
    // Filter patterns by set name if provided
    const relevantPatterns = setName 
        ? savedPatterns.filter(p => p.setName === setName)
        : savedPatterns;
    
    for (const pattern of relevantPatterns) {
        if (pattern.patternKey === actualPatternKey) {
            return pattern;
        }
    }
    
    return null;
}

/**
 * Determine which position in a 3x3 pattern grid a tile should use
 * based on which of its neighbors are the "other" biome.
 * 
 * IMPROVED: Uses weighted direction vectors to determine the PRIMARY edge direction.
 * This prevents adjacent tiles from flip-flopping between W/E or N/S.
 * 
 * Pattern grid positions:
 *   NW  N   NE   (top row - typically "other" biome side)
 *   W   C   E    (middle row - edge/transition)
 *   SW  S   SE   (bottom row - typically "main" biome side)
 * 
 * @param {Object} neighbors - { n, s, e, w, ne, nw, se, sw } booleans for "is target biome"
 * @param {boolean} iAmMainBiome - true if this tile is the main biome, false if other
 * @returns {string} Position name: 'NW', 'N', 'NE', 'W', 'CENTER', 'E', 'SW', 'S', 'SE'
 */
export function determinePatternPosition(neighbors, iAmMainBiome) {
    const { n, s, e, w, ne, nw, se, sw } = neighbors;
    
    // Calculate weighted direction vector towards the target biome
    // Positive dirX = target is EAST, Positive dirY = target is SOUTH
    // Cardinals have weight 2, diagonals have weight 1
    let dirX = 0, dirY = 0;
    
    if (n)  dirY -= 2;
    if (s)  dirY += 2;
    if (e)  dirX += 2;
    if (w)  dirX -= 2;
    if (ne) { dirX += 1; dirY -= 1; }
    if (nw) { dirX -= 1; dirY -= 1; }
    if (se) { dirX += 1; dirY += 1; }
    if (sw) { dirX -= 1; dirY += 1; }
    
    // No neighbors found
    if (dirX === 0 && dirY === 0) return 'CENTER';
    
    const absX = Math.abs(dirX);
    const absY = Math.abs(dirY);
    
    // Determine if this is a corner (significant direction in both axes)
    // Threshold: if both axes have weight >= 2, it's a true corner
    const isCorner = absX >= 2 && absY >= 2;
    
    // Determine the primary direction
    let primaryDir;
    
    if (isCorner) {
        // True corner - target biome is diagonal
        if (dirX > 0 && dirY < 0) primaryDir = 'NE';      // Target is northeast
        else if (dirX < 0 && dirY < 0) primaryDir = 'NW'; // Target is northwest
        else if (dirX > 0 && dirY > 0) primaryDir = 'SE'; // Target is southeast
        else primaryDir = 'SW';                            // Target is southwest
    } else if (absX > absY) {
        // Primarily horizontal edge - target is E or W
        primaryDir = dirX > 0 ? 'E' : 'W';
    } else if (absY > absX) {
        // Primarily vertical edge - target is N or S
        primaryDir = dirY > 0 ? 'S' : 'N';
    } else {
        // Equal weight - use cardinal if available, otherwise diagonal
        if (n) primaryDir = 'N';
        else if (s) primaryDir = 'S';
        else if (e) primaryDir = 'E';
        else if (w) primaryDir = 'W';
        else if (ne) primaryDir = 'NE';
        else if (nw) primaryDir = 'NW';
        else if (se) primaryDir = 'SE';
        else if (sw) primaryDir = 'SW';
        else primaryDir = 'CENTER';
    }
    
    // Now map from "where target is" to "what position I should use"
    // I use the OPPOSITE position from where the target biome is
    const oppositeMap = {
        'N': 'S',   'S': 'N',   'E': 'W',   'W': 'E',
        'NE': 'SW', 'NW': 'SE', 'SE': 'NW', 'SW': 'NE',
        'CENTER': 'CENTER'
    };
    
    return oppositeMap[primaryDir] || 'CENTER';
}

/**
 * Get the tile ID from a pattern for a specific position
 * @param {Object} pattern - The pattern object with positionTiles
 * @param {string} position - Position name: 'NW', 'N', 'NE', etc.
 * @returns {string|null} Tile ID or null if not found
 */
export function getPatternTileForPosition(pattern, position) {
    if (!pattern || !pattern.positionTiles) {
        // Fallback to center tile if positionTiles not available
        return pattern?.centerTileId || null;
    }
    
    return pattern.positionTiles[position] || pattern.centerTileId;
}

/**
 * Match a tile's neighborhood against saved patterns and return the appropriate tile ID
 * This is the main entry point for POSITION-BASED 3x3 pattern matching
 * 
 * Each tile checks its neighbors and picks the corresponding tile from the pattern
 * based on its position relative to the biome edge (NW, N, NE, W, CENTER, E, SW, S, SE)
 * 
 * @param {Array} map - The terrain map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} tile - The tile at (x, y)
 * @param {Array} savedPatterns - Array of saved pattern objects
 * @returns {Object|null} { tileId, pattern, position, patternKey } if match found, null otherwise
 */
export function matchTilePattern(map, x, y, tile, savedPatterns) {
    if (!savedPatterns || savedPatterns.length === 0) return null;
    
    // Get the 3x3 neighborhood biomes
    const neighborhood = get3x3Neighborhood(map, x, y);
    const centerBiome = tile.biome;
    
    // Neighborhood layout:
    // [0][0]=NW  [0][1]=N   [0][2]=NE
    // [1][0]=W   [1][1]=C   [1][2]=E
    // [2][0]=SW  [2][1]=S   [2][2]=SE
    
    // Group saved patterns by set name
    const patternsBySet = {};
    for (const pattern of savedPatterns) {
        if (!patternsBySet[pattern.setName]) {
            patternsBySet[pattern.setName] = [];
        }
        patternsBySet[pattern.setName].push(pattern);
    }
    
    // Check each biome pair set
    for (const [setName, patterns] of Object.entries(patternsBySet)) {
        const [biomeA, biomeB] = setName.split('_');
        
        // ONLY apply transitions to the MAIN biome (biomeA), not both sides
        // This ensures only ONE layer of transitions at the boundary
        // e.g., for rock_grass: only rock tiles get transitions, grass stays pure
        if (centerBiome !== biomeA) {
            continue;
        }
        
        // biomeA is the "main" biome that gets transitions (e.g., rock in rock_grass)
        const mainBiome = biomeA;
        const otherBiome = biomeB;
        const iAmMainBiome = true; // We now only process main biome tiles
        
        // Build neighbor flags - check for the OPPOSITE biome
        // If I'm rock (main biome), I want to know where grass (other) is
        // If I'm grass (other biome), I want to know where rock (main) is
        const biomeToFind = iAmMainBiome ? otherBiome : mainBiome;
        const neighbors = {
            nw: neighborhood[0][0] === biomeToFind,
            n:  neighborhood[0][1] === biomeToFind,
            ne: neighborhood[0][2] === biomeToFind,
            w:  neighborhood[1][0] === biomeToFind,
            e:  neighborhood[1][2] === biomeToFind,
            sw: neighborhood[2][0] === biomeToFind,
            s:  neighborhood[2][1] === biomeToFind,
            se: neighborhood[2][2] === biomeToFind
        };
        
        // Check if ANY neighbor (including diagonal) is the opposite biome
        // This ensures corner tiles at diagonal boundaries get transitions too
        const hasCardinalNeighbor = neighbors.n || neighbors.s || neighbors.e || neighbors.w;
        const hasDiagonalNeighbor = neighbors.nw || neighbors.ne || neighbors.sw || neighbors.se;
        const hasAnyNeighbor = hasCardinalNeighbor || hasDiagonalNeighbor;
        
        if (!hasAnyNeighbor) continue;
        
        // Determine which position in the pattern this tile should use
        const position = determinePatternPosition(neighbors, iAmMainBiome);
        
        // Find a matching pattern for this biome pair
        // We look for patterns that match the general direction
        // For now, use the first pattern in the set that has the position tile defined
        for (const pattern of patterns) {
            const tileId = getPatternTileForPosition(pattern, position);
            if (tileId && tileId !== '0x0000') {
                return {
                    tileId: tileId,
                    pattern: pattern,
                    position: position,
                    patternKey: pattern.patternKey
                };
            }
        }
    }
    
    return null;
}

/**
 * STAMP-BASED 3x3 Pattern Application
 * 
 * Instead of each tile independently choosing a position, this places
 * complete 3x3 stamps as coherent units along biome edges.
 * 
 * @param {Array} map - The terrain map (will be modified in place)
 * @param {Array} savedPatterns - Array of saved pattern objects
 * @returns {number} Number of stamps placed
 */
export function applyStampBasedTransitions(map, savedPatterns) {
    if (!savedPatterns || savedPatterns.length === 0) return 0;
    
    const height = map.length;
    const width = map[0].length;
    
    // Group patterns by set name
    const patternsBySet = {};
    for (const pattern of savedPatterns) {
        if (!patternsBySet[pattern.setName]) {
            patternsBySet[pattern.setName] = [];
        }
        patternsBySet[pattern.setName].push(pattern);
    }
    
    // Log available patterns
    console.log('[StampTransitions] Available patterns by set:');
    for (const [setName, patterns] of Object.entries(patternsBySet)) {
        const directionIds = patterns.map(p => p.directionId || 'unknown');
        console.log(`  ${setName}: ${directionIds.join(', ')}`);
    }
    
    // Track which tiles have been stamped (to avoid overlapping)
    const stamped = new Set();
    const stampCenters = new Set();  // Track stamp CENTER positions for spacing
    let stampCount = 0;
    
    // Define biome pairs (biomeA gets the transition tiles)
    const BIOME_PAIRS = [
        { a: 'rock', b: 'grass', setName: 'rock_grass' },
        { a: 'sand', b: 'grass', setName: 'sand_grass' },
        { a: 'dirt', b: 'grass', setName: 'dirt_grass' },
        { a: 'forest', b: 'grass', setName: 'forest_grass' },
    ];
    
    // Scan for edge tiles and place stamps
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const tile = map[y][x];
            const key = `${x},${y}`;
            
            // Skip if already stamped
            if (stamped.has(key)) continue;
            
            for (const pair of BIOME_PAIRS) {
                // Only process biomeA tiles
                if (tile.biome !== pair.a) continue;
                
                // Check if we have patterns for this pair
                const patterns = patternsBySet[pair.setName];
                if (!patterns || patterns.length === 0) continue;
                
                // Check ALL neighbors for biomeB (including diagonal)
                const north = map[y - 1]?.[x];
                const south = map[y + 1]?.[x];
                const east = map[y]?.[x + 1];
                const west = map[y]?.[x - 1];
                const ne = map[y - 1]?.[x + 1];
                const nw = map[y - 1]?.[x - 1];
                const se = map[y + 1]?.[x + 1];
                const sw = map[y + 1]?.[x - 1];
                
                const hasN = north?.biome === pair.b;
                const hasS = south?.biome === pair.b;
                const hasE = east?.biome === pair.b;
                const hasW = west?.biome === pair.b;
                const hasNE = ne?.biome === pair.b;
                const hasNW = nw?.biome === pair.b;
                const hasSE = se?.biome === pair.b;
                const hasSW = sw?.biome === pair.b;
                
                // Skip if not on an edge (check all 8 neighbors)
                const hasAnyNeighbor = hasN || hasS || hasE || hasW || hasNE || hasNW || hasSE || hasSW;
                if (!hasAnyNeighbor) continue;
                
                // Determine primary edge direction (pass all 8 directions)
                const direction = getStampDirection(hasN, hasS, hasE, hasW, hasNE, hasNW, hasSE, hasSW);
                
                // DEBUG: Log direction detection
                console.log(`[Stamp Debug] Tile (${x},${y}): neighbors=[N:${hasN}, S:${hasS}, E:${hasE}, W:${hasW}, NE:${hasNE}, NW:${hasNW}, SE:${hasSE}, SW:${hasSW}] -> direction=${direction}`);
                
                // Find the pattern that matches this direction
                // Patterns have directionId like "rock_grass_north", "rock_grass_east", etc.
                // Direction can be N, S, E, W, NE, NW, SE, SW
                const directionMap = {
                    'N': 'north', 'S': 'south', 'E': 'east', 'W': 'west',
                    'NE': 'ne', 'NW': 'nw', 'SE': 'se', 'SW': 'sw'
                };
                const fullDirection = directionMap[direction] || direction.toLowerCase();
                
                let matchingPattern = patterns.find(p => {
                    const patternDir = (p.directionId || '').toLowerCase();
                    // Match cardinal directions (north, south, east, west)
                    if (patternDir.endsWith('_' + fullDirection)) return true;
                    // Match corner patterns (corner_ne, corner_sw, etc.)
                    if (patternDir.includes('corner_' + fullDirection)) return true;
                    // Match inner patterns (inner_ne, inner_sw, etc.)
                    if (patternDir.includes('inner_' + fullDirection)) return true;
                    return false;
                });
                
                // DEBUG: Log pattern matching
                const availablePatterns = patterns.map(p => p.directionId).join(', ');
                const matchResult = matchingPattern ? matchingPattern.directionId : 'FALLBACK';
                console.log(`[Stamp Debug] Looking for "${fullDirection}" in [${availablePatterns}] -> matched: ${matchResult}`);
                
                // If no exact match, try to find any pattern (fallback)
                if (!matchingPattern) {
                    matchingPattern = patterns[0];
                    console.log(`[Stamp] No pattern match for ${pair.setName} direction ${direction}, using default`);
                }
                
                // Place the 3x3 stamp - pass both detected direction and matched pattern name
                const matchedPatternName = matchingPattern?.directionId || 'FALLBACK';
                const placed = placeStamp(map, x, y, direction, matchingPattern, pair, stamped, stampCenters, matchedPatternName);
                
                if (placed) {
                    stampCount++;
                }
                
                break; // Only apply one transition per tile
            }
        }
    }
    
    console.log(`[StampTransitions] Placed ${stampCount} stamps`);
    return stampCount;
}

/**
 * Determine the primary direction for stamp orientation
 * Now accepts all 8 directions to handle diagonal-only cases
 */
function getStampDirection(hasN, hasS, hasE, hasW, hasNE = false, hasNW = false, hasSE = false, hasSW = false) {
    // Count cardinal directions
    const cardinalCount = [hasN, hasS, hasE, hasW].filter(Boolean).length;
    
    // Single cardinal direction
    if (cardinalCount === 1) {
        if (hasN) return 'N';
        if (hasS) return 'S';
        if (hasE) return 'E';
        if (hasW) return 'W';
    }
    
    // Two adjacent cardinal directions (corner)
    if (hasN && hasE) return 'NE';
    if (hasN && hasW) return 'NW';
    if (hasS && hasE) return 'SE';
    if (hasS && hasW) return 'SW';
    
    // Multiple cardinals - use first one found
    if (cardinalCount > 1) {
        if (hasN) return 'N';
        if (hasS) return 'S';
        if (hasE) return 'E';
        if (hasW) return 'W';
    }
    
    // NO cardinal neighbors - check diagonals only
    // This handles corner cases where biome is only diagonal
    if (cardinalCount === 0) {
        if (hasNE) return 'NE';
        if (hasNW) return 'NW';
        if (hasSE) return 'SE';
        if (hasSW) return 'SW';
    }
    
    return 'N'; // Default
}

/**
 * Place a 3x3 stamp centered at (cx, cy) oriented in the given direction
 * 
 * The stamp is oriented so the "facing" edge points toward the other biome:
 * - Direction N: top row (NW, N, NE) faces the grass
 * - Direction E: right column (NE, E, SE) faces the grass
 * - etc.
 * 
 * @returns {boolean} true if stamp was placed
 */
function placeStamp(map, cx, cy, direction, pattern, pair, stamped, stampCenters, matchedPatternName) {
    if (!pattern.positionTiles) return false;
    
    const height = map.length;
    const width = map[0].length;
    
    // Check if there's already a stamp CENTER nearby - prevent overlapping stamps
    // For 3x3 stamps (radius 1 from center), centers need to be at least 3 apart
    // to avoid overlap. Check within distance 3 to ensure NO overlap or touching.
    for (let checkY = cy - 3; checkY <= cy + 3; checkY++) {
        for (let checkX = cx - 3; checkX <= cx + 3; checkX++) {
            const centerKey = `${checkX},${checkY}`;
            if (stampCenters.has(centerKey)) {
                return false;
            }
        }
    }
    
    // Mark this as a stamp center
    stampCenters.add(`${cx},${cy}`);
    
    // Get the offset mapping based on direction
    // This maps stamp positions to map offsets relative to center (cx, cy)
    const offsets = getStampOffsets(direction);
    
    // Place the stamp tiles
    let placedAny = false;
    for (const [position, [dx, dy]] of Object.entries(offsets)) {
        const nx = cx + dx;
        const ny = cy + dy;
        
        // Check bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const targetTile = map[ny][nx];
        const key = `${nx},${ny}`;
        
        // Allow stamp to cover BOTH biomes in the transition zone
        // The stamp is designed to blend both sides (e.g., grass on west, rock on east)
        if (targetTile.biome !== pair.a && targetTile.biome !== pair.b) continue;
        if (stamped.has(key)) continue;
        
        // Get the tile ID for this position
        const tileId = pattern.positionTiles[position];
        if (!tileId || tileId === '0x0000') continue;
        
        // Convert hex string to integer
        const tileIdNum = typeof tileId === 'string' 
            ? parseInt(tileId.replace('0x', ''), 16)
            : tileId;
        
        if (tileIdNum && !isNaN(tileIdNum) && tileIdNum > 0) {
            targetTile.id = tileIdNum;
            targetTile.isTerrainEdge = true;
            targetTile.terrainEdgePosition = position;
            targetTile.patternSetName = pair.setName;
            targetTile.stampDirection = direction;
            targetTile.stampCenter = { x: cx, y: cy };
            targetTile.stampConfigName = direction;  // The actual calculated direction: N, S, E, W, NE, NW, SE, SW
            
            // Debug info for labels
            targetTile.detectedDirection = direction;  // Raw direction from getStampDirection()
            targetTile.matchedPattern = matchedPatternName;  // The pattern directionId that was matched
            
            stamped.add(key);
            placedAny = true;
        }
    }
    
    return placedAny;
}

/**
 * Get the stamp offset mapping based on direction
 * 
 * Returns a map of position -> [dx, dy] where the offsets
 * are relative to the stamp center.
 * 
 * The stamp is oriented so the "facing" positions are toward the other biome.
 */
function getStampOffsets(direction) {
    // Standard offsets - tiles go where they're named in the pattern
    // The user designs each direction's stamp with correct orientation,
    // so we don't need to rotate anything.
    // 
    // NW  N  NE      (-1,-1) (0,-1) (1,-1)
    //  W CTR E   =>  (-1, 0) (0, 0) (1, 0)
    // SW  S  SE      (-1, 1) (0, 1) (1, 1)
    
    return {
        'NW': [-1, -1], 'N': [0, -1], 'NE': [1, -1],
        'W':  [-1,  0], 'CENTER': [0, 0], 'E': [1, 0],
        'SW': [-1,  1], 'S': [0, 1], 'SE': [1, 1]
    };
}

