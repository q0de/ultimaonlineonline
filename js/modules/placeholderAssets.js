/**
 * Placeholder Asset Generator
 * Creates pixel-art style placeholder graphics programmatically
 * Better than colored rectangles - actual game-ready sprites!
 */

export class PlaceholderAssets {
    /**
     * Generate a character sprite
     * @param {string} color - Character color (blue, red, etc.)
     * @returns {HTMLCanvasElement} Canvas with character sprite
     */
    static generateCharacter(color = '#4169e1') {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Body (rectangle)
        ctx.fillStyle = color;
        ctx.fillRect(20, 20, 24, 32);
        
        // Head (circle)
        ctx.fillStyle = '#ffdbac'; // Skin tone
        ctx.beginPath();
        ctx.arc(32, 16, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Arms
        ctx.fillStyle = color;
        ctx.fillRect(14, 24, 6, 20); // Left arm
        ctx.fillRect(44, 24, 6, 20); // Right arm
        
        // Legs
        ctx.fillRect(24, 52, 8, 10); // Left leg
        ctx.fillRect(32, 52, 8, 10); // Right leg
        
        // Simple face
        ctx.fillStyle = '#000';
        ctx.fillRect(28, 14, 2, 2); // Left eye
        ctx.fillRect(34, 14, 2, 2); // Right eye
        ctx.fillRect(30, 18, 4, 1); // Mouth
        
        // Outline for definition
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, 24, 32);
        
        return canvas;
    }

    /**
     * Generate lightning effect
     * @returns {HTMLCanvasElement} Canvas with lightning sprite
     */
    static generateLightning() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Lightning bolt
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
        
        // Add glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();
        
        return canvas;
    }

    /**
     * Generate energy bolt effect
     * @returns {HTMLCanvasElement} Canvas with energy bolt sprite
     */
    static generateEnergyBolt() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Energy orb
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
        
        // Inner core
        ctx.fillStyle = '#ffaaff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, 32, 10, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    /**
     * Generate explosion effect
     * @returns {HTMLCanvasElement} Canvas with explosion sprite
     */
    static generateExplosion() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Outer explosion ring
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
        
        // Inner blast
        ctx.fillStyle = '#ffff88';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, 32, 15, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    /**
     * Generate fizzle effect
     * @returns {HTMLCanvasElement} Canvas with fizzle sprite
     */
    static generateFizzle() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Scattered sparkles
        ctx.fillStyle = '#888888';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 3 + 1;
            ctx.fillRect(x, y, size, size);
        }
        
        return canvas;
    }

    /**
     * Generate halberd weapon
     * @returns {HTMLCanvasElement} Canvas with halberd sprite
     */
    static generateHalberd() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Wooden handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(28, 10, 4, 50);
        
        // Metal blade
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(32, 5);
        ctx.lineTo(42, 15);
        ctx.lineTo(38, 20);
        ctx.lineTo(32, 15);
        ctx.fill();
        
        // Blade shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(34, 10, 2, 8);
        
        // Axe head
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.moveTo(22, 15);
        ctx.lineTo(32, 12);
        ctx.lineTo(32, 18);
        ctx.fill();
        
        return canvas;
    }

    /**
     * Generate grass tile
     * @returns {HTMLCanvasElement} Canvas with grass tile
     */
    static generateGrassTile() {
        const canvas = document.createElement('canvas');
        canvas.width = 44;
        canvas.height = 44;
        const ctx = canvas.getContext('2d');
        
        // Base grass color
        ctx.fillStyle = '#228b22';
        ctx.fillRect(0, 0, 44, 44);
        
        // Add texture with random dark spots
        ctx.fillStyle = '#1a6b1a';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 44;
            const y = Math.random() * 44;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // Add lighter spots
        ctx.fillStyle = '#2a9b2a';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 44;
            const y = Math.random() * 44;
            ctx.fillRect(x, y, 1, 1);
        }
        
        return canvas;
    }

    /**
     * Generate all placeholder assets and save them
     * @returns {Object} Map of asset name to canvas
     */
    static generateAllAssets() {
        return {
            'char_p1': this.generateCharacter('#4169e1'), // Blue
            'char_p2': this.generateCharacter('#dc143c'), // Red
            'lightning': this.generateLightning(),
            'ebolt': this.generateEnergyBolt(),
            'explosion': this.generateExplosion(),
            'fizzle': this.generateFizzle(),
            'halberd': this.generateHalberd(),
            'grass': this.generateGrassTile()
        };
    }

    /**
     * Download canvas as PNG file
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Filename to save as
     */
    static downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Generate and download all assets
     */
    static downloadAllAssets() {
        const assets = this.generateAllAssets();
        
        // Download each asset
        this.downloadCanvas(assets.char_p1, 'character_blue.png');
        setTimeout(() => this.downloadCanvas(assets.char_p2, 'character_red.png'), 200);
        setTimeout(() => this.downloadCanvas(assets.lightning, 'lightning.png'), 400);
        setTimeout(() => this.downloadCanvas(assets.ebolt, 'ebolt.png'), 600);
        setTimeout(() => this.downloadCanvas(assets.explosion, 'explosion.png'), 800);
        setTimeout(() => this.downloadCanvas(assets.fizzle, 'fizzle.png'), 1000);
        setTimeout(() => this.downloadCanvas(assets.halberd, 'halberd.png'), 1200);
        setTimeout(() => this.downloadCanvas(assets.grass, 'grass.png'), 1400);
        
        console.log('All placeholder assets generated and downloading!');
        console.log('Place them in the appropriate assets/ folders');
    }
}

// Make available globally for easy testing
window.PlaceholderAssets = PlaceholderAssets;

