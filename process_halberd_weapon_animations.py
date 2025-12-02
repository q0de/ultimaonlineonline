"""
Process Halberd Weapon Animations (Equipment 624)
Handles sequential exports: NE, E, SE, S, SW, W, NW, N
"""

from pathlib import Path
from PIL import Image
import time

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons")

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

def process_halberd_weapon_animations():
    """Process halberd weapon animations (Equipment 624) exported in sequential order"""
    print("="*60)
    print("Processing Halberd Weapon Animations (Equipment 624)")
    print("="*60)
    
    # Check which directions have been processed
    processed_dirs = [d.name.replace('processed_halberd_weapon_', '') 
                      for d in EXPORT_BASE.iterdir() 
                      if d.is_dir() and d.name.startswith('processed_halberd_weapon_')]
    
    # Determine next direction to process
    next_direction_index = len(processed_dirs)
    if next_direction_index >= len(DIRECTION_ORDER):
        print("\n[INFO] All 8 directions have been processed!")
        return
    
    next_direction = DIRECTION_ORDER[next_direction_index]
    print(f"\n[INFO] Next direction to process: {next_direction.upper()}")
    print(f"       Already processed: {', '.join(processed_dirs) if processed_dirs else 'none'}")
    
    # Find all Equipment 624 *.bmp files in root (not in processed folders)
    bmp_files = []
    for bmp_file in EXPORT_BASE.glob("Equipment 624*.bmp"):
        # Skip files in processed folders
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    for bmp_file in EXPORT_BASE.glob("Equipment 624*.BMP"):
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    
    bmp_files = sorted(bmp_files)
    
    if not bmp_files:
        print("\n[ERROR] No Equipment 624 *.bmp files found!")
        print(f"        Check: {EXPORT_BASE}")
        print("        Make sure files are in the root animations folder, not in subfolders")
        return
    
    recent_files = bmp_files
    
    # Group files by their number (Equipment 624-0.bmp, Equipment 624-1.bmp, etc.)
    import re
    file_groups = {}
    for bmp_file in recent_files:
        # Extract frame number from filename (e.g., "Equipment 624-5.bmp" -> 5)
        match = re.search(r'Equipment\s*624\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            if frame_num not in file_groups:
                file_groups[frame_num] = []
            file_groups[frame_num].append(bmp_file)
        elif bmp_file.name == "Equipment 624.bmp":
            # Handle base Equipment 624.bmp file
            if 'base' not in file_groups:
                file_groups['base'] = []
            file_groups['base'].append(bmp_file)
    
    # Sort by frame number (exclude 'base' key)
    numeric_frames = [f for f in file_groups.keys() if isinstance(f, int)]
    sorted_frames = sorted(numeric_frames)
    
    if len(sorted_frames) == 10:
        # This is one direction (10 frames: 0-9)
        # Determine which direction based on what's been processed
        processed_dirs = [d.name.replace('processed_halberd_weapon_', '') 
                          for d in EXPORT_BASE.iterdir() 
                          if d.is_dir() and d.name.startswith('processed_halberd_weapon_')]
        direction_index = len(processed_dirs)
        direction = DIRECTION_ORDER[direction_index] if direction_index < len(DIRECTION_ORDER) else 'unknown'
        
        print(f"\n[OK] Found 1 direction with {len(sorted_frames)} frames")
        print(f"     Processing as: {direction.upper()}")
        
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
            
            # Use the determined direction
            output_name = f"halberd_{direction}_sheet.png"
            output_path = OUTPUT_DIR / output_name
            
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            sprite_sheet.save(output_path, 'PNG')
            
            print(f"\n[OK] Created: {output_name} ({len(frames)} frames)")
            print(f"     Output: {output_path}")
            
            # Move processed files to a folder to avoid reprocessing
            processed_folder = EXPORT_BASE / f"processed_halberd_weapon_{direction}"
            processed_folder.mkdir(exist_ok=True)
            for bmp_file in recent_files:
                dest = processed_folder / bmp_file.name
                if not dest.exists():
                    bmp_file.rename(dest)
            
            print(f"\n[OK] Moved processed files to: {processed_folder.name}/")
            print(f"\n[INFO] Export the next direction (EAST) to continue...")
            print(f"       Progress: 1/8 directions complete")
        else:
            print("\n[ERROR] No valid frames to process")
    else:
        print(f"\n[WARN] Found {len(sorted_frames)} frames, expected 10")
        print("       This might be multiple directions or incomplete export")

if __name__ == "__main__":
    process_halberd_weapon_animations()

