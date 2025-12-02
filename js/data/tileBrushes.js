/**
 * TILE BRUSH SYSTEM
 * 
 * In UO, terrain is painted with "brushes" - each brush defines:
 * 1. CENTER TILES - The main tiles for the interior
 * 2. EDGE TILES - Transition tiles for each edge direction
 * 
 * This ensures visual coherence - all tiles in a brush are designed to work together.
 * 
 * Key insight from UO map editors:
 * - Don't randomly pick from ALL tiles of a type
 * - Use BRUSHES that group compatible tiles together
 */

// GRASS BRUSH - Primary grassland
export const GRASS_BRUSH = {
    name: 'grass',
    // Center/fill tiles - these tile perfectly together
    center: ['0x0003', '0x0004', '0x0005', '0x0006'],
    // Use ANY center tile - they all match
    useRandomCenter: true,
};

// GRASS BRUSH 2 - Alternate grass style (slightly different shade)
export const GRASS_BRUSH_2 = {
    name: 'grass2',
    center: ['0x0231', '0x0232', '0x0233', '0x0234'],
    useRandomCenter: true,
};

// GRASS BRUSH 3 - Another grass variant
export const GRASS_BRUSH_3 = {
    name: 'grass3', 
    center: ['0x036F', '0x0370', '0x0371', '0x0372'],
    useRandomCenter: true,
};

// SAND BRUSH - Beach/desert sand
export const SAND_BRUSH = {
    name: 'sand',
    // Pure sand center tiles (first 4 in the sand range)
    center: ['0x0016', '0x0017', '0x0018', '0x0019'],
    // Edge tiles for grass transitions (sand-to-grass)
    // These are the sand tiles that have grass on certain edges
    edges: {
        // Bitmask: N=1, E=2, S=4, W=8 (grass on that edge)
        1: ['0x0020', '0x0021'],   // Grass on North
        2: ['0x0022', '0x0023'],   // Grass on East
        4: ['0x0024', '0x0025'],   // Grass on South
        8: ['0x0026', '0x0027'],   // Grass on West
        3: ['0x0028', '0x0029'],   // Grass on NE corner
        6: ['0x002A', '0x002B'],   // Grass on SE corner
        12: ['0x002C', '0x002D'],  // Grass on SW corner
        9: ['0x002E', '0x002F'],   // Grass on NW corner
        // More complex combinations
        5: ['0x0030', '0x0031'],   // Grass on N+S
        10: ['0x0032', '0x0033'],  // Grass on E+W
        7: ['0x0034', '0x0035'],   // Grass on N+E+S
        11: ['0x0036', '0x0037'],  // Grass on N+E+W
        13: ['0x0038', '0x0039'],  // Grass on N+S+W
        14: ['0x003A', '0x0044'],  // Grass on E+S+W
        15: ['0x0003'],            // All grass (use grass tile)
    },
    useRandomCenter: false, // Use same tile for seamless tiling
};

// WATER BRUSH - Ocean/lake water
export const WATER_BRUSH = {
    name: 'water',
    center: ['0x00A8', '0x00A9', '0x00AA', '0x00AB'],
    useRandomCenter: true, // Water can vary slightly
};

// FOREST BRUSH - Trees/forest ground
export const FOREST_BRUSH = {
    name: 'forest',
    center: ['0x00AC', '0x00AD', '0x00AE', '0x00AF'],
    useRandomCenter: true,
};

// FURROWS BRUSH - Plowed farmland
export const FURROWS_BRUSH = {
    name: 'furrows',
    center: ['0x0009', '0x000A', '0x000B', '0x000C'],
    useRandomCenter: false, // Furrows should align
};

// DIRT BRUSH - Bare dirt/earth
export const DIRT_BRUSH = {
    name: 'dirt',
    center: ['0x0071', '0x0072', '0x0073', '0x0074'],
    useRandomCenter: false,
};

// EMBANK BRUSH - Grass with water edges (cliffs)
export const EMBANK_BRUSH = {
    name: 'embank',
    // These are grass tiles with water on certain edges
    edges: {
        1: ['0x098C', '0x098D', '0x098E', '0x098F'], // Water on North
        2: ['0x0990', '0x0991', '0x0992', '0x0993'], // Water on East
        4: ['0x0994', '0x0995', '0x0996', '0x0997'], // Water on South
        8: ['0x0998', '0x0999', '0x099A', '0x099B'], // Water on West
        3: ['0x099C', '0x099D'],  // Water on NE
        6: ['0x099E', '0x099F'],  // Water on SE
        12: ['0x09AC', '0x09AD'], // Water on SW
        9: ['0x09AE', '0x09AF'],  // Water on NW
    },
};

// ALL BRUSHES - Easy access
export const TILE_BRUSHES = {
    grass: GRASS_BRUSH,
    grass2: GRASS_BRUSH_2,
    grass3: GRASS_BRUSH_3,
    sand: SAND_BRUSH,
    water: WATER_BRUSH,
    forest: FOREST_BRUSH,
    furrows: FURROWS_BRUSH,
    dirt: DIRT_BRUSH,
    embank: EMBANK_BRUSH,
};

/**
 * Get a center tile from a brush
 * @param {object} brush - The brush to use
 * @param {function} rng - Random number generator
 * @returns {string} Hex tile ID
 */
export function getBrushCenterTile(brush, rng) {
    if (!brush.center || brush.center.length === 0) {
        return '0x0003'; // Fallback to grass
    }
    
    if (brush.useRandomCenter) {
        return brush.center[Math.floor(rng() * brush.center.length)];
    } else {
        // Use first tile for consistency
        return brush.center[0];
    }
}

/**
 * Get an edge tile from a brush based on neighbor bitmask
 * @param {object} brush - The brush to use
 * @param {number} bitmask - Which directions have the "other" terrain
 * @param {function} rng - Random number generator
 * @returns {string|null} Hex tile ID or null if no edge tile for this bitmask
 */
export function getBrushEdgeTile(brush, bitmask, rng) {
    if (!brush.edges || !brush.edges[bitmask]) {
        return null;
    }
    
    const edgeTiles = brush.edges[bitmask];
    return edgeTiles[Math.floor(rng() * edgeTiles.length)];
}

/**
 * Select a grass brush based on position (for regional consistency)
 * Uses noise to create regions of similar grass
 * @param {number} x - X position
 * @param {number} y - Y position  
 * @param {number} scale - Scale of regions (larger = bigger regions)
 * @returns {object} The selected grass brush
 */
export function selectGrassBrush(x, y, scale = 20) {
    // Simple region selection based on position
    // This creates larger areas of consistent grass
    const regionX = Math.floor(x / scale);
    const regionY = Math.floor(y / scale);
    const regionHash = (regionX * 31 + regionY * 17) % 3;
    
    switch (regionHash) {
        case 0: return GRASS_BRUSH;
        case 1: return GRASS_BRUSH_2;
        case 2: return GRASS_BRUSH_3;
        default: return GRASS_BRUSH;
    }
}



