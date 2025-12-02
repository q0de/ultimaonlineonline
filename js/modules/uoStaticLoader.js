/**
 * UO Static Loader - Reads statics#.mul and staidx#.mul files
 * 
 * Static file format (from ClassicUO):
 * - staidx#.mul: Index file, 12 bytes per block
 *   - Position (uint32): Offset in statics#.mul
 *   - Size (uint32): Total bytes for this block
 *   - Unknown (uint32): Reserved
 * 
 * - statics#.mul: Static object data
 *   - Each static: 7 bytes
 *     - Graphic (ushort): Item/Static ID (NOTE: Called "Color" in ClassicUO!)
 *     - X (byte): Position within block (0-7)
 *     - Y (byte): Position within block (0-7)
 *     - Z (sbyte): Height offset
 *     - Hue (ushort): Color hue (0 = default)
 * 
 * Blocks are organized the same as map blocks: 8×8 tiles per block
 */

export class UOStaticLoader {
    constructor() {
        this.staticData = null;
        this.indexData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.blockSize = 8; // 8×8 tiles per block
    }

    /**
     * Load static files
     * @param {string} staticPath - Path to statics file (e.g., 'assets/mul/statics0.mul')
     * @param {string} indexPath - Path to index file (e.g., 'assets/mul/staidx0.mul')
     * @param {number} mapWidth - Map width in tiles (default: 7168 for map0)
     * @param {number} mapHeight - Map height in tiles (default: 4096 for map0)
     * @returns {Promise<boolean>} Success status
     */
    async loadStatics(staticPath, indexPath, mapWidth = 7168, mapHeight = 4096) {
        try {
            console.log(`[UOStaticLoader] Loading statics from ${staticPath}...`);
            
            // Load index file
            const indexResponse = await fetch(indexPath);
            if (!indexResponse.ok) {
                throw new Error(`Failed to load index: ${indexResponse.statusText}`);
            }
            const indexBuffer = await indexResponse.arrayBuffer();
            this.indexData = new Uint8Array(indexBuffer);
            
            // Load static data file
            const staticResponse = await fetch(staticPath);
            if (!staticResponse.ok) {
                throw new Error(`Failed to load statics: ${staticResponse.statusText}`);
            }
            const staticBuffer = await staticResponse.arrayBuffer();
            this.staticData = new Uint8Array(staticBuffer);
            
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
            
            console.log(`[UOStaticLoader] ✅ Loaded ${this.indexData.length} bytes index, ${this.staticData.length} bytes static data`);
            return true;
            
        } catch (error) {
            console.error(`[UOStaticLoader] Error loading statics:`, error);
            return false;
        }
    }

    /**
     * Get statics for a specific block
     * @param {number} blockX - Block X coordinate
     * @param {number} blockY - Block Y coordinate
     * @returns {Array<Object>} Array of static objects
     */
    getStaticsForBlock(blockX, blockY) {
        if (!this.indexData || !this.staticData) {
            return [];
        }

        // Calculate block index
        // UO blocks are stored in X-major order: blockIndex = blockX * blocksPerColumn + blockY
        // Must match uoMapLoader.js formula!
        const blocksPerColumn = Math.ceil(this.mapHeight / this.blockSize);
        const blockIndex = blockX * blocksPerColumn + blockY;
        
        // Debug: Log first block access
        if (!this._loggedFirstBlock) {
            this._loggedFirstBlock = true;
            console.log(`[UOStaticLoader] Block calc: blockX=${blockX} blockY=${blockY} blocksPerColumn=${blocksPerColumn} → blockIndex=${blockIndex}`);
        }
        
        // Read index entry (12 bytes per block)
        const indexOffset = blockIndex * 12;
        if (indexOffset + 12 > this.indexData.length) {
            if (!this._loggedOutOfBounds) {
                this._loggedOutOfBounds = true;
                console.log(`[UOStaticLoader] Index out of bounds: offset ${indexOffset} > length ${this.indexData.length}`);
            }
            return [];
        }
        
        // Read index entry (little-endian, unsigned)
        // Use >>> 0 to convert to unsigned 32-bit integer
        const position = (this.indexData[indexOffset] | 
                        (this.indexData[indexOffset + 1] << 8) |
                        (this.indexData[indexOffset + 2] << 16) |
                        (this.indexData[indexOffset + 3] << 24)) >>> 0;
        const size = (this.indexData[indexOffset + 4] | 
                    (this.indexData[indexOffset + 5] << 8) |
                    (this.indexData[indexOffset + 6] << 16) |
                    (this.indexData[indexOffset + 7] << 24)) >>> 0;
        
        // Debug: Log first few block index reads
        if (!this._indexReadCount) this._indexReadCount = 0;
        if (this._indexReadCount < 5) {
            console.log(`[UOStaticLoader] Block ${blockX},${blockY} → indexOffset=${indexOffset} position=0x${position.toString(16)} size=${size}`);
            this._indexReadCount++;
        }
        
        // Check if block has statics
        if (size === 0 || position === 0xFFFFFFFF) {
            return [];
        }
        
        // Read static objects
        const statics = [];
        const staticCount = Math.min(1024, Math.floor(size / 7)); // Max 1024 statics per block, 7 bytes each
        
        for (let i = 0; i < staticCount; i++) {
            const staticOffset = position + (i * 7);
            if (staticOffset + 7 > this.staticData.length) {
                break;
            }
            
            // Read static data (little-endian)
            const graphic = this.staticData[staticOffset] | (this.staticData[staticOffset + 1] << 8);
            const x = this.staticData[staticOffset + 2];
            const y = this.staticData[staticOffset + 3];
            const zByte = this.staticData[staticOffset + 4];
            const hue = this.staticData[staticOffset + 5] | (this.staticData[staticOffset + 6] << 8);
            
            // Convert Z (signed byte)
            let z = zByte;
            if (zByte > 127) {
                z = zByte - 256;
            }
            
            // Skip invalid graphics (0 or 0xFFFF)
            if (graphic === 0 || graphic === 0xFFFF) {
                continue;
            }
            
            statics.push({
                graphic: graphic,
                hexId: `0x${graphic.toString(16).toUpperCase().padStart(4, '0')}`,
                x: x, // Position within block (0-7)
                y: y, // Position within block (0-7)
                z: z, // Height offset
                hue: hue // Color hue (0 = default)
            });
        }
        
        return statics;
    }

    /**
     * Get statics for a region of the map
     * @param {number} startX - Starting X coordinate (tile)
     * @param {number} startY - Starting Y coordinate (tile)
     * @param {number} width - Width in tiles
     * @param {number} height - Height in tiles
     * @param {number} maxCount - Optional: limit number of statics returned (for testing)
     * @returns {Array<Object>} Array of static objects with world coordinates
     */
    getStaticsForRegion(startX, startY, width, height, maxCount = null) {
        console.log(`[UOStaticLoader] getStaticsForRegion called: (${startX},${startY}) size ${width}x${height}`);
        
        if (!this.indexData || !this.staticData) {
            console.log(`[UOStaticLoader] ERROR: No data loaded! indexData=${!!this.indexData} staticData=${!!this.staticData}`);
            return [];
        }

        const statics = [];
        
        // Calculate block range
        const startBlockX = Math.floor(startX / this.blockSize);
        const startBlockY = Math.floor(startY / this.blockSize);
        const endBlockX = Math.floor((startX + width - 1) / this.blockSize);
        const endBlockY = Math.floor((startY + height - 1) / this.blockSize);
        
        // Debug: Log block range calculation
        console.log(`[UOStaticLoader] Region (${startX},${startY}) size ${width}x${height} → blocks X:${startBlockX}-${endBlockX} Y:${startBlockY}-${endBlockY}`);
        
        // Iterate through blocks
        let blocksChecked = 0;
        let blocksWithStatics = 0;
        for (let blockY = startBlockY; blockY <= endBlockY; blockY++) {
            for (let blockX = startBlockX; blockX <= endBlockX; blockX++) {
                blocksChecked++;
                const blockStatics = this.getStaticsForBlock(blockX, blockY);
                if (blockStatics.length > 0) blocksWithStatics++;
                
                // Convert block-relative coordinates to world coordinates
                const worldBlockX = blockX * this.blockSize;
                const worldBlockY = blockY * this.blockSize;
                
                for (const staticObj of blockStatics) {
                    const worldX = worldBlockX + staticObj.x;
                    const worldY = worldBlockY + staticObj.y;
                    
                    // Check if static is within region bounds
                    if (worldX >= startX && worldX < startX + width &&
                        worldY >= startY && worldY < startY + height) {
                        statics.push({
                            ...staticObj,
                            worldX: worldX,
                            worldY: worldY
                        });
                    }
                }
            }
        }
        
        console.log(`[UOStaticLoader] Checked ${blocksChecked} blocks, ${blocksWithStatics} had statics, found ${statics.length} total statics`);
        
        // Limit for testing if specified
        if (maxCount !== null && statics.length > maxCount) {
            console.log(`[UOStaticLoader] Limiting statics to ${maxCount} for testing (found ${statics.length} total)`);
            return statics.slice(0, maxCount);
        }
        
        return statics;
    }

    /**
     * Get loader info
     * @returns {Object} Loader metadata
     */
    getInfo() {
        return {
            loaded: this.indexData !== null && this.staticData !== null,
            indexSize: this.indexData ? this.indexData.length : 0,
            staticSize: this.staticData ? this.staticData.length : 0,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight
        };
    }
}

export default UOStaticLoader;

