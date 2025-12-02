/**
 * UO Animation Extractor
 * Extracts animations from anim.mul/idx files and creates WebP sprite sheets
 * 
 * Based on ClassicUO's AnimationsLoader.cs format
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp for image processing, fall back to canvas if not available
let sharp;
let createCanvas;
try {
    sharp = require('sharp');
    console.log('Using sharp for image processing');
} catch (e) {
    try {
        createCanvas = require('canvas').createCanvas;
        console.log('Using canvas for image processing');
    } catch (e2) {
        console.log('Neither sharp nor canvas available, will output raw pixel data');
    }
}

// Configuration
const CONFIG = {
    uoPath: path.join(__dirname, '..', 'Ultima Online Classic'),
    outputPath: path.join(__dirname, '..', 'assets', 'sprites', 'sheets'),
    bodyId: 400, // Male human
    
    // Animation actions to extract (from PeopleAnimationGroup enum)
    actions: {
        walkUnarmed: 0,
        walkArmed: 1,
        runUnarmed: 2,
        runArmed: 3,
        stand: 4,
        fidget1: 5,
        fidget2: 6,
        attackOneHanded: 9,
        attackUnarmed1: 10,
        attackUnarmed2: 11,
        attackTwoHandedDown: 12,
        attackTwoHandedWide: 13,
        attackTwoHandedJab: 14,
        walkWarmode: 15,
        castDirected: 16,
        castArea: 17,
        getHit: 20,
        die1: 21,
        die2: 22,
    },
    
    // UO uses 5 directions (0-4), mirrored for 5-7
    directions: 5,
    maxDirections: 8,
};

// UO Color conversion (16-bit to 32-bit RGBA)
function color16to32(color16) {
    if (color16 === 0) return [0, 0, 0, 0]; // Transparent
    
    // RGB555 format
    const r = ((color16 >> 10) & 0x1F) * 8;
    const g = ((color16 >> 5) & 0x1F) * 8;
    const b = (color16 & 0x1F) * 8;
    
    return [r, g, b, 255];
}

// Read animation index block
function readAnimIdxBlock(buffer, offset) {
    return {
        position: buffer.readUInt32LE(offset),
        size: buffer.readUInt32LE(offset + 4),
        unknown: buffer.readUInt32LE(offset + 8),
    };
}

// Calculate offset in index file for People group (body ID 400+)
function calculatePeopleGroupOffset(graphic) {
    const ANIM_IDX_BLOCK_SIZE = 12;
    return ((graphic - 400) * 175 + 35000) * ANIM_IDX_BLOCK_SIZE;
}

// Read animation frame data
function readFrame(mulBuffer, dataOffset, dataSize) {
    if (dataOffset === 0 || dataSize === 0 || dataOffset >= mulBuffer.length) {
        return null;
    }
    
    let pos = dataOffset;
    
    // Read palette (256 colors, 2 bytes each = 512 bytes)
    const palette = [];
    for (let i = 0; i < 256; i++) {
        palette.push(mulBuffer.readUInt16LE(pos));
        pos += 2;
    }
    
    // Read frame count
    const frameCount = mulBuffer.readInt32LE(pos);
    pos += 4;
    
    if (frameCount <= 0 || frameCount > 100) {
        return null;
    }
    
    // Read frame offsets
    const frameOffsets = [];
    for (let i = 0; i < frameCount; i++) {
        frameOffsets.push(mulBuffer.readInt32LE(pos));
        pos += 4;
    }
    
    const dataStart = dataOffset + 512 + 4; // After palette and frame count
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
        const framePos = dataStart + frameOffsets[i];
        
        if (framePos >= mulBuffer.length) continue;
        
        const frame = readSpriteData(mulBuffer, framePos, palette);
        if (frame) {
            frames.push(frame);
        }
    }
    
    return frames;
}

// Read sprite data (RLE encoded)
function readSpriteData(buffer, pos, palette) {
    if (pos + 8 > buffer.length) return null;
    
    const centerX = buffer.readInt16LE(pos);
    const centerY = buffer.readInt16LE(pos + 2);
    const width = buffer.readInt16LE(pos + 4);
    const height = buffer.readInt16LE(pos + 6);
    
    if (width <= 0 || height <= 0 || width > 512 || height > 512) {
        return null;
    }
    
    pos += 8;
    
    // Create pixel buffer (RGBA)
    const pixels = new Uint8Array(width * height * 4);
    
    // Read RLE data
    while (pos + 4 <= buffer.length) {
        const header = buffer.readUInt32LE(pos);
        pos += 4;
        
        if (header === 0x7FFF7FFF) {
            break; // End marker
        }
        
        const runLength = header & 0x0FFF;
        let x = (header >> 22) & 0x03FF;
        let y = (header >> 12) & 0x3FF;
        
        // Sign extend
        if (x & 0x0200) x |= 0xFFFFFC00;
        if (y & 0x0200) y |= 0xFFFFFC00;
        
        x += centerX;
        y += centerY + height;
        
        for (let k = 0; k < runLength && pos < buffer.length; k++) {
            const paletteIdx = buffer.readUInt8(pos);
            pos++;
            
            const pixelX = x + k;
            const pixelY = y;
            
            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                const idx = (pixelY * width + pixelX) * 4;
                const color = color16to32(palette[paletteIdx]);
                pixels[idx] = color[0];
                pixels[idx + 1] = color[1];
                pixels[idx + 2] = color[2];
                pixels[idx + 3] = color[3];
            }
        }
    }
    
    return {
        centerX,
        centerY,
        width,
        height,
        pixels,
    };
}

// Mirror frame horizontally (for directions 5-7)
function mirrorFrame(frame) {
    if (!frame) return null;
    
    const { width, height, pixels, centerX, centerY } = frame;
    const mirrored = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = (y * width + (width - 1 - x)) * 4;
            
            mirrored[dstIdx] = pixels[srcIdx];
            mirrored[dstIdx + 1] = pixels[srcIdx + 1];
            mirrored[dstIdx + 2] = pixels[srcIdx + 2];
            mirrored[dstIdx + 3] = pixels[srcIdx + 3];
        }
    }
    
    return {
        centerX: width - centerX,
        centerY,
        width,
        height,
        pixels: mirrored,
    };
}

// Create sprite sheet from frames
async function createSpriteSheet(frames, actionName) {
    if (!frames || frames.length === 0) {
        console.log(`  No frames for ${actionName}`);
        return null;
    }
    
    // Find max dimensions
    let maxWidth = 0;
    let maxHeight = 0;
    
    for (const dirFrames of frames) {
        if (!dirFrames) continue;
        for (const frame of dirFrames) {
            if (frame) {
                maxWidth = Math.max(maxWidth, frame.width);
                maxHeight = Math.max(maxHeight, frame.height);
            }
        }
    }
    
    if (maxWidth === 0 || maxHeight === 0) {
        console.log(`  Invalid dimensions for ${actionName}`);
        return null;
    }
    
    // Calculate sprite sheet size
    const numDirections = CONFIG.maxDirections;
    const numFrames = Math.max(...frames.map(d => d ? d.length : 0));
    
    const sheetWidth = maxWidth * numFrames;
    const sheetHeight = maxHeight * numDirections;
    
    console.log(`  Creating ${sheetWidth}x${sheetHeight} sheet (${numFrames} frames x ${numDirections} directions)`);
    
    // Create raw pixel buffer
    const sheetPixels = new Uint8Array(sheetWidth * sheetHeight * 4);
    
    // Direction mapping (UO directions to sheet rows)
    // UO: 0=W, 1=NW, 2=N, 3=NE, 4=E (then mirrored: 5=SE, 6=S, 7=SW)
    // We want: 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
    const directionMap = [2, 3, 4, null, null, null, 0, 1]; // UO dir -> sheet row
    const mirrorMap = {5: 3, 6: 2, 7: 1}; // These directions are mirrored
    
    for (let dir = 0; dir < numDirections; dir++) {
        let srcDir = dir;
        let shouldMirror = false;
        
        // Map to UO direction and check if mirroring needed
        if (dir === 0) srcDir = 2; // N
        else if (dir === 1) srcDir = 3; // NE
        else if (dir === 2) srcDir = 4; // E
        else if (dir === 3) { srcDir = 3; shouldMirror = true; } // SE (mirror NE)
        else if (dir === 4) { srcDir = 2; shouldMirror = true; } // S (mirror N) - actually different anim
        else if (dir === 5) { srcDir = 1; shouldMirror = true; } // SW (mirror NW)
        else if (dir === 6) srcDir = 0; // W
        else if (dir === 7) srcDir = 1; // NW
        
        const dirFrames = frames[srcDir];
        if (!dirFrames) continue;
        
        for (let frameIdx = 0; frameIdx < dirFrames.length; frameIdx++) {
            let frame = dirFrames[frameIdx];
            if (!frame) continue;
            
            if (shouldMirror) {
                frame = mirrorFrame(frame);
            }
            
            // Copy frame to sprite sheet
            const dstX = frameIdx * maxWidth + Math.floor((maxWidth - frame.width) / 2);
            const dstY = dir * maxHeight + Math.floor((maxHeight - frame.height) / 2);
            
            for (let y = 0; y < frame.height; y++) {
                for (let x = 0; x < frame.width; x++) {
                    const srcIdx = (y * frame.width + x) * 4;
                    const dstIdx = ((dstY + y) * sheetWidth + (dstX + x)) * 4;
                    
                    if (dstIdx >= 0 && dstIdx < sheetPixels.length - 3) {
                        sheetPixels[dstIdx] = frame.pixels[srcIdx];
                        sheetPixels[dstIdx + 1] = frame.pixels[srcIdx + 1];
                        sheetPixels[dstIdx + 2] = frame.pixels[srcIdx + 2];
                        sheetPixels[dstIdx + 3] = frame.pixels[srcIdx + 3];
                    }
                }
            }
        }
    }
    
    return {
        width: sheetWidth,
        height: sheetHeight,
        frameWidth: maxWidth,
        frameHeight: maxHeight,
        framesPerDirection: numFrames,
        directions: numDirections,
        pixels: sheetPixels,
    };
}

// Save sprite sheet to file
async function saveSpriteSheet(sheet, filename) {
    if (!sheet) return null;
    
    const outputFile = path.join(CONFIG.outputPath, filename);
    
    if (sharp) {
        // Use sharp for WebP output
        await sharp(Buffer.from(sheet.pixels), {
            raw: {
                width: sheet.width,
                height: sheet.height,
                channels: 4,
            }
        })
        .webp({ quality: 90 })
        .toFile(outputFile.replace('.png', '.webp'));
        
        return filename.replace('.png', '.webp');
    } else if (createCanvas) {
        // Use canvas for PNG output
        const canvas = createCanvas(sheet.width, sheet.height);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(sheet.width, sheet.height);
        imageData.data.set(sheet.pixels);
        ctx.putImageData(imageData, 0, 0);
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputFile, buffer);
        
        return filename;
    } else {
        // Save raw RGBA data
        const rawFile = outputFile.replace('.png', '.raw');
        fs.writeFileSync(rawFile, Buffer.from(sheet.pixels));
        fs.writeFileSync(rawFile + '.meta', JSON.stringify({
            width: sheet.width,
            height: sheet.height,
            channels: 4,
        }));
        
        return path.basename(rawFile);
    }
}

// Main extraction function
async function extractAnimations() {
    console.log('='.repeat(60));
    console.log('UO Animation Extractor');
    console.log('='.repeat(60));
    
    // Check paths
    const animMulPath = path.join(CONFIG.uoPath, 'anim.mul');
    const animIdxPath = path.join(CONFIG.uoPath, 'anim.idx');
    
    if (!fs.existsSync(animMulPath)) {
        console.error(`ERROR: anim.mul not found at ${animMulPath}`);
        return;
    }
    
    if (!fs.existsSync(animIdxPath)) {
        console.error(`ERROR: anim.idx not found at ${animIdxPath}`);
        return;
    }
    
    console.log(`Reading from: ${CONFIG.uoPath}`);
    console.log(`Output to: ${CONFIG.outputPath}`);
    
    // Create output directory
    if (!fs.existsSync(CONFIG.outputPath)) {
        fs.mkdirSync(CONFIG.outputPath, { recursive: true });
    }
    
    // Read files
    console.log('\nLoading animation files...');
    const idxBuffer = fs.readFileSync(animIdxPath);
    const mulBuffer = fs.readFileSync(animMulPath);
    console.log(`  anim.idx: ${(idxBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`  anim.mul: ${(mulBuffer.length / 1024 / 1024).toFixed(1)} MB`);
    
    // Calculate base offset for body ID
    const baseOffset = calculatePeopleGroupOffset(CONFIG.bodyId);
    console.log(`\nExtracting body ID ${CONFIG.bodyId} (offset: ${baseOffset})`);
    
    const metadata = {
        bodyId: CONFIG.bodyId,
        animations: {},
    };
    
    // Extract each action
    for (const [actionName, actionId] of Object.entries(CONFIG.actions)) {
        console.log(`\nExtracting ${actionName} (action ${actionId})...`);
        
        const frames = [];
        
        // Extract all 5 UO directions
        for (let dir = 0; dir < CONFIG.directions; dir++) {
            const entryIndex = actionId * CONFIG.directions + dir;
            const idxOffset = baseOffset + entryIndex * 12;
            
            if (idxOffset + 12 > idxBuffer.length) {
                console.log(`  Direction ${dir}: Index out of bounds`);
                frames.push(null);
                continue;
            }
            
            const idxBlock = readAnimIdxBlock(idxBuffer, idxOffset);
            
            if (idxBlock.position === 0xFFFFFFFF || idxBlock.size === 0) {
                console.log(`  Direction ${dir}: No data`);
                frames.push(null);
                continue;
            }
            
            const dirFrames = readFrame(mulBuffer, idxBlock.position, idxBlock.size);
            
            if (dirFrames && dirFrames.length > 0) {
                console.log(`  Direction ${dir}: ${dirFrames.length} frames (${dirFrames[0].width}x${dirFrames[0].height})`);
                frames.push(dirFrames);
            } else {
                console.log(`  Direction ${dir}: Failed to read frames`);
                frames.push(null);
            }
        }
        
        // Create and save sprite sheet
        const sheet = await createSpriteSheet(frames, actionName);
        
        if (sheet) {
            const filename = `human_${actionName}.png`;
            const savedFile = await saveSpriteSheet(sheet, filename);
            
            if (savedFile) {
                console.log(`  Saved: ${savedFile}`);
                
                metadata.animations[actionName] = {
                    file: savedFile,
                    frameWidth: sheet.frameWidth,
                    frameHeight: sheet.frameHeight,
                    framesPerDirection: sheet.framesPerDirection,
                    directions: sheet.directions,
                    frameDuration: 80, // UO standard
                };
            }
        }
    }
    
    // Save metadata
    const metadataPath = path.join(CONFIG.outputPath, 'animations.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\nMetadata saved to: ${metadataPath}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('Extraction complete!');
    console.log('='.repeat(60));
}

// Run
extractAnimations().catch(console.error);






