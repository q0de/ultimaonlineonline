/**
 * Renderer
 * Handles all canvas rendering for the game
 */

import { weaponPositionOffsets } from '../data/weaponPositionOffsets.js';

export class Renderer {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        
        // Arena dimensions
        this.arenaWidth = canvas.width;
        this.arenaHeight = canvas.height;
        
        // Character size
        this.charWidth = 64;
        this.charHeight = 64;
        
        // UO tile size (44 pixels per tile)
        this.tileSize = 44;
        
        // Weapon positioning debug controls
        // Load saved offsets from localStorage or use defaults
        // Defaults optimized for UO male character + halberd alignment
        this.weaponOffsetX = parseFloat(localStorage.getItem('weaponOffsetX') || '10');
        this.weaponOffsetY = parseFloat(localStorage.getItem('weaponOffsetY') || '-3');
        this.weaponHandPercent = parseFloat(localStorage.getItem('weaponHandPercent') || '0.32');
        this.debugMode = false;
        
        // Per-animation and per-direction offsets
        // These override the base offsets when specific animation+direction combo is active
        this.animationOffsets = this.loadAnimationOffsets();
        
        // Frame matching mode: select a specific frame to match between character and weapon
        this._frameMatchMode = false; // When true, both animations lock to selected frame
        this._selectedFrameIndex = null; // Which frame to match (0-9, null = auto/animated)
        
        // Track current animation/direction for debug mode
        this._currentAnimation = null;
        this._currentDirection = null;
        this._currentAnimKey = null;
        this._manualDirectionOverride = null; // User can manually select direction with number keys
        this._lastDirectionLoad = null; // Track last direction we loaded values for
        this._directionChangeTime = 0; // Track when direction last changed
        this._lastUserAdjustment = 0; // Track when user last pressed arrow keys
        
        // Save notification system
        this.saveNotification = null;
        this.saveNotificationTimer = null;
        
        // Setup keyboard controls for weapon positioning
        this.setupWeaponPositioningControls();
    }
    
    /**
     * Setup keyboard controls for weapon positioning
     */
    setupWeaponPositioningControls() {
        // Use capture phase to intercept keys BEFORE inputHandler
        document.addEventListener('keydown', (e) => {
            // Press 'F1' or 'Insert' to toggle debug mode (keys that don't conflict with game controls)
            if (e.key === 'F1' || e.key === 'Insert' || (e.key === 'F12' && !e.shiftKey && !e.ctrlKey && !e.altKey)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.debugMode = !this.debugMode;
                
                // When entering debug mode, default to NORTH direction if no manual override
                if (this.debugMode) {
                    if (!this._manualDirectionOverride) {
                        this._manualDirectionOverride = 'north';
                        console.log('%c🎯 Debug mode: Direction locked to NORTH', 'color: cyan; font-weight: bold');
                        console.log('   Use numpad 1-9 to change direction, 0 to clear lock');
                    }
                    
                    // Load saved values for this direction
                    const animKey = `${this._currentAnimation || 'idle'}_${this._manualDirectionOverride || this._currentDirection || 'north'}`;
                    const saved = this.animationOffsets[animKey];
                    if (saved) {
                        this.weaponOffsetX = saved.x;
                        this.weaponOffsetY = saved.y;
                        this.weaponHandPercent = saved.handPercent;
                    }
                } else {
                    // When exiting debug mode, clear the direction lock
                    this._manualDirectionOverride = null;
                }
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: yellow');
                console.log(`%cDebug mode: ${this.debugMode ? 'ON' : 'OFF'}`, 'color: yellow; font-weight: bold; font-size: 16px');
                if (this.debugMode) {
                    console.log('%cWeapon Positioning Controls:', 'color: cyan; font-weight: bold');
                    console.log('  Arrow Keys = Move weapon position');
                    console.log('  Ctrl+Q/E = Adjust hand position percentage');
                    console.log('  Ctrl+R = Reset to default values');
                    console.log('%c  A = Cycle animation type (idle → walk → running → attack)', 'color: lime; font-weight: bold');
                    console.log('  Shift+S = SAVE to localStorage (temporary)');
                    console.log('%c  Shift+E = EXPORT to file (permanent!)', 'color: lime; font-weight: bold');
                    console.log('  Shift+D = DELETE saved position for this direction');
                    console.log('%c  1-8 or Numpad 1-8 = LOCK direction (1=E, 2=SE, 3=S, 4=SW, 5=W, 6=NW, 7=N, 8=NE)', 'color: yellow; font-weight: bold');
                    console.log('%c  0 or Numpad 0 = Return to auto-detection mode', 'color: lime');
                console.log('  F = Frame match mode (for multi-frame animations)');
                console.log('  Shift+Arrow = Larger adjustment steps');
                console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: yellow');
                console.log('%cWorkflow:', 'color: yellow; font-weight: bold');
                console.log('  1. Position weapons → Shift+S (saves to browser)');
                console.log('  2. When done → Shift+E (exports to .js file)');
                console.log('  3. Replace js/data/weaponPositionOffsets.js with exported file');
                console.log('  4. Positions now hardcoded in your game forever!');
                console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: yellow');
                    // Show what's currently saved
                    const allSaved = JSON.parse(localStorage.getItem('animationOffsets') || '{}');
                    const savedCount = Object.keys(allSaved).length;
                    if (savedCount > 0) {
                        console.log(`%c📦 Currently saved: ${savedCount} configurations`, 'color: lime; font-weight: bold');
                        console.log(allSaved);
                    } else {
                        console.log(`%c📦 No saved configurations yet`, 'color: orange');
                    }
                }
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: yellow');
                return;
            }
            
            // Only process positioning controls if debug mode is on
            if (!this.debugMode) return;
            
            // Key 'A' to cycle animation type (idle → walk → running → attack)
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const animTypes = ['idle', 'walk', 'running', 'attack'];
                const currentIndex = animTypes.indexOf(this._debugAnimationType || 'idle');
                const nextIndex = (currentIndex + 1) % animTypes.length;
                this._debugAnimationType = animTypes[nextIndex];
                
                console.log(`%c🎬 Animation Type: ${this._debugAnimationType.toUpperCase()}`, 'color: lime; font-weight: bold; font-size: 14px');
                console.log(`   Press 'A' again to cycle: idle → walk → running → attack`);
                
                // Load saved values for this animation type
                const direction = this._manualDirectionOverride || this._currentDirection || 'north';
                const animKey = `${this._debugAnimationType}_${direction}`;
                const saved = this.animationOffsets[animKey];
                if (saved) {
                    this.weaponOffsetX = saved.x;
                    this.weaponOffsetY = saved.y;
                    this.weaponHandPercent = saved.handPercent;
                    console.log(`   ✅ Loaded saved position for ${animKey}`);
                } else {
                    console.log(`   ⚠️ No saved position for ${animKey} yet`);
                }
                return;
            }
            
            // SHIFT+ALT+E: Export ONLY southeast attack positions
            if (e.shiftKey && e.altKey && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.exportSoutheastAttackOnly();
                return;
            }
            
            // SHIFT+E: Export all saved positions to JavaScript file
            if (e.shiftKey && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.exportWeaponPositions();
                return;
            }
            
            // NUMPAD keys 1-8 to manually select direction for saving
            // Using numpad to avoid conflict with spell casting keys
            const directionMap = {
                '1': 'southwest',
                '2': 'south', 
                '3': 'southeast',
                '4': 'west',
                '5': 'south',  // Center (default to south when idle)
                '6': 'east',
                '7': 'northwest',
                '8': 'north',
                '9': 'northeast',
                // Also support numpad keys
                'Numpad1': 'southwest',
                'Numpad2': 'south',
                'Numpad3': 'southeast',
                'Numpad4': 'west',
                'Numpad5': 'south',
                'Numpad6': 'east',
                'Numpad7': 'northwest',
                'Numpad8': 'north',
                'Numpad9': 'northeast'
            };
            
            // Check both e.key and e.code for number keys
            const keyPressed = directionMap[e.key] || directionMap[e.code];
            if (keyPressed) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this._manualDirectionOverride = keyPressed;
                
                // Load saved values for this direction
                let animKey;
                if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                    // In frame match mode: Load frame-specific values using current animation type
                    const animType = this._debugAnimationType || 'walk';
                    animKey = `${animType}_${keyPressed}_frame${this._selectedFrameIndex}`;
                } else {
                    // Normal mode: Load animation + direction values
                    animKey = `${this._currentAnimation || 'walk'}_${keyPressed}`;
                }
                
                const saved = this.animationOffsets[animKey];
                if (saved) {
                    this.weaponOffsetX = saved.x;
                    this.weaponOffsetY = saved.y;
                    this.weaponHandPercent = saved.handPercent;
                    console.log(`%c🎯 Locked to ${this._manualDirectionOverride.toUpperCase()} - Loaded saved values`, 'color: yellow; font-weight: bold; font-size: 14px');
                    console.log(`   Key: ${animKey}`);
                    console.log(`   X=${saved.x.toFixed(1)}, Y=${saved.y.toFixed(1)}, Hand=${(saved.handPercent*100).toFixed(1)}%`);
                } else {
                    // No saved values - keep current values (don't reset)
                    console.log(`%c🎯 Locked to ${this._manualDirectionOverride.toUpperCase()} - No saved values, keeping current`, 'color: yellow; font-weight: bold; font-size: 14px');
                    console.log(`   Looking for key: ${animKey}`);
                    console.log(`   Current: X=${this.weaponOffsetX.toFixed(1)}, Y=${this.weaponOffsetY.toFixed(1)}, Hand=${(this.weaponHandPercent*100).toFixed(1)}%`);
                }
                console.log(`   Adjust with arrows, then press Shift+S to save`);
                console.log(`   Press 0 to clear manual override`);
                this._lastDirectionLoad = animKey; // Prevent auto-loading from interfering
                return;
            }
            
            // Key '0' or Numpad0 to clear manual direction override
            if (e.key === '0' || e.code === 'Numpad0') {
                e.preventDefault();
                e.stopImmediatePropagation();
                // If in frame match mode, clear frame selection; otherwise clear direction override
                if (this._frameMatchMode) {
                    this._selectedFrameIndex = null;
                    console.log(`%c✓ Frame selection cleared - animations will play normally`, 'color: lime; font-weight: bold');
                } else {
                    this._manualDirectionOverride = null;
                    console.log(`%c✓ Manual direction override cleared - using auto-detection`, 'color: lime; font-weight: bold');
                }
                return;
            }
            
            // Key 'F' to toggle frame match mode
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this._frameMatchMode = !this._frameMatchMode;
                if (!this._frameMatchMode) {
                    // Exiting frame match mode - reset
                    this._selectedFrameIndex = null;
                } else {
                    // Entering frame match mode - START ANIMATING (not paused)
                    this._selectedFrameIndex = null; // null = animate/loop together
                    console.log('🎬 Frame Match Mode: ANIMATING (press +/- to pause on specific frame, F to exit)');
                    
                    // Load saved values for frame 0 (if they exist)
                    const direction = this._manualDirectionOverride || this._currentDirection || 'north';
                    const frameKey = `walk_${direction}_frame0`;
                    const saved = this.animationOffsets[frameKey];
                    if (saved) {
                        this.weaponOffsetX = saved.x;
                        this.weaponOffsetY = saved.y;
                        this.weaponHandPercent = saved.handPercent;
                    }
                }
                console.log(`%c${this._frameMatchMode ? '🔒 FRAME MATCH MODE ON' : '▶️ Frame match mode OFF'}`, 'color: cyan; font-weight: bold; font-size: 14px');
                if (this._frameMatchMode) {
                    console.log(`   Press +/- to cycle frames (currently frame ${this._selectedFrameIndex})`);
                    console.log(`   Both character and weapon will lock to the same frame number`);
                    console.log(`   Adjust position, then save with Shift+S`);
                }
                return;
            }
            
            // Keys +/- to cycle frames when in frame match mode
            if (this._frameMatchMode && (e.key === '+' || e.key === '=' || e.key === '-' || e.code === 'Equal' || e.code === 'Minus')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                // Determine max frames based on animation type
                const animType = this._debugAnimationType || 'walk';
                let maxFrames = 10; // Default for walk/run
                if (animType === 'attack') {
                    maxFrames = 7; // Attack animations have 7 frames (0-6)
                }
                
                // If currently animating (null), capture current frame and pause
                if (this._selectedFrameIndex === null) {
                    // Calculate current frame from animation timing (same logic as renderer)
                    let ANIMATION_DURATION;
                    if (animType === 'running') {
                        ANIMATION_DURATION = 800; // 0.8s for running
                    } else if (animType === 'attack') {
                        ANIMATION_DURATION = 1500; // 1.5s for attack
                    } else {
                        ANIMATION_DURATION = 1200; // 1.2s for walking
                    }
                    const moveTime = Date.now() % ANIMATION_DURATION;
                    const currentFrame = Math.floor((moveTime / ANIMATION_DURATION) * maxFrames);
                    this._selectedFrameIndex = Math.min(currentFrame, maxFrames - 1);
                    console.log(`%c⏸️ PAUSED on frame ${this._selectedFrameIndex} (use +/- to step through frames)`, 'color: orange; font-weight: bold');
                } else {
                    // Already paused, cycle frames
                    if (e.key === '+' || e.key === '=' || e.code === 'Equal') {
                        // Cycle forward
                        this._selectedFrameIndex = (this._selectedFrameIndex + 1) % maxFrames;
                    } else {
                        // Cycle backward
                        this._selectedFrameIndex = (this._selectedFrameIndex - 1 + maxFrames) % maxFrames;
                    }
                }
                
                // Load saved values for this frame (if they exist)
                const direction = this._manualDirectionOverride || this._currentDirection || 'north';
                const frameKey = `${animType}_${direction}_frame${this._selectedFrameIndex}`;
                const saved = this.animationOffsets[frameKey];
                
                console.log(`%c🎬 Frame ${this._selectedFrameIndex} locked - both animations paused`, 'color: yellow; font-weight: bold; font-size: 16px');
                console.log(`   🔑 Looking for key: "${frameKey}"`);
                console.log(`   📦 All saved keys:`, Object.keys(this.animationOffsets));
                if (saved) {
                    console.log(`   ✅ FOUND saved values!`);
                    console.log(`      Loading: X=${saved.x.toFixed(1)}, Y=${saved.y.toFixed(1)}, Hand=${(saved.handPercent*100).toFixed(1)}%`);
                    this.weaponOffsetX = saved.x;
                    this.weaponOffsetY = saved.y;
                    this.weaponHandPercent = saved.handPercent;
                    console.log(`      After loading: X=${this.weaponOffsetX.toFixed(1)}, Y=${this.weaponOffsetY.toFixed(1)}`);
                } else {
                    console.log(`   ⚠️ NO saved values for "${frameKey}" - keeping current position`);
                    console.log(`      Current: X=${this.weaponOffsetX.toFixed(1)}, Y=${this.weaponOffsetY.toFixed(1)}`);
                }
                console.log(`   ➡️ Adjust position with arrow keys, then save with Shift+S`);
                return;
            }
            
            // Key 'L' to LIST all saved offsets (debug)
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log(`%c📋 ALL SAVED WEAPON OFFSETS`, 'background: blue; color: white; font-weight: bold; padding: 4px');
                const allSaved = JSON.parse(localStorage.getItem('animationOffsets') || '{}');
                console.table(allSaved);
                console.log(`Total saved: ${Object.keys(allSaved).length} configurations`);
                return;
            }
            
            // Key 'X' to CLEAR ALL saved offsets (debug - requires confirmation)
            if (e.key === 'x' || e.key === 'X') {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log(`%c⚠ CLEAR ALL? Press X again within 2 seconds to confirm`, 'background: red; color: white; font-weight: bold; padding: 4px');
                if (this._clearConfirmTime && Date.now() - this._clearConfirmTime < 2000) {
                    this.animationOffsets = {};
                    this.saveAnimationOffsets();
                    console.log(`%c✓ ALL SAVED OFFSETS CLEARED`, 'background: green; color: white; font-weight: bold; padding: 4px');
                    this._clearConfirmTime = null;
                } else {
                    this._clearConfirmTime = Date.now();
                }
                return;
            }
            
            // Use Ctrl modifier to avoid conflicts with game controls
            // Only arrow keys can be used without modifier (they don't conflict with game actions)
            const step = e.shiftKey ? 5 : 1; // Hold Shift for larger steps
            
            // Arrow keys for positioning (in debug mode, prevent game from handling these)
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopImmediatePropagation(); // Stop inputHandler from seeing this
                this.weaponOffsetX -= step;
                this._lastUserAdjustment = Date.now(); // Prevent auto-loading while adjusting
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.weaponOffsetX += step;
                this._lastUserAdjustment = Date.now();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.weaponOffsetY -= step;
                this._lastUserAdjustment = Date.now();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.weaponOffsetY += step;
                this._lastUserAdjustment = Date.now();
                return;
            }
            
            // Ctrl modifier required for other controls to avoid conflicts with game actions
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'q' || e.key === 'Q') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.weaponHandPercent -= 0.01;
                    this._lastUserAdjustment = Date.now(); // Prevent auto-loading while adjusting
                    return;
                }
                if (e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.weaponHandPercent += 0.01;
                    this._lastUserAdjustment = Date.now();
                    return;
                }
                if (e.key === 'r' || e.key === 'R') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    // Reset to optimized defaults (calibrated for UO male + halberd)
                    this.weaponOffsetX = 10;
                    this.weaponOffsetY = -3;
                    this.weaponHandPercent = 0.32;
                    this.saveWeaponOffsets();
                    console.log('Weapon offsets reset to optimized defaults (X: 10, Y: -3)');
                    return;
                }
                // Frame offset adjustment (for walk animation sync)
                if (e.key === '[' || e.key === ',') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const directionToAdjust = this._manualDirectionOverride || this._currentDirection || 'east';
                    const animKey = `walk_${directionToAdjust}`;
                    this.walkFrameOffsets[animKey] = (this.walkFrameOffsets[animKey] || 0) - 1;
                    this.saveWalkFrameOffsets();
                    console.log(`%cFrame offset for ${animKey}: ${this.walkFrameOffsets[animKey]}`, 'color: cyan; font-weight: bold');
                    return;
                }
                if (e.key === ']' || e.key === '.') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const directionToAdjust = this._manualDirectionOverride || this._currentDirection || 'east';
                    const animKey = `walk_${directionToAdjust}`;
                    this.walkFrameOffsets[animKey] = (this.walkFrameOffsets[animKey] || 0) + 1;
                    this.saveWalkFrameOffsets();
                    console.log(`%cFrame offset for ${animKey}: ${this.walkFrameOffsets[animKey]}`, 'color: cyan; font-weight: bold');
                    return;
                }
            }
            
            // SHIFT+F: Save current frame offset for this direction
            if (e.shiftKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const directionToSave = this._manualDirectionOverride || this._currentDirection || 'east';
                const animKey = `walk_${directionToSave}`;
                const currentOffset = this.walkFrameOffsets[animKey] || 0;
                console.log(`%c💾 Frame offset saved for ${animKey}: ${currentOffset}`, 'color: magenta; font-weight: bold');
                this.saveWalkFrameOffsets();
                this.showSaveNotification(`Frame offset saved: ${currentOffset}`, true);
                return;
            }
            
            // SHIFT+S: Save current offsets for this animation+direction
            if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`%c━━━ SAVE BUTTON PRESSED ━━━`, 'color: yellow; font-size: 14px; font-weight: bold');
                console.log(`   weaponOffsetX (base): ${this.weaponOffsetX}`);
                console.log(`   weaponOffsetY (base): ${this.weaponOffsetY}`);
                console.log(`   weaponHandPercent (base): ${this.weaponHandPercent}`);
                
                // Use manual override if set, otherwise use auto-detected direction
                const directionToSave = this._manualDirectionOverride || this._currentDirection;
                // Determine animation to save
                let animToSave;
                if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                    // In frame match mode, use the debug animation type (press 'A' to cycle)
                    animToSave = this._debugAnimationType || 'walk';
                } else {
                    // Use debug animation type if set, otherwise current animation
                    animToSave = this._debugAnimationType || this._currentAnimation || 'idle';
                }
                
                console.log(`%c🔍 SAVE TRIGGERED`, 'color: yellow; font-weight: bold');
                if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                    console.log(`   🎬 FRAME MATCH MODE: Saving frame ${this._selectedFrameIndex} as WALK animation`);
                }
                console.log(`   Animation: ${animToSave}`);
                console.log(`   Direction: ${directionToSave} ${this._manualDirectionOverride ? '(MANUAL LOCK)' : '(AUTO-DETECTED)'}`);
                if (!this._manualDirectionOverride) {
                    console.log(`%c   ⚠️ TIP: Use keys 1-8 to LOCK direction while adjusting multiple directions!`, 'color: yellow');
                }
                console.log(`   Current values: X=${this.weaponOffsetX.toFixed(1)}, Y=${this.weaponOffsetY.toFixed(1)}`);
                
                if (animToSave && directionToSave) {
                    // If in frame match mode, save per-frame offsets
                    let key;
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        key = `${animToSave}_${directionToSave}_frame${this._selectedFrameIndex}`;
                        console.log(`%c📝 SAVING FRAME-SPECIFIC TO KEY: "${key}"`, 'color: magenta; font-weight: bold; font-size: 14px');
                    } else {
                        key = `${animToSave}_${directionToSave}`;
                        console.log(`%c📝 SAVING TO KEY: "${key}"`, 'color: magenta; font-weight: bold; font-size: 14px');
                    }
                    
                    console.log(`   Animation: "${animToSave}", Direction: "${directionToSave}", Frame: ${this._selectedFrameIndex}`);
                    console.log(`   Generated Key: "${key}"`);
                    console.log(`   Values: X=${this.weaponOffsetX.toFixed(1)}, Y=${this.weaponOffsetY.toFixed(1)}, Hand=${(this.weaponHandPercent*100).toFixed(1)}%`);
                    
                    // Check if this key already has saved values
                    const existing = this.animationOffsets[key];
                    if (existing) {
                        console.log(`   ⚠️ Overwriting previous: X=${existing.x.toFixed(1)}, Y=${existing.y.toFixed(1)}`);
                    } else {
                        console.log(`   ✓ New key - no previous value`);
                    }
                    
                    // Show what keys exist BEFORE adding this one
                    console.log(`   🗂️ Existing keys BEFORE save:`, Object.keys(this.animationOffsets));
                    
                    this.animationOffsets[key] = {
                        x: this.weaponOffsetX,
                        y: this.weaponOffsetY,
                        handPercent: this.weaponHandPercent
                    };
                    
                    // Show what keys exist AFTER adding this one
                    console.log(`   🗂️ Existing keys AFTER save:`, Object.keys(this.animationOffsets));

                    // In frame match mode, don't mirror to run - each frame is separate
                    if (!this._frameMatchMode) {
                        // Keep walk/run/running in sync so saving one applies to the other
                        if (animToSave === 'walk') {
                            const runKey = `run_${directionToSave}`;
                            const runningKey = `running_${directionToSave}`;
                            this.animationOffsets[runKey] = { ...this.animationOffsets[key] };
                            this.animationOffsets[runningKey] = { ...this.animationOffsets[key] };
                            console.log(`   ↳ Mirrored to ${runKey} and ${runningKey}`);
                        } else if (animToSave === 'run' || animToSave === 'running') {
                            const walkKey = `walk_${directionToSave}`;
                            const runKey = `run_${directionToSave}`;
                            const runningKey = `running_${directionToSave}`;
                            this.animationOffsets[walkKey] = { ...this.animationOffsets[key] };
                            this.animationOffsets[runKey] = { ...this.animationOffsets[key] };
                            this.animationOffsets[runningKey] = { ...this.animationOffsets[key] };
                            console.log(`   ↳ Mirrored to ${walkKey}, ${runKey}, and ${runningKey}`);
                        }
                    }
                    
                    // Log BEFORE saving to localStorage
                    console.log(`%c📦 animationOffsets object BEFORE save:`, 'color: blue');
                    console.log(`   Keys: ${Object.keys(this.animationOffsets).join(', ')}`);
                    console.log(`   Count: ${Object.keys(this.animationOffsets).length}`);
                    
                    this.saveAnimationOffsets();
                    
                    // Verify it was saved
                    const allSaved = JSON.parse(localStorage.getItem('animationOffsets') || '{}');
                    console.log(`%c💾 All saved offsets in localStorage AFTER save:`, 'color: cyan');
                    console.log(`   Keys: ${Object.keys(allSaved).join(', ')}`);
                    console.log(`   Count: ${Object.keys(allSaved).length}`);
                    console.log(JSON.stringify(allSaved, null, 2));
                    
                    // Show visual notification
                    this.showSaveNotification(`✓ SAVED: ${key}`, true);
                    
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: green');
                console.log(`%c✓ SAVED CONFIGURATION FOR: ${key}`, 'color: green; font-weight: bold; font-size: 16px');
                console.log(`%c   X: ${this.weaponOffsetX.toFixed(1)}, Y: ${this.weaponOffsetY.toFixed(1)}, Hand: ${(this.weaponHandPercent*100).toFixed(1)}%`, 'color: lightgreen');
                if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                    console.log(`%c   This SPECIFIC FRAME (${this._selectedFrameIndex}) now has its own weapon position!`, 'color: yellow');
                    console.log(`   Each frame can have different weapon positions - adjust and save each one separately!`);
                } else {
                    console.log(`   This direction now has its own unique weapon position!`);
                }
                console.log(`   Total saved configurations: ${Object.keys(this.animationOffsets).length}`);
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: green');
                } else {
                    this.showSaveNotification('⚠ Cannot save - no character visible', false);
                    console.warn('⚠ Cannot save - no character visible');
                }
                return;
            }
            
            // SHIFT+D: Delete saved offset for this animation+direction
            if (e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (this._currentAnimation && this._currentDirection) {
                    const key = `${this._currentAnimation}_${this._currentDirection}`;
                    if (this.animationOffsets[key]) {
                        delete this.animationOffsets[key];
                        this.saveAnimationOffsets();
                        
                        // Show visual notification
                        this.showSaveNotification(`✗ DELETED: ${key}`, false);
                        
                        console.log(`%c✗ DELETED: ${key}`, 'color: red; font-weight: bold');
                        console.log(`   Remaining configurations: ${Object.keys(this.animationOffsets).length}`);
                    } else {
                        this.showSaveNotification(`ℹ No saved offset for ${key}`, false);
                        console.log(`ℹ No saved offset for ${key}`);
                    }
                }
                return;
            }
        }, true); // Use capture phase to intercept before inputHandler
    }
    
    /**
     * Load animation-specific offsets from localStorage
     */
    loadAnimationOffsets() {
        // Start with hardcoded positions from weaponPositionOffsets.js
        const hardcoded = { ...weaponPositionOffsets };
        const hardcodedCount = Object.keys(hardcoded).length;
        
        // Then merge with localStorage (for testing new positions)
        const stored = localStorage.getItem('animationOffsets');
        if (stored) {
            try {
                const localStorageOffsets = JSON.parse(stored);
                const localCount = Object.keys(localStorageOffsets).length;
                
                // Merge: localStorage overrides hardcoded (for testing)
                const merged = { ...hardcoded, ...localStorageOffsets };
                
                console.log(`%c📦 LOADED WEAPON POSITIONS`, 'color: cyan; font-weight: bold');
                console.log(`   Hardcoded: ${hardcodedCount} positions`);
                console.log(`   LocalStorage: ${localCount} positions`);
                console.log(`   Total: ${Object.keys(merged).length} positions`);
                if (localCount > 0) {
                    console.log(`   💡 TIP: Press Shift+E to export localStorage to file!`);
                }
                
                return merged;
            } catch (e) {
                console.warn('Failed to load localStorage offsets:', e);
                return hardcoded;
            }
        }
        
        if (hardcodedCount > 0) {
            console.log(`%c📦 LOADED ${hardcodedCount} HARDCODED WEAPON POSITIONS`, 'color: cyan; font-weight: bold');
        }
        
        return hardcoded;
    }
    
    /**
     * Save animation-specific offsets to localStorage
     */
    saveAnimationOffsets() {
        localStorage.setItem('animationOffsets', JSON.stringify(this.animationOffsets));
    }
    
    /**
     * Export weapon positions to JavaScript file for hardcoding into codebase
     */
    exportWeaponPositions() {
        const positions = this.animationOffsets;
        const count = Object.keys(positions).length;
        
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: lime');
        console.log(`%c📦 EXPORTING ${count} WEAPON POSITIONS TO FILE`, 'color: lime; font-weight: bold; font-size: 16px');
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: lime');
        
        // Generate JavaScript file content
        const fileContent = `/**
 * Weapon Position Offsets - AUTO-GENERATED
 * Generated: ${new Date().toLocaleString()}
 * Total Positions: ${count}
 * 
 * This file contains all saved weapon positioning data.
 * Import this into renderer.js to hardcode positions into the codebase.
 */

export const weaponPositionOffsets = ${JSON.stringify(positions, null, 4)};
`;
        
        // Create blob and download
        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'weaponPositionOffsets.js';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Downloaded: weaponPositionOffsets.js`);
        console.log(`   Move this file to: js/data/weaponPositionOffsets.js`);
        console.log(`   Then the positions will be hardcoded into your game!`);
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: lime');
        
        // Show notification
        this.showSaveNotification(`📦 Exported ${count} positions!`, true);
    }
    
    /**
     * Export ONLY southeast attack positions (for quick updates)
     */
    exportSoutheastAttackOnly() {
        // Filter only southeast attack positions
        const seAttackPositions = {};
        for (const [key, value] of Object.entries(this.animationOffsets)) {
            if (key.startsWith('attack_southeast')) {
                seAttackPositions[key] = value;
            }
        }
        
        const count = Object.keys(seAttackPositions).length;
        
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: orange');
        console.log(`%c📦 EXPORTING ${count} SOUTHEAST ATTACK POSITIONS ONLY`, 'color: orange; font-weight: bold; font-size: 16px');
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: orange');
        console.log(seAttackPositions);
        
        // Generate JavaScript snippet to add to existing file
        const fileContent = `// Southeast Attack Positions - ADD THESE TO weaponPositionOffsets.js
// Generated: ${new Date().toLocaleString()}
// Total: ${count} positions

${JSON.stringify(seAttackPositions, null, 4)}

// Copy the positions above and manually add them to js/data/weaponPositionOffsets.js
`;
        
        // Create blob and download
        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'southeast_attack_ONLY.txt';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Downloaded: southeast_attack_ONLY.txt`);
        console.log(`   Send this file to me and I'll add ONLY these positions!`);
        console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: orange');
        
        // Show notification
        this.showSaveNotification(`📦 Exported ${count} SE attack positions!`, true);
    }
    
    
    /**
     * Show a visual notification on screen
     */
    showSaveNotification(message, isSuccess = true) {
        // Clear existing timer if any
        if (this.saveNotificationTimer) {
            clearTimeout(this.saveNotificationTimer);
        }
        
        // Set the notification
        this.saveNotification = {
            message: message,
            isSuccess: isSuccess,
            timestamp: Date.now()
        };
        
        // Auto-hide after 3 seconds
        this.saveNotificationTimer = setTimeout(() => {
            this.saveNotification = null;
        }, 3000);
    }
    
    /**
     * Get offset for current animation and direction
     * @param {string} animation - Animation type (walk, run, etc)
     * @param {string} direction - Direction (north, south, etc)
     * @param {number} frameIndex - Optional frame index for per-frame offsets
     */
    getWeaponOffset(animation, direction, frameIndex = null) {
        // First try frame-specific offset (if frame index provided)
        if (frameIndex !== null && frameIndex !== undefined) {
            const frameKey = `${animation}_${direction}_frame${frameIndex}`;
            const frameSpecific = this.animationOffsets[frameKey];
            if (frameSpecific) {
                return frameSpecific;
            }
        }
        
        // Fall back to animation-wide offset
        const key = `${animation}_${direction}`;
        let specific = this.animationOffsets[key];

        // If run/running-specific offset not saved, fall back to walk (since they usually share)
        if (!specific && (animation === 'run' || animation === 'running')) {
            specific = this.animationOffsets[`walk_${direction}`] || 
                      this.animationOffsets[`run_${direction}`] || 
                      this.animationOffsets[`running_${direction}`];
        }
        // Or vice-versa (if only run/running was saved)
        if (!specific && animation === 'walk') {
            specific = this.animationOffsets[`run_${direction}`] || 
                      this.animationOffsets[`running_${direction}`];
        }
        
        // Return specific offset if exists, otherwise use base offset
        return {
            x: specific?.x !== undefined ? specific.x : this.weaponOffsetX,
            y: specific?.y !== undefined ? specific.y : this.weaponOffsetY,
            handPercent: specific?.handPercent !== undefined ? specific.handPercent : this.weaponHandPercent
        };
    }
    
    /**
     * Save weapon offsets to localStorage
     */
    saveWeaponOffsets() {
        localStorage.setItem('weaponOffsetX', this.weaponOffsetX.toString());
        localStorage.setItem('weaponOffsetY', this.weaponOffsetY.toString());
        localStorage.setItem('weaponHandPercent', this.weaponHandPercent.toString());
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.arenaWidth, this.arenaHeight);
    }

    /**
     * Render entire game scene
     * @param {Object} gameState - Current game state
     */
    render(gameState) {
        this.clear();
        
        // Draw background
        this.drawBackground();
        
        // Draw characters using their actual positions
        if (gameState.player1) {
            // In debug mode with manual direction, override player1's facing
            const player1Facing = (this.debugMode && this._manualDirectionOverride) 
                ? this._manualDirectionOverride 
                : gameState.player1.combatState.facing;
            
            this.drawCharacter(gameState.player1, { x: gameState.player1.x, y: gameState.player1.y }, player1Facing);
            
            // Draw attack range indicator when in war mode and weapon ready
            if (gameState.player1.combatState.warMode && gameState.player1.combatState.canSwing && gameState.player1.equipment.weaponEquipped) {
                this.drawAttackRange(gameState.player1);
            }
        }
        if (gameState.player2) {
            this.drawCharacter(gameState.player2, { x: gameState.player2.x, y: gameState.player2.y }, gameState.player2.combatState.facing);
            
            // Draw attack range indicator when in war mode and weapon ready
            if (gameState.player2.combatState.warMode && gameState.player2.combatState.canSwing && gameState.player2.equipment.weaponEquipped) {
                this.drawAttackRange(gameState.player2);
            }
        }
        
        // Update cursor based on war mode
        this.updateCursor(gameState);
        
        // Draw projectiles
        gameState.projectiles.forEach(projectile => {
            this.drawProjectile(projectile);
        });
        
        // Draw effects
        gameState.effects.forEach(effect => {
            this.drawEffect(effect);
        });

        // Draw debug overlay once per frame (player 1 only)
        if (this.debugMode && gameState.player1) {
            this.drawDebugOverlayForCharacter(gameState.player1);
        }
    }

    /**
     * Draw debug overlay for given character (used in debug mode)
     * @param {Character} character 
     */
    drawDebugOverlayForCharacter(character) {
        // Ensure we have current direction set (use character's facing if not set)
        if (!this._currentDirection) {
            this._currentDirection = character.combatState.facing || 'east';
        }
        // In debug mode, default to current animation state
        if (!this._currentAnimation) {
            this._currentAnimation = character.combatState.isMoving ? 'walk' : 'idle';
        }
        
        const x = character.x;
        const y = character.y;
        const charDrawHeight = this.charHeight * 1.5;
        const charWidth = this.charWidth * 1.5;
        const baseHandY = y - charDrawHeight + (charDrawHeight * this.weaponHandPercent);
        const weaponX = x + this.weaponOffsetX;
        const weaponY = baseHandY + this.weaponOffsetY;
        this.drawWeaponDebugOverlay(weaponX, weaponY, x, y, charDrawHeight, charWidth);
    }

    /**
     * Draw background/arena
     */
    drawBackground() {
        // Draw simple gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.arenaHeight);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.arenaWidth, this.arenaHeight);
        
        // Draw grid lines for arena floor
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        
        const tileSize = 44;
        for (let x = 0; x < this.arenaWidth; x += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.arenaHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.arenaHeight; y += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.arenaWidth, y);
            this.ctx.stroke();
        }
        
        // Draw center line
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.arenaWidth / 2, 0);
        this.ctx.lineTo(this.arenaWidth / 2, this.arenaHeight);
        this.ctx.stroke();
    }

    /**
     * Draw character
     * @param {Character} character - Character to draw
     * @param {Object} position - Position {x, y}
     * @param {string} facing - Direction facing
     */
    drawCharacter(character, position, facing) {
        if (!character.combatState.alive) {
            this.drawDeadCharacter(character, position);
            return;
        }
        
        const x = position.x;
        const y = position.y;
        
        // Check if in frame match mode (used throughout function)
        const isFrameMatchMode = this._frameMatchMode && this._selectedFrameIndex !== null;
        const inFrameMatchModeAtAll = this._frameMatchMode; // True whether animating OR paused
        
        // Try to draw character sprite with animation, fallback to colored rectangle
        const isPlayer1 = character.id === 1;
        let sprite = null;
        let frameX = 0;
        let frameY = 0;
        let frameWidth = 0;
        let frameHeight = 0;
        let totalFrames = 0;
        let animationProgress = 0;
        let currentFrameIndex = 0; // Store current frame index for weapon synchronization
        let usingBMPWithWeapon = false; // Track if we're using a BMP that already includes the weapon
        
        // Animation priority: Death > Hit > Casting > Attack > Idle
        
        // 1. Death animation (highest priority)
        if (!character.combatState.alive) {
            const deathSheet = this.assets.sprites['char_death_sheet'];
            if (deathSheet && deathSheet.complete && deathSheet.naturalWidth > 0) {
                frameWidth = 32;
                frameHeight = 62;
                totalFrames = Math.floor(deathSheet.naturalWidth / frameWidth);
                // Show last frame of death animation
                const currentFrame = totalFrames - 1;
                frameX = currentFrame * frameWidth;
                frameY = 0;
                sprite = deathSheet;
            }
        }
        // 2. Hit animation (if recently hit)
        else if (character.combatState.hitStunRemaining > 0) {
            const hitSheet = this.assets.sprites['char_hit_sheet'];
            if (hitSheet && hitSheet.complete && hitSheet.naturalWidth > 0) {
                frameWidth = 32;
                frameHeight = 62;
                totalFrames = Math.floor(hitSheet.naturalWidth / frameWidth);
                // Quick hit animation based on remaining stun time
                const hitProgress = 1 - (character.combatState.hitStunRemaining / 500); // 500ms hit stun
                const frameIndex = Math.floor(hitProgress * totalFrames);
                const currentFrame = Math.min(frameIndex, totalFrames - 1);
                frameX = currentFrame * frameWidth;
                frameY = 0;
                sprite = hitSheet;
            }
        }
        // 3. Casting animation
        else if (character.combatState.casting) {
            const castSheet = this.assets.sprites['char_cast_sheet'];
            if (castSheet && castSheet.complete && castSheet.naturalWidth > 0) {
                frameWidth = 32;
                frameHeight = 62;
                totalFrames = Math.floor(castSheet.naturalWidth / frameWidth);
                // Calculate cast progress
                const elapsed = Date.now() - character.combatState.castStartTime;
                const castProgress = Math.min(elapsed / character.combatState.castDuration, 1);
                // Loop casting animation
                const frameIndex = Math.floor((castProgress * totalFrames) % totalFrames);
                frameX = frameIndex * frameWidth;
                frameY = 0;
                sprite = castSheet;
            }
        }
        // 4. Attack animation (directional)
        // Show attack animation when attacking OR when in debug mode with attack selected
        // (including frame match mode with attack selected)
        else if ((character.combatState.isAttacking && character.equipment.weaponEquipped) ||
                 (this.debugMode && this._debugAnimationType === 'attack') ||
                 (this._frameMatchMode && this._debugAnimationType === 'attack')) {
            
            console.log(`🎭 ENTERING ATTACK ANIMATION BLOCK - debugMode: ${this.debugMode}, frameMatchMode: ${this._frameMatchMode}, debugAnimType: ${this._debugAnimationType}`);
            
            // NEW: Use BMP animation for character attacking (weapon drawn separately)
            if (this.assets.animations && this.assets.animations['char-attack-bash-2h']) {
                const facingDir = facing || character.combatState.facing || 'east';
                const attackAnim = this.assets.animations['char-attack-bash-2h'];
                const frames = attackAnim[facingDir];
                
                console.log(`📦 Attack BMP check - facingDir: ${facingDir}, frames available: ${frames ? frames.length : 'NONE'}`);
                
                if (frames && frames.length > 0) {
                    // Calculate which frame - use selected frame in frame match mode, otherwise loop
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Frame match mode: lock to selected frame
                        currentFrameIndex = Math.min(this._selectedFrameIndex, frames.length - 1);
                    } else {
                        // Normal mode OR frame match animating: loop continuously
                        const ATTACK_ANIMATION_DURATION = 1500; // 1.5 seconds per loop
                        const moveTime = Date.now() % ATTACK_ANIMATION_DURATION;
                        currentFrameIndex = Math.floor((moveTime / ATTACK_ANIMATION_DURATION) * frames.length);
                        currentFrameIndex = Math.min(currentFrameIndex, frames.length - 1);
                    }
                    
                    sprite = frames[currentFrameIndex];
                    frameWidth = sprite.width;
                    frameHeight = sprite.height;
                    totalFrames = frames.length;
                    
                    console.log(`🎬 Using BMP character attack animation: ${facingDir}, frame ${currentFrameIndex}/${totalFrames}`);
                }
            }
            
            // Fallback to sprite sheet attack animation if BMP not available
            if (!sprite) {
                const facingDir = facing || character.combatState.facing || 'east';
            const attackSheetKey = `char_attack_2h_${facingDir}_sheet`;
            let attackSheet = this.assets.sprites[attackSheetKey];
            
            // If directional not found, use the single attack sheet for all directions
            // This allows the game to work with just one exported attack animation
            if (!attackSheet || !attackSheet.complete) {
                attackSheet = this.assets.sprites['char_attack_2h_sheet'];
            }
            if (attackSheet && attackSheet.complete && attackSheet.naturalWidth > 0 && attackSheet.naturalHeight > 0) {
                // Animation plays at FIXED speed (not tied to cooldown!)
                // Attack animation: Slower for more realistic halberd swing - loops continuously
                const ATTACK_ANIMATION_DURATION = 1500; // 1.5 seconds per loop
                const moveTime = Date.now() % ATTACK_ANIMATION_DURATION;
                const swingProgress = moveTime / ATTACK_ANIMATION_DURATION;
                
                // Try to detect frame width - check if it's evenly divisible
                // Common frame widths: 32, 28, 25, etc.
                const sheetWidth = attackSheet.naturalWidth;
                const sheetHeight = attackSheet.naturalHeight;
                
                // Try to detect frame width intelligently
                // Check if sheet width is evenly divisible by common frame widths
                let detectedFrameWidth = 32; // Default
                let maxFrames = 0;
                
                // Try common frame widths (including 40px for this animation)
                for (const testWidth of [40, 32, 28, 25, 30, 26, 24, 38, 35, 33]) {
                    const testFrames = Math.floor(sheetWidth / testWidth);
                    const remainder = sheetWidth % testWidth;
                    
                    // Prefer widths that divide evenly (remainder < 5px tolerance)
                    if (remainder < 5 && testFrames > maxFrames && testFrames <= 20) {
                        detectedFrameWidth = testWidth;
                        maxFrames = testFrames;
                    }
                }
                
                // If no good match, try dividing by reasonable frame counts
                if (maxFrames === 0) {
                    for (const testFrameCount of [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        if (remainder < 5 && testWidth >= 20 && testWidth <= 50) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                }
                
                // Final fallback: use sheet width (single frame)
                if (maxFrames === 0) {
                    detectedFrameWidth = sheetWidth;
                    maxFrames = 1;
                }
                
                frameWidth = detectedFrameWidth;
                frameHeight = sheetHeight;
                totalFrames = maxFrames;
                
                // Calculate frame index - ensure we see all frames during the swing
                const frameIndex = Math.floor(swingProgress * totalFrames);
                const currentFrame = Math.min(Math.max(0, frameIndex), totalFrames - 1);
                
                frameX = currentFrame * frameWidth;
                frameY = 0;
                
                // Bounds check
                if (frameX + frameWidth <= sheetWidth && frameY + frameHeight <= sheetHeight) {
                    sprite = attackSheet;
                } else {
                    // Fallback to idle if bounds are invalid
                    console.warn(`Attack animation bounds invalid: frameX=${frameX}, frameWidth=${frameWidth}, sheetWidth=${sheetWidth}, totalFrames=${totalFrames}`);
                    }
                }
            }
        }
        // 5. Running/Walking animation (if actually moving) - check BEFORE idle
        // Only show movement animation if character is moving AND has a valid target
        // OR if in frame match mode with walk/running selected (animating OR paused)
        else if ((character.combatState.isMoving && 
                 character.targetX !== undefined && 
                 character.targetY !== undefined &&
                 (character.combatState.currentAnimation === 'walk' || character.combatState.currentAnimation === 'run'))
                 || (this._frameMatchMode && (this._debugAnimationType === 'walk' || this._debugAnimationType === 'running'))) {
            
            console.log(`🚶 ENTERING WALK/RUN ANIMATION BLOCK - debugAnimType: ${this._debugAnimationType}`);
            
            // Determine if running or walking based on character state
            // In frame match mode, use debug animation type if set
            const isRunning = (this._frameMatchMode)
                ? (this._debugAnimationType === 'running') // Respect debug animation type in frame match mode
                : (character.combatState.isRunning || character.combatState.currentAnimation === 'run');
            const animationType = isRunning ? 'run' : 'walk';
            
            // Character already uses UO direction names (east, northeast, north, etc.)
            // Use facing direction directly to load the correct animation
            // In frame match mode, prefer manual override or current direction
            const facingDir = (this._frameMatchMode)
                ? (this._manualDirectionOverride || this._currentDirection || facing || character.combatState.facing || 'east')
                : (facing || character.combatState.facing || 'east');
            
            // NEW: Use BMP animation for character running (weapon-only, separate)
            if (isRunning && this.assets.animations && this.assets.animations['char-run']) {
                const runAnim = this.assets.animations['char-run'];
                const frames = runAnim[facingDir];
                
                if (frames && frames.length > 0) {
                    // Calculate which frame - use selected frame in frame match mode, otherwise loop
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Frame match mode: lock to selected frame
                        currentFrameIndex = Math.min(this._selectedFrameIndex, frames.length - 1);
                    } else {
                        // Normal mode OR frame match animating: loop continuously
                        const animationDuration = 1500; // 1.5s for full cycle
                        const moveTime = Date.now() % animationDuration;
                        currentFrameIndex = Math.floor((moveTime / animationDuration) * frames.length);
                        currentFrameIndex = Math.min(currentFrameIndex, frames.length - 1);
                    }
                    
                    sprite = frames[currentFrameIndex];
                    frameWidth = sprite.width;
                    frameHeight = sprite.height;
                    totalFrames = frames.length;
                    
                    console.log(`🏃 Using BMP character running animation: ${facingDir}, frame ${currentFrameIndex}/${totalFrames}`);
                }
            }
            
            // Fallback to sprite sheet if BMP not available
            if (!sprite) {
            const animSheetKey = `char_${animationType}_${facingDir}_sheet`;
            const animSheet = this.assets.sprites[animSheetKey] || 
                            this.assets.sprites[`char_${animationType}_sheet`] ||
                            this.assets.sprites[`char_walk_${facingDir}_sheet`] ||
                            this.assets.sprites['char_walk_sheet'];
            
            // Debug logging - show what sprite we're trying to use
            if (!this._walkDebug || this._walkDebug.facing !== facingDir || this._walkDebug.type !== animationType) {
                const found = !!this.assets.sprites[animSheetKey];
                const fallback = !found && !!this.assets.sprites[`char_${animationType}_sheet`];
                const sheet = animSheet || this.assets.sprites['char_walk_sheet'];
                console.log(`[${animationType === 'run' ? 'Run' : 'Walk'}] Facing: ${facingDir} | Key: ${animSheetKey} | Found: ${found} | Fallback: ${fallback} | Sheet: ${sheet ? `${sheet.naturalWidth}x${sheet.naturalHeight}` : 'none'} | Moving: ${character.combatState.isMoving}`);
                this._walkDebug = { facing: facingDir, type: animationType };
            }
            
            if (animSheet && animSheet.complete && animSheet.naturalWidth > 0) {
                const sheetWidth = animSheet.naturalWidth;
                const sheetHeight = animSheet.naturalHeight;
                
                // Running/Walking animations typically have 10 frames (like walking)
                // Calculate frame width by dividing sheet width by 10
                const FRAME_COUNT = 10;
                let detectedFrameWidth = Math.floor(sheetWidth / FRAME_COUNT);
                let maxFrames = FRAME_COUNT;
                
                // Verify frame width is reasonable (should be 20-55px for UO sprites)
                if (detectedFrameWidth < 15 || detectedFrameWidth > 60) {
                    // Fallback: try other frame counts if 10 doesn't work
                    for (const testFrameCount of [9, 8, 6, 5, 4, 3, 2]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        
                        if (remainder <= 10 && testWidth >= 15 && testWidth <= 60) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                    
                    // Final fallback: single frame
                    if (maxFrames === 0) {
                        detectedFrameWidth = sheetWidth;
                        maxFrames = 1;
                    }
                }
                
                frameWidth = detectedFrameWidth;
                frameHeight = sheetHeight;
                totalFrames = maxFrames;
                
                // Debug logging
                if (!this._walkFrameDebug || this._walkFrameDebug.facing !== facingDir || this._walkFrameDebug.type !== animationType) {
                    console.log(`[${animationType === 'run' ? 'Run' : 'Walk'} Frames] ${facingDir}: Sheet=${sheetWidth}x${sheetHeight}, FrameWidth=${detectedFrameWidth}, Frames=${maxFrames}`);
                    this._walkFrameDebug = { facing: facingDir, type: animationType };
                }
                
                // Animate movement if multiple frames
                if (maxFrames > 1) {
                    let clampedFrameIndex;
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Lock to selected frame for matching
                        clampedFrameIndex = Math.min(this._selectedFrameIndex, maxFrames - 1);
                        // Debug: log when frame is locked
                        if (!this._frameLockDebug || this._frameLockDebug.frame !== clampedFrameIndex) {
                            console.log(`[Frame Match] Locked to frame ${clampedFrameIndex} for ${facingDir} direction`);
                            this._frameLockDebug = { frame: clampedFrameIndex, facing: facingDir };
                        }
                    } else {
                        // Normal animation
                    // Running animations play faster than walking
                    const animationDuration = isRunning ? 1500 : 2000; // 1.5s for run, 2s for walk
                    const moveTime = Date.now() % animationDuration;
                    const frameIndex = Math.floor((moveTime / animationDuration) * maxFrames);
                        clampedFrameIndex = Math.min(frameIndex, maxFrames - 1);
                    }
                    currentFrameIndex = clampedFrameIndex; // Store for weapon sync
                    
                    // Calculate frameX position - ensure it's aligned to frame boundaries
                    frameX = clampedFrameIndex * detectedFrameWidth;
                    
                    // Ensure frameX doesn't exceed sheet bounds
                    const maxFrameX = Math.max(0, sheetWidth - detectedFrameWidth);
                    frameX = Math.min(frameX, maxFrameX);
                } else {
                    frameX = 0;
                }
                frameY = 0;
                sprite = animSheet;
                }
            }
        }
        
        // 5b. Legacy walking animation check (for backwards compatibility)
        // Also show when in frame match mode
        else if ((character.combatState.isMoving && 
                 character.targetX !== undefined && 
                 character.targetY !== undefined &&
                 character.combatState.currentAnimation === 'walk')
                 || (this._frameMatchMode && this._selectedFrameIndex !== null)) {
            // Character already uses UO direction names (east, northeast, north, etc.)
            // Use facing direction directly to load the correct walking animation
            const facingDir = character.combatState.facing || 'east';
            const walkSheetKey = `char_walk_${facingDir}_sheet`;
            const walkSheet = this.assets.sprites[walkSheetKey] || this.assets.sprites['char_walk_sheet'];
            
            // Debug logging - show what sprite we're trying to use
            if (!this._walkDebug || this._walkDebug.facing !== facingDir) {
                const found = !!this.assets.sprites[walkSheetKey];
                const fallback = !found && !!this.assets.sprites['char_walk_sheet'];
                const sheet = walkSheet || this.assets.sprites['char_walk_sheet'];
                console.log(`[Walk] Facing: ${facingDir} | Key: ${walkSheetKey} | Found: ${found} | Fallback: ${fallback} | Sheet: ${sheet ? `${sheet.naturalWidth}x${sheet.naturalHeight}` : 'none'} | Moving: ${character.combatState.isMoving}`);
                this._walkDebug = { facing: facingDir };
            }
            
            if (walkSheet && walkSheet.complete && walkSheet.naturalWidth > 0) {
                const sheetWidth = walkSheet.naturalWidth;
                const sheetHeight = walkSheet.naturalHeight;
                
                // Walking animations always have exactly 10 frames
                // Calculate frame width by dividing sheet width by 10
                // This handles varying frame widths (25, 26, 32, 33, 40px per direction)
                const WALKING_FRAME_COUNT = 10;
                let detectedFrameWidth = Math.floor(sheetWidth / WALKING_FRAME_COUNT);
                let maxFrames = WALKING_FRAME_COUNT;
                
                // Verify frame width is reasonable (should be 20-45px for UO sprites)
                if (detectedFrameWidth < 15 || detectedFrameWidth > 50) {
                    // Fallback: try other frame counts if 10 doesn't work
                    for (const testFrameCount of [8, 6, 5, 4, 3, 2]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        
                        if (remainder <= 10 && testWidth >= 15 && testWidth <= 50) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                    
                    // Final fallback: single frame
                    if (maxFrames === 0) {
                        detectedFrameWidth = sheetWidth;
                        maxFrames = 1;
                    }
                }
                
                frameWidth = detectedFrameWidth;
                frameHeight = sheetHeight;
                totalFrames = maxFrames;
                
                // Debug logging
                if (!this._walkFrameDebug || this._walkFrameDebug.facing !== facingDir) {
                    console.log(`[Walk Frames] ${facingDir}: Sheet=${sheetWidth}x${sheetHeight}, FrameWidth=${detectedFrameWidth}, Frames=${maxFrames}, Calculated=${sheetWidth}/${maxFrames}=${Math.floor(sheetWidth/maxFrames)}`);
                    this._walkFrameDebug = { facing: facingDir };
                }
                
                // Animate walking if multiple frames
                if (maxFrames > 1) {
                    let clampedFrameIndex;
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Lock to selected frame for matching
                        clampedFrameIndex = Math.min(this._selectedFrameIndex, maxFrames - 1);
                    } else {
                        // Normal animation
                    const walkTime = Date.now() % 2000; // 2 second cycle for smoother animation
                    const frameIndex = Math.floor((walkTime / 2000) * maxFrames);
                        clampedFrameIndex = Math.min(frameIndex, maxFrames - 1);
                    }
                    currentFrameIndex = clampedFrameIndex; // Store for weapon sync
                    
                    // Calculate frameX position - ensure it's aligned to frame boundaries
                    frameX = clampedFrameIndex * detectedFrameWidth;
                    
                    // Ensure frameX doesn't exceed sheet bounds
                    // For 400px sheet with 40px frames: max frameX should be 9 * 40 = 360px
                    const maxFrameX = Math.max(0, sheetWidth - detectedFrameWidth);
                    frameX = Math.min(frameX, maxFrameX);
                    
                    // Debug logging for east/west specifically
                    if (facingDir === 'east' || facingDir === 'west') {
                        if (!this._ewDebug || this._ewDebug.frame !== clampedFrameIndex) {
                            console.log(`[EW Debug] ${facingDir}: frameIndex=${clampedFrameIndex}, frameX=${frameX}, frameWidth=${detectedFrameWidth}, sheetWidth=${sheetWidth}, maxFrameX=${maxFrameX}`);
                            this._ewDebug = { frame: clampedFrameIndex };
                        }
                    }
                } else {
                    frameX = 0;
                }
                frameY = 0;
                sprite = walkSheet;
            }
        }
        
        // 6. Idle sprite (default) - use directional idle if available
        // Force idle if not moving (prevents stuck walk/run animations)
        // BUT skip idle if in frame match mode (we want to show selected animation frames)
        const isSpecialAnimation = character.combatState.currentAnimation === 'attack' || 
                                   character.combatState.currentAnimation === 'cast' || 
                                   character.combatState.currentAnimation === 'getHit' || 
                                   character.combatState.currentAnimation === 'death';
        
        // Don't show idle if in frame match mode (even when animating) or if we already have a sprite
        if (!inFrameMatchModeAtAll && (!sprite || (!character.combatState.isMoving && !isSpecialAnimation))) {
            // Reset animation state to idle if not moving and not in special animation and not in frame match mode
            if (!character.combatState.isMoving && !isSpecialAnimation) {
                character.combatState.currentAnimation = 'idle';
            }
            
            // Try directional idle animation based on facing direction
            // Use idle 1 (static) by default, switch to idle 2 (animated) every 20 seconds
            const facingDir = facing || character.combatState.facing || 'east';
            
            // Check if we should use idle 2 (animated idle kicks in every 20 seconds)
            // DISABLED: Character idle2 animations don't exist yet, only idle1 (idle-static)
            const IDLE2_CYCLE_DURATION = 20000; // 20 seconds
            const IDLE2_ANIMATION_DURATION = 3000; // 3 seconds of animation
            const cycleTime = Date.now() % IDLE2_CYCLE_DURATION;
            let useIdle2 = false; // DISABLED - no char idle2 sprites yet
            
            if (useIdle2) {
                // Use idle 2 (animated idle) - kicks in every 20 seconds
                const idle2SheetKey = `char_idle2_${facingDir}_sheet`;
                const idle2Sheet = this.assets.sprites[idle2SheetKey] || this.assets.sprites['char_idle2_east_sheet'];
                
                if (idle2Sheet && idle2Sheet.complete && idle2Sheet.naturalWidth > 0) {
                    // Idle 2 animations are multi-frame (animated idle)
                    sprite = idle2Sheet;
                    const sheetWidth = idle2Sheet.naturalWidth;
                    const sheetHeight = idle2Sheet.naturalHeight;
                    
                    // Detect frame count (idle 2 typically has 2-10 frames)
                    const FRAME_COUNT = 10;
                    let detectedFrameWidth = Math.floor(sheetWidth / FRAME_COUNT);
                    let maxFrames = FRAME_COUNT;
                    
                    // Verify frame width is reasonable
                    if (detectedFrameWidth < 15 || detectedFrameWidth > 60) {
                        for (const testFrameCount of [9, 8, 6, 5, 4, 3, 2, 1]) {
                            const testWidth = Math.floor(sheetWidth / testFrameCount);
                            const remainder = sheetWidth % testFrameCount;
                            
                            if (remainder <= 10 && testWidth >= 15 && testWidth <= 60) {
                                detectedFrameWidth = testWidth;
                                maxFrames = testFrameCount;
                                break;
                            }
                        }
                        
                        if (maxFrames === 0) {
                            detectedFrameWidth = sheetWidth;
                            maxFrames = 1;
                        }
                    }
                    
                    frameWidth = detectedFrameWidth;
                    frameHeight = sheetHeight;
                    totalFrames = maxFrames;
                    
                    // Animate idle 2 during the 3-second animation window
                    if (maxFrames > 1) {
                        const idle2Progress = cycleTime / IDLE2_ANIMATION_DURATION; // 0 to 1
                        const frameIndex = Math.floor(idle2Progress * maxFrames);
                        const clampedFrameIndex = Math.min(frameIndex, maxFrames - 1);
                        frameX = clampedFrameIndex * detectedFrameWidth;
                    } else {
                        frameX = 0;
                    }
                    frameY = 0;
                } else {
                    // Fallback to idle 1 if idle 2 not available
                    useIdle2 = false;
                }
            }
            
            if (!useIdle2) {
                // Use idle 1 (static idle) - default
                const idleSheetKey = `char_idle_${facingDir}_sheet`;
                const idleSheet = this.assets.sprites[idleSheetKey] || this.assets.sprites['char_idle_sheet'] || this.assets.sprites['char_p1_idle'];
                
                if (idleSheet && idleSheet.complete && idleSheet.naturalWidth > 0) {
                    sprite = idleSheet;
                    // Idle animations should ALWAYS be single-frame
                    // Use the entire sprite sheet as one frame
                    frameWidth = idleSheet.naturalWidth;
                    frameHeight = idleSheet.naturalHeight;
                    frameX = 0;
                    frameY = 0;
                } else {
                    // Fallback to old idle sprites
                    const spriteKey = isPlayer1 ? 'char_p1_idle' : 'char_p2_idle';
                    sprite = this.assets.sprites[spriteKey];
                }
            }
        }
        
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw sprite scaled to match UO's zoomed display (reduced from 2.5x)
            const scale = 1.5;
            const drawWidth = (frameWidth || sprite.naturalWidth) * scale;
            const drawHeight = (frameHeight || sprite.naturalHeight) * scale;
            
            // Draw sprite - try frame extraction if we have valid frame dimensions
            // Always ensure we draw something, even if frame extraction fails
            if (frameWidth > 0 && frameHeight > 0 && frameWidth <= sprite.naturalWidth && frameHeight <= sprite.naturalHeight) {
                // Bounds check - ensure we're not going outside the sprite sheet
                const maxFrameX = Math.max(0, sprite.naturalWidth - frameWidth);
                const maxFrameY = Math.max(0, sprite.naturalHeight - frameHeight);
                
                // Clamp frameX and frameY to valid range
                const clampedFrameX = Math.max(0, Math.min(frameX, maxFrameX));
                const clampedFrameY = Math.max(0, Math.min(frameY, maxFrameY));
                
                // Verify frame is within bounds before drawing
                const frameEndX = clampedFrameX + frameWidth;
                const frameEndY = clampedFrameY + frameHeight;
                
                if (frameEndX <= sprite.naturalWidth && frameEndY <= sprite.naturalHeight && clampedFrameX >= 0 && clampedFrameY >= 0) {
                    // Draw specific frame from sprite sheet
                    this.ctx.drawImage(
                        sprite,
                        clampedFrameX, clampedFrameY, frameWidth, frameHeight,  // Source (sprite sheet)
                        x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight  // Destination
                    );
                } else {
                    // Invalid frame bounds - draw full sprite as fallback
                    this.ctx.drawImage(
                        sprite,
                        x - drawWidth / 2,
                        y - drawHeight,
                        drawWidth,
                        drawHeight
                    );
                }
            } else {
                // Draw full sprite (idle or single-frame, or when frame dimensions aren't set or invalid)
                this.ctx.drawImage(
                    sprite,
                    x - drawWidth / 2,
                    y - drawHeight,
                    drawWidth,
                    drawHeight
                );
            }
            
            // WAR MODE: Add red tint overlay
            if (character.combatState.warMode) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // 30% red overlay
                this.ctx.fillRect(
                    x - drawWidth / 2,
                    y - drawHeight,
                    drawWidth,
                    drawHeight
                );
            }
            
            // SWING COOLDOWN INDICATOR: Show when weapon equipped (always show, even when ready)
            if (character.equipment.weaponEquipped) {
                this.drawSwingCooldown(character, x, y);
            }
        } else {
            // Fallback: Character body (colored rectangle)
            this.ctx.fillStyle = isPlayer1 ? '#4169e1' : '#dc143c';
            this.ctx.fillRect(
                x - this.charWidth / 2, 
                y - this.charHeight, 
                this.charWidth, 
                this.charHeight
            );
            
            // Character outline
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                x - this.charWidth / 2, 
                y - this.charHeight, 
                this.charWidth, 
                this.charHeight
            );
        }
        
        // Determine if weapon should be drawn behind character (NE, N, NW, W)
        const facingDir = facing || character.combatState.facing || 'east';
        // Weapon should be drawn BEHIND character when facing: NE, N, NW, W, E
        // Weapon should be drawn IN FRONT when facing: SE, S, SW
        const weaponBehind = facingDir === 'northeast' || facingDir === 'north' || 
                             facingDir === 'northwest' || facingDir === 'west' || 
                             facingDir === 'east';
        
        // Pass walking animation frame info if walking/running and frame info is valid
        // OR if in frame match mode (to show walk weapon frames)
        const isWalking = character.combatState.isMoving && 
                         (character.combatState.currentAnimation === 'walk' || character.combatState.currentAnimation === 'run');
        // In frame match mode, respect debug animation type for weapon positioning
        const isRunningForWeapon = (isFrameMatchMode && this._debugAnimationType === 'running') 
                                   ? true 
                                   : character.combatState.isRunning;
        const walkFrameInfo = ((isWalking || isFrameMatchMode) && frameWidth > 0 && totalFrames > 0) 
                              ? { frameX, frameWidth, totalFrames, frameIndex: currentFrameIndex, isRunning: isRunningForWeapon } 
                              : null;
        // Pass character sprite info for proper weapon positioning
        const charSpriteInfo = sprite && sprite.complete ? {
            height: frameHeight || sprite.naturalHeight,
            scale: 1.5
        } : null;
        
        // Draw weapon BEHIND character if facing NE, N, NW, W, or E
        if (character.equipment.weaponEquipped && weaponBehind) {
            this.drawWeapon(character, x, y, facing, walkFrameInfo, charSpriteInfo, true);
        }
        
        // Draw weapon IN FRONT of character if facing other directions (SE, S, SW)
        if (character.equipment.weaponEquipped && !weaponBehind) {
            this.drawWeapon(character, x, y, facing, walkFrameInfo, charSpriteInfo, false);
        }
        
        // Draw casting effect
        if (character.combatState.casting) {
            this.drawCastingEffect(character, x, y);
        }
        
        // Draw hit flash effect
        if (character.combatState.hitStunRemaining > 0) {
            this.drawHitFlash(x, y);
        }
        
        // Draw health bar above character (higher for Player 1 to avoid overlap)
        // Character sprite top is at: y - drawHeight (where drawHeight is scaled sprite height)
        const healthBarOffset = character.id === 1 ? 45 : 35; // Player 1 higher to avoid overlap
        this.drawCharacterHealthBar(character, x, y - this.charHeight - healthBarOffset);
    }

    /**
     * Draw dead character
     * @param {Character} character - Dead character
     * @param {Object} position - Position
     */
    drawDeadCharacter(character, position) {
        const x = position.x;
        const y = position.y;
        
        // Draw corpse (horizontal rectangle)
        const isPlayer1 = character.id === 1;
        this.ctx.fillStyle = isPlayer1 ? '#1e3a8a' : '#8b0000';
        this.ctx.fillRect(
            x - this.charHeight / 2, 
            y - 20, 
            this.charHeight, 
            20
        );
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            x - this.charHeight / 2, 
            y - 20, 
            this.charHeight, 
            20
        );
        
        // Draw "DEAD" text
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DEAD', x, y - 5);
    }

    /**
     * Draw weapon on character
     * @param {Character} character - Character
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} facing - Direction
     * @param {Object} walkFrameInfo - Walking animation frame info (frameX, frameWidth, totalFrames, isRunning)
     * @param {Object} charSpriteInfo - Character sprite info (height, scale) for proper positioning
     */
    drawWeapon(character, x, y, facing, walkFrameInfo = null, charSpriteInfo = null, drawBehind = false) {
        // Check if in frame match mode (used throughout function)
        const isFrameMatchMode = this._frameMatchMode && this._selectedFrameIndex !== null;
        
        // Track current animation and direction for debug mode
        // In debug mode with manual override, use the override direction
        const facingDir = (this.debugMode && this._manualDirectionOverride) 
            ? this._manualDirectionOverride 
            : (character.combatState.facing || 'east');
        
        // Determine animation type
        let animationType = 'idle';
        if (character.combatState.isAttacking) {
            animationType = 'attack';
        } else if (character.combatState.isMoving) {
            animationType = character.combatState.isRunning ? 'run' : 'walk';
        }
        
        // Frame match mode respects debug animation type if set
        if (this._frameMatchMode && this._debugAnimationType) {
            animationType = this._debugAnimationType;
        } else if (this._frameMatchMode && animationType === 'idle') {
            // Default to walk if no debug animation type is set
            animationType = 'walk';
        }
        
        // DEBUG: Show facing direction in real-time on screen
        // (removed console spam, now shown in debug overlay instead)
        
        // Store for debug mode (so Shift+S knows what to save)
        const previousAnimKey = this._currentAnimKey;
        const currentAnimKey = `${animationType}_${facingDir}`;
        this._currentAnimation = animationType;
        this._currentDirection = facingDir;
        this._currentAnimKey = currentAnimKey;
        
        // DISABLE AUTO-LOADING IN DEBUG MODE - it causes weapon to snap back while adjusting
        // User will manually load values when they want them by locking to a direction
        // This prevents the frustrating snap-back behavior
        
        // Get animation-specific offsets
        // ALWAYS use saved per-direction values (prevents snapping)
        // In debug mode, base values (weaponOffsetX/Y) are just for adjustment before saving
        const savedOffsets = this.getWeaponOffset(animationType, facingDir);
        
        // In debug mode: Use base values (what user is currently adjusting)
        // In normal mode: Use saved values for this direction
        const offsets = this.debugMode ? {
            x: this.weaponOffsetX,
            y: this.weaponOffsetY,
            handPercent: this.weaponHandPercent
        } : savedOffsets;
        
        // Debug: Log what offsets we're using (only log when changes occur)
        if (!this._lastOffsetLog || this._lastOffsetLog.key !== currentAnimKey || Math.abs(this._lastOffsetLog.x - offsets.x) > 0.1) {
            console.log(`%c[Weapon Offsets] ${currentAnimKey}:`, 'color: orange', 
                `X=${offsets.x.toFixed(1)}, Y=${offsets.y.toFixed(1)}, Hand=${(offsets.handPercent*100).toFixed(1)}%`,
                `(${this.debugMode ? 'DEBUG MODE - using base' : 'NORMAL - using saved'})`);
            this._lastOffsetLog = { key: currentAnimKey, x: offsets.x };
        }
        
        // During attacks, draw animated halberd weapon synchronized with attack animation
        // OR in debug mode with attack selected OR in frame match mode with attack selected
        if ((character.combatState.isAttacking && character.equipment.weaponEquipped) ||
            (this.debugMode && this._debugAnimationType === 'attack' && character.equipment.weaponEquipped) ||
            (this._frameMatchMode && this._debugAnimationType === 'attack' && character.equipment.weaponEquipped)) {
            // Try BMP weapon animation first
            if (this.assets.animations && this.assets.animations['weapon-attack-bash-2h-halberd']) {
                const weaponAnim = this.assets.animations['weapon-attack-bash-2h-halberd'];
                const frames = weaponAnim[facingDir];
                
                console.log(`🔥🔥🔥 ATTACK WEAPON CHECK: facingDir="${facingDir}", frames available=${frames ? frames.length : 'NONE'}, all directions=${Object.keys(weaponAnim).join(',')}`);
                
                if (frames && frames.length > 0) {
                    // Calculate which frame - use selected frame in frame match mode, otherwise loop
                    let clampedFrameIndex;
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Frame match mode: lock to selected frame
                        clampedFrameIndex = Math.min(this._selectedFrameIndex, frames.length - 1);
                    } else {
                        // Normal mode: loop continuously
                        const ATTACK_ANIMATION_DURATION = 1500; // 1.5 seconds per loop
                        const moveTime = Date.now() % ATTACK_ANIMATION_DURATION;
                        const frameIndex = Math.floor((moveTime / ATTACK_ANIMATION_DURATION) * frames.length);
                        clampedFrameIndex = Math.min(frameIndex, frames.length - 1);
                    }
                    
                    const weaponSprite = frames[clampedFrameIndex];
                    console.log(`🔥 ATTACK WEAPON SPRITE: facingDir="${facingDir}", frame ${clampedFrameIndex}/${frames.length}, src=${weaponSprite ? weaponSprite.src.substring(weaponSprite.src.lastIndexOf('/')) : 'NONE'}`);
                    
                    // Apply saved position offsets - USE FRAME-SPECIFIC OFFSETS!
                    const frameOffsets = this.debugMode ? offsets : this.getWeaponOffset('attack', facingDir, clampedFrameIndex);
                    const weaponX = x + frameOffsets.x;
                    const weaponY = y - 50 + frameOffsets.y;
                    const scale = 1.5;
                    const drawWidth = weaponSprite.width * scale;
                    const drawHeight = weaponSprite.height * scale;
                    
                    this.ctx.drawImage(
                        weaponSprite,
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight
                    );
                    
                    console.log(`⚔️ Using BMP weapon attack animation: ${facingDir}, frame ${clampedFrameIndex}/${frames.length}`);
                    return; // Exit early, weapon drawn
                }
            }
            
            // Fallback to sprite sheet
            const halberdSheetKey = `halberd_weapon_${facingDir}_sheet`;
            const halberdSheet = this.assets.sprites[halberdSheetKey] || this.assets.sprites['halberd_weapon_east_sheet'];
            
            if (halberdSheet && halberdSheet.complete && halberdSheet.naturalWidth > 0) {
                // Weapon animation plays at FIXED speed (same as character)
                // Attack animation: Slower for more realistic halberd swing - loops continuously
                const ATTACK_ANIMATION_DURATION = 1500; // 1.5 seconds per loop
                const moveTime = Date.now() % ATTACK_ANIMATION_DURATION;
                const swingProgress = moveTime / ATTACK_ANIMATION_DURATION;
                
                // Halberd weapon animations have 10 frames (same as character attack)
                const FRAME_COUNT = 10;
                const sheetWidth = halberdSheet.naturalWidth;
                const sheetHeight = halberdSheet.naturalHeight;
                
                // Detect frame width (handle varying widths like 62px, 40px, etc.)
                let detectedFrameWidth = Math.floor(sheetWidth / FRAME_COUNT);
                let maxFrames = FRAME_COUNT;
                
                // Verify frame width is reasonable (should be 20-80px for UO weapon sprites)
                if (detectedFrameWidth < 15 || detectedFrameWidth > 100) {
                    // Try other frame counts if 10 doesn't work
                    for (const testFrameCount of [9, 8, 11, 12, 6, 5]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        
                        if (remainder <= 10 && testWidth >= 15 && testWidth <= 100) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                    
                    // Final fallback: single frame
                    if (maxFrames === 0) {
                        detectedFrameWidth = sheetWidth;
                        maxFrames = 1;
                    }
                }
                
                // Calculate current frame index synchronized with attack animation
                const frameIndex = Math.floor(swingProgress * maxFrames);
                const clampedFrameIndex = Math.min(frameIndex, maxFrames - 1);
                const frameX = clampedFrameIndex * detectedFrameWidth;
                
                // Draw the halberd weapon animation frame
                const scale = 1.5;
                const drawWidth = detectedFrameWidth * scale;
                const drawHeight = sheetHeight * scale;
                
                // Position weapon at character position (weapon is part of attack animation)
                const weaponX = x;
                const weaponY = y - 50;
                
                this.ctx.drawImage(
                    halberdSheet,
                    frameX, 0, detectedFrameWidth, sheetHeight,  // Source (sprite sheet frame)
                    weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight  // Destination
                );
                
                return; // Exit early, weapon drawn
            }
        }
        
        // During walking/running, draw halberd weapon (fallback to idle if no walking/running weapon animation exists)
        // Also show walk weapon in frame match mode (even if not moving)
        if (walkFrameInfo && ((character.combatState.isMoving && 
            (character.combatState.currentAnimation === 'walk' || character.combatState.currentAnimation === 'run'))
            || isFrameMatchMode)) {
            // Get facing direction (already declared at top of function)
            
            // Check if weapon should be drawn behind for this direction
            const shouldDrawBehind = facingDir === 'northeast' || facingDir === 'north' || 
                                     facingDir === 'northwest' || facingDir === 'west' || 
                                     facingDir === 'east';
            
            // Only draw walking/running weapon if drawing order matches
            if (drawBehind !== shouldDrawBehind) {
                return; // Don't draw here - will be drawn in correct pass
            }
            
            // Try BMP weapon animation (use running-halberd for both walk AND run)
            // This prevents double-drawing from sprite sheet fallback
            if (character.equipment.weapon.name === 'Halberd' &&
                this.assets.animations && this.assets.animations['weapon-running-halberd']) {
                const weaponAnim = this.assets.animations['weapon-running-halberd'];
                const frames = weaponAnim[facingDir];
                
                console.log(`🔍 Checking BMP weapon for ${facingDir}: frames available = ${frames ? frames.length : 'NONE'}`);
                
                if (frames && frames.length > 0) {
                    // Sync with character animation frame
                    const frameIndex = walkFrameInfo.frameIndex || 0;
                    const clampedFrameIndex = Math.min(frameIndex, frames.length - 1);
                    const weaponSprite = frames[clampedFrameIndex];
                    
                    // Apply saved position offsets - USE FRAME-SPECIFIC OFFSETS!
                    // Use 'walk' or 'running' depending on actual animation type
                    const animType = walkFrameInfo.isRunning ? 'running' : 'walk';
                    const frameOffsets = this.debugMode ? offsets : this.getWeaponOffset(animType, facingDir, clampedFrameIndex);
                    const charScale = 1.5;
                    const charHeight = charSpriteInfo ? charSpriteInfo.height : 60;
                    const charDrawHeight = charHeight * charScale;
                    const baseHandY = y - charDrawHeight + (charDrawHeight * frameOffsets.handPercent);
                    const weaponX = x + frameOffsets.x;
                    const weaponY = baseHandY + frameOffsets.y;
                    const scale = 1.5;
                    const drawWidth = weaponSprite.width * scale;
                    const drawHeight = weaponSprite.height * scale;
                    
                    this.ctx.drawImage(
                        weaponSprite,
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight
                    );
                    
                    const animTypeLabel = walkFrameInfo.isRunning ? 'running' : 'walking';
                    console.log(`✅ Using BMP weapon ${animTypeLabel} animation: ${facingDir}, frame ${clampedFrameIndex}/${frames.length}`);
                    return; // Exit early, weapon drawn
                } else {
                    console.warn(`⚠️ No BMP frames for ${facingDir} - falling back to sprite sheets`);
                }
            } else {
                console.log(`⚠️ BMP animation not available, using sprite sheet fallback`);
            }
            
            // IMPORTANT: If we have BMP animations available, DON'T use sprite sheet fallback
            // This prevents double-drawing
            if (character.equipment.weapon.name === 'Halberd' &&
                this.assets.animations && this.assets.animations['weapon-running-halberd']) {
                // We have BMP animations, so we should have already drawn and returned above
                // If we reached here, it means the BMP failed to draw (no frames for this direction)
                // For now, just return to prevent double-drawing
                console.warn(`❌ BMP should have drawn but didn't - skipping sprite sheet to prevent double draw`);
                return;
            }
            
            // Fallback to sprite sheets (only if NO BMP animations exist at all)
            const walkHalberdSheetKey = `halberd_walk_${facingDir}_sheet`;
            const runHalberdSheetKey = `halberd_run_${facingDir}_sheet`;
            let halberdSheet = this.assets.sprites[walkHalberdSheetKey] || 
                              this.assets.sprites[runHalberdSheetKey] ||
                              this.assets.sprites['halberd_walk_east_sheet'] ||
                              this.assets.sprites['halberd_run_east_sheet'];
            
            // If no dedicated walking/running weapon animation exists, use attack weapon animation
            // This makes the weapon animate during movement (synced with character animation)
            if (!halberdSheet || !halberdSheet.complete || halberdSheet.naturalWidth === 0) {
                // Use attack weapon animation for movement - it will be synced with walk/run frames
                const attackHalberdSheetKey = `halberd_weapon_${facingDir}_sheet`;
                halberdSheet = this.assets.sprites[attackHalberdSheetKey] || 
                              this.assets.sprites['halberd_weapon_east_sheet'];
            }
            
            // Final fallback to idle weapon animation if attack animation doesn't exist
            if (!halberdSheet || !halberdSheet.complete || halberdSheet.naturalWidth === 0) {
                const idleHalberdSheetKey = `halberd_idle_${facingDir}_sheet`;
                halberdSheet = this.assets.sprites[idleHalberdSheetKey] || 
                              this.assets.sprites['halberd_idle_east_sheet'];
            }
            
            if (halberdSheet && halberdSheet.complete && halberdSheet.naturalWidth > 0) {
                const sheetWidth = halberdSheet.naturalWidth;
                const sheetHeight = halberdSheet.naturalHeight;
                
                // Check if this is a multi-frame animation (walking/running/attack) or single-frame (idle fallback)
                // Attack weapon animations have 10 frames, idle has 1 frame
                const isMultiFrameWeapon = halberdSheet.naturalWidth > halberdSheet.naturalHeight * 2;
                
                if (!isMultiFrameWeapon) {
                    // Draw idle weapon statically (no animation during movement)
                    const scale = 1.5;
                    const drawWidth = sheetWidth * scale;
                    const drawHeight = sheetHeight * scale;
                    
                    // Position weapon to align with character's hand (same as idle positioning)
                    const charScale = 1.5;
                    const charHeight = charSpriteInfo ? charSpriteInfo.height : 60;
                    const charDrawHeight = charHeight * charScale;
                    const baseHandY = y - charDrawHeight + (charDrawHeight * offsets.handPercent);
                    const weaponX = x + offsets.x;
                    const weaponY = baseHandY + offsets.y;
                    
                    this.ctx.drawImage(
                        halberdSheet,
                        0, 0, sheetWidth, sheetHeight,
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight
                    );
                    
                } else {
                    // Multi-frame walking/running weapon animation
                const FRAME_COUNT = 10;
                let detectedFrameWidth = Math.floor(sheetWidth / FRAME_COUNT);
                let maxFrames = FRAME_COUNT;
                
                // Verify frame width is reasonable
                if (detectedFrameWidth < 15 || detectedFrameWidth > 100) {
                    for (const testFrameCount of [9, 8, 11, 12, 6, 5]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        
                        if (remainder <= 10 && testWidth >= 15 && testWidth <= 100) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                    
                    if (maxFrames === 0) {
                        detectedFrameWidth = sheetWidth;
                        maxFrames = 1;
                    }
                }
                
                    // In frame match mode, use selected frame; otherwise sync with character
                    let weaponFrameIndex;
                    if (this._frameMatchMode && this._selectedFrameIndex !== null) {
                        // Lock to selected frame for matching
                        weaponFrameIndex = Math.min(this._selectedFrameIndex, maxFrames - 1);
                        // Debug: Confirm weapon frame matches selected frame
                        if (!this._weaponFrameLockDebug || this._weaponFrameLockDebug.frame !== weaponFrameIndex) {
                            console.log(`[Weapon Frame Match] Weapon locked to frame ${weaponFrameIndex} (char should also be frame ${this._selectedFrameIndex})`);
                            this._weaponFrameLockDebug = { frame: weaponFrameIndex };
                        }
                    } else {
                        // Normal sync: use character's exact frame index
                        const charFrameIndex = walkFrameInfo.frameIndex || 0;
                        weaponFrameIndex = Math.min(charFrameIndex, maxFrames - 1);
                    }
                    const clampedHalberdFrameIndex = weaponFrameIndex;
                const halberdFrameX = clampedHalberdFrameIndex * detectedFrameWidth;
                    
                    // Get frame-specific offsets (if saved), otherwise use general offsets
                    const frameOffsets = this.debugMode ? offsets : this.getWeaponOffset(animationType, facingDir, clampedHalberdFrameIndex);
                
                // Draw the halberd weapon animation frame
                const scale = 1.5;
                const drawWidth = detectedFrameWidth * scale;
                const drawHeight = sheetHeight * scale;
                
                    const weaponX = x + frameOffsets.x;
                    const weaponY = y - 50 + frameOffsets.y;
                
                this.ctx.drawImage(
                    halberdSheet,
                        halberdFrameX, 0, detectedFrameWidth, sheetHeight,
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight
                    );
                    
                    // Debug visualization
                }
                
                return; // Exit early, weapon drawn
            }
        }
        
        // For idle, use idle 1 (static) by default, switch to idle 2 (animated) every 20 seconds
        // Synchronize halberd weapon idle animation with character idle animation
        // IMPORTANT: Only draw idle weapon if drawBehind matches the expected drawing order
        // facingDir already declared at top of function
        const shouldDrawBehind = facingDir === 'northeast' || facingDir === 'north' || 
                                 facingDir === 'northwest' || facingDir === 'west' || 
                                 facingDir === 'east';
        
        // Only draw idle weapon if the drawing order matches
        // If drawBehind is true, only draw if shouldDrawBehind is also true
        // If drawBehind is false, only draw if shouldDrawBehind is also false
        if (drawBehind !== shouldDrawBehind) {
            return; // Don't draw idle weapon here - it will be drawn in the correct pass
        }
        
        // Check if we should use idle 2 (animated idle kicks in every 20 seconds)
        // DISABLED: Keeping weapon idle2 disabled to match character (no char idle2 sprites yet)
        const IDLE2_CYCLE_DURATION = 20000; // 20 seconds
        const IDLE2_ANIMATION_DURATION = 3000; // 3 seconds of animation
        const cycleTime = Date.now() % IDLE2_CYCLE_DURATION;
        let useIdle2 = false; // DISABLED - keeping consistent with character idle1
        
        if (useIdle2) {
            // Use idle 2 halberd weapon animation (animated idle) - kicks in every 20 seconds
            const idle2HalberdSheetKey = `halberd_idle2_${facingDir}_sheet`;
            const idle2HalberdSheet = this.assets.sprites[idle2HalberdSheetKey] || this.assets.sprites['halberd_idle2_east_sheet'];
            
            if (idle2HalberdSheet && idle2HalberdSheet.complete && idle2HalberdSheet.naturalWidth > 0) {
                // Idle 2 halberd weapon animations are multi-frame (animated idle)
                const sheetWidth = idle2HalberdSheet.naturalWidth;
                const sheetHeight = idle2HalberdSheet.naturalHeight;
                
                // Detect frame count (idle 2 typically has 2-10 frames)
                const FRAME_COUNT = 10; // Try 10 frames first
                let detectedFrameWidth = Math.floor(sheetWidth / FRAME_COUNT);
                let maxFrames = FRAME_COUNT;
                
                // Verify frame width is reasonable
                if (detectedFrameWidth < 15 || detectedFrameWidth > 100) {
                    for (const testFrameCount of [9, 8, 6, 5, 4, 3, 2, 1]) {
                        const testWidth = Math.floor(sheetWidth / testFrameCount);
                        const remainder = sheetWidth % testFrameCount;
                        
                        if (remainder <= 10 && testWidth >= 15 && testWidth <= 100) {
                            detectedFrameWidth = testWidth;
                            maxFrames = testFrameCount;
                            break;
                        }
                    }
                    
                    if (maxFrames === 0) {
                        detectedFrameWidth = sheetWidth;
                        maxFrames = 1;
                    }
                }
                
                // Animate idle 2 during the 3-second animation window
                // Use the SAME timing as character idle 2 animation for perfect synchronization
                if (maxFrames > 1) {
                    const idle2Progress = cycleTime / IDLE2_ANIMATION_DURATION; // 0 to 1
                    const frameIndex = Math.floor(idle2Progress * maxFrames);
                    const clampedFrameIndex = Math.min(frameIndex, maxFrames - 1);
                    const frameX = clampedFrameIndex * detectedFrameWidth;
                    
                    const scale = 1.5;
                    const drawWidth = detectedFrameWidth * scale;
                    const drawHeight = sheetHeight * scale;
                    
                    // Position weapon to align with character's hand
                    // Character sprite is drawn at: y - drawHeight (top of sprite)
                    // Hand is typically around 30-35% down from the top of the character sprite
                    const charScale = 1.5;
                    const charHeight = charSpriteInfo ? charSpriteInfo.height : 60; // Use actual character height if available
                    const charDrawHeight = charHeight * charScale;
                    // Calculate base hand position using adjustable percentage
                    const baseHandY = y - charDrawHeight + (charDrawHeight * offsets.handPercent);
                    // Apply debug offsets for fine-tuning
                    const weaponX = x + offsets.x; // X offset for horizontal adjustment
                    const weaponY = baseHandY + offsets.y; // Y offset for vertical adjustment
                    
                    this.ctx.drawImage(
                        idle2HalberdSheet,
                        frameX, 0, detectedFrameWidth, sheetHeight,  // Source (sprite sheet frame)
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight  // Destination
                    );
                    
                    
                    return; // Exit early, weapon drawn
                } else {
                    // Single frame - use as static
                    const scale = 1.5;
                    const drawWidth = sheetWidth * scale;
                    const drawHeight = sheetHeight * scale;
                    
                    // Position weapon to align with character's hand
                    // Character sprite is drawn at: y - drawHeight (top of sprite)
                    // Hand is typically around 30-35% down from the top of the character sprite
                    const charScale = 1.5;
                    const charHeight = charSpriteInfo ? charSpriteInfo.height : 60; // Use actual character height if available
                    const charDrawHeight = charHeight * charScale;
                    // Calculate base hand position using adjustable percentage
                    const baseHandY = y - charDrawHeight + (charDrawHeight * offsets.handPercent);
                    // Apply debug offsets for fine-tuning
                    const weaponX = x + offsets.x; // X offset for horizontal adjustment
                    const weaponY = baseHandY + offsets.y; // Y offset for vertical adjustment
                    
                    this.ctx.drawImage(
                        idle2HalberdSheet,
                        0, 0, sheetWidth, sheetHeight,
                        weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight
                    );
                    
                    
                    return; // Exit early, weapon drawn
                }
            }
        }
        
        // Use idle 1 (static idle) - default
        if (!useIdle2) {
            const idleHalberdSheetKey = `halberd_idle_${facingDir}_sheet`;
            const idleHalberdSheet = this.assets.sprites[idleHalberdSheetKey] || this.assets.sprites['halberd_idle_east_sheet'];
            
            if (idleHalberdSheet && idleHalberdSheet.complete && idleHalberdSheet.naturalWidth > 0) {
                // Idle halberd weapon animations are typically single-frame
                // Use the entire sprite sheet as one frame
                const scale = 1.5;
                const drawWidth = idleHalberdSheet.naturalWidth * scale;
                const drawHeight = idleHalberdSheet.naturalHeight * scale;
                
                // Position weapon to align with character's hand
                // Character sprite is drawn at: y - drawHeight (top of sprite)
                // Hand position is adjustable via debug controls
                const charScale = 1.5;
                const charHeight = charSpriteInfo ? charSpriteInfo.height : 60; // Use actual character height if available, else estimate
                const charDrawHeight = charHeight * charScale;
                // Calculate base hand position using adjustable percentage
                const baseHandY = y - charDrawHeight + (charDrawHeight * offsets.handPercent);
                // Apply debug offsets for fine-tuning
                const weaponX = x + offsets.x; // X offset for horizontal adjustment
                const weaponY = baseHandY + offsets.y; // Y offset for vertical adjustment
                
                this.ctx.drawImage(
                    idleHalberdSheet,
                    0, 0, idleHalberdSheet.naturalWidth, idleHalberdSheet.naturalHeight,  // Source (full sprite sheet)
                    weaponX - drawWidth / 2, weaponY - drawHeight / 2, drawWidth, drawHeight  // Destination
                );
                
            } else {
                // No idle sprite found - don't draw fallback weapon
                // This prevents duplicate/mispositioned weapons from appearing
                // All proper halberd sprites should be loaded from assets
                console.warn(`Missing idle halberd sprite for direction: ${facingDir}`);
            }
        }
    }

    /**
     * Draw casting effect around character with charge-up animation
     * @param {Character} character - Character casting
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawCastingEffect(character, x, y) {
        const castTime = Date.now() - character.combatState.castStartTime;
        const totalCastTime = character.combatState.currentSpell?.castTime * 1000 || 2000;
        const castProgress = Math.min(castTime / totalCastTime, 1);
        
        // Pulsing glow that intensifies as cast progresses
        const pulseSpeed = 5 + castProgress * 10; // Faster pulse as it charges
        const time = Date.now() / 100;
        
        // Outer ring - expands as spell charges
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3 + Math.sin(time * pulseSpeed) * 0.2;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, 20 + castProgress * 20 + Math.sin(time) * 3, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner glow - gets brighter
        this.ctx.fillStyle = '#00ffff';
        this.ctx.globalAlpha = 0.1 + castProgress * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, 15 + castProgress * 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sparkles around character
        for (let i = 0; i < 6; i++) {
            const angle = (time + i * Math.PI / 3) % (Math.PI * 2);
            const radius = 35 + Math.sin(time + i) * 5;
            const sparkX = x + Math.cos(angle) * radius;
            const sparkY = y - 40 + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.5 + Math.sin(time * 2 + i) * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Draw hit flash effect when character takes damage
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawHitFlash(x, y) {
        // Red flash that fades quickly
        this.ctx.fillStyle = '#ff0000';
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw weapon positioning debug overlay
     * @param {number} weaponX - Weapon X position
     * @param {number} weaponY - Weapon Y position
     * @param {number} charX - Character X position
     * @param {number} charY - Character Y position
     * @param {number} charHeight - Character sprite height
     * @param {number} charWidth - Character sprite width
     */
    drawWeaponDebugOverlay(weaponX, weaponY, charX, charY, charHeight, charWidth) {
        // Draw red dot at weapon center
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(weaponX, weaponY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw green dot at character center
        this.ctx.fillStyle = 'green';
        this.ctx.beginPath();
        this.ctx.arc(charX, charY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw blue rectangle showing character sprite bounds
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            charX - charWidth / 2,
            charY - charHeight,
            charWidth,
            charHeight
        );
        
        // Draw yellow line showing hand position percentage
        const handY = charY - charHeight + (charHeight * this.weaponHandPercent);
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(charX - charWidth / 2, handY);
        this.ctx.lineTo(charX + charWidth / 2, handY);
        this.ctx.stroke();
        
        // Get save key info - MUST match the actual save logic exactly!
        const directionForSave = this._manualDirectionOverride || this._currentDirection || 'unknown';
        let animForSave;
        if (this._frameMatchMode && this._selectedFrameIndex !== null) {
            // In frame match mode, use debug animation type
            animForSave = this._debugAnimationType || 'walk';
        } else {
            // Use debug animation type if set, otherwise current animation
            animForSave = this._debugAnimationType || this._currentAnimation || 'idle';
        }
        
        // Build save key - include frame number if in frame match mode
        let saveKey;
        if (this._frameMatchMode && this._selectedFrameIndex !== null) {
            saveKey = `${animForSave}_${directionForSave}_frame${this._selectedFrameIndex}`;
        } else {
            saveKey = `${animForSave}_${directionForSave}`;
        }
        const hasSavedOffset = this.animationOffsets[saveKey] !== undefined;
        
        // ===== SINGLE ORGANIZED DEBUG BOX - RIGHT SIDE =====
        const canvas = this.ctx.canvas;
        const padding = 10;
        const boxWidth = 450;
        const boxHeight = 450;
        const boxX = canvas.width - boxWidth - padding;
        const boxY = padding;
        
        // Semi-transparent black background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Border
        this.ctx.strokeStyle = 'cyan';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Text positioning
        let yPos = boxY + 22;
        const leftMargin = boxX + 15;
        const lineHeight = 16;
        
        // ===== HEADER =====
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DEBUG MODE: ON (F1)', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // ===== ANIMATION TYPE =====
        const currentAnimType = this._debugAnimationType || this._currentAnimation || 'idle';
        this.ctx.fillStyle = 'lime';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText(`Animation: ${currentAnimType.toUpperCase()} (press A to cycle)`, leftMargin, yPos);
        yPos += lineHeight + 3;
        
        // ===== DIRECTION & SAVE TARGET =====
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        if (this._manualDirectionOverride) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillText(`Direction: 🔒 ${this._manualDirectionOverride.toUpperCase()} (press 0=auto)`, leftMargin, yPos);
        } else {
            this.ctx.fillStyle = 'cyan';
            this.ctx.fillText(`Direction: ${(this._currentDirection || 'unknown').toUpperCase()} (auto)`, leftMargin, yPos);
        }
        yPos += lineHeight + 3;
        
        this.ctx.fillStyle = hasSavedOffset ? 'lime' : 'orange';
        this.ctx.fillText(`Save Key: ${saveKey} ${hasSavedOffset ? '✓' : '(not saved)'}`, leftMargin, yPos);
        yPos += lineHeight + 10;
        
        // ===== FRAME MATCH MODE =====
        if (this._frameMatchMode) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(boxX + 5, yPos - 12, boxWidth - 10, 42);
            
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = 'bold 13px monospace';
            if (this._selectedFrameIndex !== null) {
                this.ctx.fillText(`⏸️ PAUSED - Frame ${this._selectedFrameIndex}`, leftMargin, yPos);
                yPos += lineHeight;
                this.ctx.font = '11px monospace';
                this.ctx.fillText(`(+/- cycle frames, F to exit)`, leftMargin, yPos);
            } else {
                this.ctx.fillText(`▶️ ANIMATING (synced)`, leftMargin, yPos);
                yPos += lineHeight;
                this.ctx.font = '11px monospace';
                this.ctx.fillText(`(+/- to pause & lock frame, F to exit)`, leftMargin, yPos);
            }
            yPos += lineHeight + 10;
        } else if (this._currentAnimation === 'walk' || this._currentAnimation === 'run') {
            this.ctx.fillStyle = 'cyan';
            this.ctx.font = '11px monospace';
            this.ctx.fillText(`💡 Tip: Press F for frame match mode`, leftMargin, yPos);
            yPos += lineHeight + 8;
        }
        
        // ===== CURRENT VALUES =====
        this.ctx.fillStyle = 'cyan';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('CURRENT VALUES:', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`  X: ${this.weaponOffsetX.toFixed(1)}px`, leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText(`  Y: ${this.weaponOffsetY.toFixed(1)}px`, leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText(`  Hand: ${(this.weaponHandPercent * 100).toFixed(1)}%`, leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // ===== SAVED VALUES =====
        if (hasSavedOffset) {
            const saved = this.animationOffsets[saveKey];
            this.ctx.fillStyle = 'lime';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.fillText('SAVED VALUES:', leftMargin, yPos);
            yPos += lineHeight;
            
            this.ctx.fillStyle = 'lightgreen';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`  X: ${saved.x.toFixed(1)}px`, leftMargin, yPos);
            yPos += lineHeight;
            this.ctx.fillText(`  Y: ${saved.y.toFixed(1)}px`, leftMargin, yPos);
            yPos += lineHeight;
            this.ctx.fillText(`  Hand: ${(saved.handPercent * 100).toFixed(1)}%`, leftMargin, yPos);
            yPos += lineHeight + 8;
        }
        
        // ===== ALL SAVED CONFIGS =====
        const totalSaved = Object.keys(this.animationOffsets).length;
        this.ctx.fillStyle = 'cyan';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText(`SAVED CONFIGS: ${totalSaved}`, leftMargin, yPos);
        yPos += lineHeight - 2;
        
        if (totalSaved > 0) {
            this.ctx.fillStyle = 'lightgray';
            this.ctx.font = '10px monospace';
            const savedKeys = Object.keys(this.animationOffsets).sort().slice(0, 3);
            savedKeys.forEach(key => {
                const marker = key === saveKey ? '→' : ' ';
                this.ctx.fillText(`  ${marker} ${key}`, leftMargin, yPos);
                yPos += lineHeight - 4;
            });
            if (totalSaved > 3) {
                this.ctx.fillText(`  ...+${totalSaved - 3} more (L=list all)`, leftMargin, yPos);
                yPos += lineHeight - 2;
            }
        }
        yPos += 8;
        
        // ===== CONTROLS =====
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('CONTROLS:', leftMargin, yPos);
        yPos += lineHeight - 2;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('  Arrows = move weapon', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  Ctrl+Q/E = adjust hand %', leftMargin, yPos);
        yPos += lineHeight - 4;
        // Animation type control (highlighted)
        this.ctx.fillStyle = 'lime';
        this.ctx.fillText('  A = cycle animation type', leftMargin, yPos);
        yPos += lineHeight - 4;
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('  Shift+S = save (temp)', leftMargin, yPos);
        yPos += lineHeight - 4;
        
        this.ctx.fillStyle = 'lime';
        this.ctx.fillText('  Shift+E = EXPORT to file!', leftMargin, yPos);
        yPos += lineHeight - 4;
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('  Shift+D = delete', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  1-8 = lock direction (0=auto)', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  F = frame match mode', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  +/- = cycle frames (in frame mode)', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  Ctrl+R = reset', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  L = list all, X = clear all', leftMargin, yPos);
        yPos += lineHeight - 4;
        
        // Export controls (highlighted)
        this.ctx.fillStyle = 'lime';
        this.ctx.fillText('  F2 = export current frame', leftMargin, yPos);
        yPos += lineHeight - 4;
        this.ctx.fillText('  F3 = batch export all frames', leftMargin, yPos);
        
        // ===== SAVE NOTIFICATION =====
        if (this.saveNotification) {
            const notif = this.saveNotification;
            const centerX = canvas.width / 2;
            const notifY = 150;
            
            this.ctx.fillStyle = notif.isSuccess ? 'rgba(0, 200, 0, 0.9)' : 'rgba(200, 0, 0, 0.9)';
            this.ctx.font = 'bold 24px Arial';
            const textMetrics = this.ctx.measureText(notif.message);
            const boxWidth = textMetrics.width + 40;
            const boxHeight = 50;
            
            this.ctx.fillRect(centerX - boxWidth/2, notifY - 25, boxWidth, boxHeight);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(centerX - boxWidth/2, notifY - 25, boxWidth, boxHeight);
            
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(notif.message, centerX, notifY + 5);
            this.ctx.textAlign = 'left';
        }
    }
    
    /**
     * Draw character health bar
     * @param {Character} character - Character
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawCharacterHealthBar(character, x, y) {
        const barWidth = 80; // Increased from 60 to 80 (33% bigger)
        const barHeight = 8; // Increased from 6 to 8 (33% bigger)
        const healthPercent = character.resources.health / character.resources.maxHealth;
        
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
        
        // Health fill
        const healthColor = healthPercent > 0.5 ? '#32cd32' : 
                           healthPercent > 0.25 ? '#ffa500' : '#dc143c';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x - barWidth / 2, y, barWidth * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    }

    /**
     * Draw projectile
     * @param {Projectile} projectile - Projectile to draw
     */
    drawProjectile(projectile) {
        const data = projectile.getRenderData();
        
        // Draw different projectile types
        if (projectile.spell.key === 'lightning') {
            this.drawLightning(data.x, data.y);
        } else if (projectile.spell.key === 'energyBolt') {
            this.drawEnergyBolt(data.x, data.y);
        } else if (projectile.spell.key === 'explosion') {
            if (data.isArmed) {
                this.drawExplosion(data.x, data.y);
            }
        }
    }

    /**
     * Draw lightning projectile
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawLightning(x, y) {
        const sprite = this.assets.sprites['spell_lightning'];
        
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw sprite centered
            this.ctx.drawImage(sprite, x - 32, y - 32, 64, 64);
        } else {
            // Fallback: Draw lightning bolt
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ffff';
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10, y - 10);
            this.ctx.lineTo(x + 5, y);
            this.ctx.lineTo(x - 5, y);
            this.ctx.lineTo(x + 10, y + 10);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw energy bolt projectile
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawEnergyBolt(x, y) {
        const sprite = this.assets.sprites['spell_ebolt'];
        
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw sprite centered
            this.ctx.drawImage(sprite, x - 32, y - 32, 64, 64);
        } else {
            // Fallback: Draw energy orb
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ff00ff';
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner glow
            this.ctx.fillStyle = '#ffaaff';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw explosion effect
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawExplosion(x, y) {
        const sprite = this.assets.sprites['spell_explosion'];
        
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw sprite centered with pulsing effect
            const time = Date.now() % 500;
            const scale = 1 + (time / 500) * 0.5;
            const size = 64 * scale;
            this.ctx.globalAlpha = 1 - (time / 500);
            this.ctx.drawImage(sprite, x - size/2, y - size/2, size, size);
            this.ctx.globalAlpha = 1;
        } else {
            // Fallback: Draw explosion as expanding circle
            const time = Date.now() % 500;
            const radius = 20 + (time / 500) * 30;
            const alpha = 1 - (time / 500);
            
            this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ff6400';
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner core
            this.ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw effect (fizzle, hit impact, etc.)
     * @param {Object} effect - Effect data
     */
    drawEffect(effect) {
        // Draw various visual effects
        // TODO: Implement different effect types
    }

    /**
     * Get character screen position
     * @param {number} playerNum - Player number (1 or 2)
     * @param {Game} game - Game instance (optional, for backward compatibility)
     * @returns {Object} Position {x, y}
     */
    getCharacterPosition(playerNum, game = null) {
        if (game) {
            const character = playerNum === 1 ? game.player1 : game.player2;
            return character ? { x: character.x, y: character.y } : { x: 0, y: 0 };
        }
        // Fallback for backward compatibility
        return playerNum === 1 ? { x: 200, y: 300 } : { x: 600, y: 300 };
    }

    /**
     * Draw attack range indicator around character
     * @param {Character} character - Character to draw range for
     */
    drawAttackRange(character) {
        if (!character.equipment.weaponEquipped) {
            return;
        }
        
        const x = character.x;
        const y = character.y - 40; // Center on character sprite
        const weaponRange = character.equipment.weapon.range * 44; // tiles to pixels
        
        // Draw semi-transparent green circle showing attack range
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]); // Dashed line
        this.ctx.beginPath();
        this.ctx.arc(x, y, weaponRange, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset to solid line
        
        // Draw text label
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('AUTO-SWING RANGE', x, y - weaponRange - 10);
    }

    /**
     * Draw target highlight around targeted character (UO-style)
     * @param {Character} target - Character to highlight
     */
    drawTargetHighlight(target) {
        if (!target) {
            return;
        }
        
        const x = target.x;
        const y = target.y;
        const radius = 50; // Size of highlight circle (made bigger)
        
        // Animated pulsing effect
        const pulseSpeed = 3; // Speed of pulse animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * pulseSpeed) * 8; // Oscillates between -8 and +8 (bigger pulse)
        
        // Draw outer glow
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, radius + 15 + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw main red targeting circle
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)'; // Fully opaque
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, radius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw inner circle
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 40, radius - 15 + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw crosshair
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
        this.ctx.lineWidth = 3;
        const crosshairSize = 20;
        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(x - crosshairSize, y - 40);
        this.ctx.lineTo(x + crosshairSize, y - 40);
        this.ctx.stroke();
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 40 - crosshairSize);
        this.ctx.lineTo(x, y - 40 + crosshairSize);
        this.ctx.stroke();
        
        // Draw "TARGETED" text above
        this.ctx.fillStyle = 'red';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚔ TARGETED ⚔', x, y - 100);
    }

    /**
     * Update cursor based on war mode state
     * @param {Object} gameState - Current game state
     */
    updateCursor(gameState) {
        // Change cursor to crosshair if player1 is in war mode
        if (gameState.player1 && gameState.player1.combatState.warMode) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Draw swing cooldown timer below character
     * @param {Character} character - Character to draw cooldown for
     * @param {number} x - Character X position
     * @param {number} y - Character Y position
     */
    drawSwingCooldown(character, x, y) {
        const progress = character.getSwingProgress();
        const remaining = character.getSwingCooldownRemaining();
        const canSwing = character.combatState.canSwing;
        
        // DEBUG: Log when visual shows ready but canSwing is false (or vice versa)
        if (progress >= 100 && !canSwing) {
            console.warn(`⚠️ MISMATCH! Visual shows 100% but canSwing=${canSwing}!`);
        }
        
        // Cooldown bar dimensions
        const barWidth = 60;
        const barHeight = 8;
        const barX = x - barWidth / 2;
        const barY = y + 10; // Below character feet
        
        // Draw background (empty bar)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw progress fill
        const fillWidth = (progress / 100) * barWidth;
        this.ctx.fillStyle = progress === 100 ? 'lime' : 'orange';
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Draw border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw timer text if still cooling down
        if (remaining > 0) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${remaining.toFixed(1)}s`, x, barY + barHeight + 14);
        } else {
            // Ready text
            this.ctx.fillStyle = 'lime';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('READY', x, barY + barHeight + 14);
        }
    }
}

