# UOFiddler Animation Export Guide

Based on official UOFiddler documentation: https://uofiddler.polserver.com/help.html

## ✅ **Correct Method to Export Animations:**

### Step 1: Open UOFiddler
```
UOFiddler4.8\UoFiddler.exe
```

### Step 2: Configure Paths (if not already done)
- Go to `Settings` → `Path Settings`
- Set path to: `C:\Program Files (x86)\Electronic Arts\Ultima Online Classic`
- Click `Reload Files`

### Step 3: Navigate to Animations Tab
- Click the **"Animations"** tab at the top

### Step 4: Find Your Animation
- **Body ID 400** = Male Human
- **Body ID 401** = Female Human
- **Action 9** = Attack (2-handed) ← **For halberd!**
- **Action 8** = Attack (1-handed)
- **Action 3** = Standing/Idle
- **Action 12** = Get Hit
- **Action 13** = Die
- **Action 18** = Cast Spell

### Step 5: Export Animation
**IMPORTANT:** Right-click on the **animation preview** (the animated character shown), NOT on the list!

- Right-click on the **animation preview window**
- Select **"Export Animation"** from the context menu
- Choose destination folder: `assets/sprites/animations/`
- The animation will be exported as individual frames (BMP format)

### Step 6: Process the Frames
Once exported, run:
```bash
python process_exported_frames.py <exported_folder> male_attack_2h.png
```

## 📋 **What to Export:**

For the PvP simulator, export these animations:

1. **Male Attack 2H** (Body 400, Action 9, Dir 2) → `male_attack_2h/`
2. **Male Idle** (Body 400, Action 3, Dir 2) → `male_idle/`
3. **Male Cast** (Body 400, Action 18, Dir 2) → `male_cast/`
4. **Male Hit** (Body 400, Action 12, Dir 2) → `male_hit/`

## 🔍 **If "Export Animation" Doesn't Appear:**

1. Make sure you're right-clicking on the **animation preview** (the animated sprite), not the list
2. Try clicking on the animation in the list first, then right-click the preview
3. Check if there's a menu bar option: `File` → `Export` → `Animation`
4. Some versions might have it under `Tools` → `Export Animation`

## 📝 **Note:**

- Exported frames are typically in **BMP format**
- UOFiddler exports all frames of the animation automatically
- Frame count varies by animation (usually 5-10 frames for attacks)

