# Export UO Animations Using UOFiddler GUI

## ✅ **This is the EASIEST and MOST RELIABLE method!**

UOFiddler's GUI has built-in export that works perfectly. Here's how:

## Step-by-Step Guide:

### 1. Open UOFiddler
```
UOFiddler4.8\UoFiddler.exe
```

### 2. Go to Animations Tab
- Click "Animations" tab at the top

### 3. Navigate to Character Animations
- **Body ID 400** = Male Human  
- **Body ID 401** = Female Human

### 4. Select Animation
- **Action 3** = Standing/Idle
- **Action 8** = Attack (1-handed) - **THIS IS WHAT WE NEED!**
- **Action 9** = Attack (2-handed) - **FOR HALBERD!**
- **Action 12** = Get Hit
- **Action 13** = Die
- **Action 18** = Cast Spell

### 5. Select Direction
- **Direction 2** = Facing SE (southeast) - This is the standard combat view

### 6. Export Animation
- Right-click on the animation preview
- Select **"Export"** → **"Export as GIF"** OR **"Export Frames"**
- Save to: `assets/sprites/animations/`

### 7. What You'll Get:
- **If GIF**: Animated GIF with all frames
- **If Frames**: Individual PNG files (frame_000.png, frame_001.png, etc.)

### 8. Convert to Sprite Sheet (if needed)
If you exported frames, I can create a script to combine them into a sprite sheet!

## Quick Export List:

Export these animations for the game:

1. **Male Attack 2H** (Body 400, Action 9, Dir 2) → `male_attack_2h.png`
2. **Male Idle** (Body 400, Action 3, Dir 2) → `male_idle.png`  
3. **Male Cast** (Body 400, Action 18, Dir 2) → `male_cast.png`
4. **Male Hit** (Body 400, Action 12, Dir 2) → `male_hit.png`

Once you export these, I'll integrate them into the game immediately!

## Alternative: I Can Create a Batch Script

If you want, I can create a batch script that opens UOFiddler and guides you through the export process automatically.

