# How to Test Static Loading

## Quick Steps

### 1. Copy Static Files
**Option A: Use the batch file**
- Double-click `copy_statics.bat` in the project folder
- It will copy the files automatically

**Option B: Manual copy**
- Open File Explorer
- Navigate to: `C:\Users\micha\Projects\utlima-onmind\`
- Copy these 2 files:
  - `Ultima Online Classic\statics0.mul` → `assets\mul\statics0.mul`
  - `Ultima Online Classic\staidx0.mul` → `assets\mul\staidx0.mul`

### 2. Open the Terrain Generator
- Navigate to: `C:\Users\micha\Projects\utlima-onmind\`
- Find `terrain_generator_demo.html`
- **Double-click it** (it will open in your default browser)
- OR right-click → "Open with" → Choose Chrome/Firefox/Edge

### 3. Open Browser Console
**Press F12** (or right-click page → "Inspect" → "Console" tab)

You'll see a panel at the bottom or side with console messages.

### 4. Click the Button
Look for the orange button: **"🗺️ Load Real UO Map"**

Click it!

### 5. Watch the Console
You should see messages like:
```
[loadRealUOMap] Starting...
[UOStaticLoader] Loading statics from ./assets/mul/statics0.mul...
[UOStaticLoader] ✅ Loaded X bytes index, Y bytes static data
[loadRealUOMap] Found 50 static objects in region
[WebGLRenderer] 50 static objects detected
```

## What You'll See

✅ **Map renders** - You'll see the 3D terrain with water, grass, cliffs
✅ **Console shows statics** - Lists what static objects were found
⚠️ **Statics not visible yet** - They're detected but not rendered (we're working on that)

## Troubleshooting

**If you see "Statics not available":**
- Files aren't copied yet - run `copy_statics.bat`
- Check that `assets\mul\statics0.mul` exists

**If console is empty:**
- Make sure you clicked the "Load Real UO Map" button
- Check for any red error messages in console

**If page doesn't load:**
- Make sure you're opening `terrain_generator_demo.html` (not index.html)
- Try a different browser (Chrome recommended)









