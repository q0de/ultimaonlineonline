# Simple Export Instructions

## ✅ YES! I Can Auto-Organize Everything!

Just export from UOFiddler and I'll handle the rest automatically!

## How to Export:

1. **In UOFiddler, select halberd (624)**
2. **Select an animation** (e.g., "13 Attack_Slash_2H_01")
3. **Export for each direction** (0-7):
   - Right-click → Export Animation
   - Save to: `assets/sprites/animations/` (anywhere in this folder)
   - You can save with any name - I'll detect it automatically!

4. **Repeat for other animations** you want

## Then Run:

```bash
python auto_organize_halberd_animations.py
```

## What I Do Automatically:

✅ **Finds all exported files** (BMP/PNG)  
✅ **Detects animation type** (Attack_Slash_2H, Walk_01, etc.)  
✅ **Detects direction** (from filename or folder)  
✅ **Creates organized folders**  
✅ **Processes into sprite sheets**  
✅ **Removes white backgrounds**  
✅ **Names files correctly**  
✅ **Saves to game-ready location**  

## Export Tips:

- **You can export anywhere** in `assets/sprites/animations/`
- **I'll find and organize everything automatically**
- **Direction can be in filename** (e.g., "Mob 400-2.bmp" = east) **OR folder name** (e.g., "north/")
- **Animation type can be in filename** (e.g., "Attack_Slash_2H") **OR folder name**

## Example Export Structure:

You can export like this:
```
assets/sprites/animations/
├── Attack_Slash_2H_01/
│   ├── north/
│   │   └── Mob 400-0.bmp, Mob 400-1.bmp...
│   ├── east/
│   │   └── Mob 400-2.bmp...
│   └── ...
├── Walk_01/
│   └── ...
```

OR like this:
```
assets/sprites/animations/
├── Mob 400-0.bmp (north walk)
├── Mob 400-2.bmp (east walk)
└── ...
```

**I'll organize it all automatically!**









