/**
 * Direct Asset Creation Script
 * Creates placeholder assets directly in the correct folders
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Generate character sprite
function generateCharacter(color) {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(20, 20, 24, 32);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(32, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Arms
    ctx.fillStyle = color;
    ctx.fillRect(14, 24, 6, 20);
    ctx.fillRect(44, 24, 6, 20);
    
    // Legs
    ctx.fillRect(24, 52, 8, 10);
    ctx.fillRect(32, 52, 8, 10);
    
    // Face
    ctx.fillStyle = '#000';
    ctx.fillRect(28, 14, 2, 2);
    ctx.fillRect(34, 14, 2, 2);
    ctx.fillRect(30, 18, 4, 1);
    
    return canvas;
}

// Generate lightning
function generateLightning() {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    
    ctx.beginPath();
    ctx.moveTo(32, 5);
    ctx.lineTo(28, 20);
    ctx.lineTo(36, 20);
    ctx.lineTo(30, 35);
    ctx.lineTo(38, 35);
    ctx.lineTo(32, 60);
    ctx.stroke();
    
    return canvas;
}

// Generate energy bolt
function generateEnergyBolt() {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 20);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(0.5, '#ff00ff');
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffaaff';
    ctx.beginPath();
    ctx.arc(32, 32, 10, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
}

// Generate explosion
function generateExplosion() {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.3, '#ff8800');
    gradient.addColorStop(0.7, '#ff4400');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff8800';
    
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffff88';
    ctx.beginPath();
    ctx.arc(32, 32, 15, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
}

// Generate fizzle
function generateFizzle() {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#888888';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const size = Math.random() * 3 + 1;
        ctx.fillRect(x, y, size, size);
    }
    
    return canvas;
}

// Generate halberd
function generateHalberd() {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(28, 10, 4, 50);
    
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(32, 5);
    ctx.lineTo(42, 15);
    ctx.lineTo(38, 20);
    ctx.lineTo(32, 15);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(34, 10, 2, 8);
    
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.moveTo(22, 15);
    ctx.lineTo(32, 12);
    ctx.lineTo(32, 18);
    ctx.fill();
    
    return canvas;
}

// Generate grass tile
function generateGrassTile() {
    const canvas = createCanvas(44, 44);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#228b22';
    ctx.fillRect(0, 0, 44, 44);
    
    ctx.fillStyle = '#1a6b1a';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 44;
        const y = Math.random() * 44;
        ctx.fillRect(x, y, 2, 2);
    }
    
    ctx.fillStyle = '#2a9b2a';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 44;
        const y = Math.random() * 44;
        ctx.fillRect(x, y, 1, 1);
    }
    
    return canvas;
}

// Save canvas to file
function saveCanvas(canvas, filePath) {
    ensureDir(path.dirname(filePath));
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ Created: ${filePath}`);
}

// Main execution
const baseDir = 'assets';

console.log('Creating placeholder assets...\n');

// Create character
saveCanvas(generateCharacter('#4169e1'), path.join(baseDir, 'sprites/characters/male/idle.png'));

// Create spell effects
saveCanvas(generateLightning(), path.join(baseDir, 'sprites/effects/lightning.png'));
saveCanvas(generateEnergyBolt(), path.join(baseDir, 'sprites/effects/ebolt.png'));
saveCanvas(generateExplosion(), path.join(baseDir, 'sprites/effects/explosion.png'));
saveCanvas(generateFizzle(), path.join(baseDir, 'sprites/effects/fizzle.png'));

// Create weapon
saveCanvas(generateHalberd(), path.join(baseDir, 'sprites/weapons/halberd.png'));

// Create tile
saveCanvas(generateGrassTile(), path.join(baseDir, 'tiles/grass.png'));

console.log('\n✅ All assets created successfully!');
console.log('Refresh your browser to see the new graphics!');

