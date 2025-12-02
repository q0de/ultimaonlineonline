/**
 * Input Handler
 * Manages keyboard and mouse input for two-player local combat
 */

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keysPressed = new Set();
        this.keyBindings = this.setupKeyBindings();
        
        this.setupEventListeners();
    }

    /**
     * Setup key bindings for both players
     */
    setupKeyBindings() {
        return {
            // Player 1 Controls
            'Space': { player: 1, action: 'toggleWarMode' }, // UO-style war mode toggle (SPACEBAR)
            'KeyQ': { player: 1, action: 'toggleWeapon' },
            'KeyA': { player: 1, action: 'swing' },
            'Digit1': { player: 1, action: 'castLightning' },
            'Digit2': { player: 1, action: 'castEnergyBolt' },
            'Digit3': { player: 1, action: 'castExplosion' },
            
            // Player 2 Controls
            'Enter': { player: 2, action: 'toggleWarMode' }, // Player 2 war mode (ENTER)
            'KeyE': { player: 2, action: 'toggleWeapon' },
            'KeyD': { player: 2, action: 'swing' },
            'Digit4': { player: 2, action: 'castLightning' },
            'Digit5': { player: 2, action: 'castEnergyBolt' },
            'Digit6': { player: 2, action: 'castExplosion' },
            
            // Movement (optional for future)
            'KeyW': { player: 1, action: 'moveUp' },
            'KeyS': { player: 1, action: 'moveDown' },
            'ArrowUp': { player: 2, action: 'moveUp' },
            'ArrowDown': { player: 2, action: 'moveDown' },
            
            // Global controls
            'Escape': { player: 0, action: 'pause' },
            'KeyR': { player: 0, action: 'restart' },
            
            // Asset Export Controls
            'F2': { player: 0, action: 'exportFrame' },
            'F3': { player: 0, action: 'batchExportFrames' }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard events - use capture phase for better event handling
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
        
        // Button click events
        this.setupButtonListeners();
    }

    /**
     * Handle key down
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        // Prevent default for game keys
        const binding = this.keyBindings[event.code];
        if (binding) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        
        // ALWAYS prevent spacebar from scrolling the page
        if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        
        // Check if key is already pressed (prevent repeats)
        if (this.keysPressed.has(event.code)) {
            return;
        }
        
        this.keysPressed.add(event.code);
        
        // Execute action if bound
        if (binding) {
            this.executeAction(binding.player, binding.action);
        }
    }

    /**
     * Handle key up
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event) {
        this.keysPressed.delete(event.code);
    }

    /**
     * Setup button click listeners
     */
    setupButtonListeners() {
        // Player 1 buttons
        this.addButtonListener('p1-weapon-toggle', 1, 'toggleWeapon');
        this.addButtonListener('p1-swing', 1, 'swing');
        this.addButtonListener('p1-spell-lightning', 1, 'castLightning');
        this.addButtonListener('p1-spell-ebolt', 1, 'castEnergyBolt');
        this.addButtonListener('p1-spell-explosion', 1, 'castExplosion');
        
        // Player 2 buttons
        this.addButtonListener('p2-weapon-toggle', 2, 'toggleWeapon');
        this.addButtonListener('p2-swing', 2, 'swing');
        this.addButtonListener('p2-spell-lightning', 2, 'castLightning');
        this.addButtonListener('p2-spell-ebolt', 2, 'castEnergyBolt');
        this.addButtonListener('p2-spell-explosion', 2, 'castExplosion');
        
        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.executeAction(0, 'restart');
            });
        }
    }

    /**
     * Add button listener
     * @param {string} elementId - Button element ID
     * @param {number} player - Player number
     * @param {string} action - Action to execute
     */
    addButtonListener(elementId, player, action) {
        const button = document.getElementById(elementId);
        if (button) {
            button.addEventListener('click', () => {
                this.executeAction(player, action);
            });
        }
    }

    /**
     * Execute action for player
     * @param {number} player - Player number (1 or 2, 0 for global)
     * @param {string} action - Action to execute
     */
    executeAction(player, action) {
        // Get character (player 1 or 2)
        const character = player === 1 ? this.game.player1 : 
                         player === 2 ? this.game.player2 : null;
        
        switch (action) {
            case 'toggleWarMode':
                if (character && character.combatState.alive) {
                    this.game.handleWarModeToggle(character);
                }
                break;
                
            case 'toggleWeapon':
                if (character && character.combatState.alive) {
                    this.game.handleWeaponToggle(character);
                }
                break;
                
            case 'swing':
                if (character && character.combatState.alive) {
                    this.game.handleWeaponSwing(character);
                }
                break;
                
            case 'castLightning':
                if (character && character.combatState.alive) {
                    this.game.handleSpellCast(character, 'lightning');
                }
                break;
                
            case 'castEnergyBolt':
                if (character && character.combatState.alive) {
                    this.game.handleSpellCast(character, 'energyBolt');
                }
                break;
                
            case 'castExplosion':
                if (character && character.combatState.alive) {
                    this.game.handleSpellCast(character, 'explosion');
                }
                break;
                
            case 'moveUp':
            case 'moveDown':
                // TODO: Implement movement in advanced version
                break;
                
            case 'pause':
                this.game.togglePause();
                break;
                
            case 'restart':
                this.game.restartMatch();
                break;
            case 'exportFrame':
                this.game.exportCurrentFrame();
                break;
            case 'batchExportFrames':
                this.game.batchExportFrames();
                break;
        }
    }

    /**
     * Check if key is currently pressed
     * @param {string} code - Key code
     * @returns {boolean}
     */
    isKeyPressed(code) {
        return this.keysPressed.has(code);
    }

    /**
     * Clear all pressed keys
     */
    clearKeys() {
        this.keysPressed.clear();
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

