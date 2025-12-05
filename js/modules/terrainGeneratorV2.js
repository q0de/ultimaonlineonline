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
} from '../data/uoTileSetsClean.js?v=single_rock';
import { 
    SAND_TO_GRASS_TRANSITIONS,
    GRASS_TO_SAND_TRANSITIONS, 
    calculateTransitionBitmask, 
    getTransitionTile 
} from '../data/transitionTiles.js';
import {
    getWaterTileMappings,
    getWaterTileForScenario,
    determineWaterScenario,
    shouldBeShallowEdge,
    WATER_EDGE_CONFIG,
    getBiomeEdgePatterns,
    matchTilePattern,
    applyStampBasedTransitions
} from '../data/waterTileMappings.js?v=20251205_norotate';
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
        this.waterNoise = new SimplexNoise(seed + 2000); // For water body shapes
        this.coastNoise = new SimplexNoise(seed + 3000); // For coastline jaggedness
        // ALL transition mappings from Tile Teacher (grass_sand, grass_dirt, jungle_sand, etc.)
        this.allTransitionMappings = allTransitionMappings;

        // Store generator options (allows overrides from UI/tests)
        this.options = options || {};

        // Water threshold - controls how much water is generated
        // Default 0.35 = smaller water bodies (original)
        // Enhanced mode uses 0.42 = larger lakes/rivers
        this.waterThreshold = this.options.waterThreshold ?? 0.35;
        
        // Enhanced water generation options
        this.useEnhancedWater = this.options.useEnhancedWater ?? false;

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
    
    // =========================================================================
    // ENHANCED WATER GENERATION SYSTEM
    // Creates intentional water bodies (ponds, lakes, coastlines, rivers)
    // with weighted random percentage caps
    // =========================================================================
    
    /**
     * Generate water budget using weighted random selection
     * Returns { percentage, tileCount, distribution }
     * 
     * Weights:
     * - 50% chance: 10% water coverage (most common)
     * - 30% chance: 20% water coverage
     * - 15% chance: 30% water coverage
     * - 5% chance: 40% water coverage (max, rare)
     */
    generateWaterBudget(totalTiles) {
        // Use seed-based random for consistency
        const roll = ((this.seed * 17) % 100) / 100;
        
        let percentage;
        if (roll < 0.50) {
            percentage = 0.10; // 10% - most common
        } else if (roll < 0.80) {
            percentage = 0.20; // 20% - more often
        } else if (roll < 0.95) {
            percentage = 0.30; // 30% - rarely
        } else {
            percentage = 0.40; // 40% - very rare (max)
        }
        
        const tileCount = Math.floor(totalTiles * percentage);
        
        console.log(`[WaterBudget] Roll: ${(roll * 100).toFixed(1)}% -> ${(percentage * 100)}% water = ${tileCount} tiles max`);
        
        return {
            percentage,
            tileCount,
            remaining: tileCount,
            distribution: roll < 0.50 ? 'minimal' : roll < 0.80 ? 'moderate' : roll < 0.95 ? 'substantial' : 'large'
        };
    }
    
    /**
     * Generate ocean coastline on one edge of the map
     * Uses noise for organic jagged edges
     * 
     * @param {Array} map - The terrain map
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @param {Object} budget - Water budget tracker
     * @returns {number} Number of water tiles created
     */
    generateOceanCoastline(map, width, height, budget) {
        if (budget.remaining <= 0) return 0;
        
        // Pick a random edge based on seed
        const edgeRoll = ((this.seed * 23) % 4);
        const edges = ['west', 'south', 'east', 'north'];
        const edge = edges[edgeRoll];
        
        // Base depth of coastline (how far it extends into map)
        // Scale based on budget - larger budget = deeper coastline
        const maxDepth = Math.min(Math.floor(width * 0.25), Math.floor(budget.remaining / height));
        if (maxDepth < 3) return 0; // Not enough budget for meaningful coastline
        
        const baseDepth = Math.floor(maxDepth * 0.6);
        let tilesCreated = 0;
        
        console.log(`[Ocean] Generating ${edge} coastline, base depth: ${baseDepth}, max: ${maxDepth}`);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (budget.remaining <= 0) break;
                
                let isOcean = false;
                let noiseVal = 0;
                
                switch (edge) {
                    case 'west':
                        noiseVal = this.coastNoise.noise2D(0, y * 0.08) * (maxDepth - baseDepth);
                        isOcean = x < baseDepth + noiseVal;
                        break;
                    case 'east':
                        noiseVal = this.coastNoise.noise2D(0, y * 0.08) * (maxDepth - baseDepth);
                        isOcean = x >= width - baseDepth - noiseVal;
                        break;
                    case 'south':
                        noiseVal = this.coastNoise.noise2D(x * 0.08, 0) * (maxDepth - baseDepth);
                        isOcean = y >= height - baseDepth - noiseVal;
                        break;
                    case 'north':
                        noiseVal = this.coastNoise.noise2D(x * 0.08, 0) * (maxDepth - baseDepth);
                        isOcean = y < baseDepth + noiseVal;
                        break;
                }
                
                if (isOcean && map[y][x].biome !== 'water') {
                    map[y][x].biome = 'water';
                    map[y][x].waterType = 'ocean';
                    map[y][x].elevation = 0.15;
                    tilesCreated++;
                    budget.remaining--;
                }
            }
            if (budget.remaining <= 0) break;
        }
        
        console.log(`[Ocean] Created ${tilesCreated} ocean tiles on ${edge} edge`);
        return tilesCreated;
    }
    
    /**
     * Generate lakes - larger organic water bodies with SMOOTH edges
     * 
     * @param {Array} map - The terrain map
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @param {Object} budget - Water budget tracker
     * @param {number} count - Number of lakes to attempt
     * @returns {number} Number of water tiles created
     */
    generateLakes(map, width, height, budget, count = 2) {
        if (budget.remaining <= 0) return 0;
        
        let totalCreated = 0;
        
        for (let i = 0; i < count; i++) {
            if (budget.remaining < 20) break; // Need at least 20 tiles for a lake
            
            // Pick lake center - avoid edges
            const margin = 8;
            const cx = margin + ((this.seed * (13 + i * 7)) % (width - margin * 2));
            const cy = margin + ((this.seed * (17 + i * 11)) % (height - margin * 2));
            
            // Lake radius: 6-12 tiles
            const baseRadius = 6 + ((this.seed * (19 + i * 5)) % 7);
            const maxRadius = Math.min(baseRadius, Math.sqrt(budget.remaining / Math.PI));
            
            if (maxRadius < 4) continue;
            
            let lakeTiles = 0;
            const lakePositions = [];
            
            // First pass: Carve lake with SMOOTH circular shape
            // Use very low noise influence for cleaner edges
            for (let dy = -maxRadius - 1; dy <= maxRadius + 1; dy++) {
                for (let dx = -maxRadius - 1; dx <= maxRadius + 1; dx++) {
                    const tx = Math.floor(cx + dx);
                    const ty = Math.floor(cy + dy);
                    
                    if (tx < 1 || tx >= width - 1 || ty < 1 || ty >= height - 1) continue;
                    if (budget.remaining <= 0) break;
                    if (map[ty][tx].biome === 'water') continue;
                    
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // SMOOTH: Very subtle noise for slight organic variation (reduced from 2.5 to 0.8)
                    const edgeNoise = this.waterNoise.noise2D(tx * 0.15 + i * 100, ty * 0.15) * 0.8;
                    
                    // Use smooth falloff at edges
                    const effectiveRadius = maxRadius + edgeNoise;
                    
                    if (dist < effectiveRadius) {
                        lakePositions.push({ tx, ty, dist });
                    }
                }
                if (budget.remaining <= 0) break;
            }
            
            // Second pass: Apply lake tiles with budget check
            for (const pos of lakePositions) {
                if (budget.remaining <= 0) break;
                if (map[pos.ty][pos.tx].biome === 'water') continue;
                
                map[pos.ty][pos.tx].biome = 'water';
                map[pos.ty][pos.tx].waterType = 'lake';
                map[pos.ty][pos.tx].elevation = 0.1 + (pos.dist / maxRadius) * 0.15;
                lakeTiles++;
                budget.remaining--;
            }
            
            // Third pass: Smooth lake edges - fill in single-tile gaps
            if (lakeTiles > 0) {
                lakeTiles += this.smoothWaterEdges(map, width, height, budget, cx, cy, maxRadius + 2);
            }
            
            console.log(`[Lake ${i + 1}] Created at (${Math.floor(cx)}, ${Math.floor(cy)}) with ${lakeTiles} tiles, radius ~${Math.floor(maxRadius)}`);
            totalCreated += lakeTiles;
        }
        
        return totalCreated;
    }
    
    /**
     * Smooth water body edges - fill gaps and remove single-tile protrusions
     * Creates cleaner, more natural-looking coastlines
     */
    smoothWaterEdges(map, width, height, budget, centerX, centerY, radius) {
        let added = 0;
        const checkRadius = Math.ceil(radius);
        
        // Fill in tiles that are surrounded by water on 3+ sides
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const tx = Math.floor(centerX + dx);
                const ty = Math.floor(centerY + dy);
                
                if (tx < 1 || tx >= width - 1 || ty < 1 || ty >= height - 1) continue;
                if (map[ty][tx].biome === 'water') continue;
                if (budget.remaining <= 0) break;
                
                // Count water neighbors (cardinal directions)
                let waterNeighbors = 0;
                if (map[ty - 1][tx].biome === 'water') waterNeighbors++;
                if (map[ty + 1][tx].biome === 'water') waterNeighbors++;
                if (map[ty][tx - 1].biome === 'water') waterNeighbors++;
                if (map[ty][tx + 1].biome === 'water') waterNeighbors++;
                
                // If surrounded by 3+ water tiles, fill it in (removes "staircase" edges)
                if (waterNeighbors >= 3) {
                    map[ty][tx].biome = 'water';
                    map[ty][tx].waterType = 'lake';
                    map[ty][tx].elevation = 0.15;
                    added++;
                    budget.remaining--;
                }
            }
        }
        
        return added;
    }
    
    /**
     * Fill holes inside water bodies - finds enclosed land and converts to water
     * This ensures water bodies are solid without internal gaps
     * 
     * Algorithm: Any land tile that cannot reach the map edge without crossing water
     * is considered "enclosed" and should be filled with water.
     */
    fillWaterHoles(map, width, height) {
        let filled = 0;
        
        // Step 1: Mark all land tiles that CAN reach the edge (not enclosed)
        const canReachEdge = [];
        for (let y = 0; y < height; y++) {
            canReachEdge[y] = [];
            for (let x = 0; x < width; x++) {
                canReachEdge[y][x] = false;
            }
        }
        
        // Flood fill from all edge land tiles
        const queue = [];
        
        // Add all edge tiles that are land
        for (let x = 0; x < width; x++) {
            if (map[0][x].biome !== 'water') queue.push({ x, y: 0 });
            if (map[height - 1][x].biome !== 'water') queue.push({ x, y: height - 1 });
        }
        for (let y = 0; y < height; y++) {
            if (map[y][0].biome !== 'water') queue.push({ x: 0, y });
            if (map[y][width - 1].biome !== 'water') queue.push({ x: width - 1, y });
        }
        
        // Flood fill to find all land connected to edges
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (canReachEdge[y][x]) continue;
            if (map[y][x].biome === 'water') continue;
            
            canReachEdge[y][x] = true;
            
            // Add neighbors (cardinal directions)
            queue.push({ x: x + 1, y });
            queue.push({ x: x - 1, y });
            queue.push({ x, y: y + 1 });
            queue.push({ x, y: y - 1 });
        }
        
        // Step 2: Any land tile that cannot reach edge is enclosed - fill with water
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (map[y][x].biome !== 'water' && !canReachEdge[y][x]) {
                    // This land is enclosed by water - fill it
                    map[y][x].biome = 'water';
                    map[y][x].waterType = 'lake';
                    map[y][x].elevation = 0.15;
                    filled++;
                }
            }
        }
        
        console.log(`[FillHoles] Filled ${filled} enclosed land tiles with water`);
        return filled;
    }
    
    /**
     * Additional pass to fill small gaps - tiles surrounded by water on ALL 4 cardinal sides
     * or tiles surrounded on 3+ sides that are also diagonally surrounded
     */
    fillSmallGaps(map, width, height) {
        let filled = 0;
        let passes = 0;
        const maxPasses = 5; // Limit iterations
        
        do {
            filled = 0;
            passes++;
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    if (map[y][x].biome === 'water') continue;
                    
                    // Count water neighbors (cardinal)
                    let cardinalWater = 0;
                    if (map[y - 1][x].biome === 'water') cardinalWater++;
                    if (map[y + 1][x].biome === 'water') cardinalWater++;
                    if (map[y][x - 1].biome === 'water') cardinalWater++;
                    if (map[y][x + 1].biome === 'water') cardinalWater++;
                    
                    // Count water neighbors (diagonal)
                    let diagonalWater = 0;
                    if (map[y - 1][x - 1].biome === 'water') diagonalWater++;
                    if (map[y - 1][x + 1].biome === 'water') diagonalWater++;
                    if (map[y + 1][x - 1].biome === 'water') diagonalWater++;
                    if (map[y + 1][x + 1].biome === 'water') diagonalWater++;
                    
                    // Fill if surrounded on all 4 cardinal sides
                    // OR surrounded on 3 cardinal + 2+ diagonal (almost enclosed)
                    if (cardinalWater === 4 || (cardinalWater >= 3 && diagonalWater >= 2)) {
                        map[y][x].biome = 'water';
                        map[y][x].waterType = 'lake';
                        map[y][x].elevation = 0.15;
                        filled++;
                    }
                }
            }
        } while (filled > 0 && passes < maxPasses);
        
        console.log(`[FillGaps] Filled gaps in ${passes} passes`);
        return filled;
    }
    
    /**
     * Generate ponds - small SMOOTH circular water bodies
     * 
     * @param {Array} map - The terrain map
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @param {Object} budget - Water budget tracker
     * @param {number} count - Number of ponds to attempt
     * @returns {number} Number of water tiles created
     */
    generatePonds(map, width, height, budget, count = 5) {
        if (budget.remaining <= 0) return 0;
        
        let totalCreated = 0;
        
        for (let i = 0; i < count; i++) {
            if (budget.remaining < 5) break; // Need at least 5 tiles for a pond
            
            // Pick pond center - can be anywhere but avoid very edges
            const margin = 3;
            const cx = margin + ((this.seed * (29 + i * 13)) % (width - margin * 2));
            const cy = margin + ((this.seed * (31 + i * 17)) % (height - margin * 2));
            
            // Check if center is already water (skip if so)
            if (map[Math.floor(cy)][Math.floor(cx)].biome === 'water') continue;
            
            // Pond radius: 2-5 tiles
            const baseRadius = 2 + ((this.seed * (37 + i * 3)) % 4);
            const maxRadius = Math.min(baseRadius, Math.sqrt(budget.remaining / Math.PI));
            
            if (maxRadius < 2) continue;
            
            let pondTiles = 0;
            const pondPositions = [];
            
            // First pass: Create SMOOTH circular pond with minimal noise
            for (let dy = -maxRadius; dy <= maxRadius; dy++) {
                for (let dx = -maxRadius; dx <= maxRadius; dx++) {
                    const tx = Math.floor(cx + dx);
                    const ty = Math.floor(cy + dy);
                    
                    if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
                    if (map[ty][tx].biome === 'water') continue;
                    
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // SMOOTH: Almost no noise for clean circular ponds (reduced from 0.8 to 0.3)
                    const edgeNoise = this.waterNoise.noise2D(tx * 0.3 + i * 50, ty * 0.3) * 0.3;
                    
                    if (dist < maxRadius + edgeNoise) {
                        pondPositions.push({ tx, ty });
                    }
                }
            }
            
            // Second pass: Apply pond tiles with budget check
            for (const pos of pondPositions) {
                if (budget.remaining <= 0) break;
                if (map[pos.ty][pos.tx].biome === 'water') continue;
                
                map[pos.ty][pos.tx].biome = 'water';
                map[pos.ty][pos.tx].waterType = 'pond';
                map[pos.ty][pos.tx].elevation = 0.2;
                pondTiles++;
                budget.remaining--;
            }
            
            if (pondTiles > 0) {
                console.log(`[Pond ${i + 1}] Created at (${Math.floor(cx)}, ${Math.floor(cy)}) with ${pondTiles} tiles`);
                totalCreated += pondTiles;
            }
        }
        
        return totalCreated;
    }
    
    /**
     * Generate rivers - thin water paths flowing toward water bodies
     * 
     * @param {Array} map - The terrain map
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @param {Object} budget - Water budget tracker
     * @param {number} count - Number of rivers to attempt
     * @returns {number} Number of water tiles created
     */
    generateRivers(map, width, height, budget, count = 1) {
        if (budget.remaining < 10) return 0;
        
        let totalCreated = 0;
        
        for (let i = 0; i < count; i++) {
            if (budget.remaining < 8) break;
            
            // Find a starting point at higher elevation (not water, not at edge)
            let startX, startY;
            let attempts = 0;
            
            do {
                startX = 5 + ((this.seed * (41 + i * 19)) % (width - 10));
                startY = 5 + ((this.seed * (43 + i * 23)) % (height - 10));
                attempts++;
            } while (attempts < 20 && (
                map[startY][startX].biome === 'water' ||
                map[startY][startX].elevation < 0.5
            ));
            
            if (attempts >= 20) continue;
            
            // Flow downhill toward water or edge
            let x = startX;
            let y = startY;
            let riverTiles = 0;
            const riverPath = [];
            const maxSteps = 50;
            
            for (let step = 0; step < maxSteps; step++) {
                if (budget.remaining <= 0) break;
                if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) break;
                
                // Check if we hit existing water
                if (map[y][x].biome === 'water' && map[y][x].waterType !== 'river') {
                    console.log(`[River ${i + 1}] Connected to ${map[y][x].waterType || 'water'} at (${x}, ${y})`);
                    break;
                }
                
                // Make this tile water
                if (map[y][x].biome !== 'water') {
                    map[y][x].biome = 'water';
                    map[y][x].waterType = 'river';
                    map[y][x].elevation = 0.25;
                    riverPath.push({ x, y });
                    riverTiles++;
                    budget.remaining--;
                }
                
                // Find lowest neighbor (prefer cardinal directions)
                let lowestElev = map[y][x].elevation;
                let nextX = x;
                let nextY = y;
                
                const directions = [
                    [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
                    [-1, -1], [1, -1], [-1, 1], [1, 1]  // Diagonal
                ];
                
                // Add some randomness to direction choice
                const dirNoise = this.waterNoise.noise2D(x * 0.5 + i * 30, y * 0.5);
                
                for (const [dx, dy] of directions) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    
                    const neighborElev = map[ny][nx].elevation + dirNoise * 0.1;
                    
                    // Prefer lower elevation or existing water
                    if (map[ny][nx].biome === 'water' || neighborElev < lowestElev) {
                        lowestElev = neighborElev;
                        nextX = nx;
                        nextY = ny;
                    }
                }
                
                // If stuck (no lower point), try to continue in general downhill direction
                if (nextX === x && nextY === y) {
                    // Pick a random direction biased toward map edges
                    const edgeBias = [
                        x < width / 2 ? -1 : 1,
                        y < height / 2 ? -1 : 1
                    ];
                    nextX = x + edgeBias[0];
                    nextY = y + edgeBias[1];
                    
                    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) break;
                }
                
                x = nextX;
                y = nextY;
            }
            
            // Widen river slightly at some points (1-2 tiles wide)
            if (riverPath.length > 5 && budget.remaining > 0) {
                for (let j = 0; j < riverPath.length; j += 3) {
                    const pos = riverPath[j];
                    const widthNoise = this.waterNoise.noise2D(pos.x * 0.3, pos.y * 0.3);
                    
                    if (widthNoise > 0.2 && budget.remaining > 0) {
                        // Add adjacent tile
                        const adjDir = widthNoise > 0.5 ? [[1, 0], [0, 1]] : [[-1, 0], [0, -1]];
                        for (const [dx, dy] of adjDir) {
                            const ax = pos.x + dx;
                            const ay = pos.y + dy;
                            if (ax >= 0 && ax < width && ay >= 0 && ay < height) {
                                if (map[ay][ax].biome !== 'water' && budget.remaining > 0) {
                                    map[ay][ax].biome = 'water';
                                    map[ay][ax].waterType = 'river';
                                    map[ay][ax].elevation = 0.25;
                                    riverTiles++;
                                    budget.remaining--;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            console.log(`[River ${i + 1}] Created from (${startX}, ${startY}) with ${riverTiles} tiles`);
            totalCreated += riverTiles;
        }
        
        return totalCreated;
    }
    
    /**
     * Apply sand beaches around water bodies
     * Creates natural beach transitions
     */
    applyBeachTransitions(map, width, height) {
        const beachTiles = [];
        
        // Find all land tiles adjacent to water
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (tile.biome === 'water') continue;
                
                // Check if adjacent to water
                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                let adjacentToWater = false;
                
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        if (map[ny][nx].biome === 'water') {
                            adjacentToWater = true;
                            break;
                        }
                    }
                }
                
                if (adjacentToWater) {
                    // Chance to become sand beach (higher for ocean/lake, lower for river/pond)
                    const waterType = this.getAdjacentWaterType(map, x, y, width, height);
                    let beachChance = 0.6;
                    
                    if (waterType === 'river') beachChance = 0.2;
                    else if (waterType === 'pond') beachChance = 0.4;
                    else if (waterType === 'ocean') beachChance = 0.75;
                    
                    // Use position-based randomness
                    const roll = ((x * 13 + y * 7) % 100) / 100;
                    
                    if (roll < beachChance && tile.biome !== 'rock' && tile.biome !== 'dirt') {
                        beachTiles.push({ x, y });
                    }
                }
            }
        }
        
        // Apply beach tiles
        for (const { x, y } of beachTiles) {
            map[y][x].biome = 'sand';
            map[y][x].elevation = Math.max(map[y][x].elevation, 0.35);
        }
        
        console.log(`[Beach] Created ${beachTiles.length} beach/sand tiles around water`);
        return beachTiles.length;
    }
    
    /**
     * Get the type of water adjacent to a tile
     */
    getAdjacentWaterType(map, x, y, width, height) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (map[ny][nx].biome === 'water') {
                    return map[ny][nx].waterType || 'water';
                }
            }
        }
        return 'water';
    }
    
    /**
     * Generate a map with intentional water bodies using the enhanced water system
     * 
     * This method:
     * 1. Generates base terrain WITHOUT water
     * 2. Calculates water budget (weighted random 10-40%)
     * 3. Generates water bodies: Ocean (30% chance) -> Lakes -> Ponds -> Rivers
     * 4. Applies beach transitions
     * 5. Assigns tiles and applies normal terrain processing
     * 
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @returns {Object} { map, waterStats }
     */
    generateMapWithWaterBodies(width, height) {
        console.log(`[EnhancedWater] Generating ${width}x${height} map with intentional water bodies`);
        
        const map = [];
        const totalTiles = width * height;
        
        // Step 1: Generate base terrain WITHOUT water
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                const scale1 = 0.02;
                const scale2 = 0.05;
                const scale3 = 0.1;
                
                const e1 = this.noise.noise2D(x * scale1, y * scale1);
                const e2 = this.noise.noise2D(x * scale2 + 100, y * scale2 + 100) * 0.5;
                const e3 = this.noise.noise2D(x * scale3 + 200, y * scale3 + 200) * 0.25;
                
                // Normalize to 0.3-1.0 range (no water from elevation)
                const elevation = 0.3 + ((e1 + e2 + e3 + 1.75) / 3.5) * 0.7;
                
                const m1 = this.noise.noise2D(x * scale1 + 500, y * scale1 + 500);
                const m2 = this.noise.noise2D(x * scale2 + 600, y * scale2 + 600) * 0.5;
                const moisture = (m1 + m2 + 1.5) / 3;
                
                // Get biome WITHOUT water check
                const biome = this.getBiomeLand(elevation, moisture, x, y);
                
                map[y][x] = {
                    id: null,
                    biome: biome,
                    elevation: elevation,
                    moisture: moisture,
                    z: 0,
                    surfaceClass: determineSurfaceClass({ biome })
                };
            }
        }
        
        // Step 2: Calculate water budget
        const budget = this.generateWaterBudget(totalTiles);
        
        // Step 3: Generate water bodies in order
        const waterStats = {
            budget: budget.tileCount,
            budgetPercentage: budget.percentage,
            distribution: budget.distribution,
            ocean: 0,
            lakes: 0,
            ponds: 0,
            rivers: 0,
            beaches: 0,
            total: 0
        };
        
        // Ocean coastline (30% chance, uses large portion of budget)
        const hasOcean = ((this.seed * 29) % 100) < 30;
        if (hasOcean && budget.remaining > totalTiles * 0.05) {
            waterStats.ocean = this.generateOceanCoastline(map, width, height, budget);
        }
        
        // Lakes (1-3 depending on budget)
        const lakeCount = budget.distribution === 'minimal' ? 1 : 
                          budget.distribution === 'moderate' ? 2 : 
                          budget.distribution === 'substantial' ? 2 : 3;
        if (budget.remaining > 20) {
            waterStats.lakes = this.generateLakes(map, width, height, budget, lakeCount);
        }
        
        // Ponds (3-8 depending on budget)
        const pondCount = budget.distribution === 'minimal' ? 3 : 
                          budget.distribution === 'moderate' ? 5 : 
                          budget.distribution === 'substantial' ? 6 : 8;
        if (budget.remaining > 5) {
            waterStats.ponds = this.generatePonds(map, width, height, budget, pondCount);
        }
        
        // Rivers (1-2 to connect features)
        const riverCount = budget.remaining > 30 ? 2 : budget.remaining > 15 ? 1 : 0;
        if (riverCount > 0) {
            waterStats.rivers = this.generateRivers(map, width, height, budget, riverCount);
        }
        
        // Step 4a: Fill holes inside water bodies (enclosed land -> water)
        const holesFilled = this.fillWaterHoles(map, width, height);
        
        // Step 4b: Fill small gaps (tiles mostly surrounded by water)
        const gapsFilled = this.fillSmallGaps(map, width, height);
        
        waterStats.holesFilled = holesFilled + gapsFilled;
        
        // Step 4c: Apply beach transitions
        waterStats.beaches = this.applyBeachTransitions(map, width, height);
        
        // Calculate total water
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x].biome === 'water') {
                    waterStats.total++;
                }
            }
        }
        
        console.log(`[EnhancedWater] Water stats: ${JSON.stringify(waterStats)}`);
        console.log(`[EnhancedWater] Actual water: ${waterStats.total}/${totalTiles} = ${((waterStats.total / totalTiles) * 100).toFixed(1)}%`);
        
        // Step 5: Assign tiles with context
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                const biome = tile.biome;
                
                const context = this.getTerrainContext(map, x, y, width, height);
                const setIndex = this.getTileSetIndex(biome, x, y);
                
                tile.id = this.getTileFromSetAtPosition(biome, x, y, setIndex, context);
                tile.setIndex = setIndex;
                const numericTileId = normalizeTileId(tile.id);
                tile.surfaceClass = determineSurfaceClass({ tileId: numericTileId, biome });
            }
        }
        
        // Step 6: Calculate Z-heights
        this.calculateZHeights(map, width, height);
        
        // Step 7: Apply transitions using MAP-BASED corners (not noise-based)
        // This is important because water was placed intentionally, not from elevation noise
        this.applyTransitionsFromMap(map, width, height);
        
        return { map, waterStats };
    }
    
    /**
     * Get biome for LAND only (no water check)
     * Used by enhanced water generation to create base terrain
     */
    getBiomeLand(elevation, moisture, x = 0, y = 0) {
        // RARE desert patches - only in VERY dry, low areas
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
        
        // Very high = rock
        return 'rock';
    }
    
    /**
     * Get biome based on elevation and moisture
     * 
     * Sand Logic: Sand appears PRIMARILY near water (beaches).
     * - Primary: Narrow band just above water level (elevation 0.42-0.48)
     * - Secondary: RARE desert patches in very dry, low areas (10% chance)
     */
    getBiome(elevation, moisture, x = 0, y = 0) {
        // Water threshold is configurable (default 0.35, Enhanced mode uses 0.42)
        if (elevation < this.waterThreshold) return 'water';
        
        // Beach/Sand zone - MORE LIKELY near water but not guaranteed
        // This creates varied coastlines: beaches, cliffs, rocky shores, jungle coasts
        const coastZone = elevation < (this.waterThreshold + 0.08); // Near water
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
                    // Scale elevation above water (0.42-1.0) to Z (0-15)
                    // Using smaller range (0-15) for gentler slopes
                    const elevAboveWater = Math.max(0, tile.elevation - 0.42) / 0.58;
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
                
                // Tiles adjacent to water - randomly decide shallow vs cliff
                if (isAdjacentToWater) {
                    // Use position-based randomness for consistency
                    const randomSeed = ((x * 13 + y * 29) % 1000) / 1000;
                    const isShallow = randomSeed < WATER_EDGE_CONFIG.shallowChance;
                    
                    tile.isShallowWaterEdge = isShallow;
                    
                    if (isShallow) {
                        // Shallow edge - minimal Z difference (smooth transition)
                        tile.z = Math.max(tile.z, WATER_EDGE_CONFIG.shallowZHeight);
                    } else {
                        // Cliff edge - higher Z for dramatic cliff effect
                        tile.z = Math.max(tile.z, WATER_EDGE_CONFIG.cliffZHeight);
                    }
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
        
        // Apply terrain edge tiles (rock-grass, sand-grass, etc.) from Tile Teacher
        this.applyTerrainEdgeTiles(map, width, height);
        
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
     * Apply transitions using MAP-BASED corner detection
     * 
     * Used when water bodies are placed intentionally (not from elevation noise).
     * Detects biome corners directly from the map tiles instead of noise.
     * This ensures water-to-land transitions work properly for lakes/ponds/rivers.
     */
    applyTransitionsFromMap(map, width, height) {
        // Pass null for corners - apply8BitTransitions will generate from map
        // This uses the enhanced generateCornerBiomesFromMap which detects water
        apply8BitTransitions(map, width, height, null, this.allTransitionMappings);
        
        // Apply water edge tiles (embankment/cliff tiles) - UO Style  
        this.applyWaterEdgeTiles(map, width, height);
        
        // Apply terrain edge tiles (rock-grass, sand-grass, etc.) from Tile Teacher
        this.applyTerrainEdgeTiles(map, width, height);
        
        // Debug: Log transition info
        let transitionCount = 0;
        let waterEdgeCount = 0;
        let waterTransitions = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x].isTransition) {
                    transitionCount++;
                    if (map[y][x].transitionType && map[y][x].transitionType.includes('water')) {
                        waterTransitions++;
                    }
                }
                if (map[y][x].isWaterEdge) {
                    waterEdgeCount++;
                }
            }
        }
        console.log(`Applied ${transitionCount} transition tiles (${waterTransitions} water transitions)`);
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
        // Load user's tile mappings from Water Tile Teacher
        const userMappings = getWaterTileMappings();
        
        // Configuration - how often to apply embankment tiles
        // When procedural regioning (tile teacher data) is unavailable we lower this automatically.
        const EMBANKMENT_CHANCE = Math.min(1, Math.max(0, this.embankmentChance ?? 0.7));
        const MIN_Z_FOR_CLIFF = WATER_EDGE_CONFIG.cliffZHeight; // Minimum Z for cliff effect
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
                
                const waterDir = this.getWaterDirection(map, x, y, width, height);
                const isShallow = tile.isShallowWaterEdge;
                
                // Determine water neighbors for scenario lookup
                const waterNeighbors = {
                    north: waterDir.north,
                    south: waterDir.south,
                    east: waterDir.east,
                    west: waterDir.west
                };
                
                // Get scenario ID and check for user-configured tile
                const scenarioId = determineWaterScenario(isShallow, waterNeighbors);
                const userTile = scenarioId ? getWaterTileForScenario(scenarioId, userMappings) : null;
                
                // If user has configured this scenario, use their tile
                if (userTile) {
                    const parsedTileId = parseInt(userTile, 16);
                    // Only apply if valid tile ID (not 0, not NaN)
                    if (parsedTileId && !isNaN(parsedTileId) && parsedTileId > 0) {
                        tile.id = parsedTileId;
                        tile.isWaterEdgeTile = true;
                        tile.waterEdgeScenario = scenarioId;
                        appliedCount++;
                    }
                    continue;
                }
                
                // For shallow edges without user mapping, skip embankment
                if (isShallow) {
                    skippedLowZ++;
                    continue;
                }
                
                // Only apply embankment if Z-height is significant (cliff effect)
                if (tile.z < MIN_Z_FOR_CLIFF) {
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
     * Apply terrain edge tiles for non-water biome transitions (rock-grass, sand-grass, etc.)
     * Uses user-configured tiles from the Tile Teacher tool
     * 
     * @param {Array} map - The map array
     * @param {number} width - Map width
     * @param {number} height - Map height
     */
    applyTerrainEdgeTiles(map, width, height) {
        // Load user's tile mappings from Tile Teacher (legacy format)
        const userMappings = getWaterTileMappings();
        
        // Load 3x3 patterns for full pattern matching (new format)
        const savedPatterns = getBiomeEdgePatterns();
        
        // Debug: Log what mappings we have
        const terrainKeys = Object.keys(userMappings).filter(k => 
            k.startsWith('rock_grass') || k.startsWith('sand_grass') || 
            k.startsWith('forest_grass') || k.startsWith('dirt_grass')
        );
        
        // ============ STAMP-BASED APPROACH ============
        // Place complete 3x3 stamps as coherent units along edges
        if (savedPatterns.length > 0) {
            const hasPositionTiles = savedPatterns.some(p => p.positionTiles);
            
            // DEBUG: Show what's in the patterns
            console.log(`[TerrainEdgeTiles] Checking ${savedPatterns.length} patterns for positionTiles...`);
            if (savedPatterns.length > 0) {
                const sample = savedPatterns[0];
                console.log(`[TerrainEdgeTiles] Sample pattern keys:`, Object.keys(sample));
                console.log(`[TerrainEdgeTiles] Has positionTiles:`, !!sample.positionTiles);
                if (sample.positionTiles) {
                    console.log(`[TerrainEdgeTiles] positionTiles:`, sample.positionTiles);
                }
            }
            
            if (hasPositionTiles) {
                console.log(`[TerrainEdgeTiles] ✅ Using STAMP-BASED 3x3 pattern placement with ${savedPatterns.length} patterns`);
                console.log(`[TerrainEdgeTiles] Stamps will be placed as complete 3x3 units along biome edges`);
                
                // Use the new stamp-based approach
                const stampCount = applyStampBasedTransitions(map, savedPatterns);
                console.log(`[TerrainEdgeTiles] Stamp-based transitions applied: ${stampCount} stamps placed`);
                return; // Done with stamp-based approach
            } else {
                console.log(`[TerrainEdgeTiles] ⚠️ Patterns don't have positionTiles!`);
                console.log(`[TerrainEdgeTiles] Please re-save patterns in Edge Configurator to enable stamp-based mode`);
            }
        }
        
        if (terrainKeys.length > 0) {
            console.log(`[TerrainEdgeTiles] Fallback to direction matching with ${terrainKeys.length} mappings`);
        } else {
            console.log('[TerrainEdgeTiles] No patterns found. Configure via biome_edge_configurator.html');
            return;
        }
        
        // ============ LEGACY FALLBACK: Direction-based matching ============
        // Only used if no stamp patterns are available
        
        // Define which biome pairs we support
        const BIOME_PAIRS = [
            { a: 'rock', b: 'grass', prefix: 'rock_grass' },
            { a: 'sand', b: 'grass', prefix: 'sand_grass' },
            { a: 'forest', b: 'grass', prefix: 'forest_grass' },
            { a: 'dirt', b: 'grass', prefix: 'dirt_grass' },
            { a: 'rock', b: 'sand', prefix: 'rock_sand' },
            { a: 'sand', b: 'water', prefix: 'sand_water' },
        ];
        
        let fallbackMatchCount = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                const tileBiome = tile.biome;
                
                // Check neighbors
                const north = map[y - 1]?.[x];
                const south = map[y + 1]?.[x];
                const east = map[y]?.[x + 1];
                const west = map[y]?.[x - 1];
                
                // For each biome pair, check if this tile is on an edge
                for (const pair of BIOME_PAIRS) {
                    // Check if this tile is biome A bordering biome B
                    const isA = tileBiome === pair.a;
                    const isB = tileBiome === pair.b;
                    
                    if (!isA && !isB) continue;
                    
                    const otherBiome = isA ? pair.b : pair.a;
                    
                    // Check which directions border the other biome
                    const hasNorth = north?.biome === otherBiome;
                    const hasSouth = south?.biome === otherBiome;
                    const hasEast = east?.biome === otherBiome;
                    const hasWest = west?.biome === otherBiome;
                    
                    const adjacentCount = [hasNorth, hasSouth, hasEast, hasWest].filter(Boolean).length;
                    if (adjacentCount === 0) continue;
                    
                    // Determine scenario key based on direction mapping mode
                    const dirMode = (typeof window !== 'undefined' && window.terrainDirectionMode) || 'normal';
                    let scenarioKey = null;
                    
                    // Helper to get direction based on mode
                    const getDir = (hasN, hasS, hasE, hasW) => {
                        if (dirMode === 'normal') {
                            if (hasN) return 'north';
                            if (hasS) return 'south';
                            if (hasE) return 'east';
                            if (hasW) return 'west';
                        } else if (dirMode === 'inverted') {
                            if (hasN) return 'south';
                            if (hasS) return 'north';
                            if (hasE) return 'west';
                            if (hasW) return 'east';
                        } else if (dirMode === 'swap_ns') {
                            if (hasN) return 'south';
                            if (hasS) return 'north';
                            if (hasE) return 'east';
                            if (hasW) return 'west';
                        } else if (dirMode === 'swap_ew') {
                            if (hasN) return 'north';
                            if (hasS) return 'south';
                            if (hasE) return 'west';
                            if (hasW) return 'east';
                        }
                        return null;
                    };
                    
                    // Single edge
                    if (adjacentCount === 1) {
                        const dir = getDir(hasNorth, hasSouth, hasEast, hasWest);
                        if (dir) scenarioKey = `${pair.prefix}_${dir}`;
                    }
                    // Corner (two adjacent edges)
                    else if (adjacentCount === 2) {
                        if (dirMode === 'normal') {
                            if (hasNorth && hasEast) scenarioKey = `${pair.prefix}_corner_ne`;
                            else if (hasNorth && hasWest) scenarioKey = `${pair.prefix}_corner_nw`;
                            else if (hasSouth && hasEast) scenarioKey = `${pair.prefix}_corner_se`;
                            else if (hasSouth && hasWest) scenarioKey = `${pair.prefix}_corner_sw`;
                        } else {
                            if (hasNorth && hasEast) scenarioKey = `${pair.prefix}_corner_sw`;
                            else if (hasNorth && hasWest) scenarioKey = `${pair.prefix}_corner_se`;
                            else if (hasSouth && hasEast) scenarioKey = `${pair.prefix}_corner_nw`;
                            else if (hasSouth && hasWest) scenarioKey = `${pair.prefix}_corner_ne`;
                        }
                    }
                    // Inner corner (three edges = peninsula into other biome)
                    else if (adjacentCount === 3) {
                        if (dirMode === 'normal') {
                            if (!hasNorth) scenarioKey = `${pair.prefix}_inner_sw`;
                            else if (!hasSouth) scenarioKey = `${pair.prefix}_inner_ne`;
                            else if (!hasEast) scenarioKey = `${pair.prefix}_inner_nw`;
                            else if (!hasWest) scenarioKey = `${pair.prefix}_inner_se`;
                        } else {
                            if (!hasNorth) scenarioKey = `${pair.prefix}_inner_ne`;
                            else if (!hasSouth) scenarioKey = `${pair.prefix}_inner_sw`;
                            else if (!hasEast) scenarioKey = `${pair.prefix}_inner_se`;
                            else if (!hasWest) scenarioKey = `${pair.prefix}_inner_nw`;
                        }
                    }
                    
                    // ALWAYS mark as terrain edge if we found a valid scenario
                    // This ensures labels show even if no tile mapping exists
                    if (scenarioKey) {
                        tile.isTerrainEdge = true;
                        tile.terrainEdgeScenario = scenarioKey;
                        tile.patternSetName = pair.prefix; // e.g., 'rock_grass' for debug labels
                        // Extract position from scenarioKey for fallback (e.g., 'rock_grass_north' -> 'N')
                        const dirPart = scenarioKey.replace(pair.prefix + '_', '');
                        tile.terrainEdgePosition = dirPart.toUpperCase().replace('CORNER_', '').replace('INNER_', 'I-');
                        
                        // Apply the user's saved tile if available
                        if (userMappings[scenarioKey]) {
                            const tileIdStr = userMappings[scenarioKey];
                            const tileId = typeof tileIdStr === 'string' 
                                ? parseInt(tileIdStr.replace('0x', ''), 16)
                                : tileIdStr;
                            
                            if (tileId && !isNaN(tileId) && tileId > 0) {
                                tile.id = tileId;
                            }
                        }
                        fallbackMatchCount++;
                        break;
                    }
                }
            }
        }
        
        if (fallbackMatchCount > 0) {
            console.log(`[TerrainEdgeTiles] Applied ${fallbackMatchCount} transitions via legacy direction matching`);
        }
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

