# Animation Export System

## ⚠️ Two Methods Available!

### Method 1: Auto-Export (F2/F3 in game) - RECOMMENDED
### Method 2: Manual Capture (for existing Equipment files)

---

## METHOD 1: Auto-Export from Game (RECOMMENDED)

Browsers **cannot** create folders automatically. All files download to your **Downloads folder** first.

### STEP 1: Export Files from Game
1. Press **F1** (debug mode)
2. Press **Numpad 8** (lock to NORTH)
3. Press **F3** (batch export all frames)
4. Repeat for all directions (numpad 1-9)

✅ **Files are now in Downloads folder**
   - Example: `running-halberd-north-frame0.bmp`

### STEP 2: Organize Into Folders
**Double-click:** `organize_exports.bat`

This script will:
- ✅ Find all exported files in Downloads
- ✅ Create folder structure: `exports/running/halberd/north/`
- ✅ Move and rename files: `frame0.png`, `frame1.png`, etc.
- ✅ Show you the results

---

## 📁 Final Folder Structure

After running `organize_exports.bat`:

```
exports/
  └── running/
      └── halberd/
          ├── north/
          │   ├── frame0.bmp
          │   ├── frame1.bmp
          │   ├── frame2.bmp
          │   └── frame3.bmp
          ├── northeast/
          ├── east/
          ├── southeast/
          ├── south/
          ├── southwest/
          ├── west/
          └── northwest/
```

---

## 🎯 Quick Start

1. **In game:** F1 → Numpad 8 → F3 *(export north)*
2. **In game:** Numpad 9 → F3 *(export northeast)*
3. **In game:** Numpad 6 → F3 *(export east)*
4. *(Repeat for all 8 directions)*
5. **Double-click:** `organize_exports.bat` *(organize into folders)*

---

## ❓ Troubleshooting

**Q: Files aren't going into folders!**
A: You need to run `organize_exports.bat` AFTER exporting. Browsers can't create folders automatically.

**Q: Where are my exported files?**
A: Check your Downloads folder. Files are named like: `running-halberd-north-frame0.png`

**Q: organize_exports.bat doesn't work!**
A: Make sure you have Python installed. The script looks in your Downloads folder for exported files.

**Q: I want to export a different weapon!**
A: Press Q to switch weapons, then repeat the export process. The weapon name will be in the filename automatically.

---

## METHOD 2: Organize Manual Captures

If you already captured frames using Windows Snipping Tool or other methods, and have files named like `Equipment 624-0.bmp`:

### Step 1: Ensure files are in Downloads
All your `Equipment*.bmp` files should be in your Downloads folder.

### Step 2: Run the Manual Organizer
**Double-click:** `organize_manual_exports.bat`

### Step 3: Answer the prompts
The script will ask you:
1. **Animation type** (running/walk/idle/attack)
2. **Weapon name** (halberd/sword/staff)
3. **Direction** (north/south/east/west/northeast/northwest/southeast/southwest)

### Step 4: Files organized!
The script will:
- ✅ Find all Equipment BMP files in Downloads
- ✅ Rename them to frame0.bmp, frame1.bmp, etc.
- ✅ Move them to: `exports/running/halberd/north/`

### Step 5: Repeat for other directions
- Capture next set of frames (e.g., northeast)
- Run `organize_manual_exports.bat` again
- Specify the new direction

---

## 🎯 Comparison

**Auto-Export (F2/F3):**
- ✅ Automatically names files correctly
- ✅ Includes weapon/direction in filename
- ✅ Faster for multiple directions
- ❌ Requires game running in browser

**Manual Capture:**
- ✅ Works with any screen capture tool
- ✅ Can capture from anywhere
- ❌ Requires manual organization
- ❌ Need to run script for each direction

