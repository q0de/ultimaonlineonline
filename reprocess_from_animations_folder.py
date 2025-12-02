"""
Reprocess Character Animations from animations folder
Reads source BMP files from animations folder and creates fresh sprite sheets
"""

from pathlib import Path
from PIL import Image
import re

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

DIRECTIONS = {
    'north': 0,
    'northeast': 1,
    'east': 2,
    'southeast': 3,
    'south': 4,
    'southwest': 5,
    'west': 6,
    'northwest': 7
}

DIRECTION_NAMES = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']

def remove_white_background(img):
    """Remove white background from an image, making it transparent."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def detect_direction_from_folder(folder_name):
    """Detect direction from folder name"""
    folder_lower = folder_name.lower()
    
    # Check for two-letter directions first (ne, nw, se, sw) before single letters
    if 'ne' in folder_lower or folder_lower.endswith('_ne') or folder_lower.endswith('-ne'):
        return 'northeast'
    elif 'nw' in folder_lower or folder_lower.endswith('_nw') or folder_lower.endswith('-nw'):
        return 'northwest'
    elif 'se' in folder_lower or folder_lower.endswith('_se') or folder_lower.endswith('-se'):
        return 'southeast'
    elif 'sw' in folder_lower or folder_lower.endswith('_sw') or folder_lower.endswith('-sw'):
        return 'southwest'
    # Then check single letter directions
    elif folder_lower.endswith('_n') or folder_lower.endswith('-n') or (folder_lower.endswith('n') and 'north' not in folder_lower):
        return 'north'
    elif folder_lower.endswith('_e') or folder_lower.endswith('-e') or (folder_lower.endswith('e') and 'east' not in folder_lower):
        return 'east'
    elif folder_lower.endswith('_s') or folder_lower.endswith('-s') or (folder_lower.endswith('s') and 'south' not in folder_lower):
        return 'south'
    elif folder_lower.endswith('_w') or folder_lower.endswith('-w') or (folder_lower.endswith('w') and 'west' not in folder_lower):
        return 'west'
    
    # Full direction names
    for dir_name in DIRECTION_NAMES:
        if dir_name in folder_lower:
            return dir_name
    
    return None

def process_animation_from_folder(folder_path, anim_type):
    """Process animation from a folder in animations directory"""
    # Get all BMP files
    bmp_files = sorted(folder_path.glob("Mob 400*.bmp")) + sorted(folder_path.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        return False
    
    # Extract frame numbers
    frames_dict = {}
    for bmp_file in bmp_files:
        match = re.search(r'Mob\s*400\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            frames_dict[frame_num] = bmp_file
        elif bmp_file.name == "Mob 400.bmp":
            frames_dict[0] = bmp_file  # Base frame
    
    if len(frames_dict) < 5:
        print(f"  [WARN] Only {len(frames_dict)} frames found, skipping")
        return False
    
    # Sort by frame number and take first 10
    sorted_frames = sorted(frames_dict.items())[:10]
    
    # Load frames
    frames = []
    for frame_num, bmp_file in sorted_frames:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"    [ERROR] Failed to load {bmp_file.name}: {e}")
            return False
    
    if len(frames) < 5:
        return False
    
    # Ensure exactly 10 frames (duplicate last if needed)
    while len(frames) < 10:
        frames.append(frames[-1].copy())
    
    frames = frames[:10]  # Take first 10
    
    # Detect direction
    direction = detect_direction_from_folder(folder_path.name)
    if not direction:
        print(f"  [WARN] Could not detect direction from {folder_path.name}")
        return False
    
    # Create sprite sheet
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * 10
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for j, frame in enumerate(frames):
        x_offset = j * frame_width
        paste_x = x_offset + (frame_width - frame.width) // 2
        paste_y = (frame_height - frame.height) // 2
        sprite_sheet.paste(frame, (paste_x, paste_y), frame)
    
    # Save
    output_name = f"male_{anim_type}_{direction}_sheet.png"
    output_path = OUTPUT_DIR / output_name
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"  [OK] {anim_type} {direction}: Created {output_name} ({len(frames)} frames)")
    return True

def main():
    print("="*60)
    print("Reprocessing Character Animations from animations folder")
    print("Reading source BMP files and creating fresh sprite sheets")
    print("="*60)
    
    # Find walk and run folders
    walk_folders = []
    run_folders = []
    
    for folder in EXPORT_BASE.iterdir():
        if not folder.is_dir():
            continue
        
        # Skip processed and halberd folders
        if folder.name.startswith('processed_') or folder.name.startswith('halberd_'):
            continue
        
        folder_lower = folder.name.lower()
        
        # Check if it's a walk or run folder
        if 'walk' in folder_lower and 'run' not in folder_lower:
            walk_folders.append(folder)
        elif 'run' in folder_lower and 'walk' not in folder_lower:
            run_folders.append(folder)
    
    print(f"\n[INFO] Found {len(walk_folders)} walk folders and {len(run_folders)} run folders")
    
    processed_walk = 0
    processed_run = 0
    
    print("\n" + "="*60)
    print("Processing Walk Animations")
    print("="*60)
    for folder in sorted(walk_folders):
        print(f"\nProcessing: {folder.name}")
        if process_animation_from_folder(folder, 'walk'):
            processed_walk += 1
    
    print("\n" + "="*60)
    print("Processing Run Animations")
    print("="*60)
    for folder in sorted(run_folders):
        print(f"\nProcessing: {folder.name}")
        if process_animation_from_folder(folder, 'run'):
            processed_run += 1
    
    print("\n" + "="*60)
    print("Reprocessing complete!")
    print(f"  Walk: {processed_walk} processed")
    print(f"  Run: {processed_run} processed")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()

