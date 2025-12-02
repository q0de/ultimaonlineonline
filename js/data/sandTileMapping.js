/**
 * Sand Tile Bitmask Mapping
 * Auto-generated from tile image analysis
 * 
 * Bitmask bits: N=1, E=2, S=4, W=8
 * Value of 1 means GRASS on that edge (sand tile transitions to grass)
 * 
 * For example:
 *   bitmask 0 = pure sand (no grass edges)
 *   bitmask 3 = grass on North (1) + East (2) = NE corner transition
 *   bitmask 9 = grass on North (1) + West (8) = NW corner transition
 */

export const SAND_TILE_MAPPING = {
    // Bitmask 0: Pure sand - no grass on any edge (85 tiles)
    0: [
        '0x0016', '0x0017', '0x0018', '0x0019', '0x001A', '0x001B', '0x001C',
        '0x0022', '0x0024', '0x011E', '0x011F', '0x0120', '0x0121', '0x0126',
        '0x0127', '0x0128', '0x0129', '0x012A', '0x012B', '0x012C', '0x012D',
        '0x012E', '0x012F', '0x0130', '0x0131', '0x0132', '0x0133', '0x0192',
        '0x0193', '0x0194', '0x0195', '0x027E', '0x027F', '0x0280', '0x0281',
        '0x0284', '0x0285', '0x0286', '0x0287', '0x0288', '0x0289', '0x028A',
        '0x03B4', '0x03B5', '0x03B6', '0x03B7', '0x03B8', '0x03B9', '0x03BA',
        '0x03BB', '0x03BC', '0x0644', '0x0645', '0x0646', '0x0647', '0x0648',
        '0x0649', '0x064A'
    ],
    
    // Bitmask 1: Grass on NORTH edge (15 tiles)
    1: [
        '0x0021', '0x0031', '0x0035', '0x0044', '0x01AB', '0x01B5', '0x01C1',
        '0x029B', '0x03C7', '0x03D1', '0x03DD', '0x0659', '0x0663', '0x066F',
        '0x067B'
    ],
    
    // Bitmask 2: Grass on EAST edge (12 tiles)
    2: [
        '0x002A', '0x0036', '0x0045', '0x01A8', '0x028C', '0x028E', '0x03C4',
        '0x03D6', '0x0656', '0x0658', '0x0668', '0x0678'
    ],
    
    // Bitmask 3: Grass on NORTH + EAST edges (NE corner) (6 tiles)
    3: [
        '0x001D', '0x001E', '0x0025', '0x0029', '0x003A', '0x0652'
    ],
    
    // Bitmask 4: Grass on SOUTH edge (14 tiles)
    4: [
        '0x0026', '0x0033', '0x01AA', '0x028B', '0x03BD', '0x03C3', '0x03CD',
        '0x03D7', '0x03E3', '0x0655', '0x065D', '0x0667', '0x0677', '0x0683'
    ],
    
    // Bitmask 5: Grass on NORTH + SOUTH edges (1 tile)
    5: ['0x002C'],
    
    // Bitmask 6: Grass on EAST + SOUTH edges (ES corner) (4 tiles)
    6: ['0x0020', '0x0037', '0x0049', '0x0283'],
    
    // Bitmask 7: Grass on NORTH + EAST + SOUTH edges (1 tile)
    7: ['0x002E'],
    
    // Bitmask 8: Grass on WEST edge (14 tiles)
    8: [
        '0x001F', '0x0028', '0x0034', '0x01A9', '0x028D', '0x03C5', '0x03CF',
        '0x03D9', '0x03DB', '0x0657', '0x065F', '0x0669', '0x0679', '0x067D'
    ],
    
    // Bitmask 9: Grass on NORTH + WEST edges (NW corner) (8 tiles)
    9: [
        '0x0023', '0x0027', '0x002B', '0x0038', '0x0046', '0x0048', '0x0653',
        '0x0654'
    ],
    
    // Bitmask 10: Grass on EAST + WEST edges (not found in analysis - use fallback)
    10: [],
    
    // Bitmask 11: Grass on NORTH + EAST + WEST edges (1 tile)
    11: ['0x002D'],
    
    // Bitmask 12: Grass on SOUTH + WEST edges (SW corner) (4 tiles)
    12: ['0x0039', '0x0047', '0x0282', '0x064B'],
    
    // Bitmask 13: Grass on NORTH + SOUTH + WEST edges (3 tiles)
    13: ['0x002F', '0x0030', '0x004A'],
    
    // Bitmask 14: Grass on EAST + SOUTH + WEST edges (1 tile)
    14: ['0x004B'],
    
    // Bitmask 15: Grass on all edges (grass island in sand) (1 tile)
    15: ['0x0032']
};

/**
 * Get a sand transition tile based on neighbor bitmask
 * @param {number} bitmask - The neighbor bitmask (N=1, E=2, S=4, W=8 for grass neighbors)
 * @param {function} rng - Random number generator
 * @returns {string} Tile ID in hex format
 */
export function getSandTileForBitmask(bitmask, rng = Math.random) {
    const tiles = SAND_TILE_MAPPING[bitmask];
    
    if (tiles && tiles.length > 0) {
        // For pure sand (bitmask 0), use only the first 4 tiles for consistency
        // These are the cleanest, most uniform sand tiles
        if (bitmask === 0) {
            const consistentTiles = tiles.slice(0, 4);
            return consistentTiles[Math.floor(rng() * consistentTiles.length)];
        }
        // For transition tiles, pick from available options
        return tiles[Math.floor(rng() * tiles.length)];
    }
    
    // Fallback: If exact match not found, fall back to pure sand
    const pureSand = SAND_TILE_MAPPING[0];
    return pureSand[0]; // Use the very first pure sand tile
}

/**
 * Calculate bitmask for a sand tile based on its grass neighbors
 * @param {Array<Array>} map - The terrain map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Map width
 * @param {number} height - Map height
 * @returns {number} Bitmask where N=1, E=2, S=4, W=8 if that neighbor is grass
 */
export function calculateSandBitmask(map, x, y, width, height) {
    let bitmask = 0;
    
    const isGrassType = (biome) => {
        return biome === 'grass' || biome === 'forest' || biome === 'jungle' || biome === 'furrows';
    };
    
    // Check North neighbor (y-1)
    if (y > 0 && isGrassType(map[y - 1][x].biome)) {
        bitmask |= 1;
    }
    
    // Check East neighbor (x+1)
    if (x < width - 1 && isGrassType(map[y][x + 1].biome)) {
        bitmask |= 2;
    }
    
    // Check South neighbor (y+1)
    if (y < height - 1 && isGrassType(map[y + 1][x].biome)) {
        bitmask |= 4;
    }
    
    // Check West neighbor (x-1)
    if (x > 0 && isGrassType(map[y][x - 1].biome)) {
        bitmask |= 8;
    }
    
    return bitmask;
}

export default SAND_TILE_MAPPING;

