/**
 * Sprite Sheet Loader Module
 * Loads and manages UO animation sprite sheets for WebGL rendering
 * 
 * Authentic UO timing constants from ClassicUO:
 * - CHARACTER_ANIMATION_DELAY = 80ms per frame
 * - MAX_STEP_COUNT = 5 frames per walk cycle
 * - STEP_DELAY_WALK = 400ms per tile
 * - STEP_DELAY_RUN = 200ms per tile
 */

export class SpriteSheetLoader {
    constructor() {
        // Cache for loaded sprite sheets
        this.sheets = new Map();
        this.textures = new Map();
        
        // UO timing constants
        this.FRAME_DURATION = 80; // ms per frame
        this.WALK_FRAMES = 5;
        this.STEP_DELAY_WALK = 400;
        this.STEP_DELAY_RUN = 200;
        
        // Direction mapping (8 directions: N, NE, E, SE, S, SW, W, NW)
        this.DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        // Base path for sprite sheets
        this.basePath = 'assets/sprites/sheets/';
        
        // Metadata cache
        this.metadata = null;
    }
    
    /**
     * Load the main animations metadata file
     */
    async loadMetadata() {
        if (this.metadata) return this.metadata;
        
        try {
            const response = await fetch(this.basePath + 'animations.json');
            if (!response.ok) {
                throw new Error(`Failed to load animations.json: ${response.status}`);
            }
            this.metadata = await response.json();
            console.log('Loaded animations metadata:', Object.keys(this.metadata.animations || {}));
            return this.metadata;
        } catch (error) {
            console.warn('Could not load sprite sheet metadata, using fallback BMP system:', error.message);
            return null;
        }
    }
    
    /**
     * Load a sprite sheet image
     */
    async loadSheet(animationName) {
        // Check cache first
        if (this.sheets.has(animationName)) {
            return this.sheets.get(animationName);
        }
        
        // Make sure metadata is loaded
        await this.loadMetadata();
        
        if (!this.metadata || !this.metadata.animations[animationName]) {
            console.warn(`Animation "${animationName}" not found in metadata`);
            return null;
        }
        
        const animData = this.metadata.animations[animationName];
        const imagePath = this.basePath + animData.file;
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const sheet = {
                    image: img,
                    ...animData,
                };
                this.sheets.set(animationName, sheet);
                console.log(`Loaded sprite sheet: ${animationName} (${img.width}x${img.height})`);
                resolve(sheet);
            };
            
            img.onerror = () => {
                console.error(`Failed to load sprite sheet: ${imagePath}`);
                reject(new Error(`Failed to load: ${imagePath}`));
            };
            
            img.src = imagePath;
        });
    }
    
    /**
     * Create WebGL texture from sprite sheet
     */
    createTexture(gl, animationName) {
        // Check texture cache
        if (this.textures.has(animationName)) {
            return this.textures.get(animationName);
        }
        
        const sheet = this.sheets.get(animationName);
        if (!sheet) {
            console.error(`Sheet not loaded: ${animationName}`);
            return null;
        }
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Upload image to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet.image);
        
        const textureInfo = {
            texture,
            sheet,
        };
        
        this.textures.set(animationName, textureInfo);
        return textureInfo;
    }
    
    /**
     * Get frame info for a specific animation frame
     * @param {string} animationName - e.g., 'walkUnarmed', 'runUnarmed'
     * @param {number} direction - 0-7 (N, NE, E, SE, S, SW, W, NW)
     * @param {number} frameIndex - Frame index within the animation
     * @returns {Object} Frame info with UV coordinates
     */
    getFrame(animationName, direction, frameIndex) {
        const sheet = this.sheets.get(animationName);
        if (!sheet) return null;
        
        const { frameWidth, frameHeight, framesPerDirection, directions, image } = sheet;
        
        // Clamp values
        const dir = Math.max(0, Math.min(direction, directions - 1));
        const frame = Math.max(0, Math.min(frameIndex, framesPerDirection - 1));
        
        // Calculate pixel position in sprite sheet
        const x = frame * frameWidth;
        const y = dir * frameHeight;
        
        // Calculate UV coordinates (0-1 range)
        const u0 = x / image.width;
        const v0 = y / image.height;
        const u1 = (x + frameWidth) / image.width;
        const v1 = (y + frameHeight) / image.height;
        
        return {
            x, y,
            width: frameWidth,
            height: frameHeight,
            u0, v0, u1, v1,
            centerX: frameWidth / 2,
            centerY: frameHeight / 2,
        };
    }
    
    /**
     * Calculate current frame based on time for walking animation
     * @param {number} startTime - Animation start time
     * @param {boolean} isRunning - Whether character is running
     * @returns {number} Current frame index (0-4)
     */
    getWalkFrame(startTime, isRunning = false) {
        const elapsed = performance.now() - startTime;
        const frameDuration = this.FRAME_DURATION;
        const frameIndex = Math.floor(elapsed / frameDuration) % this.WALK_FRAMES;
        return frameIndex;
    }
    
    /**
     * Get animation name based on character state
     */
    getAnimationName(state) {
        const { isWalking, isRunning, hasWeapon, isAttacking, isDead, isIdle } = state;
        
        if (isDead) return 'die1';
        if (isAttacking) return hasWeapon ? 'attackOneHanded' : 'attackUnarmed1';
        if (isRunning) return hasWeapon ? 'runArmed' : 'runUnarmed';
        if (isWalking) return hasWeapon ? 'walkArmed' : 'walkUnarmed';
        if (isIdle) return Math.random() > 0.5 ? 'fidget1' : 'fidget2';
        
        return 'stand';
    }
    
    /**
     * Convert angle to UO 8-direction index
     * @param {number} angle - Angle in radians
     * @returns {number} Direction index 0-7
     */
    angleToDirection(angle) {
        // Normalize angle to 0-2π
        let normalized = angle;
        while (normalized < 0) normalized += Math.PI * 2;
        while (normalized >= Math.PI * 2) normalized -= Math.PI * 2;
        
        // Convert to 8 directions (0 = N, 2 = E, 4 = S, 6 = W)
        // UO uses: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
        const sector = Math.round(normalized / (Math.PI / 4)) % 8;
        
        // Map from math angle (0=E) to UO direction (0=N)
        const directionMap = [2, 1, 0, 7, 6, 5, 4, 3]; // E, NE, N, NW, W, SW, S, SE
        return directionMap[sector];
    }
    
    /**
     * Preload all essential animations
     */
    async preloadEssentials() {
        const essentials = [
            'walkUnarmed',
            'runUnarmed',
            'stand',
            'attackUnarmed1',
        ];
        
        console.log('Preloading essential animations...');
        
        const results = await Promise.allSettled(
            essentials.map(name => this.loadSheet(name))
        );
        
        const loaded = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`Preloaded ${loaded}/${essentials.length} animations`);
        
        return loaded > 0;
    }
    
    /**
     * Check if sprite sheet system is available
     */
    isAvailable() {
        return this.metadata !== null && Object.keys(this.sheets).length > 0;
    }
    
    /**
     * Draw a sprite frame to a 2D canvas context
     * (Fallback when WebGL is not used)
     */
    drawFrame(ctx, animationName, direction, frameIndex, x, y, scale = 1) {
        const sheet = this.sheets.get(animationName);
        if (!sheet) return false;
        
        const frame = this.getFrame(animationName, direction, frameIndex);
        if (!frame) return false;
        
        ctx.drawImage(
            sheet.image,
            frame.x, frame.y,
            frame.width, frame.height,
            x - frame.centerX * scale,
            y - frame.centerY * scale,
            frame.width * scale,
            frame.height * scale
        );
        
        return true;
    }
}

// Singleton instance
export const spriteSheetLoader = new SpriteSheetLoader();

// Export default
export default spriteSheetLoader;









