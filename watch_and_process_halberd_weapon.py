"""
Watch and Auto-Process Halberd Weapon Animations
Automatically processes Equipment 624 files as they're exported
"""

from pathlib import Path
from PIL import Image
import time
import re

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons")

# Direction order for sequential exports
DIRECTION_ORDER = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

# Track which directions have been processed
processed_directions = set()

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
        # Skip files in processed folders
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    for bmp_file in EXPORT_BASE.glob("Equipment 624*.BMP"):
        if 'processed_halberd_weapon' not in str(bmp_file.parent):
            bmp_files.append(bmp_file)
    return sorted(bmp_files)

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
            processed_directions.add(direction_index)
            return True
    
    return False

def watch_and_process():
    """Watch directory and process new files automatically"""
    print("="*60)
    print("Watching for Halberd Weapon Animations (Equipment 624)")
    print("="*60)
    print("\n[INFO] Watching directory for new exports...")
    print(f"       Directory: {EXPORT_BASE}")
    print(f"       Export order: {', '.join(DIRECTION_ORDER)}")
    print("\n[INFO] Export Equipment 624 files and they'll be processed automatically!")
    print("       Press Ctrl+C to stop watching\n")
    
    # Check initial state
    initial_files = get_unprocessed_files()
    initial_count = len(initial_files)
    if initial_count >= 10:
        print(f"\n[INFO] Found {initial_count} unprocessed files on startup - processing now...")
        direction_index = len(processed_directions)
        if direction_index < len(DIRECTION_ORDER):
            direction = DIRECTION_ORDER[direction_index]
            print(f"       Processing {direction.upper()}...")
            if process_direction(direction_index):
                print(f"[SUCCESS] {direction.upper()} processed! ({len(processed_directions)}/8 complete)")
    
    last_file_count = len(get_unprocessed_files())
    
    try:
        while True:
            # Check for new files
            bmp_files = get_unprocessed_files()
            current_file_count = len(bmp_files)
            
            # If we have 10 new files (one complete direction), process it
            if current_file_count >= 10 and current_file_count != last_file_count:
                # Determine which direction to process based on how many we've done
                direction_index = len(processed_directions)
                
                if direction_index < len(DIRECTION_ORDER):
                    direction = DIRECTION_ORDER[direction_index]
                    print(f"\n[INFO] Detected {current_file_count} files - processing {direction.upper()}...")
                    print(f"       Files: {[f.name for f in get_unprocessed_files()[:5]]}...")
                    
                    if process_direction(direction_index):
                        print(f"[SUCCESS] {direction.upper()} processed! ({len(processed_directions)}/8 complete)")
                        
                        if len(processed_directions) == 8:
                            print("\n" + "="*60)
                            print("ALL DIRECTIONS COMPLETE!")
                            print("="*60)
                            break
                    else:
                        print(f"[WARN] Failed to process {direction}")
                        print(f"       Found {current_file_count} files but couldn't process")
            elif current_file_count > 0 and current_file_count < 10:
                # Show progress if we have some files but not a complete set
                if current_file_count != last_file_count:
                    print(f"[INFO] Detected {current_file_count} files (need 10 for complete direction)")
            
            last_file_count = current_file_count
            
            # Wait 2 seconds before checking again
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n\n[INFO] Stopped watching")
        print(f"       Processed: {len(processed_directions)}/8 directions")

if __name__ == "__main__":
    watch_and_process()

