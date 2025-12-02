# Ultima Online Pre-AOS PvP Simulator - Requirements Document

## Project Overview
Build a browser-based PvP combat simulator that faithfully recreates pre-AOS (pre-Age of Shadows) Ultima Online combat mechanics using original game assets extracted from the UO client.

---

## 1. Asset Requirements

### 1.1 Required Asset Files
Extract the following from UO client installation using UOFiddler or similar tools:

**Character Sprites:**
- Male/Female player character sprites (paperdoll body types)
- All 8 directional facings (N, NE, E, SE, S, SW, W, NW)
- Animation frames for:
  - Standing idle
  - Walking
  - Running
  - Melee attack swing
  - Casting spell (arms raised)
  - Hit reaction/flinch
  - Death

**Weapon Sprites:**
- Halberd (item graphic + equipped overlay)
- Additional weapons (optional): Katana, War Axe, Kryss, War Hammer
- All directional attack animation frames
- Weapon swing effect graphics (if available)

**Spell Effect Graphics:**
- Lightning bolt animation frames
- Energy Bolt projectile + impact
- Explosion area effect
- Casting sparkles/effects
- Fizzle effect

**UI Elements (Gumps):**
- Health bar graphic
- Mana bar graphic  
- Stamina bar graphic
- Paperdoll/equipment window background
- Status window frame
- Spell icon backgrounds
- Button backgrounds

**Tiles/Ground:**
- Arena floor tile(s) - grass, dirt, or stone
- Optional: walls, decorative elements

**Audio (Optional but Recommended):**
- Weapon swing sounds (whoosh)
- Hit impact sounds (flesh, armor)
- Spell casting sounds (chanting)
- Spell effect sounds (lightning crack, explosion boom, energy bolt)
- Fizzle sound
- Death sound
- Footstep sounds

### 1.2 Asset Format Conversion
- Convert sprites from UO's .mul format to web-compatible formats:
  - PNG with transparency for sprites
  - Sprite sheets for animations (combine frames)
  - MP3/OGG for audio files
- Maintain original sprite dimensions and animation frame rates
- Preserve UO's color palette and pixel art aesthetic

### 1.3 Asset Organization Structure
```
/assets/
  /sprites/
    /characters/
      /male/
        idle_N.png, idle_NE.png, etc.
        attack_N.png, attack_NE.png, etc.
        cast_N.png, cast_NE.png, etc.
      /female/
        [same structure]
    /weapons/
      halberd_equipped_N.png, etc.
      katana_equipped_N.png, etc.
    /effects/
      lightning_01.png through lightning_XX.png
      explosion_01.png through explosion_XX.png
      ebolt_01.png through ebolt_XX.png
      fizzle.png
  /ui/
    healthbar.png
    manabar.png
    staminabar.png
    paperdoll_bg.png
    button_bg.png
  /tiles/
    grass.png
    stone.png
  /sounds/
    /weapons/
      halberd_swing.mp3
      halberd_hit.mp3
    /spells/
      lightning.mp3
      explosion.mp3
      ebolt.mp3
      fizzle.mp3
    /character/
      death.mp3
```

---

## 2. Core Combat Mechanics (Pre-AOS Era)

### 2.1 Weapon Combat System

**Halberd Specifications:**
- Base swing speed: 1.75 seconds (affected by stamina and dexterity)
- Damage range: 20-30 (affected by strength and tactics)
- Two-handed weapon (blocks shield slot)
- Weapon skill: Swordsmanship

**Hit Chance Calculation:**
```
attackValue = Attacker's Weapon Skill
defenseValue = (Defender's Tactics + Defender's Anatomy) / 2
skillDifference = attackValue - defenseValue
baseHitChance = 50%
modifiedHitChance = baseHitChance + (skillDifference / 200)
finalHitChance = clamp(modifiedHitChance, 15%, 85%)
```

**Damage Calculation:**
```
baseDamage = random(weaponMinDmg, weaponMaxDmg)
strengthBonus = (Strength * 0.3) + (Tactics / 6.5)
anatomyBonus = (Anatomy / 5)
finalDamage = baseDamage + strengthBonus + anatomyBonus
```

**Swing Speed Formula:**
```
baseSwingDelay = 1750ms (for halberd)
staminaModifier = (currentStamina / maxStamina)
dexModifier = (dexterity / 100)
actualSwingDelay = baseSwingDelay / (staminaModifier * dexModifier)
clamp actualSwingDelay between 1250ms and 2500ms
```

### 2.2 Spell Casting System

**Spell Definitions:**
```javascript
spells = {
  lightning: {
    circle: 6,
    manaCost: 40,
    baseCastTime: 1500ms,
    damage: [25, 35],
    reagents: ["Black Pearl", "Mandrake Root", "Sulfurous Ash"]
  },
  energyBolt: {
    circle: 7,
    manaCost: 40,
    baseCastTime: 2500ms,
    damage: [30, 45],
    reagents: ["Black Pearl", "Nightshade"]
  },
  explosion: {
    circle: 6,
    manaCost: 40,
    baseCastTime: 3000ms,
    damage: [35, 50],
    delayedDetonation: 2000ms,
    reagents: ["Blood Moss", "Mandrake Root"]
  }
}
```

**Cast Time Modifiers:**
```
Faster Casting (FC) stat: reduces cast time
FC 0: 100% cast time
FC 1: 75% cast time
FC 2: 50% cast time
FC 3: 33% cast time
FC 4: 25% cast time

For pre-AOS simulation, default to FC 0 (no modifiers)
```

**Spell Damage Calculation:**
```
baseDamage = random(spellMinDmg, spellMaxDmg)
evaluateIntelligenceBonus = (EvalInt / 10)
inscriptionBonus = (Inscription / 10) (if applicable)
resistPenalty = (TargetMagicResist / 10)
finalDamage = (baseDamage + evalIntBonus + inscriptionBonus) - resistPenalty
```

### 2.3 Interrupt Mechanics

**Spell Fizzle Conditions:**
1. Taking damage while casting
2. Moving while casting
3. Manually unequipping weapon while casting
4. Insufficient mana (checked at cast start)

**Fizzle Behavior:**
- Mana consumed (no refund)
- Cast progress reset to 0%
- Character returns to idle stance
- Fizzle effect plays
- Fizzle sound plays

**Manual Interrupt (Toggle Weapon):**
- Player can press weapon toggle hotkey during cast
- Immediately cancels spell
- Mana still consumed
- Used for feinting/baiting opponents
- Critical skill technique in high-level PvP

### 2.4 Timing & Synchronization

**Client-Side Timing:**
- All animations must sync with combat timers
- Cast bar progression must match actual cast time
- Weapon swing animation must complete before next swing available
- Spell effect visual must appear at moment of damage application

**Combo Timing Windows:**
- Pre-casting: Start casting next spell while previous is in travel
- Explosion → Energy Bolt combo:
  - Cast Explosion (3000ms)
  - Explosion arms and travels (2000ms delay)
  - Cast Energy Bolt (2500ms) during explosion travel
  - Both hit nearly simultaneously
- Lightning quick-cast: Fastest direct damage option

---

## 3. Character Stats & Skills

### 3.1 Primary Stats (All set to 100 for balanced PvP)
- **Strength:** 100 (affects melee damage, carrying capacity)
- **Dexterity:** 100 (affects swing speed, stamina)
- **Intelligence:** 100 (affects mana pool, spell damage)

### 3.2 Combat Skills (All set to GM 100.0 for simulation)
- **Swordsmanship:** 100.0 (weapon accuracy)
- **Tactics:** 100.0 (damage bonus, defense)
- **Anatomy:** 100.0 (damage bonus, defense)
- **Magery:** 100.0 (spell success rate)
- **Evaluating Intelligence:** 100.0 (spell damage)
- **Meditation:** 100.0 (mana regeneration rate)
- **Resist Spells:** 100.0 (magic resistance)

### 3.3 Resource Pools
```javascript
character = {
  health: {
    current: 100,
    max: 100,
    regeneration: 0 // Combat mode = no regen
  },
  mana: {
    current: 100,
    max: 100,
    regeneration: 2.0 per second (when not casting, with meditation)
  },
  stamina: {
    current: 100,
    max: 100,
    regeneration: 5.0 per second (when not swinging/running)
  }
}
```

---

## 4. User Interface Requirements

### 4.1 Combat Arena Display

**Isometric View (Classic UO Perspective):**
- Top-down angled view (2.5D isometric)
- Tile-based ground rendering
- Two character sprites facing each other
- Character sprites must:
  - Face opponent dynamically
  - Play appropriate animations (idle, attack, cast, hit, death)
  - Display equipped weapon overlay
  - Show directional facing (update based on movement/action)

**Arena Dimensions:**
- 10x10 tile playable area minimum
- Characters positioned ~5 tiles apart
- Tile size: 44x44 pixels (standard UO tile size)

### 4.2 Status Bars (Original UO Style)

**Health Bar:**
- Red gradient fill
- Numerical display: "HP: 100/100"
- Updates in real-time on damage
- Flash effect on damage taken

**Mana Bar:**
- Blue gradient fill
- Numerical display: "Mana: 100/100"
- Updates on spell cast and regeneration

**Stamina Bar:**
- Green/yellow gradient fill
- Numerical display: "Stamina: 100/100"
- Drains on weapon swings and running

### 4.3 Cast Bar / Spell Timer
- Horizontal progress bar
- Fill color: Orange/yellow
- Text overlay: "Casting [Spell Name]... X.Xs"
- Progress percentage fill matches time elapsed
- Must be HIGHLY VISIBLE to enable interrupt gameplay

### 4.4 Weapon Swing Timer
- Horizontal cooldown bar
- Fill color: Cyan/blue
- Text: "Ready to Swing" or "Cooldown: X.Xs"
- Visual feedback for swing availability

### 4.5 Equipment Paperdoll (Optional but Recommended)
- Show equipped weapon in character's hand
- Visual indication of weapon equipped/unequipped
- Click weapon to toggle equip/unequip

### 4.6 Spell Hotbar
- Icon-based spell buttons
- Show mana cost on each icon
- Grayed out when insufficient mana or on cooldown
- Keyboard shortcuts (1-8 for spell circles)

### 4.7 Combat Log
- Scrolling text feed at bottom of screen
- Color-coded messages:
  - Red: Damage dealt/taken
  - Gray: Misses
  - Orange: Spell fizzles
  - Cyan: Spell casts
  - Yellow: Manual cancels
- Timestamps on each message
- Auto-scroll to latest message

---

## 5. Controls & Input

### 5.1 Keyboard Controls (Two-Player Layout)

**Player 1 (Left Side):**
- `Q`: Toggle Weapon Equip/Unequip
- `A`: Swing Weapon (Halberd)
- `1`: Cast Lightning
- `2`: Cast Energy Bolt
- `3`: Cast Explosion
- `W/S/A/D`: Movement (optional for advanced version)

**Player 2 (Right Side):**
- `E`: Toggle Weapon Equip/Unequip
- `D`: Swing Weapon
- `4`: Cast Lightning
- `5`: Cast Energy Bolt
- `6`: Cast Explosion
- `Arrow Keys`: Movement (optional)

### 5.2 Mouse Controls
- Click spell buttons to cast
- Click weapon button to swing
- Click equipment to toggle
- Click/drag to move character (optional advanced feature)

### 5.3 Gamepad Support (Optional)
- Face buttons for spells
- Triggers for weapon swing
- D-pad for movement
- Shoulder button for weapon toggle

---

## 6. Animation System

### 6.1 Character Animation States
```javascript
animationStates = {
  idle: {
    frames: 1,
    looping: true,
    fps: 1
  },
  walk: {
    frames: 8,
    looping: true,
    fps: 8
  },
  run: {
    frames: 8,
    looping: true,
    fps: 12
  },
  attack: {
    frames: 7,
    looping: false,
    fps: 10,
    onComplete: () => checkHit()
  },
  cast: {
    frames: 5,
    looping: true, // loops while casting
    fps: 8
  },
  getHit: {
    frames: 2,
    looping: false,
    fps: 10,
    onComplete: () => returnToIdle()
  },
  death: {
    frames: 4,
    looping: false,
    fps: 6,
    onComplete: () => gameOver()
  }
}
```

### 6.2 Spell Effect Animations
```javascript
spellEffects = {
  lightning: {
    type: "projectile",
    frames: 10,
    fps: 20,
    speed: 15, // pixels per frame
    impactFrames: 5
  },
  energyBolt: {
    type: "projectile",
    frames: 8,
    fps: 18,
    speed: 12,
    impactFrames: 6
  },
  explosion: {
    type: "area",
    frames: 15,
    fps: 15,
    radius: 3, // tiles
    delayBeforeVisual: 2000 // pre-cast travel time
  },
  fizzle: {
    type: "onCharacter",
    frames: 6,
    fps: 12
  }
}
```

### 6.3 Animation Priorities
1. Death (highest - overrides all)
2. Get Hit (interrupts most actions)
3. Attack
4. Cast
5. Walk/Run
6. Idle (default)

---

## 7. Sound System

### 7.1 Sound Effect Triggers

**Weapon Sounds:**
- Play swing sound when attack animation starts
- Play hit sound when attack connects
- Play miss sound (swoosh) when attack misses

**Spell Sounds:**
- Play casting sound when spell begins
- Play spell effect sound when spell completes
- Play impact sound when projectile hits
- Play fizzle sound on interrupt

**Character Sounds:**
- Grunt/pain sound on hit
- Death cry on death
- Footsteps on movement (optional)

### 7.2 Audio Mixing
- Maximum 8 simultaneous sounds
- Priority system:
  1. Death sounds
  2. Spell impacts
  3. Weapon hits
  4. Casting sounds
  5. Movement sounds
- Volume controls for SFX and music (if background music added)

---

## 8. Technical Implementation Requirements

### 8.1 Technology Stack
- **HTML5** for structure
- **CSS3** for styling and UI layouts
- **JavaScript (ES6+)** for game logic
- **Canvas API** for sprite rendering and animations
- **Web Audio API** for sound playback
- No external libraries required (vanilla JS preferred for simplicity)

### 8.2 Performance Requirements
- Maintain 60 FPS during combat
- Animation frame updates every 16.67ms (60Hz)
- Latency < 50ms from input to visual feedback
- Sprite rendering optimizations:
  - Sprite sheet atlasing
  - Only redraw changed regions
  - RequestAnimationFrame for smooth rendering

### 8.3 Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile) - optional

### 8.4 Asset Loading
- Preload all sprites and sounds before game start
- Loading screen with progress bar
- Cache assets in browser for faster subsequent loads
- Fallback handling if assets fail to load

---

## 9. Gameplay Features

### 9.1 Core Features (MVP)
- [ ] Two-player local combat (same keyboard)
- [ ] Halberd weapon with swing timer
- [ ] Three spells: Lightning, Energy Bolt, Explosion
- [ ] Hit chance calculations
- [ ] Spell interrupt on hit
- [ ] Manual spell cancel via weapon toggle
- [ ] Health/Mana/Stamina tracking
- [ ] Combat log
- [ ] Victory/defeat conditions

### 9.2 Advanced Features (Post-MVP)
- [ ] Multiple weapon types (Katana, War Axe, Kryss)
- [ ] More spell circles (1st-8th circle spells)
- [ ] Character movement on arena tiles
- [ ] Range checking (melee range vs. spell range)
- [ ] Line of sight blocking
- [ ] Poison/cure mechanics
- [ ] Bandage healing
- [ ] Consumable potions (heal, cure, refresh, explosion)
- [ ] Armor system (AR calculation)
- [ ] Multiple character templates (Mage, Dexer, Hybrid)

### 9.3 Practice/Training Features
- [ ] AI opponent with difficulty settings
- [ ] Practice mode with infinite resources
- [ ] Combo tutorial/timing trainer
- [ ] Replay system to review matches
- [ ] Timing statistics (average cast interrupts, etc.)

---

## 10. Game Modes

### 10.1 Duel Mode (Primary)
- 1v1 combat
- First to 0 HP loses
- Round-based or best-of series
- Reset button to restart match

### 10.2 Training Mode
- Fight against passive dummy
- Unlimited health/mana
- Practice timing and combos
- Display frame-perfect timing windows

### 10.3 Tournament Mode (Future)
- Best of 3/5/7 rounds
- Score tracking
- Leaderboard (local storage)

---

## 11. Visual Polish & UX

### 11.1 Visual Feedback
- Screen shake on critical hits
- Flash effect on damage taken
- Glow effect on spell impacts
- Particle effects for spell casting
- Weapon trail effects on swings

### 11.2 UI Polish
- Smooth transitions between states
- Button hover effects
- Tooltip on hover (spell details, mana cost)
- Health bar color shift (green → yellow → red)
- Pulsing effect on low health/mana warnings

### 11.3 Responsive Design
- Scale UI for different screen sizes
- Mobile touch controls (optional)
- Fullscreen mode toggle

---

## 12. Testing & Validation

### 12.1 Mechanics Testing
- Verify hit chance calculation accuracy
- Validate spell damage ranges
- Test interrupt timing windows
- Confirm swing speed calculations with stamina drain
- Test mana regeneration rates

### 12.2 Timing Validation
- Halberd swing should be 1750ms ±50ms
- Lightning cast should be 1500ms ±50ms
- Energy Bolt cast should be 2500ms ±50ms
- Explosion cast+detonate should total 5000ms ±50ms
- Frame-perfect interrupt testing

### 12.3 Edge Cases
- Simultaneous hits
- Simultaneous kills
- Spells cast at exactly 0 mana
- Rapid weapon toggling
- Animation state conflicts

---

## 13. Documentation Requirements

### 13.1 In-Game Tutorial
- Popup instructions on first load
- Explain interrupt mechanics
- Show keyboard controls
- Demonstrate weapon toggle for spell cancel
- Link to full guide

### 13.2 README.md
- Installation instructions (extract assets with UOFiddler)
- Asset organization guide
- Controls reference
- Mechanic explanations
- Known issues / limitations

### 13.3 Code Comments
- Document all formulas with UO wiki references
- Explain timing constants
- Animation state machine documentation
- Asset loading pipeline explanation

---

## 14. Asset Extraction Guide

### 14.1 Using UOFiddler

**Step 1: Install UOFiddler**
- Download from: https://github.com/polserver/UOFiddler
- Requires UO client installation directory path

**Step 2: Extract Character Sprites**
- Open UOFiddler
- Navigate to "Animations" tab
- Select body type 400 (male) or 401 (female)
- Export animation frames for each action/direction
- Save as individual PNGs with transparency

**Step 3: Extract Spell Effects**
- Navigate to "Animations" tab
- Find spell effect IDs:
  - Lightning: Animation ID XXXX
  - Energy Bolt: Animation ID XXXX  
  - Explosion: Animation ID XXXX
- Export all frames

**Step 4: Extract UI Gumps**
- Navigate to "Gumps" tab
- Search for health/mana bar gumps
- Export paperdoll backgrounds
- Export button backgrounds

**Step 5: Extract Sounds**
- Navigate to "Sounds" tab
- Find combat sounds, spell sounds, death sounds
- Export as WAV, convert to MP3/OGG for web

**Step 6: Extract Weapon Graphics**
- Navigate to "Items" tab
- Search for halberd item ID
- Export item graphic and equipped overlay

### 14.2 Alternative: ClassicUO Data Files
- Install ClassicUO client
- Navigate to ClassicUO/Data directory
- Use ClassicUO's built-in export tools
- Assets are more readily accessible in modern formats

---

## 15. Success Criteria

### 15.1 Core Functionality
- ✓ Combat feels accurate to pre-AOS UO timing
- ✓ Interrupt mechanic works consistently
- ✓ Manual spell cancel functions as in real UO
- ✓ Hit chance formula produces realistic results
- ✓ Animations sync perfectly with combat timers

### 15.2 Performance
- ✓ 60 FPS maintained during intense combat
- ✓ No animation stuttering or dropped frames
- ✓ Input lag < 50ms

### 15.3 User Experience
- ✓ Intuitive controls
- ✓ Clear visual feedback for all actions
- ✓ Easy to understand timing windows
- ✓ Satisfying to play for UO veterans

---

## 16. Future Enhancements

### 16.1 Multiplayer
- WebRTC peer-to-peer online play
- Lobby system
- Latency compensation
- Rollback netcode for timing accuracy

### 16.2 Character Customization
- Choose character appearance
- Select weapon loadout
- Configure spell book (different spell selections)
- Stat/skill templates

### 16.3 Advanced Combat
- Pet/summon system
- Poisoning mechanics
- Field spells (paralyze field, energy field)
- Stealth/hiding mechanics
- House/obstacle terrain

### 16.4 Progression System
- Unlock additional weapons
- Unlock spell circles
- Achievement system
- Match history tracking

---

## 17. Legal & Attribution

### 17.1 Asset Usage Notice
- Assets extracted from Ultima Online client
- UO is copyrighted by Electronic Arts / Broadsword
- This is a fan project for educational/entertainment purposes
- Not for commercial use
- Recommend users own UO to extract assets legally

### 17.2 Credits
- Original game: Origin Systems / Electronic Arts
- Current rights holder: Broadsword Games
- Asset extraction tools: UOFiddler team, ClassicUO team
- Pre-AOS mechanics reference: UO Stratics, UO Guide

---

## Appendix A: Pre-AOS Formula References

**Weapon Damage:**
```
Base Damage: weapon's min/max range
STR Bonus: (STR × 0.3) + (Tactics ÷ 6.5)
Anatomy Bonus: Anatomy ÷ 5
Tactics Bonus: included above
Final: Base + STR Bonus + Anatomy Bonus
```

**Swing Speed:**
```
Base Delay: weapon-specific (Halberd = 3.5 seconds in ticks)
DEX modifier: speeds up swing
Stamina modifier: low stamina slows swing
```

**Hit Chance:**
```
Attack Value: Weapon Skill
Defense Value: (Tactics + Anatomy + Wrestling) ÷ 3
Difference: Attack - Defense
Base: 50%
Modified: 50% + (Difference ÷ 200)
Clamped: 15% minimum, 85% maximum
```

**Spell Damage:**
```
Base: spell's min/max range
INT Bonus: Evaluate Int ÷ 10
Inscription: Inscription ÷ 10 (if applicable)
Resistance: target Resist Spells ÷ 10 (penalty)
```

---

## Appendix B: Spell Circle Reference

**Circle 6:**
- Explosion
- Invisibility
- Mark
- Mass Curse
- Paralyze Field
- Reveal

**Circle 7:**
- Chain Lightning
- Energy Field
- Flamestrike
- Gate Travel
- Mana Vampire
- Mass Dispel
- Meteor Swarm
- Polymorph

**Circle 8:**
- Earthquake
- Energy Vortex
- Resurrection
- Air Elemental
- Summon Daemon
- Earth Elemental
- Fire Elemental
- Water Elemental

---

## Version History
- v1.0 - Initial requirements document
- Target completion: TBD
- Estimated development time: 40-60 hours with assets ready
