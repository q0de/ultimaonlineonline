/**
 * Projectile System
 * Handles spell projectiles and area effects
 */

export class Projectile {
    constructor(spell, caster, target, x, y) {
        this.spell = spell;
        this.caster = caster;
        this.target = target;
        this.x = x;
        this.y = y;
        
        // Calculate target position
        this.targetX = target.x;
        this.targetY = target.y;
        
        // Calculate direction
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * spell.speed;
        this.velocityY = (dy / distance) * spell.speed;
        
        // State
        this.isComplete = false;
        this.hasHit = false;
        this.frame = 0;
        this.maxFrames = 10; // Animation frames
        
        // For explosion spell
        this.isArmed = false;
        this.armTime = spell.delayedDetonation || 0;
        this.timeAlive = 0;
    }

    /**
     * Update projectile
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (this.isComplete) {
            return;
        }
        
        this.timeAlive += deltaTime;
        
        // Handle explosion delay
        if (this.spell.type === 'area' && !this.isArmed) {
            if (this.timeAlive >= this.armTime) {
                this.isArmed = true;
                this.detonate();
            }
            return;
        }
        
        // Move projectile
        if (this.spell.type === 'projectile') {
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Check if reached target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.spell.speed || distance < 5) {
                this.hit();
            }
            
            // Update animation frame
            this.frame = (this.frame + 0.3) % this.maxFrames;
        }
    }

    /**
     * Projectile hits target
     */
    hit() {
        if (this.hasHit) {
            return;
        }
        
        this.hasHit = true;
        this.isComplete = true;
    }

    /**
     * Detonate explosion
     */
    detonate() {
        this.hasHit = true;
        // Don't set isComplete immediately for visual effect
        setTimeout(() => {
            this.isComplete = true;
        }, 500); // Show explosion animation
    }

    /**
     * Get render data
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            frame: Math.floor(this.frame),
            spell: this.spell,
            isArmed: this.isArmed,
            hasHit: this.hasHit
        };
    }
}

