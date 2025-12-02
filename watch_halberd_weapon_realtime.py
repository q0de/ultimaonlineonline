"""
Real-time File Watcher for Halberd Weapon Animations
Uses Windows file system events to detect new files immediately
"""

from pathlib import Path
from PIL import Image
import time
import re
import sys

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

def get_unprocessed_files():
    """Get Equipment 624 files that haven't been processed yet"""
    bmp_files = []
    for bmp_file in EXPORT_BASE.glob("Equipment 624*.bmp"):
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    for bmp_file in EXPORT_BASE.glob("Equipment 624*.BMP"):
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    return sorted(bmp_files)

def get_processed_directions():
    """Get list of already processed directions"""
    processed_dirs = []
    for d in EXPORT_BASE.iterdir():
        if d.is_dir() and d.name.startswith('processed_halberd_weapon_'):
            dir_name = d.name.replace('processed_halberd_weapon_', '')
            if dir_name in DIRECTION_ORDER:
                processed_dirs.append(dir_name)
    return processed_dirs

def process_direction(direction_index):
    """Process one direction of halberd weapon animations"""
    direction = DIRECTION_ORDER[direction_index]
    
    # Get unprocessed files
    bmp_files = get_unprocessed_files()
    
    if not bmp_files:
        return False
    
    # Group files by frame number
    file_groups = {}
    for bmp_file in bmp_files:
        match = re.search(r'Equipment\s*624\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            if frame_num not in file_groups:
                file_groups[frame_num] = []
            file_groups[frame_num].append(bmp_file)
    
    numeric_frames = [f for f in file_groups.keys() if isinstance(f, int)]
    sorted_frames = sorted(numeric_frames)
    
    if len(sorted_frames) == 10:
        # Load all frames
        frames = []
        for frame_num in sorted_frames:
            bmp_file = file_groups[frame_num][0]
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
            except Exception as e:
                print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
                return False
        
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
            
            output_name = f"halberd_{direction}_sheet.png"
            output_path = OUTPUT_DIR / output_name
            
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            sprite_sheet.save(output_path, 'PNG')
            
            print(f"\n[OK] Created: {output_name} ({len(frames)} frames)")
            print(f"     Output: {output_path}")
            
            # Move processed files
            processed_folder = EXPORT_BASE / f"processed_halberd_weapon_{direction}"
            processed_folder.mkdir(exist_ok=True)
            for bmp_file in bmp_files:
                dest = processed_folder / bmp_file.name
                if not dest.exists():
                    bmp_file.rename(dest)
            
            print(f"[OK] Moved processed files to: {processed_folder.name}/")
            return True
    
    return False

def watch_with_polling():
    """Watch directory using polling (more reliable than file watcher on Windows)"""
    print("="*60)
    print("Watching for Halberd Weapon Animations (Equipment 624)")
    print("="*60)
    print(f"\n[INFO] Watching: {EXPORT_BASE}")
    print(f"       Export order: {', '.join(DIRECTION_ORDER)}")
    print("\n[INFO] Export Equipment 624 files - they'll be processed automatically!")
    print("       Press Ctrl+C to stop\n")
    
    last_file_count = 0
    last_check_time = 0
    
    try:
        while True:
            current_time = time.time()
            
            # Check every 1 second
            if current_time - last_check_time >= 1.0:
                bmp_files = get_unprocessed_files()
                current_file_count = len(bmp_files)
                processed_dirs = get_processed_directions()
                
                # Show status every 5 seconds
                if int(current_time) % 5 == 0 and current_file_count != last_file_count:
                    print(f"[STATUS] {len(processed_dirs)}/8 processed | {current_file_count} files waiting")
                
                # If we have 10 files and count changed, process them
                if current_file_count >= 10 and current_file_count != last_file_count:
                    direction_index = len(processed_dirs)
                    
                    if direction_index < len(DIRECTION_ORDER):
                        direction = DIRECTION_ORDER[direction_index]
                        print(f"\n[INFO] Detected {current_file_count} files - processing {direction.upper()}...")
                        
                        if process_direction(direction_index):
                            processed_dirs = get_processed_directions()
                            print(f"[SUCCESS] {direction.upper()} processed! ({len(processed_dirs)}/8 complete)")
                            
                            if len(processed_dirs) == 8:
                                print("\n" + "="*60)
                                print("ALL DIRECTIONS COMPLETE!")
                                print("="*60)
                                break
                        else:
                            print(f"[WARN] Failed to process {direction}")
                
                last_file_count = current_file_count
                last_check_time = current_time
            
            time.sleep(0.5)  # Check every 0.5 seconds
            
    except KeyboardInterrupt:
        processed_dirs = get_processed_directions()
        print(f"\n\n[INFO] Stopped watching")
        print(f"       Processed: {len(processed_dirs)}/8 directions")

if __name__ == "__main__":
    # Process any existing files first
    processed_dirs = get_processed_directions()
    unprocessed = get_unprocessed_files()
    
    if unprocessed and len(unprocessed) >= 10:
        direction_index = len(processed_dirs)
        if direction_index < len(DIRECTION_ORDER):
            direction = DIRECTION_ORDER[direction_index]
            print(f"[INFO] Found {len(unprocessed)} unprocessed files - processing {direction.upper()}...")
            if process_direction(direction_index):
                processed_dirs = get_processed_directions()
                print(f"[SUCCESS] {direction.upper()} processed! ({len(processed_dirs)}/8 complete)")
    
    # Start watching
    watch_with_polling()









