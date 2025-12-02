"""
Process All Halberd Weapon Animations from processed folders
Creates sprite sheets for all halberd weapon animations (attack, idle, idle2)
"""

from pathlib import Path
from PIL import Image
import re

ANIMATIONS_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
WEAPONS_OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons")

def remove_white_background(img):
    """Remove white background"""
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

def process_halberd_folder(folder_path, anim_type):
    """Process a halberd animation folder into a sprite sheet"""
    # Find all BMP files
    bmp_files = sorted(folder_path.glob("Equipment 624*.bmp")) + sorted(folder_path.glob("Equipment 624*.BMP"))
    
    if not bmp_files:
        return False
    
    # Extract frame numbers
    frames_dict = {}
    for bmp_file in bmp_files:
        match = re.search(r'Equipment\s*624\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            frames_dict[frame_num] = bmp_file
        elif bmp_file.name == "Equipment 624.bmp":
            frames_dict[0] = bmp_file
    
    if not frames_dict:
        return False
    
    # Sort by frame number
    sorted_frames = sorted(frames_dict.items())
    
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
    
    if not frames:
        return False
    
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
    
    # Extract direction from folder name
    folder_name = folder_path.name
    direction = None
    
    # Check for direction in folder name
    for dir_name in ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']:
        if dir_name in folder_name.lower():
            direction = dir_name
            break
    
    if not direction:
        print(f"  [WARN] Could not detect direction from {folder_name}")
        return False
    
    # Determine output filename based on anim_type
    if anim_type == 'weapon':
        output_name = f"halberd_weapon_{direction}_sheet.png"
    elif anim_type == 'idle':
        output_name = f"halberd_idle_{direction}_sheet.png"
    elif anim_type == 'idle2':
        output_name = f"halberd_idle2_{direction}_sheet.png"
    else:
        output_name = f"halberd_{anim_type}_{direction}_sheet.png"
    
    output_path = WEAPONS_OUTPUT_DIR / output_name
    WEAPONS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"  [OK] {anim_type} {direction}: Created {output_name} ({len(frames)} frames)")
    return True

def main():
    print("="*60)
    print("Processing All Halberd Weapon Animations")
    print("="*60)
    
    WEAPONS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    processed_count = 0
    
    # Process weapon attack animations
    print("\nProcessing halberd weapon attack animations...")
    weapon_folders = [d for d in ANIMATIONS_DIR.iterdir() 
                     if d.is_dir() and d.name.startswith('processed_halberd_weapon_')]
    
    for folder in sorted(weapon_folders):
        if process_halberd_folder(folder, 'weapon'):
            processed_count += 1
    
    # Process idle animations
    print("\nProcessing halberd idle animations...")
    idle_folders = [d for d in ANIMATIONS_DIR.iterdir() 
                   if d.is_dir() and d.name.startswith('processed_halberd_idle_') 
                   and 'idle2' not in d.name]
    
    for folder in sorted(idle_folders):
        if process_halberd_folder(folder, 'idle'):
            processed_count += 1
    
    # Process idle2 animations
    print("\nProcessing halberd idle2 animations...")
    idle2_folders = [d for d in ANIMATIONS_DIR.iterdir() 
                    if d.is_dir() and d.name.startswith('processed_halberd_idle2_')]
    
    for folder in sorted(idle2_folders):
        if process_halberd_folder(folder, 'idle2'):
            processed_count += 1
    
    print("\n" + "="*60)
    print(f"Processing complete! Processed {processed_count} animations")
    print(f"Output: {WEAPONS_OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()




