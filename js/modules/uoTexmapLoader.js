/**
 * UO Texmap Loader - Loads 128x128 seamless terrain textures from texmaps.mul
 * 
 * Format: Each texture is 128x128 pixels, 16-bit color (RGB565 or ARGB1555)
 * Index file (texidx.mul) contains offsets and lengths
 */
export class UOTexmapLoader {
    constructor() {
        this.texmapData = null;
        this.texidxData = null;
        this.textureCache = new Map();
        this.isLoaded = false;
    }

    /**
     * Load texmaps.mul and texidx.mul files
     */
    async load(texmapPath = 'texmaps.mul', texidxPath = 'texidx.mul') {
        try {
            console.log(`[UOTexmapLoader] Loading textures...`);
            
            // Load texmaps.mul
            const texmapResponse = await fetch(texmapPath);
            if (!texmapResponse.ok) {
                throw new Error(`Failed to load ${texmapPath}`);
            }
            this.texmapData = new DataView(await texmapResponse.arrayBuffer());
            console.log(`[UOTexmapLoader] Loaded texmaps.mul: ${this.texmapData.byteLength} bytes`);
            
            // Try to load texidx.mul (optional - we can work without it)
            try {
                const texidxResponse = await fetch(texidxPath);
                if (texidxResponse.ok) {
                    this.texidxData = new DataView(await texidxResponse.arrayBuffer());
                    console.log(`[UOTexmapLoader] Loaded texidx.mul: ${this.texidxData.byteLength} bytes`);
                }
            } catch (e) {
                console.log(`[UOTexmapLoader] No texidx.mul - using fixed-size textures`);
            }
            
            this.isLoaded = true;
            return true;
        } catch (error) {
            console.error('[UOTexmapLoader] Failed to load:', error);
            return false;
        }
    }

    /**
     * Debug: dump info about first N texture entries
     */
    debugDumpEntries(count = 20) {
        if (!this.texidxData) {
            console.log('[UOTexmapLoader] No index data for debug');
            return;
        }
        
        console.log(`[UOTexmapLoader] === TEXTURE INDEX DEBUG (first ${count} entries) ===`);
        for (let i = 0; i < count; i++) {
            const indexOffset = i * 12;
            if (indexOffset + 12 > this.texidxData.byteLength) break;
            
            const offset = this.texidxData.getUint32(indexOffset, true);
            const size = this.texidxData.getUint32(indexOffset + 4, true);
            const extra = this.texidxData.getUint32(indexOffset + 8, true);
            
            const valid = offset !== 0xFFFFFFFF && size > 0 && size !== 0xFFFFFFFF;
            const sizeStr = valid ? `${size} bytes (${Math.sqrt(size/2)}x${Math.sqrt(size/2)})` : 'INVALID';
            
            console.log(`  [${i}] offset=${offset}, size=${sizeStr}, extra=${extra}`);
        }
    }

    /**
     * Get texture by ID
     * @param {number} textureId - The texture ID (from land tile data)
     * @returns {HTMLCanvasElement|null}
     */
    getTexture(textureId) {
        if (!this.isLoaded) return null;
        
        // Check cache
        if (this.textureCache.has(textureId)) {
            return this.textureCache.get(textureId);
        }
        
        try {
            let offset, size;
            
            if (this.texidxData) {
                // Use index file: each entry is 12 bytes (offset, length, extra)
                const indexOffset = textureId * 12;
                if (indexOffset + 12 > this.texidxData.byteLength) {
                    console.log(`[UOTexmapLoader] Texture ${textureId} - index out of bounds`);
                    return null;
                }
                
                offset = this.texidxData.getUint32(indexOffset, true);
                size = this.texidxData.getUint32(indexOffset + 4, true);
                
                // Log first few lookups
                if (textureId < 10) {
                    console.log(`[UOTexmapLoader] Texture ${textureId}: offset=${offset}, size=${size}`);
                }
                
                // Invalid entry
                if (offset === 0xFFFFFFFF || size === 0 || size === 0xFFFFFFFF) {
                    console.log(`[UOTexmapLoader] Texture ${textureId} - invalid entry`);
                    return null;
                }
            } else {
                // No index - assume fixed 128x128 textures (32KB each for 16-bit)
                // Actually textures can be 64x64 (8KB) or 128x128 (32KB)
                // Try 128x128 first
                const textureSize128 = 128 * 128 * 2; // 32768 bytes
                offset = textureId * textureSize128;
                size = textureSize128;
            }
            
            if (offset + size > this.texmapData.byteLength) {
                return null;
            }
            
            // Determine texture dimensions from size
            const pixelCount = size / 2; // 16-bit = 2 bytes per pixel
            let width, height;
            
            if (pixelCount === 128 * 128) {
                width = height = 128;
            } else if (pixelCount === 64 * 64) {
                width = height = 64;
            } else {
                // Unknown size
                console.warn(`[UOTexmapLoader] Unknown texture size: ${size} bytes for ID ${textureId}`);
                return null;
            }
            
            // Create canvas and extract texture
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.createImageData(width, height);
            const pixels = imageData.data;
            
            // Read 16-bit pixels (ARGB1555 or RGB565)
            for (let i = 0; i < pixelCount; i++) {
                const pixel = this.texmapData.getUint16(offset + i * 2, true);
                const pixelOffset = i * 4;
                
                // Try ARGB1555 format (most common for UO textures)
                // Bit layout: A RRRRR GGGGG BBBBB
                const a = (pixel >> 15) & 0x1;
                const r = (pixel >> 10) & 0x1F;
                const g = (pixel >> 5) & 0x1F;
                const b = pixel & 0x1F;
                
                // Convert 5-bit to 8-bit
                pixels[pixelOffset] = (r << 3) | (r >> 2);     // R
                pixels[pixelOffset + 1] = (g << 3) | (g >> 2); // G
                pixels[pixelOffset + 2] = (b << 3) | (b >> 2); // B
                pixels[pixelOffset + 3] = (pixel === 0) ? 0 : 255; // A (black = transparent)
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Cache and return
            this.textureCache.set(textureId, canvas);
            return canvas;
            
        } catch (e) {
            console.warn(`[UOTexmapLoader] Error loading texture ${textureId}:`, e);
            return null;
        }
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            loaded: this.isLoaded,
            cached: this.textureCache.size,
            dataSize: this.texmapData ? this.texmapData.byteLength : 0
        };
    }
}
