"""
Automatically Process UOFiddler Exports
Watches for exported BMP files and processes them into sprite sheets
This works with UOFiddler's export functionality - just export and this script handles the rest
"""

from pathlib import Path
from PIL import Image
import re
import time
import shutil

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
# UOFiddler default export location (usually in AppData)
UOFIDDLER_EXPORT_DIR = Path.home() / "AppData" / "Local" / "UOFiddler" / "Export"
# Or check common UOFiddler locations
ALTERNATIVE_EXPORT_DIRS = [
    PROJECT_ROOT / "assets" / "sprites" / "animations",  # User's export location
    Path(r"C:\Users\micha\AppData\Local\UOFiddler\Export"),
    Path(r"C:\Users\micha\Documents\UOFiddler\Export"),
    PROJECT_ROOT / "UOFiddler4.8" / "Export",
    PROJECT_ROOT / "assets" / "sprites" / "characters" / "test",  # If exporting directly here
]

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

# Animation action mapping
ACTIONS = {
    0: "walk",
    3: "idle",
    9: "attack_2h",
    12: "hit",
    13: "death",
    16: "cast",
    20: "death"
}

def find_uofiddler_export_dir():
    """Find UOFiddler export directory"""
    for export_dir in [UOFIDDLER_EXPORT_DIR] + ALTERNATIVE_EXPORT_DIRS:
        if export_dir.exists():
            print(f"[OK] Found export directory: {export_dir}")
            return export_dir
    
    print("[WARN] Could not find UOFiddler export directory")
    print("[INFO] Will check project directory for BMP files")
    return PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

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

def parse_export_filename(filename):
    """Parse UOFiddler export filename to extract animation info"""
    # Common patterns:
    # - Mob 400-9-2-0.bmp (Body-Action-Direction-Frame)
    # - Mob 400-9-2.bmp (Body-Action-Direction, single frame)
    # - Animation_400_9_2_0.bmp
    # - 400_9_2_0.bmp
    
    patterns = [
        r'Mob\s+(\d+)-(\d+)-(\d+)-(\d+)\.bmp',  # Mob 400-9-2-0.bmp (Body-Action-Direction-Frame)
        r'Mob\s+(\d+)-(\d+)-(\d+)\.bmp',         # Mob 400-9-2.bmp (Body-Action-Direction)
        r'Mob\s+(\d+)-(\d+)\.bmp',               # Mob 400-0.bmp (Body-Direction, assume Action 0 for walking)
        r'Mob\s+(\d+)\.bmp',                     # Mob 400.bmp (Body only, assume Action 0, Direction 2)
        r'Animation_(\d+)_(\d+)_(\d+)_(\d+)\.bmp',  # Animation_400_9_2_0.bmp
        r'(\d+)_(\d+)_(\d+)_(\d+)\.bmp',         # 400_9_2_0.bmp
        r'(\d+)_(\d+)_(\d+)\.bmp',               # 400_9_2.bmp
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.match(pattern, filename, re.IGNORECASE)
        if match:
            groups = match.groups()
            body_id = int(groups[0])
            
            # Handle different patterns based on which pattern matched
            if i == 0:  # Mob 400-9-2-0.bmp (4 groups: Body-Action-Direction-Frame)
                action_id = int(groups[1])
                direction = int(groups[2])
                frame_num = int(groups[3])
            elif i == 1:  # Mob 400-9-2.bmp (3 groups: Body-Action-Direction)
                action_id = int(groups[1])
                direction = int(groups[2])
                frame_num = 0
            elif i == 2:  # Mob 400-0.bmp (2 groups: Body-Direction, assume Action 0 for walking)
                action_id = 0  # Walking
                direction = int(groups[1])
                frame_num = 0
            elif i == 3:  # Mob 400.bmp (1 group: Body only)
                action_id = 0  # Walking
                direction = 2  # Default direction
                frame_num = 0
            else:  # Other patterns (Animation_400_9_2_0.bmp, etc.)
                action_id = int(groups[1]) if len(groups) > 1 else 0
                direction = int(groups[2]) if len(groups) > 2 else 2
                frame_num = int(groups[3]) if len(groups) > 3 else 0
            
            return {
                'body_id': body_id,
                'action_id': action_id,
                'direction': direction,
                'frame_num': frame_num,
                'filename': filename
            }
    
    return None

def process_exported_files(export_dir):
    """Process all BMP files in export directory"""
    print("=" * 70)
    print("Processing UOFiddler Exports")
    print("=" * 70)
    
    # Map directory names to directions
    dir_name_map = {
        'walk_n': 0,   # North
        'walk_ne': 1,  # Northeast
        'walk_e': 2,   # East
        'walk_se': 3,  # Southeast
        'walk_s': 4,   # South
        'walk_sw': 5,  # Southwest
        'walk_w': 6,   # West
        'walk_nw': 7,  # Northwest
    }
    
    # Find all BMP files, including in subdirectories
    bmp_files = list(export_dir.glob("*.bmp")) + list(export_dir.glob("**/*.bmp"))
    
    # Group files by subdirectory (if they're in subdirectories)
    files_by_subdir = {}
    for bmp_file in bmp_files:
        # Get relative path from export_dir
        try:
            rel_path = bmp_file.relative_to(export_dir)
            if len(rel_path.parts) > 1:
                # File is in a subdirectory
                subdir = rel_path.parts[0]
                if subdir not in files_by_subdir:
                    files_by_subdir[subdir] = []
                files_by_subdir[subdir].append(bmp_file)
            else:
                # File is in root - add to 'root' group
                if 'root' not in files_by_subdir:
                    files_by_subdir['root'] = []
                files_by_subdir['root'].append(bmp_file)
        except ValueError:
            # File not relative to export_dir, skip
            continue
    
    if not bmp_files:
        print(f"[INFO] No BMP files found in {export_dir}")
        print("[INFO] Export animations from UOFiddler and they will be processed automatically")
        return
    
    print(f"\n[INFO] Found {len(bmp_files)} BMP files")
    
    # Group files by animation
    animations = {}
    
    for bmp_file in bmp_files:
        info = parse_export_filename(bmp_file.name)
        if not info:
            # Try to infer from context or use default
            print(f"  [SKIP] Could not parse: {bmp_file.name}")
            continue
        
        key = (info['body_id'], info['action_id'], info['direction'])
        if key not in animations:
            animations[key] = []
        animations[key].append((info['frame_num'], bmp_file))
    
    print(f"\n[INFO] Found {len(animations)} unique animations")
    
    # Process each animation
    for (body_id, action_id, direction), frames_data in animations.items():
        action_name = ACTIONS.get(action_id, f"action_{action_id}")
        dir_name = DIRECTIONS.get(direction, f"dir_{direction}")
        
        # Generate output name
        if action_id == 0:  # Walking
            output_name = f"male_walk_{dir_name}_sheet.png"
        else:
            output_name = f"male_{action_name}_sheet.png"
        
        print(f"\n{'='*70}")
        print(f"Processing: Body {body_id}, Action {action_id} ({action_name}), Direction {direction} ({dir_name})")
        print(f"{'='*70}")
        
        # Sort frames by frame number
        sorted_frames = sorted(frames_data, key=lambda x: x[0])
        print(f"  Found {len(sorted_frames)} frames")
        
        # Load and process frames
        frames = []
        for frame_num, bmp_file in sorted_frames:
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
                print(f"    [OK] Frame {frame_num}: {bmp_file.name} ({img.size[0]}x{img.size[1]})")
            except Exception as e:
                print(f"    [ERROR] Failed to process {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames")
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
        output_file = OUTPUT_DIR / output_name
        sheet.save(output_file, "PNG")
        print(f"\n  [SUCCESS] Saved: {output_file.name}")
        
        # Also create standard name for direction 2 (east/southeast)
        if action_id == 0 and direction == 2:
            standard_file = OUTPUT_DIR / "male_walk_sheet.png"
            sheet.save(standard_file, "PNG")
            print(f"  [OK] Also saved as: {standard_file.name}")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] Processing Complete!")
    print("=" * 70)

def watch_and_process(export_dir, interval=5):
    """Watch export directory for new files and process them"""
    print("=" * 70)
    print("UOFiddler Export Watcher")
    print("=" * 70)
    print(f"\n[INFO] Watching: {export_dir}")
    print("[INFO] Export animations from UOFiddler and they will be processed automatically")
    print("[INFO] Press Ctrl+C to stop\n")
    
    processed_files = set()
    
    try:
        while True:
            # Find new BMP files
            bmp_files = list(export_dir.glob("*.bmp")) + list(export_dir.glob("**/*.bmp"))
            new_files = [f for f in bmp_files if f not in processed_files]
            
            if new_files:
                print(f"\n[INFO] Found {len(new_files)} new file(s), processing...")
                process_exported_files(export_dir)
                processed_files.update(bmp_files)
            
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n[INFO] Watcher stopped")

def main():
    """Main function"""
    export_dir = find_uofiddler_export_dir()
    
    # Process existing files
    process_exported_files(export_dir)
    
    # Optionally watch for new files (commented out for non-interactive use)
    # Uncomment if you want to watch for new exports:
    # watch_and_process(export_dir)
    
    print("\n[INFO] Run this script again after exporting more animations from UOFiddler")

if __name__ == "__main__":
    main()

