"""
Process BMP files exported directly to animations root
Handles sequential exports: NE, E, SE, S, SW, W, NW, N
"""

from pathlib import Path
from PIL import Image
import time

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Direction order for sequential exports
DIRECTION_ORDER = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

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

def process_root_bmp_files():
    """Process BMP files exported directly to animations root"""
    print("="*60)
    print("Processing BMP Files from Root Directory")
    print("="*60)
    
    # Find all Mob *.bmp files in root
    bmp_files = sorted(EXPORT_BASE.glob("Mob *.bmp")) + sorted(EXPORT_BASE.glob("Mob *.BMP"))
    
    # Also check for recently created folders with BMP files
    import time
    current_time = time.time()
    recent_folders = []
    for folder in EXPORT_BASE.iterdir():
        if not folder.is_dir():
            continue
        if folder.name.startswith('processed_') or folder.name.startswith('halberd_'):
            continue
        folder_age = current_time - folder.stat().st_ctime
        if folder_age < 3600:  # Created in last hour
            folder_bmps = list(folder.glob("Mob *.bmp")) + list(folder.glob("Mob *.BMP"))
            if folder_bmps:
                recent_folders.append((folder, folder_bmps))
    
    if recent_folders:
        print(f"\n[INFO] Found {len(recent_folders)} recent folder(s) with BMP files")
        # Process the most recent folder
        folder, folder_bmps = recent_folders[-1]
        print(f"       Processing folder: {folder.name}")
        bmp_files = sorted(folder_bmps)
    
    if not bmp_files:
        print("\n[ERROR] No Mob *.bmp files found!")
        print(f"        Check: {EXPORT_BASE}")
        print("        Make sure you exported 'Mob 400-X.bmp' files (not Equipment files)")
        return
    
    # Filter to recent files (created in last hour)
    current_time = time.time()
    recent_files = [f for f in bmp_files if (current_time - f.stat().st_ctime) < 3600]
    
    if not recent_files:
        print(f"\n[INFO] Found {len(bmp_files)} BMP files, but none are recent")
        print("       Processing all files anyway...")
        recent_files = bmp_files
    
    # Group files by their number (Mob 400-0.bmp, Mob 400-1.bmp, etc.)
    # Each direction should have files 0-9
    file_groups = {}
    for bmp_file in recent_files:
        # Extract frame number from filename (e.g., "Mob 400-5.bmp" -> 5)
        match = __import__('re').search(r'Mob\s*\d+\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            if frame_num not in file_groups:
                file_groups[frame_num] = []
            file_groups[frame_num].append(bmp_file)
    
    # Sort by frame number
    sorted_frames = sorted(file_groups.keys())
    
    if len(sorted_frames) == 10:
        # This is one direction (10 frames: 0-9)
        print(f"\n[OK] Found 1 direction with {len(sorted_frames)} frames")
        print("     This should be the FIRST direction: NORTHEAST")
        
        # Load all frames
        frames = []
        for frame_num in sorted_frames:
            bmp_file = file_groups[frame_num][0]  # Take first if multiple
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
            except Exception as e:
                print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
        
        if frames:
            # Create sprite sheet
            frame_width = max(img.width for img in frames)
            frame_height = max(img.height for img in frames)
            sheet_width = frame_width * len(frames)
            sheet_height = frame_height
            
            sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
            
            for j, frame in enumerate(frames):
                x_offset = j * frame_width
                paste_x = x_offset + (frame_width - frame.width) // 2
                paste_y = (frame_height - frame.height) // 2
                sprite_sheet.paste(frame, (paste_x, paste_y), frame)
            
            # First direction is NORTHEAST
            direction = DIRECTION_ORDER[0]
            output_name = f"male_walk_{direction}_sheet.png"
            output_path = OUTPUT_DIR / output_name
            
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            sprite_sheet.save(output_path, 'PNG')
            
            print(f"\n[OK] Created: {output_name} ({len(frames)} frames)")
            print(f"     Output: {output_path}")
            
            # Move processed files to a folder to avoid reprocessing
            processed_folder = EXPORT_BASE / f"processed_walk_{direction}"
            processed_folder.mkdir(exist_ok=True)
            for bmp_file in recent_files:
                dest = processed_folder / bmp_file.name
                if not dest.exists():
                    bmp_file.rename(dest)
            
            print(f"\n[OK] Moved processed files to: {processed_folder.name}/")
            print("\n[INFO] Export the next direction (EAST) to continue...")
        else:
            print("\n[ERROR] No valid frames to process")
    else:
        print(f"\n[WARN] Found {len(sorted_frames)} frames, expected 10")
        print("       This might be multiple directions or incomplete export")

if __name__ == "__main__":
    process_root_bmp_files()

