/**
 * UO Transition Tiles
 * 
 * Transition tiles are used where two biomes meet.
 * They have specific edges that blend one terrain into another.
 * 
 * ============================================================================
 * MASTER TRANSITION LOGIC - REUSE FOR ALL TERRAIN TYPES
 * ============================================================================
 * 
 * BITMASK SYSTEM:
 * We use a 4-bit bitmask to represent which NEIGHBORS are the "other" biome:
 *   Bit 0 (1)  = North neighbor is other biome
 *   Bit 1 (2)  = East neighbor is other biome
 *   Bit 2 (4)  = South neighbor is other biome
 *   Bit 3 (8)  = West neighbor is other biome
 * 
 * KEY INSIGHT - TILE VISUAL vs NEIGHBOR DIRECTION:
 * The bitmask tells us WHERE the other biome is (neighbor direction).
 * The transition tile must show the other biome CREEPING IN from that direction.
 * 
 * So if the neighbor is to the NORTH (bitmask 1), we need a tile that shows
 * the other terrain on its TOP/NORTH visual edge.
 * 
 * UO TRANSITION TILE ARRANGEMENT (3x3 grid):
 * Most UO transitions are arranged in a 3x3 pattern like this:
 * 
 *   [NW corner] [N edge]  [NE corner]     Shows other terrain on:
 *   [W edge]    [center]  [E edge]        - corners: two adjacent edges
 *   [SW corner] [S edge]  [SE corner]     - edges: one edge
 *                                          - center: surrounded
 * 
 * BITMASK TO TILE MAPPING:
 * 
 * Single edges (other biome on ONE side):
 *   Bitmask 1  (N neighbor)  → Use tile with other terrain on TOP edge
 *   Bitmask 2  (E neighbor)  → Use tile with other terrain on RIGHT edge
 *   Bitmask 4  (S neighbor)  → Use tile with other terrain on BOTTOM edge
 *   Bitmask 8  (W neighbor)  → Use tile with other terrain on LEFT edge
 * 
 * Adjacent corners (other biome WRAPPING AROUND - inner corner of current biome):
 *   Bitmask 3  (N+E)  → Use tile with other terrain on TOP-RIGHT (inner corner)
 *   Bitmask 6  (E+S)  → Use tile with other terrain on BOTTOM-RIGHT (inner corner)
 *   Bitmask 12 (S+W)  → Use tile with other terrain on BOTTOM-LEFT (inner corner)
 *   Bitmask 9  (W+N)  → Use tile with other terrain on TOP-LEFT (inner corner)
 * 
 * Opposite edges (other biome on BOTH sides - strait/channel):
 *   Bitmask 5  (N+S)  → Use center tile or vertical strait
 *   Bitmask 10 (E+W)  → Use center tile or horizontal strait
 * 
 * Three edges (peninsula of current biome poking into other):
 *   Bitmask 7  (N+E+S) → Mostly surrounded, use center
 *   Bitmask 11 (W+N+E) → Mostly surrounded, use center
 *   Bitmask 13 (S+W+N) → Mostly surrounded, use center
 *   Bitmask 14 (E+S+W) → Mostly surrounded, use center
 * 
 * All edges (island):
 *   Bitmask 15 (all)   → Completely surrounded, use center tile
 * 
 * ============================================================================
 */

// Sand-to-Grass transition tiles
// Pure sand tiles for center areas
export const SAND_TO_GRASS_TRANSITIONS = {
    // Pure sand (no grass edges) - use for center
    0: ['0x0016', '0x0017', '0x0018', '0x0019'],
};

// Grass-to-Sand transition tiles (0x03C0-0x03C8)
// These are GRASS tiles with SAND creeping in from specific directions
//
// The 3x3 grid represents WHERE THE SAND IS relative to grass:
//   NW(0x03C2)  N(0x03C1)   NE(0x03C0)   ← Sand is in these positions
//   W(0x03C5)   C(0x03C4)   E(0x03C3)
//   SW(0x03C8)  S(0x03C7)   SE(0x03C6)
//
// So 0x03C0 = "NE tile" means sand is to the NorthEast, grass is to SouthWest
// This tile shows sand on TOP-RIGHT corner, grass on BOTTOM-LEFT
//
// BITMASK: Which neighbors ARE sand
//   1 = North is sand
//   2 = East is sand
//   4 = South is sand
//   8 = West is sand
//
// SINGLE EDGES: Sand on one side only
//   Bitmask 1 (N is sand) → need tile with sand on TOP → 0x03C7 (S position = sand above)
//   Bitmask 2 (E is sand) → need tile with sand on RIGHT → 0x03C3 (E position = sand right)
//   Bitmask 4 (S is sand) → need tile with sand on BOTTOM → 0x03C1 (N position = sand below)
//   Bitmask 8 (W is sand) → need tile with sand on LEFT → 0x03C5 (W position = sand left)
//
// CORNERS: Sand on two adjacent sides (outer corner of grass)
//   Bitmask 3 (N+E) → sand wraps TOP-RIGHT → 0x03C0 (NE = sand on top-right)
//   Bitmask 6 (E+S) → sand wraps BOTTOM-RIGHT → 0x03C6 (SE = sand on bottom-right)
//   Bitmask 12 (S+W) → sand wraps BOTTOM-LEFT → 0x03C8 (SW = sand on bottom-left)
//   Bitmask 9 (W+N) → sand wraps TOP-LEFT → 0x03C2 (NW = sand on top-left)

export const GRASS_TO_SAND_TRANSITIONS = {
    // Pure grass (no sand neighbors)
    0: ['0x0003', '0x0004', '0x0005', '0x0006'],
    
    // Single edge - sand on ONE side
    1: ['0x03C7'],  // N is sand → S tile (sand appears on top)
    2: ['0x03C3'],  // E is sand → E tile (sand appears on right)
    4: ['0x03C1'],  // S is sand → N tile (sand appears on bottom)
    8: ['0x03C5'],  // W is sand → W tile (sand appears on left)
    
    // Two adjacent edges - OUTER CORNER of grass (sand wrapping around)
    3: ['0x03C0'],  // N+E sand → NE tile (sand on top-right corner)
    6: ['0x03C6'],  // E+S sand → SE tile (sand on bottom-right corner)
    12: ['0x03C8'], // S+W sand → SW tile (sand on bottom-left corner)
    9: ['0x03C2'],  // W+N sand → NW tile (sand on top-left corner)
    
    // Two opposite edges - narrow strip of grass
    5: ['0x03C4'],  // N+S sand - grass strip running E-W
    10: ['0x03C4'], // E+W sand - grass strip running N-S
    
    // Three edges - small peninsula of grass
    7: ['0x03C4'],  // N+E+S sand
    11: ['0x03C4'], // W+N+E sand
    13: ['0x03C4'], // S+W+N sand
    14: ['0x03C4'], // E+S+W sand
    
    // All four edges - island of grass
    15: ['0x03C4'],
};

// Grass-to-Water transition tiles (embankments/cliffs)
export const GRASS_TO_WATER_TRANSITIONS = {
    0: ['0x0003', '0x0004', '0x0005', '0x0006'], // Pure grass
    
    // These are approximate - need visual verification
    1: ['0x00D0'],  // Water on North
    2: ['0x00D1'],  // Water on East
    4: ['0x00D2'],  // Water on South
    8: ['0x00D3'],  // Water on West
};

// Forest-to-Grass transitions
export const FOREST_TO_GRASS_TRANSITIONS = {
    0: ['0x00C4', '0x00C5', '0x00C6', '0x00C7'], // Pure forest
    // Add more as we identify them
};

// Rock-to-Grass transitions
export const ROCK_TO_GRASS_TRANSITIONS = {
    0: ['0x00E4', '0x00E5', '0x00E6', '0x00E7'], // Pure rock
    // Add more as we identify them
};

/**
 * HELPER: Create a transition mapping from a 3x3 tile grid
 * 
 * @param {Object} tiles - Object with tile IDs for each position:
 *   {
 *     center: '0x0000',  // Pure/surrounded tile
 *     n: '0x0000',       // Other terrain on North edge
 *     e: '0x0000',       // Other terrain on East edge
 *     s: '0x0000',       // Other terrain on South edge
 *     w: '0x0000',       // Other terrain on West edge
 *     ne: '0x0000',      // Other terrain on NE corner (inner corner)
 *     se: '0x0000',      // Other terrain on SE corner (inner corner)
 *     sw: '0x0000',      // Other terrain on SW corner (inner corner)
 *     nw: '0x0000',      // Other terrain on NW corner (inner corner)
 *   }
 * @param {Array} pureTiles - Array of pure center tiles (no transitions)
 * @returns {Object} Bitmask mapping
 * 
 * USAGE EXAMPLE:
 * const GRASS_TO_ROCK = createTransitionMapping({
 *     center: '0x0100', n: '0x0101', e: '0x0102', s: '0x0103', w: '0x0104',
 *     ne: '0x0105', se: '0x0106', sw: '0x0107', nw: '0x0108'
 * }, ['0x0003', '0x0004', '0x0005', '0x0006']);
 */
export function createTransitionMapping(tiles, pureTiles) {
    return {
        // Pure (no other terrain neighbors)
        0: pureTiles,
        
        // Single edges
        1: [tiles.n],      // Other terrain to North
        2: [tiles.e],      // Other terrain to East
        4: [tiles.s],      // Other terrain to South
        8: [tiles.w],      // Other terrain to West
        
        // Adjacent corners (inner corners)
        3: [tiles.ne],     // Other terrain to N+E
        6: [tiles.se],     // Other terrain to E+S
        12: [tiles.sw],    // Other terrain to S+W
        9: [tiles.nw],     // Other terrain to W+N
        
        // Opposite edges (use center)
        5: [tiles.center],  // N+S
        10: [tiles.center], // E+W
        
        // Three edges (use center)
        7: [tiles.center],  // N+E+S
        11: [tiles.center], // W+N+E
        13: [tiles.center], // S+W+N
        14: [tiles.center], // E+S+W
        
        // All edges (use center)
        15: [tiles.center],
    };
}

/**
 * Calculate the transition bitmask for a tile based on its neighbors
 * @param {Object} map - The terrain map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} currentBiome - The biome of the current tile
 * @param {string} targetBiome - The biome we're transitioning to
 * @returns {number} Bitmask (0-15)
 */
export function calculateTransitionBitmask(map, x, y, width, height, currentBiome, targetBiome) {
    let bitmask = 0;
    
    // Check North neighbor (y - 1)
    if (y > 0 && map[y - 1][x].biome === targetBiome) {
        bitmask |= 1;
    }
    
    // Check East neighbor (x + 1)
    if (x < width - 1 && map[y][x + 1].biome === targetBiome) {
        bitmask |= 2;
    }
    
    // Check South neighbor (y + 1)
    if (y < height - 1 && map[y + 1][x].biome === targetBiome) {
        bitmask |= 4;
    }
    
    // Check West neighbor (x - 1)
    if (x > 0 && map[y][x - 1].biome === targetBiome) {
        bitmask |= 8;
    }
    
    return bitmask;
}

/**
 * Get the appropriate transition tile based on bitmask
 */
export function getTransitionTile(transitions, bitmask, x, y) {
    const tiles = transitions[bitmask];
    if (!tiles || tiles.length === 0) {
        // Fallback to pure center tile
        return transitions[0] ? transitions[0][0] : null;
    }
    
    // Use position to pick from available tiles for variation
    const index = ((x % 2) + (y % 2) * 2) % tiles.length;
    return tiles[index];
}

export default {
    SAND_TO_GRASS_TRANSITIONS,
    GRASS_TO_WATER_TRANSITIONS,
    FOREST_TO_GRASS_TRANSITIONS,
    ROCK_TO_GRASS_TRANSITIONS,
    calculateTransitionBitmask,
    getTransitionTile
};

