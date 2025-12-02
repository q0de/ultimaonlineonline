/**
 * Character Entity System
 * Represents a player character with stats, skills, resources, and state
 */

import { Weapons, Spells } from './combatMechanics.js';

export class Character {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;
        
        // Position on arena
        this.x = x;
        this.y = y;
        
        // Primary Stats (All set to 100 for balanced PvP)
        this.stats = {
            strength: 100,
            dexterity: 25,  // Low DEX = low stamina (authentic UO)
            intelligence: 100
        };
        
        // Combat Skills (All set to GM 100.0)
        // Pre-AOS skills (Focus skill was introduced in AOS, not available pre-AOS)
        this.skills = {
            swordsmanship: 100.0,
            tactics: 100.0,
            anatomy: 100.0,
            magery: 100.0,
            evaluatingIntelligence: 100.0,
            meditation: 100.0,
            resistSpells: 100.0,
            inscription: 0 // Optional skill
        };
        
        // Resource Pools
        this.resources = {
            health: 100,
            maxHealth: 100,
            mana: 100,
            maxMana: 100,
            stamina: 25,  // Set to 25 as requested
            maxStamina: 25  // Set to 25 as requested
        };
        
        // Equipment
        this.equipment = {
            weapon: { ...Weapons.halberd },
            weaponEquipped: true
        };
        
        // Combat State
        this.combatState = {
            alive: true,
            casting: false,
            currentSpell: null,
            castStartTime: 0,
            castDuration: 0,
            canSwing: true,
            lastSwingTime: 0,
            swingCooldown: 0,
            isAttacking: false,
            currentAnimation: 'idle',
            facing: 'right', // left, right, up, down, etc.
            hitStunRemaining: 0, // Time remaining for hit animation (ms)
            isMoving: false, // Whether character is currently moving
            isRunning: false, // Whether character is running (vs walking)
            warMode: false, // UO-style war mode (Tab to toggle)
            target: null // Current target for auto-swing
        };
        
        // Projectiles and effects this character has created
        this.activeProjectiles = [];
        this.activeEffects = [];
    }

    /**
     * Update character state (called every frame)
     * @param {number} deltaTime - Time since last frame (ms)
     */
    update(deltaTime) {
        // Update resource regeneration
        this.updateRegeneration(deltaTime);
        
        // Handle movement (UO-style tile-based movement)
        // Block movement during attack animation
        if (this.combatState.isMoving && this.targetX !== undefined && this.targetY !== undefined && !this.combatState.isAttacking) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // UO tile size: 44 pixels per tile (standard UO tile size)
            const TILE_SIZE = 44;
            
            // Stop threshold: within a small distance (5px) for smooth stopping
            // Reduced from 22px to prevent visible snapping
            const STOP_THRESHOLD = 5;
            
            if (distance < STOP_THRESHOLD) {
                // Reached target - smoothly stop at target position
                this.x = this.targetX;
                this.y = this.targetY;
                this.combatState.isMoving = false;
                this.combatState.currentAnimation = 'idle';
                this.targetX = undefined;
                this.targetY = undefined;
            } else {
                // Move towards target (interrupts casting)
                if (this.combatState.casting) {
                    this.fizzleCast('movement');
                }
                
                // UO movement speeds (based on server emulator research):
                // Walking: ~400-500ms per tile = 2.0-2.5 tiles/second
                // Running: ~200-300ms per tile = 3.3-5.0 tiles/second
                // Use running speed if character is running AND has stamina, otherwise walking speed
                // UO: Characters need at least 10% stamina to run
                const MIN_STAMINA_TO_RUN = 0.1; // 10% minimum stamina
                const hasEnoughStamina = (this.resources.stamina / this.resources.maxStamina) >= MIN_STAMINA_TO_RUN;
                const isRunning = (this.combatState.isRunning || this.combatState.currentAnimation === 'run') && hasEnoughStamina;
                
                // If trying to run but stamina too low, force walk
                if (this.combatState.isRunning && !hasEnoughStamina) {
                    this.combatState.isRunning = false;
                    this.combatState.currentAnimation = 'walk';
                }
                
                const MS_PER_TILE = isRunning ? 250 : 400; // 250ms per tile (running) or 400ms (walking)
                const TILES_PER_SECOND = 1000 / MS_PER_TILE; // 4 tiles/second (run) or 2.5 tiles/second (walk)
                const speed = TILES_PER_SECOND * TILE_SIZE; // 176 pixels/second (run) or 110 pixels/second (walk)
                const moveDistance = (speed * deltaTime) / 1000;
                
                // Clamp movement to not overshoot target
                const clampedMoveDistance = Math.min(moveDistance, distance - STOP_THRESHOLD);
                
                // Move towards target smoothly
                if (clampedMoveDistance > 0) {
                    this.x += (dx / distance) * clampedMoveDistance;
                    this.y += (dy / distance) * clampedMoveDistance;
                } else {
                    // Very close, just snap to target
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.combatState.isMoving = false;
                    this.combatState.currentAnimation = 'idle';
                    this.targetX = undefined;
                    this.targetY = undefined;
                }
                
                // Update facing direction while moving
                // Calculate angle and map to 8 UO directions
                // Math.atan2(dy, dx): 0°=East, 90°=South, 180°=West, -90°=North
                const angle = Math.atan2(dy, dx);
                
                // Map angle to UO direction names
                // Directions array matches: [east, northeast, north, northwest, west, southwest, south, southeast]
                // Which corresponds to UO: [2, 1, 0, 7, 6, 5, 4, 3]
                let directionIndex;
                const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 to 2PI
                
                // Map normalized angle (0-2PI) to direction index
                // 0° (0) = East, 45° (π/4) = Southeast, 90° (π/2) = South, etc.
                if (normalizedAngle >= 0 && normalizedAngle < Math.PI / 8) {
                    directionIndex = 0; // East
                } else if (normalizedAngle >= Math.PI / 8 && normalizedAngle < 3 * Math.PI / 8) {
                    directionIndex = 7; // Southeast
                } else if (normalizedAngle >= 3 * Math.PI / 8 && normalizedAngle < 5 * Math.PI / 8) {
                    directionIndex = 6; // South
                } else if (normalizedAngle >= 5 * Math.PI / 8 && normalizedAngle < 7 * Math.PI / 8) {
                    directionIndex = 5; // Southwest
                } else if (normalizedAngle >= 7 * Math.PI / 8 && normalizedAngle < 9 * Math.PI / 8) {
                    directionIndex = 4; // West
                } else if (normalizedAngle >= 9 * Math.PI / 8 && normalizedAngle < 11 * Math.PI / 8) {
                    directionIndex = 3; // Northwest
                } else if (normalizedAngle >= 11 * Math.PI / 8 && normalizedAngle < 13 * Math.PI / 8) {
                    directionIndex = 2; // North
                } else {
                    directionIndex = 1; // Northeast
                }
                
                const directions = ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast'];
                this.combatState.facing = directions[directionIndex];
                
                // Only set animation to 'walk' if actually moving (distance > threshold)
                if (distance > STOP_THRESHOLD) {
                    this.combatState.currentAnimation = 'walk';
                } else {
                    this.combatState.currentAnimation = 'idle';
                }
                
                // Debug: log direction when it changes
                if (this._lastFacing !== this.combatState.facing) {
                    console.log(`Character facing: ${this.combatState.facing} (angle: ${(angle * 180 / Math.PI).toFixed(1)}°, normalized: ${(normalizedAngle * 180 / Math.PI).toFixed(1)}°)`);
                    this._lastFacing = this.combatState.facing;
                }
            }
        }
        
        // Update casting state
        if (this.combatState.casting) {
            this.updateCasting(deltaTime);
        }
        
        // Update swing cooldown (ALWAYS check, not just when canSwing is false!)
        // This ensures canSwing gets set to true IMMEDIATELY when cooldown completes
        if (this.equipment.weaponEquipped) {
            this.updateSwingCooldown(deltaTime);
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Update hit stun timer
        if (this.combatState.hitStunRemaining > 0) {
            this.combatState.hitStunRemaining = Math.max(0, this.combatState.hitStunRemaining - deltaTime);
            if (this.combatState.hitStunRemaining === 0) {
                this.combatState.currentAnimation = 'idle';
            }
        }
    }

    /**
     * Update resource regeneration
     * @param {number} deltaTime - Time since last frame (ms)
     */
    updateRegeneration(deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        
        // Mana regeneration (only when not casting)
        if (!this.combatState.casting) {
            const meditationModifier = this.skills.meditation / 100;
            const manaRegen = 2.0 * meditationModifier * deltaSeconds;
            this.resources.mana = Math.min(
                this.resources.maxMana,
                this.resources.mana + manaRegen
            );
        }
        
        // Stamina regeneration and consumption (UO-style)
        // Stamina regenerates when not running/swinging, consumes when running
        if (this.combatState.isRunning && this.combatState.isMoving) {
            // Base stamina consumption while running (UO: ~1 stamina per second)
            let RUN_STAMINA_COST = 1.0; // stamina per second
            
            // UO mechanic: Lower health increases stamina consumption when running
            // Injured characters tire faster (health affects stamina efficiency)
            const healthPercent = this.resources.health / this.resources.maxHealth;
            
            // Health modifier: Lower health = more stamina consumption
            // At 100% health: 1.0x cost
            // At 50% health: 1.5x cost
            // At 25% health: 2.0x cost
            // At 10% health: 2.5x cost
            const healthModifier = 1.0 + (1.0 - healthPercent) * 1.5; // Scales from 1.0x to 2.5x
            RUN_STAMINA_COST *= healthModifier;
            
            // Consume stamina while running
            const staminaCost = RUN_STAMINA_COST * deltaSeconds;
            this.resources.stamina = Math.max(0, this.resources.stamina - staminaCost);
            
            // If stamina drops too low, force walking
            // UO: Characters need at least 10% stamina to run
            const MIN_STAMINA_PERCENT = 0.1; // 10% minimum stamina
            const minStaminaRequired = this.resources.maxStamina * MIN_STAMINA_PERCENT;
            if (this.resources.stamina < minStaminaRequired) {
                this.combatState.isRunning = false;
                this.combatState.currentAnimation = 'walk';
            }
        } else if (!this.combatState.isMoving && !this.combatState.isAttacking) {
            // Regenerate stamina when standing still (not running/swinging/attacking)
            // Pre-AOS UO: Stamina regenerates naturally based on Dexterity
            // NOW ALSO REGENERATES DURING SWING COOLDOWN!
            const baseRegen = 5.0; // 5 stamina per second
            const dexModifier = this.stats.dexterity / 100; // DEX 100 = 1.0x, DEX 50 = 0.5x
            let staminaRegenRate = baseRegen * dexModifier;
            
            // Pre-AOS mechanic: Lower health reduces stamina regeneration
            // Injured characters regenerate stamina slower
            const healthPercent = this.resources.health / this.resources.maxHealth;
            
            // Health modifier: Lower health = slower regeneration
            // At 100% health: 1.0x regen rate
            // At 50% health: 0.75x regen rate
            // At 25% health: 0.5x regen rate
            // At 10% health: 0.25x regen rate
            const healthModifier = 0.25 + (healthPercent * 0.75); // Scales from 0.25x to 1.0x
            staminaRegenRate *= healthModifier;
            
            const staminaRegen = staminaRegenRate * deltaSeconds;
            this.resources.stamina = Math.min(
                this.resources.maxStamina,
                this.resources.stamina + staminaRegen
            );
        } else if (this.combatState.isMoving && !this.combatState.isRunning && !this.combatState.isAttacking) {
            // Regenerate stamina slower while walking (Pre-AOS: ~50% of standing regen rate)
            // ALSO REGENERATES DURING SWING COOLDOWN WHILE WALKING!
            const baseRegen = 0.25;
            const dexModifier = this.stats.dexterity / 100;
            let staminaRegenRate = (baseRegen * dexModifier) * 0.5; // 50% of standing regen
            
            // Health modifier also applies while walking
            const healthPercent = this.resources.health / this.resources.maxHealth;
            const healthModifier = 0.25 + (healthPercent * 0.75);
            staminaRegenRate *= healthModifier;
            
            const staminaRegen = staminaRegenRate * deltaSeconds;
            this.resources.stamina = Math.min(
                this.resources.maxStamina,
                this.resources.stamina + staminaRegen
            );
        }
    }

    /**
     * Update casting progress
     * @param {number} deltaTime - Time since last frame (ms)
     */
    updateCasting(deltaTime) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.combatState.castStartTime;
        
        if (elapsedTime >= this.combatState.castDuration) {
            // Cast complete!
            this.completeCast();
        }
    }

    /**
     * Update swing cooldown
     * @param {number} deltaTime - Time since last frame (ms)
     */
    updateSwingCooldown(deltaTime) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.combatState.lastSwingTime;
        
        // Attack ANIMATION ends after 1.5 seconds, but cooldown continues
        const ATTACK_ANIMATION_DURATION = 1500; // 1.5 seconds
        if (this.combatState.isAttacking && elapsedTime >= ATTACK_ANIMATION_DURATION) {
            this.combatState.isAttacking = false;
            this.combatState.currentAnimation = 'idle';
            console.log(`🎬 Attack animation finished (${(ATTACK_ANIMATION_DURATION/1000).toFixed(1)}s) - cooling down...`);
        }
        
        // COOLDOWN completes after full swing cooldown duration (17s for 25 DEX halberd)
        // Check EVERY FRAME and UPDATE canSwing state continuously!
        const wasReady = this.combatState.canSwing;
        const shouldBeReady = (elapsedTime >= this.combatState.swingCooldown);
        
        // DEBUG: Log the exact calculation when we're near the cooldown completion
        if (!wasReady && elapsedTime >= this.combatState.swingCooldown - 1000) {
            console.log(`⏱️ [${currentTime}] Cooldown check: elapsed=${elapsedTime}ms, cooldown=${this.combatState.swingCooldown}ms, shouldBeReady=${shouldBeReady}, isAttacking=${this.combatState.isAttacking}`);
        }
        
        this.combatState.canSwing = shouldBeReady;
        
        // Log when canSwing transitions from false to true
        if (!wasReady && this.combatState.canSwing) {
            const timestamp = Date.now();
            console.log(`✅ [${timestamp}] Cooldown complete (${(this.combatState.swingCooldown/1000).toFixed(1)}s) - canSwing=TRUE! War:${this.combatState.warMode} Target:${!!this.combatState.target} Attacking:${this.combatState.isAttacking}`);
            // Store this timestamp so we can measure delay to actual swing
            this._readyTimestamp = timestamp;
        }
    }

    /**
     * Update active projectiles
     * @param {number} deltaTime - Time since last frame (ms)
     */
    updateProjectiles(deltaTime) {
        this.activeProjectiles = this.activeProjectiles.filter(projectile => {
            projectile.update(deltaTime);
            return !projectile.isComplete;
        });
    }

    /**
     * Update active effects
     * @param {number} deltaTime - Time since last frame (ms)
     */
    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isComplete;
        });
    }

    /**
     * Start casting a spell
     * @param {string} spellKey - Key of spell to cast
     * @returns {boolean} True if cast started successfully
     */
    startCast(spellKey) {
        const spell = Spells[spellKey];
        
        if (!spell) {
            return false;
        }
        
        // Check if already casting
        if (this.combatState.casting) {
            return false;
        }
        
        // Check mana
        if (this.resources.mana < spell.manaCost) {
            return false;
        }
        
        // Consume mana immediately
        this.resources.mana -= spell.manaCost;
        
        // Start casting
        this.combatState.casting = true;
        this.combatState.currentSpell = { ...spell, key: spellKey };
        this.combatState.castStartTime = Date.now();
        this.combatState.castDuration = spell.baseCastTime;
        this.combatState.currentAnimation = 'cast';
        
        return true;
    }

    /**
     * Complete spell cast
     */
    completeCast() {
        if (!this.combatState.currentSpell) {
            return;
        }
        
        // Create projectile or effect based on spell type
        const spell = this.combatState.currentSpell;
        
        // Reset casting state
        this.combatState.casting = false;
        this.combatState.currentAnimation = 'idle';
        
        // Return spell data for game to handle
        return {
            spell: spell,
            caster: this
        };
    }

    /**
     * Fizzle current spell cast
     * @param {string} reason - Reason for fizzle
     */
    fizzleCast(reason) {
        if (!this.combatState.casting) {
            return false;
        }
        
        // Mana is already consumed (no refund!)
        this.combatState.casting = false;
        this.combatState.currentSpell = null;
        this.combatState.currentAnimation = 'idle';
        
        return true;
    }

    /**
     * Swing weapon
     * @returns {boolean} True if swing started
     */
    swing() {
        console.log(`🗡️ swing() called for ${this.name}`);
        
        // Check if weapon is equipped
        if (!this.equipment.weaponEquipped) {
            console.log(`   ❌ BLOCKED: No weapon equipped`);
            return false;
        }
        
        // Check if can swing
        if (!this.combatState.canSwing) {
            console.log(`   ❌ BLOCKED: canSwing is FALSE (still on cooldown)`);
            return false;
        }
        
        console.log(`   ✅ CAN SWING! Weapon ready!`);
        
        // Check stamina and calculate weapon swing stamina cost
        // UO: Weapon swings consume stamina, cost varies by weapon type
        const baseStaminaCost = this.equipment.weapon.staminaCost || 10;
        
        // UO mechanic: Lower health increases stamina consumption for actions
        // Injured characters use more stamina when swinging weapons
        const healthPercent = this.resources.health / this.resources.maxHealth;
        const healthModifier = 1.0 + (1.0 - healthPercent) * 0.5; // Scales from 1.0x to 1.5x for swings
        const staminaCost = Math.ceil(baseStaminaCost * healthModifier);
        
        // INSTA-HIT MECHANICS: Allow swinging with ANY stamina (even just a sliver)
        // Stamina is consumed but not required to initiate swing
        // This allows instant swings as soon as cooldown completes
        
        // Consume stamina for weapon swing (consume what we have, even if less than cost)
        this.resources.stamina = Math.max(0, this.resources.stamina - staminaCost);
        
        // Start swing
        this.combatState.canSwing = false;
        this.combatState.lastSwingTime = Date.now();
        
        // Calculate swing speed with current stats (authentic UO mechanics)
        // HALBERD: Swing speed ignores stamina depletion (always 17s for 25 DEX)
        const isHalberd = this.equipment.weapon.name === 'Halberd';
        const staminaModifier = isHalberd ? 1.0 : Math.max(0.5, this.resources.stamina / this.resources.maxStamina);
        const dexModifier = this.stats.dexterity / 100; // NO CAP - full UO penalty for low DEX!
        const baseSpeed = this.equipment.weapon.baseSwingSpeed;
        this.combatState.swingCooldown = Math.floor(
            Math.max(1250, baseSpeed / (staminaModifier * dexModifier)) // Halberd: always 17s @ 25 DEX!
        );
        
        const swingTime = Date.now();
        const delayFromReady = this._readyTimestamp ? (swingTime - this._readyTimestamp) : 0;
        console.log(`⚔️ [${swingTime}] SWING! ${this.equipment.weapon.name} - Cooldown: ${(this.combatState.swingCooldown/1000).toFixed(1)}s | Stam: ${Math.floor(this.resources.stamina)} | Delay from ready: ${delayFromReady}ms`);
        this._readyTimestamp = null; // Reset for next swing
        
        this.combatState.isAttacking = true;
        this.combatState.currentAnimation = 'attack';
        
        return true;
    }

    /**
     * Toggle weapon equipped state
     * @returns {boolean} New equipped state
     */
    toggleWeapon() {
        this.equipment.weaponEquipped = !this.equipment.weaponEquipped;
        
        // If casting, this fizzles the spell
        if (this.combatState.casting) {
            this.fizzleCast('weapon_toggle');
        }
        
        console.log(`🗡️ Weapon ${this.equipment.weaponEquipped ? 'EQUIPPED' : 'DISARMED'}`);
        
        // Show cooldown status
        if (!this.combatState.canSwing) {
            const remaining = this.getSwingCooldownRemaining();
            if (this.equipment.weaponEquipped) {
                console.log(`   ⏱️ Cooldown RESUMES: ${remaining.toFixed(1)}s remaining`);
            } else {
                console.log(`   ⏸️ Cooldown PAUSED: ${remaining.toFixed(1)}s frozen`);
            }
        }
        
        return this.equipment.weaponEquipped;
    }

    /**
     * Take damage
     * @param {number} amount - Damage amount
     * @param {string} source - Source of damage ('melee' or 'spell')
     * @returns {boolean} True if character died
     */
    takeDamage(amount, source = 'melee') {
        // Apply damage
        this.resources.health = Math.max(0, this.resources.health - amount);
        
        // UO mechanic: Taking damage can drain stamina
        // Heavier armor causes more stamina loss when hit
        // Base stamina drain: ~10% of damage taken
        // With heavy armor (two-handed weapons count as "heavy"): ~15% of damage taken
        const isHeavyArmor = this.equipment.weapon?.twoHanded || false;
        const staminaDrainPercent = isHeavyArmor ? 0.15 : 0.10; // 15% or 10% of damage
        const staminaDrain = Math.ceil(amount * staminaDrainPercent);
        
        // Drain stamina (but don't go below 0)
        this.resources.stamina = Math.max(0, this.resources.stamina - staminaDrain);
        
        // Interrupt casting if taking damage
        if (this.combatState.casting && source === 'melee') {
            this.fizzleCast('damage');
        }
        
        // Check for death
        if (this.resources.health <= 0) {
            this.die();
            return true;
        }
        
        // Set hit stun for animation
        this.combatState.hitStunRemaining = 500; // 500ms hit animation
        this.combatState.currentAnimation = 'getHit';
        
        return false;
    }

    /**
     * Character death
     */
    die() {
        this.combatState.alive = false;
        this.combatState.currentAnimation = 'death';
        this.combatState.casting = false;
        this.combatState.canSwing = false;
    }

    /**
     * Get cast progress percentage
     * @returns {number} Progress 0-100
     */
    getCastProgress() {
        if (!this.combatState.casting) {
            return 0;
        }
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.combatState.castStartTime;
        const progress = (elapsedTime / this.combatState.castDuration) * 100;
        
        return Math.min(100, progress);
    }

    /**
     * Get swing cooldown progress percentage
     * @returns {number} Progress 0-100
     */
    getSwingProgress() {
        if (this.combatState.canSwing) {
            return 100;
        }
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.combatState.lastSwingTime;
        const progress = (elapsedTime / this.combatState.swingCooldown) * 100;
        
        return Math.min(100, progress);
    }

    /**
     * Get remaining swing cooldown in seconds
     * @returns {number} Seconds remaining until next swing
     */
    getSwingCooldownRemaining() {
        if (this.combatState.canSwing) {
            return 0;
        }
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.combatState.lastSwingTime;
        const remainingMs = Math.max(0, this.combatState.swingCooldown - elapsedTime);
        
        return remainingMs / 1000; // Convert to seconds
    }

    /**
     * Reset character to starting state
     */
    reset() {
        // Reset resources
        this.resources.health = this.resources.maxHealth;
        this.resources.mana = this.resources.maxMana;
        this.resources.stamina = this.resources.maxStamina;
        
        // Reset combat state
        this.combatState.alive = true;
        this.combatState.casting = false;
        this.combatState.currentSpell = null;
        this.combatState.canSwing = true;
        this.combatState.isAttacking = false;
        this.combatState.currentAnimation = 'idle';
        
        // Reset equipment
        this.equipment.weaponEquipped = true;
        
        // Clear projectiles and effects
        this.activeProjectiles = [];
        this.activeEffects = [];
    }

    /**
     * Get character state for rendering
     * @returns {Object} Render data
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            animation: this.combatState.currentAnimation,
            facing: this.combatState.facing,
            weaponEquipped: this.equipment.weaponEquipped,
            health: this.resources.health,
            maxHealth: this.resources.maxHealth,
            alive: this.combatState.alive
        };
    }
}

