# Quick Asset Integration Guide

## 🎯 Difficulty: EASY
**Time Required:** 30-60 minutes

The game is **already configured** to use UO assets. Just extract and drop files in the right folders!

---

## 📦 What You'll Need

1. **UO Client** (any version, Classic/EA/ClassicUO)
2. **UOFiddler** - Download from: https://github.com/polserver/UOFiddler/releases
3. **30-60 minutes** of time

---

## 🚀 Quick Start (15 Minutes)

### Option A: Minimum Viable Assets
Just get the game looking better with these 5 essential files:

1. **Character sprite** → `assets/sprites/characters/male/idle.png`
2. **Lightning effect** → `assets/sprites/effects/lightning.png`
3. **Energy bolt effect** → `assets/sprites/effects/ebolt.png`
4. **Explosion effect** → `assets/sprites/effects/explosion.png`
5. **Halberd weapon** → `assets/sprites/weapons/halberd.png`

Drop these 5 files in and you're done!

---

## 📋 Step-by-Step: Full Integration

### Step 1: Install UOFiddler (5 min)

1. Download latest release from GitHub
2. Extract to a folder
3. Run `UOFiddler.exe`
4. Point it to your UO installation folder
   - Typical locations:
     - `C:\Program Files (x86)\Electronic Arts\Ultima Online Classic`
     - `C:\Program Files\ClassicUO`
     - `C:\Games\Ultima Online`

### Step 2: Extract Character Sprites (10 min)

**In UOFiddler:**

1. Click **"Animations"** tab
2. In the dropdown, select body type:
   - **400** = Male character
   - **401** = Female character
3. Select animation:
   - **0** = Walk
   - **1** = Stand/Idle
   - **9** = Attack
   - **16** = Cast spell
   - **20** = Death
4. For each direction (0-7), right-click → **"Export Animation"**
5. Save as PNG to: `assets/sprites/characters/male/`
   - Name them: `idle_N.png`, `attack_E.png`, etc.

**Quick Tip:** You only need **idle** and **attack** animations for basic gameplay!

### Step 3: Extract Spell Effects (10 min)

**In UOFiddler:**

1. Stay in **"Animations"** tab
2. Search for spell effects:
   - **Lightning**: Animation ID `0x4E1C` (hex) or `20012` (decimal)
   - **Energy Bolt**: Animation ID `0x379F` or `14239`
   - **Explosion**: Animation ID `0x36B0` or `14000`
   - **Fizzle**: Animation ID `0x3735` or `14133`

3. Export each animation (all frames)
4. Save to: `assets/sprites/effects/`
   - Save as: `lightning.png`, `ebolt.png`, `explosion.png`, `fizzle.png`

**Pro Tip:** If animations have multiple frames, just export frame 0 for now. You can add frame animation later!

### Step 4: Extract Weapon Graphics (5 min)

**In UOFiddler:**

1. Click **"Items"** tab
2. Search for:
   - **Halberd**: Item ID `0x143E` (hex) or `5182` (decimal)
3. Right-click → **"Export Image"**
4. Save to: `assets/sprites/weapons/halberd.png`

### Step 5: Extract Sounds (10 min)

**In UOFiddler:**

1. Click **"Sounds"** tab
2. Find sounds (play to preview):
   - **Weapon Swing**: Search "swing" (sound ID ~0x23C)
   - **Weapon Hit**: Search "hit" or "metal" (sound ID ~0x232)
   - **Lightning**: Search "lightning" (sound ID ~0x29)
   - **Explosion**: Search "explosion" (sound ID ~0x307)
   - **Death**: Search "death" or "scream" (sound ID ~0x150)

3. Right-click → **"Export Sound"** (saves as WAV)
4. Convert WAV to MP3 (optional, use online converter)
5. Save to appropriate folders:
   - `assets/sounds/weapons/halberd_swing.mp3`
   - `assets/sounds/spells/lightning_impact.mp3`
   - etc.

**Quick Tip:** Sounds are optional! The game works fine without them.

### Step 6: Test It! (2 min)

1. Refresh your browser (`Ctrl+R`)
2. Watch the loading bar - should say "Loading assets..."
3. Game loads with your assets!

---

## 🎨 What Happens Automatically

The game **already handles**:
- ✅ Loading all assets with progress bar
- ✅ Creating placeholders for missing files
- ✅ Graceful fallback if extraction fails
- ✅ Proper sprite rendering
- ✅ Animation frame cycling
- ✅ Sound prioritization

**You don't need to modify ANY code!**

---

## 📁 File Structure Reference

Here's exactly where to put files:

```
assets/
├── sprites/
│   ├── characters/
│   │   └── male/
│   │       ├── idle.png          ← Body type 400, animation 1
│   │       ├── attack.png        ← Body type 400, animation 9
│   │       └── cast.png          ← Body type 400, animation 16
│   ├── weapons/
│   │   └── halberd.png           ← Item 0x143E
│   ├── effects/
│   │   ├── lightning.png         ← Animation 0x4E1C
│   │   ├── ebolt.png             ← Animation 0x379F
│   │   ├── explosion.png         ← Animation 0x36B0
│   │   └── fizzle.png            ← Animation 0x3735
│   └── tiles/
│       └── grass.png             ← Any ground tile
├── ui/
│   ├── healthbar.png             ← Gump for HP bar
│   └── manabar.png               ← Gump for mana bar
└── sounds/
    ├── weapons/
    │   ├── halberd_swing.mp3
    │   └── halberd_hit.mp3
    ├── spells/
    │   ├── lightning_cast.mp3
    │   ├── lightning_impact.mp3
    │   ├── ebolt_cast.mp3
    │   ├── ebolt_impact.mp3
    │   ├── explosion_cast.mp3
    │   └── explosion_impact.mp3
    └── character/
        └── death.mp3
```

---

## 🔍 Finding Specific Animation IDs

### Character Animations (Body Type 400/401)
- **0** = Walk
- **1** = Stand/Run (use this for idle)
- **9** = Attack with 1H weapon
- **10** = Attack with 2H weapon (use for halberd!)
- **16** = Cast spell (both hands raised)
- **20** = Die backward
- **21** = Die forward

### Spell Effect IDs (Common)
| Spell | Animation ID (Hex) | Decimal |
|-------|-------------------|---------|
| Lightning | 0x4E1C | 20012 |
| Energy Bolt | 0x379F | 14239 |
| Explosion | 0x36B0 | 14000 |
| Magic Arrow | 0x36E4 | 14052 |
| Fireball | 0x36D4 | 14036 |
| Flamestrike | 0x3709 | 14089 |
| Fizzle | 0x3735 | 14133 |

### Weapon Item IDs
| Weapon | Item ID (Hex) | Decimal |
|--------|--------------|---------|
| Halberd | 0x143E | 5182 |
| Katana | 0x13FF | 5119 |
| Kryss | 0x1401 | 5121 |
| War Axe | 0x13B0 | 5040 |
| War Hammer | 0x1439 | 5177 |

---

## ⚡ Super Quick Method (5 Minutes)

Don't have UO client? Use **placeholder alternatives**:

1. Find retro pixel art online (opengameart.org, itch.io)
2. Create simple colored squares in Paint/Photoshop:
   - Character: 64x64 blue/red squares
   - Lightning: Yellow zigzag
   - Explosion: Orange circle
3. Drop in folders
4. Done!

Not authentic, but better than rectangles!

---

## 🐛 Troubleshooting

### "Assets not loading"
- **Check file paths** - Case sensitive on Linux!
- **Check file format** - Must be PNG for sprites, MP3/OGG for sounds
- **Check browser console** - Press F12, look for errors

### "UOFiddler can't find my UO installation"
- Manually browse to UO folder
- Look for `art.mul`, `anim.mul`, `sound.mul` files
- Point UOFiddler to folder containing these

### "Exported animations are weird colors"
- This is normal! UO uses indexed colors
- Just save as PNG, should work fine

### "Can't convert WAV to MP3"
- Use online converter: https://cloudconvert.com/wav-to-mp3
- Or just use WAV (works but larger files)

---

## 🎯 Recommended Priority

**First 5 minutes:**
1. Character idle sprite
2. Lightning effect
3. Halberd weapon

**Next 10 minutes:**
4. Other spell effects
5. Attack animation
6. Cast animation

**If you have time:**
7. Sounds
8. UI elements
9. Multiple directions
10. Death animation

---

## 💡 Pro Tips

1. **Start small** - Just idle character + 1 spell is huge upgrade
2. **Test frequently** - Drop a file, refresh browser, see result
3. **Use sprite sheets** - Combine animation frames into one image (advanced)
4. **Keep backups** - Copy extracted files before editing
5. **Check file sizes** - Keep PNGs under 500KB each

---

## 🚀 Advanced: Sprite Sheets

For smooth animations, combine frames into sprite sheets:

```
// In renderer.js, you can modify to use sprite sheets:
const frameWidth = 64;
const frameHeight = 64;
const frameX = currentFrame * frameWidth;

ctx.drawImage(
    spriteSheet,
    frameX, 0,              // Source X, Y
    frameWidth, frameHeight, // Source width, height
    x, y,                   // Destination X, Y
    frameWidth, frameHeight  // Destination width, height
);
```

But this is optional - single frame images work great!

---

## 📊 Expected Results

**With assets:**
- Characters look like actual UO characters
- Spells have authentic UO visual effects
- Weapons show proper graphics
- Sounds make combat feel alive

**Time investment:**
- Minimum: 15 minutes → Big visual improvement
- Recommended: 45 minutes → Full authentic experience
- Complete: 2 hours → Every asset perfect

---

## ✅ Success Checklist

- [ ] UOFiddler installed and pointing to UO folder
- [ ] Character idle sprite extracted
- [ ] At least one spell effect extracted
- [ ] Weapon graphic extracted
- [ ] Files placed in correct folders
- [ ] Game refreshed in browser
- [ ] Assets loading (check loading bar)
- [ ] Game running with new graphics!

---

## 🎉 You're Done!

Once you drop the files in the folders, **the game automatically uses them**. No code changes needed!

The asset loader is intelligent:
- Loads what exists
- Creates placeholders for what doesn't
- Never crashes
- Always shows progress

**Now go make your UO PvP simulator look authentic!** ⚔️✨

---

## 📚 Additional Resources

- **UOFiddler GitHub**: https://github.com/polserver/UOFiddler
- **ClassicUO**: https://github.com/ClassicUO/ClassicUO
- **UO Stratics**: http://uo.stratics.com/ (resource DB)
- **UO Guide**: http://www.uoguide.com/ (item/animation IDs)

---

## ❓ Still Stuck?

Check the browser console (F12) for helpful error messages. The asset loader logs exactly what it's trying to load and what failed.

Example console output:
```
Loading assets... 0%
Failed to load sprite: assets/sprites/effects/lightning.png, using placeholder
Asset loaded: assets/sprites/characters/male/idle.png
Loading assets... 100% (10/10)
```

This tells you exactly which files are missing!

