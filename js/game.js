/**
 * Main Game Controller
 * Ultima Online Pre-AOS PvP Simulator
 */

import { Character } from './modules/character.js?v=20251123014';
import { CombatMechanics, Spells } from './modules/combatMechanics.js?v=20251123014';
import { InputHandler } from './modules/inputHandler.js?v=20251123014';
import { SoundManager } from './modules/soundManager.js?v=20251123014';
import { UIManager } from './modules/ui.js?v=20251123014';
import { AssetLoader } from './modules/assetLoader.js?v=20251123014';
import { Renderer } from './modules/renderer.js?v=20251123014';
import { Projectile } from './modules/projectile.js?v=20251123014';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.assets = null;
        this.renderer = null;
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager();
        this.inputHandler = null;
        
        // Game state
        this.player1 = null;
        this.player2 = null;
        this.projectiles = [];
        this.effects = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        
        // Timing
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize game
     */
    /**
     * Test function to check if animations are loaded
     * Call from browser console: game.testAnimations()
     */
    testAnimations() {
        console.log('='.repeat(60));
        console.log('ANIMATION TEST');
        console.log('='.repeat(60));
        
        const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        let loaded = 0;
        let missing = 0;
        
        directions.forEach(dir => {
            const key = `char_walk_${dir}_sheet`;
            const sprite = this.assetLoader.assets.sprites[key];
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                console.log(`✅ ${key}: ${sprite.naturalWidth}x${sprite.naturalHeight}px`);
                loaded++;
            } else {
                console.warn(`❌ ${key}: MISSING`);
                missing++;
            }
        });
        
        console.log('='.repeat(60));
        console.log(`Summary: ${loaded}/${directions.length} walking animations loaded`);
        console.log('='.repeat(60));
        
        // Also check other animations
        const otherAnims = ['char_attack_2h_sheet', 'char_idle', 'char_cast_sheet', 'char_hit_sheet', 'char_death_sheet'];
        console.log('\nOther animations:');
        otherAnims.forEach(key => {
            const sprite = this.assetLoader.assets.sprites[key];
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                console.log(`✅ ${key}: ${sprite.naturalWidth}x${sprite.naturalHeight}px`);
            } else {
                console.warn(`❌ ${key}: MISSING`);
            }
        });
        
        return { loaded, missing, total: directions.length };
    }

    async init() {
        // Show loading screen
        this.uiManager.showLoading();
        
        // Load assets
        const assetLoader = new AssetLoader((percent, text) => {
            this.uiManager.updateLoadingProgress(percent, text);
        });
        
        try {
            this.assets = await assetLoader.loadAll();
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
        }
        
        // Initialize renderer
        this.renderer = new Renderer(this.canvas, this.assets);
        
        // Load sounds
        await this.soundManager.loadSounds(SoundManager.getDefaultSoundMap());
        
        // Initialize characters
        this.initializeCharacters();
        
        // Setup input handling
        this.inputHandler = new InputHandler(this);
        
        // Setup click-to-move
        this.setupClickToMove();
        
        // Hide loading screen
        this.uiManager.hideLoading();
        this.uiManager.showGame();
        
        // Start game loop
        this.gameStarted = true;
        this.startGameLoop();
        
        // Add initial log message
        this.uiManager.addLog('Game started! First to 0 HP loses.', 'normal');
        this.uiManager.addLog('Press SPACEBAR for WAR MODE, then click opponent to target!', 'fizzle');
        this.uiManager.addLog('Scroll mouse UP to attack! (or press A)', 'normal');
        
        // Focus canvas to receive keyboard input (especially Tab for war mode)
        this.canvas.focus();
    }

    /**
     * Initialize characters
     */
    initializeCharacters() {
        this.player1 = new Character(1, 'Player 1', 200, 300);
        this.player2 = new Character(2, 'Player 2', 600, 300);
        
        // Face each other
        this.player1.combatState.facing = 'east';
        this.player2.combatState.facing = 'west';
    }

    /**
     * Start game loop
     */
    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        if (!this.gameStarted || this.paused) {
            return;
        }
        
        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update game state
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Update UI
        this.updateUI();
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (this.gameOver) {
            return;
        }
        
        // Update characters
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        
        // Check for auto-swing in war mode (EVERY FRAME!)
        this.updateAutoSwing(this.player1, this.player2);
        this.updateAutoSwing(this.player2, this.player1);
        
        // Check for completed casts
        this.checkCompletedCasts();
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
    }

    /**
     * Update auto-swing mechanics (UO-style halberd auto-attack)
     * @param {Character} attacker - Character with war mode active
     * @param {Character} target - Potential target
     */
    updateAutoSwing(attacker, target) {
        // Only auto-swing if:
        // 1. War mode is active
        // 2. Has a target
        // 3. Target is alive
        // 4. Weapon is equipped
        // 5. Can swing (cooldown complete)
        // 6. NOT currently attacking (prevents double swing)
        // 7. In range
        
        // Initialize debug tracking
        if (!this._lastAutoSwingDebug) this._lastAutoSwingDebug = {};
        if (!this._autoSwingCheckCount) this._autoSwingCheckCount = 0;
        this._autoSwingCheckCount++;
        
        // Minimal logging - only log when state changes
        // Too much logging can cause performance issues!
        const debugKey = `${attacker.id}`;
        
        if (!attacker.combatState.warMode) {
            if (this._lastAutoSwingDebug[debugKey] !== 'warMode') {
                console.log('⚔️ Auto-swing blocked: War mode OFF');
                this._lastAutoSwingDebug[debugKey] = 'warMode';
            }
            return;
        }
        
        if (!attacker.combatState.target) {
            if (this._lastAutoSwingDebug[debugKey] !== 'noTarget') {
                console.log('⚔️ Auto-swing blocked: No target');
                this._lastAutoSwingDebug[debugKey] = 'noTarget';
            }
            return;
        }
        
        if (!attacker.equipment.weaponEquipped) {
            if (this._lastAutoSwingDebug[debugKey] !== 'noWeapon') {
                console.log('⚔️ Auto-swing blocked: Weapon not equipped');
                this._lastAutoSwingDebug[debugKey] = 'noWeapon';
            }
            return;
        }
        
        if (!attacker.combatState.canSwing) {
            const remaining = attacker.getSwingCooldownRemaining();
            if (this._lastAutoSwingDebug[debugKey] !== 'cooldown') {
                console.log(`⏱️ Auto-swing blocked: Cooldown (${remaining.toFixed(1)}s remaining)`);
                this._lastAutoSwingDebug[debugKey] = 'cooldown';
            }
            return;
        }
        
        // Log when we FIRST become ready to swing (transition from cooldown to ready)
        if (this._lastAutoSwingDebug[debugKey] === 'cooldown') {
            console.log(`🎯 [${Date.now()}] COOLDOWN COMPLETE - Now checking range and attack state...`);
        }
        
        if (attacker.combatState.isAttacking) {
            const currentTime = Date.now();
            const elapsedSinceLastSwing = currentTime - attacker.combatState.lastSwingTime;
            if (this._lastAutoSwingDebug[debugKey] !== 'attacking') {
                console.log(`⚔️ Auto-swing blocked: Already attacking (elapsed since last swing: ${elapsedSinceLastSwing}ms)`);
                this._lastAutoSwingDebug[debugKey] = 'attacking';
            }
            return;
        }
        
        // Check if target is in range
        const distance = this.calculateDistance(attacker, target);
        const weaponRange = attacker.equipment.weapon.range * 44; // tiles to pixels
        
        if (distance > weaponRange) {
            // Only log once when going out of range
            if (this._lastAutoSwingDebug[debugKey] !== 'range') {
                console.log(`📏 Auto-swing blocked: Out of range (${distance.toFixed(0)}px > ${weaponRange}px)`);
                this._lastAutoSwingDebug[debugKey] = 'range';
            }
            return;
        }
        
        // Log when we transition from out-of-range to in-range
        if (this._lastAutoSwingDebug[debugKey] === 'range' || this._lastAutoSwingDebug[debugKey] === 'cooldown') {
            console.log(`🎯 [${Date.now()}] IN RANGE! Distance: ${distance.toFixed(0)}px <= ${weaponRange}px - Checking attack state...`);
        }
        
        // ALL CONDITIONS MET - AUTO-SWING IMMEDIATELY!
        console.log(`✅✅✅ [${Date.now()}] AUTO-SWING TRIGGERED! ✅✅✅`);
        this._lastAutoSwingDebug[debugKey] = 'swinging';
        this.handleWeaponSwing(attacker);
    }

    /**
     * Check for completed spell casts
     */
    checkCompletedCasts() {
        // Check player 1
        if (this.player1.combatState.casting) {
            const elapsed = Date.now() - this.player1.combatState.castStartTime;
            if (elapsed >= this.player1.combatState.castDuration) {
                this.completeCast(this.player1, this.player2);
            }
        }
        
        // Check player 2
        if (this.player2.combatState.casting) {
            const elapsed = Date.now() - this.player2.combatState.castStartTime;
            if (elapsed >= this.player2.combatState.castDuration) {
                this.completeCast(this.player2, this.player1);
            }
        }
    }

    /**
     * Complete spell cast
     * @param {Character} caster - Casting character
     * @param {Character} target - Target character
     */
    completeCast(caster, target) {
        const spell = caster.combatState.currentSpell;
        if (!spell) return;
        
        // Reset casting state
        caster.combatState.casting = false;
        caster.combatState.currentAnimation = 'idle';
        
        // Create projectile
        const casterPos = this.renderer.getCharacterPosition(caster.id, this);
        const projectile = new Projectile(
            spell,
            caster,
            target,
            casterPos.x,
            casterPos.y - 32
        );
        
        this.projectiles.push(projectile);
        
        // Log spell cast
        this.uiManager.addLog(`${caster.name} cast ${spell.name}!`, 'cast');
        
        // Play spell sound
        this.soundManager.play(`${spell.key}_cast`, 'casting');
    }

    /**
     * Update projectiles
     * @param {number} deltaTime - Time since last frame
     */
    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
            
            // Check if projectile hit
            if (projectile.hasHit && !projectile.processed) {
                projectile.processed = true;
                this.handleProjectileHit(projectile);
            }
        });
        
        // Remove completed projectiles
        this.projectiles = this.projectiles.filter(p => !p.isComplete);
    }

    /**
     * Handle projectile hit
     * @param {Projectile} projectile - Projectile that hit
     */
    handleProjectileHit(projectile) {
        const target = projectile.target;
        const caster = projectile.caster;
        
        // Calculate spell damage
        const damage = CombatMechanics.calculateSpellDamage(caster, projectile.spell, target);
        
        // Apply damage
        const died = target.takeDamage(damage, 'spell');
        
        // Log damage
        this.uiManager.addLog(
            `${projectile.spell.name} hit ${target.name} for ${damage} damage!`,
            'damage'
        );
        
        // Play impact sound
        this.soundManager.play(`${projectile.spell.key}_impact`, 'spellImpact');
        
        // Check for death
        if (died) {
            this.handleCharacterDeath(target);
        }
    }

    /**
     * Update effects
     * @param {number} deltaTime - Time since last frame
     */
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.lifetime -= deltaTime;
            return effect.lifetime > 0;
        });
    }

    /**
     * Render game
     */
    render() {
        const gameState = {
            player1: this.player1,
            player2: this.player2,
            projectiles: this.projectiles,
            effects: this.effects
        };
        
        this.renderer.render(gameState);
    }

    /**
     * Update UI
     */
    updateUI() {
        this.uiManager.updateCharacter(this.player1, 1);
        this.uiManager.updateCharacter(this.player2, 2);
    }

    /**
     * Handle weapon toggle
     * @param {Character} character - Character toggling weapon
     */
    handleWeaponToggle(character) {
        const equipped = character.toggleWeapon();
        
        const action = equipped ? 'equipped' : 'unequipped';
        this.uiManager.addLog(`${character.name} ${action} weapon.`, 'normal');
        
        // If was casting, log fizzle
        if (!equipped && character.combatState.casting) {
            this.uiManager.addLog(`${character.name}'s spell fizzled!`, 'fizzle');
            this.soundManager.play('fizzle', 'fizzle');
        }
    }

    /**
     * Handle war mode toggle (UO-style attack mode)
     * @param {Character} character - Character toggling war mode
     */
    handleWarModeToggle(character) {
        character.combatState.warMode = !character.combatState.warMode;
        
        const mode = character.combatState.warMode ? 'WAR MODE' : 'peace mode';
        this.uiManager.addLog(`${character.name} entered ${mode}.`, character.combatState.warMode ? 'damage' : 'normal');
        
        // Clear target when exiting war mode
        if (!character.combatState.warMode) {
            character.combatState.target = null;
        }
        
        console.log(`${character.name} war mode: ${character.combatState.warMode ? 'ON' : 'OFF'}`);
        
        // Cooldown continues running even when exiting war mode
        if (!character.combatState.canSwing) {
            const remaining = character.getSwingCooldownRemaining();
            console.log(`   ⏱️ Cooldown still active: ${remaining.toFixed(1)}s remaining`);
        }
    }

    /**
     * Handle weapon swing
     * @param {Character} attacker - Attacking character
     */
    handleWeaponSwing(attacker) {
        const defender = attacker === this.player1 ? this.player2 : this.player1;
        
        // Pre-AOS UO: Allow swings at ANY distance - no range restriction on initiating swing
        // The swing will automatically miss if target is out of range WHEN HIT RESOLVES
        const swingStarted = attacker.swing();
        if (!swingStarted) {
            return; // Only blocked by: no weapon, cooldown, or insufficient stamina
        }
        
        // Play swing sound (always plays, regardless of range)
        this.soundManager.play('halberd_swing', 'swing');
        
        // Log swing start (we don't know if it will hit yet - opponent might move)
        const initialDistance = this.calculateDistance(attacker, defender);
        const weaponRange = attacker.equipment.weapon.range * 44; // Convert tiles to pixels (1 tile = 44px)
        
        if (initialDistance > weaponRange) {
            this.uiManager.addLog(
                `${attacker.name} swings at ${defender.name} (out of range - ${Math.round(initialDistance)}px > ${weaponRange}px)...`, 
                'miss'
            );
        } else {
            const distanceTiles = (initialDistance / 44).toFixed(1);
            this.uiManager.addLog(
                `${attacker.name} swings at ${defender.name} (${distanceTiles} tiles away)...`, 
                'normal'
            );
        }
        
        // Delay hit check until swing animation completes
        // IMPORTANT: Check distance WHEN HIT RESOLVES, not when swing starts
        // This allows opponent to move during swing animation (UO behavior)
        setTimeout(() => {
            // Re-calculate distance at moment of impact (opponent may have moved!)
            const impactDistance = this.calculateDistance(attacker, defender);
            const impactWeaponRange = attacker.equipment.weapon.range * 44;
            
            // Pre-AOS UO: If opponent moved out of range during swing, automatic miss
            if (impactDistance > impactWeaponRange) {
                // Opponent moved out of range during swing - automatic miss
                this.uiManager.addLog(
                    `${attacker.name} missed! (${defender.name} moved out of range - ${Math.round(impactDistance)}px > ${impactWeaponRange}px)`, 
                    'miss'
                );
                this.soundManager.play('halberd_miss', 'swing');
                return;
            }
            
            // Opponent is still in range - calculate hit chance (never 100%, clamped 15-85%)
            // Pre-AOS UO: Even when close, there's always a chance to miss (never guaranteed hit)
            const hitChance = CombatMechanics.calculateHitChance(attacker, defender, impactDistance, impactWeaponRange);
            
            // Verify hit chance is never 100% (should be clamped to max 85%)
            if (hitChance >= 100) {
                console.warn('ERROR: Hit chance is 100%! This should never happen in pre-AOS UO.');
            }
            
            // Roll for hit/miss (even at 85% hit chance, there's 15% miss chance)
            const hit = CombatMechanics.rollHit(hitChance);
            
            const impactDistanceTiles = (impactDistance / 44).toFixed(1);
            
            if (hit) {
                // Hit! (opponent was in range and hit chance roll succeeded)
                // Note: Even with high hit chance, this can still miss (never 100% guaranteed)
                const damage = CombatMechanics.calculateWeaponDamage(attacker, attacker.equipment.weapon);
                const died = defender.takeDamage(damage, 'melee');
                
                this.uiManager.addLog(
                    `${attacker.name} hit ${defender.name} for ${damage} damage! (${hitChance.toFixed(1)}% hit chance, ${impactDistanceTiles} tiles)`,
                    'damage'
                );
                
                this.soundManager.play('halberd_hit', 'weaponHit');
                
                if (died) {
                    this.handleCharacterDeath(defender);
                }
            } else {
                // Miss (opponent was in range but hit chance roll failed)
                // Pre-AOS UO: Even when close, misses can happen (never 100% hit chance)
                this.uiManager.addLog(
                    `${attacker.name} missed! (${hitChance.toFixed(1)}% hit chance, ${impactDistanceTiles} tiles - ${(100 - hitChance).toFixed(1)}% miss chance)`, 
                    'miss'
                );
                this.soundManager.play('halberd_miss', 'swing');
            }
        }, 300);
    }
    
    /**
     * Calculate distance between two objects with x, y properties
     * @param {Object} obj1 - First object with x, y
     * @param {Object} obj2 - Second object with x, y
     * @returns {number} Distance in pixels
     */
    calculateDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Setup click-to-move functionality
     */
    setupClickToMove() {
        // UO-style mouse controls:
        // - Right mouse button HOLD + DRAG: Move toward cursor continuously (distance = speed)
        // - Right mouse button CLICK: Move one tile toward cursor
        // - Double right-click: Pathfinding to location
        // - Left mouse button while holding right: Auto-run (lock movement)
        
        let rightMouseDown = false;
        let autoRunActive = false;
        let rightMouseDownTime = 0;
        let rightMouseDownX = 0;
        let rightMouseDownY = 0;
        let lastRightClickTime = 0;
        let rightClickTimeout = null;
        
        const canvas = this.renderer.canvas;
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Always refocus canvas when clicked (keeps Tab key working)
        canvas.addEventListener('mousedown', () => {
            canvas.focus();
        });
        
        // Right mouse button down
        canvas.addEventListener('mousedown', (e) => {
            if (this.gameOver || this.paused) {
                return;
            }
            
            if (e.button === 2) {
                rightMouseDown = true;
                rightMouseDownTime = Date.now();
                
                const rect = canvas.getBoundingClientRect();
                rightMouseDownX = e.clientX - rect.left;
                rightMouseDownY = e.clientY - rect.top;
                
                // Check for double-click
                const now = Date.now();
                if (now - lastRightClickTime < 300) {
                    // Double right-click - pathfinding
                    if (rightClickTimeout) {
                        clearTimeout(rightClickTimeout);
                        rightClickTimeout = null;
                    }
                    this.handleCharacterClick(this.player1, rightMouseDownX, rightMouseDownY);
                    lastRightClickTime = 0;
                    return;
                }
                lastRightClickTime = now;
            }
            
            // Left mouse button while holding right - activate auto-run
            if (e.button === 0 && rightMouseDown) {
                autoRunActive = true;
            }
            
            // Left mouse button click - target opponent in war mode
            if (e.button === 0 && !rightMouseDown) {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                if (this.player1.combatState.warMode) {
                    this.handleTargetClick(this.player1, this.player2, clickX, clickY);
                }
            }
        });
        
        // Right mouse button up
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                const wasQuickClick = (Date.now() - rightMouseDownTime) < 200 && !autoRunActive;
                rightMouseDown = false;
                
                if (!autoRunActive) {
                    // Stop movement unless it was a quick click
                    if (!wasQuickClick) {
                        this.player1.combatState.isMoving = false;
                        this.player1.targetX = undefined;
                        this.player1.targetY = undefined;
                    } else {
                        // Quick click - move one tile
                        const rect = canvas.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const clickY = e.clientY - rect.top;
                        this.handleRightMouseClick(this.player1, clickX, clickY);
                    }
                }
            }
            
            // Left mouse button up - disable auto-run
            if (e.button === 0) {
                autoRunActive = false;
            }
        });
        
        // Mouse move while right button held - update movement direction
        canvas.addEventListener('mousemove', (e) => {
            if (this.gameOver || this.paused) {
                return;
            }
            
            if (rightMouseDown || autoRunActive) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                this.handleRightMouseMove(this.player1, mouseX, mouseY);
            }
        });
        
        // Mouse wheel scroll - scroll UP to enter WAR MODE and target
        canvas.addEventListener('wheel', (e) => {
            if (this.gameOver || this.paused) {
                return;
            }
            
            // Scroll UP (deltaY negative) = enter war mode + target opponent
            if (e.deltaY < 0) {
                e.preventDefault();
                
                // Enter war mode if not already in it
                if (!this.player1.combatState.warMode) {
                    this.handleWarModeToggle(this.player1);
                }
                
                // Auto-target opponent if not already targeted
                if (!this.player1.combatState.target && this.player2 && this.player2.combatState.alive) {
                    this.player1.combatState.target = this.player2;
                    this.uiManager.addLog(`${this.player1.name} targets ${this.player2.name}!`, 'damage');
                    console.log('🎯 Scroll UP: War mode ON + Target locked → Move close to auto-swing!');
                }
            }
        }, { passive: false }); // passive: false allows preventDefault
    }
    
    /**
     * Handle right mouse button movement (UO-style hold and drag)
     * Character moves toward cursor, speed based on distance
     */
    handleRightMouseMove(character, mouseX, mouseY) {
        const TILE_SIZE = 44;
        const MIN_MOVE_DISTANCE = 5; // Minimum distance to actually move
        const RUN_THRESHOLD = TILE_SIZE * 2; // 2 tiles = run, closer = walk
        const MIN_STAMINA_TO_RUN = 10; // Minimum stamina percentage required to run (10%)
        
        // Calculate distance from character to cursor
        const dx = mouseX - character.x;
        const dy = mouseY - character.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only move if cursor is far enough away AND not attacking
        if (distance > MIN_MOVE_DISTANCE && !character.combatState.isAttacking) {
            // Set target to cursor position (character follows cursor)
            character.targetX = mouseX;
            character.targetY = mouseY;
            character.combatState.isMoving = true;
            
            // UO behavior: distance determines speed, but stamina limits running
            // Check if character has enough stamina to run
            const staminaPercent = (character.resources.stamina / character.resources.maxStamina) * 100;
            const canRun = staminaPercent >= MIN_STAMINA_TO_RUN;
            
            // Close to character (< 2 tiles) = walk, far (>= 2 tiles) = run (if stamina allows)
            if (distance >= RUN_THRESHOLD && canRun) {
                character.combatState.isRunning = true;
                character.combatState.currentAnimation = 'run';
            } else {
                // Force walking if not enough stamina or cursor is close
                character.combatState.isRunning = false;
                character.combatState.currentAnimation = 'walk';
            }
        } else {
            // Cursor is too close - stop movement
            character.combatState.isMoving = false;
            character.combatState.isRunning = false;
            character.combatState.currentAnimation = 'idle';
            character.targetX = undefined;
            character.targetY = undefined;
        }
    }
    
    /**
     * Handle right mouse button single click - move one tile toward cursor
     */
    handleRightMouseClick(character, clickX, clickY) {
        const TILE_SIZE = 44;
        
        // Calculate direction from character to click
        const dx = clickX - character.x;
        const dy = clickY - character.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move exactly one tile in the direction of the click
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            character.targetX = character.x + normalizedDx * TILE_SIZE;
            character.targetY = character.y + normalizedDy * TILE_SIZE;
            character.combatState.isMoving = true;
        }
    }
    
    /**
     * Handle character click - move or change facing direction
     * @param {Character} character - Character to control
     * @param {number} clickX - Click X position
     * @param {number} clickY - Click Y position
     */
    handleCharacterClick(character, clickX, clickY) {
        // UO tile size: 44 pixels per tile (standard UO tile size)
        const TILE_SIZE = 44;
        
        // Check if clicking close to the character itself
        // In UO, clicking near yourself just changes facing direction
        const distToCharacter = this.calculateDistance(
            { x: clickX, y: clickY },
            { x: character.x, y: character.y }
        );
        
        // UO behavior: clicking within ~1 tile (44px) of character just changes facing
        // We'll use 1.5 tiles (66px) for a more forgiving threshold
        const closeToCharacterThreshold = TILE_SIZE * 1.5; // 66 pixels (1.5 tiles)
        
        if (distToCharacter < closeToCharacterThreshold) {
            // Clicking close to character - just change facing direction, don't move
            const dx = clickX - character.x;
            const dy = clickY - character.y;
            const angle = Math.atan2(dy, dx);
            
            // Map angle to UO direction (same logic as movement)
            let directionIndex;
            const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
            
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
            character.combatState.facing = directions[directionIndex];
            
            // Stop movement if currently moving
            if (character.combatState.isMoving) {
                character.combatState.isMoving = false;
                character.combatState.currentAnimation = 'idle';
                character.targetX = undefined;
                character.targetY = undefined;
            }
            
            return; // Don't move, just change facing
        }
        
        // Clicking far away or near opponent - move to that location
        this.moveCharacterTo(character, clickX, clickY);
    }
    
    /**
     * Handle target click in war mode
     * @param {Character} character - Character doing the targeting
     * @param {Character} opponent - Potential target
     * @param {number} clickX - Click X position
     * @param {number} clickY - Click Y position
     */
    handleTargetClick(character, opponent, clickX, clickY) {
        console.log(`🖱️ Target click attempt - War mode: ${character.combatState.warMode}`);
        
        if (!character.combatState.warMode) {
            console.log('❌ Not in war mode - press SPACEBAR first!');
            return;
        }
        
        if (!opponent || !opponent.combatState.alive) {
            console.log('❌ No valid opponent to target');
            return;
        }
        
        // Check if click is on the opponent (within 100px radius - very generous)
        const distanceToOpponent = this.calculateDistance(
            { x: clickX, y: clickY },
            { x: opponent.x, y: opponent.y }
        );
        
        console.log(`📍 Click at (${clickX}, ${clickY}), opponent at (${opponent.x}, ${opponent.y}), distance: ${distanceToOpponent.toFixed(1)}px`);
        
        const CLICK_RADIUS = 100; // Very generous click radius for easier targeting
        if (distanceToOpponent < CLICK_RADIUS) {
            // Target acquired!
            character.combatState.target = opponent;
            this.uiManager.addLog(`${character.name} targets ${opponent.name}!`, 'damage');
            this.soundManager.play('fizzle', 'target'); // Use fizzle sound temporarily
            console.log(`✅ ${character.name} targeted ${opponent.name}!`);
            console.log(`   Target reference:`, opponent);
        } else {
            console.log(`❌ Click too far from opponent (${distanceToOpponent.toFixed(1)}px > ${CLICK_RADIUS}px)`);
        }
    }
    
    /**
     * Move character to target position
     * @param {Character} character - Character to move
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     */
    moveCharacterTo(character, targetX, targetY) {
        // Don't move if dead
        if (!character.combatState.alive) {
            return;
        }
        
        // Don't move if attacking
        if (character.combatState.isAttacking) {
            return;
        }
        
        // UO tile size: 44 pixels per tile (standard UO tile size)
        const TILE_SIZE = 44;
        
        // Check if clicking near opponent - if so, move to attack range instead
        // This matches UO's behavior where clicking on/near an enemy moves you to attack range
        const opponent = character === this.player1 ? this.player2 : this.player1;
        if (opponent && opponent.combatState.alive) {
            const clickToOpponentDist = this.calculateDistance(
                { x: targetX, y: targetY },
                { x: opponent.x, y: opponent.y }
            );
            
            // If clicking within 2 tiles (88px) of opponent, move to attack range
            // This matches UO's proximity detection for combat positioning
            const proximityThreshold = TILE_SIZE * 2; // 2 tiles (88 pixels)
            if (clickToOpponentDist < proximityThreshold) {
                const weaponRange = character.equipment.weapon.range * TILE_SIZE; // tiles * 44px
                const currentDist = this.calculateDistance(character, opponent);
                
                // Calculate angle from character to opponent
                const dx = opponent.x - character.x;
                const dy = opponent.y - character.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    // If already at optimal range (within half a tile tolerance), allow fine-tuning
                    const optimalDist = weaponRange;
                    const distFromOptimal = Math.abs(currentDist - optimalDist);
                    
                    // Only adjust position if we're not already at optimal range
                    if (distFromOptimal > TILE_SIZE / 2) {
                        // Calculate position at attack range from opponent
                        const targetDist = optimalDist;
                        targetX = opponent.x - (dx / dist) * targetDist;
                        targetY = opponent.y - (dy / dist) * targetDist;
                    }
                    // If already at optimal range, allow clicking to fine-tune position
                }
            }
        }
        
        // Set target position (UO uses smooth movement between tiles, not strict grid snapping)
        character.targetX = targetX;
        character.targetY = targetY;
        character.combatState.isMoving = true;
        
        // Calculate initial facing direction based on movement vector
        // The character.update() method will update this continuously during movement
        const dx = targetX - character.x;
        const dy = targetY - character.y;
        const angle = Math.atan2(dy, dx);
        
        // Map angle to UO direction names (same logic as character.js)
        // Math.atan2(dy, dx): 0°=East, 90°=South, 180°=West, -90°=North
        let directionIndex;
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2); // 0 to 2PI
        
        // Map normalized angle (0-2PI) to direction index
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
        character.combatState.facing = directions[directionIndex];
        character.combatState.currentAnimation = 'walk';
    }

    /**
     * Handle spell cast
     * @param {Character} caster - Character casting spell
     * @param {string} spellKey - Spell key
     */
    handleSpellCast(caster, spellKey) {
        const spell = Spells[spellKey];
        
        if (!spell) {
            console.error('Unknown spell:', spellKey);
            return;
        }
        
        // Check mana
        if (caster.resources.mana < spell.manaCost) {
            this.uiManager.addLog(`${caster.name} doesn't have enough mana!`, 'miss');
            return;
        }
        
        // Check if already casting
        if (caster.combatState.casting) {
            return;
        }
        
        // Start cast
        const castStarted = caster.startCast(spellKey);
        
        if (castStarted) {
            this.uiManager.addLog(
                `${caster.name} begins casting ${spell.name}...`,
                'cast'
            );
        }
    }

    /**
     * Handle character death
     * @param {Character} character - Character that died
     */
    handleCharacterDeath(character) {
        const winner = character === this.player1 ? this.player2 : this.player1;
        
        // Log death
        this.uiManager.addLog(`${character.name} has been slain!`, 'damage');
        this.uiManager.addLog(`${winner.name} wins!`, 'cast');
        
        // Play death sound
        this.soundManager.play('death', 'death');
        
        // Show game over
        this.gameOver = true;
        this.uiManager.showGameOver(winner.id);
    }

    /**
     * Export current frame as PNG for animation assets
     * Files save to Downloads folder - manually organize into folders after
     */
    exportCurrentFrame() {
        // Get the character being edited (assume player1 in debug mode)
        const character = this.player1;
        
        // Get current animation state
        const animation = character.combatState.currentAnimation || 'idle';
        const facing = character.combatState.facing || 'east';
        const weapon = character.equipment.weapon.name.toLowerCase() || 'unarmed';
        
        // Get frame number from renderer if in frame match mode
        const frameNum = this.renderer.frameMatchMode ? this.renderer.currentAnimationFrame : 0;
        
        // Build filename: animation-weapon-direction-frameX.bmp
        // Use dashes for easy sorting, will be organized into folders manually
        // Example: running-halberd-north-frame0.bmp
        const filename = `${animation}-${weapon}-${facing}-frame${frameNum}.bmp`;
        
        // Capture canvas as image (BMP format)
        this.canvas.toBlob((blob) => {
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            // Show confirmation
            console.log(`✅ Exported: ${filename} → ${animation}/${weapon}/${facing}/`);
            this.uiManager.addLog(`Exported ${weapon} frame ${frameNum}`, 'normal');
        }, 'image/bmp');
    }
    
    /**
     * Batch export all frames for current animation and direction
     * Creates multiple downloads in sequence
     */
    batchExportFrames() {
        const character = this.player1;
        const animation = character.combatState.currentAnimation || 'idle';
        const facing = character.combatState.facing || 'east';
        const weapon = character.equipment.weapon.name.toLowerCase() || 'unarmed';
        
        // Determine number of frames based on animation
        let totalFrames = 1; // idle has 1 frame
        if (animation === 'walk' || animation === 'run' || animation === 'running') {
            totalFrames = 4; // walk/run have 4 frames
        }
        
        console.log(`📦 Batch exporting ${totalFrames} frames for ${animation}-${weapon}-${facing}...`);
        this.uiManager.addLog(`Batch exporting ${totalFrames} ${weapon} frames...`, 'normal');
        
        // Export each frame with a delay to prevent browser blocking
        for (let i = 0; i < totalFrames; i++) {
            setTimeout(() => {
                // Temporarily set frame
                const originalFrame = this.renderer._selectedFrameIndex;
                this.renderer._selectedFrameIndex = i;
                this.renderer.currentAnimationFrame = i;
                
                // Export this frame
                this.exportCurrentFrame();
                
                // Restore original frame
                setTimeout(() => {
                    this.renderer._selectedFrameIndex = originalFrame;
                    this.renderer.currentAnimationFrame = originalFrame !== null ? originalFrame : 0;
                }, 100);
            }, i * 300); // 300ms delay between each export
        }
    }

    /**
     * Restart match
     */
    restartMatch() {
        // Reset characters
        this.player1.reset();
        this.player2.reset();
        
        // Clear projectiles and effects
        this.projectiles = [];
        this.effects = [];
        
        // Reset game state
        this.gameOver = false;
        
        // Hide game over screen
        this.uiManager.hideGameOver();
        
        // Clear combat log
        this.uiManager.clearLog();
        this.uiManager.addLog('Match restarted!', 'normal');
    }

    /**
     * Toggle pause
     */
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            this.uiManager.addLog('Game paused.', 'normal');
        } else {
            this.uiManager.addLog('Game resumed.', 'normal');
            this.lastFrameTime = performance.now(); // Reset timer
        }
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Make game accessible globally for debugging
    window.game = game;
});

