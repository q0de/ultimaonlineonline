# Export Running Animations Guide

This guide explains how to export running animations for all 8 cardinal directions from UOFiddler.

## Step 1: Open UOFiddler

1. Launch UOFiddler
2. Go to **Animations** tab
3. Select **Body ID**: `400` (Male Human)

## Step 2: Export Running Animations for Each Direction

For each of the 8 cardinal directions, you need to export the running animation.

### Direction Mapping:
- **North (N)**: Direction 0
- **Northeast (NE)**: Direction 1  
- **East (E)**: Direction 2
- **Southeast (SE)**: Direction 3
- **South (S)**: Direction 4
- **Southwest (SW)**: Direction 5
- **West (W)**: Direction 6
- **Northwest (NW)**: Direction 7

### Export Process for Each Direction:

1. **Set the Direction**:
   - In UOFiddler, select the direction (0-7) from the direction dropdown
   
2. **Select Running Animation**:
   - Running animations are typically Action 1 or Action 2 (depending on UO version)
   - Look for the running/walking animation that shows the character moving faster
   - This is usually a multi-frame animation (similar to walking)

3. **Export the Animation**:
   - Right-click on the animation preview
   - Select **"Export Frames"** or **"Export Animation"**
   - Choose **BMP** format

4. **Organize the Files**:
   - Create a subdirectory in `assets/sprites/animations/` for each direction:
     - `run_n/` (for North)
     - `run_ne/` (for Northeast)
     - `run_e/` (for East)
     - `run_se/` (for Southeast)
     - `run_s/` (for South)
     - `run_sw/` (for Southwest)
     - `run_w/` (for West)
     - `run_nw/` (for Northwest)
   
   - Save the exported BMP files into the corresponding subdirectory
   - Files should be named like: `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc. (multiple frames)

## Step 3: Process the Exported Files

Once you've exported all 8 directions into their subdirectories, run:

```bash
python process_running_from_subdirs.py
```

This will:
- Process all BMP files in each `run_*` directory
- Remove white backgrounds (make transparent)
- Create sprite sheets for each direction
- Save them as `male_run_{direction}_sheet.png` in `assets/sprites/characters/test/`

## Expected Output Files:

After processing, you should have:
- `male_run_north_sheet.png`
- `male_run_northeast_sheet.png`
- `male_run_east_sheet.png`
- `male_run_southeast_sheet.png`
- `male_run_south_sheet.png`
- `male_run_southwest_sheet.png`
- `male_run_west_sheet.png`
- `male_run_northwest_sheet.png`
- `male_run_sheet.png` (fallback, same as east)

## Notes:

- **Running animations typically have multiple frames** (similar to walking, usually 8-10 frames)
- The script handles both single-frame and multi-frame running animations
- White backgrounds are automatically converted to transparency
- Running animations are used when the cursor is far from the character (UO behavior)

## Quick Reference:

| Direction | UO Direction ID | Directory Name |
|-----------|----------------|----------------|
| North | 0 | `run_n` |
| Northeast | 1 | `run_ne` |
| East | 2 | `run_e` |
| Southeast | 3 | `run_se` |
| South | 4 | `run_s` |
| Southwest | 5 | `run_sw` |
| West | 6 | `run_w` |
| Northwest | 7 | `run_nw` |

## Finding the Running Animation:

In UOFiddler, running animations are usually:
- **Action 1** or **Action 2** (depending on UO client version)
- Shows the character moving faster than walking
- Has similar frame count to walking animations (8-10 frames)
- May be labeled as "Run" or "Fast Walk" in the animation list









