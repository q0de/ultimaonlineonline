/**
 * Terrain Generator - Realistic Land Tile Generation
 * Uses Simplex noise for coherent terrain and the Whittaker diagram approach
 * for biome selection based on elevation and moisture.
 * 
 * KEY INSIGHT FROM UO RESEARCH:
 * - Land tiles are FLAT and tessellate perfectly
 * - Height illusion comes from SLOPE TILE ARTWORK (pre-drawn to look elevated)
 * - Proper tile selection based on neighbor biomes creates seamless transitions
 * - Statics (items) can be placed on top for vertical objects (walls, trees)
 */

import { SAND_TILE_MAPPING, getSandTileForBitmask, calculateSandBitmask } from '../data/sandTileMapping.js';
import { EMBANK_TILE_MAPPING, getEmbankTileForBitmask, calculateEmbankBitmask } from '../data/embankTileMapping.js';
import { SLOPE_TILE_MAPPING, getSlopeTileForBitmask, calculateSlopeBitmask } from '../data/slopeTileMapping.js';
import { ROCK_TILE_MAPPING, getRockTileForBitmask, calculateRockBitmask } from '../data/rockTileMapping.js';
import { DIRT_TILE_MAPPING, getDirtTileForBitmask, calculateDirtBitmask } from '../data/dirtTileMapping.js';
import { PURE_GRASS_TILES, getPureGrassTile } from '../data/grassTileMapping.js';
import { TILE_BRUSHES, getBrushCenterTile, selectGrassBrush } from '../data/tileBrushes.js';

// Simplex Noise implementation (fast, smooth coherent noise)
class SimplexNoise {
    constructor(seed = Math.random() * 10000) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        
        // Initialize permutation table with seed
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        
        // Shuffle using seed
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
        
        // Gradient vectors for 2D
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
        
        // Skew input space
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        // Determine simplex
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        
        // Calculate contributions
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
        
        // Scale to [-1, 1]
        return 70 * (n0 + n1 + n2);
    }
    
    // Fractal Brownian Motion - layered noise for more detail
    fbm(x, y, octaves = 4, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise2D(x * frequency, y * frequency);
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return value / maxValue;
    }
}

export class TerrainGenerator {
    constructor(landTileData) {
        this.landTiles = landTileData;
        this.tilesByType = this.groupTilesByType();
        this.seed = Math.random() * 10000;
    }

    /**
     * Group tiles by their name/type AND by consecutive ID ranges (tile sets)
     * Tiles with consecutive IDs are designed to look similar and work together
     */
    groupTilesByType() {
        const groups = {};
        const tileSets = {}; // Groups of consecutive tiles that match visually
        
        for (const tile of this.landTiles) {
            const tileName = tile.Name || tile.name || '';
            const name = (typeof tileName === 'string' ? tileName : String(tileName)).toLowerCase().trim();
            
            // Skip invalid or unwanted tile types
            if (!name || name === 'void!!!!!!' || name === 'nodraw' || name === 'ed' || name === 'noname' || name === '' ||
                name === 'snow' || name === 'lava' || name === 'swamp' ||
                name.includes('2017') || name.includes('2028')) {
                continue;
            }
            
            if (!groups[name]) {
                groups[name] = [];
            }
            groups[name].push(tile);
        }
        
        // Now group consecutive tiles into sets for each biome type
        for (const [name, tiles] of Object.entries(groups)) {
            // Sort by ID
            tiles.sort((a, b) => {
                const idA = parseInt(a.ID, 16) || 0;
                const idB = parseInt(b.ID, 16) || 0;
                return idA - idB;
            });
            
            // Group into consecutive ranges (tile sets)
            const sets = [];
            let currentSet = [tiles[0]];
            
            for (let i = 1; i < tiles.length; i++) {
                const prevId = parseInt(tiles[i - 1].ID, 16) || 0;
                const currId = parseInt(tiles[i].ID, 16) || 0;
                
                // If IDs are within 4 of each other, they're likely the same visual set
                if (currId - prevId <= 4) {
                    currentSet.push(tiles[i]);
                } else {
                    // Start a new set
                    if (currentSet.length > 0) {
                        sets.push(currentSet);
                    }
                    currentSet = [tiles[i]];
                }
            }
            if (currentSet.length > 0) {
                sets.push(currentSet);
            }
            
            tileSets[name] = sets;
        }
        
        this.tileSets = tileSets;
        return groups;
    }

    /**
     * Get a random tile of a specific type from a specific tile set
     * @param {string} type - Biome type
     * @param {number} setIndex - Which tile set to use (determined by noise)
     * @param {function} rng - Random number generator
     */
    getRandomTile(type, rng = Math.random, setIndex = null, isEdge = false, x = 0, y = 0) {
        const typeLower = type.toLowerCase();

        // OVERRIDE: Force specific textures to match reference image
        if (typeLower === 'dirt') {
            const tile = this.findTileById('0x0071'); // Smooth brown dirt
            if (tile) return tile;
        }
        if (typeLower === 'rock') {
            const tile = this.findTileById('0x0245'); // Cave floor
            if (tile) return tile;
        }
        if (typeLower === 'sand') {
            // Use Sand Dunes (0x01B9 range) for stacking effect
            const duneSet = ['0x01B9', '0x01BA', '0x01BB', '0x01BC', '0x01BD', '0x01BE', '0x01BF']; 
            const id = duneSet[Math.floor(rng() * duneSet.length)];
            const tile = this.findTileById(id);
            if (tile) return tile;
        }
        
        // GRASS: Use the BRUSH SYSTEM for regional consistency
        // Select a grass brush based on position - creates larger consistent regions
        if (typeLower === 'grass') {
            // Use brush system for regional grass consistency
            const grassBrush = selectGrassBrush(x, y, 15); // 15-tile regions
            const tileId = getBrushCenterTile(grassBrush, rng);
            const tile = this.findTileById(tileId);
            if (tile) return tile;
            
            // Fallback to known pure grass tile
            const fallbackId = '0x0003';
            const fallbackTile = this.findTileById(fallbackId);
            if (fallbackTile) return fallbackTile;
            
            console.warn(`Failed to find ANY grass tile (brush: ${tileId}, fallback: ${fallbackId})`);
        }
        
        const sets = this.tileSets ? this.tileSets[typeLower] : null;
        
        if (sets && sets.length > 0) {
            // Pick a tile set (or use the provided setIndex)
            const actualSetIndex = setIndex !== null 
                ? Math.abs(Math.floor(setIndex)) % sets.length 
                : Math.floor(rng() * sets.length);
            const tileSet = sets[actualSetIndex];
            
            if (tileSet && tileSet.length > 0) {
                // For sand - use edge tiles at boundaries, pure sand in center
                if (typeLower === 'sand') {
                    if (isEdge && tileSet.length > 4) {
                        // Use transition tiles (index 4+) for edges
                        const edgeTiles = tileSet.slice(4);
                        return edgeTiles[Math.floor(rng() * edgeTiles.length)];
                    } else {
                        // Use pure sand (first 4 tiles) for center
                        const pureTiles = tileSet.slice(0, Math.min(4, tileSet.length));
                        return pureTiles[0]; // Same tile for seamless tiling
                    }
                }
                
                // For water, furrows, dirt - use first tile for perfect tiling
                if (typeLower === 'water' || typeLower === 'furrows' || typeLower === 'dirt') {
                    return tileSet[0];
                }
                
                // For rock - use center tiles (bitmask 0 from mapping)
                if (typeLower === 'rock') {
                    const centerTiles = ROCK_TILE_MAPPING[0];
                    if (centerTiles && centerTiles.length > 0) {
                        const id = centerTiles[Math.floor(rng() * centerTiles.length)];
                        return this.findTileById(id) || tileSet[0];
                    }
                }
                
                // For forest/jungle - use limited variation within the set
                // Only use first 2 tiles in each set to avoid wild variation
                const maxVariation = Math.min(2, tileSet.length);
                return tileSet[Math.floor(rng() * maxVariation)];
            }
        }
        
        // Fallback to old behavior
        const tiles = this.tilesByType[typeLower] || [];
        
        // CRITICAL: Never pick random 'grass' tiles because the list includes transition tiles
        if (typeLower === 'grass') {
             const safeTile = this.findTileById('0x0003');
             return safeTile || (tiles.length > 0 ? tiles[0] : null);
        }

        if (tiles.length === 0) {
            // For grass fallback, use pure grass tiles
            const pureGrassId = PURE_GRASS_TILES[0];
            const tile = this.findTileById(pureGrassId);
            if (tile) return tile;
            
            const firstType = Object.keys(this.tilesByType)[0];
            return this.tilesByType[firstType][0];
        }
        return tiles[Math.floor(rng() * tiles.length)];
    }
    
    /**
     * Get the number of tile sets for a biome type
     */
    getTileSetCount(type) {
        const sets = this.tileSets ? this.tileSets[type.toLowerCase()] : null;
        return sets ? sets.length : 1;
    }

    /**
     * Determine biome based on elevation and moisture
     * Designed for cohesive regions with clean transitions
     */
    getBiome(elevation, moisture) {
        // Normalize to 0-1 range
        const e = (elevation + 1) / 2; // Convert from [-1,1] to [0,1]
        const m = (moisture + 1) / 2;
        
        // Water (low elevation) - clear boundary
        if (e < 0.30) {
            return 'water';
        }
        
        // NOTE: Sand is NOT placed here - sand only appears as beaches
        // around water in generateMapWithWater mode
        // This prevents random sand patches in grass areas
        
        // Forest regions - high moisture areas
        if (m > 0.68) {
            return 'forest';
        }
        
        // Jungle - very high moisture AND lower elevation
        if (m > 0.80 && e < 0.55) {
            return 'jungle';
        }
        
        // Farmland - specific moisture band, forms cohesive regions
        if (m > 0.42 && m < 0.55 && e > 0.40 && e < 0.55) {
            return 'furrows';
        }
        
        // Rock/Mountain - ONLY high elevation, low moisture
        if (e > 0.75 && m < 0.25) {
            return 'rock';
        }
        
        // Dirt - surrounding rocks or dry areas
        if (e > 0.65 && m < 0.35) {
            return 'dirt';
        }
        
        // Everything else is grass - clean, unified areas
        return 'grass';
    }

    /**
     * Create a seeded random number generator
     */
    createRNG(seed) {
        let s = seed;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    /**
     * Generate a specific test map to mirror the reference image structure
     * Left: Water/Coast (Jagged)
     * Middle: Grass with Dirt Patch
     * Right: Mountain Face
     */
    generateTestMap(width, height) {
        const map = [];
        const rng = Math.random;
        
        // Use Simplex noise for jagged coastline
        const coastNoise = new SimplexNoise(Math.random() * 10000);
        // Reduce scale for smoother, longer curves (less random direction changes)
        const coastScale = 0.05; 
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                let biome = 'grass';
                let elevation = 0.5;
                let moisture = 0.5;
                
                // 1. Left side: Water (simulating jagged coast)
                // Base edge is at x=6, varies by +/- 2 tiles
                const noiseVal = coastNoise.noise2D(0, y * coastScale);
                const coastEdge = 6 + (noiseVal * 2.5); 
                
                if (x < coastEdge) {
                    biome = 'water';
                    elevation = -0.5;
                }
                
                // 2. Right side: Rock (simulating mountain face)
                // Columns 22+ are the mountain
                else if (x > 22) {
                    biome = 'rock'; // Will be overridden to Cave Floor
                    elevation = 0.9;
                }
                
                // 3. Dirt Patch (The camp area in the reference)
                // A specific rectangular area in the middle-left
                else if (x >= 8 && x <= 14 && y >= 8 && y <= 16) {
                    // Add some noise to edges so it's not a perfect rectangle
                    if (rng() > 0.2) {
                        biome = 'dirt'; // Will be overridden to Dark Dirt
                    }
                }
                
                // Get base tile
                // For test map, use setIndex 0 for consistency
                const setIndex = 0;
                let tile = this.getRandomTile(biome, rng, setIndex, false, x, y);
                
                map[y][x] = {
                    id: tile ? tile.ID : '0x0003', // Fallback
                    name: tile ? (tile.Name || tile.name || '') : 'grass',
                    biome: biome,
                    elevation: elevation,
                    moisture: moisture,
                    tileSet: setIndex,
                    tile: tile
                };
            }
        }
        
        // Apply edge transitions (This will add the cliffs/slopes at the water edge)
        this.applyEdgeTransitions(map, width, height, rng);
        
        return map;
    }

    /**
     * Generate a realistic terrain map using noise-based generation
     * @param {number} width - Map width in tiles
     * @param {number} height - Map height in tiles
     * @param {number} seed - Optional seed for reproducible generation
     * @returns {Array<Array>} 2D array of tile data
     */
    generateMap(width, height, seed = null) {
        const actualSeed = seed !== null ? seed : Math.floor(Math.random() * 100000);
        const rng = this.createRNG(actualSeed);
        
        // Create noise generators with different seeds for elevation and moisture
        const elevationNoise = new SimplexNoise(actualSeed);
        const moistureNoise = new SimplexNoise(actualSeed + 1000);
        const detailNoise = new SimplexNoise(actualSeed + 2000);
        
        // Scale factors - LARGE for cohesive biome regions
        const elevationScale = 0.018;  // Very large features = bigger regions
        const moistureScale = 0.025;   // Large moisture regions
        const detailScale = 0.2;       // Fine detail (minimal impact)
        
        // Tile set noise - HUGE scale so connected regions use same tile variant
        const tileSetNoise = new SimplexNoise(actualSeed + 3000);
        const tileSetScale = 0.005; // Very large regions = tiles match neighbors
        
        const map = [];
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                // Generate elevation using fractal noise (multiple octaves)
                let elevation = elevationNoise.fbm(x * elevationScale, y * elevationScale, 4, 2, 0.5);
                
                // Add minimal detail variation (less random noise)
                elevation += detailNoise.noise2D(x * detailScale, y * detailScale) * 0.08;
                
                // Generate moisture
                let moisture = moistureNoise.fbm(x * moistureScale, y * moistureScale, 3, 2, 0.6);
                
                // Clamp values
                elevation = Math.max(-1, Math.min(1, elevation));
                moisture = Math.max(-1, Math.min(1, moisture));
                
                // Determine biome - use cleaner thresholds
                const biome = this.getBiome(elevation, moisture);
                
                // Use noise to determine which tile set AND variant to use
                // Very large scale = connected areas use same tile
                const tileSetValue = tileSetNoise.noise2D(x * tileSetScale, y * tileSetScale);
                const setCount = this.getTileSetCount(biome);
                // Limit to just 2 tile sets max - reduces visual noise
                const limitedSetCount = Math.min(setCount, 2);
                const setIndex = Math.floor(((tileSetValue + 1) / 2) * limitedSetCount);
                
                // Get tile from the selected tile set
                // isEdge = false for initial generation - transitions are applied later
                // Pass x,y for regional brush selection (especially for grass)
                const tile = this.getRandomTile(biome, rng, setIndex, false, x, y);
                
                map[y][x] = {
                    id: tile.ID,
                    name: tile.Name || tile.name || '',
                    biome: biome,
                    elevation: elevation,
                    moisture: moisture,
                    tileSet: setIndex,
                    tile: tile
                };
            }
        }
        
        // Apply edge detection for transition tiles
        this.applyEdgeTransitions(map, width, height, rng);
        
        // Smooth transitions - replace isolated tiles
        this.smoothTransitions(map, width, height, rng);
        
        return map;
    }
    
    /**
     * Detect edges between biomes and apply transition tiles using bitmask auto-tiling
     * 
     * KEY RULE: Sand tiles touching water = PURE SAND (no grass edges)
     * Only sand tiles NOT touching water get transition tiles with grass edges
     */
    applyEdgeTransitions(map, width, height, rng) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const current = map[y][x];
                
                // 1. Handle SAND transitions (sand-to-grass)
                if (current.biome === 'sand') {
                    // First check: does this sand tile touch water?
                    let touchesWater = false;
                    
                    // Check cardinal directions for water
                    if (y > 0 && map[y - 1][x].biome === 'water') touchesWater = true;
                    if (y < height - 1 && map[y + 1][x].biome === 'water') touchesWater = true;
                    if (x > 0 && map[y][x - 1].biome === 'water') touchesWater = true;
                    if (x < width - 1 && map[y][x + 1].biome === 'water') touchesWater = true;
                    
                    let bitmask;
                    
                    if (touchesWater) {
                        // Sand touching water = ALWAYS pure sand (bitmask 0)
                        // No grass edges, even if there's grass on another side
                        bitmask = 0;
                    } else {
                        // Sand NOT touching water = can have grass transition edges
                        bitmask = calculateSandBitmask(map, x, y, width, height);
                    }
                    
                    // Get the correct tile for this bitmask
                    const tileId = getSandTileForBitmask(bitmask, rng);
                    
                    // Find the tile data from our loaded tiles
                    const tileData = this.findTileById(tileId);
                    
                    if (tileData) {
                        map[y][x].id = tileData.ID;
                        map[y][x].name = tileData.Name || tileData.name || '';
                        map[y][x].tile = tileData;
                        map[y][x].isEdge = bitmask > 0;
                        map[y][x].bitmask = bitmask;
                        map[y][x].touchesWater = touchesWater;
                    }
                }
                
                // 2. Handle CLIFF transitions (land-to-water using slope/embank tiles)
                // Apply to ALL land types that can touch water directly
                else if (current.biome === 'grass' || current.biome === 'forest' || 
                         current.biome === 'jungle' || current.biome === 'furrows' || current.biome === 'dirt') {
                    
                    // CRITICAL FIX: Only apply slope/cliff if it ACTUALLY touches water!
                    // Prevents interior grass from being turned into slopes
                    let touchesWater = false;
                    if (y > 0 && map[y - 1][x].biome === 'water') touchesWater = true;
                    else if (y < height - 1 && map[y + 1][x].biome === 'water') touchesWater = true;
                    else if (x > 0 && map[y][x - 1].biome === 'water') touchesWater = true;
                    else if (x < width - 1 && map[y][x + 1].biome === 'water') touchesWater = true;
                    
                    if (touchesWater) {
                        // Check if this land tile touches water (cliff scenario)
                        // We use 'grass' as the target biome logic because the slope tiles are defined by their "grass" edge
                        const slopeBitmask = calculateSlopeBitmask(map, x, y, width, height, 'grass');
                        
                        if (slopeBitmask > 0) {
                            // EXPERIMENTAL: Flip bitmask direction?
                            // User reported "Incorrect Cardinal Direction".
                            // If my analysis inverted Up/Down, flipping the bitmask fixes it.
                            // East (2) <-> West (8)
                            // North (1) <-> South (4)
                            let lookupBitmask = 0;
                            if (slopeBitmask & 1) lookupBitmask |= 4;
                            if (slopeBitmask & 2) lookupBitmask |= 8;
                            if (slopeBitmask & 4) lookupBitmask |= 1;
                            if (slopeBitmask & 8) lookupBitmask |= 2;
                            
                            // Try to find a specific slope tile first (user requested cliffs)
                            // Use 'GRASS' transition type as these are Grass-to-Sand/Water cliffs
                            let tileId = getSlopeTileForBitmask(lookupBitmask, 'GRASS', rng);
                            
                            // Fallback to generic embankments if no slope tile found
                            if (!tileId) {
                                // Try original bitmask if flipped failed
                                tileId = getSlopeTileForBitmask(slopeBitmask, 'GRASS', rng);
                            }
                            
                            if (!tileId) {
                                const embankBitmask = calculateEmbankBitmask(map, x, y, width, height);
                                tileId = getEmbankTileForBitmask(embankBitmask, rng);
                            }
                            
                            const tileData = this.findTileById(tileId);
                            
                            if (tileData) {
                                map[y][x].id = tileData.ID;
                                map[y][x].name = tileData.Name || tileData.name || '';
                                map[y][x].tile = tileData;
                                map[y][x].isCliff = true;
                                map[y][x].slopeBitmask = slopeBitmask;
                                console.log(`Applied slope/cliff at (${x},${y}): bitmask=${slopeBitmask}, tile=${tileId}`);
                            } else {
                                console.warn(`Cliff tile not found for bitmask ${slopeBitmask}`);
                            }
                        }
                    }
                }
                
                // 3. Handle ROCK transitions (rock-to-other)
                else if (current.biome === 'rock') {
                    // Check neighbors for NOT rock (invert=true)
                    // This finds edges where rock meets other biomes
                    const bitmask = calculateRockBitmask(map, x, y, width, height, 'rock', true);
                    
                    if (bitmask > 0) {
                        // Determine transition type based on neighbors
                        let transitionType = 'generic';
                        const neighborBiomes = new Set();
                        
                        // Check neighbors corresponding to the bitmask
                        // Bit 1: TR (North) -> y-1
                        if ((bitmask & 1) && y > 0) neighborBiomes.add(map[y - 1][x].biome);
                        // Bit 2: BR (East) -> x+1
                        if ((bitmask & 2) && x < width - 1) neighborBiomes.add(map[y][x + 1].biome);
                        // Bit 4: BL (South) -> y+1
                        if ((bitmask & 4) && y < height - 1) neighborBiomes.add(map[y + 1][x].biome);
                        // Bit 8: TL (West) -> x-1
                        if ((bitmask & 8) && x > 0) neighborBiomes.add(map[y][x - 1].biome);
                        
                        // Prioritize specific transitions
                        if (neighborBiomes.has('sand')) {
                            transitionType = 'SAND';
                        } else if (neighborBiomes.has('grass') || neighborBiomes.has('forest') || neighborBiomes.has('jungle')) {
                            transitionType = 'GRASS';
                        }
                        
                        const tileId = getRockTileForBitmask(bitmask, transitionType, rng);
                        const tileData = this.findTileById(tileId);
                        
                        if (tileData) {
                            map[y][x].id = tileData.ID;
                            map[y][x].name = tileData.Name || tileData.name || '';
                            map[y][x].tile = tileData;
                            map[y][x].isEdge = true;
                            map[y][x].rockBitmask = bitmask;
                        }
                    }
                }
                
                // 4. Handle DIRT transitions (dirt-to-grass)
                else if (current.biome === 'dirt') {
                    const bitmask = calculateDirtBitmask(map, x, y, width, height, 'grass');
                    
                    if (bitmask > 0) {
                        // Find transition tile (Grass transition type)
                        const tileId = getDirtTileForBitmask(bitmask, 'GRASS', rng);
                        const tileData = this.findTileById(tileId);
                        
                        if (tileData) {
                            map[y][x].id = tileData.ID;
                            map[y][x].name = tileData.Name || tileData.name || '';
                            map[y][x].tile = tileData;
                            map[y][x].isEdge = true;
                            map[y][x].dirtBitmask = bitmask;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Find a tile by its hex ID
     */
    findTileById(hexId) {
        // Normalize the hex ID
        const normalizedId = hexId.toUpperCase();
        
        for (const tile of this.landTiles) {
            const tileIdUpper = (tile.ID || '').toUpperCase();
            if (tileIdUpper === normalizedId) {
                return tile;
            }
        }
        
        // If not found, return null
        return null;
    }

    /**
     * Smooth transitions between biomes to avoid single isolated tiles
     * Also ensures tile sets match neighbors for visual consistency
     * Removes sand that's not adjacent to water (cleanup isolated beaches)
     */
    smoothTransitions(map, width, height, rng) {
        const changes = [];
        
        // First pass: Remove isolated sand (sand not next to water)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x].biome === 'sand') {
                    // Check if any neighbor is water
                    let hasWaterNeighbor = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                if (map[ny][nx].biome === 'water') {
                                    hasWaterNeighbor = true;
                                    break;
                                }
                            }
                        }
                        if (hasWaterNeighbor) break;
                    }
                    
                    // If sand has no water neighbor, convert to grass
                    if (!hasWaterNeighbor) {
                        const tile = this.getRandomTile('grass', rng, 0);
                        map[y][x].biome = 'grass';
                        map[y][x].id = tile.ID;
                        map[y][x].name = tile.Name || tile.name || '';
                        map[y][x].tile = tile;
                    }
                }
            }
        }
        
        // Second pass: Remove isolated dirt (dirt surrounded by grass)
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (map[y][x].biome === 'dirt') {
                    // Count dirt neighbors
                    let dirtNeighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dy === 0 && dx === 0) continue;
                            const ny = y + dy;
                            const nx = x + dx;
                            if (map[ny][nx].biome === 'dirt') {
                                dirtNeighbors++;
                            }
                        }
                    }
                    
                    // If dirt has less than 2 dirt neighbors, convert to grass
                    if (dirtNeighbors < 2) {
                        const tile = this.getRandomTile('grass', rng, 0);
                        map[y][x].biome = 'grass';
                        map[y][x].id = tile.ID;
                        map[y][x].name = tile.Name || tile.name || '';
                        map[y][x].tile = tile;
                    }
                }
            }
        }
        
        // Third pass: General smoothing for isolated tiles
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const current = map[y][x].biome;
                
                // Count neighbors of same biome
                const neighborData = [
                    map[y-1][x],
                    map[y+1][x],
                    map[y][x-1],
                    map[y][x+1]
                ];
                const neighbors = neighborData.map(n => n.biome);
                
                const sameCount = neighbors.filter(n => n === current).length;
                
                // If isolated (no same neighbors), change to most common neighbor
                if (sameCount === 0) {
                    const counts = {};
                    neighbors.forEach(n => counts[n] = (counts[n] || 0) + 1);
                    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
                    
                    // Find the most common tile set among neighbors of this biome
                    const sameBiomeNeighbors = neighborData.filter(n => n.biome === mostCommon);
                    const setIndex = sameBiomeNeighbors.length > 0 ? sameBiomeNeighbors[0].tileSet : null;
                    
                    changes.push({ x, y, biome: mostCommon, setIndex });
                }
            }
        }
        
        // Apply changes
        for (const change of changes) {
            const tile = this.getRandomTile(change.biome, rng, change.setIndex);
            map[change.y][change.x] = {
                id: tile.ID,
                name: tile.Name || tile.name || '',
                biome: change.biome,
                elevation: map[change.y][change.x].elevation,
                moisture: map[change.y][change.x].moisture,
                tileSet: change.setIndex,
                tile: tile
            };
        }
    }

    /**
     * Generate terrain with explicit water bodies (lakes/rivers)
     */
    generateMapWithWater(width, height, options = {}) {
        const {
            seed = null,
            waterLevel = 0.35,  // Elevation below which is water
            beachWidth = 0.12,  // Beach width for sand areas
            cliffChance = 0.35  // Chance of cliffs (grass meeting water directly, no sand)
        } = options;

        const actualSeed = seed !== null ? seed : Math.floor(Math.random() * 100000);
        const rng = this.createRNG(actualSeed);
        
        const elevationNoise = new SimplexNoise(actualSeed);
        const moistureNoise = new SimplexNoise(actualSeed + 1000);
        const detailNoise = new SimplexNoise(actualSeed + 2000);
        const riverNoise = new SimplexNoise(actualSeed + 3000);
        
        const elevationScale = 0.018;  // Large regions
        const moistureScale = 0.025;   // Large moisture regions
        const detailScale = 0.15;      // Fine detail
        
        // Tile set noise - HUGE scale so connected regions use same tile variant
        const tileSetNoise = new SimplexNoise(actualSeed + 4000);
        const tileSetScale = 0.005; // Very large regions = tiles match neighbors
        
        // Cliff noise - determines where cliffs vs beaches appear
        const cliffNoise = new SimplexNoise(actualSeed + 5000);
        const cliffScale = 0.08; // Medium scale for cliff regions
        
        const map = [];
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                // Generate base elevation
                let elevation = elevationNoise.fbm(x * elevationScale, y * elevationScale, 5, 2, 0.5);
                elevation += detailNoise.noise2D(x * detailScale, y * detailScale) * 0.15;
                
                // Add river channels using ridge noise
                const riverValue = Math.abs(riverNoise.fbm(x * 0.02, y * 0.02, 3, 2, 0.5));
                if (riverValue < 0.08) {
                    elevation -= 0.3; // Carve river channels
                }
                
                // Normalize elevation to 0-1
                const e = (elevation + 1) / 2;
                
                // Generate moisture
                let moisture = moistureNoise.fbm(x * moistureScale, y * moistureScale, 3, 2, 0.6);
                moisture = (moisture + 1) / 2;
                
                // Determine biome - cohesive regions with clean edges
                // Use cliff noise to determine if this area has beaches or cliffs
                const cliffValue = cliffNoise.noise2D(x * cliffScale, y * cliffScale);
                const isCliffArea = cliffValue > (1 - cliffChance * 2); // ~35% cliff areas
                
                let biome;
                if (e < waterLevel) {
                    biome = 'water';
                } else if (e < waterLevel + beachWidth && !isCliffArea) {
                    biome = 'sand'; // Beach only in non-cliff areas
                } else {
                    // Clear biome boundaries - no scattered patches
                    if (moisture > 0.70) {
                        biome = 'forest';
                    } else if (moisture > 0.45 && moisture < 0.58 && e > 0.42 && e < 0.58) {
                        biome = 'furrows'; // Farmland in specific band
                    } else if (e > 0.70 && moisture < 0.28) {
                        biome = 'dirt'; // Only high rocky areas
                    } else {
                        biome = 'grass'; // Default - unified grass
                    }
                }
                
                // Use noise to determine tile set AND variant for visual consistency
                const tileSetValue = tileSetNoise.noise2D(x * tileSetScale, y * tileSetScale);
                const setCount = this.getTileSetCount(biome);
                // Limit tile sets for more consistency
                const limitedSetCount = Math.min(setCount, 2);
                const setIndex = Math.floor(((tileSetValue + 1) / 2) * limitedSetCount);
                
                // Get tile - isEdge = false for initial generation
                // Sand transitions are applied later in applyEdgeTransitions
                // Pass x,y for regional brush selection
                const tile = this.getRandomTile(biome, rng, setIndex, false, x, y);
                
                map[y][x] = {
                    id: tile.ID,
                    name: tile.Name || tile.name || '',
                    biome: biome,
                    elevation: e,
                    moisture: moisture,
                    tileSet: setIndex,
                    tile: tile
                };
            }
        }
        
        // Apply edge detection for transition tiles
        this.applyEdgeTransitions(map, width, height, rng);
        
        // Smooth transitions
        this.smoothTransitions(map, width, height, rng);
        
        return map;
    }
    
    /**
     * Generate a test map for testing terrain generation
     * Creates a layout with water, cliffs (using slope tiles), grass, dirt, and rock
     * 
     * KEY: Height illusion comes from SLOPE TILE ARTWORK, not Z-offsets
     */
    generateTestMap(width = 30, height = 30) {
        const rng = Math.random;
        const map = [];
        
        // Create a noise generator for the coastline
        const coastNoise = new SimplexNoise(12345);
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                let biome = 'grass';
                let elevation = 0.5;
                
                // Create a jagged coastline on the left
                const coastOffset = coastNoise.noise2D(0, y * 0.05) * 3;
                const coastLine = 6 + coastOffset;
                
                if (x < coastLine) {
                    // Water zone
                    biome = 'water';
                    elevation = 0.2;
                } else if (x > width - 8) {
                    // Mountain/Rock zone on right
                    biome = 'rock';
                    elevation = 0.9;
                } else if (x >= 12 && x <= 18 && y >= 12 && y <= 18) {
                    // Dirt patch in the middle
                    biome = 'dirt';
                    elevation = 0.55;
                } else {
                    // Regular grass - slope tiles will be auto-applied where grass meets water
                    biome = 'grass';
                    elevation = 0.5;
                }
                
                const tile = this.getRandomTile(biome, rng, 0, false, x, y);
                
                map[y][x] = {
                    id: tile ? tile.ID : '0x0003',
                    name: tile ? (tile.Name || tile.name || '') : 'grass',
                    biome: biome,
                    elevation: elevation,
                    moisture: 0.5,
                    tileSet: 0,
                    tile: tile
                };
            }
        }
        
        // Apply transitions - SLOPE TILES create the HEIGHT ILLUSION through their artwork
        // When grass meets water, we use slope/embank tiles that LOOK like cliffs
        this.applyEdgeTransitions(map, width, height, rng);
        
        return map;
    }
}
