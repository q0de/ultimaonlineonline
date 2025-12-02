"""
Process walking animations with cardinal directions
UO walking animations: Action 0, Directions 0-7 (N, NE, E, SE, S, SW, W, NW)
"""

from pathlib import Path
from PIL import Image
import re

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
FRAMES_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

# UO Direction mapping
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

def process_walking_animation():
    """Process walking animation frames with directions"""
    print("=" * 60)
    print("Processing Walking Animations with Directions")
    print("=" * 60)
    
    # Find all BMP files
    all_bmp_files = sorted(FRAMES_DIR.glob("Mob 400*.bmp"))
    
    if not all_bmp_files:
        print("[ERROR] No BMP files found!")
        return
    
    print(f"\nFound {len(all_bmp_files)} BMP files")
    
    # Group files by pattern
    # Pattern 1: Mob 400-{action}-{direction}-{frame}.bmp
    # Pattern 2: Mob 400-{action}-{direction}.bmp
    # Pattern 3: Mob 400-{action}-{frame}.bmp (single direction)
    
    walking_frames_by_dir = {}
    
    for bmp_file in all_bmp_files:
        name = bmp_file.name
        # Try to parse: Mob 400-0-2-0.bmp (Body-Action-Direction-Frame)
        match1 = re.match(r'Mob 400-0-(\d+)-(\d+)\.bmp', name)
        if match1:
            direction = int(match1.group(1))
            frame = int(match1.group(2))
            if direction not in walking_frames_by_dir:
                walking_frames_by_dir[direction] = []
            walking_frames_by_dir[direction].append((frame, bmp_file))
            continue
        
        # Try to parse: Mob 400-0-2.bmp (Body-Action-Direction, single frame)
        match2 = re.match(r'Mob 400-0-(\d+)\.bmp', name)
        if match2:
            direction = int(match2.group(1))
            if direction not in walking_frames_by_dir:
                walking_frames_by_dir[direction] = []
            walking_frames_by_dir[direction].append((0, bmp_file))
            continue
        
        # Try to parse: Mob 400-0-X.bmp (Body-Action-Frame, default direction 2)
        match3 = re.match(r'Mob 400-0-(\d+)\.bmp', name)
        if match3 and int(match3.group(1)) < 8:  # Frame numbers are usually higher
            # This might be direction, treat as direction 2 (SE - standard)
            direction = int(match3.group(1))
            if direction not in walking_frames_by_dir:
                walking_frames_by_dir[direction] = []
            walking_frames_by_dir[direction].append((0, bmp_file))
    
    if not walking_frames_by_dir:
        print("\n[INFO] No walking animation patterns detected.")
        print("Expected patterns:")
        print("  - Mob 400-0-{direction}-{frame}.bmp (e.g., Mob 400-0-2-0.bmp)")
        print("  - Mob 400-0-{direction}.bmp (e.g., Mob 400-0-2.bmp)")
        print("\nLet me check what files we have...")
        for f in all_bmp_files[:10]:
            print(f"  - {f.name}")
        return
    
    print(f"\nFound walking animations for {len(walking_frames_by_dir)} directions:")
    for direction in sorted(walking_frames_by_dir.keys()):
        dir_name = DIRECTIONS.get(direction, f"dir_{direction}")
        frame_count = len(walking_frames_by_dir[direction])
        print(f"  Direction {direction} ({dir_name}): {frame_count} frames")
    
    # Process each direction
    for direction in sorted(walking_frames_by_dir.keys()):
        dir_name = DIRECTIONS.get(direction, f"dir_{direction}")
        frames_data = sorted(walking_frames_by_dir[direction], key=lambda x: x[0])
        
        print(f"\n{'='*60}")
        print(f"Processing Direction {direction} ({dir_name})")
        print(f"{'='*60}")
        
        # Load and process frames
        frames = []
        for frame_num, bmp_file in frames_data:
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
                print(f"  [OK] Frame {frame_num}: {bmp_file.name} ({img.size[0]}x{img.size[1]})")
            except Exception as e:
                print(f"  [ERROR] Failed to process {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames for direction {direction}")
            continue
        
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
        output_file = OUTPUT_DIR / f"male_walk_{dir_name}_sheet.png"
        sheet.save(output_file, "PNG")
        print(f"\n  [SUCCESS] Saved: {output_file.name}")
        
        # Also create a standard walk sheet for direction 2 (SE - most common)
        if direction == 2:
            standard_file = OUTPUT_DIR / "male_walk_sheet.png"
            sheet.save(standard_file, "PNG")
            print(f"  [OK] Also saved as standard: {standard_file.name}")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Walking Animation Processing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    process_walking_animation()

