/**
 * Asset Loader
 * Handles preloading of sprites, sounds, and other assets
 */

import { AnimationLoader } from './animationLoader.js';

export class AssetLoader {
    constructor(onProgress) {
        this.assets = {
            sprites: {},
            sounds: {},
            ui: {},
            animations: {} // New: Store loaded BMP animations
        };
        this.onProgress = onProgress || (() => {});
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    /**
     * Load all game assets
     */
    async loadAll() {
        const assetManifest = this.getAssetManifest();
        this.totalAssets = Object.keys(assetManifest.sprites).length + 
                          Object.keys(assetManifest.sounds).length + 2; // +2 for new animations
        
        // Load sprites
        await this.loadSprites(assetManifest.sprites);
        
        // Load sounds (don't fail if sounds are missing)
        await this.loadSounds(assetManifest.sounds);
        
        // Load new BMP animations
        await this.loadBMPAnimations();
        
        return this.assets;
    }
    
    /**
     * Load BMP animations from exported folder structure
     */
    async loadBMPAnimations() {
        try {
            // Load character-only run animation (run_ne, run_e, etc. folders)
            console.log('📦 Loading character run animation...');
            this.assets.animations['char-run'] = await AnimationLoader.loadCharacterAnimation('run');
            this.loadedAssets++;
            this.onProgress(this.loadedAssets, this.totalAssets);
            
            // Load character-only walk animation (walk_ne, walk_e, etc. folders)
            console.log('📦 Loading character walk animation...');
            this.assets.animations['char-walk'] = await AnimationLoader.loadCharacterAnimation('walk');
            this.loadedAssets++;
            this.onProgress(this.loadedAssets, this.totalAssets);
            
            // Load character-only attack bash 2h animation (attack-bash-2h-char/northeast/frame0.bmp)
            console.log('📦 Loading character attack bash 2h animation...');
            this.assets.animations['char-attack-bash-2h'] = await AnimationLoader.loadAnimation('attack-bash-2h-char');
            this.loadedAssets++;
            this.onProgress(this.loadedAssets, this.totalAssets);
            
            // Load weapon-only running animation (running-halberd/northeast/frame0.bmp etc.)
            console.log('📦 Loading running-halberd weapon animation...');
            this.assets.animations['weapon-running-halberd'] = await AnimationLoader.loadAnimation('running-halberd');
            this.loadedAssets++;
            this.onProgress(this.loadedAssets, this.totalAssets);
            
            // Load weapon-only attack animation (attack-bash-2h-halberd/northeast/frame0.bmp etc.)
            console.log('📦 Loading attack-bash-2h-halberd weapon animation...');
            this.assets.animations['weapon-attack-bash-2h-halberd'] = await AnimationLoader.loadAnimation('attack-bash-2h-halberd');
            this.loadedAssets++;
            this.onProgress(this.loadedAssets, this.totalAssets);
            
            console.log('✅ BMP animations loaded successfully!');
        } catch (e) {
            console.warn('⚠️ Could not load BMP animations:', e.message);
            console.warn('   Make sure animations are exported to assets/sprites/animations/');
        }
    }

    /**
     * Get asset manifest (list of all assets to load)
     */
    getAssetManifest() {
        return {
            sprites: {
                // Character sprites (testing exported UO frame)
                'char_p1_idle': 'assets/sprites/characters/test/male_idle.png',
                'char_p2_idle': 'assets/sprites/characters/test/male_idle_p2.png',
                // Directional idle animations (static)
                'char_idle_north_sheet': 'assets/sprites/characters/test/male_idle_north_sheet.png',
                'char_idle_northeast_sheet': 'assets/sprites/characters/test/male_idle_northeast_sheet.png',
                'char_idle_east_sheet': 'assets/sprites/characters/test/male_idle_east_sheet.png',
                'char_idle_southeast_sheet': 'assets/sprites/characters/test/male_idle_southeast_sheet.png',
                'char_idle_south_sheet': 'assets/sprites/characters/test/male_idle_south_sheet.png',
                'char_idle_southwest_sheet': 'assets/sprites/characters/test/male_idle_southwest_sheet.png',
                'char_idle_west_sheet': 'assets/sprites/characters/test/male_idle_west_sheet.png',
                'char_idle_northwest_sheet': 'assets/sprites/characters/test/male_idle_northwest_sheet.png',
                'char_idle_sheet': 'assets/sprites/characters/test/male_idle_sheet.png', // Fallback
                // Directional idle 2 animations (animated idle - breathing/shifting)
                'char_idle2_north_sheet': 'assets/sprites/characters/test/male_idle2_north_sheet.png',
                'char_idle2_northeast_sheet': 'assets/sprites/characters/test/male_idle2_northeast_sheet.png',
                'char_idle2_east_sheet': 'assets/sprites/characters/test/male_idle2_east_sheet.png',
                'char_idle2_southeast_sheet': 'assets/sprites/characters/test/male_idle2_southeast_sheet.png',
                'char_idle2_south_sheet': 'assets/sprites/characters/test/male_idle2_south_sheet.png',
                'char_idle2_southwest_sheet': 'assets/sprites/characters/test/male_idle2_southwest_sheet.png',
                'char_idle2_west_sheet': 'assets/sprites/characters/test/male_idle2_west_sheet.png',
                'char_idle2_northwest_sheet': 'assets/sprites/characters/test/male_idle2_northwest_sheet.png',
                // Directional running animations
                'char_run_north_sheet': 'assets/sprites/characters/test/male_run_north_sheet.png',
                'char_run_northeast_sheet': 'assets/sprites/characters/test/male_run_northeast_sheet.png',
                'char_run_east_sheet': 'assets/sprites/characters/test/male_run_east_sheet.png',
                'char_run_southeast_sheet': 'assets/sprites/characters/test/male_run_southeast_sheet.png',
                'char_run_south_sheet': 'assets/sprites/characters/test/male_run_south_sheet.png',
                'char_run_southwest_sheet': 'assets/sprites/characters/test/male_run_southwest_sheet.png',
                'char_run_west_sheet': 'assets/sprites/characters/test/male_run_west_sheet.png',
                'char_run_northwest_sheet': 'assets/sprites/characters/test/male_run_northwest_sheet.png',
                'char_run_sheet': 'assets/sprites/characters/test/male_run_sheet.png', // Fallback
                // Directional attack animations (2-handed/halberd)
                'char_attack_2h_north_sheet': 'assets/sprites/characters/test/male_attack_2h_north_sheet.png',
                'char_attack_2h_northeast_sheet': 'assets/sprites/characters/test/male_attack_2h_northeast_sheet.png',
                'char_attack_2h_east_sheet': 'assets/sprites/characters/test/male_attack_2h_east_sheet.png',
                'char_attack_2h_southeast_sheet': 'assets/sprites/characters/test/male_attack_2h_southeast_sheet.png',
                'char_attack_2h_south_sheet': 'assets/sprites/characters/test/male_attack_2h_south_sheet.png',
                'char_attack_2h_southwest_sheet': 'assets/sprites/characters/test/male_attack_2h_southwest_sheet.png',
                'char_attack_2h_west_sheet': 'assets/sprites/characters/test/male_attack_2h_west_sheet.png',
                'char_attack_2h_northwest_sheet': 'assets/sprites/characters/test/male_attack_2h_northwest_sheet.png',
                'char_attack_2h_sheet': 'assets/sprites/characters/test/male_attack_2h_sheet.png', // Fallback
                'char_cast_sheet': 'assets/sprites/characters/test/male_cast_sheet.png',
                'char_hit_sheet': 'assets/sprites/characters/test/male_hit_sheet.png',
                'char_death_sheet': 'assets/sprites/characters/test/male_death_sheet.png',
                'char_walk_sheet': 'assets/sprites/characters/test/male_walk_sheet.png',
                // Directional walking animations
                'char_walk_north_sheet': 'assets/sprites/characters/test/male_walk_north_sheet.png',
                'char_walk_northeast_sheet': 'assets/sprites/characters/test/male_walk_northeast_sheet.png',
                'char_walk_east_sheet': 'assets/sprites/characters/test/male_walk_east_sheet.png',
                'char_walk_southeast_sheet': 'assets/sprites/characters/test/male_walk_southeast_sheet.png',
                'char_walk_south_sheet': 'assets/sprites/characters/test/male_walk_south_sheet.png',
                'char_walk_southwest_sheet': 'assets/sprites/characters/test/male_walk_southwest_sheet.png',
                'char_walk_west_sheet': 'assets/sprites/characters/test/male_walk_west_sheet.png',
                'char_walk_northwest_sheet': 'assets/sprites/characters/test/male_walk_northwest_sheet.png',
                
                // Weapon sprites
                'weapon_halberd': 'assets/sprites/weapons/halberd.png',
                // Directional halberd weapon animations (for attack animations)
                'halberd_weapon_north_sheet': 'assets/sprites/weapons/halberd_north_sheet.png',
                'halberd_weapon_northeast_sheet': 'assets/sprites/weapons/halberd_northeast_sheet.png',
                'halberd_weapon_east_sheet': 'assets/sprites/weapons/halberd_east_sheet.png',
                'halberd_weapon_southeast_sheet': 'assets/sprites/weapons/halberd_southeast_sheet.png',
                'halberd_weapon_south_sheet': 'assets/sprites/weapons/halberd_south_sheet.png',
                'halberd_weapon_southwest_sheet': 'assets/sprites/weapons/halberd_southwest_sheet.png',
                'halberd_weapon_west_sheet': 'assets/sprites/weapons/halberd_west_sheet.png',
                'halberd_weapon_northwest_sheet': 'assets/sprites/weapons/halberd_northwest_sheet.png',
                // Directional halberd weapon WALK animations (10 frames - weapon bobs with movement)
                'halberd_walk_north_sheet': 'assets/sprites/weapons/halberd_walk_north_sheet.png',
                'halberd_walk_northeast_sheet': 'assets/sprites/weapons/halberd_walk_northeast_sheet.png',
                'halberd_walk_east_sheet': 'assets/sprites/weapons/halberd_walk_east_sheet.png',
                'halberd_walk_southeast_sheet': 'assets/sprites/weapons/halberd_walk_southeast_sheet.png',
                'halberd_walk_south_sheet': 'assets/sprites/weapons/halberd_walk_south_sheet.png',
                'halberd_walk_southwest_sheet': 'assets/sprites/weapons/halberd_walk_southwest_sheet.png',
                'halberd_walk_west_sheet': 'assets/sprites/weapons/halberd_walk_west_sheet.png',
                'halberd_walk_northwest_sheet': 'assets/sprites/weapons/halberd_walk_northwest_sheet.png',
                // Directional halberd weapon idle animations (static)
                'halberd_idle_north_sheet': 'assets/sprites/weapons/halberd_idle_north_sheet.png',
                'halberd_idle_northeast_sheet': 'assets/sprites/weapons/halberd_idle_northeast_sheet.png',
                'halberd_idle_east_sheet': 'assets/sprites/weapons/halberd_idle_east_sheet.png',
                'halberd_idle_southeast_sheet': 'assets/sprites/weapons/halberd_idle_southeast_sheet.png',
                'halberd_idle_south_sheet': 'assets/sprites/weapons/halberd_idle_south_sheet.png',
                'halberd_idle_southwest_sheet': 'assets/sprites/weapons/halberd_idle_southwest_sheet.png',
                'halberd_idle_west_sheet': 'assets/sprites/weapons/halberd_idle_west_sheet.png',
                'halberd_idle_northwest_sheet': 'assets/sprites/weapons/halberd_idle_northwest_sheet.png',
                // Directional halberd weapon idle 2 animations (animated idle - breathing/shifting)
                'halberd_idle2_north_sheet': 'assets/sprites/weapons/halberd_idle2_north_sheet.png',
                'halberd_idle2_northeast_sheet': 'assets/sprites/weapons/halberd_idle2_northeast_sheet.png',
                'halberd_idle2_east_sheet': 'assets/sprites/weapons/halberd_idle2_east_sheet.png',
                'halberd_idle2_southeast_sheet': 'assets/sprites/weapons/halberd_idle2_southeast_sheet.png',
                'halberd_idle2_south_sheet': 'assets/sprites/weapons/halberd_idle2_south_sheet.png',
                'halberd_idle2_southwest_sheet': 'assets/sprites/weapons/halberd_idle2_southwest_sheet.png',
                'halberd_idle2_west_sheet': 'assets/sprites/weapons/halberd_idle2_west_sheet.png',
                'halberd_idle2_northwest_sheet': 'assets/sprites/weapons/halberd_idle2_northwest_sheet.png',
                
                // Spell effect sprites
                'spell_lightning': 'assets/sprites/effects/lightning.png',
                'spell_ebolt': 'assets/sprites/effects/ebolt.png',
                'spell_explosion': 'assets/sprites/effects/explosion.png',
                'spell_fizzle': 'assets/sprites/effects/fizzle.png',
                
                // UI sprites
                'ui_health_bar': 'assets/ui/healthbar.png',
                'ui_mana_bar': 'assets/ui/manabar.png',
                
                // Arena tiles
                'tile_grass': 'assets/tiles/grass.png'
            },
            sounds: {
                'halberd_swing': 'assets/sounds/weapons/halberd_swing.mp3',
                'halberd_hit': 'assets/sounds/weapons/halberd_hit.mp3',
                'lightning_cast': 'assets/sounds/spells/lightning_cast.mp3',
                'lightning_impact': 'assets/sounds/spells/lightning_impact.mp3',
                'ebolt_cast': 'assets/sounds/spells/ebolt_cast.mp3',
                'ebolt_impact': 'assets/sounds/spells/ebolt_impact.mp3',
                'explosion_cast': 'assets/sounds/spells/explosion_cast.mp3',
                'explosion_impact': 'assets/sounds/spells/explosion_impact.mp3',
                'fizzle': 'assets/sounds/spells/fizzle.mp3',
                'death': 'assets/sounds/character/death.mp3'
            }
        };
    }

    /**
     * Load sprite images
     * @param {Object} spriteMap - Map of key:path pairs
     */
    async loadSprites(spriteMap) {
        const promises = Object.entries(spriteMap).map(([key, path]) => {
            return this.loadImage(key, path).then(img => {
                // Log successful loads for walking animations
                if (key.includes('walk')) {
                    console.log(`✅ Loaded: ${key} -> ${path} (${img.naturalWidth}x${img.naturalHeight})`);
                }
                return img;
            }).catch(err => {
                // Log failures for walking animations
                if (key.includes('walk')) {
                    console.error(`❌ Failed to load: ${key} -> ${path}`, err);
                }
                throw err;
            });
        });
        
        return Promise.allSettled(promises);
    }

    /**
     * Load a single image
     * @param {string} key - Asset key
     * @param {string} path - Asset path
     */
    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Add cache-busting for attack animation to force reload
            const cacheBuster = key === 'char_attack_2h_sheet' ? `?v=${Date.now()}` : '';
            const fullPath = path + cacheBuster;
            
            img.onload = () => {
                this.assets.sprites[key] = img;
                this.loadedAssets++;
                this.updateProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                // Create placeholder image for missing assets
                // Always log failures for walking animations
                if (key.includes('walk')) {
                    console.error(`❌ Failed to load walking sprite: ${key} -> ${path}`);
                } else {
                    console.warn(`Failed to load sprite: ${path}, using placeholder`);
                }
                const placeholder = this.createPlaceholder(64, 64);
                this.assets.sprites[key] = placeholder;
                this.loadedAssets++;
                this.updateProgress();
                resolve(placeholder);
            };
            
            // Set src AFTER setting up handlers (prevents double-load)
            img.src = fullPath;
        });
    }

    /**
     * Load sound files
     * @param {Object} soundMap - Map of key:path pairs
     */
    async loadSounds(soundMap) {
        const promises = Object.entries(soundMap).map(([key, path]) => {
            return this.loadSound(key, path);
        });
        
        return Promise.allSettled(promises);
    }

    /**
     * Load a single sound
     * @param {string} key - Asset key
     * @param {string} path - Asset path
     */
    loadSound(key, path) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                this.assets.sounds[key] = audio;
                this.loadedAssets++;
                this.updateProgress();
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', () => {
                // Don't fail on missing sounds
                console.warn(`Failed to load sound: ${path}`);
                this.loadedAssets++;
                this.updateProgress();
                resolve(null);
            }, { once: true });
            
            audio.src = path;
            audio.load();
        });
    }

    /**
     * Update loading progress
     */
    updateProgress() {
        const percent = (this.loadedAssets / this.totalAssets) * 100;
        const text = `Loading assets... ${Math.floor(percent)}% (${this.loadedAssets}/${this.totalAssets})`;
        this.onProgress(percent, text);
    }

    /**
     * Create placeholder image for missing assets
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    createPlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple placeholder
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        // Draw X
        ctx.strokeStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        
        // Convert to image
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * Get loaded asset
     * @param {string} type - Asset type (sprites, sounds)
     * @param {string} key - Asset key
     */
    getAsset(type, key) {
        return this.assets[type]?.[key] || null;
    }

    /**
     * Check if asset exists
     * @param {string} type - Asset type
     * @param {string} key - Asset key
     */
    hasAsset(type, key) {
        return !!this.assets[type]?.[key];
    }
}

