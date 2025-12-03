/**
 * WebGL Terrain Renderer for UO-style 3D terrain
 * 
 * Based on ClassicUO's DrawStretchedLand implementation:
 * https://github.com/ClassicUO/ClassicUO
 * 
 * Each tile is rendered as a quad (2 triangles) with 4 corners that can have
 * different Y-offsets based on Z-height, creating the stretched terrain effect.
 */

export class WebGLTerrainRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: true
        });
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // UO tile dimensions
        this.tileWidth = 44;
        this.tileHeight = 44;
        
        // ClassicUO uses Z << 2 = Z * 4 pixels per Z unit
        this.pixelsPerZ = 4;
        
        this.textures = {};  // Tile ID -> WebGL texture
        this.shaderProgram = null;
        this.characterTextureCache = new Map();
        
        this.init();
    }
    
    init() {
        const gl = this.gl;
        
        // Vertex shader - ClassicUO style positioning
        // Each vertex has: position (x,y), texCoord (u,v), yOffset (from Z-height)
        const vsSource = `
            attribute vec2 aPosition;      // Base screen position (x, y)
            attribute vec2 aTexCoord;      // Texture coordinate (u, v)
            attribute float aYOffset;      // Y offset from Z-height (Z * 4)
            
            uniform vec2 uResolution;      // Canvas size
            
            varying vec2 vTexCoord;
            
            void main() {
                // Apply Y offset (higher Z = moved up = lower Y value)
                vec2 position = aPosition;
                position.y -= aYOffset;
                
                // Convert from pixel coordinates to clip space (-1 to 1)
                vec2 clipSpace = (position / uResolution) * 2.0 - 1.0;
                clipSpace.y *= -1.0;  // Flip Y (WebGL has Y up, we want Y down)
                
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                vTexCoord = aTexCoord;
            }
        `;
        
        // Fragment shader - samples the texture with transparency
        const fsSource = `
            precision mediump float;
            
            uniform sampler2D uTexture;
            varying vec2 vTexCoord;
            
            void main() {
                vec4 color = texture2D(uTexture, vTexCoord);
                
                // Discard transparent pixels (black corners made transparent)
                if (color.a < 0.1) {
                    discard;
                }
                
                gl_FragColor = color;
            }
        `;
        
        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        // Create program
        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);
        
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            throw new Error('Shader program failed to link: ' + gl.getProgramInfoLog(this.shaderProgram));
        }
        
        // Get attribute and uniform locations
        this.aPosition = gl.getAttribLocation(this.shaderProgram, 'aPosition');
        this.aTexCoord = gl.getAttribLocation(this.shaderProgram, 'aTexCoord');
        this.aYOffset = gl.getAttribLocation(this.shaderProgram, 'aYOffset');
        this.uResolution = gl.getUniformLocation(this.shaderProgram, 'uResolution');
        this.uTexture = gl.getUniformLocation(this.shaderProgram, 'uTexture');
        
        // Create buffers
        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.yOffsetBuffer = gl.createBuffer();
        
        // Placeholder texture for static objects (created on first use)
        this.staticPlaceholderTexture = null;
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Camera state for follow mode
        this.cameraX = 0;  // Camera center in tile coordinates
        this.cameraY = 0;
        this.zoom = 1.0;
        
        // Get viewport size from canvas parent container
        const container = canvas.parentElement;
        this.viewportWidth = container ? container.clientWidth : 1200;
        this.viewportHeight = container ? container.clientHeight : 800;
        
        console.log(`WebGL Terrain Renderer initialized (ClassicUO-style), viewport: ${this.viewportWidth}x${this.viewportHeight}`);
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + info);
        }
        
        return shader;
    }
    
    /**
     * Load a tile image as a WebGL texture
     */
    loadTexture(tileId, image) {
        const gl = this.gl;
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Upload the image to the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Set texture parameters for pixel-perfect rendering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        this.textures[tileId] = texture;
        return texture;
    }
    
    getTexture(tileId, imageLoader) {
        if (this.textures[tileId]) {
            return this.textures[tileId];
        }
        
        if (imageLoader) {
            const image = imageLoader(tileId);
            if (image) {
                return this.loadTexture(tileId, image);
            }
        }
        
        return null;
    }
    
    /**
     * Render the terrain map with Z-height - ClassicUO style
     * 
     * Based on ClassicUO's DrawStretchedLand:
     * - TOP vertex at (posX + 22, posY - yOffsets.Top)
     * - RIGHT vertex at (posX + 44, posY + 22 - yOffsets.Right)
     * - LEFT vertex at (posX, posY + 22 - yOffsets.Left)
     * - BOTTOM vertex at (posX + 22, posY + 44 - yOffsets.Bottom)
     * 
     * Where yOffsets = Z * 4 (Z << 2)
     * 
     * @param {Array} map - 2D array of tiles with {id, biome, z} properties
     * @param {Array} cornerHeights - 2D array of Z-heights at each corner position
     */
    render(map, cornerHeights, imageLoader, statics = null) {
        const gl = this.gl;
        const mapHeight = map.length;
        const mapWidth = map[0].length;
        
        // Calculate actual terrain bounds first
        const spacing = 22;  // tileWidth / 2 for 50% overlap
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        // Find the actual bounds of the rendered terrain
        for (let row = 0; row < mapWidth + mapHeight; row++) {
            for (let x = 0; x < mapWidth; x++) {
                const y = row - x;
                if (y < 0 || y >= mapHeight) continue;
                
                // Safe corner height access with bounds checking
                const zTop = (cornerHeights[y] && cornerHeights[y][x]) || 0;
                const zRight = (cornerHeights[y] && cornerHeights[y][x + 1]) || 0;
                const zLeft = (cornerHeights[y + 1] && cornerHeights[y + 1][x]) || 0;
                const zBottom = (cornerHeights[y + 1] && cornerHeights[y + 1][x + 1]) || 0;
                
                const maxZ = Math.max(zTop, zRight, zLeft, zBottom);
                const yOffsetMax = maxZ * this.pixelsPerZ;
                
                // Base position (without offset)
                // UO isometric: (x - y) for X, (x + y) for Y - North is Top-Right
                const baseX = (x - y) * spacing;
                const baseY = (x + y) * spacing;
                
                // Tile bounds (diamond shape: top, right, bottom, left vertices)
                const topX = baseX + 22;
                const topY = baseY - yOffsetMax;
                const rightX = baseX + 44;
                const rightY = baseY + 22;
                const bottomX = baseX + 22;
                const bottomY = baseY + 44;
                const leftX = baseX;
                const leftY = baseY + 22;
                
                minX = Math.min(minX, leftX, topX);
                maxX = Math.max(maxX, rightX, bottomX);
                minY = Math.min(minY, topY);
                maxY = Math.max(maxY, bottomY, rightY, leftY);
            }
        }
        
        // Add padding
        const padding = 50;
        const terrainWidth = maxX - minX;
        const terrainHeight = maxY - minY;
        
        // Calculate canvas size to fit terrain with padding
        const canvasWidth = terrainWidth + padding * 2;
        const canvasHeight = terrainHeight + padding * 2;
        
        // Offset to center terrain in canvas (with padding)
        const offsetX = -minX + padding;
        const offsetY = -minY + padding;
        
        console.log(`WebGL Canvas: ${canvasWidth}x${canvasHeight}, Terrain bounds: (${minX}, ${minY}) to (${maxX}, ${maxY}), Offset: (${offsetX}, ${offsetY})`);
        
        // Save map dimensions for character rendering
        this.lastMapWidth = mapWidth;
        this.lastMapHeight = mapHeight;
        this.lastMaxZ = Math.max(...cornerHeights.flat()) || 50;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        
        // Resize canvas
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        
        // Clear to dark background
        gl.clearColor(0.0, 0.0, 0.0, 1);  // Pure black like UO
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Use our shader program
        gl.useProgram(this.shaderProgram);
        
        // Set resolution uniform
        gl.uniform2f(this.uResolution, canvasWidth, canvasHeight);
        
        // Render tiles back-to-front (by diagonal row for proper overlap)
        for (let row = 0; row < mapWidth + mapHeight; row++) {
            for (let x = 0; x < mapWidth; x++) {
                const y = row - x;
                if (y < 0 || y >= mapHeight) continue;
                
                const tile = map[y][x];
                const tileId = tile.id;
                
                // Get Z-heights for the 4 corners of this tile
                // In UO, corners are shared between tiles
                // Corner layout relative to tile (x, y):
                //   TL = corner[y][x]      TR = corner[y][x+1]
                //   BL = corner[y+1][x]    BR = corner[y+1][x+1]
                // UO diamond: TOP=TL, RIGHT=TR, BOTTOM=BR, LEFT=BL
                // Safe bounds checking added for camera follow mode
                const zTop = (cornerHeights[y] && cornerHeights[y][x]) || 0;        // TL corner -> TOP vertex
                const zRight = (cornerHeights[y] && cornerHeights[y][x + 1]) || 0;  // TR corner -> RIGHT vertex
                const zLeft = (cornerHeights[y + 1] && cornerHeights[y + 1][x]) || 0;   // BL corner -> LEFT vertex
                const zBottom = (cornerHeights[y + 1] && cornerHeights[y + 1][x + 1]) || 0; // BR corner -> BOTTOM vertex
                
                // Calculate Y offsets (ClassicUO: Z << 2 = Z * 4)
                const yOffsetTop = zTop * this.pixelsPerZ;
                const yOffsetRight = zRight * this.pixelsPerZ;
                const yOffsetLeft = zLeft * this.pixelsPerZ;
                const yOffsetBottom = zBottom * this.pixelsPerZ;
                
                // Base position for this tile (isometric with 22px spacing - tiles overlap by 50%)
                // UO isometric: (x - y) for X, (x + y) for Y - North is Top-Right
                const spacing = 22;  // tileWidth / 2 for 50% overlap
                const posX = offsetX + (x - y) * spacing;
                const posY = offsetY + (x + y) * spacing;
                
                // Get texture
                const texture = this.getTexture(tileId, imageLoader);
                if (!texture) continue;
                
                // Create quad as 2 triangles (6 vertices)
                // For 3D height, we render a DIAMOND shape with 4 corners at different heights
                // The diamond vertices are: TOP (center-top), RIGHT (right-center), 
                //                          BOTTOM (center-bottom), LEFT (left-center)
                
                // Diamond vertex positions with Z-height offsets
                // TOP vertex is at the top center of the tile
                const topX = posX + 22;
                const topY = posY - yOffsetTop;
                
                // RIGHT vertex is at the right center of the tile
                const rightX = posX + 44;
                const rightY = posY + 22 - yOffsetRight;
                
                // BOTTOM vertex is at the bottom center of the tile
                const bottomX = posX + 22;
                const bottomY = posY + 44 - yOffsetBottom;
                
                // LEFT vertex is at the left center of the tile
                const leftX = posX;
                const leftY = posY + 22 - yOffsetLeft;
                
                const positions = new Float32Array([
                    // Triangle 1: TOP, RIGHT, BOTTOM
                    topX, topY,
                    rightX, rightY,
                    bottomX, bottomY,
                    
                    // Triangle 2: TOP, BOTTOM, LEFT
                    topX, topY,
                    bottomX, bottomY,
                    leftX, leftY
                ]);
                
                // Texture coordinates - map to diamond shape in the tile
                // UO tiles are 44x44 squares with a diamond shape inside
                // The diamond vertices are at the midpoints of each edge:
                // TOP = (0.5, 0), RIGHT = (1, 0.5), BOTTOM = (0.5, 1), LEFT = (0, 0.5)
                const texCoords = new Float32Array([
                    // Triangle 1: TOP, RIGHT, BOTTOM
                    0.5, 0.0,    // TOP
                    1.0, 0.5,    // RIGHT
                    0.5, 1.0,    // BOTTOM
                    
                    // Triangle 2: TOP, BOTTOM, LEFT
                    0.5, 0.0,    // TOP
                    0.5, 1.0,    // BOTTOM
                    0.0, 0.5     // LEFT
                ]);
                
                // Y offsets for each vertex (not used since positions already include offsets)
                const yOffsets = new Float32Array([
                    // Triangle 1: TOP, RIGHT, BOTTOM
                    0,
                    0,
                    0,
                    0,
                    
                    // Triangle 2: TOP, BOTTOM, LEFT
                    0,
                    0,
                    0,
                    0
                ]);
                
                // Upload position data
                gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aPosition);
                gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
                
                // Upload texture coordinate data
                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aTexCoord);
                gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
                
                // Upload Y offset data
                gl.bindBuffer(gl.ARRAY_BUFFER, this.yOffsetBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, yOffsets, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aYOffset);
                gl.vertexAttribPointer(this.aYOffset, 1, gl.FLOAT, false, 0, 0);
                
                // Bind texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(this.uTexture, 0);
                
                // Draw the 2 triangles (6 vertices)
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
        
        // Render statics (simple placeholder for now)
        if (statics && statics.length > 0) {
            this.renderStaticsPlaceholder(gl, statics, offsetX, offsetY, mapWidth, mapHeight);
        }
        
        console.log(`WebGL rendered ${mapWidth}x${mapHeight} terrain (ClassicUO-style)`);
    }
    
    /**
     * Render static objects with actual textures (or placeholder if not available)
     * Updated to use artTexture when available
     */
    renderStaticsPlaceholder(gl, statics, offsetX, offsetY, mapWidth, mapHeight) {
        if (!statics || statics.length === 0) {
            console.warn(`[WebGLRenderer] No statics to render (statics=${statics}, length=${statics?.length})`);
            return;
        }
        
        const staticsWithTextures = statics.filter(s => s.artTexture).length;
        console.log(`[WebGLRenderer] Rendering ${statics.length} static objects (${staticsWithTextures} with textures)`);
        
        const spacing = 22; // Same as tile spacing
        const placeholderSize = 12; // Size of placeholder square
        
        // Create a simple 1x1 white texture for colored squares (fallback)
        if (!this.staticPlaceholderTexture) {
            this.staticPlaceholderTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.staticPlaceholderTexture);
            const pixel = new Uint8Array([255, 255, 255, 255]); // White pixel
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        
        // Cache for static textures
        if (!this.staticTextureCache) {
            this.staticTextureCache = new Map();
        }
        
        // Sort statics by render order (back to front: y+x, then z)
        const sortedStatics = [...statics].sort((a, b) => {
            const aX = a.relX !== undefined ? a.relX : (a.worldX || 0);
            const aY = a.relY !== undefined ? a.relY : (a.worldY || 0);
            const bX = b.relX !== undefined ? b.relX : (b.worldX || 0);
            const bY = b.relY !== undefined ? b.relY : (b.worldY || 0);
            const aOrder = (aX + aY) * 1000 + (a.z || 0);
            const bOrder = (bX + bY) * 1000 + (b.z || 0);
            return aOrder - bOrder;
        });
        
        // Render each static
        let renderedCount = 0;
        let texturedCount = 0;
        for (const staticObj of sortedStatics) {
            // Use relative coordinates (already converted in loadRealUOMap)
            const tileX = staticObj.relX !== undefined ? staticObj.relX : (staticObj.worldX || 0);
            const tileY = staticObj.relY !== undefined ? staticObj.relY : (staticObj.worldY || 0);
            
            // Isometric conversion (same as tiles) - UO: (x - y) for X, (x + y) for Y
            const baseX = (tileX - tileY) * spacing;
            const baseY = (tileX + tileY) * spacing;
            const isoX = offsetX + baseX;
            const isoY = offsetY + baseY;
            
            // Adjust for Z-height (statics sit on top of terrain)
            const zOffset = (staticObj.z || 0) * this.pixelsPerZ;
            
            // Check if we have an art texture for this static
            let texture = null;
            let w, h;
            
            if (staticObj.artTexture) {
                // Get or create WebGL texture from canvas
                const cacheKey = staticObj.graphic || staticObj.hexId || 'unknown';
                if (!this.staticTextureCache.has(cacheKey)) {
                    const glTex = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, glTex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, staticObj.artTexture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    this.staticTextureCache.set(cacheKey, glTex);
                }
                texture = this.staticTextureCache.get(cacheKey);
                w = staticObj.artTexture.width;
                h = staticObj.artTexture.height;
                texturedCount++;
            } else {
                // Use placeholder (small white square)
                texture = this.staticPlaceholderTexture;
                w = placeholderSize;
                h = placeholderSize;
            }
            
            // Position using ClassicUO formula for static sprites:
            // UO sprites are designed to align to 44x44 tile center (at pixel 22,44)
            // screenX = posX - (spriteWidth/2 - 22) = posX - spriteWidth/2 + 22
            // screenY = posY - (spriteHeight - 44) = posY - spriteHeight + 44
            const screenX = isoX - w / 2 + 22;
            const screenY = isoY - zOffset - h + 44;
            
            // Skip if outside canvas bounds
            const margin = Math.max(w, h);
            if (screenX + w < -margin || screenX > this.canvas.width + margin ||
                screenY + h < -margin || screenY > this.canvas.height + margin) {
                continue;
            }
            
            const positions = new Float32Array([
                screenX, screenY,
                screenX + w, screenY,
                screenX + w, screenY + h,
                screenX, screenY,
                screenX + w, screenY + h,
                screenX, screenY + h
            ]);
            
            const texCoords = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
            const yOffsets = new Float32Array([0, 0, 0, 0, 0, 0]);
            
            // Upload buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aPosition);
            gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aTexCoord);
            gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.yOffsetBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, yOffsets, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aYOffset);
            gl.vertexAttribPointer(this.aYOffset, 1, gl.FLOAT, false, 0, 0);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.uTexture, 0);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            renderedCount++;
        }
        
        console.log(`[WebGLRenderer] ✅ Rendered ${renderedCount}/${statics.length} statics (${texturedCount} with textures)`);
        if (renderedCount === 0 && statics.length > 0) {
            console.warn(`[WebGLRenderer] ⚠️  No statics rendered! Check coordinates. First static:`, statics[0]);
        }
    }
    
    /**
     * Generate corner heights from tile elevations
     * Creates a (height+1) x (width+1) array of Z-heights
     * 
     * In UO, Z-heights are stored per corner position, not per tile.
     * Each tile shares corners with its neighbors.
     * 
     * WATER EDGE SYSTEM (from ClassicUO analysis):
     * - Water corners are ALWAYS at Z=0
     * - Land corners adjacent to water must have minimum Z for cliff effect
     * - The Z difference between water and land creates the cliff visual
     */
    static generateCornerHeights(map, width, height) {
        const corners = [];
        const isWaterCorner = [];  // Track which corners touch water
        
        // First pass: calculate raw corner heights
        for (let cy = 0; cy <= height; cy++) {
            corners[cy] = [];
            isWaterCorner[cy] = [];
            
            for (let cx = 0; cx <= width; cx++) {
                // Get the 4 tiles that share this corner
                const tiles = [];
                
                // Corner (cx, cy) is shared by tiles:
                // - (cx-1, cy-1) = top-left tile (this corner is its BR)
                // - (cx, cy-1) = top-right tile (this corner is its BL)
                // - (cx-1, cy) = bottom-left tile (this corner is its TR)
                // - (cx, cy) = bottom-right tile (this corner is its TL)
                
                if (cy > 0 && cx > 0 && map[cy-1] && map[cy-1][cx-1]) {
                    tiles.push(map[cy-1][cx-1]);
                }
                if (cy > 0 && cx < width && map[cy-1] && map[cy-1][cx]) {
                    tiles.push(map[cy-1][cx]);
                }
                if (cy < height && cx > 0 && map[cy] && map[cy][cx-1]) {
                    tiles.push(map[cy][cx-1]);
                }
                if (cy < height && cx < width && map[cy] && map[cy][cx]) {
                    tiles.push(map[cy][cx]);
                }
                
                if (tiles.length === 0) {
                    corners[cy][cx] = 0;
                    isWaterCorner[cy][cx] = false;
                } else {
                    // Check if ANY adjacent tile is water
                    const hasWater = tiles.some(t => t.biome === 'water');
                    const allWater = tiles.every(t => t.biome === 'water');
                    isWaterCorner[cy][cx] = hasWater;
                    
                    if (allWater) {
                        // All water - corner is at sea level
                        corners[cy][cx] = 0;
                    } else if (hasWater) {
                        // Mixed water/land - this is a cliff edge!
                        // Use the elevation of the land tiles only
                        const landTiles = tiles.filter(t => t.biome !== 'water');
                        const avgElev = landTiles.reduce((sum, t) => sum + (t.elevation || 0), 0) / landTiles.length;
                        const elevAboveWater = Math.max(0, avgElev - 0.42) / 0.58;
                        // Minimum Z of 5 for visible cliff effect
                        corners[cy][cx] = Math.max(5, Math.floor(elevAboveWater * 25));
                    } else {
                        // All land - normal height calculation
                        const avgElev = tiles.reduce((sum, t) => sum + (t.elevation || 0), 0) / tiles.length;
                        const elevAboveWater = Math.max(0, avgElev - 0.42) / 0.58;
                        corners[cy][cx] = Math.floor(elevAboveWater * 25);
                    }
                }
            }
        }
        
        // Second pass: ensure water-adjacent corners have minimum height for cliff
        for (let cy = 0; cy <= height; cy++) {
            for (let cx = 0; cx <= width; cx++) {
                if (!isWaterCorner[cy][cx] && corners[cy][cx] > 0) {
                    // Check if any neighboring corner is a water corner
                    const neighborIsWater = (
                        (cy > 0 && isWaterCorner[cy-1][cx]) ||
                        (cy < height && isWaterCorner[cy+1][cx]) ||
                        (cx > 0 && isWaterCorner[cy][cx-1]) ||
                        (cx < width && isWaterCorner[cy][cx+1])
                    );
                    
                    if (neighborIsWater) {
                        // This corner is next to a water edge - ensure minimum height
                        corners[cy][cx] = Math.max(corners[cy][cx], 4);
                    }
                }
            }
        }
        
        // Third pass: Smooth non-water corners to prevent harsh transitions
        // But preserve water edge cliffs!
        for (let pass = 0; pass < 2; pass++) {
            const newCorners = corners.map(row => [...row]);
            
            for (let cy = 1; cy < height; cy++) {
                for (let cx = 1; cx < width; cx++) {
                    // Don't smooth water corners or water-adjacent corners
                    if (isWaterCorner[cy][cx]) continue;
                    
                    const neighbors = [
                        corners[cy-1][cx],
                        corners[cy+1][cx],
                        corners[cy][cx-1],
                        corners[cy][cx+1]
                    ];
                    
                    // Don't smooth if any neighbor is a water corner (preserve cliff)
                    const hasWaterNeighbor = (
                        isWaterCorner[cy-1][cx] ||
                        isWaterCorner[cy+1][cx] ||
                        isWaterCorner[cy][cx-1] ||
                        isWaterCorner[cy][cx+1]
                    );
                    
                    if (hasWaterNeighbor) continue;
                    
                    const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
                    const current = corners[cy][cx];
                    
                    // Smooth towards average if difference is too large
                    if (Math.abs(current - avg) > 3) {
                        newCorners[cy][cx] = Math.round((current + avg) / 2);
                    }
                }
            }
            
            for (let cy = 0; cy <= height; cy++) {
                for (let cx = 0; cx <= width; cx++) {
                    if (!isWaterCorner[cy][cx]) {
                        corners[cy][cx] = newCorners[cy][cx];
                    }
                }
            }
        }
        
        // Debug: log some corner heights
        let maxZ = 0;
        let nonZeroCount = 0;
        let waterEdgeCount = 0;
        for (let cy = 0; cy <= height; cy++) {
            for (let cx = 0; cx <= width; cx++) {
                if (corners[cy][cx] > maxZ) maxZ = corners[cy][cx];
                if (corners[cy][cx] > 0) nonZeroCount++;
                if (isWaterCorner[cy][cx] && corners[cy][cx] > 0) waterEdgeCount++;
            }
        }
        console.log(`Corner heights: maxZ=${maxZ}, nonZeroCount=${nonZeroCount}/${(width+1)*(height+1)}, waterEdges=${waterEdgeCount}`);
        console.log(`Sample corners: [0][0]=${corners[0][0]}, [10][10]=${corners[10][10]}, [25][25]=${corners[25][25]}`);
        
        return corners;
    }
    
    /**
     * Render with camera follow - keeps a target position centered
     * @param {Array} map - 2D array of tiles
     * @param {Array} cornerHeights - Corner heights array
     * @param {Object} cameraTarget - {x, y} tile coordinates to center on
     * @param {Function} imageLoader - Function to load tile images (id -> Image)
     * @param {number} zoom - Zoom level (1.0 = normal, 2.0 = 2x zoom in)
     * @param {Array} statics - Optional static objects
     */
    renderWithCamera(map, cornerHeights, cameraTarget, imageLoader, zoom = 1.0, statics = null, characters = null) {
        const gl = this.gl;
        const mapHeight = map.length;
        const mapWidth = map[0].length;
        
        this.zoom = zoom;
        this.cameraX = cameraTarget.x;
        this.cameraY = cameraTarget.y;
        
        const spacing = 22;
        
        // Update viewport to match container (in case it was resized)
        const container = this.canvas.parentElement;
        if (container) {
            this.viewportWidth = container.clientWidth || 1200;
            this.viewportHeight = container.clientHeight || 800;
        }
        
        const viewWidth = this.viewportWidth;
        const viewHeight = this.viewportHeight;
        
        // Reset any CSS transforms (camera follow mode uses native canvas size)
        this.canvas.style.transform = '';
        this.canvas.style.transformOrigin = '';
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        
        // Only resize canvas if size changed (resizing clears the canvas and causes flicker)
        if (this.canvas.width !== viewWidth || this.canvas.height !== viewHeight) {
            this.canvas.width = viewWidth;
            this.canvas.height = viewHeight;
        }
        gl.viewport(0, 0, viewWidth, viewHeight);
        
        // Calculate where the camera target would be in isometric space
        const targetIsoX = (cameraTarget.x - cameraTarget.y) * spacing + 22;
        const targetIsoY = (cameraTarget.x + cameraTarget.y) * spacing + 22;
        
        // Calculate offset to center the target on screen
        // Account for zoom: when zoomed in, we need to offset more
        const centerScreenX = viewWidth / 2;
        const centerScreenY = viewHeight / 2;
        
        const offsetX = centerScreenX - targetIsoX * zoom;
        const offsetY = centerScreenY - targetIsoY * zoom;
        
        // Save for character rendering
        this.lastMapWidth = mapWidth;
        this.lastMapHeight = mapHeight;
        this.lastMaxZ = Math.max(...cornerHeights.flat()) || 50;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        // Sync legacy "lastOffset" variables to prevent logic mismatch
        this.lastOffsetX = offsetX;
        this.lastOffsetY = offsetY;
        this.currentZoom = zoom;
        
        // Clear
        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.shaderProgram);
        gl.uniform2f(this.uResolution, viewWidth, viewHeight);
        
        // Render tiles back-to-front
        for (let row = 0; row < mapWidth + mapHeight; row++) {
            for (let x = 0; x < mapWidth; x++) {
                const y = row - x;
                if (y < 0 || y >= mapHeight) continue;
                
                const tile = map[y][x];
                const tileId = tile.id;
                
                // Safe corner height access with bounds checking
                const zTop = (cornerHeights[y] && cornerHeights[y][x]) || 0;
                const zRight = (cornerHeights[y] && cornerHeights[y][x + 1]) || 0;
                const zLeft = (cornerHeights[y + 1] && cornerHeights[y + 1][x]) || 0;
                const zBottom = (cornerHeights[y + 1] && cornerHeights[y + 1][x + 1]) || 0;
                
                const yOffsetTop = zTop * this.pixelsPerZ;
                const yOffsetRight = zRight * this.pixelsPerZ;
                const yOffsetLeft = zLeft * this.pixelsPerZ;
                const yOffsetBottom = zBottom * this.pixelsPerZ;
                
                // Base position with zoom
                const baseX = (x - y) * spacing;
                const baseY = (x + y) * spacing;
                
                // Apply zoom and offset
                const posX = offsetX + baseX * zoom;
                const posY = offsetY + baseY * zoom;
                
                // Diamond vertices with zoom
                const topX = posX + 22 * zoom;
                const topY = posY - yOffsetTop * zoom;
                const rightX = posX + 44 * zoom;
                const rightY = posY + 22 * zoom - yOffsetRight * zoom;
                const bottomX = posX + 22 * zoom;
                const bottomY = posY + 44 * zoom - yOffsetBottom * zoom;
                const leftX = posX;
                const leftY = posY + 22 * zoom - yOffsetLeft * zoom;
                
                // Skip if completely outside viewport (with margin)
                const margin = 50 * zoom;
                if (rightX < -margin || leftX > viewWidth + margin ||
                    bottomY < -margin || topY > viewHeight + margin) {
                    continue;
                }
                
                const texture = this.getTexture(tileId, imageLoader);
                if (!texture) continue;
                
                const positions = new Float32Array([
                    topX, topY, rightX, rightY, bottomX, bottomY,
                    topX, topY, bottomX, bottomY, leftX, leftY
                ]);
                
                const texCoords = new Float32Array([
                    0.5, 0.0, 1.0, 0.5, 0.5, 1.0,
                    0.5, 0.0, 0.5, 1.0, 0.0, 0.5
                ]);
                
                const yOffsets = new Float32Array([0, 0, 0, 0, 0, 0]);
                
                gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aPosition);
                gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
                
                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aTexCoord);
                gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
                
                gl.bindBuffer(gl.ARRAY_BUFFER, this.yOffsetBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, yOffsets, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(this.aYOffset);
                gl.vertexAttribPointer(this.aYOffset, 1, gl.FLOAT, false, 0, 0);
                
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(this.uTexture, 0);
                
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
        
        const hasStatics = statics && statics.length > 0;
        const hasCharacters = characters && characters.length > 0;
        if (hasStatics || hasCharacters) {
            this.renderSceneObjectsWithCamera(
                gl,
                hasStatics ? statics : [],
                hasCharacters ? characters : [],
                offsetX,
                offsetY,
                zoom
            );
        }
    }
    
    /**
     * Render statics and characters with unified depth ordering
     */
    renderSceneObjectsWithCamera(gl, statics, characters, offsetX, offsetY, zoom) {
        const spacing = 22;
        
        if (!this.staticPlaceholderTexture) {
            this.staticPlaceholderTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.staticPlaceholderTexture);
            const pixel = new Uint8Array([255, 255, 255, 255]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        if (!this.staticTextureCache) {
            this.staticTextureCache = new Map();
        }
        if (!this.characterTextureCache) {
            this.characterTextureCache = new Map();
        }
        
        const drawables = [];
        
        for (const staticObj of statics) {
            const tileX = staticObj.relX !== undefined ? staticObj.relX : (staticObj.worldX || 0);
            const tileY = staticObj.relY !== undefined ? staticObj.relY : (staticObj.worldY || 0);
            const baseX = (tileX - tileY) * spacing + 22;
            const baseY = (tileX + tileY) * spacing + 22;
            const isoX = offsetX + baseX * zoom;
            const isoY = offsetY + baseY * zoom;
            const zOffset = (staticObj.z || 0) * this.pixelsPerZ * zoom;
            
            let texture;
            let w;
            let h;
            if (staticObj.artTexture) {
                const cacheKey = staticObj.graphic || staticObj.hexId || 'unknown';
                if (!this.staticTextureCache.has(cacheKey)) {
                    const glTex = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, glTex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, staticObj.artTexture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    this.staticTextureCache.set(cacheKey, glTex);
                }
                texture = this.staticTextureCache.get(cacheKey);
                w = staticObj.artTexture.width * zoom;
                h = staticObj.artTexture.height * zoom;
            } else {
                texture = this.staticPlaceholderTexture;
                w = 12 * zoom;
                h = 12 * zoom;
            }
            
            drawables.push({
                texture,
                w,
                h,
                screenX: isoX - w / 2 + 22 * zoom,
                screenY: isoY - zOffset - h + 44 * zoom,
                order: (tileX + tileY) * 1000 + (staticObj.z || 0)
            });
        }
        
        for (const character of characters) {
            if (!character || !character.sprite) continue;
            let sprite = character.sprite;
            if (sprite && typeof sprite === 'object' && !sprite.getContext && sprite.idle) {
                sprite = sprite.idle;
            }
            if (!sprite || typeof sprite.getContext !== 'function') continue;
            
            let texture = this.characterTextureCache.get(sprite);
            if (!texture) {
                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprite);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                this.characterTextureCache.set(sprite, texture);
            }
            
            const spriteW = (sprite.width || sprite.naturalWidth || 64) * zoom;
            const spriteH = (sprite.height || sprite.naturalHeight || 64) * zoom;
            const baseX = (character.x - character.y) * spacing + 22;
            const baseY = (character.x + character.y) * spacing + 22;
            const isoX = offsetX + baseX * zoom;
            const isoY = offsetY + baseY * zoom;
            const zOffset = (character.z || 0) * this.pixelsPerZ * zoom;
            
            drawables.push({
                texture,
                w: spriteW,
                h: spriteH,
                screenX: isoX - spriteW / 2,
                screenY: isoY - zOffset - spriteH + 44 * zoom,
                order: (character.x + character.y) * 1000 + (character.z || 0)
            });
        }
        
        drawables.sort((a, b) => a.order - b.order);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.shaderProgram);
        gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
        
        for (const drawable of drawables) {
            const margin = Math.max(drawable.w, drawable.h);
            if (drawable.screenX + drawable.w < -margin || drawable.screenX > this.canvas.width + margin ||
                drawable.screenY + drawable.h < -margin || drawable.screenY > this.canvas.height + margin) {
                continue;
            }
            
            const positions = new Float32Array([
                drawable.screenX, drawable.screenY,
                drawable.screenX + drawable.w, drawable.screenY,
                drawable.screenX + drawable.w, drawable.screenY + drawable.h,
                drawable.screenX, drawable.screenY,
                drawable.screenX + drawable.w, drawable.screenY + drawable.h,
                drawable.screenX, drawable.screenY + drawable.h
            ]);
            
            const texCoords = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
            const yOffsets = new Float32Array([0, 0, 0, 0, 0, 0]);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aPosition);
            gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aTexCoord);
            gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.yOffsetBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, yOffsets, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.aYOffset);
            gl.vertexAttribPointer(this.aYOffset, 1, gl.FLOAT, false, 0, 0);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, drawable.texture);
            gl.uniform1i(this.uTexture, 0);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
    
    /**
     * Render a player character on the terrain
     * @param {Object} character - Character with x, y, z, direction, sprite properties
     * @param {Object} sprites - Object mapping directions to sprite canvases
     */
    renderCharacter(character, sprites) {
        if (!character || !character.sprite) {
            console.warn('[WebGLRenderer] No character or sprite to render');
            return;
        }
        
        const gl = this.gl;
        const canvas = this.canvas;
        
        // Get map dimensions from last render
        const mapWidth = this.lastMapWidth || 40;
        const mapHeight = this.lastMapHeight || 40;
        
        // Calculate isometric position
        const spacing = 22;
        const maxZ = this.lastMaxZ || 50;
        
        // Use saved offsets from render()
        const offsetX = this.offsetX || 50;
        const offsetY = this.offsetY || 50;
        
        // Character position
        const charX = character.x;
        const charY = character.y;
        const charZ = character.z || 0;
        
        // Isometric position
        const baseX = offsetX + (charX - charY) * spacing;
        const baseY = offsetY + (charX + charY) * spacing;
        
        // Tile center
        const tileCenterX = baseX + 22;
        const tileCenterY = baseY; // Removed + 22 (fix vertical alignment - feet should be at tile top-level for 0,0)
        
        const zOffset = charZ * this.pixelsPerZ;
        
        // Get sprite
        const sprite = character.sprite;
        const w = sprite.width;
        const h = sprite.height;
        
        // Position character: bottom-center at tile center
        const screenX = tileCenterX - w / 2;
        const screenY = tileCenterY - zOffset - h;
        
        // Create character texture if not cached or direction changed
        if (!this.characterTexture || this.lastCharacterDirection !== character.direction) {
            if (this.characterTexture) {
                gl.deleteTexture(this.characterTexture);
            }
            
            this.characterTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.characterTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprite);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.lastCharacterDirection = character.direction;
        }
        
        // Enable alpha blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Use shader program
        gl.useProgram(this.shaderProgram);
        gl.uniform2f(this.uResolution, canvas.width, canvas.height);
        
        // Create quad vertices
        const positions = new Float32Array([
            screenX, screenY,
            screenX + w, screenY,
            screenX + w, screenY + h,
            screenX, screenY,
            screenX + w, screenY + h,
            screenX, screenY + h
        ]);
        
        const texCoords = new Float32Array([
            0, 0, 1, 0, 1, 1,
            0, 0, 1, 1, 0, 1
        ]);
        
        const yOffsets = new Float32Array([0, 0, 0, 0, 0, 0]);
        
        // Upload buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aTexCoord);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.yOffsetBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, yOffsets, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aYOffset);
        gl.vertexAttribPointer(this.aYOffset, 1, gl.FLOAT, false, 0, 0);
        
        // Bind character texture and draw
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.characterTexture);
        gl.uniform1i(this.uTexture, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        console.log(`[WebGLRenderer] Character rendered at (${charX}, ${charY}, z=${charZ}), screen: (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), sprite: ${w}x${h}`);
    }
    
    /**
     * Dispose of WebGL resources
     */
    dispose() {
        const gl = this.gl;
        
        // Clean up character texture if exists
        if (this.characterTexture) {
            gl.deleteTexture(this.characterTexture);
            this.characterTexture = null;
        }
        
        for (const tileId in this.textures) {
            gl.deleteTexture(this.textures[tileId]);
        }
        this.textures = {};
        
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.texCoordBuffer);
        gl.deleteBuffer(this.yOffsetBuffer);
        gl.deleteProgram(this.shaderProgram);
        
        console.log('WebGL Terrain Renderer disposed');
    }
}
