# Animation Integration Summary

## ✅ **BMP Animations Now Integrated - Character + Weapon Separate!**

Your BMP animations are split into **two separate sets**:
1. **Character animations** (character body without weapon)
2. **Weapon animations** (weapon only, drawn on top)

The game now loads and displays both correctly with **transparent backgrounds**!

---

## 🎨 **White Background Removal**

BMP files don't support transparency, so the game automatically:
- Loads each BMP frame
- Auto-detects background color from top-left corner pixel
- Makes all matching pixels transparent (within 30px tolerance)
- Also removes pure white pixels (RGB > 240) as fallback
- Logs processing info: `🎨 Processed 64x64: BG=(255,255,255), 3200 pixels transparent`

**No more white boxes around your sprites!** 🎉

---

## 🔄 **Animation Looping**

All animations now **loop continuously** while active:

### Running Animation:
- Loops every **1.5 seconds**
- Seamlessly repeats frames 0-9
- Character and weapon stay synchronized

### Attack Animation:
- **Also loops every 1.5 seconds!** ⚔️
- Plays continuously during the entire 17-second cooldown
- You'll see the full swing animation multiple times per attack
- Separate from cooldown timer (visual vs. gameplay timing)

**This creates a dynamic, authentic UO combat feel!**

---

## 📁 **Current Folder Structure**

### Character Animations (No Weapon):
```
assets/sprites/animations/
├── run_ne/          ← Character running northeast (NO weapon)
│   ├── Mob 400-0.bmp
│   ├── Mob 400-1.bmp
│   └── ... (10 frames)
├── run_e/           ← Character running east (NO weapon)
├── run_se/          ← Etc. for all 8 directions
├── run_s/
├── run_sw/
├── run_w/
├── run_nw/
├── run_n/
└── (similar for walk_* folders if you have them)
```

### Weapon Animations (Weapon Only):
```
assets/sprites/animations/
├── running-halberd/         ← WEAPON animation for running
│   ├── northeast/
│   │   ├── frame0.bmp      ← Halberd only (no character)
│   │   ├── frame1.bmp
│   │   └── ... (10 frames)
│   ├── east/
│   ├── southeast/
│   ├── south/
│   ├── southwest/
│   ├── west/
│   ├── northwest/
│   └── north/
└── attack-bash-2h-halberd/  ← WEAPON animation for attacking
    ├── northeast/
    │   ├── frame0.bmp      ← Halberd only (no character)
    │   ├── frame1.bmp
    │   └── ... (7 frames)
    └── (all 8 directions)
```

---

## 🎮 **How It Works**

When your character runs with a halberd:

1. **Load Character BMP**: `run_ne/Mob 400-0.bmp`
2. **Remove white background** → Make transparent
3. **Load Weapon BMP**: `running-halberd/northeast/frame0.bmp`
4. **Remove white background** → Make transparent
5. **Draw character** body first
6. **Draw weapon** on top in correct position
7. **Loop every 1.5s** through all frames
8. **Result**: Smooth, continuous running animation!

When your character attacks with a halberd:

1. **Character**: Uses character attack sprite sheet or BMP
2. **Weapon BMP**: `attack-bash-2h-halberd/northeast/frame0.bmp` (white removed)
3. **Renderer**: Draws character first, then weapon on top
4. **Loop every 1.5s** through all frames (multiple times during 17s cooldown)
5. **Result**: Dynamic, looping attack animation!

---

## 🎮 **Testing**

1. **Refresh your browser** (Ctrl+F5) at `http://localhost:8000`
2. **Check console** - you should see:
   ```
   📦 Loading character run animation...
   🎨 Processed 64x64: BG=(255,255,255), 3200 pixels transparent
   📦 Loading character walk animation...
   📦 Loading running-halberd weapon animation...
   📦 Loading attack-bash-2h-halberd weapon animation...
   ✅ BMP animations loaded successfully!
   ```

3. **Test running:**
   - Click to move your character
   - Hold **Shift** to run
   - **Animation loops smoothly!** Repeats every 1.5 seconds
   - **No white backgrounds!** Character and weapon blend perfectly
   - Console shows: `🏃 Using BMP character running animation: northeast, frame 3/10`
   - Console shows: `🏃⚔️ Using BMP weapon running animation: northeast, frame 3/10`

4. **Test attacking:**
   - Press **Space** for War Mode
   - Scroll wheel UP to target opponent
   - Get in range (2 tile green circle)
   - **Attack animation loops!** Repeats every 1.5s during the 17s cooldown
   - **No white backgrounds!** Weapon swings cleanly
   - Console shows: `⚔️ Using BMP weapon attack animation: northeast, frame 2/7`

---

## 🛠️ **Weapon Positioning**

Since character and weapon are separate, you **can and should** position the weapons:

1. Press **F1** - Enter debug mode
2. Press **A** to cycle to `running` or `attack` animation type
3. Use **Numpad 1-8** to lock direction (e.g., press 3 for NE)
4. Use **Arrow keys** to adjust weapon position until it aligns with character's hand
5. Press **Shift+S** to save position for current direction
6. **Repeat for all 8 directions**
7. **When done:**
   - Press **Shift+E** to download `weaponPositionOffsets.js`
   - Move from Downloads to `js/data/weaponPositionOffsets.js`
   - Refresh browser

**The animations will loop while you position them, making it easy to see how the weapon moves through all frames!**

---

## 📝 **Technical Details**

### Loaded Animations:
- `char-run` - Character running (all 8 directions, white backgrounds removed)
- `char-walk` - Character walking (all 8 directions, white backgrounds removed)
- `weapon-running-halberd` - Halberd weapon for running (all 8 directions, white backgrounds removed)
- `weapon-attack-bash-2h-halberd` - Halberd weapon for attacking (all 8 directions, white backgrounds removed)

### Background Removal Process:
1. Load BMP image
2. Create temporary canvas
3. Draw image to canvas
4. Sample top-left corner for background color
5. Get pixel data (RGBA)
6. Loop through all pixels
7. If pixel matches background color (±30 tolerance) OR is white (RGB > 240) → Set alpha to 0
8. Create new image from processed canvas
9. Log results to console
10. Return transparent image

### Animation Looping:
```javascript
// Running animation - loops every 1.5s
const moveTime = Date.now() % 1500;
const frameIndex = Math.floor((moveTime / 1500) * frames.length);

// Attack animation - ALSO loops every 1.5s!
const moveTime = Date.now() % 1500;
const frameIndex = Math.floor((moveTime / 1500) * frames.length);
```

### Frame Synchronization:
- Character and weapon animations use the same frame index
- Both loop continuously at 1.5s per cycle
- Attack animation loops independently of 17s cooldown timer
- Visual animation timing is separate from gameplay timing

**This is the authentic UO system - character body and weapon are always separate layers with transparent backgrounds and smooth looping animations!** 🎯
