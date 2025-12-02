/**
 * UI Manager
 * Handles all UI updates (health bars, cast bars, combat log, etc.)
 */

export class UIManager {
    constructor() {
        this.elements = this.cacheElements();
        this.combatLog = [];
        this.maxLogEntries = 100;
    }

    /**
     * Cache all UI elements
     */
    cacheElements() {
        return {
            // Player 1 elements
            p1: {
                healthBar: document.getElementById('p1-health-bar'),
                healthText: document.getElementById('p1-health-text'),
                manaBar: document.getElementById('p1-mana-bar'),
                manaText: document.getElementById('p1-mana-text'),
                staminaBar: document.getElementById('p1-stamina-bar'),
                staminaText: document.getElementById('p1-stamina-text'),
                castBar: document.getElementById('p1-cast-bar'),
                castText: document.getElementById('p1-cast-text'),
                swingBar: document.getElementById('p1-swing-bar'),
                swingText: document.getElementById('p1-swing-text'),
                weaponToggle: document.getElementById('p1-weapon-toggle'),
                swingBtn: document.getElementById('p1-swing'),
                spellButtons: {
                    lightning: document.getElementById('p1-spell-lightning'),
                    energyBolt: document.getElementById('p1-spell-ebolt'),
                    explosion: document.getElementById('p1-spell-explosion')
                }
            },
            
            // Player 2 elements
            p2: {
                healthBar: document.getElementById('p2-health-bar'),
                healthText: document.getElementById('p2-health-text'),
                manaBar: document.getElementById('p2-mana-bar'),
                manaText: document.getElementById('p2-mana-text'),
                staminaBar: document.getElementById('p2-stamina-bar'),
                staminaText: document.getElementById('p2-stamina-text'),
                castBar: document.getElementById('p2-cast-bar'),
                castText: document.getElementById('p2-cast-text'),
                swingBar: document.getElementById('p2-swing-bar'),
                swingText: document.getElementById('p2-swing-text'),
                weaponToggle: document.getElementById('p2-weapon-toggle'),
                swingBtn: document.getElementById('p2-swing'),
                spellButtons: {
                    lightning: document.getElementById('p2-spell-lightning'),
                    energyBolt: document.getElementById('p2-spell-ebolt'),
                    explosion: document.getElementById('p2-spell-explosion')
                }
            },
            
            // Combat log
            combatLog: document.getElementById('combat-log'),
            
            // Game over screen
            gameOverScreen: document.getElementById('game-over-screen'),
            gameOverText: document.getElementById('game-over-text')
        };
    }

    /**
     * Update character UI
     * @param {Character} character - Character to update
     * @param {number} playerNum - Player number (1 or 2)
     */
    updateCharacter(character, playerNum) {
        const ui = this.elements[`p${playerNum}`];
        
        // Update health
        const healthPercent = (character.resources.health / character.resources.maxHealth) * 100;
        ui.healthBar.style.width = `${healthPercent}%`;
        ui.healthText.textContent = `${Math.ceil(character.resources.health)}/${character.resources.maxHealth}`;
        
        // Add flash effect on damage
        if (character._lastHealth !== undefined && character.resources.health < character._lastHealth) {
            ui.healthBar.parentElement.classList.add('flash-damage');
            setTimeout(() => ui.healthBar.parentElement.classList.remove('flash-damage'), 300);
        }
        character._lastHealth = character.resources.health;
        
        // Update mana
        const manaPercent = (character.resources.mana / character.resources.maxMana) * 100;
        ui.manaBar.style.width = `${manaPercent}%`;
        ui.manaText.textContent = `${Math.ceil(character.resources.mana)}/${character.resources.maxMana}`;
        
        // Update stamina
        const staminaPercent = (character.resources.stamina / character.resources.maxStamina) * 100;
        ui.staminaBar.style.width = `${staminaPercent}%`;
        ui.staminaText.textContent = `${Math.ceil(character.resources.stamina)}/${character.resources.maxStamina}`;
        
        // Update cast bar
        if (character.combatState.casting) {
            const castPercent = character.getCastProgress();
            ui.castBar.style.width = `${castPercent}%`;
            const spellName = character.combatState.currentSpell.name;
            const timeLeft = ((character.combatState.castDuration - (Date.now() - character.combatState.castStartTime)) / 1000).toFixed(1);
            ui.castText.textContent = `Casting ${spellName}... ${timeLeft}s`;
        } else {
            ui.castBar.style.width = '0%';
            ui.castText.textContent = 'Ready';
        }
        
        // Update swing bar
        const swingPercent = character.getSwingProgress();
        ui.swingBar.style.width = `${swingPercent}%`;
        if (character.combatState.canSwing) {
            ui.swingText.textContent = 'Ready to Swing';
        } else {
            const timeLeft = ((character.combatState.swingCooldown - (Date.now() - character.combatState.lastSwingTime)) / 1000).toFixed(1);
            ui.swingText.textContent = `Cooldown: ${timeLeft}s`;
        }
        
        // Update weapon toggle button
        if (character.equipment.weaponEquipped) {
            ui.weaponToggle.classList.add('equipped');
        } else {
            ui.weaponToggle.classList.remove('equipped');
        }
        
        // Update button states
        this.updateButtonStates(character, playerNum);
    }

    /**
     * Update button enabled/disabled states
     * @param {Character} character - Character
     * @param {number} playerNum - Player number
     */
    updateButtonStates(character, playerNum) {
        const ui = this.elements[`p${playerNum}`];
        
        // Swing button
        ui.swingBtn.disabled = !character.equipment.weaponEquipped || 
                               !character.combatState.canSwing || 
                               !character.combatState.alive ||
                               character.resources.stamina < character.equipment.weapon.staminaCost;
        
        // Spell buttons
        const spellCosts = {
            lightning: 40,
            energyBolt: 40,
            explosion: 40
        };
        
        Object.keys(ui.spellButtons).forEach(spellKey => {
            const button = ui.spellButtons[spellKey];
            const canCast = character.resources.mana >= spellCosts[spellKey] &&
                          !character.combatState.casting &&
                          character.combatState.alive;
            button.disabled = !canCast;
        });
        
        // Weapon toggle always enabled while alive
        ui.weaponToggle.disabled = !character.combatState.alive;
    }

    /**
     * Add entry to combat log
     * @param {string} message - Log message
     * @param {string} type - Message type (damage, miss, fizzle, cast, cancel)
     */
    addLog(message, type = 'normal') {
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const entry = {
            timestamp: timestamp,
            message: message,
            type: type
        };
        
        this.combatLog.push(entry);
        
        // Limit log entries
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
        
        // Update display
        this.renderCombatLog();
    }

    /**
     * Render combat log to DOM
     */
    renderCombatLog() {
        const logElement = this.elements.combatLog;
        
        // Create log HTML
        const logHTML = this.combatLog.map(entry => {
            return `<div class="log-entry">
                <span class="log-timestamp">[${entry.timestamp}]</span>
                <span class="log-${entry.type}">${entry.message}</span>
            </div>`;
        }).join('');
        
        logElement.innerHTML = logHTML;
        
        // Auto-scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
    }

    /**
     * Show game over screen
     * @param {number} winner - Winning player number
     */
    showGameOver(winner) {
        this.elements.gameOverScreen.classList.remove('hidden');
        this.elements.gameOverText.textContent = `Player ${winner} Wins!`;
    }

    /**
     * Hide game over screen
     */
    hideGameOver() {
        this.elements.gameOverScreen.classList.add('hidden');
    }

    /**
     * Clear combat log
     */
    clearLog() {
        this.combatLog = [];
        this.renderCombatLog();
    }

    /**
     * Show loading screen
     */
    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Update loading progress
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} text - Progress text
     */
    updateLoadingProgress(percent, text) {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingBar) {
            loadingBar.style.width = `${percent}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    /**
     * Show game container
     */
    showGame() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
        }
    }
}

