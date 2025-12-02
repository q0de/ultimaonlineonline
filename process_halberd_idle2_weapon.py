"""
Process Halberd Idle 2 Weapon Animations
Automatically processes exported idle 2 halberd weapon animations (Equipment 624) 
for animated idle states (character breathing/shifting while idle).

Expected export pattern: Equipment 624-X.bmp files exported to assets/sprites/animations/
This script processes them sequentially by direction (NE, E, SE, S, SW, W, NW, N)
"""

from pathlib import Path
from PIL import Image
import re
import sys

# Paths
EXPORT_BASE = Path('assets/sprites/animations')
OUTPUT_WEAPON_DIR = Path('assets/sprites/weapons')

# Direction order (matching UO's export sequence)
DIRECTION_ORDER = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

def remove_white_background(img):
    """Convert white background to transparent."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    
    for item in data:
        # If pixel is white (or near-white), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def get_unprocessed_idle2_files():
    """Find Equipment 624-X.bmp files that haven't been processed for idle 2 animations."""
    unprocessed = []
    for bmp_file in EXPORT_BASE.glob("Equipment 624-*.bmp"):
        # Check if it's not in a processed folder (for idle, idle2, or attack animations)
        parent_name = bmp_file.parent.name
        if (not parent_name.startswith('processed_halberd_idle_') and 
            not parent_name.startswith('processed_halberd_idle2_') and
            not parent_name.startswith('processed_halberd_weapon_')):
            unprocessed.append(bmp_file)
    return sorted(unprocessed)

def get_processed_idle2_directions():
    """Determine which idle 2 directions have already been processed."""
    processed_sheets = []
    for sheet in OUTPUT_WEAPON_DIR.glob("halberd_idle2_*_sheet.png"):
        match = re.search(r'halberd_idle2_([a-z]+)_sheet\.png', sheet.name)
        if match and match.group(1) in DIRECTION_ORDER:
            processed_sheets.append(match.group(1))
    return sorted(processed_sheets, key=lambda x: DIRECTION_ORDER.index(x))

def process_idle2_direction(direction_to_process):
    """Process a single direction's worth of Equipment 624 frames for idle 2 animation."""
    print(f"\n[INFO] Processing idle 2 direction: {direction_to_process.upper()}")
    
    # Find unprocessed files (idle 2 animations typically have multiple frames for animation)
    bmp_files = get_unprocessed_idle2_files()
    
    if len(bmp_files) < 1:
        print(f"[ERROR] No unprocessed Equipment 624 files found for {direction_to_process.upper()}.")
        return False
    
    # Group files by frame number
    file_groups = {}
    for bmp_file in bmp_files:
        match = re.search(r'Equipment\s*624\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            file_groups[frame_num] = bmp_file
    
    # For idle 2, collect frames (typically 1-10 frames for animation)
    frames_to_process = []
    for i in range(10):  # Check up to 10 frames
        if i in file_groups:
            frames_to_process.append(file_groups[i])
        else:
            break
    
    if not frames_to_process:
        print(f"[ERROR] Could not find frames for {direction_to_process.upper()}.")
        return False
    
    print(f"[OK] Found {len(frames_to_process)} frame(s) for {direction_to_process.upper()}")
    
    # Process frames
    frames = []
    for bmp_file in frames_to_process:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"[ERROR] Failed to process {bmp_file.name}: {e}")
            return False
    
    if not frames:
        print(f"[ERROR] No valid frames to process for {direction_to_process.upper()}.")
        return False
    
    # Create sprite sheet
    # For single frame, use it directly
    # For multiple frames, create a horizontal sprite sheet
    if len(frames) == 1:
        sprite_sheet = frames[0]
    else:
        # Multiple frames - create horizontal sprite sheet
        frame_width = frames[0].width
        frame_height = frames[0].height
        sheet_width = frame_width * len(frames)
        sheet_height = frame_height
        
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        for i, frame in enumerate(frames):
            x_offset = i * frame_width
            sprite_sheet.paste(frame, (x_offset, 0), frame)
    
    # Save sprite sheet
    output_name = f"halberd_idle2_{direction_to_process}_sheet.png"
    output_path = OUTPUT_WEAPON_DIR / output_name
    sprite_sheet.save(output_path, 'PNG')
    print(f"[OK] Created: {output_name} ({len(frames)} frame(s))")
    print(f"     Output: {output_path}")
    
    # Move processed files
    processed_folder = EXPORT_BASE / f"processed_halberd_idle2_{direction_to_process}"
    processed_folder.mkdir(exist_ok=True)
    for bmp_file in frames_to_process:
        bmp_file.rename(processed_folder / bmp_file.name)
    print(f"[OK] Moved processed files to: {processed_folder.name}/")
    
    return True

def process_halberd_idle2_weapon_animations():
    """Main function to process halberd idle 2 weapon animations."""
    print("=" * 60)
    print("HALBERD IDLE 2 WEAPON ANIMATION PROCESSOR")
    print("=" * 60)
    
    # Ensure output directory exists
    OUTPUT_WEAPON_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check what's already processed
    processed_directions_list = get_processed_idle2_directions()
    print(f"\n[INFO] Already processed idle 2 directions: {', '.join(processed_directions_list) if processed_directions_list else 'None'}")
    
    # Determine next direction to process
    next_direction_index = len(processed_directions_list)
    if next_direction_index >= len(DIRECTION_ORDER):
        print("\n[INFO] All 8 idle 2 directions already processed.")
        print("       If you want to reprocess, delete the sprite sheets and processed folders.")
        return
    
    direction_to_process = DIRECTION_ORDER[next_direction_index]
    print(f"\n[INFO] Next idle 2 direction to process: {direction_to_process.upper()}")
    print(f"       Export Equipment 624 frames to: {EXPORT_BASE}")
    
    # Process the direction
    success = process_idle2_direction(direction_to_process)
    
    if success:
        next_direction_index += 1
        if next_direction_index < len(DIRECTION_ORDER):
            print(f"\n[INFO] Export the next idle 2 direction ({DIRECTION_ORDER[next_direction_index].upper()}) to continue...")
            print(f"       Progress: {next_direction_index}/{len(DIRECTION_ORDER)} directions complete")
        else:
            print("\n[INFO] All 8 idle 2 directions complete!")
    else:
        print(f"\n[ERROR] Failed to process {direction_to_process.upper()}.")
        print("        Please ensure you have exported Equipment 624 frames for this direction.")

if __name__ == '__main__':
    try:
        process_halberd_idle2_weapon_animations()
    except KeyboardInterrupt:
        print("\n\n[INFO] Processing interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)









