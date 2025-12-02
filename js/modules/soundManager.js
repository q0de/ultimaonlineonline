/**
 * Sound Manager
 * Handles audio playback with priority system
 */

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.maxSimultaneous = 8; // Maximum simultaneous sounds
        this.activeSounds = [];
        this.enabled = true;
        this.volume = 1.0;
        
        // Sound priorities (higher = more important)
        this.priorities = {
            death: 10,
            spellImpact: 8,
            weaponHit: 7,
            casting: 6,
            swing: 5,
            fizzle: 6,
            movement: 3
        };
    }

    /**
     * Load a sound file
     * @param {string} key - Sound identifier
     * @param {string} path - Path to sound file
     */
    loadSound(key, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[key] = {
                    audio: audio,
                    path: path
                };
                resolve();
            }, { once: true });
            
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${path}`);
                resolve(); // Resolve anyway to not block game
            }, { once: true });
            
            audio.load();
        });
    }

    /**
     * Load multiple sounds
     * @param {Object} soundMap - Map of key:path pairs
     */
    async loadSounds(soundMap) {
        const promises = Object.entries(soundMap).map(([key, path]) => {
            return this.loadSound(key, path);
        });
        
        return Promise.all(promises);
    }

    /**
     * Play a sound
     * @param {string} key - Sound identifier
     * @param {string} priority - Priority level
     * @param {number} volumeModifier - Volume modifier (0-1)
     */
    play(key, priority = 'normal', volumeModifier = 1.0) {
        if (!this.enabled) {
            return;
        }
        
        const sound = this.sounds[key];
        if (!sound) {
            // Sound not loaded, skip silently
            return;
        }
        
        // Check if we need to stop lower priority sounds
        if (this.activeSounds.length >= this.maxSimultaneous) {
            this.cleanupLowPrioritySounds(priority);
        }
        
        // Clone audio for simultaneous playback
        const audio = sound.audio.cloneNode();
        audio.volume = this.volume * volumeModifier;
        
        // Track active sound
        const activeSound = {
            audio: audio,
            priority: this.priorities[priority] || 5,
            key: key
        };
        
        this.activeSounds.push(activeSound);
        
        // Remove from active list when done
        audio.addEventListener('ended', () => {
            const index = this.activeSounds.indexOf(activeSound);
            if (index > -1) {
                this.activeSounds.splice(index, 1);
            }
        });
        
        // Play sound
        audio.play().catch(err => {
            // Ignore autoplay policy errors
            console.debug('Audio play prevented:', err.message);
        });
    }

    /**
     * Cleanup lower priority sounds
     * @param {string} priority - Current priority
     */
    cleanupLowPrioritySounds(priority) {
        const currentPriority = this.priorities[priority] || 5;
        
        // Sort by priority (lowest first)
        this.activeSounds.sort((a, b) => a.priority - b.priority);
        
        // Stop lowest priority sound if it's lower than current
        const lowest = this.activeSounds[0];
        if (lowest && lowest.priority < currentPriority) {
            lowest.audio.pause();
            this.activeSounds.shift();
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        this.activeSounds.forEach(sound => {
            sound.audio.pause();
            sound.audio.currentTime = 0;
        });
        this.activeSounds = [];
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable/disable sound
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    }

    /**
     * Get default sound map (with placeholder paths)
     */
    static getDefaultSoundMap() {
        return {
            // Weapon sounds
            'halberd_swing': 'assets/sounds/weapons/halberd_swing.mp3',
            'halberd_hit': 'assets/sounds/weapons/halberd_hit.mp3',
            'halberd_miss': 'assets/sounds/weapons/halberd_miss.mp3',
            
            // Spell sounds
            'lightning_cast': 'assets/sounds/spells/lightning_cast.mp3',
            'lightning_impact': 'assets/sounds/spells/lightning_impact.mp3',
            'ebolt_cast': 'assets/sounds/spells/ebolt_cast.mp3',
            'ebolt_impact': 'assets/sounds/spells/ebolt_impact.mp3',
            'explosion_cast': 'assets/sounds/spells/explosion_cast.mp3',
            'explosion_impact': 'assets/sounds/spells/explosion_impact.mp3',
            'fizzle': 'assets/sounds/spells/fizzle.mp3',
            
            // Character sounds
            'death': 'assets/sounds/character/death.mp3',
            'hit': 'assets/sounds/character/hit.mp3'
        };
    }

    /**
     * Check if sound exists and is loaded
     * @param {string} key - Sound identifier
     * @returns {boolean}
     */
    hasSound(key) {
        return !!this.sounds[key];
    }
}

