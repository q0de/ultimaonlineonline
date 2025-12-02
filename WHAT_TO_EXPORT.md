# What to Export for Halberd Walk Animations

## ✅ CORRECT: Character Animations (Mob 400)
You need to export **CHARACTER animations** while holding a halberd:
- **Body Type:** 400 (Male character)
- **Animation:** 0 (Walk_01)
- **Weapon:** Halberd (624) - this is just the weapon they're holding
- **Files should be named:** `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc.

## ❌ WRONG: Equipment Sprites (Equipment 624)
These are just the halberd weapon sprites themselves:
- **Files named:** `Equipment 624-0.bmp`, `Equipment 624-1.bmp`, etc.
- These are NOT character animations!

## How to Export Correctly in UOFiddler:

1. **Go to Animations tab**
2. **Select Body Type:** 400 (Male)
3. **Select Animation:** 0 Walk_01 (or find "Walk_01" in the halberd weapon animations list)
4. **Make sure the character is holding a halberd** in the preview
5. **Export each direction** (0-7) as BMP files
6. **Files should be:** `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc. (NOT Equipment 624!)

## Export Order:
Export 8 directions in this order:
1. NE (Northeast) - Direction 1
2. E (East) - Direction 2  
3. SE (Southeast) - Direction 3
4. S (South) - Direction 4
5. SW (Southwest) - Direction 5
6. W (West) - Direction 6
7. NW (Northwest) - Direction 7
8. N (North) - Direction 0

Each direction should have 10 frames (Mob 400-0.bmp through Mob 400-9.bmp).









