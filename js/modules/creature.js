/**
 * Creature Entity System
 * Represents a monster/creature with AI behaviors for terrain demo
 * Based on Character class patterns but simpler and focused on AI
 */

/**
 * AI States for creatures
 */
export const AIState = {
    IDLE: 'idle',
    WANDER: 'wander',
    CHASE: 'chase',
    ATTACK: 'attack',
    FLEE: 'flee',
    DEAD: 'dead'
};

/**
 * Creature class for monsters
 */
export class Creature {
    constructor(id, creatureType, x, y) {
        this.id = id;
        this.type = creatureType; // 'orc', 'skeleton', etc.
        this.name = creatureType.charAt(0).toUpperCase() + creatureType.slice(1);
        
        // Position (tile coordinates)
        this.x = x;
        this.y = y;
        this.z = 0; // Elevation
        
        // Target position for movement
        this.targetX = null;
        this.targetY = null;
        
        // Stats (set from creatureDefinitions)
        this.stats = {
            health: 50,
            maxHealth: 50,
            damage: [10, 20], // [min, max]
            attackSpeed: 2000, // ms between attacks
            moveSpeed: 0.8, // tiles per second
            aggroRange: 8, // tiles
            leashRange: 20, // max distance from spawn before returning
        };
        
        // Spawn position (for leash behavior)
        this.spawnX = x;
        this.spawnY = y;
        
        // AI State
        this.aiState = AIState.IDLE;
        this.target = null; // Current target (player character)
        
        // Movement state
        this.direction = 's'; // Current facing direction
        this.isMoving = false;
        
        // Animation state
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameTime = 0;
        this.frameDelay = 150; // ms between animation frames
        
        // Sprite references (set externally)
        this.sprites = null; // { direction: { idle, walk: [], attack: [], death: [] } }
        
        // Combat state
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.attackAnimationTime = 0;
        
        // AI timers
        this.wanderTimer = 0;
        this.wanderInterval = 3000 + Math.random() * 2000; // 3-5 seconds between wander moves
        this.idleTimer = 0;
        this.idleInterval = 1000 + Math.random() * 2000; // 1-3 seconds idle before wandering
        
        // Pathfinding reference (set by terrain demo)
        this.mapData = null;
        
        // Death state
        this.isDead = false;
        this.deathTime = 0;
        this.corpseDecayTime = 10000; // 10 seconds until corpse disappears
    }
    
    /**
     * Set creature stats from definition
     */
    setStats(definition) {
        if (definition.health) {
            this.stats.health = definition.health;
            this.stats.maxHealth = definition.health;
        }
        if (definition.damage) this.stats.damage = definition.damage;
        if (definition.attackSpeed) this.stats.attackSpeed = definition.attackSpeed;
        if (definition.moveSpeed) this.stats.moveSpeed = definition.moveSpeed;
        if (definition.aggroRange) this.stats.aggroRange = definition.aggroRange;
        if (definition.leashRange) this.stats.leashRange = definition.leashRange;
        if (definition.name) this.name = definition.name;
    }
    
    /**
     * Main update function - called every frame
     * @param {number} deltaTime - Time since last frame (ms)
     * @param {Object} playerCharacter - Player character reference
     */
    update(deltaTime, playerCharacter = null) {
        if (this.isDead) {
            this.updateDeath(deltaTime);
            return;
        }
        
        // Update AI state machine
        this.updateAI(deltaTime, playerCharacter);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
    }
    
    /**
     * Update AI state machine
     */
    updateAI(deltaTime, playerCharacter) {
        switch (this.aiState) {
            case AIState.IDLE:
                this.updateIdle(deltaTime, playerCharacter);
                break;
            case AIState.WANDER:
                this.updateWander(deltaTime, playerCharacter);
                break;
            case AIState.CHASE:
                this.updateChase(deltaTime, playerCharacter);
                break;
            case AIState.ATTACK:
                this.updateAttack(deltaTime, playerCharacter);
                break;
            case AIState.FLEE:
                this.updateFlee(deltaTime, playerCharacter);
                break;
        }
    }
    
    /**
     * Idle state - stand still, check for player, occasionally start wandering
     */
    updateIdle(deltaTime, playerCharacter) {
        // Check for player in aggro range
        if (playerCharacter && this.isPlayerInAggroRange(playerCharacter)) {
            this.target = playerCharacter;
            this.aiState = AIState.CHASE;
            console.log(`[${this.name}] Spotted player! Switching to CHASE`);
            return;
        }
        
        // Increment idle timer
        this.idleTimer += deltaTime;
        
        // After idle interval, start wandering
        if (this.idleTimer >= this.idleInterval) {
            this.idleTimer = 0;
            this.aiState = AIState.WANDER;
            this.pickWanderTarget();
        }
    }
    
    /**
     * Wander state - move to random nearby tiles
     */
    updateWander(deltaTime, playerCharacter) {
        // Check for player in aggro range
        if (playerCharacter && this.isPlayerInAggroRange(playerCharacter)) {
            this.target = playerCharacter;
            this.aiState = AIState.CHASE;
            console.log(`[${this.name}] Spotted player while wandering! Switching to CHASE`);
            return;
        }
        
        // If reached target or no target, go back to idle
        if (this.targetX === null || (!this.isMoving && this.reachedTarget())) {
            this.targetX = null;
            this.targetY = null;
            this.aiState = AIState.IDLE;
            this.idleTimer = 0;
            this.idleInterval = 1000 + Math.random() * 2000;
        }
    }
    
    /**
     * Chase state - pursue the player
     */
    updateChase(deltaTime, playerCharacter) {
        if (!playerCharacter || !this.target) {
            this.aiState = AIState.IDLE;
            this.target = null;
            return;
        }
        
        // Check if player out of leash range
        const distFromSpawn = this.distanceTo(this.spawnX, this.spawnY);
        if (distFromSpawn > this.stats.leashRange) {
            console.log(`[${this.name}] Player too far from spawn, returning...`);
            this.aiState = AIState.IDLE;
            this.target = null;
            this.targetX = this.spawnX;
            this.targetY = this.spawnY;
            return;
        }
        
        // Check if player out of aggro range (lost sight)
        if (!this.isPlayerInAggroRange(playerCharacter)) {
            this.aiState = AIState.IDLE;
            this.target = null;
            console.log(`[${this.name}] Lost sight of player, returning to idle`);
            return;
        }
        
        // Check if close enough to attack
        const distToPlayer = this.distanceTo(playerCharacter.x, playerCharacter.y);
        if (distToPlayer <= 1.5) {
            this.aiState = AIState.ATTACK;
            this.targetX = null;
            this.targetY = null;
            this.isMoving = false;
            return;
        }
        
        // Move toward player
        this.targetX = playerCharacter.x;
        this.targetY = playerCharacter.y;
    }
    
    /**
     * Attack state - attack the player
     */
    updateAttack(deltaTime, playerCharacter) {
        if (!playerCharacter || !this.target) {
            this.aiState = AIState.IDLE;
            this.target = null;
            return;
        }
        
        // Check if player moved out of attack range
        const distToPlayer = this.distanceTo(playerCharacter.x, playerCharacter.y);
        if (distToPlayer > 1.5) {
            this.aiState = AIState.CHASE;
            this.isAttacking = false;
            return;
        }
        
        // Face the player
        this.updateFacingDirection(playerCharacter.x, playerCharacter.y);
        
        // Check attack cooldown
        const now = Date.now();
        if (now - this.lastAttackTime >= this.stats.attackSpeed) {
            this.performAttack(playerCharacter);
            this.lastAttackTime = now;
        }
        
        // Update attack animation
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime;
            if (this.attackAnimationTime >= 500) { // 500ms attack animation
                this.isAttacking = false;
                this.attackAnimationTime = 0;
                this.currentAnimation = 'idle';
            }
        }
    }
    
    /**
     * Flee state - run away from player
     */
    updateFlee(deltaTime, playerCharacter) {
        if (!playerCharacter) {
            this.aiState = AIState.IDLE;
            return;
        }
        
        // Move away from player
        const dx = this.x - playerCharacter.x;
        const dy = this.y - playerCharacter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Normalize and scale
            const fleeDistance = 5;
            this.targetX = this.x + (dx / dist) * fleeDistance;
            this.targetY = this.y + (dy / dist) * fleeDistance;
        }
        
        // If far enough away, go back to idle
        if (dist > this.stats.aggroRange * 1.5) {
            this.aiState = AIState.IDLE;
            this.targetX = null;
            this.targetY = null;
        }
    }
    
    /**
     * Update death state
     */
    updateDeath(deltaTime) {
        this.deathTime += deltaTime;
        
        // Update death animation
        this.updateAnimation(deltaTime);
    }
    
    /**
     * Check if corpse should be removed
     */
    shouldRemoveCorpse() {
        return this.isDead && this.deathTime >= this.corpseDecayTime;
    }
    
    /**
     * Pick a random wander target
     */
    pickWanderTarget() {
        // Pick a random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 2 + Math.random() * 3; // 2-5 tiles
        
        const newX = Math.round(this.x + Math.cos(angle) * distance);
        const newY = Math.round(this.y + Math.sin(angle) * distance);
        
        // Validate walkable (if map data available)
        if (this.isWalkable(newX, newY)) {
            this.targetX = newX;
            this.targetY = newY;
        } else {
            // Try finding a walkable tile nearby
            for (let attempts = 0; attempts < 5; attempts++) {
                const tryX = Math.round(this.x + (Math.random() - 0.5) * 6);
                const tryY = Math.round(this.y + (Math.random() - 0.5) * 6);
                if (this.isWalkable(tryX, tryY)) {
                    this.targetX = tryX;
                    this.targetY = tryY;
                    break;
                }
            }
        }
    }
    
    /**
     * Check if a tile is walkable
     */
    isWalkable(x, y) {
        if (!this.mapData) return true; // No map data, assume walkable
        
        if (x < 0 || y < 0 || y >= this.mapData.length || x >= this.mapData[0].length) {
            return false;
        }
        
        const tile = this.mapData[y][x];
        if (!tile) return false;
        
        // Check if tile is walkable (not water, not steep)
        const walkableBiomes = ['grass', 'dirt', 'sand', 'forest', 'snow', 'rock'];
        return walkableBiomes.includes(tile.biome);
    }
    
    /**
     * Update movement toward target
     */
    updateMovement(deltaTime) {
        if (this.targetX === null || this.targetY === null) {
            this.isMoving = false;
            if (!this.isAttacking) {
                this.currentAnimation = 'idle';
            }
            return;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const STOP_THRESHOLD = 0.1;
        
        if (distance < STOP_THRESHOLD) {
            // Reached target
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            if (!this.isAttacking) {
                this.currentAnimation = 'idle';
            }
            return;
        }
        
        // Move toward target
        this.isMoving = true;
        this.currentAnimation = 'walk';
        
        // Calculate move distance this frame
        const moveSpeed = this.stats.moveSpeed; // tiles per second
        const moveDistance = (moveSpeed * deltaTime) / 1000;
        
        // Move
        if (moveDistance < distance) {
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
        }
        
        // Update facing direction
        this.updateFacingDirection(this.targetX, this.targetY);
    }
    
    /**
     * Update facing direction based on movement
     */
    updateFacingDirection(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
        
        const angle = Math.atan2(dy, dx);
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
        
        // Map angle to 8 directions
        // UO directions: s, sw, w, nw, n, ne, e, se
        const directions = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
        const index = Math.round(normalizedAngle / (Math.PI / 4)) % 8;
        this.direction = directions[index];
    }
    
    /**
     * Update animation frames
     */
    updateAnimation(deltaTime) {
        this.frameTime += deltaTime;
        
        if (this.frameTime >= this.frameDelay) {
            this.frameTime = 0;
            this.currentFrame++;
            
            // Get frame count for current animation
            const frameCount = this.getFrameCount();
            if (this.currentFrame >= frameCount) {
                if (this.isDead) {
                    // Stay on last death frame
                    this.currentFrame = frameCount - 1;
                } else {
                    this.currentFrame = 0;
                }
            }
        }
    }
    
    /**
     * Get frame count for current animation
     */
    getFrameCount() {
        if (!this.sprites || !this.sprites[this.direction]) return 1;
        
        const dirSprites = this.sprites[this.direction];
        
        switch (this.currentAnimation) {
            case 'walk':
                return dirSprites.walk?.length || 1;
            case 'attack':
            case 'attack1':
                return dirSprites.attack1?.length || dirSprites.attack?.length || 1;
            case 'death':
                return dirSprites.death?.length || 1;
            case 'idle':
            default:
                return 1;
        }
    }
    
    /**
     * Get current sprite for rendering
     */
    getCurrentSprite() {
        if (!this.sprites || !this.sprites[this.direction]) return null;
        
        const dirSprites = this.sprites[this.direction];
        
        switch (this.currentAnimation) {
            case 'walk':
                if (dirSprites.walk && dirSprites.walk.length > 0) {
                    return dirSprites.walk[this.currentFrame % dirSprites.walk.length];
                }
                break;
            case 'attack':
            case 'attack1':
                const attackFrames = dirSprites.attack1 || dirSprites.attack;
                if (attackFrames && attackFrames.length > 0) {
                    return attackFrames[this.currentFrame % attackFrames.length];
                }
                break;
            case 'death':
                if (dirSprites.death && dirSprites.death.length > 0) {
                    return dirSprites.death[this.currentFrame % dirSprites.death.length];
                }
                break;
            case 'idle':
            default:
                return dirSprites.idle;
        }
        
        // Fallback to idle
        return dirSprites.idle;
    }
    
    /**
     * Perform an attack on target
     */
    performAttack(target) {
        this.isAttacking = true;
        this.currentAnimation = 'attack';
        this.currentFrame = 0;
        this.attackAnimationTime = 0;
        
        // Calculate damage
        const [minDmg, maxDmg] = this.stats.damage;
        const damage = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));
        
        // Apply damage to target
        if (target && target.takeDamage) {
            const died = target.takeDamage(damage, 'melee');
            console.log(`[${this.name}] Hit ${target.name} for ${damage} damage!${died ? ' (KILLED!)' : ''}`);
        } else if (target && target.resources) {
            // Simple damage for terrain demo characters
            target.resources.health = Math.max(0, target.resources.health - damage);
            console.log(`[${this.name}] Hit target for ${damage} damage!`);
        }
    }
    
    /**
     * Take damage from an attack
     */
    takeDamage(amount, source = 'melee') {
        this.stats.health = Math.max(0, this.stats.health - amount);
        
        console.log(`[${this.name}] Took ${amount} damage! HP: ${this.stats.health}/${this.stats.maxHealth}`);
        
        if (this.stats.health <= 0) {
            this.die();
            return true;
        }
        
        // Low health? Consider fleeing
        if (this.stats.health < this.stats.maxHealth * 0.2) {
            // 30% chance to flee when below 20% health
            if (Math.random() < 0.3) {
                this.aiState = AIState.FLEE;
                console.log(`[${this.name}] Fleeing!`);
            }
        }
        
        return false;
    }
    
    /**
     * Die
     */
    die() {
        this.isDead = true;
        this.aiState = AIState.DEAD;
        this.currentAnimation = 'death';
        this.currentFrame = 0;
        this.isMoving = false;
        this.isAttacking = false;
        this.targetX = null;
        this.targetY = null;
        
        console.log(`[${this.name}] Died!`);
    }
    
    /**
     * Check if player is in aggro range
     */
    isPlayerInAggroRange(playerCharacter) {
        if (!playerCharacter) return false;
        const dist = this.distanceTo(playerCharacter.x, playerCharacter.y);
        return dist <= this.stats.aggroRange;
    }
    
    /**
     * Calculate distance to a point
     */
    distanceTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check if reached current target
     */
    reachedTarget() {
        if (this.targetX === null || this.targetY === null) return true;
        return this.distanceTo(this.targetX, this.targetY) < 0.5;
    }
    
    /**
     * Get render data for the renderer
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            type: this.type,
            direction: this.direction,
            animation: this.currentAnimation,
            frame: this.currentFrame,
            sprite: this.getCurrentSprite(),
            health: this.stats.health,
            maxHealth: this.stats.maxHealth,
            isDead: this.isDead,
            isAttacking: this.isAttacking,
            name: this.name
        };
    }
}



