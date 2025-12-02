# UO Asset Extraction Guide - Step by Step

## Overview
This guide will walk you through extracting original Ultima Online game assets for use in your PvP simulator project.

---

## Prerequisites

### Required Software
1. **Ultima Online Client** (Classic or Enhanced)
   - You need this installed to have access to the .mul data files
   - Can be from your own installation if you own/owned UO

2. **UO Fiddler** (Recommended)
   - Download: https://github.com/polserver/UOFiddler/releases
   - Latest release: Download the .zip, extract, run UOFiddler.exe
   - No installation required (portable)

3. **Alternative: Ultima SDK**
   - Download: https://github.com/ServUO/ultimasdk
   - More developer-focused, command-line based

### Optional Tools
- **Paint.NET** or **GIMP**: For editing/cleaning up sprites
- **Audacity**: For editing/converting sound files
- **Image Magick**: For batch processing PNG files

---

## Part 1: Setting Up UO Fiddler

### Step 1: Launch UO Fiddler
1. Extract UOFiddler.zip to a folder
2. Run `UOFiddler.exe`
3. First time launch: You'll see "Options" dialog

### Step 2: Configure UO Directory
1. Click **"Options"** → **"Settings"**
2. Set **"Ultima Online Directory"** path:
   - Default install locations:
     - `C:\Program Files (x86)\Electronic Arts\Ultima Online Classic`
     - `C:\Program Files (x86)\EA Games\Ultima Online`
     - `C:\Program Files (x86)\Origin Games\Ultima Online`
3. Click **"Load"** or **"Reload"**
4. Wait for files to index (may take 30-60 seconds)

### Step 3: Verify Files Loaded
- Status bar should show: **"Loaded"**
- Tabs should be populated with data
- If errors: Double-check your UO directory path

---

## Part 2: Extracting Character Sprites

### Animation IDs You Need
- **Male Character:** Body Type `400` (0x190 in hex)
- **Female Character:** Body Type `401` (0x191 in hex)

### Step 1: Navigate to Animations Tab
1. Click **"Animations"** tab at the top
2. You'll see a dropdown for "Body"
3. Enter `400` for male character

### Step 2: Export Character Animations

**For Each Animation Type:**

| Animation | ID | Description |
|-----------|------|-------------|
| Idle/Stand | 0 | Standing still |
| Walk | 0 | Walking |
| Run | 2 | Running |
| Attack (1H) | 9 | One-handed weapon swing |
| Attack (2H) | 10 | Two-handed weapon swing (HALBERD) |
| Cast Spell | 16 | Spell casting pose |
| Get Hit | 20 | Taking damage reaction |
| Die | 21 | Death animation |

**Export Process:**
1. Select animation ID from dropdown (e.g., "10" for 2H attack)
2. You'll see 5 direction previews
3. Click **"Export"** button
4. Choose export format: **PNG** with transparency
5. It will export all 5 directions as separate files
6. Repeat for all 8 animation types

**Naming Convention:**
```
male_idle_south.png
male_idle_southeast.png
male_attack2h_south.png
male_attack2h_southeast.png
male_cast_south.png
male_death.png
```

**Pro Tip:** UO uses 5 directions (S, SE, E, NE, N). The engine mirrors sprites for SW, W, NW.

---

## Part 3: Extracting Weapon Graphics

### Step 1: Find Halberd Item ID
1. Click **"Items"** tab
2. Use search box or browse
3. Search for "Halberd" or browse to ID range **0x143E** to **0x143F**
   - Halberd Item ID: `0x143E` (5182 decimal)

### Step 2: Export Weapon Item Graphic
1. Select the Halberd item
2. You'll see the item graphic preview
3. Click **"Export"** → Save as PNG
4. Save as: `halberd_item.png`

### Step 3: Export Equipped Weapon Overlay
- Some weapons have separate "equipped" graphics
- Check Animations tab for weapon overlay animations
- These layer on top of character sprites when equipped

---

## Part 4: Extracting Spell Effect Graphics

### Spell Animation IDs

| Spell | Animation ID (approx) | Description |
|-------|------|-------------|
| Lightning | 140-145 | Lightning bolt from sky |
| Energy Bolt | 379-384 | Purple/blue projectile |
| Explosion | 14000-14010 | Explosion effect |
| Fizzle | 14013 | Spell failure sparkles |

### Step 1: Export Spell Animations
1. Go to **"Animations"** tab
2. Switch from "Character" to "Special" or scroll to high IDs
3. Find spell effect animations
4. Export each frame as PNG
5. Spell effects have multiple frames (10-20 typically)

**File Naming:**
```
lightning_frame_01.png
lightning_frame_02.png
...
lightning_frame_10.png
```

### Step 2: Create Sprite Sheets (Optional but Recommended)
- Combine individual frames into sprite sheets for web performance
- Use ImageMagick or a sprite sheet tool
- Grid layout: all frames in one horizontal row

**Example command (ImageMagick):**
```bash
magick convert lightning_frame_*.png +append lightning_spritesheet.png
```

---

## Part 5: Extracting UI Elements (Gumps)

### Step 1: Navigate to Gumps Tab
1. Click **"Gumps"** tab
2. Gumps are UI elements (windows, buttons, bars)

### Common Gump IDs You Need

| Element | Gump ID | Description |
|---------|---------|-------------|
| Health Bar | 0x0804 | Red health bar |
| Mana Bar | 0x0805 | Blue mana bar |
| Stamina Bar | 0x0806 | Green stamina bar |
| Status Window | 0x002A | Character status gump background |
| Paperdoll BG | 0x07D0 | Equipment/paperdoll background |
| Button (Default) | 0x15E1 | Generic button graphic |

### Step 2: Export Gumps
1. Browse or search for gump IDs
2. Preview will show the graphic
3. Click **"Export"** → save as PNG
4. UO gumps already have transparency

**File Naming:**
```
ui_healthbar.png
ui_manabar.png
ui_staminabar.png
ui_paperdoll_bg.png
```

---

## Part 6: Extracting Tile Graphics

### Step 1: Navigate to Land Tiles Tab
1. Click **"Land Tiles"** tab
2. Browse tile graphics

### Useful Tile IDs
- Grass: `0x0003` to `0x0015`
- Dirt: `0x0071` to `0x007E`
- Stone: `0x0519` to `0x0550`
- Sand: `0x0016` to `0x001B`

### Step 2: Export Tiles
1. Select desired tile
2. Export as PNG
3. Tiles are 44x44 pixels (standard UO size)

**File Naming:**
```
tile_grass_01.png
tile_stone_01.png
```

---

## Part 7: Extracting Sounds

### Step 1: Navigate to Sounds Tab
1. Click **"Sounds"** tab
2. Browse or search for sound effects

### Important Sound IDs

| Sound | ID Range | Description |
|-------|----------|-------------|
| Weapon Swing | 0x0100-0x0150 | Whoosh sounds |
| Weapon Hit | 0x0020-0x0050 | Impact on flesh/armor |
| Spell Cast | 0x01E9-0x0210 | Magic casting sounds |
| Lightning | 0x0029 | Thunder crack |
| Explosion | 0x0207 | Explosion boom |
| Energy Bolt | 0x020C | Energy bolt whoosh |
| Fizzle | 0x005C | Spell fizzle sound |
| Death | 0x0150-0x0160 | Death screams |
| Footsteps | 0x012B-0x0134 | Walking sounds |

### Step 2: Export & Convert Sounds
1. Select sound ID
2. Play preview to verify
3. Export as **WAV** file
4. Convert WAV to **MP3** or **OGG** for web using:
   - Audacity (free)
   - FFmpeg (command line)
   - Online converters

**FFmpeg conversion example:**
```bash
ffmpeg -i lightning.wav -codec:a libmp3lame -b:a 128k lightning.mp3
```

**File Naming:**
```
sfx_halberd_swing.mp3
sfx_halberd_hit.mp3
sfx_lightning.mp3
sfx_explosion.mp3
sfx_ebolt.mp3
sfx_fizzle.mp3
sfx_death.mp3
```

---

## Part 8: Alternative Method - ClassicUO Client

### If You Use ClassicUO (Open-Source UO Client)

**Advantages:**
- More accessible file formats
- Better organized asset structure
- Active development

**Location of Assets:**
```
ClassicUO/Data/
  /art/          (items, statics)
  /gumps/        (UI elements)
  /animations/   (character/creature animations)
  /sounds/       (all sound effects)
```

**Extraction:**
- Files may already be in PNG/MP3 format
- Can copy directly without conversion
- Check ClassicUO documentation for asset export tools

---

## Part 9: Organizing Your Extracted Assets

### Recommended Folder Structure

```
/uo_assets/
  /sprites/
    /characters/
      /male/
        idle_S.png, idle_SE.png, idle_E.png, idle_NE.png, idle_N.png
        walk_S.png, walk_SE.png, etc.
        attack2h_S.png, attack2h_SE.png, etc.
        cast_S.png, cast_SE.png, etc.
        hit_S.png, death.png
      /female/
        [same structure as male]
    /weapons/
      halberd_item.png
      halberd_equipped_S.png, halberd_equipped_SE.png, etc.
    /effects/
      lightning_spritesheet.png (or individual frames)
      ebolt_spritesheet.png
      explosion_spritesheet.png
      fizzle.png
  /ui/
    healthbar.png
    manabar.png
    staminabar.png
    paperdoll_bg.png
    button_bg.png
    spell_icon_lightning.png
    spell_icon_ebolt.png
    spell_icon_explosion.png
  /tiles/
    grass_01.png
    stone_01.png
  /sounds/
    /weapons/
      halberd_swing.mp3
      halberd_hit.mp3
      halberd_miss.mp3
    /spells/
      cast_lightning.mp3
      cast_ebolt.mp3
      cast_explosion.mp3
      impact_lightning.mp3
      impact_ebolt.mp3
      impact_explosion.mp3
      fizzle.mp3
    /character/
      hit.mp3
      death.mp3
      footstep_01.mp3
```

---

## Part 10: Post-Processing Assets

### Cleaning Up Sprites

**Remove Black Backgrounds:**
1. Open sprite in GIMP or Paint.NET
2. Use "Select by Color" tool → select black
3. Delete black background
4. Ensure transparency is preserved
5. Export as PNG-24 with alpha channel

**Create Sprite Sheets:**
- Combine animation frames into single sprite sheet
- Horizontal strips work best for web canvas rendering
- Include metadata: frame width, frame count

**Example Sprite Sheet Layout:**
```
[Frame1][Frame2][Frame3][Frame4][Frame5][Frame6][Frame7]
 44x64   44x64   44x64   44x64   44x64   44x64   44x64
```

### Optimizing for Web

**PNG Optimization:**
```bash
# Using pngcrush
pngcrush -brute input.png output.png

# Using optipng
optipng -o7 *.png
```

**Audio Compression:**
- MP3: 128kbps is sufficient for game SFX
- OGG: 96-128kbps
- Keep file sizes small (<100KB per sound)

---

## Part 11: Creating a Metadata File

### Asset Manifest (JSON)

Create `assets_manifest.json` to track all assets:

```json
{
  "version": "1.0",
  "characters": {
    "male": {
      "idle": {
        "frames": 1,
        "directions": ["S", "SE", "E", "NE", "N"],
        "frameWidth": 44,
        "frameHeight": 64,
        "files": {
          "S": "sprites/characters/male/idle_S.png",
          "SE": "sprites/characters/male/idle_SE.png"
        }
      },
      "attack2h": {
        "frames": 7,
        "fps": 10,
        "directions": ["S", "SE", "E", "NE", "N"],
        "frameWidth": 64,
        "frameHeight": 64,
        "files": {
          "S": "sprites/characters/male/attack2h_S.png"
        }
      }
    }
  },
  "spells": {
    "lightning": {
      "frames": 10,
      "fps": 20,
      "frameWidth": 64,
      "frameHeight": 128,
      "file": "sprites/effects/lightning_spritesheet.png"
    }
  },
  "sounds": {
    "halberd_swing": "sounds/weapons/halberd_swing.mp3",
    "lightning_cast": "sounds/spells/cast_lightning.mp3",
    "lightning_impact": "sounds/spells/impact_lightning.mp3"
  }
}
```

---

## Part 12: Legal Considerations

### Fair Use & Fan Projects

**Important Notes:**
- UO assets are copyrighted by EA/Broadsword
- Extraction for personal/educational use is common in the community
- Do NOT redistribute raw assets publicly
- Do NOT use commercially without permission
- This is a fan project - make that clear

**Recommended Disclaimer:**
```
"This project uses assets extracted from Ultima Online, 
which is copyrighted by Electronic Arts and Broadsword Games. 
This is a non-commercial fan project for educational purposes. 
Users should own a copy of Ultima Online to extract assets."
```

---

## Part 13: Troubleshooting

### Common Issues

**UO Fiddler Won't Load:**
- Ensure UO directory is correct
- Check that .mul files exist in the directory
- Try running UOFiddler as Administrator
- Update to latest UOFiddler version

**Missing Animations:**
- Some animation IDs vary by client version (Classic vs. Enhanced)
- Try browsing nearby IDs
- Check UO Stratics for animation ID references

**Sounds Won't Export:**
- Some client versions have encrypted sound files
- Use ClassicUO client instead (unencrypted)
- Download legacy UO client (pre-2010)

**Sprites Have Black Backgrounds:**
- Some UO sprites use black as color, not transparency
- Manually remove in image editor
- Use "magic wand" or "select by color" tools

**File Size Too Large:**
- Run PNG optimization tools
- Reduce sprite sheet dimensions if needed
- Convert audio to lower bitrates

---

## Part 14: Quick Reference Checklist

### Essential Assets Checklist

**Character Sprites:**
- [ ] Male idle (5 directions)
- [ ] Male attack 2H (5 directions × 7 frames)
- [ ] Male cast spell (5 directions × 5 frames)
- [ ] Male get hit (5 directions)
- [ ] Male death (1 animation)

**Weapon Graphics:**
- [ ] Halberd item graphic
- [ ] Halberd equipped overlays (5 directions)

**Spell Effects:**
- [ ] Lightning animation (10+ frames)
- [ ] Energy Bolt animation (8+ frames)
- [ ] Explosion animation (15+ frames)
- [ ] Fizzle effect (6+ frames)

**UI Elements:**
- [ ] Health bar
- [ ] Mana bar
- [ ] Stamina bar
- [ ] Spell icons (3 minimum)
- [ ] Button backgrounds

**Sounds:**
- [ ] Halberd swing
- [ ] Halberd hit
- [ ] Lightning cast + impact
- [ ] Energy Bolt cast + impact
- [ ] Explosion cast + impact
- [ ] Fizzle sound
- [ ] Death sound

**Tiles:**
- [ ] Arena floor tiles (grass or stone)

---

## Additional Resources

### UO Community Sites
- **UO Stratics:** https://uo.stratics.com/ (animation/item IDs)
- **ServUO Forums:** https://www.servuo.com/ (emulator community)
- **ClassicUO GitHub:** https://github.com/ClassicUO/ClassicUO

### Tools
- **UO Fiddler:** https://github.com/polserver/UOFiddler
- **Ultima SDK:** https://github.com/ServUO/ultimasdk
- **GIMP:** https://www.gimp.org/
- **Audacity:** https://www.audacityteam.org/
- **ImageMagick:** https://imagemagick.org/

### Reference Sheets
- [UO Animation IDs](https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/AnimationIDs.cs)
- [UO Sound IDs](https://uo.stratics.com/content/guides/soundids.php)
- [UO Item IDs](https://uo.stratics.com/database/)

---

## Conclusion

Once you have all assets extracted and organized:
1. Reference the main requirements document
2. Begin implementing the web-based simulator
3. Load assets dynamically via JavaScript
4. Render sprites using HTML5 Canvas
5. Test animations and timing

**Estimated Time:** 3-5 hours to extract all necessary assets

Good luck with your UO PvP simulator! 🗡️⚔️
