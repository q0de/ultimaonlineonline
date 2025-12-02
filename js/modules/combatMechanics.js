/**
 * Pre-AOS Ultima Online Combat Mechanics
 * Implements authentic formulas from pre-Age of Shadows era
 * Reference: UO Stratics, UO Guide
 */

export const CombatMechanics = {
    /**
     * Calculate weapon hit chance
     * @param {Object} attacker - Attacker character stats
     * @param {Object} defender - Defender character stats
     * @param {number} distance - Distance between attacker and defender in pixels
     * @param {number} weaponRange - Weapon range in pixels (tiles * 44)
     * @returns {number} Hit chance percentage (0-100)
     */
    calculateHitChance(attacker, defender, distance = 0, weaponRange = 44) {
        // Pre-AOS UO: Out of range attacks automatically miss
        if (distance > weaponRange) {
            return 0;
        }
        
        // Attack value is the weapon skill
        const attackValue = attacker.skills.swordsmanship;
        
        // Defense value is average of Tactics and Anatomy
        const defenseValue = (defender.skills.tactics + defender.skills.anatomy) / 2;
        
        // Skill difference affects hit chance
        const skillDifference = attackValue - defenseValue;
        
        // Base 50% hit chance
        const baseHitChance = 50;
        
        // Each point of skill difference = 0.5% modifier
        const modifiedHitChance = baseHitChance + (skillDifference / 2);
        
        // Pre-AOS: Optional range penalty for being near edge of range
        // Melee weapons (range 1 tile) don't have range penalty, but we can add slight penalty
        // for being at the very edge of range to simulate accuracy loss
        let rangeModifier = 1.0;
        if (weaponRange > 0 && distance > 0) {
            const rangePercent = distance / weaponRange;
            // At 100% of range, slight penalty (5% reduction)
            // This is optional and may not be in original UO, but adds realism
            if (rangePercent > 0.9) {
                rangeModifier = 1.0 - ((rangePercent - 0.9) * 0.5); // Up to 5% penalty at max range
            }
        }
        
        // Apply range modifier
        const rangeAdjustedChance = modifiedHitChance * rangeModifier;
        
        // Clamp between 15% and 85% (pre-AOS hit chance limits)
        // IMPORTANT: Never 100% - always a chance to miss, even when close
        const finalHitChance = Math.max(15, Math.min(85, rangeAdjustedChance));
        
        // Safety check: Ensure hit chance is never 100% (pre-AOS UO rule)
        if (finalHitChance >= 100) {
            console.warn('ERROR: Hit chance calculated as 100%! Clamping to 85% (pre-AOS max).');
            return 85.0;
        }
        
        return Math.round(finalHitChance * 10) / 10; // Round to 1 decimal place
    },

    /**
     * Calculate weapon damage
     * @param {Object} attacker - Attacker character stats
     * @param {Object} weapon - Weapon data
     * @returns {number} Final damage amount
     */
    calculateWeaponDamage(attacker, weapon) {
        // Random base damage within weapon range
        const baseDamage = this.random(weapon.damageMin, weapon.damageMax);
        
        // Strength bonus: (STR * 0.3) + (Tactics / 6.5)
        const strengthBonus = (attacker.stats.strength * 0.3) + (attacker.skills.tactics / 6.5);
        
        // Anatomy bonus: Anatomy / 5
        const anatomyBonus = attacker.skills.anatomy / 5;
        
        // Final damage
        const finalDamage = Math.floor(baseDamage + strengthBonus + anatomyBonus);
        
        return Math.max(1, finalDamage); // Minimum 1 damage
    },

    /**
     * Calculate weapon swing speed delay
     * @param {Object} character - Character stats
     * @param {Object} weapon - Weapon data
     * @returns {number} Swing delay in milliseconds
     */
    calculateSwingSpeed(character, weapon) {
        // Base swing delay from weapon (halberd = 1750ms)
        const baseSwingDelay = weapon.baseSwingSpeed;
        
        // Stamina modifier (low stamina slows you down)
        const staminaModifier = Math.max(0.5, character.resources.stamina / character.resources.maxStamina);
        
        // Dexterity modifier (higher DEX = faster swings)
        const dexModifier = Math.max(0.5, character.stats.dexterity / 100);
        
        // Calculate actual swing delay
        const actualSwingDelay = baseSwingDelay / (staminaModifier * dexModifier);
        
        // Clamp between 1250ms and 2500ms
        const clampedDelay = Math.max(1250, Math.min(2500, actualSwingDelay));
        
        return Math.floor(clampedDelay);
    },

    /**
     * Calculate spell damage
     * @param {Object} caster - Caster character stats
     * @param {Object} spell - Spell data
     * @param {Object} target - Target character stats
     * @returns {number} Final spell damage
     */
    calculateSpellDamage(caster, spell, target) {
        // Random base damage within spell range
        const baseDamage = this.random(spell.damageMin, spell.damageMax);
        
        // Evaluate Intelligence bonus: EvalInt / 10
        const evalIntBonus = caster.skills.evaluatingIntelligence / 10;
        
        // Inscription bonus: Inscription / 10 (if applicable)
        const inscriptionBonus = (caster.skills.inscription || 0) / 10;
        
        // Magic Resist penalty: Target's Resist / 10
        const resistPenalty = target.skills.resistSpells / 10;
        
        // Final damage calculation
        const finalDamage = Math.floor(
            (baseDamage + evalIntBonus + inscriptionBonus) - resistPenalty
        );
        
        return Math.max(1, finalDamage); // Minimum 1 damage
    },

    /**
     * Calculate spell cast time with modifiers
     * @param {Object} spell - Spell data
     * @param {number} fasterCasting - FC level (0-4)
     * @returns {number} Cast time in milliseconds
     */
    calculateCastTime(spell, fasterCasting = 0) {
        const baseCastTime = spell.baseCastTime;
        
        // Faster Casting modifiers (Pre-AOS, default to 0)
        const fcModifiers = {
            0: 1.0,   // 100% cast time
            1: 0.75,  // 75% cast time
            2: 0.5,   // 50% cast time
            3: 0.33,  // 33% cast time
            4: 0.25   // 25% cast time
        };
        
        const modifier = fcModifiers[fasterCasting] || 1.0;
        
        return Math.floor(baseCastTime * modifier);
    },

    /**
     * Calculate mana regeneration per tick
     * @param {Object} character - Character stats
     * @param {boolean} isCasting - Is currently casting?
     * @returns {number} Mana regenerated per second
     */
    calculateManaRegen(character, isCasting = false) {
        // No regen while casting
        if (isCasting) {
            return 0;
        }
        
        // Base regen with Meditation skill
        const meditationModifier = character.skills.meditation / 100;
        const baseRegen = 2.0; // Per second with GM meditation
        
        return baseRegen * meditationModifier;
    },

    /**
     * Calculate stamina regeneration per tick
     * @param {Object} character - Character stats
     * @param {boolean} isActive - Is swinging/running?
     * @returns {number} Stamina regenerated per second
     */
    calculateStaminaRegen(character, isActive = false) {
        // No regen while actively swinging/running
        if (isActive) {
            return 0;
        }
        
        // Base regen rate
        const baseRegen = 5.0; // Per second when idle
        
        return baseRegen;
    },

    /**
     * Calculate stamina cost for weapon swing
     * @param {Object} weapon - Weapon data
     * @returns {number} Stamina cost
     */
    calculateStaminaCost(weapon) {
        // Heavier weapons cost more stamina
        // Halberd is a heavy two-handed weapon
        return weapon.staminaCost || 10;
    },

    /**
     * Check if spell fizzles (cast interrupted)
     * @param {string} reason - Reason for fizzle check
     * @returns {boolean} True if spell fizzles
     */
    checkSpellFizzle(reason) {
        // Fizzle conditions:
        // 1. Taking damage while casting
        // 2. Moving while casting
        // 3. Manually unequipping weapon
        // 4. Insufficient mana (checked at cast start)
        
        const fizzleReasons = ['damage', 'movement', 'weapon_toggle', 'no_mana'];
        return fizzleReasons.includes(reason);
    },

    /**
     * Random number generator (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Roll for hit/miss based on chance
     * Pre-AOS UO: Never 100% guaranteed - always a chance to miss
     * @param {number} hitChance - Hit chance percentage (0-100)
     * @returns {boolean} True if hit connects, false if miss
     */
    rollHit(hitChance) {
        // Ensure hitChance is valid (0-100)
        const clampedChance = Math.max(0, Math.min(100, hitChance));
        
        // Roll random number 0-100 and check if it's less than hit chance
        // Example: 50% hit chance means random < 50 = 50% chance to hit
        // Example: 85% hit chance means random < 85 = 85% chance to hit (15% miss chance)
        const roll = Math.random() * 100;
        return roll < clampedChance;
    },

    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
};

/**
 * Weapon definitions
 */
export const Weapons = {
    halberd: {
        name: 'Halberd',
        skill: 'swordsmanship',
        damageMin: 20,
        damageMax: 30,
        baseSwingSpeed: 4250, // milliseconds (4.25 seconds base, pre-AOS UO - can be reduced with stamina/SSI)
        twoHanded: true,
        staminaCost: 10,
        range: 2 // tiles (increased from 1 for easier auto-swing testing)
    },
    katana: {
        name: 'Katana',
        skill: 'swordsmanship',
        damageMin: 15,
        damageMax: 22,
        baseSwingSpeed: 1250,
        twoHanded: false,
        staminaCost: 6,
        range: 1
    },
    warAxe: {
        name: 'War Axe',
        skill: 'swordsmanship',
        damageMin: 18,
        damageMax: 26,
        baseSwingSpeed: 1500,
        twoHanded: false,
        staminaCost: 7,
        range: 1
    }
};

/**
 * Spell definitions
 */
export const Spells = {
    lightning: {
        name: 'Lightning',
        circle: 6,
        manaCost: 40,
        baseCastTime: 1500, // milliseconds
        damageMin: 25,
        damageMax: 35,
        type: 'projectile',
        speed: 15, // pixels per frame
        reagents: ['Black Pearl', 'Mandrake Root', 'Sulfurous Ash']
    },
    energyBolt: {
        name: 'Energy Bolt',
        circle: 7,
        manaCost: 40,
        baseCastTime: 2500,
        damageMin: 30,
        damageMax: 45,
        type: 'projectile',
        speed: 12,
        reagents: ['Black Pearl', 'Nightshade']
    },
    explosion: {
        name: 'Explosion',
        circle: 6,
        manaCost: 40,
        baseCastTime: 3000,
        damageMin: 35,
        damageMax: 50,
        type: 'area',
        delayedDetonation: 2000, // arms for 2 seconds before exploding
        radius: 3, // tiles
        reagents: ['Blood Moss', 'Mandrake Root']
    }
};

/**
 * Animation frame rates and timings
 */
export const AnimationTimings = {
    idle: { frames: 1, fps: 1, loop: true },
    walk: { frames: 8, fps: 8, loop: true },
    run: { frames: 8, fps: 12, loop: true },
    attack: { frames: 7, fps: 10, loop: false },
    cast: { frames: 5, fps: 8, loop: true },
    getHit: { frames: 2, fps: 10, loop: false },
    death: { frames: 4, fps: 6, loop: false }
};

