# How to Export UO Animations for Web

## ✅ **YES - UO Animations CAN be used in web games!**

The animations are stored in `.mul` files and can be exported as sprite sheets.

## Method 1: Using UOFiddler (Easiest)

1. **Open UOFiddler**
   ```
   UOFiddler4.8\UoFiddler.exe
   ```

2. **Go to Animations Tab**
   - Click the "Animations" tab at the top

3. **Find Character Animations**
   - Body ID 400 = Male Human
   - Body ID 401 = Female Human
   
4. **Select Animation**
   - Action 3 = Standing/Idle
   - Action 8 = Attack (1-handed)
   - Action 9 = Attack (2-handed)
   - Action 12 = Get Hit
   - Action 13 = Die
   - Action 18 = Cast Spell (1-handed)

5. **Export as GIF or PNG Sequence**
   - Right-click on the animation
   - Select "Export" → "Export as GIF" or "Export Frames"
   - This creates an animated GIF or individual PNG frames

6. **Convert to Sprite Sheet**
   - Use an online tool like:
     - https://www.codeandweb.com/free-sprite-sheet-packer
     - https://www.leshylabs.com/apps/sstool/
   - Or use ImageMagick:
     ```bash
     magick convert frame*.png +append spritesheet.png
     ```

## Method 2: Use Existing UO Sprite Sheets

Many UO fan sites have already extracted and shared sprite sheets:
- https://github.com/runuo/runuo (open-source UO server with assets)
- UO sprite databases online

## Method 3: Use Our Current Setup (Recommended for Now)

**For your game, I recommend:**

1. **Keep using the real UO halberd** (already working!)
2. **Use the enhanced placeholder character sprites** (look good, no copyright issues)
3. **Add simple CSS/Canvas animations** for smooth transitions

This gives you:
- ✅ Authentic UO weapon
- ✅ Good-looking characters
- ✅ Smooth animations
- ✅ No complex extraction needed
- ✅ No copyright concerns

## Quick Win: Let's Add Simple Animations Now!

I can add smooth weapon swing animations using the real halberd sprite you already have, without needing to extract complex character animations. Want me to do that?

