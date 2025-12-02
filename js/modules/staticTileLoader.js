/**
 * Static Tile Loader
 * Loads and manages static items (objects placed on terrain)
 * 
 * In UO:
 * - Land Tiles = base terrain floor (grass, sand, water)
 * - Statics = objects ON TOP of terrain (walls, trees, rocks, furniture)
 * 
 * Statics have:
 * - Item ID (graphic)
 * - X, Y position (map coordinates)
 * - Z height (elevation above terrain)
 * - Flags (surface, stairs, impassable, etc.)
 */

export class StaticTileLoader {
    constructor() {
        this.statics = [];
        this.staticsByType = {};
        this.loaded = false;
    }

    /**
     * Load static data from CSV
     * Expected format: ID,Name,Flags,Height,Weight
     */
    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const text = await response.text();
            this.parseCSV(text);
            this.loaded = true;
            console.log(`[StaticTileLoader] Loaded ${this.statics.length} static definitions`);
            return this.statics;
        } catch (error) {
            console.error('[StaticTileLoader] Error loading:', error);
            // Load default statics for cliffs, walls, etc.
            this.loadDefaultStatics();
            return this.statics;
        }
    }

    parseCSV(text) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            const staticDef = {};
            
            headers.forEach((header, index) => {
                staticDef[header] = values[index]?.trim() || '';
            });
            
            // Normalize ID to hex format
            if (staticDef.ID && !staticDef.ID.startsWith('0x')) {
                const num = parseInt(staticDef.ID);
                staticDef.ID = `0x${num.toString(16).toUpperCase().padStart(4, '0')}`;
            }
            
            this.statics.push(staticDef);
            
            // Group by type/name
            const name = (staticDef.Name || 'unknown').toLowerCase();
            if (!this.staticsByType[name]) {
                this.staticsByType[name] = [];
            }
            this.staticsByType[name].push(staticDef);
        }
    }

    /**
     * Load default static definitions for common items
     * These are the cliff faces, walls, and other items needed for height
     */
    loadDefaultStatics() {
        // Cliff faces - vertical rock walls
        // These are the items that create the visual "height" of cliffs
        const cliffStatics = [
            // Mountain/Rock cliff faces (vertical walls)
            { ID: '0x0080', Name: 'cliff_face_s', Height: 20, Flags: 'impassable' },
            { ID: '0x0081', Name: 'cliff_face_e', Height: 20, Flags: 'impassable' },
            { ID: '0x0082', Name: 'cliff_face_n', Height: 20, Flags: 'impassable' },
            { ID: '0x0083', Name: 'cliff_face_w', Height: 20, Flags: 'impassable' },
            
            // Stone walls
            { ID: '0x0028', Name: 'stone_wall_s', Height: 20, Flags: 'impassable' },
            { ID: '0x0029', Name: 'stone_wall_e', Height: 20, Flags: 'impassable' },
            { ID: '0x002A', Name: 'stone_wall_n', Height: 20, Flags: 'impassable' },
            { ID: '0x002B', Name: 'stone_wall_w', Height: 20, Flags: 'impassable' },
            
            // Cave walls
            { ID: '0x024E', Name: 'cave_wall_s', Height: 20, Flags: 'impassable' },
            { ID: '0x024F', Name: 'cave_wall_e', Height: 20, Flags: 'impassable' },
            { ID: '0x0250', Name: 'cave_wall_n', Height: 20, Flags: 'impassable' },
            { ID: '0x0251', Name: 'cave_wall_w', Height: 20, Flags: 'impassable' },
            
            // Dirt embankment statics (for cliff edges)
            { ID: '0x0071', Name: 'dirt_embankment', Height: 5, Flags: 'surface' },
            
            // Trees
            { ID: '0x0CCA', Name: 'tree_oak', Height: 15, Flags: 'impassable' },
            { ID: '0x0CCB', Name: 'tree_pine', Height: 15, Flags: 'impassable' },
            { ID: '0x0CCC', Name: 'tree_willow', Height: 15, Flags: 'impassable' },
            
            // Rocks/Boulders
            { ID: '0x0ED3', Name: 'boulder_large', Height: 8, Flags: 'impassable' },
            { ID: '0x0ED4', Name: 'boulder_medium', Height: 5, Flags: 'impassable' },
            { ID: '0x0ED5', Name: 'boulder_small', Height: 3, Flags: 'impassable' },
        ];
        
        cliffStatics.forEach(s => {
            this.statics.push(s);
            const name = s.Name.toLowerCase();
            if (!this.staticsByType[name]) {
                this.staticsByType[name] = [];
            }
            this.staticsByType[name].push(s);
        });
        
        console.log('[StaticTileLoader] Loaded default statics:', this.statics.length);
    }

    /**
     * Get static definition by ID
     */
    getById(id) {
        let searchId = id;
        if (typeof id === 'number') {
            searchId = `0x${id.toString(16).toUpperCase().padStart(4, '0')}`;
        }
        return this.statics.find(s => s.ID === searchId);
    }

    /**
     * Get statics by type/name
     */
    getByType(type) {
        return this.staticsByType[type.toLowerCase()] || [];
    }

    /**
     * Get all cliff face statics
     */
    getCliffFaces() {
        return this.statics.filter(s => 
            s.Name && s.Name.toLowerCase().includes('cliff')
        );
    }

    /**
     * Get all wall statics
     */
    getWalls() {
        return this.statics.filter(s => 
            s.Name && s.Name.toLowerCase().includes('wall')
        );
    }
}

/**
 * Map Cell with full UO-style data
 * Includes both land tile and statics
 */
export class MapCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // Land tile (base terrain)
        this.landTile = {
            id: null,
            name: '',
            z: 0,  // Base elevation
            flags: 0
        };
        
        // Statics (objects on this cell)
        this.statics = [];
    }

    /**
     * Add a static item to this cell
     */
    addStatic(itemId, z, hue = 0) {
        this.statics.push({
            id: itemId,
            z: z,
            hue: hue
        });
        // Keep statics sorted by Z for proper draw order
        this.statics.sort((a, b) => a.z - b.z);
    }

    /**
     * Remove a static item from this cell
     */
    removeStatic(itemId, z = null) {
        this.statics = this.statics.filter(s => {
            if (z !== null) {
                return !(s.id === itemId && s.z === z);
            }
            return s.id !== itemId;
        });
    }

    /**
     * Get the highest Z value on this cell (land or static)
     */
    getTopZ() {
        if (this.statics.length === 0) {
            return this.landTile.z;
        }
        const topStatic = this.statics[this.statics.length - 1];
        return Math.max(this.landTile.z, topStatic.z);
    }

    /**
     * Check if this cell is walkable at a given Z
     */
    isWalkable(z) {
        // TODO: Implement proper walkability check based on flags
        return true;
    }
}

/**
 * Full UO-style Map with land tiles + statics
 */
export class UOMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = [];
        
        // Initialize empty cells
        for (let y = 0; y < height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < width; x++) {
                this.cells[y][x] = new MapCell(x, y);
            }
        }
    }

    /**
     * Get cell at position
     */
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[y][x];
    }

    /**
     * Set land tile at position
     */
    setLandTile(x, y, tileId, z = 0, name = '') {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.landTile.id = tileId;
            cell.landTile.z = z;
            cell.landTile.name = name;
        }
    }

    /**
     * Add static at position
     */
    addStatic(x, y, itemId, z, hue = 0) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.addStatic(itemId, z, hue);
        }
    }

    /**
     * Remove static at position
     */
    removeStatic(x, y, itemId, z = null) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.removeStatic(itemId, z);
        }
    }

    /**
     * Get all statics in the map (for rendering)
     */
    getAllStatics() {
        const allStatics = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                for (const s of cell.statics) {
                    allStatics.push({
                        x: x,
                        y: y,
                        ...s
                    });
                }
            }
        }
        return allStatics;
    }

    /**
     * Convert from simple map format (what terrainGenerator produces)
     * to full UOMap format
     */
    static fromSimpleMap(simpleMap) {
        const height = simpleMap.length;
        const width = simpleMap[0].length;
        const uoMap = new UOMap(width, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = simpleMap[y][x];
                
                // Convert elevation (0-1) to Z units (0-127 like UO)
                // UO uses -128 to 127 for Z, but most terrain is 0-60
                const z = Math.floor((tile.elevation || 0.5) * 60);
                
                uoMap.setLandTile(x, y, tile.id, z, tile.name || '');
                
                // Store additional data
                uoMap.cells[y][x].biome = tile.biome;
                uoMap.cells[y][x].tileSet = tile.tileSet;
                uoMap.cells[y][x].tile = tile.tile;
            }
        }
        
        return uoMap;
    }

    /**
     * Export to simple map format (for compatibility)
     */
    toSimpleMap() {
        const map = [];
        for (let y = 0; y < this.height; y++) {
            map[y] = [];
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                map[y][x] = {
                    id: cell.landTile.id,
                    name: cell.landTile.name,
                    z: cell.landTile.z,
                    biome: cell.biome,
                    elevation: cell.landTile.z / 60, // Convert back to 0-1
                    tileSet: cell.tileSet,
                    tile: cell.tile,
                    statics: cell.statics
                };
            }
        }
        return map;
    }
}

export default { StaticTileLoader, MapCell, UOMap };









