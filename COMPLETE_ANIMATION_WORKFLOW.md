# Complete Animation Workflow Summary

## 🎯 What You Have Now

A complete UO-style animation system with **separate character and weapon layers**!

---

## 📦 Current Animations

### ✅ Already Exported & Working:

1. **Character Running** (`run_ne`, `run_e`, etc.)
   - Character body running (no weapon)
   - 10 frames per direction
   - All 8 directions complete

2. **Weapon Running** (`running-halberd`)
   - Halberd weapon for running
   - 10 frames per direction  
   - All 8 directions complete

3. **Weapon Attacking** (`attack-bash-2h-halberd`)
   - Halberd weapon for attacking
   - 7 frames per direction
   - All 8 directions complete

### 🔄 Currently Exporting:

4. **Character Attacking** (`attack-bash-2h-char`)
   - Character body attacking (no weapon)
   - ~7-10 frames per direction
   - Export using: `EXPORT_ATTACK_BASH_2H_CHARACTER.md`
   - Auto-organize using: `START_AUTO_ORGANIZE_ATTACK_CHAR.bat`

---

## 🎬 How The System Works

### When Running with Halberd:
```
1. Load char BMP: run_ne/Mob 400-3.bmp (character body)
2. Remove white background → transparent
3. Load weapon BMP: running-halberd/northeast/frame3.bmp (halberd only)
4. Remove white background → transparent
5. Draw character body
6. Draw weapon on top
7. Loop every 1.5 seconds
8. Result: Character running with animated halberd!
```

### When Attacking with Halberd:
```
1. Load char BMP: attack-bash-2h-char/northeast/frame3.bmp (character body)
2. Remove white background → transparent
3. Load weapon BMP: attack-bash-2h-halberd/northeast/frame3.bmp (halberd only)
4. Remove white background → transparent
5. Draw character body
6. Draw weapon on top
7. Loop every 1.5 seconds (multiple times during 17s cooldown)
8. Result: Character attacking with animated halberd swing!
```

---

## 📋 Export Workflow (Step-by-Step)

### For Character Attack Animations:

1. **Open UOFiddler** (`UOFiddler.exe`)
2. **Go to Animations tab**
3. **Select Mob 400** (Human Male)
4. **Select "Attack Bash 2H"** action
5. **For each direction** (NE, E, SE, S, SW, W, NW, N):
   - Select direction in UOFiddler
   - Right-click → Export Animation
   - Save to: `assets/sprites/animations/`
   - Files appear as: `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc.
6. **Auto-organize:**
   - Run `START_AUTO_ORGANIZE_ATTACK_CHAR.bat`
   - Script watches folder and auto-organizes
   - Moves to next direction automatically
7. **Repeat** for all 8 directions

---

## 🗂️ Final Folder Structure

```
assets/sprites/animations/
├── run_ne/                    ← Character running NE (no weapon)
│   ├── Mob 400-0.bmp ... Mob 400-9.bmp
├── run_e/ ... (all 8 directions)
│
├── running-halberd/           ← Weapon for running
│   ├── northeast/
│   │   ├── frame0.bmp ... frame9.bmp
│   ├── east/ ... (all 8 directions)
│
├── attack-bash-2h-char/       ← Character attacking (no weapon) [NEW!]
│   ├── northeast/
│   │   ├── frame0.bmp ... frame6.bmp
│   ├── east/ ... (all 8 directions)
│
└── attack-bash-2h-halberd/    ← Weapon for attacking
    ├── northeast/
    │   ├── frame0.bmp ... frame6.bmp
    └── east/ ... (all 8 directions)
```

---

## 🎮 Game Integration

### Loaded Animations:
- `char-run` - Character running body
- `char-walk` - Character walking body
- `char-attack-bash-2h` - Character attacking body [NEW!]
- `weapon-running-halberd` - Halberd weapon for running
- `weapon-attack-bash-2h-halberd` - Halberd weapon for attacking

### Rendering System:
1. **Auto-detects** background color from BMP corner
2. **Removes** all matching pixels (±30 tolerance)
3. **Loops** animations continuously (1.5s per cycle)
4. **Syncs** character + weapon frames
5. **Positions** weapons using F1 debug mode

---

## 🛠️ Weapon Positioning

Once character attack animations are exported:

1. **Press F1** - Debug mode
2. **Press A** until "ATTACK" shows
3. **Press Numpad 1-8** - Lock direction
4. **Press F** - Frame match mode
5. **Press +/-** - Cycle frames
6. **Arrow keys** - Position weapon
7. **Shift+S** - Save position
8. **Repeat** for all 8 directions
9. **Shift+E** - Export `weaponPositionOffsets.js`
10. **Move** to `js/data/weaponPositionOffsets.js`
11. **Refresh** browser

---

## ✅ After Character Attack Export

Once you finish exporting all 8 directions:

1. **Refresh browser** (Ctrl+F5)
2. **Check console:** Should see `📦 Loading character attack bash 2h animation...`
3. **Test in-game:**
   - Press F1 → Press A → Cycle to "ATTACK"
   - See character body attacking WITHOUT weapon
   - Weapon draws on top separately
4. **Position weapons** if needed (F1, F, Arrow keys)
5. **Save positions** (Shift+S for each frame/direction)

---

## 📝 Scripts Reference

- `START_AUTO_ORGANIZE.bat` - Running animations (character body)
- `START_AUTO_ORGANIZE_ATTACK.bat` - Attack animations (weapon only)
- `START_AUTO_ORGANIZE_ATTACK_CHAR.bat` - Attack animations (character body) **[NEW!]**

---

## 🎯 Result

**Complete, authentic UO-style combat system with:**
- ✅ Separate character and weapon layers
- ✅ Transparent backgrounds (auto-removed)
- ✅ Looping animations (1.5s cycles)
- ✅ Synchronized character + weapon frames
- ✅ Positionable weapons (F1 debug mode)
- ✅ Hardcoded saves (git committed)
- ✅ Attack animations loop during full 17s cooldown

**Ready to export! Follow the guide and run the auto-organizer!** ⚔️🎉



