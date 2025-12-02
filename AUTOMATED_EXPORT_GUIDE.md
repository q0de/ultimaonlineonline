# Automated UO Animation Export Guide

## 🎯 **Goal: Automate Animation Extraction from UOFiddler**

Since Ultima.dll's animation API is complex, here's the best approach:

## ✅ **Solution: Auto-Process UOFiddler Exports**

I've created `auto_process_uofiddler_exports.py` which automatically processes any BMP files you export from UOFiddler.

### How It Works:

1. **Export from UOFiddler** → BMP files saved to export directory
2. **Run the script** → Automatically processes all BMP files into sprite sheets
3. **Done!** → Sprite sheets ready to use in the game

### Usage:

```bash
# Process all exported BMP files
python auto_process_uofiddler_exports.py
```

The script will:
- Find all BMP files in the export directory
- Parse filenames to determine animation type
- Create sprite sheets with transparency
- Save to `assets/sprites/characters/test/`

## 📋 **What to Export from UOFiddler:**

### Quick Export Checklist:

1. **Idle** (Body 400, Action 3, Direction 2)
2. **Attack 2H** (Body 400, Action 9, Direction 2) ✅ Already done
3. **Walk** (Body 400, Action 0, Directions 0-7) ✅ Already done
4. **Get Hit** (Body 400, Action 12, Direction 2)
5. **Cast Spell** (Body 400, Action 16, Direction 2)
6. **Death** (Body 400, Action 20, Direction 2)

### Export Steps in UOFiddler:

1. Open UOFiddler → Animations tab
2. Select Body ID: **400** (Male Human)
3. Select Action (see list above)
4. Select Direction: **2** (Southeast - standard combat view)
5. Right-click animation preview → **Export Animation** → **Export Frames**
6. Save to: `assets/sprites/characters/test/` (or default export folder)
7. Run: `python auto_process_uofiddler_exports.py`

## 🔄 **Batch Export Workflow:**

### Option 1: Manual Export (Current Method)
1. Export each animation from UOFiddler GUI
2. Run `python auto_process_uofiddler_exports.py`
3. Done!

### Option 2: Watch Mode (Future Enhancement)
The script can watch for new exports automatically (needs GUI automation)

## 📝 **File Naming:**

UOFiddler exports files as:
- `Mob 400-{action}-{direction}-{frame}.bmp` (full format)
- `Mob 400-{action}-{direction}.bmp` (single frame)
- `Mob 400-{direction}.bmp` (walking, action 0 assumed)

The script automatically parses these patterns!

## 🚀 **Next Steps:**

1. Export remaining animations (Hit, Cast, Death) from UOFiddler
2. Run `python auto_process_uofiddler_exports.py`
3. Animations will be automatically integrated into the game!

## 💡 **Alternative: Direct .mul File Parsing**

If you want to avoid UOFiddler entirely, we could parse `.mul` files directly, but that's more complex and error-prone. The UOFiddler export method is more reliable.

