# Export Attack Bash 2H Character Animation Guide

## 🎯 Goal
Export the **human character body** performing "Attack Bash 2H" animation (no weapon) to match with your weapon animations.

---

## 📋 What You're Exporting

**Animation:** Attack Bash 2H (Human Male Body - no weapon)  
**Mob ID:** 400 (Human Male)  
**Directions:** 8 (NE, E, SE, S, SW, W, NW, N)  
**Frames per direction:** ~7-10 frames  
**Output Format:** BMP files

---

## 🔧 Step-by-Step Instructions

### 1. Open UOFiddler
- Launch `UOFiddler.exe` from `UOFiddler4.8` folder
- Wait for it to load all UO assets

### 2. Navigate to Animations Tab
- Click on **"Animations"** tab at the top
- You should see the animation viewer

### 3. Find Human Male (Mob 400)
- In the left panel, look for **"400"** (Human Male)
- Click on it to select

### 4. Select "Attack Bash 2H" Animation
- In the **"Action"** dropdown, find and select:
  - **"Attack Bash 2H"** or **"Attack 2H"** or **"Attack Heavy"**
  - (Exact name may vary - it's the 2-handed overhead swing attack)

### 5. Export ALL Directions (One at a Time)

For **EACH of the 8 directions** (in this order):

#### Direction Order:
1. **Northeast** (NE)
2. **East** (E)
3. **Southeast** (SE)
4. **South** (S)
5. **Southwest** (SW)
6. **West** (W)
7. **Northwest** (NW)
8. **North** (N)

#### For Each Direction:
1. **Select the direction** in UOFiddler (usually buttons or dropdown)
2. **Right-click on the animation preview**
3. **Select "Export Animation"** or **"Export All Frames"**
4. **Save to:** `C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations\`
5. **Files will be named:** `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc.
6. **Leave them in that folder** - the script will organize them!

---

## 🤖 Auto-Organize Script

I'll create a script that automatically organizes these into:
```
assets/sprites/animations/
└── attack-bash-2h-char/
    ├── northeast/
    │   ├── frame0.bmp
    │   ├── frame1.bmp
    │   └── ...
    ├── east/
    ├── southeast/
    └── (all 8 directions)
```

---

## 📝 Export Workflow

### Quick Steps:
1. **Export Northeast** → Files appear in `assets/sprites/animations/`
2. **Run:** `START_AUTO_ORGANIZE_ATTACK_CHAR.bat` (script will organize them)
3. **Repeat for East**
4. **Repeat for all 8 directions**

---

## ⚠️ Important Notes

- **DO NOT export the weapon!** Only the character body
- **Export one direction at a time** - easier to track
- **The script auto-detects** which direction based on file count
- **Files are named** `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc.
- **Leave them in the animations folder** - script moves them automatically

---

## 🎮 After Exporting

Once all 8 directions are exported and organized:
1. The game will **auto-load** the character attack animations
2. It will use these BMPs when attacking with halberd
3. **Weapon animations** are already done and will sync with these!
4. **No white backgrounds** - auto-removed on load

---

## 🔄 Integration

The animations will be loaded as:
- **`char-attack-bash-2h`** in the game
- Used when: `character.combatState.isAttacking` is true
- Weapon drawn separately from `weapon-attack-bash-2h-halberd`

**Ready to export? Follow the steps above and then run the auto-organize script!** ⚔️



