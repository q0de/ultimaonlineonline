# Weapon Positioning Guide - F1 Debug Mode

## 🎯 How To Position Weapons for All Animations

### Quick Start:

1. **Press F1** - Enter debug mode
2. **Press A** - Cycle animation type (idle → walk → running → attack)
3. **Press Numpad 8** - Lock to NORTH direction
4. **Press F** - Enter frame match mode (for multi-frame animations)
5. **Press +/-** - Cycle through frames
6. **Arrow keys** - Position weapon
7. **Shift+S** - Save position

---

## 📋 Complete Workflow

### For IDLE Animation (1 frame per direction)

```
1. F1 (debug mode)
2. A (cycle to "IDLE")
3. Numpad 8 (lock to NORTH)
4. Arrow keys → position weapon
5. Shift+S → save as "idle_north"
6. Numpad 9 (switch to NORTHEAST)
7. Arrow keys → position weapon
8. Shift+S → save as "idle_northeast"
9. Repeat for all 8 directions
```

### For RUNNING Animation (multiple frames per direction)

```
1. F1 (debug mode)
2. A (cycle to "RUNNING")
3. Numpad 8 (lock to NORTH)
4. F (frame match mode)
5. Press + to go to frame 0
6. Arrow keys → position weapon for frame 0
7. Shift+S → save as "running_north_frame0"
8. Press + to go to frame 1
9. Arrow keys → position weapon for frame 1
10. Shift+S → save as "running_north_frame1"
11. Repeat for all frames (0-9 or however many you have)
12. Numpad 9 (switch to NORTHEAST)
13. Press + to go to frame 0
14. Repeat for all frames in NORTHEAST
15. Continue for all 8 directions
```

### For ATTACK Animation (multiple frames per direction)

Same as RUNNING, but:
1. Press A until you see "Animation: ATTACK"
2. Then follow the multi-frame workflow

---

## 🎮 Controls Reference

### Animation Type:
- **A** = Cycle type (idle → walk → running → attack)

### Direction:
- **Numpad 1-8** = Lock direction
  - 1 = East
  - 2 = Southeast  
  - 3 = South
  - 4 = Southwest
  - 5 = West
  - 6 = Northwest
  - 7 = North
  - 8 = Northeast
- **Numpad 0** = Auto-detect direction

### Frame Control (for multi-frame animations):
- **F** = Toggle frame match mode
- **+** = Next frame
- **-** = Previous frame

### Positioning:
- **Arrow Keys** = Move weapon (1px per press)
- **Shift+Arrow** = Move weapon (5px per press)
- **Ctrl+Q** = Decrease hand position %
- **Ctrl+E** = Increase hand position %

### Save/Load:
- **Shift+S** = Save current position
- **Shift+D** = Delete saved position
- **L** = List all saved positions
- **X** = Clear all (press twice to confirm)
- **Ctrl+R** = Reset to defaults

---

## 💾 Save Keys

Your positions save with these keys:

**Idle:**
- `idle_north`
- `idle_northeast`
- `idle_east`
- ... (8 total)

**Walk/Running (per frame):**
- `running_north_frame0`
- `running_north_frame1`
- `running_north_frame2`
- ... (10 frames × 8 directions = 80 total)

**Attack (per frame):**
- `attack_north_frame0`
- `attack_north_frame1`
- ... (varies by animation)

---

## 🎨 On-Screen Display

When in debug mode (F1), you'll see:

```
DEBUG MODE: ON (F1)
Animation: RUNNING (press A to cycle)  ← Current animation type
Direction: 🔒 NORTH (press 0=auto)     ← Locked direction
Save Key: running_north_frame3 ✓       ← What will be saved

🎬 FRAME MATCH - Frame 3
(+/- cycle frames, F exit)

CURRENT VALUES:
  X: -12.5px
  Y: 8.0px
  Hand: 65.0%

SAVED VALUES:
  X: -12.5px
  Y: 8.0px
  Hand: 65.0%

CONTROLS:
  A = cycle animation type  ← NEW!
  Shift+S = save
  ...
```

---

## 💡 Tips

1. **Lock direction first** (Numpad 1-8) - prevents auto-switching while you work
2. **Cycle animation type with A** - shows you exactly what you're positioning
3. **Use F + +/-** for multi-frame animations - see each frame clearly
4. **Press L** to see all your saved positions
5. **Saved positions persist** - they're stored in localStorage

---

## ⚠️ Important

- **Walk and Running are separate!** You must position both if you want different weapon positions
- **Each frame is independent** - frame 0 doesn't copy to frame 1
- **All 8 directions** - Don't forget NE, SE, SW, NW!
- **Press Shift+S** - Easy to forget to save after positioning!

---

## 🚀 Example Session

```
Goal: Position halberd for running animation, all directions, frame 0 only

1. F1 → Debug ON
2. A → "Animation: RUNNING"
3. F → Frame match mode
4. Numpad 8 → Lock NORTH
5. Arrows → Position weapon
6. Shift+S → Save "running_north_frame0"
7. Numpad 9 → Lock NORTHEAST
8. Arrows → Position weapon
9. Shift+S → Save "running_northeast_frame0"
10. Numpad 6 → Lock EAST
... repeat for all 8 directions
Done!
```

**Now when your character runs, the weapon will be positioned correctly!** ⚔️
