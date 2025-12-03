/**
 * Water Tile Mappings for UO Terrain Generator
 * 
 * These mappings are configured via the Water Tile Teacher tool (water_tile_teacher.html)
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

