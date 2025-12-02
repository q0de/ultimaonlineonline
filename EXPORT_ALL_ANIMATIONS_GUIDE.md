# Export All Character Animations from UOFiddler

## Quick Guide

### Step 1: Open UOFiddler
```
UOFiddler4.8\UoFiddler.exe
```

### Step 2: Go to Animations Tab
- Click "Animations" tab at the top

### Step 3: Export Each Animation

For each animation below, follow these steps:

1. **Set Body ID**: `400` (Male Human)
2. **Set Direction**: `2` (Southeast - standard combat view)
3. **Set Action**: (see table below)
4. **Right-click** on the animation preview
5. **Select**: "Export" → "Export Frames"
6. **Save to**: `C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test\`

## Animations to Export

| Action ID | Description | Export Pattern | Use Case |
|-----------|-------------|----------------|----------|
| **0** | Walk | `Mob 400-0` | Character walking |
| **1** | Stand/Idle | `Mob 400-1` | Standing still (we have this) |
| **9** | Attack 2H | `Mob 400-9` | Two-handed weapon attack (we have this) |
| **12** | Get Hit | `Mob 400-12` | Taking damage |
| **16** | Cast Spell | `Mob 400-16` | Casting magic |
| **20** | Death | `Mob 400-20` | Character death |

## Export Process

1. **Walk Animation**:
   - Body: `400`
   - Action: `0`
   - Direction: `2`
   - Export frames → Save as `Mob 400-0-X.bmp` (where X is frame number)

2. **Hit Animation**:
   - Body: `400`
   - Action: `12`
   - Direction: `2`
   - Export frames → Save as `Mob 400-12-X.bmp`

3. **Cast Animation**:
   - Body: `400`
   - Action: `16`
   - Direction: `2`
   - Export frames → Save as `Mob 400-16-X.bmp`

4. **Death Animation**:
   - Body: `400`
   - Action: `20`
   - Direction: `2`
   - Export frames → Save as `Mob 400-20-X.bmp`

## After Exporting

Once you've exported the animations, run:

```bash
python export_all_animations.py
```

This will:
- Process all exported BMP files
- Remove white backgrounds (make transparent)
- Create sprite sheets for each animation
- Save them ready for the game

## What Gets Created

After processing, you'll have:
- `male_walk_sheet.png` - Walking animation
- `male_hit_sheet.png` - Hit reaction animation
- `male_cast_sheet.png` - Spell casting animation
- `male_death_sheet.png` - Death animation
- `male_attack_2h_sheet.png` - Attack animation (already done!)

Then the game will automatically use these animations based on character state!

