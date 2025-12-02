# Efficient UOFiddler Export Guide - For 624 Animations

## The Problem
You need to export **624 halberd animations** manually. That's too many!

## ✅ Solution: Focus on What You Actually Need

**Good news:** You probably don't need all 624! Here's what you actually need for the game:

### What You Need (Not 624!):
- **Body ID 400** (Male Human)
- **Action 9** (2-Handed Attack - for Halberd)
- **8 Directions** (N, NE, E, SE, S, SW, W, NW)
- **Total: 8 animations** (not 624!)

The "624" might be:
- Total frames across all animations
- Or all possible weapon/body combinations
- But you only need **Action 9** (2H attack) for halberd!

## Quick Export Method:

### Step 1: Export All 8 Directions at Once

1. **Open UOFiddler**
2. **Go to Animations Tab**
3. **Set:**
   - Body ID: **400**
   - Action: **9** (2-Handed Attack)
   - Direction: **0** (North)

4. **Right-click animation preview → Export Animation**
5. **Save to:** `assets/sprites/animations/halberd_attack_north/`

6. **Repeat for directions 1-7:**
   - Direction 1 (NE) → `halberd_attack_northeast/`
   - Direction 2 (E) → `halberd_attack_east/`
   - Direction 3 (SE) → `halberd_attack_southeast/`
   - Direction 4 (S) → `halberd_attack_south/`
   - Direction 5 (SW) → `halberd_attack_southwest/`
   - Direction 6 (W) → `halberd_attack_west/`
   - Direction 7 (NW) → `halberd_attack_northwest/`

### Step 2: Process All Exports Automatically

Once you've exported all 8 directions, run:

```bash
python process_halberd_attacks.py
```

This will automatically:
- Find all exported BMP files
- Combine them into sprite sheets
- Remove white backgrounds
- Save as PNG files ready for the game

## Time Estimate:
- **8 exports × 30 seconds each = 4 minutes**
- **Processing script = 30 seconds**
- **Total: ~5 minutes** (not hours!)

## Alternative: If You Really Need More

If you actually need more animations (like all actions), you can export in batches:

1. **Export all 8 directions for Action 9** (2H Attack) - **8 animations**
2. **Export all 8 directions for Action 3** (Idle) - **8 animations**
3. **Export all 8 directions for Action 1** (Walk) - **8 animations**
4. **etc.**

But for halberd combat, you mainly need **Action 9** (2H Attack)!









