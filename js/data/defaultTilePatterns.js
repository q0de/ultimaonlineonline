/**
 * Default Tile Patterns for Terrain Transitions
 * These are loaded automatically by the Tile Teacher
 * User can override these with localStorage, but these are the defaults
 */

export const DEFAULT_TILE_PATTERNS = {
    // Water Cliff transitions
    cliff_north: '0x098C',
    cliff_south: '0x0994',
    cliff_east: '0x0990',
    cliff_west: '0x0988',
    cliff_corner_ne: '0x099C',
    cliff_corner_nw: '0x0998',
    cliff_corner_se: '0x09A0',
    cliff_corner_sw: '0x099C',
    
    // Water Shallow transitions (same water tile, no embankment)
    shallow_north: '0x00A8',
    shallow_south: '0x00A8',
    shallow_east: '0x00A8',
    shallow_west: '0x00A8',
    
    // Rock-Grass transitions
    rock_grass_north: '0x021F',
    rock_grass_south: '0x021F',
    rock_grass_east: '0x021F',
    rock_grass_west: '0x021F',
    rock_grass_corner_ne: '0x021F',
    rock_grass_corner_nw: '0x021F',
    rock_grass_corner_se: '0x021F',
    rock_grass_corner_sw: '0x021F',
    
    // Sand-Grass transitions
    sand_grass_north: '0x0033',
    sand_grass_south: '0x0033',
    sand_grass_east: '0x0033',
    sand_grass_west: '0x0033',
    sand_grass_corner_ne: '0x0033',
    sand_grass_corner_nw: '0x0033',
    sand_grass_corner_se: '0x0033',
    sand_grass_corner_sw: '0x0033',
    
    // Forest-Grass transitions
    forest_grass_north: '0x00C4',
    forest_grass_south: '0x00C4',
    forest_grass_east: '0x00C4',
    forest_grass_west: '0x00C4',
    
    // Dirt-Grass transitions
    dirt_grass_north: '0x0071',
    dirt_grass_south: '0x0071',
    dirt_grass_east: '0x0071',
    dirt_grass_west: '0x0071',
};

// Function to get patterns (merges defaults with user localStorage)
export function getTilePatterns() {
    let userPatterns = {};
    
    if (typeof localStorage !== 'undefined') {
        try {
            const stored = localStorage.getItem('terrainTileMappings') || localStorage.getItem('waterTileMappings');
            if (stored) {
                userPatterns = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load user patterns:', e);
        }
    }
    
    // User patterns override defaults
    return { ...DEFAULT_TILE_PATTERNS, ...userPatterns };
}

// Function to save patterns to localStorage
export function saveTilePatterns(patterns) {
    if (typeof localStorage !== 'undefined') {
        const merged = { ...DEFAULT_TILE_PATTERNS, ...patterns };
        localStorage.setItem('terrainTileMappings', JSON.stringify(merged));
        localStorage.setItem('waterTileMappings', JSON.stringify(merged));
        return merged;
    }
    return patterns;
}



