"""
Process idle-static animations from subdirectories
Creates sprite sheets for all 8 cardinal directions
"""

import re
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
SOURCE_DIR = PROJECT_ROOT / "assets" / "sprites" / "animations"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

DIRECTIONS_MAP = {
    'idle-static_n': 0, 'north': 0,
    'idle-static_ne': 1, 'northeast': 1,
    'idle-static_e': 2, 'east': 2,
    'idle-static_se': 3, 'southeast': 3,
    'idle-static_s': 4, 'south': 4,
    'idle-static_sw': 5, 'southwest': 5,
    'idle-static_w': 6, 'west': 6,
    'idle-static_nw': 7, 'northwest': 7,
}

DIRECTIONS_NAMES = {
    0: "north", 1: "northeast", 2: "east", 3: "southeast",
    4: "south", 5: "southwest", 6: "west", 7: "northwest"
}

def remove_white_background(img):
    """Convert white background to transparent"""
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

def process_idle_from_subdirectories():
    print("=" * 70)
    print("Processing Idle-Static Animations from Subdirectories")
    print("=" * 70)
    print(f"\nSource: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Look for idle-static subdirectories
    idle_dirs = [d for d in SOURCE_DIR.iterdir() if d.is_dir() and d.name.startswith('idle-static_')]
    if not idle_dirs:
        print("\n[INFO] No idle-static animation subdirectories found.")
        print("Expected directories like: idle-static_n, idle-static_ne, idle-static_e, etc.")
        return

    print(f"\nFound {len(idle_dirs)} idle-static animation directories")

    for idle_dir in sorted(idle_dirs):
        dir_key = idle_dir.name
        direction_id = DIRECTIONS_MAP.get(dir_key)
        if direction_id is None:
            print(f"  [SKIP] Unknown idle direction directory: {dir_key}")
            continue

        dir_name = DIRECTIONS_NAMES.get(direction_id, f"dir_{direction_id}")
        print(f"\n{'='*70}")
        print(f"Processing: {dir_key} (Direction {direction_id}: {dir_name})")
        print(f"{'='*70}")

        # Look for BMP files (UOFiddler exports)
        bmp_files = sorted(idle_dir.glob("*.bmp"))
        if not bmp_files:
            # Also try PNG files
            bmp_files = sorted(idle_dir.glob("*.png"))
        
        if not bmp_files:
            print(f"  [SKIP] No image files found in {idle_dir}")
            continue

        frames_data = []
        for img_file in bmp_files:
            # Try to extract frame number from filename (e.g., Mob 400-0.bmp -> frame 0)
            match = re.match(r'.*?(\d+)\.(bmp|png)', img_file.name, re.IGNORECASE)
            if match:
                frame_num = int(match.group(1))
                frames_data.append((frame_num, img_file))
            else:
                # If no number found, use index
                frames_data.append((len(frames_data), img_file))

        sorted_frames = sorted(frames_data, key=lambda x: x[0])
        print(f"  Processing {len(sorted_frames)} frames")

        frames = []
        for frame_num, img_file in sorted_frames:
            try:
                img = Image.open(img_file)
                img = remove_white_background(img)
                frames.append(img)
                print(f"    [OK] Frame {frame_num}: {img_file.name} ({img.size[0]}x{img.size[1]})")
            except Exception as e:
                print(f"    [ERROR] Failed to process {img_file.name}: {e}")

        if not frames:
            print(f"  [SKIP] No valid frames for {dir_key}")
            continue

        # For idle animations, typically single frame or a few frames
        # Create sprite sheet horizontally
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

        output_file = OUTPUT_DIR / f"male_idle_{dir_name}_sheet.png"
        sheet.save(output_file, "PNG")
        print(f"\n  [SUCCESS] Saved: {output_file.name}")

        # Also save as standard idle if it's east (default direction)
        if direction_id == 2:  # East is often the default/standard idle
            standard_file = OUTPUT_DIR / "male_idle_sheet.png"
            sheet.save(standard_file, "PNG")
            print(f"  [OK] Also saved as standard: {standard_file.name}")

    print("\n" + "=" * 70)
    print("Processing Summary")
    print("=" * 70)
    print(f"Successfully processed: {len(idle_dirs)}/{len([k for k in DIRECTIONS_MAP.keys() if k.startswith('idle-static_')])} directions")
    print("=" * 70)

if __name__ == "__main__":
    process_idle_from_subdirectories()









