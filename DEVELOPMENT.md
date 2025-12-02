# Development Guide

## Architecture Overview

This project uses a modular ES6 architecture with clear separation of concerns.

## Module Breakdown

### 1. Game.js (Main Controller)
**Purpose**: Orchestrates all game systems and manages game state

**Key Responsibilities**:
- Initialize all subsystems
- Run game loop (60 FPS with requestAnimationFrame)
- Handle combat events (swings, casts, hits)
- Coordinate between modules
- Manage projectiles and effects

**Main Methods**:
- `init()`: Setup game systems
- `gameLoop()`: Main update/render cycle
- `handleWeaponSwing()`: Process melee attacks
- `handleSpellCast()`: Process spell casting
- `handleProjectileHit()`: Process spell damage

### 2. Character.js (Entity System)
**Purpose**: Represents a player character with all stats and state

**Key Properties**:
- `stats`: STR/DEX/INT
- `skills`: Combat skills (all at 100)
- `resources`: HP/Mana/Stamina
- `combatState`: Current action state
- `equipment`: Weapon data

**Key Methods**:
- `update()`: Per-frame updates (regen, timers)
- `startCast()`: Begin spell casting
- `fizzleCast()`: Interrupt spell
- `swing()`: Attack with weapon
- `takeDamage()`: Receive damage
- `toggleWeapon()`: Equip/unequip weapon

### 3. CombatMechanics.js (Formulas)
**Purpose**: Pure functions for all combat calculations

**Exports**:
- `CombatMechanics`: Object with calculation functions
- `Weapons`: Weapon definitions
- `Spells`: Spell definitions
- `AnimationTimings`: Animation data

**Key Functions**:
- `calculateHitChance()`: Weapon accuracy
- `calculateWeaponDamage()`: Melee damage
- `calculateSwingSpeed()`: Attack speed
- `calculateSpellDamage()`: Magic damage
- `calculateCastTime()`: Spell cast duration

### 4. InputHandler.js (Controls)
**Purpose**: Manage keyboard and mouse input

**Features**:
- Key bindings for both players
- Button click handlers
- Prevent key repeats
- Execute player actions

**Key Methods**:
- `handleKeyDown()`: Process key press
- `executeAction()`: Trigger game action
- `setupButtonListeners()`: Wire up UI buttons

### 5. UIManager.js (Interface)
**Purpose**: Update all UI elements

**Manages**:
- Health/mana/stamina bars
- Cast progress bars
- Swing cooldown timers
- Combat log
- Button states
- Game over screen

**Key Methods**:
- `updateCharacter()`: Update player UI
- `addLog()`: Add combat log entry
- `updateButtonStates()`: Enable/disable buttons
- `showGameOver()`: Display winner

### 6. Renderer.js (Graphics)
**Purpose**: Draw game scene on canvas

**Features**:
- Background rendering
- Character sprites (placeholders)
- Weapon rendering
- Spell projectiles
- Visual effects

**Key Methods**:
- `render()`: Draw entire scene
- `drawCharacter()`: Draw player
- `drawProjectile()`: Draw spell
- `drawCastingEffect()`: Draw spell sparkles

### 7. SoundManager.js (Audio)
**Purpose**: Handle sound playback with priority

**Features**:
- Priority system (death > spell > weapon)
- Max 8 simultaneous sounds
- Graceful fallback for missing files
- Volume control

**Key Methods**:
- `play()`: Play sound with priority
- `loadSound()`: Preload audio file
- `stopAll()`: Stop all sounds

### 8. AssetLoader.js (Loading)
**Purpose**: Preload assets with progress

**Features**:
- Load sprites and sounds
- Progress callbacks
- Placeholder generation
- Graceful error handling

**Key Methods**:
- `loadAll()`: Load all assets
- `loadImage()`: Load single sprite
- `createPlaceholder()`: Generate fallback graphic

### 9. Projectile.js (Spells)
**Purpose**: Represent spell projectiles

**Features**:
- Movement towards target
- Hit detection
- Explosion delay timing
- Animation frames

**Key Methods**:
- `update()`: Move projectile
- `hit()`: Process hit
- `detonate()`: Explosion effect

## Data Flow

```
User Input → InputHandler → Game → Character
                                 ↓
                          CombatMechanics (calculations)
                                 ↓
                          UIManager (update displays)
                                 ↓
                          Renderer (draw to canvas)
                                 ↓
                          SoundManager (play audio)
```

## Game Loop

```javascript
requestAnimationFrame → gameLoop()
    ↓
Calculate deltaTime
    ↓
update(deltaTime)
    ├── player1.update(deltaTime)
    ├── player2.update(deltaTime)
    ├── updateProjectiles(deltaTime)
    └── checkCompletedCasts()
    ↓
render()
    └── renderer.render(gameState)
    ↓
updateUI()
    ├── uiManager.updateCharacter(p1)
    └── uiManager.updateCharacter(p2)
```

## Adding New Features

### Adding a New Weapon

1. **Define weapon in combatMechanics.js**:
```javascript
export const Weapons = {
    katana: {
        name: 'Katana',
        skill: 'swordsmanship',
        damageMin: 15,
        damageMax: 22,
        baseSwingSpeed: 1250,
        twoHanded: false,
        staminaCost: 6,
        range: 1
    }
};
```

2. **Add to character loadout** (in game.js or character.js):
```javascript
this.equipment.weapon = { ...Weapons.katana };
```

3. **Add graphics** (optional):
```javascript
// In renderer.js, drawWeapon()
if (weapon.name === 'Katana') {
    // Draw katana sprite
}
```

### Adding a New Spell

1. **Define spell in combatMechanics.js**:
```javascript
export const Spells = {
    flamestrike: {
        name: 'Flamestrike',
        circle: 7,
        manaCost: 40,
        baseCastTime: 2000,
        damageMin: 30,
        damageMax: 40,
        type: 'projectile',
        speed: 10,
        reagents: ['Sulfurous Ash', 'Spider Silk']
    }
};
```

2. **Add input binding** (in inputHandler.js):
```javascript
'Digit4': { player: 1, action: 'castFlamestrike' }
```

3. **Add action handler** (in inputHandler.js):
```javascript
case 'castFlamestrike':
    this.game.handleSpellCast(character, 'flamestrike');
    break;
```

4. **Add UI button** (in index.html):
```html
<button id="p1-spell-flamestrike" class="btn spell-btn">
    <span>Flamestrike</span>
    <small>Mana: 40 | (4)</small>
</button>
```

5. **Add renderer** (in renderer.js):
```javascript
drawFlamestrike(x, y) {
    // Draw flame effect
}
```

### Adding Character Movement

1. **Update Character class** (character.js):
```javascript
move(dx, dy) {
    this.x += dx;
    this.y += dy;
}
```

2. **Add input handlers** (inputHandler.js):
```javascript
case 'moveUp':
    character.move(0, -5);
    break;
```

3. **Update renderer** (renderer.js):
```javascript
// Use character.x and character.y instead of fixed positions
drawCharacter(character, {x: character.x, y: character.y}, facing);
```

4. **Add fizzle on movement** (character.js):
```javascript
move(dx, dy) {
    this.x += dx;
    this.y += dy;
    if (this.combatState.casting) {
        this.fizzleCast('movement');
    }
}
```

### Adding AI Opponent

1. **Create AIController.js**:
```javascript
export class AIController {
    constructor(character, opponent, difficulty) {
        this.character = character;
        this.opponent = opponent;
        this.difficulty = difficulty;
    }
    
    update(deltaTime) {
        // AI decision making
        if (this.shouldCastSpell()) {
            return { action: 'cast', spell: 'lightning' };
        }
        if (this.shouldSwing()) {
            return { action: 'swing' };
        }
    }
}
```

2. **Integrate in game.js**:
```javascript
this.ai = new AIController(this.player2, this.player1, 'medium');

// In update loop:
const aiAction = this.ai.update(deltaTime);
if (aiAction) {
    this.executeAIAction(aiAction);
}
```

## Testing Tips

### Manual Testing Checklist

**Combat Mechanics**:
- [ ] Hit chance feels around 50% with equal stats
- [ ] Damage ranges are correct (20-30 for halberd)
- [ ] Swing speed is ~1750ms with full stamina
- [ ] Low stamina slows swing speed

**Spell Casting**:
- [ ] Lightning takes 1.5 seconds
- [ ] Energy Bolt takes 2.5 seconds
- [ ] Explosion takes 3s + 2s delay
- [ ] All spells cost 40 mana

**Interrupts**:
- [ ] Taking damage fizzles spell
- [ ] Toggling weapon fizzles spell
- [ ] Mana is consumed on fizzle

**Resources**:
- [ ] Mana regenerates when not casting
- [ ] Stamina regenerates when not swinging
- [ ] Health doesn't regenerate

**UI**:
- [ ] Bars update correctly
- [ ] Cast bar shows progress
- [ ] Combat log entries appear
- [ ] Buttons disable appropriately

### Performance Testing

```javascript
// Add to game.js for FPS monitoring
let frameCount = 0;
let lastFPSUpdate = 0;

gameLoop() {
    frameCount++;
    if (Date.now() - lastFPSUpdate > 1000) {
        console.log('FPS:', frameCount);
        frameCount = 0;
        lastFPSUpdate = Date.now();
    }
    // ... rest of loop
}
```

Target: 60 FPS constant

## Debugging Tips

### Enable Debug Mode

Add to game.js:
```javascript
window.DEBUG = true;

if (window.DEBUG) {
    console.log('Hit chance:', hitChance);
    console.log('Damage:', damage);
    console.log('Character state:', character);
}
```

### Common Issues

**Spells not casting**:
- Check mana (need 40)
- Check if already casting
- Check console for errors

**Swings not working**:
- Check weapon equipped
- Check stamina (need 10)
- Check cooldown timer

**UI not updating**:
- Check element IDs match
- Check uiManager.updateCharacter() is called
- Check cached elements

**Projectiles not appearing**:
- Check projectile array in game state
- Check renderer.drawProjectile()
- Check spell type matches renderer case

## Code Style Guide

- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for functions, inline for complex logic
- **Modules**: One class/system per file
- **Constants**: Define at top of file or in combatMechanics.js
- **Magic Numbers**: Always document with UO wiki reference

## Performance Best Practices

1. **Cache DOM elements** (done in UIManager)
2. **Use requestAnimationFrame** (done in game loop)
3. **Calculate delta time** (done for consistent gameplay)
4. **Limit projectile count** (automatically cleaned up)
5. **Only redraw changed elements** (could be improved)

## Asset Integration

When you have real UO assets:

1. Place files in assets/ folders
2. Update paths in assetLoader.js `getAssetManifest()`
3. Update renderer.js to use loaded sprites instead of placeholders
4. Test loading progress

## Contributing Guidelines

1. Keep modules focused (single responsibility)
2. Document all formulas with UO wiki links
3. Test with and without assets
4. Maintain 60 FPS performance
5. Follow existing code style
6. Add console.log for debugging (remove before commit)

## Build Process

Currently no build process needed - pure vanilla JS!

For production deployment:
1. Minify JS (optional)
2. Optimize assets (compress PNGs)
3. Add service worker for offline play
4. Add analytics (optional)

## Resources

- **UO Stratics**: Combat formula reference
- **UO Guide**: Mechanics documentation
- **UOFiddler**: Asset extraction tool
- **ClassicUO**: Modern client with export tools

---

Happy coding! May your refactors be bug-free! 🚀

