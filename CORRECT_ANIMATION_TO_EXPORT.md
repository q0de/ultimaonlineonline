# ✅ CORRECT Animation to Export

## 🎯 What You Need to Export

**Character:** Human Male  
**Mob ID:** 400  
**Animation:** Attack with 2-handed weapon (overhead swing)  
**What to Export:** Character body ONLY (no weapon visible)

---

## 📋 UOFiddler Settings

### 1. In the Animations Tab:

**Mob/Body ID:** `400` (Human Male)

### 2. Action/Animation Type:

Look for one of these names (exact name varies by UOFiddler version):
- **"Attack 2H"** ✅ (Most likely)
- **"Attack Bash 2H"** ✅
- **"Attack Heavy"** ✅
- **"Attack Overhead"** ✅
- **Action ID: 12** or **13** (if showing numbers instead of names)

### 3. What You Should See:

**✅ CORRECT:** Character swinging arms overhead (like swinging a 2-handed weapon)
- Arms go UP over head
- Body leans back
- Looks like swinging a halberd/2h weapon
- **NO weapon visible** in the animation

**❌ WRONG Animations:**
- ❌ Character standing still (idle)
- ❌ Character walking/running
- ❌ Character swinging 1-handed (sword swing)
- ❌ Character stabbing forward (spear attack)
- ❌ Any animation with a weapon visible

---

## 🔍 How to Check if it's Correct

### Play the animation in UOFiddler:

1. Click on Mob 400
2. Select the action (Attack 2H / Attack Bash 2H)
3. **Watch the preview:**
   - Does the character swing arms OVERHEAD? ✅
   - Are the arms going UP and DOWN in a heavy swing? ✅
   - Is there NO weapon visible? ✅
   - Does it look like a 2-handed weapon swing? ✅

### Common Action Numbers:
- **Action 12:** Usually "Attack 1H" (one-handed) ❌
- **Action 13:** Usually "Attack 2H" (two-handed) ✅
- **Action 14:** Sometimes "Attack Bash 2H" ✅

*Note: Exact numbers may vary, so rely on the NAME or the visual preview!*

---

## 📸 Visual Checklist

When you preview the animation, the character should:

### Frame 0-2: Wind-up
- Arms move UP
- Body leans back
- Preparing to swing

### Frame 3-4: Swing
- Arms come DOWN
- Body leans forward
- Power swing motion

### Frame 5-6: Recovery
- Arms return to neutral
- Body straightens
- End of swing

**Total frames:** Usually 7-10 frames per direction

---

## 🎬 Step-by-Step to Avoid Mistakes

1. **Open UOFiddler**
2. **Click "Animations" tab** at the top
3. **In the left panel, find and click "400"** (Human Male)
4. **In the Action dropdown, look for:**
   - "Attack 2H" or "Attack Bash 2H" or similar
   - If showing numbers, try Action 13 or 14
5. **WATCH THE PREVIEW:**
   - Character swings arms overhead? ✅
   - No weapon visible? ✅
   - Looks like a halberd swing? ✅
6. **If correct, proceed to export!**
7. **If wrong, try a different action until you find the right one**

---

## 🚀 After You Confirm it's Correct

1. **Run:** `RESET_ATTACK_CHAR_EXPORT.bat` (clears old exports)
2. **Run:** `START_AUTO_ORGANIZE_ATTACK_CHAR.bat` (starts auto-organizer)
3. **Export each direction** from UOFiddler:
   - Select direction (Northeast first)
   - Right-click → Export Animation
   - Save to: `assets/sprites/animations/`
4. **Repeat for all 8 directions**

---

## ❓ Still Not Sure?

### Quick Test:
- Does the character look like they're swinging a big 2-handed weapon overhead?
- Are BOTH arms involved in the swing?
- Is there NO weapon visible in the animation?

**If YES to all three → You have the CORRECT animation!** ✅

**If NO to any → Keep looking for the right action!** ❌

---

## 📞 What We're Matching

Your weapon animations (`attack-bash-2h-halberd`) show the halberd swinging.  
The character animations should show the character's BODY making that same swing motion.  
When layered together, they create the complete attack!

**Ready to export the correct animation? First run `RESET_ATTACK_CHAR_EXPORT.bat` to start clean!** 🎯



