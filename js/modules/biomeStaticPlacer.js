/**
 * Biome-Based Static Placer
 * Procedurally places trees, rocks, plants, and creatures based on terrain type
 * Mimics how Ultima Online's world was designed
 */

import { 
    determineSurfaceClass, 
    normalizeTileId, 
    isRoadSurface, 
    isTreeFriendlySurface, 
    isWaterSurface 
} from '../data/landSurfaceClassifier.js';

export class BiomeStaticPlacer {
    constructor() {
        this.treePrefabs = {};
        // Define static pools for each biome
        // Graphics IDs are from real UO static art
        this.biomeProfiles = {
            grass: {
                name: 'Grassland',
                density: 0.06,  // 6% of tiles get statics
                statics: {
                    trees: [
                        { prefab: 'tree_prefab_001', fallbackGraphic: 0x0CCA, weight: 20, name: 'oak cluster', zOffset: 0 },
                        { prefab: 'tree_prefab_002', fallbackGraphic: 0x0CD0, weight: 15, name: 'paired oak', zOffset: 0 },
                        { graphic: 0x0CCB, weight: 25, name: 'oak tree 2', zOffset: 0 },
                        { graphic: 0x0CCD, weight: 20, name: 'small oak', zOffset: 0 },
                        { graphic: 0x0CD0, weight: 15, name: 'walnut tree', zOffset: 0 },
                        { graphic: 0x0CD3, weight: 10, name: 'willow', zOffset: 0 },
                    ],
                    plants: [
                        { graphic: 0x0C45, weight: 40, name: 'bush', zOffset: 0 },
                        { graphic: 0x0C46, weight: 35, name: 'small bush', zOffset: 0 },
                        { graphic: 0x0C83, weight: 20, name: 'flowers', zOffset: 0 },
                        { graphic: 0x0C84, weight: 20, name: 'flowers 2', zOffset: 0 },
                        { graphic: 0x0C8E, weight: 15, name: 'tall grass', zOffset: 0 },
                    ],
                    rocks: [
                        { graphic: 0x1363, weight: 15, name: 'small rock', zOffset: 0 },
                        { graphic: 0x1364, weight: 10, name: 'rock pile', zOffset: 0 },
                    ]
                },
                categoryWeights: { trees: 40, plants: 50, rocks: 10 }
            },
            
            forest: {
                name: 'Forest',
                density: 0.18,  // Dense trees
                statics: {
                    trees: [
                        { prefab: 'tree_prefab_003', fallbackGraphic: 0x0CD3, weight: 20, name: 'forest canopy', zOffset: 0 },
                        { graphic: 0x0CD3, weight: 25, name: 'pine tree', zOffset: 0 },
                        { graphic: 0x0CD6, weight: 30, name: 'tall pine', zOffset: 0 },
                        { graphic: 0x0CD8, weight: 25, name: 'fir tree', zOffset: 0 },
                        { graphic: 0x0CDA, weight: 20, name: 'cedar', zOffset: 0 },
                        { graphic: 0x0CCA, weight: 15, name: 'oak tree', zOffset: 0 },
                    ],
                    plants: [
                        { graphic: 0x0C8E, weight: 30, name: 'fern', zOffset: 0 },
                        { graphic: 0x0C45, weight: 25, name: 'bush', zOffset: 0 },
                        { graphic: 0x0D04, weight: 20, name: 'mushroom', zOffset: 0 },
                    ],
                    logs: [
                        { graphic: 0x1BE0, weight: 15, name: 'fallen log', zOffset: 0 },
                        { graphic: 0x1BE1, weight: 10, name: 'log pile', zOffset: 0 },
                    ]
                },
                categoryWeights: { trees: 70, plants: 25, logs: 5 }
            },
            
            jungle: {
                name: 'Jungle',
                density: 0.22,  // Very dense
                statics: {
                    trees: [
                        { prefab: 'tree_prefab_001', fallbackGraphic: 0x0CE0, weight: 20, name: 'jungle oak', zOffset: 0 },
                        { prefab: 'tree_prefab_004', fallbackGraphic: 0x0CE3, weight: 15, name: 'dense jungle', zOffset: 0 },
                        { graphic: 0x0CE3, weight: 30, name: 'tall palm', zOffset: 0 },
                        { graphic: 0x0CE6, weight: 25, name: 'banana tree', zOffset: 0 },
                        { graphic: 0x0D41, weight: 20, name: 'jungle tree', zOffset: 0 },
                    ],
                    plants: [
                        { graphic: 0x0D45, weight: 40, name: 'large fern', zOffset: 0 },
                        { graphic: 0x0D46, weight: 35, name: 'tropical plant', zOffset: 0 },
                        { graphic: 0x0D48, weight: 25, name: 'jungle bush', zOffset: 0 },
                        { graphic: 0x0D4A, weight: 20, name: 'vines', zOffset: 0 },
                    ],
                    rocks: [
                        { graphic: 0x1363, weight: 10, name: 'mossy rock', zOffset: 0 },
                    ]
                },
                categoryWeights: { trees: 50, plants: 45, rocks: 5 }
            },
            
            sand: {
                name: 'Desert/Beach',
                density: 0.03,  // Sparse
                statics: {
                    plants: [
                        { graphic: 0x0D2B, weight: 40, name: 'cactus', zOffset: 0 },
                        { graphic: 0x0D26, weight: 30, name: 'small cactus', zOffset: 0 },
                        { graphic: 0x0D27, weight: 25, name: 'desert shrub', zOffset: 0 },
                    ],
                    rocks: [
                        { graphic: 0x1363, weight: 35, name: 'desert rock', zOffset: 0 },
                        { graphic: 0x1364, weight: 30, name: 'rock pile', zOffset: 0 },
                        { graphic: 0x1367, weight: 20, name: 'boulder', zOffset: 0 },
                    ],
                    debris: [
                        { graphic: 0x1B76, weight: 15, name: 'bones', zOffset: 0 },
                        { graphic: 0x1B7A, weight: 10, name: 'skull', zOffset: 0 },
                    ]
                },
                categoryWeights: { plants: 35, rocks: 50, debris: 15 }
            },
            
            snow: {
                name: 'Snow/Tundra',
                density: 0.08,
                statics: {
                    trees: [
                        { graphic: 0x0CD3, weight: 50, name: 'snow pine', zOffset: 0 },
                        { graphic: 0x0CD6, weight: 40, name: 'frozen tree', zOffset: 0 },
                    ],
                    rocks: [
                        { graphic: 0x1363, weight: 35, name: 'icy rock', zOffset: 0 },
                        { graphic: 0x1367, weight: 25, name: 'ice boulder', zOffset: 0 },
                    ],
                    debris: [
                        { graphic: 0x1B76, weight: 10, name: 'frozen bones', zOffset: 0 },
                    ]
                },
                categoryWeights: { trees: 45, rocks: 45, debris: 10 }
            },
            
            swamp: {
                name: 'Swamp',
                density: 0.12,
                statics: {
                    trees: [
                        { graphic: 0x0CCC, weight: 40, name: 'dead tree', zOffset: 0 },
                        { graphic: 0x0CCE, weight: 35, name: 'swamp tree', zOffset: 0 },
                        { graphic: 0x0CE0, weight: 20, name: 'cypress', zOffset: 0 },
                    ],
                    plants: [
                        { graphic: 0x0D04, weight: 45, name: 'mushroom', zOffset: 0 },
                        { graphic: 0x0D06, weight: 35, name: 'toadstool', zOffset: 0 },
                        { graphic: 0x0C45, weight: 25, name: 'swamp bush', zOffset: 0 },
                    ],
                    debris: [
                        { graphic: 0x1B76, weight: 20, name: 'bones', zOffset: 0 },
                    ]
                },
                categoryWeights: { trees: 35, plants: 50, debris: 15 }
            },
            
            rock: {
                name: 'Mountains/Rocky',
                density: 0.10,
                statics: {
                    rocks: [
                        { graphic: 0x1363, weight: 30, name: 'small rock', zOffset: 0 },
                        { graphic: 0x1364, weight: 25, name: 'rock pile', zOffset: 0 },
                        { graphic: 0x1367, weight: 25, name: 'boulder', zOffset: 0 },
                        { graphic: 0x1368, weight: 15, name: 'large boulder', zOffset: 0 },
                    ],
                    ores: [
                        { graphic: 0x19B7, weight: 8, name: 'iron ore', zOffset: 0 },
                        { graphic: 0x19B9, weight: 5, name: 'copper ore', zOffset: 0 },
                        { graphic: 0x19BA, weight: 3, name: 'gold ore', zOffset: 0 },
                    ],
                    plants: [
                        { graphic: 0x0C45, weight: 15, name: 'hardy bush', zOffset: 0 },
                    ]
                },
                categoryWeights: { rocks: 70, ores: 15, plants: 15 }
            },
            
            water_edge: {
                name: 'Water Edge',
                density: 0.15,
                statics: {
                    plants: [
                        { graphic: 0x0D49, weight: 40, name: 'reeds', zOffset: 0 },
                        { graphic: 0x0D4B, weight: 35, name: 'cattails', zOffset: 0 },
                        { graphic: 0x0D4C, weight: 25, name: 'lily pads', zOffset: 0 },
                    ],
                    debris: [
                        { graphic: 0x1B72, weight: 20, name: 'driftwood', zOffset: 0 },
                        { graphic: 0x1B76, weight: 10, name: 'shells', zOffset: 0 },
                    ]
                },
                categoryWeights: { plants: 75, debris: 25 }
            }
        };
        
        // Perlin noise for natural clustering
        this.noiseScale = 0.15;
        this.clusterThreshold = 0.35;
        this.roadTreeChance = 0.01; // 1% chance to allow a tree on a road/bridge
    }

    instantiatePrefab(prefabName, tile, baseX, baseY, statics, biome, category, staticDef) {
        const prefab = this.getPrefab(prefabName);
        if (!prefab || !prefab.parts || prefab.parts.length === 0) {
            return false;
        }

        const tileZ = tile.z || 0;
        const baseZ = tileZ + (staticDef?.zOffset || 0);
        const prefabBaseZ = prefab.baseZ || 0;

        for (const part of prefab.parts) {
            const finalGraphic = part.graphic;
            if (finalGraphic == null) continue;
            statics.push({
                x: baseX + part.dx,
                y: baseY + part.dy,
                z: baseZ + prefabBaseZ + (part.dz || 0),
                graphic: finalGraphic,
                hexId: `0x${finalGraphic.toString(16).toUpperCase().padStart(4, '0')}`,
                name: staticDef?.name || prefab.name,
                biome,
                category,
                worldX: baseX + part.dx,
                worldY: baseY + part.dy,
                relX: baseX + part.dx,
                relY: baseY + part.dy
            });
        }

        return true;
    }

    setTreePrefabs(prefabs = {}) {
        this.treePrefabs = prefabs || {};
    }

    getPrefab(name) {
        if (!name) return null;
        return this.treePrefabs[name] || null;
    }
    
    /**
     * Classify a tile into a biome based on its name/ID
     */
    classifyBiome(tileName, tileId) {
        if (!tileName) return null;
        
        const name = tileName.toLowerCase();
        
        // Check for specific biome keywords
        if (name.includes('jungle')) return 'jungle';
        if (name.includes('forest') || name.includes('leaves')) return 'forest';
        if (name.includes('snow') || name.includes('ice')) return 'snow';
        if (name.includes('swamp') || name.includes('bog')) return 'swamp';
        if (name.includes('sand') || name.includes('desert') || name.includes('beach')) return 'sand';
        if (name.includes('rock') || name.includes('stone') || name.includes('mountain')) return 'rock';
        if (name.includes('grass')) return 'grass';
        if (name.includes('dirt') || name.includes('mud')) return 'grass'; // Treat dirt like grass edges
        if (name.includes('water')) return null; // No statics on water
        
        return null;
    }
    
    /**
     * Check if a tile is adjacent to water
     */
    isNearWater(map, x, y, radius = 1) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < map[0].length && ny >= 0 && ny < map.length) {
                    const tile = map[ny][nx];
                    const name = (tile.name || '').toLowerCase();
                    if (isWaterSurface(tile.surfaceClass) || name.includes('water') || tile.isWater) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Simple Perlin-like noise for clustering
     */
    noise2D(x, y, seed = 12345) {
        // Simple hash-based noise
        const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
        return (n - Math.floor(n));
    }
    
    /**
     * Smoothed noise for better clustering
     */
    smoothNoise(x, y, seed) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const fx = x - x0;
        const fy = y - y0;
        
        // Interpolate between 4 corners
        const n00 = this.noise2D(x0, y0, seed);
        const n10 = this.noise2D(x0 + 1, y0, seed);
        const n01 = this.noise2D(x0, y0 + 1, seed);
        const n11 = this.noise2D(x0 + 1, y0 + 1, seed);
        
        // Smooth interpolation
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        
        const n0 = n00 * (1 - sx) + n10 * sx;
        const n1 = n01 * (1 - sx) + n11 * sx;
        
        return n0 * (1 - sy) + n1 * sy;
    }
    
    /**
     * Pick a category based on weights
     */
    pickCategory(profile) {
        const weights = profile.categoryWeights;
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [category, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return category;
        }
        
        return Object.keys(weights)[0];
    }
    
    /**
     * Pick a static from weighted pool
     */
    pickStatic(statics) {
        const total = statics.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * total;
        
        for (const staticDef of statics) {
            random -= staticDef.weight;
            if (random <= 0) return staticDef;
        }
        
        return statics[0];
    }
    
    /**
     * Place statics on a generated map
     * @param {Array<Array>} map - 2D array of tiles with {tileId, name, z}
     * @param {Object} options - Placement options
     * @returns {Array} Array of static objects to render
     */
    placeStatics(map, options = {}) {
        const {
            seed = Math.random() * 10000,
            densityMultiplier = 1.0,
            enableClustering = true,
            waterEdgeBonus = true,
            landTileData = null
        } = options;
        
        const statics = [];
        const height = map.length;
        const width = map[0].length;
        
        console.log(`[BiomeStaticPlacer] Placing statics on ${width}x${height} map...`);
        
        let biomeCounts = {};
        let placedCount = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];
                if (!tile) continue;
                const tileId = normalizeTileId(tile.tileId ?? tile.originalTileId ?? tile.id);
                const tileInfo = landTileData && tileId != null ? landTileData.get(tileId) : null;
                if (tileInfo) {
                    tile.name = tile.name || tileInfo.Name || tileInfo.name || '';
                }
                const surfaceClass = tile.surfaceClass || determineSurfaceClass({
                    tileId,
                    biome: tile.biome,
                    tileInfo
                });
                tile.surfaceClass = surfaceClass;
                if (isWaterSurface(surfaceClass)) continue; // Never place on water/ocean
                const isRoadBridgeTile = isRoadSurface(surfaceClass);
                
                // Classify biome
                let biome = this.classifyBiome(tile.name, tile.tileId);
                
                // Special case: water edge
                if (waterEdgeBonus && !biome && this.isNearWater(map, x, y, 1)) {
                    // Check if current tile is land
                    const name = (tile.name || '').toLowerCase();
                    if (!name.includes('water') && !tile.isWater) {
                        biome = 'water_edge';
                    }
                }
                
                if (!biome) continue;
                
                const profile = this.biomeProfiles[biome];
                if (!profile) continue;
                
                // Track biome distribution
                biomeCounts[biome] = (biomeCounts[biome] || 0) + 1;
                
                // Calculate placement chance
                let placementChance = profile.density * densityMultiplier;
                
                // Apply clustering noise
                if (enableClustering) {
                    const noise = this.smoothNoise(x * this.noiseScale, y * this.noiseScale, seed);
                    // Only place in "dense" noise areas
                    if (noise < this.clusterThreshold) {
                        placementChance *= 0.2; // Much less likely in sparse areas
                    } else {
                        placementChance *= 1.5; // More likely in cluster areas
                    }
                }
                
                // Random placement check
                if (Math.random() > placementChance) continue;
                
                // Pick category and static
                const category = this.pickCategory(profile);
                const categoryStatics = profile.statics[category];
                if (!categoryStatics || categoryStatics.length === 0) continue;

                if (category === 'trees' && !isTreeFriendlySurface(surfaceClass)) {
                    continue;
                }

                if (category === 'trees' && isRoadBridgeTile) {
                    const rareRoll = this.noise2D((x + seed) * 0.73, (y + seed) * 0.91, seed + 999);
                    if (rareRoll > this.roadTreeChance) {
                        continue; // Trees on roads/bridges are extremely rare
                    }
                }
                
                const staticDef = this.pickStatic(categoryStatics);

                if (staticDef.prefab && this.instantiatePrefab(staticDef.prefab, tile, x, y, statics, biome, category, staticDef)) {
                    placedCount++;
                    continue;
                }

                const finalGraphic = staticDef.graphic ?? staticDef.fallbackGraphic;
                if (finalGraphic == null) continue;

                // Create static object
                statics.push({
                    x: x,
                    y: y,
                    z: (tile.z || 0) + (staticDef.zOffset || 0),
                    graphic: finalGraphic,
                    hexId: `0x${finalGraphic.toString(16).toUpperCase().padStart(4, '0')}`,
                    name: staticDef.name,
                    biome: biome,
                    category: category,
                    // For rendering
                    worldX: x,
                    worldY: y,
                    relX: x,
                    relY: y
                });
                
                placedCount++;
            }
        }
        
        console.log(`[BiomeStaticPlacer] Placed ${placedCount} statics`);
        console.log(`[BiomeStaticPlacer] Biome distribution:`, biomeCounts);
        console.log(`[BiomeStaticPlacer] Unique graphics:`, new Set(statics.map(s => s.hexId)).size);
        
        return statics;
    }
    
    /**
     * Get list of all graphic IDs used (for preloading textures)
     */
    getAllGraphicIds() {
        const ids = new Set();
        for (const profile of Object.values(this.biomeProfiles)) {
            for (const category of Object.values(profile.statics)) {
                for (const staticDef of category) {
                    ids.add(staticDef.graphic);
                }
            }
        }
        return Array.from(ids);
    }
    
    /**
     * Get profile for a specific biome
     */
    getBiomeProfile(biome) {
        return this.biomeProfiles[biome] || null;
    }
    
    /**
     * List all available biomes
     */
    listBiomes() {
        return Object.keys(this.biomeProfiles);
    }
}

// Export singleton for easy use
export const biomeStaticPlacer = new BiomeStaticPlacer();
