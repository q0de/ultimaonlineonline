/**
 * Animation Loader
 * Loads exported BMP animations from folder structure
 */

export class AnimationLoader {
    /**
     * Load animation from exported folder structure
     * @param {string} animationName - e.g., 'running-halberd', 'attack-bash-2h-halberd'
     * @param {string} basePath - Base path to animations folder
     * @returns {Promise<Object>} Animation data with all directions and frames
     */
    static async loadAnimation(animationName, basePath = 'assets/sprites/animations') {
        const directions = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
        const animation = {};
        
        console.log(`📦 Loading animation: ${animationName}`);
        
        for (const direction of directions) {
            const dirPath = `${basePath}/${animationName}/${direction}`;
            const frames = [];
            
            // Try to load frames (frame0.bmp, frame1.bmp, etc.)
            let frameIndex = 0;
            let foundFrames = false;
            
            while (frameIndex < 20) { // Max 20 frames per direction
                try {
                    const framePath = `${dirPath}/frame${frameIndex}.bmp`;
                    const img = await this.loadImage(framePath);
                    frames.push(img);
                    foundFrames = true;
                    frameIndex++;
                } catch (e) {
                    // No more frames in this direction
                    break;
                }
            }
            
            if (foundFrames) {
                animation[direction] = frames;
                console.log(`  ✅ ${direction}: ${frames.length} frames`);
            } else {
                console.warn(`  ⚠️ ${direction}: No frames found`);
            }
        }
        
        // Also map to compass directions for compatibility
        animation['north'] = animation['north'] || [];
        animation['south'] = animation['south'] || [];
        animation['east'] = animation['east'] || [];
        animation['west'] = animation['west'] || [];
        animation['ne'] = animation['northeast'] || [];
        animation['se'] = animation['southeast'] || [];
        animation['sw'] = animation['southwest'] || [];
        animation['nw'] = animation['northwest'] || [];
        
        return animation;
    }
    
    /**
     * Load a single image and remove white background
     * @param {string} path - Image path
     * @returns {Promise<HTMLImageElement>}
     */
    static loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    // Process image to remove white background
                    const processedImg = await this.removeWhiteBackground(img);
                    resolve(processedImg);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error(`Failed to load: ${path}`));
            // Add cache-busting parameter to force browser to reload images from disk
            // SUPER AGGRESSIVE for southeast attack to bypass stubborn cache
            const isSoutheastAttack = path.includes('southeast') && path.includes('attack');
            const cacheBuster = isSoutheastAttack 
                ? '?FORCE_RELOAD=' + Date.now() + '_' + Math.random() + '_' + performance.now()
                : '?v=' + Date.now() + '_' + Math.random();
            img.src = path + cacheBuster;
        });
    }
    
    /**
     * Remove white background from image and make it transparent
     * @param {HTMLImageElement} img - Source image
     * @returns {Promise<HTMLImageElement>} Processed image with transparent background
     */
    static removeWhiteBackground(img) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Detect background color from top-left corner (usually background)
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];
            
            // Tolerance for color matching (handles compression artifacts)
            const tolerance = 30;
            
            // Make background pixels transparent
            let transparentCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if pixel matches background color within tolerance
                // OR if it's very close to white (RGB > 240)
                const matchesBg = Math.abs(r - bgR) < tolerance && 
                                  Math.abs(g - bgG) < tolerance && 
                                  Math.abs(b - bgB) < tolerance;
                const isWhite = r > 240 && g > 240 && b > 240;
                
                if (matchesBg || isWhite) {
                    data[i + 3] = 0; // Set alpha to 0 (transparent)
                    transparentCount++;
                }
            }
            
            console.log(`🎨 Processed ${canvas.width}x${canvas.height}: BG=(${bgR},${bgG},${bgB}), ${transparentCount} pixels transparent`);
            
            // Put modified data back
            ctx.putImageData(imageData, 0, 0);
            
            // Create new image from canvas
            const processedImg = new Image();
            processedImg.onload = () => resolve(processedImg);
            processedImg.onerror = () => reject(new Error('Failed to create processed image'));
            processedImg.src = canvas.toDataURL();
        });
    }
    
    /**
     * Load character-only animation from folder structure (e.g., run_ne, walk_s)
     * These use different naming: run_ne/Mob 400-0.bmp instead of running-halberd/northeast/frame0.bmp
     * @param {string} animationPrefix - e.g., 'run', 'walk'
     * @param {string} basePath - Base path to animations folder
     * @param {string} filePrefix - File prefix, e.g., 'Mob 400'
     * @returns {Promise<Object>} Animation data with all directions and frames
     */
    static async loadCharacterAnimation(animationPrefix, basePath = 'assets/sprites/animations', filePrefix = 'Mob 400') {
        const directionMap = {
            'northeast': 'ne',
            'east': 'e',
            'southeast': 'se',
            'south': 's',
            'southwest': 'sw',
            'west': 'w',
            'northwest': 'nw',
            'north': 'n'
        };
        const animation = {};
        
        console.log(`📦 Loading character animation: ${animationPrefix}_*`);
        
        for (const [direction, shortDir] of Object.entries(directionMap)) {
            const dirPath = `${basePath}/${animationPrefix}_${shortDir}`;
            const frames = [];
            
            // Try to load frames (Mob 400-0.bmp, Mob 400-1.bmp, etc.)
            let frameIndex = 0;
            let foundFrames = false;
            
            while (frameIndex < 20) { // Max 20 frames per direction
                try {
                    const framePath = `${dirPath}/${filePrefix}-${frameIndex}.bmp`;
                    const img = await this.loadImage(framePath);
                    frames.push(img);
                    foundFrames = true;
                    frameIndex++;
                } catch (e) {
                    // No more frames in this direction
                    break;
                }
            }
            
            if (foundFrames) {
                animation[direction] = frames;
                console.log(`  ✅ ${direction}: ${frames.length} frames`);
            } else {
                console.warn(`  ⚠️ ${direction}: No frames found`);
            }
        }
        
        return animation;
    }
    
    /**
     * Get frame from animation
     * @param {Object} animation - Animation data
     * @param {string} direction - Direction (north, south, east, west, etc.)
     * @param {number} frameIndex - Frame number
     * @returns {HTMLImageElement|null}
     */
    static getFrame(animation, direction, frameIndex) {
        if (!animation || !animation[direction]) {
            return null;
        }
        
        const frames = animation[direction];
        if (frames.length === 0) {
            return null;
        }
        
        // Wrap frame index
        const index = frameIndex % frames.length;
        return frames[index];
    }
}

