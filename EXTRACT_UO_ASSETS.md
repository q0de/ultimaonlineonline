# Extracting UO Assets - Step by Step Guide

## ✅ You Have: UOClassicSetup_7_0_24_0

Perfect! This is the official EA client with all the assets we need.

---

## 📋 Quick Process (30 minutes)

### Step 1: Install UO Client (5 min)

1. **Run the installer**: `UOClassicSetup_7_0_24_0.exe`
2. **Follow the installation wizard**
3. **Note the installation path** (usually `C:\Program Files (x86)\Electronic Arts\Ultima Online Classic`)
4. **You DON'T need to create an account or log in** - we just need the files!

### Step 2: Download UOFiddler (5 min)

**Download link:** https://github.com/polserver/UOFiddler/releases

1. Go to the releases page
2. Download the latest `UOFiddler-vX.X.X.zip`
3. Extract to a folder (like `C:\UOFiddler\`)
4. Run `UOFiddler.exe`

### Step 3: Point UOFiddler to Your UO Installation (2 min)

When you first run UOFiddler:

1. Click **"Options"** → **"Options"** in the menu
2. Under **"UO Data Directory"**, click **Browse**
3. Navigate to your UO installation folder:
   - Default: `C:\Program Files (x86)\Electronic Arts\Ultima Online Classic`
4. Click **OK**
5. UOFiddler will load the asset files

**You should see files like:**
- `art.mul` or `artLegacyMUL.uop`
- `anim.mul` or `anim.uop`
- `sound.mul` or `sounds.uop`

---

## 🎨 Extract Character Sprites (10 min)

### In UOFiddler:

1. Click **"Animations"** tab (top menu)
2. In the left panel:
   - **Body Type dropdown** → Select **400** (Male character)
3. In the **Action dropdown** → Select:
   - **1** = Standing/Idle
   - **9** = Attack (1-handed weapon)
   - **10** = Attack (2-handed weapon) ← **Use this for Halberd!**
   - **16** = Spell Cast
4. You'll see the animation preview in the center
5. **Right-click on the animation** → **"Export Animation"**
6. Save as PNG:
   - `idle.png` → Save to `C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\male\`
   - `attack.png` → Save to same folder
   - `cast.png` → Save to same folder

**Quick tip:** You only need the **first frame** of each animation for now!

---

## ⚡ Extract Spell Effects (10 min)

### Finding Spell Effect IDs:

Still in **Animations** tab:

1. In the **Body Type dropdown**, switch to **effect animations**
2. Or use the **search/filter** to find specific animation IDs

### Animation IDs to Extract:

| Spell | Animation ID (Decimal) | What to do |
|-------|----------------------|------------|
| **Lightning** | 20012 | Type in ID field → Export → Save as `lightning.png` |
| **Energy Bolt** | 14239 | Type in ID field → Export → Save as `ebolt.png` |
| **Explosion** | 14000 | Type in ID field → Export → Save as `explosion.png` |
| **Fizzle** | 14133 | Type in ID field → Export → Save as `fizzle.png` |

**Save all to:** `C:\Users\micha\Projects\utlima-onmind\assets\sprites\effects\`

### How to Find Animation by ID:

1. In Animations tab, look for **"Animation ID"** or **"Index"** input field
2. Type the number (e.g., `20012` for lightning)
3. Press Enter
4. Animation should load in preview
5. Right-click → Export

---

## 🗡️ Extract Weapon Graphics (5 min)

### In UOFiddler:

1. Click **"Items"** tab
2. In the **search/ID field**, type: **5182** (Halberd item ID)
3. You'll see the halberd graphic
4. **Right-click** → **"Export Image"**
5. Save as: `halberd.png`
6. Save to: `C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons\`

---

## 🔊 Extract Sounds (Optional, 10 min)

### In UOFiddler:

1. Click **"Sounds"** tab
2. Browse or search for sounds:
   - Look for weapon swing sounds (IDs around 500-600)
   - Look for spell sounds
   - **Click to preview** before exporting
3. Right-click → **"Export Sound"** (saves as WAV)
4. **Convert WAV to MP3** using online converter (optional)
5. Save to appropriate folders:
   - `assets/sounds/weapons/`
   - `assets/sounds/spells/`
   - `assets/sounds/character/`

**Common Sound IDs:**
- Weapon swing: ~570-580
- Hit sounds: ~530-550
- Lightning: ~29
- Explosion: ~776

---

## 🎯 Quick Extraction List (Minimum Viable)

**Just extract these 5 files for immediate improvement:**

1. ✅ **Character idle** (Body 400, Action 1) → `idle.png`
2. ✅ **Lightning** (Anim 20012) → `lightning.png`
3. ✅ **Energy Bolt** (Anim 14239) → `ebolt.png`
4. ✅ **Explosion** (Anim 14000) → `explosion.png`
5. ✅ **Halberd** (Item 5182) → `halberd.png`

**Time:** 15 minutes  
**Result:** Massive visual upgrade!

---

## 📁 Final File Structure

After extraction, your folders should look like:

```
C:\Users\micha\Projects\utlima-onmind\
└── assets\
    ├── sprites\
    │   ├── characters\
    │   │   └── male\
    │   │       ├── idle.png         ✅ Extracted
    │   │       ├── attack.png       ✅ Extracted
    │   │       └── cast.png         ✅ Extracted
    │   ├── weapons\
    │   │   └── halberd.png          ✅ Extracted
    │   └── effects\
    │       ├── lightning.png        ✅ Extracted
    │       ├── ebolt.png            ✅ Extracted
    │       ├── explosion.png        ✅ Extracted
    │       └── fizzle.png           ✅ Extracted
    └── sounds\
        ├── weapons\
        │   ├── halberd_swing.mp3    (Optional)
        │   └── halberd_hit.mp3      (Optional)
        └── spells\
            └── (various).mp3         (Optional)
```

---

## 🐛 Troubleshooting

### "UOFiddler won't open the files"
- Make sure you selected the correct UO installation folder
- Look for folders containing `.mul` or `.uop` files
- Try different folders if multiple UO installations exist

### "Animation IDs don't match"
- Your client version might have different IDs
- **Browse manually** through animations tab
- Look for animations that LOOK like lightning, explosions, etc.

### "Exported images have weird colors"
- This is normal for UO's indexed color palette
- Save as PNG anyway
- The game will display them correctly

### "Can't find specific animation"
- Use the **filter/search** feature in UOFiddler
- Browse through ranges:
  - Character animations: 0-100
  - Spell effects: 14000-21000
  - Items: 0-16000

---

## ✅ Testing Your Extracted Assets

1. **Place files in the folders** as shown above
2. **Navigate to:** `http://localhost:8080`
3. **Refresh the page** (Ctrl+R)
4. **Watch the loading bar** - should load your new assets!
5. **Start a match** - see your authentic UO graphics!

---

## 🎨 Before & After

**Before (Placeholders):**
- Simple colored rectangles
- Basic shapes
- No effects

**After (Real UO Assets):**
- Authentic UO character sprites
- Classic spell effect animations
- Nostalgic pixel art
- True Pre-AOS experience!

---

## 💡 Pro Tips

1. **Export multiple frames** if you want smooth animations (advanced)
2. **Export different character body types** for variety
3. **Extract more weapons** for future expansion
4. **Get sounds** for complete immersion
5. **Keep originals** - don't modify the extracted PNGs directly

---

## 🚀 Ready to Extract?

**Estimated time:** 30 minutes for full set  
**Minimum time:** 15 minutes for essentials  
**Difficulty:** Easy (just click and save!)

Once you're done extracting, just refresh your browser and see the authentic UO graphics come to life! 🎮✨

---

## ❓ Need Help?

Check the browser console (F12) to see which assets loaded successfully:
- ✅ Green = Asset loaded
- ⚠️ Yellow = Using placeholder
- ❌ Red = File missing

The asset loader is smart and will tell you exactly what files it's looking for!

