# Ultima Online Pre-AOS PvP Simulator

A browser-based PvP combat simulator that faithfully recreates pre-Age of Shadows (pre-AOS) Ultima Online combat mechanics.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Fan_Project-green)

## 🎮 Features

### Core Combat Mechanics
- **Authentic Pre-AOS Formulas**: Hit chance, damage calculation, swing speed, and spell damage all use original UO formulas
- **Weapon Combat**: Halberd with realistic swing timers and stamina consumption
- **Spell Casting**: Lightning, Energy Bolt, and Explosion with proper cast times
- **Interrupt Mechanics**: Spells fizzle when taking damage or manually canceling
- **Resource Management**: Health, Mana, and Stamina with accurate regeneration

### Gameplay
- **Two-Player Local Combat**: Battle on the same keyboard
- **Real-time Combat**: 60 FPS gameplay with authentic UO timing
- **Combat Log**: Detailed log of all actions and damage
- **Visual Feedback**: Health bars, cast progress, swing timers, and spell effects

### Technical Features
- **Pure Vanilla JavaScript**: No external dependencies required
- **Canvas Rendering**: Smooth 60 FPS graphics
- **Modular Architecture**: Clean, maintainable code structure
- **Asset System**: Support for custom UO sprites and sounds

## 🚀 Quick Start

### Option 1: Play Without Assets (Basic Mode)
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. The game will run with placeholder graphics

### Option 2: Play With Original UO Assets (Full Experience)
1. Extract assets from your UO client (see [Asset Extraction Guide](#-asset-extraction-guide))
2. Place extracted assets in the appropriate folders (see [Asset Organization](#asset-organization))
3. Open `index.html` in a web browser

## 🎯 Controls

### Player 1 (Left Side)
- **Q**: Toggle Weapon Equip/Unequip
- **A**: Swing Weapon
- **1**: Cast Lightning
- **2**: Cast Energy Bolt
- **3**: Cast Explosion

### Player 2 (Right Side)
- **E**: Toggle Weapon Equip/Unequip
- **D**: Swing Weapon
- **4**: Cast Lightning
- **5**: Cast Energy Bolt
- **6**: Cast Explosion

### Global Controls
- **R**: Restart Match
- **ESC**: Pause Game

## 📦 Asset Extraction Guide

To get the full authentic UO experience, you'll need to extract assets from an Ultima Online client installation.

### Requirements
- UO Client installation (Classic or ClassicUO)
- UOFiddler or similar extraction tool

### Using UOFiddler

**Step 1: Install UOFiddler**
- Download from: https://github.com/polserver/UOFiddler
- Run and point it to your UO client directory

**Step 2: Extract Character Sprites**
1. Open UOFiddler
2. Navigate to "Animations" tab
3. Select body type 400 (male) or 401 (female)
4. Export animation frames for:
   - Standing idle
   - Walking
   - Attacking
   - Casting
   - Death
5. Save as PNG with transparency

**Step 3: Extract Spell Effects**
1. Navigate to "Animations" tab
2. Find spell effect animation IDs:
   - Lightning: ~0x4E1C
   - Energy Bolt: ~0x379F
   - Explosion: ~0x36B0
3. Export all frames as PNG

**Step 4: Extract Sounds**
1. Navigate to "Sounds" tab
2. Find and export:
   - Weapon sounds (swing, hit)
   - Spell sounds (cast, impact)
   - Character sounds (death, hit)
3. Export as WAV, convert to MP3 or OGG

**Step 5: Extract UI Elements**
1. Navigate to "Gumps" tab
2. Export health/mana bar graphics
3. Export paperdoll and button backgrounds

### Asset Organization

Place extracted assets in these directories:

```
assets/
├── sprites/
│   ├── characters/
│   │   ├── male/
│   │   │   ├── idle.png
│   │   │   ├── attack.png
│   │   │   └── cast.png
│   │   └── female/
│   ├── weapons/
│   │   └── halberd.png
│   └── effects/
│       ├── lightning.png
│       ├── ebolt.png
│       └── explosion.png
├── ui/
│   ├── healthbar.png
│   └── manabar.png
├── tiles/
│   └── grass.png
└── sounds/
    ├── weapons/
    │   ├── halberd_swing.mp3
    │   └── halberd_hit.mp3
    └── spells/
        ├── lightning_cast.mp3
        ├── lightning_impact.mp3
        ├── ebolt_cast.mp3
        ├── ebolt_impact.mp3
        ├── explosion_cast.mp3
        └── explosion_impact.mp3
```

## ⚙️ Pre-AOS Combat Mechanics

### Weapon Combat

**Hit Chance Formula:**
```
attackValue = Weapon Skill
defenseValue = (Tactics + Anatomy) / 2
skillDifference = attackValue - defenseValue
baseHitChance = 50%
modifiedHitChance = 50% + (skillDifference / 2)
finalHitChance = clamp(15%, 85%)
```

**Damage Formula:**
```
baseDamage = random(weaponMin, weaponMax)
strengthBonus = (STR × 0.3) + (Tactics ÷ 6.5)
anatomyBonus = Anatomy ÷ 5
finalDamage = baseDamage + strengthBonus + anatomyBonus
```

**Swing Speed:**
```
baseDelay = weapon base speed (Halberd = 1750ms)
staminaModifier = currentStamina / maxStamina
dexModifier = dexterity / 100
actualDelay = baseDelay / (staminaModifier × dexModifier)
clampedDelay = clamp(1250ms, 2500ms)
```

### Spell Casting

**Spell Definitions:**

| Spell | Circle | Mana | Cast Time | Damage Range |
|-------|--------|------|-----------|--------------|
| Lightning | 6 | 40 | 1500ms | 25-35 |
| Energy Bolt | 7 | 40 | 2500ms | 30-45 |
| Explosion | 6 | 40 | 3000ms + 2000ms delay | 35-50 |

**Spell Damage Formula:**
```
baseDamage = random(spellMin, spellMax)
evalIntBonus = EvaluateInt ÷ 10
inscriptionBonus = Inscription ÷ 10
resistPenalty = targetResist ÷ 10
finalDamage = (base + evalInt + inscription) - resist
```

### Interrupt Mechanics

**Spell Fizzle Conditions:**
1. Taking damage while casting (from melee attacks)
2. Moving while casting (future feature)
3. Manually toggling weapon off
4. Insufficient mana at cast start

**Important:** Mana is consumed immediately when casting begins and is NOT refunded on fizzle (authentic UO behavior).

### Advanced Techniques

**Explosion → Energy Bolt Combo:**
1. Cast Explosion (3000ms cast time)
2. Explosion arms and travels (2000ms delay)
3. Begin casting Energy Bolt during explosion travel
4. Both spells hit nearly simultaneously for massive damage

**Weapon Toggle Feint:**
- Press weapon toggle during cast to manually fizzle
- Used to bait opponent's counter-spell
- Mana is still consumed (high-risk technique)

## 🏗️ Project Structure

```
utlima-onmind/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── game.js             # Main game controller
│   └── modules/
│       ├── character.js           # Character entity system
│       ├── combatMechanics.js     # Combat formulas
│       ├── inputHandler.js        # Keyboard/mouse input
│       ├── soundManager.js        # Audio system
│       ├── ui.js                  # UI updates
│       ├── assetLoader.js         # Asset preloading
│       ├── renderer.js            # Canvas rendering
│       └── projectile.js          # Spell projectiles
└── assets/                 # Game assets (user-provided)
```

## 🔧 Technical Details

### Browser Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance
- Target: 60 FPS
- Canvas API for rendering
- Web Audio API for sound
- RequestAnimationFrame game loop

### Code Quality
- ES6+ JavaScript modules
- No external dependencies
- Fully commented with UO wiki references
- Modular, maintainable architecture

## 🎓 Game Mechanics Reference

### Character Stats
All characters have identical stats for balanced PvP:
- **Strength**: 100 (affects melee damage)
- **Dexterity**: 100 (affects swing speed)
- **Intelligence**: 100 (affects mana pool)

### Skills
All skills set to GM (100.0):
- Swordsmanship, Tactics, Anatomy
- Magery, Evaluating Intelligence, Meditation
- Resist Spells

### Resources
- **Health**: 100 HP (no regeneration in combat)
- **Mana**: 100 (regenerates at 2.0/sec with GM Meditation)
- **Stamina**: 100 (regenerates at 5.0/sec when idle)

## 🐛 Known Issues

- Asset loading may fail silently if files are missing (uses placeholders)
- Sound autoplay may be blocked by browser policies
- Movement system not yet implemented
- No AI opponent (local 2-player only)

## 🚧 Future Enhancements

### Planned Features
- [ ] Multiple weapon types (Katana, War Axe, Kryss)
- [ ] More spell circles (1st-8th circle spells)
- [ ] Character movement on arena
- [ ] AI opponent with difficulty levels
- [ ] Armor system and damage reduction
- [ ] Poison/cure mechanics
- [ ] Bandage healing
- [ ] Consumable potions
- [ ] Online multiplayer (WebRTC)
- [ ] Replay system
- [ ] Character customization

## ⚖️ Legal & Attribution

### Notice
This is a **fan project** for educational and entertainment purposes. It is **NOT affiliated with or endorsed by** Electronic Arts, Broadsword Games, or any Ultima Online rights holders.

### Assets
- Original Ultima Online assets are copyrighted by Electronic Arts / Broadsword Games
- Users should own a legitimate copy of UO to legally extract assets
- This project does not include any copyrighted assets

### Credits
- **Original Game**: Origin Systems / Electronic Arts
- **Current Rights**: Broadsword Games
- **Mechanics Reference**: UO Stratics, UO Guide, UO Forever
- **Extraction Tools**: UOFiddler team, ClassicUO team

## 🤝 Contributing

This is an open educational project. Contributions welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution
- Additional spell implementations
- Weapon system expansion
- Animation system improvements
- Asset creation/extraction tools
- Documentation improvements
- Bug fixes

## 📝 Version History

- **v1.0.0** (Current)
  - Initial release
  - Core combat mechanics
  - Two-player local PvP
  - Three spells, one weapon
  - Authentic pre-AOS formulas

## 📧 Contact

For questions, suggestions, or bug reports, please open an issue on GitHub.

---

**Disclaimer**: This project is a tribute to classic Ultima Online and is created purely for nostalgic and educational purposes. Play on official UO servers or approved freeshards for the authentic experience!

**Enjoy reliving the glory days of Pre-AOS PvP!** ⚔️🧙‍♂️

