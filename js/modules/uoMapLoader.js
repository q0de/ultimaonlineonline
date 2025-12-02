/**
 * UO Map Loader - Reads map#.mul files and extracts terrain data
 * 
 * Map file format (from ClassicUO):
 * - Each block is 196 bytes (8x8 tiles)
 * - Block header: 4 bytes (block header)
 * - 64 tiles × 3 bytes = 192 bytes (tile data)
 * - Each tile: 2 bytes tile ID, 1 byte Z-height
 * 
 * Map dimensions:
 * - map0 (Britannia): 7168 × 4096 tiles
 * - Organized in blocks of 8×8 tiles
 */

export class UOMapLoader {
    constructor() {
        this.mapData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.blockSize = 196; // 4 bytes header + 64 tiles × 3 bytes
        this.tilesPerBlock = 8;
    }

    /**
     * Load a map file (.mul format)
     * @param {string} mapPath - Path to map file (e.g., 'assets/mul/map0.mul')
     * @param {number} mapWidth - Map width in tiles (default: 7168 for map0)
     * @param {number} mapHeight - Map height in tiles (default: 4096 for map0)
     * @returns {Promise<boolean>} Success status
     */
    async loadMap(mapPath, mapWidth = 7168, mapHeight = 4096) {
        try {
            console.log(`[UOMapLoader] Loading map from ${mapPath}...`);
            
            const response = await fetch(mapPath);
            if (!response.ok) {
                throw new Error(`Failed to load map: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            
            console.log(`[UOMapLoader] Loaded ${data.length} bytes (${(data.length / 1024 / 1024).toFixed(1)} MB)`);
            
            this.mapData = data;
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
            
            // Verify file size matches expected
            const expectedBlocks = Math.ceil(mapWidth / this.tilesPerBlock) * Math.ceil(mapHeight / this.tilesPerBlock);
            const expectedSize = expectedBlocks * this.blockSize;
            
            if (data.length < expectedSize * 0.9) { // Allow 10% tolerance
                console.warn(`[UOMapLoader] File size mismatch: expected ~${expectedSize} bytes, got ${data.length}`);
            }
            
            console.log(`[UOMapLoader] ✅ Map loaded successfully`);
            return true;
            
        } catch (error) {
            console.error(`[UOMapLoader] Error loading map:`, error);
            return false;
        }
    }

    /**
     * Get tile data at specific coordinates
     * @param {number} x - Tile X coordinate (0 to mapWidth-1)
     * @param {number} y - Tile Y coordinate (0 to mapHeight-1)
     * @returns {Object|null} { tileId: number, z: number } or null if out of bounds
     */
    getTileAt(x, y) {
        if (!this.mapData || x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return null;
        }

        // Calculate block coordinates (each block is 8×8 tiles)
        const blockX = Math.floor(x / this.tilesPerBlock);
        const blockY = Math.floor(y / this.tilesPerBlock);
        
        // Calculate tile position within block (0-7 for both X and Y)
        const tileX = x % this.tilesPerBlock;
        const tileY = y % this.tilesPerBlock;
        
        // Tile index within block (0-63): row-major order
        const tileIndex = tileY * this.tilesPerBlock + tileX;
        
        // Calculate block index
        // UO stores blocks in COLUMN-MAJOR order!
        // BlockID = (X / 8) * (MapHeight / 8) + (Y / 8)
        // This means blocks are stored column by column, not row by row
        const blocksPerColumn = Math.ceil(this.mapHeight / this.tilesPerBlock);
        const blockIndex = blockX * blocksPerColumn + blockY;
        
        // Calculate byte offset for this block
        const blockOffset = blockIndex * this.blockSize;
        
        if (blockOffset + this.blockSize > this.mapData.length) {
            console.warn(`Block ${blockIndex} out of bounds (offset ${blockOffset}, file size ${this.mapData.length})`);
            return null;
        }
        
        // Skip 4-byte block header, then read tile data
        // Each tile is 3 bytes: 2 bytes tile ID (little-endian) + 1 byte Z
        const tileOffset = blockOffset + 4 + (tileIndex * 3);
        
        if (tileOffset + 3 > this.mapData.length) {
            return null;
        }
        
        // Read tile ID (2 bytes, little-endian) and Z-height (1 byte, signed)
        const tileId = this.mapData[tileOffset] | (this.mapData[tileOffset + 1] << 8);
        const zByte = this.mapData[tileOffset + 2];
        
        // Z is signed byte (sbyte): -128 to 127
        // In UO, Z-heights are typically 0-127 (sea level to max height)
        // Negative values are possible but rare (caves, etc.)
        // Convert signed byte to signed integer properly
        let z = zByte;
        if (zByte > 127) {
            z = zByte - 256; // Convert unsigned byte > 127 to negative
        }
        
        return {
            tileId: tileId,
            z: z, // Keep as signed integer (-128 to 127)
            zRaw: zByte, // Raw byte value for debugging
            hexId: `0x${tileId.toString(16).toUpperCase().padStart(4, '0')}`
        };
    }

    /**
     * Extract a region of the map
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} width - Width in tiles
     * @param {number} height - Height in tiles
     * @returns {Array<Array<Object>>} 2D array of tile data
     */
    extractRegion(startX, startY, width, height) {
        const region = [];
        let validTiles = 0;
        let invalidTiles = 0;
        const tileIds = new Set();
        
        console.log(`[UOMapLoader] Extracting region: (${startX}, ${startY}) size ${width}×${height}`);
        
        for (let y = 0; y < height; y++) {
            region[y] = [];
            for (let x = 0; x < width; x++) {
                const tile = this.getTileAt(startX + x, startY + y);
                if (tile) {
                    region[y][x] = tile;
                    validTiles++;
                    tileIds.add(tile.tileId);
                } else {
                    region[y][x] = { tileId: 0, z: 0, hexId: '0x0000' };
                    invalidTiles++;
                }
            }
        }
        
        console.log(`[UOMapLoader] Extracted ${validTiles} valid tiles, ${invalidTiles} invalid`);
        console.log(`[UOMapLoader] Found ${tileIds.size} unique tile IDs`);
        if (tileIds.size > 0) {
            const sampleIds = Array.from(tileIds).slice(0, 10);
            console.log(`[UOMapLoader] Sample tile IDs:`, sampleIds.map(id => `0x${id.toString(16).toUpperCase().padStart(4, '0')}`));
        }
        
        return region;
    }

    /**
     * Get map info
     * @returns {Object} Map metadata
     */
    getMapInfo() {
        return {
            width: this.mapWidth,
            height: this.mapHeight,
            loaded: this.mapData !== null,
            dataSize: this.mapData ? this.mapData.length : 0
        };
    }
}

export default UOMapLoader;

