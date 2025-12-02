"""
Process walking animations from subdirectories
Handles files organized like: walk_n/Mob 400-0.bmp, walk_n/Mob 400-1.bmp, etc.
"""

from pathlib import Path
from PIL import Image
import re

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
ANIMATIONS_DIR = PROJECT_ROOT / "assets" / "sprites" / "animations"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

# Map directory names to directions
DIR_NAME_MAP = {
    'walk_n': 0,   # North
    'walk_ne': 1,  # Northeast
    'walk_e': 2,   # East
    'walk_se': 3,  # Southeast
    'walk_s': 4,   # South
    'walk_sw': 5,  # Southwest
    'walk_w': 6,   # West
    'walk_nw': 7,  # Northwest
}

DIRECTIONS = {
    0: "north",
    1: "northeast",
    2: "east",
    3: "southeast",
    4: "south",
    5: "southwest",
    6: "west",
    7: "northwest"
}

def remove_white_background(img):
    """Remove white/light backgrounds and make transparent"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    for item in data:
        # If pixel is white/very light (R, G, B all > 240), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def process_walking_subdirectory(subdir_path, direction, dir_name):
    """Process all frames in a walking subdirectory"""
    print(f"\n{'='*70}")
    print(f"Processing: {subdir_path.name} (Direction {direction}: {dir_name})")
    print(f"{'='*70}")
    
    # Find all BMP files in this subdirectory
    bmp_files = sorted(subdir_path.glob("Mob 400*.bmp"))
    
    if not bmp_files:
        print(f"  [SKIP] No BMP files found")
        return False
    
    print(f"  Found {len(bmp_files)} BMP files")
    
    # Extract frame numbers and sort
    frames_data = []
    for bmp_file in bmp_files:
        # Extract frame number from filename: Mob 400-X.bmp where X is frame number
        match = re.search(r'Mob\s+400-(\d+)\.bmp', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            frames_data.append((frame_num, bmp_file))
        else:
            print(f"    [WARN] Could not parse frame number from: {bmp_file.name}")
    
    # Sort by frame number
    frames_data.sort(key=lambda x: x[0])
    
    if not frames_data:
        print(f"  [SKIP] No valid frames found")
        return False
    
    print(f"  Processing {len(frames_data)} frames")
    
    # Load and process frames
    frames = []
    for frame_num, bmp_file in frames_data:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
            print(f"    [OK] Frame {frame_num}: {bmp_file.name} ({img.size[0]}x{img.size[1]})")
        except Exception as e:
            print(f"    [ERROR] Failed to process {bmp_file.name}: {e}")
    
    if not frames:
        print(f"  [SKIP] No valid frames after processing")
        return False
    
    # Create sprite sheet
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    print(f"\n  Creating sprite sheet:")
    print(f"    Frame size: {max_width}x{max_height}")
    print(f"    Sheet size: {sheet_width}x{sheet_height}")
    print(f"    Total frames: {len(frames)}")
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame)
    
    # Save sprite sheet
    output_name = f"male_walk_{dir_name}_sheet.png"
    output_file = OUTPUT_DIR / output_name
    sheet.save(output_file, "PNG")
    print(f"\n  [SUCCESS] Saved: {output_file.name}")
    
    # Also create standard name for direction 2 (east)
    if direction == 2:
        standard_file = OUTPUT_DIR / "male_walk_sheet.png"
        sheet.save(standard_file, "PNG")
        print(f"  [OK] Also saved as: {standard_file.name}")
    
    return True

def main():
    """Process all walking animation subdirectories"""
    print("=" * 70)
    print("Processing Walking Animations from Subdirectories")
    print("=" * 70)
    print(f"\nSource: {ANIMATIONS_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")
    
    if not ANIMATIONS_DIR.exists():
        print(f"[ERROR] Animations directory not found: {ANIMATIONS_DIR}")
        return
    
    # Find all walking subdirectories
    walking_dirs = []
    for subdir in ANIMATIONS_DIR.iterdir():
        if subdir.is_dir() and subdir.name in DIR_NAME_MAP:
            direction = DIR_NAME_MAP[subdir.name]
            dir_name = DIRECTIONS.get(direction, f"dir_{direction}")
            walking_dirs.append((subdir, direction, dir_name))
    
    if not walking_dirs:
        print("[ERROR] No walking subdirectories found!")
        print(f"Expected directories: {list(DIR_NAME_MAP.keys())}")
        return
    
    print(f"Found {len(walking_dirs)} walking animation directories\n")
    
    success_count = 0
    for subdir, direction, dir_name in sorted(walking_dirs, key=lambda x: x[1]):
        if process_walking_subdirectory(subdir, direction, dir_name):
            success_count += 1
    
    print("\n" + "=" * 70)
    print("Processing Summary")
    print("=" * 70)
    print(f"Successfully processed: {success_count}/{len(walking_dirs)} directions")
    print("=" * 70)

if __name__ == "__main__":
    main()









