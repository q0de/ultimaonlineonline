/**
 * Convert existing BMP animation exports to WebP sprite sheets
 * 
 * Reads from: assets/sprites/animations/walk_e/, run_e/, etc.
 * Outputs to: assets/sprites/sheets/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CONFIG = {
    inputPath: path.join(__dirname, '..', 'assets', 'sprites', 'animations'),
    outputPath: path.join(__dirname, '..', 'assets', 'sprites', 'sheets'),
    
    // Animation types to convert
    animations: {
        walk: {
            directions: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
            pattern: 'walk_{dir}',
            framesPerDir: 10, // UO has 10 frames but we might use 5 for classic timing
        },
        run: {
            directions: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
            pattern: 'run_{dir}',
            framesPerDir: 10,
        },
        idle: {
            directions: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
            pattern: 'idle-static_{dir}',
            framesPerDir: -1, // Variable
        },
    },
    
    // UO timing constants
    FRAME_DURATION_WALK: 80,  // 80ms per frame
    FRAME_DURATION_RUN: 50,   // Faster for running
};

async function loadBmpImages(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`  Directory not found: ${dirPath}`);
        return [];
    }
    
    const files = fs.readdirSync(dirPath)
        .filter(f => f.toLowerCase().endsWith('.bmp'))
        .sort((a, b) => {
            // Sort by frame number (e.g., "Mob 400-0.bmp" -> 0)
            const numA = parseInt(a.match(/(\d+)\.bmp$/i)?.[1] || '0');
            const numB = parseInt(b.match(/(\d+)\.bmp$/i)?.[1] || '0');
            return numA - numB;
        });
    
    console.log(`  Found ${files.length} BMP files`);
    
    const images = [];
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
            const metadata = await sharp(filePath).metadata();
            images.push({
                path: filePath,
                width: metadata.width,
                height: metadata.height,
            });
        } catch (e) {
            console.log(`  Error loading ${file}: ${e.message}`);
        }
    }
    
    return images;
}

async function createSpriteSheet(animName, config) {
    console.log(`\nProcessing ${animName}...`);
    
    const allDirections = [];
    let maxWidth = 0;
    let maxHeight = 0;
    let maxFrames = 0;
    
    // Load all directions
    for (const dir of config.directions) {
        const dirFolder = config.pattern.replace('{dir}', dir);
        const dirPath = path.join(CONFIG.inputPath, dirFolder);
        
        console.log(`  Loading ${dir}: ${dirFolder}`);
        const images = await loadBmpImages(dirPath);
        
        if (images.length > 0) {
            allDirections.push({ dir, images });
            maxFrames = Math.max(maxFrames, images.length);
            
            for (const img of images) {
                maxWidth = Math.max(maxWidth, img.width);
                maxHeight = Math.max(maxHeight, img.height);
            }
        } else {
            allDirections.push({ dir, images: [] });
        }
    }
    
    if (maxFrames === 0) {
        console.log(`  No frames found for ${animName}`);
        return null;
    }
    
    console.log(`  Max dimensions: ${maxWidth}x${maxHeight}, ${maxFrames} frames`);
    
    // Create sprite sheet canvas
    const sheetWidth = maxWidth * maxFrames;
    const sheetHeight = maxHeight * config.directions.length;
    
    console.log(`  Creating ${sheetWidth}x${sheetHeight} sprite sheet`);
    
    // Start with transparent background
    const compositeOps = [];
    
    // Direction mapping to ensure correct order: N, NE, E, SE, S, SW, W, NW
    const dirOrder = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    
    for (let dirIdx = 0; dirIdx < dirOrder.length; dirIdx++) {
        const dirName = dirOrder[dirIdx];
        const dirData = allDirections.find(d => d.dir === dirName);
        
        if (!dirData || dirData.images.length === 0) {
            console.log(`  Warning: No frames for direction ${dirName}`);
            continue;
        }
        
        for (let frameIdx = 0; frameIdx < dirData.images.length; frameIdx++) {
            const img = dirData.images[frameIdx];
            
            // Calculate position (center the frame in its cell)
            const cellX = frameIdx * maxWidth;
            const cellY = dirIdx * maxHeight;
            const offsetX = Math.floor((maxWidth - img.width) / 2);
            const offsetY = Math.floor((maxHeight - img.height) / 2);
            
            compositeOps.push({
                input: img.path,
                left: cellX + offsetX,
                top: cellY + offsetY,
            });
        }
    }
    
    // Create the sprite sheet
    const outputFile = path.join(CONFIG.outputPath, `${animName}.webp`);
    
    await sharp({
        create: {
            width: sheetWidth,
            height: sheetHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        }
    })
    .composite(compositeOps)
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(outputFile);
    
    console.log(`  Saved: ${outputFile}`);
    
    return {
        file: `${animName}.webp`,
        frameWidth: maxWidth,
        frameHeight: maxHeight,
        framesPerDirection: maxFrames,
        directions: config.directions.length,
        frameDuration: animName.includes('run') ? CONFIG.FRAME_DURATION_RUN : CONFIG.FRAME_DURATION_WALK,
    };
}

async function main() {
    console.log('='.repeat(60));
    console.log('BMP to WebP Sprite Sheet Converter');
    console.log('='.repeat(60));
    
    console.log(`Input: ${CONFIG.inputPath}`);
    console.log(`Output: ${CONFIG.outputPath}`);
    
    // Create output directory
    if (!fs.existsSync(CONFIG.outputPath)) {
        fs.mkdirSync(CONFIG.outputPath, { recursive: true });
    }
    
    const metadata = {
        bodyId: 400,
        generated: new Date().toISOString(),
        animations: {},
    };
    
    // Process each animation type
    for (const [animName, config] of Object.entries(CONFIG.animations)) {
        const result = await createSpriteSheet(animName, config);
        if (result) {
            metadata.animations[animName] = result;
        }
    }
    
    // Save metadata
    const metadataPath = path.join(CONFIG.outputPath, 'animations.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\nMetadata saved to: ${metadataPath}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('Conversion complete!');
    console.log('='.repeat(60));
}

main().catch(console.error);

