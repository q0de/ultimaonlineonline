# How to Export Full Walking Animation Sequences from UOFiddler

## The Problem
You currently have single frames per direction (e.g., `Mob 400-0.bmp`), but you need **multiple frames** per direction to create smooth walking animations.

## Solution: Export All Frames

### Step 1: Open UOFiddler
- Launch `UOFiddler4.8\UoFiddler.exe`

### Step 2: Navigate to Animations Tab
- Click the **"Animations"** tab at the top

### Step 3: Select Walking Animation
- **Body ID:** 400 (Male Human)
- **Action:** 0 (Walk)
- **Direction:** Start with 0 (North)

### Step 4: Export All Frames
UOFiddler has different export options. Try these methods:

#### Method 1: Right-Click Export (Recommended)
1. **Right-click on the animation preview** (the animated character shown)
2. Look for menu options like:
   - **"Export Animation"** → **"Export Frames"**
   - **"Export"** → **"Export Frames"**
   - **"Save Frames"**
   - **"Export All Frames"**

#### Method 2: Menu Bar Export
1. Look at the top menu bar:
   - **File** → **Export** → **Animation Frames**
   - **Animation** → **Export** → **Frames**
   - **Tools** → **Export Animation**

#### Method 3: Animation Controls
1. Look for buttons/controls near the animation preview:
   - **"Export"** button
   - **"Save"** button
   - **"Export Frames"** button

### Step 5: Choose Export Location
- When prompted, save to: `C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test\`
- Or save to default location and we'll move them

### Step 6: Expected Output
You should get files like:
- `Mob 400-0-0-0.bmp` (Body-Action-Direction-Frame)
- `Mob 400-0-0-1.bmp`
- `Mob 400-0-0-2.bmp`
- `Mob 400-0-0-3.bmp`
- etc. (usually 6-8 frames per direction)

### Step 7: Repeat for All Directions
Export Action 0 (Walk) for all 8 directions:
- Direction 0: North
- Direction 1: Northeast
- Direction 2: East
- Direction 3: Southeast
- Direction 4: South
- Direction 5: Southwest
- Direction 6: West
- Direction 7: Northwest

### Step 8: Process the Exports
After exporting, run:
```bash
python auto_process_uofiddler_exports.py
```

## Alternative: If Export Frames Doesn't Exist

If UOFiddler doesn't have an "Export Frames" option, you might need to:

1. **Export as GIF** and then extract frames using a tool
2. **Use a different export method** - check UOFiddler's help/documentation
3. **Manually capture frames** by stepping through the animation

## What You're Looking For

The export should create files with this pattern:
```
Mob 400-0-0-0.bmp  (Body 400, Action 0, Direction 0, Frame 0)
Mob 400-0-0-1.bmp  (Body 400, Action 0, Direction 0, Frame 1)
Mob 400-0-0-2.bmp  (Body 400, Action 0, Direction 0, Frame 2)
...
Mob 400-0-1-0.bmp  (Body 400, Action 0, Direction 1, Frame 0)
Mob 400-0-1-1.bmp  (Body 400, Action 0, Direction 1, Frame 1)
...
```

NOT just:
```
Mob 400-0.bmp  (single frame)
Mob 400-1.bmp  (single frame)
```

## Need Help?

If you can't find the export option, try:
1. Check UOFiddler's Help menu
2. Look for keyboard shortcuts (often Ctrl+E or similar)
3. Check if there's a toolbar button for export
4. Try right-clicking different areas of the animation window

