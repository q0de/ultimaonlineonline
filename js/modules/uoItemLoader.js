/**
 * UO Item Loader - Loads static item graphics from exported BMP files
 * Files are expected in: items/Item 0xHEX.bmp format
 */
export class UOItemLoader {
    constructor() {
        this.textureCache = new Map();
        this.basePath = 'items/';
        this.loadedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Get texture for a graphic ID
     * @param {number} graphicId - The item graphic ID (e.g., 0x3C3 = 963)
     * @returns {Promise<HTMLImageElement|null>}
     */
    async getTexture(graphicId) {
        // Check cache first
        if (this.textureCache.has(graphicId)) {
            return this.textureCache.get(graphicId);
        }

        // Convert to hex string (uppercase, no padding)
        const hexId = graphicId.toString(16).toUpperCase();
        const filename = `Item 0x${hexId}.bmp`;
        const fullPath = this.basePath + filename;

        try {
            const img = await this.loadImage(fullPath);
            if (img) {
                // Convert BMP to canvas with transparency (black = transparent)
                const canvas = this.makeTransparent(img);
                this.textureCache.set(graphicId, canvas);
                this.loadedCount++;
                return canvas;
            }
        } catch (e) {
            // File doesn't exist or failed to load
            this.failedCount++;
        }

        // Cache null to avoid repeated failed loads
        this.textureCache.set(graphicId, null);
        return null;
    }

    /**
     * Load an image file
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    }

    /**
     * Convert image to canvas with black pixels made transparent
     * UO uses black (0,0,0) as the transparency color
     */
    makeTransparent(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Make black pixels transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is black (or very close to black), make it transparent
            if (r < 10 && g < 10 && b < 10) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }
        
        // Put modified data back
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    }

    /**
     * Preload a list of graphic IDs
     */
    async preloadGraphics(graphicIds) {
        const promises = graphicIds.map(id => this.getTexture(id));
        await Promise.all(promises);
        console.log(`[UOItemLoader] Preloaded ${this.loadedCount} textures, ${this.failedCount} failed`);
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            loaded: this.loadedCount,
            failed: this.failedCount,
            cached: this.textureCache.size
        };
    }
}











