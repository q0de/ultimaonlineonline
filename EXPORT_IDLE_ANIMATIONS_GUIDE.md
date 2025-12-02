# Export Idle-Static Animations Guide

This guide explains how to export idle-static animations for all 8 cardinal directions from UOFiddler.

## Step 1: Open UOFiddler

1. Launch UOFiddler
2. Go to **Animations** tab
3. Select **Body ID**: `400` (Male Human)

## Step 2: Export Idle Animations for Each Direction

For each of the 8 cardinal directions, you need to export the idle animation (Action 0).

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
   
2. **Select Action 0 (Idle/Stand)**:
   - Action 0 is the idle/standing animation
   - This is typically a single frame or a few frames

3. **Export the Animation**:
   - Right-click on the animation preview
   - Select **"Export Frames"** or **"Export Animation"**
   - Choose **BMP** format

4. **Organize the Files**:
   - Create a subdirectory in `assets/sprites/animations/` for each direction:
     - `idle-static_n/` (for North)
     - `idle-static_ne/` (for Northeast)
     - `idle-static_e/` (for East)
     - `idle-static_se/` (for Southeast)
     - `idle-static_s/` (for South)
     - `idle-static_sw/` (for Southwest)
     - `idle-static_w/` (for West)
     - `idle-static_nw/` (for Northwest)
   
   - Save the exported BMP files into the corresponding subdirectory
   - Files should be named like: `Mob 400-0.bmp`, `Mob 400-1.bmp`, etc. (if multiple frames)

## Step 3: Process the Exported Files

Once you've exported all 8 directions into their subdirectories, run:

```bash
python process_idle_from_subdirs.py
```

This will:
- Process all BMP files in each `idle-static_*` directory
- Remove white backgrounds (make transparent)
- Create sprite sheets for each direction
- Save them as `male_idle_{direction}_sheet.png` in `assets/sprites/characters/test/`

## Expected Output Files:

After processing, you should have:
- `male_idle_north_sheet.png`
- `male_idle_northeast_sheet.png`
- `male_idle_east_sheet.png`
- `male_idle_southeast_sheet.png`
- `male_idle_south_sheet.png`
- `male_idle_southwest_sheet.png`
- `male_idle_west_sheet.png`
- `male_idle_northwest_sheet.png`
- `male_idle_sheet.png` (fallback, same as east)

## Notes:

- **Idle animations are typically single-frame** (just standing still), but UO may have a few frames for subtle animation
- If an idle animation has multiple frames, they'll be combined into a horizontal sprite sheet
- The script handles both single-frame and multi-frame idle animations
- White backgrounds are automatically converted to transparency

## Quick Reference:

| Direction | UO Direction ID | Directory Name |
|-----------|----------------|----------------|
| North | 0 | `idle-static_n` |
| Northeast | 1 | `idle-static_ne` |
| East | 2 | `idle-static_e` |
| Southeast | 3 | `idle-static_se` |
| South | 4 | `idle-static_s` |
| Southwest | 5 | `idle-static_sw` |
| West | 6 | `idle-static_w` |
| Northwest | 7 | `idle-static_nw` |









