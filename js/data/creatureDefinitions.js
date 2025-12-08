/**
 * Creature Definitions
 * Stats and configurations for all creature types
 * Based on UO monster data
 */

export const CreatureTypes = {
    orc: {
        bodyId: 7,
        name: 'Orc',
        health: 50,
        damage: [5, 15],
        attackSpeed: 2500, // ms between attacks
        moveSpeed: 0.8, // tiles per second
        aggroRange: 8, // tiles to detect player
        leashRange: 20, // max distance from spawn
        spritePrefix: 'orc',
        loot: ['gold', 'club'],
        description: 'A brutish green-skinned humanoid'
    },
    
    orc_captain: {
        bodyId: 8,
        name: 'Orc Captain',
        health: 80,
        damage: [10, 20],
        attackSpeed: 2200,
        moveSpeed: 0.9,
        aggroRange: 10,
        leashRange: 25,
        spritePrefix: 'orc_captain',
        loot: ['gold', 'axe', 'orc_helm'],
        description: 'A battle-hardened orc leader'
    },
    
    skeleton: {
        bodyId: 50,
        name: 'Skeleton',
        health: 30,
        damage: [3, 10],
        attackSpeed: 2000,
        moveSpeed: 0.7,
        aggroRange: 6,
        leashRange: 15,
        spritePrefix: 'skeleton',
        loot: ['bones', 'gold'],
        description: 'An animated pile of bones'
    },
    
    zombie: {
        bodyId: 3,
        name: 'Zombie',
        health: 40,
        damage: [5, 12],
        attackSpeed: 3000, // Slower attacks
        moveSpeed: 0.4, // Very slow movement
        aggroRange: 5,
        leashRange: 12,
        spritePrefix: 'zombie',
        loot: ['rotten_flesh', 'gold'],
        description: 'A shambling undead corpse'
    },
    
    troll: {
        bodyId: 54,
        name: 'Troll',
        health: 120,
        damage: [15, 30],
        attackSpeed: 3000, // Slow but powerful
        moveSpeed: 0.6,
        aggroRange: 8,
        leashRange: 20,
        spritePrefix: 'troll',
        loot: ['gold', 'club', 'troll_hide'],
        description: 'A large regenerating beast'
    },
    
    ogre: {
        bodyId: 17,
        name: 'Ogre',
        health: 100,
        damage: [12, 25],
        attackSpeed: 2800,
        moveSpeed: 0.5,
        aggroRange: 7,
        leashRange: 18,
        spritePrefix: 'ogre',
        loot: ['gold', 'club', 'ogre_leather'],
        description: 'A massive, dim-witted brute'
    },
    
    ettin: {
        bodyId: 18, // Body ID 20 had no sprites, trying 18
        name: 'Ettin',
        health: 150,
        damage: [20, 35],
        attackSpeed: 2500,
        moveSpeed: 0.55,
        aggroRange: 9,
        leashRange: 22,
        spritePrefix: 'ettin',
        loot: ['gold', 'club', 'ettin_hide'],
        description: 'A two-headed giant'
    },
    
    lich: {
        bodyId: 24,
        name: 'Lich',
        health: 80,
        damage: [20, 40], // Magic damage
        attackSpeed: 3500, // Casts spells
        moveSpeed: 0.6,
        aggroRange: 12, // Long range detection
        leashRange: 30,
        spritePrefix: 'lich',
        loot: ['gold', 'reagents', 'bone_armor'],
        description: 'An undead sorcerer'
    },
    
    gazer: {
        bodyId: 22,
        name: 'Gazer',
        health: 60,
        damage: [10, 25], // Magic damage
        attackSpeed: 2000,
        moveSpeed: 0.8,
        aggroRange: 10,
        leashRange: 20,
        spritePrefix: 'gazer',
        loot: ['gold', 'eye_of_newt'],
        description: 'A floating eye beast'
    },
    
    spider: {
        bodyId: 28,
        name: 'Giant Spider',
        health: 45,
        damage: [8, 18],
        attackSpeed: 1800, // Fast attacks
        moveSpeed: 1.2, // Very fast
        aggroRange: 6,
        leashRange: 15,
        spritePrefix: 'spider',
        loot: ['spider_silk', 'venom'],
        description: 'A massive arachnid'
    },
    
    scorpion: {
        bodyId: 48,
        name: 'Giant Scorpion',
        health: 55,
        damage: [10, 20],
        attackSpeed: 2000,
        moveSpeed: 0.9,
        aggroRange: 5,
        leashRange: 12,
        spritePrefix: 'scorpion',
        loot: ['scorpion_tail', 'venom'],
        description: 'A deadly desert predator'
    },
    
    slime: {
        bodyId: 51,
        name: 'Slime',
        health: 20,
        damage: [2, 6],
        attackSpeed: 2500,
        moveSpeed: 0.3, // Very slow
        aggroRange: 3,
        leashRange: 8,
        spritePrefix: 'slime',
        loot: ['slime_goo'],
        description: 'An acidic blob'
    },
    
    lizardman: {
        bodyId: 35,
        name: 'Lizardman',
        health: 65,
        damage: [8, 18],
        attackSpeed: 2200,
        moveSpeed: 0.85,
        aggroRange: 8,
        leashRange: 18,
        spritePrefix: 'lizardman',
        loot: ['gold', 'lizard_scale'],
        description: 'A reptilian warrior'
    },
    
    ratman: {
        bodyId: 44,
        name: 'Ratman',
        health: 35,
        damage: [4, 12],
        attackSpeed: 1800,
        moveSpeed: 1.0,
        aggroRange: 6,
        leashRange: 14,
        spritePrefix: 'ratman',
        loot: ['gold', 'cheese'],
        description: 'A sneaky rodent humanoid'
    },
    
    earth_elemental: {
        bodyId: 14,
        name: 'Earth Elemental',
        health: 200,
        damage: [25, 45],
        attackSpeed: 3500, // Slow
        moveSpeed: 0.4,
        aggroRange: 6,
        leashRange: 15,
        spritePrefix: 'earth_elemental',
        loot: ['iron_ore', 'fertile_dirt'],
        description: 'A living stone construct'
    },
    
    fire_elemental: {
        bodyId: 15,
        name: 'Fire Elemental',
        health: 100,
        damage: [20, 40],
        attackSpeed: 2000,
        moveSpeed: 0.9,
        aggroRange: 8,
        leashRange: 20,
        spritePrefix: 'fire_elemental',
        loot: ['sulfurous_ash', 'fire_ruby'],
        description: 'A blazing spirit of flame'
    },
    
    water_elemental: {
        bodyId: 16,
        name: 'Water Elemental',
        health: 90,
        damage: [15, 30],
        attackSpeed: 2200,
        moveSpeed: 1.1,
        aggroRange: 7,
        leashRange: 18,
        spritePrefix: 'water_elemental',
        loot: ['water_essence', 'pearls'],
        description: 'A swirling mass of water'
    },
    
    air_elemental: {
        bodyId: 13,
        name: 'Air Elemental',
        health: 70,
        damage: [12, 25],
        attackSpeed: 1500, // Fast
        moveSpeed: 1.5, // Very fast
        aggroRange: 10,
        leashRange: 25,
        spritePrefix: 'air_elemental',
        loot: ['wind_essence'],
        description: 'An invisible whirlwind'
    },
    
    dragon: {
        bodyId: 59,
        name: 'Dragon',
        health: 500,
        damage: [40, 80],
        attackSpeed: 4000,
        moveSpeed: 0.7,
        aggroRange: 15,
        leashRange: 40,
        spritePrefix: 'dragon',
        loot: ['gold', 'dragon_scale', 'dragon_heart'],
        description: 'An ancient fire-breathing beast'
    }
};

/**
 * Get creature definition by type key
 */
export function getCreatureDefinition(typeKey) {
    return CreatureTypes[typeKey] || null;
}

/**
 * Get all creature type keys
 */
export function getCreatureTypeKeys() {
    return Object.keys(CreatureTypes);
}

/**
 * Get creatures suitable for spawning (common enemies)
 */
export function getCommonCreatures() {
    return ['orc', 'skeleton', 'zombie', 'spider', 'ratman'];
}

/**
 * Get creatures by difficulty tier
 */
export function getCreaturesByTier(tier) {
    const tiers = {
        easy: ['slime', 'ratman', 'skeleton'],
        medium: ['orc', 'zombie', 'spider', 'scorpion', 'lizardman'],
        hard: ['troll', 'ogre', 'gazer', 'orc_captain'],
        boss: ['ettin', 'lich', 'dragon', 'earth_elemental', 'fire_elemental']
    };
    return tiers[tier] || [];
}



