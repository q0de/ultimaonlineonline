/**
 * UO Art Loader
 * Loads static object graphics from artLegacyMUL.uop or art.mul
 * 
 * UOP Format: Modern compressed container format
 * Art Format: 16-bit color graphics with run-length encoding
 */

export class UOArtLoader {
    constructor() {
        this.artData = null;
        this.artIndex = null;
        this.uopData = null;
        this.fileTable = null;
        this.textureCache = new Map();
        this.isUOP = false;
    }

    /**
     * Load art from UOP file
     */
    async loadFromUOP(uopPath) {
        console.log(`[UOArtLoader] Loading art from UOP: ${uopPath}`);
        
        try {
            const response = await fetch(uopPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const buffer = await response.arrayBuffer();
            this.uopData = new DataView(buffer);
            
            console.log(`[UOArtLoader] Loaded ${buffer.byteLength} bytes`);
            
            // Parse UOP header
            const success = this.parseUOPHeader();
            if (!success) {
                throw new Error('Invalid UOP file format');
            }
            
            this.isUOP = true;
            console.log(`[UOArtLoader] ✅ UOP parsed: ${this.fileTable.length} entries`);
            
            return true;
        } catch (error) {
            console.error('[UOArtLoader] Failed to load UOP:', error);
            return false;
        }
    }

    /**
     * Parse UOP header and build file table
     */
    parseUOPHeader() {
        const view = this.uopData;
        
        // Check magic number: "MYP\0" (0x50594D00 little-endian)
        const magic = view.getUint32(0, true);
        if (magic !== 0x50594D00) {
            // Try alternative: check for "MYP" string
            const m = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
            if (m !== 'MYP') {
                console.error('[UOArtLoader] Invalid UOP magic:', magic.toString(16));
                return false;
            }
        }
        
        console.log('[UOArtLoader] Valid UOP magic found');
        
        // UOP header structure:
        // 0x00: 4 bytes - Magic "MYP\0"
        // 0x04: 4 bytes - Version
        // 0x08: 4 bytes - Format timestamp
        // 0x0C: 8 bytes - First block offset
        // 0x14: 4 bytes - Block size
        // 0x18: 4 bytes - File count
        
        const version = view.getUint32(4, true);
        const timestamp = view.getUint32(8, true);
        const firstBlockOffset = Number(view.getBigUint64(12, true));
        const blockSize = view.getUint32(20, true);
        const fileCount = view.getUint32(24, true);
        
        console.log(`[UOArtLoader] UOP v${version}, ${fileCount} files, first block at ${firstBlockOffset}`);
        
        // Parse file blocks
        this.fileTable = [];
        let blockOffset = firstBlockOffset;
        
        while (blockOffset > 0 && blockOffset < view.byteLength) {
            // Block header:
            // 0x00: 4 bytes - File count in this block
            // 0x04: 8 bytes - Next block offset
            // Then file entries...
            
            const filesInBlock = view.getUint32(blockOffset, true);
            const nextBlock = Number(view.getBigUint64(blockOffset + 4, true));
            
            let entryOffset = blockOffset + 12;
            
            for (let i = 0; i < filesInBlock && entryOffset < view.byteLength; i++) {
                // File entry:
                // 0x00: 8 bytes - Data offset
                // 0x08: 4 bytes - Header length
                // 0x0C: 4 bytes - Compressed size
                // 0x10: 4 bytes - Decompressed size
                // 0x14: 8 bytes - File hash
                // 0x1C: 4 bytes - Adler32
                // 0x20: 2 bytes - Compression type (0=none, 1=zlib)
                
                const dataOffset = Number(view.getBigUint64(entryOffset, true));
                const headerLength = view.getUint32(entryOffset + 8, true);
                const compressedSize = view.getUint32(entryOffset + 12, true);
                const decompressedSize = view.getUint32(entryOffset + 16, true);
                const fileHash = view.getBigUint64(entryOffset + 20, true);
                const compression = view.getUint16(entryOffset + 32, true);
                
                if (dataOffset > 0 && compressedSize > 0) {
                    this.fileTable.push({
                        offset: dataOffset + headerLength,
                        compressedSize,
                        decompressedSize,
                        hash: fileHash,
                        compression,
                        index: this.fileTable.length
                    });
                }
                
                entryOffset += 34; // Size of each entry
            }
            
            blockOffset = nextBlock;
            
            // Safeguard against infinite loops
            if (this.fileTable.length > 100000) {
                console.warn('[UOArtLoader] Too many entries, stopping parse');
                break;
            }
        }
        
        return this.fileTable.length > 0;
    }

    /**
     * Find entry by hash (using pre-built index)
     */
    findEntryByHash(hash) {
        if (!this.hashIndex) return null;
        return this.hashIndex.get(hash.toString());
    }

    /**
     * Get art texture for a static object by graphic ID
     * @param {number} graphicId - The static graphic ID (e.g., 0x0CDA for a tree)
     * @returns {ImageData|null}
     */
    async getStaticTexture(graphicId) {
        // Check cache
        if (this.textureCache.has(graphicId)) {
            return this.textureCache.get(graphicId);
        }
        
        // Static art starts at index 0x4000 (16384) in the art file
        // Static ID 0 = file index 16384, static ID 1 = file index 16385, etc.
        const fileIndex = 0x4000 + graphicId;
        
        console.log(`[UOArtLoader] Looking up graphic ${graphicId} → file index ${fileIndex}`);
        
        const texture = await this.extractArt(fileIndex);
        if (texture) {
            console.log(`[UOArtLoader] ✅ Got texture for graphic ${graphicId}`);
            this.textureCache.set(graphicId, texture);
        } else {
            console.log(`[UOArtLoader] ❌ No texture for graphic ${graphicId}`);
        }
        
        return texture;
    }

    /**
     * Build hash-to-index mapping on first access
     * This uses the hashes already stored in the file table
     */
    buildHashIndex() {
        if (this.hashIndex) return;
        
        this.hashIndex = new Map();
        for (const entry of this.fileTable) {
            // Store hash → entry mapping (hash is BigInt)
            this.hashIndex.set(entry.hash.toString(), entry);
        }
        console.log(`[UOArtLoader] Built hash index with ${this.hashIndex.size} entries`);
    }

    /**
     * Try to extract art using direct index into file table
     * This is a workaround since hash lookup isn't working
     */
    async extractArt(index) {
        if (!this.isUOP || !this.fileTable) {
            return null;
        }
        
        // Build hash index on first call
        this.buildHashIndex();
        
        // Method 1: Try direct file table index (if entries are sequential)
        // Art files may be stored in order: land tiles (0-16383), then static tiles (16384+)
        if (index < this.fileTable.length) {
            const entry = this.fileTable[index];
            if (entry && entry.compressedSize > 0) {
                if (!this._triedDirectIndex) {
                    this._triedDirectIndex = true;
                    console.log(`[UOArtLoader] Trying direct index ${index} → entry at offset ${entry.offset}`);
                }
                const result = await this.decodeEntry(entry);
                if (result) {
                    return result;
                }
            }
        }
        
        // Method 2: Try hash-based lookup with corrected UO hash algorithm
        // UOP uses a DJB2-variant hash
        const paths = [
            `build/artlegacymul/${index.toString().padStart(8, '0')}.tga`,
            `build/artlegacymul/${index}.tga`,
        ];
        
        for (const path of paths) {
            const hash = this.computeUOHash(path);
            const entry = this.hashIndex.get(hash.toString());
            if (entry && entry.compressedSize > 0) {
                console.log(`[UOArtLoader] Found via hash for "${path}"`);
                return this.decodeEntry(entry);
            }
        }
        
        // Debug: Log failure once per 1000 indices
        if (!this._logCount) this._logCount = 0;
        this._logCount++;
        if (this._logCount === 1) {
            console.log(`[UOArtLoader] Hash lookup failed for index ${index}`);
            console.log(`[UOArtLoader] File table has ${this.fileTable.length} entries`);
        }
        
        return null;
    }
    
    /**
     * UO-style hash (DJB2 variant used by UOP files)
     */
    computeUOHash(path) {
        const s = path.toLowerCase();
        let hash1 = 0n;
        let hash2 = 0n;
        const MASK = 0xFFFFFFFFn;
        
        // UO uses a specific hashing algorithm
        for (let i = 0; i < s.length; i++) {
            const c = BigInt(s.charCodeAt(i));
            hash1 = ((hash1 * 0x1505n) + c) & MASK;
            hash2 = ((hash2 << 5n) + hash2 + c) & MASK;
        }
        
        // Combine into 64-bit hash
        return (hash1 << 32n) | hash2;
    }
    
    /**
     * Decode a UOP entry to ImageData
     */
    async decodeEntry(entry) {
        if (!entry || entry.compressedSize === 0) {
            return null;
        }
        
        try {
            // Get the raw data
            let data;
            if (entry.compression === 1) {
                // Zlib compressed - need to decompress
                data = await this.decompressZlib(entry);
            } else {
                // Uncompressed
                const start = entry.offset;
                const end = start + entry.decompressedSize;
                data = new Uint8Array(this.uopData.buffer.slice(start, end));
            }
            
            if (!data || data.length === 0) {
                return null;
            }
            
            // Parse art format
            return this.parseArtData(data);
        } catch (e) {
            console.warn(`[UOArtLoader] Failed to decode entry:`, e);
            return null;
        }
    }

    /**
     * Decompress zlib data
     */
    async decompressZlib(entry) {
        const start = entry.offset;
        const compressedData = new Uint8Array(
            this.uopData.buffer.slice(start, start + entry.compressedSize)
        );
        
        // Use DecompressionStream if available (modern browsers)
        if (typeof DecompressionStream !== 'undefined') {
            try {
                const ds = new DecompressionStream('deflate-raw');
                const writer = ds.writable.getWriter();
                const reader = ds.readable.getReader();
                
                // Skip zlib header (2 bytes) if present
                let dataToDecompress = compressedData;
                if (compressedData[0] === 0x78) {
                    dataToDecompress = compressedData.slice(2);
                }
                
                writer.write(dataToDecompress);
                writer.close();
                
                const chunks = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                
                // Combine chunks
                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                const result = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    result.set(chunk, offset);
                    offset += chunk.length;
                }
                
                return result;
            } catch (e) {
                console.warn('[UOArtLoader] Decompression failed:', e);
                return null;
            }
        }
        
        console.warn('[UOArtLoader] DecompressionStream not available');
        return null;
    }

    /**
     * Parse UO art data format
     * Art format: Run-length encoded 16-bit (5-5-5) color
     */
    parseArtData(data) {
        if (data.length < 8) return null;
        
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        
        // Art header for static items:
        // 0x00: 4 bytes - Unknown/flags
        // 0x04: 2 bytes - Width
        // 0x06: 2 bytes - Height
        // Then lookup table and pixel data
        
        const flags = view.getUint32(0, true);
        const width = view.getUint16(4, true);
        const height = view.getUint16(6, true);
        
        if (width === 0 || height === 0 || width > 512 || height > 512) {
            return null;
        }
        
        // Create canvas for the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        // Skip lookup table (width * 2 bytes per row)
        let offset = 8 + (height * 2);
        
        // Decode run-length encoded data
        for (let y = 0; y < height && offset < data.length; y++) {
            let x = 0;
            
            while (x < width && offset + 2 <= data.length) {
                // Read run header: 2 bytes
                // Low 12 bits: run length
                // High 4 bits: offset to start
                const header = view.getUint16(offset, true);
                offset += 2;
                
                const xOffset = (header >> 12) & 0x1F;
                const runLength = header & 0xFFF;
                
                x += xOffset;
                
                if (runLength === 0) break; // End of row
                
                // Read color runs
                for (let i = 0; i < runLength && x < width && offset + 2 <= data.length; i++) {
                    const color = view.getUint16(offset, true);
                    offset += 2;
                    
                    // Convert 16-bit (1-5-5-5) to RGBA
                    const a = (color & 0x8000) ? 255 : 0; // Alpha from high bit
                    const r = ((color >> 10) & 0x1F) * 8;
                    const g = ((color >> 5) & 0x1F) * 8;
                    const b = (color & 0x1F) * 8;
                    
                    const pixelIndex = (y * width + x) * 4;
                    pixels[pixelIndex] = r;
                    pixels[pixelIndex + 1] = g;
                    pixels[pixelIndex + 2] = b;
                    pixels[pixelIndex + 3] = color !== 0 ? 255 : 0; // Non-zero = opaque
                    
                    x++;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Get texture as ImageBitmap for WebGL
     */
    async getTextureForWebGL(graphicId) {
        const canvas = await this.getStaticTexture(graphicId);
        if (!canvas) return null;
        
        return await createImageBitmap(canvas);
    }

    /**
     * Preload multiple textures
     */
    async preloadTextures(graphicIds) {
        const results = {};
        for (const id of graphicIds) {
            const tex = await this.getStaticTexture(id);
            if (tex) {
                results[id] = tex;
            }
        }
        return results;
    }
}

