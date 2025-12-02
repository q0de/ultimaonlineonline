"""
Auto-Organize and Process Halberd Animations
Automatically creates folders, organizes exports, and processes them into sprite sheets
"""

from pathlib import Path
from PIL import Image
import shutil
import re

# Configuration
EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Direction order for sequential exports (NE, E, SE, S, SW, W, NW, N)
SEQUENTIAL_DIRECTION_ORDER = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

# Animation mapping - maps UOFiddler export names to our naming
# Based on the halberd animation list shown
ANIMATION_MAPPING = {
    # Movement
    'walk_01': {'name': 'walk', 'action': 1},
    'walk_staff_01': {'name': 'walk', 'action': 1},
    'run_01': {'name': 'run', 'action': 2},
    'runstaff_01': {'name': 'run', 'action': 2},
    'run_staff_01': {'name': 'run', 'action': 2},
    
    # Idle
    'idle_01': {'name': 'idle', 'action': 3},
    'fidget_yawn_stretch_01': {'name': 'idle', 'action': 3},
    'combatidle_1h_01': {'name': 'idle', 'action': 3},
    'combatidle': {'name': 'idle', 'action': 3},
    
    # Attacks
    'attack_slash_1h_01': {'name': 'attack_1h', 'action': 8},
    'attack_pierce_1h_01': {'name': 'attack_1h', 'action': 8},
    'attack_bash1h_01': {'name': 'attack_1h', 'action': 8},
    'attack_bash_1h_01': {'name': 'attack_1h', 'action': 8},
    'attack_bash2h_01': {'name': 'attack_2h', 'action': 9},
    'attack_bash_2h_01': {'name': 'attack_2h', 'action': 9},
    'attack_slash2h_01': {'name': 'attack_2h', 'action': 9},
    'attack_slash_2h_01': {'name': 'attack_2h', 'action': 9},
    'attack_pierce2h_01': {'name': 'attack_2h', 'action': 9},
    'attack_pierce_2h_01': {'name': 'attack_2h', 'action': 9},
    'combat_advance_1h_01': {'name': 'attack_1h', 'action': 8},
    
    # Spells
    'spell1': {'name': 'cast', 'action': 16},
    'spell2': {'name': 'cast', 'action': 16},
    'spell': {'name': 'cast', 'action': 16},
    
    # Ranged
    'attack_bow_01': {'name': 'attack_bow', 'action': 18},
    'attack_crossbow_01': {'name': 'attack_crossbow', 'action': 19},
    
    # Reactions
    'gethit_fr_hi_01': {'name': 'hit', 'action': 12},
    'get_hit': {'name': 'hit', 'action': 12},
    'gethit': {'name': 'hit', 'action': 12},
    'die_hard_fwd_01': {'name': 'death', 'action': 13},
    'die_hard_back_01': {'name': 'death', 'action': 13},
    'die': {'name': 'death', 'action': 13},
    
    # Other
    'block_shield_hard_01': {'name': 'block', 'action': 20},
    'punch_punch_jab_01': {'name': 'punch', 'action': 8},
    'bow_lesser_01': {'name': 'bow', 'action': 18},
    'salute_armed_1h_01': {'name': 'salute', 'action': 3},
    'ingest_eat_01': {'name': 'eat', 'action': 3},
    
    # Fallbacks
    'attack': {'name': 'attack_2h', 'action': 9},
    'walk': {'name': 'walk', 'action': 1},
    'run': {'name': 'run', 'action': 2},
    'idle': {'name': 'idle', 'action': 3},
}

# Direction mapping from UO direction numbers to names
DIRECTION_MAP = {
    0: 'north',
    1: 'northeast',
    2: 'east',
    3: 'southeast',
    4: 'south',
    5: 'southwest',
    6: 'west',
    7: 'northwest'
}

def remove_white_background(img):
    """Remove white background and make transparent"""
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

def detect_animation_type(filename, parent_dir=None):
    """Detect animation type from filename or directory"""
    # Check filename first
    filename_lower = filename.lower()
    
    # Try exact matches first (from the animation list)
    for key, mapping in ANIMATION_MAPPING.items():
        if key in filename_lower:
            return mapping['name']
    
    # Check parent directory if filename doesn't match
    if parent_dir:
        parent_lower = parent_dir.lower()
        for key, mapping in ANIMATION_MAPPING.items():
            if key in parent_lower:
                return mapping['name']
    
    # Try partial matches
    if 'attack' in filename_lower and ('2h' in filename_lower or 'slash2h' in filename_lower or 'slash_2h' in filename_lower):
        return 'attack_2h'
    elif 'attack' in filename_lower and ('1h' in filename_lower or 'slash1h' in filename_lower):
        return 'attack_1h'
    elif 'walk' in filename_lower:
        return 'walk'
    elif 'run' in filename_lower:
        return 'run'
    elif 'idle' in filename_lower:
        return 'idle'
    elif 'hit' in filename_lower or 'gethit' in filename_lower:
        return 'hit'
    elif 'die' in filename_lower or 'death' in filename_lower:
        return 'death'
    elif 'spell' in filename_lower or 'cast' in filename_lower:
        return 'cast'
    
    return None

def detect_direction(filename, parent_dir=None):
    """Detect direction from filename or directory"""
    # Single-letter direction mapping (e, n, ne, nw, s, se, sw, w)
    SINGLE_LETTER_MAP = {
        'n': 'north',
        'ne': 'northeast',
        'e': 'east',
        'se': 'southeast',
        's': 'south',
        'sw': 'southwest',
        'w': 'west',
        'nw': 'northwest'
    }
    
    # Check parent directory first (UOFiddler often exports to direction folders)
    if parent_dir:
        parent_lower = parent_dir.lower()
        
        # Check for single-letter directions first (walk_e, run_n, etc.)
        for letter, dir_name in SINGLE_LETTER_MAP.items():
            # Match whole word or at end of folder name (e.g., "walk_e", "run_n")
            if re.search(r'[_-]' + letter + r'(?:[_-]|$)', parent_lower):
                return dir_name
        
        # Check for full direction names in parent
        for dir_num, dir_name in DIRECTION_MAP.items():
            if dir_name in parent_lower:
                return dir_name
        
        # Check for direction numbers in parent (e.g., "dir_0", "direction_2")
        match = re.search(r'(?:dir|direction)[_-]?(\d+)', parent_lower)
        if match:
            dir_num = int(match.group(1))
            if dir_num in DIRECTION_MAP:
                return DIRECTION_MAP[dir_num]
    
    # Try to find direction number in filename (e.g., "Mob 400-2.bmp" = direction 2)
    # UOFiddler exports often as "Mob 400-{direction}-{frame}.bmp"
    match = re.search(r'mob\s*\d+\s*-\s*(\d+)', filename.lower())
    if match:
        dir_num = int(match.group(1))
        if dir_num in DIRECTION_MAP:
            return DIRECTION_MAP[dir_num]
    
    # Try other patterns
    match = re.search(r'[_-](\d+)[_-]', filename)
    if match:
        dir_num = int(match.group(1))
        if dir_num in DIRECTION_MAP:
            return DIRECTION_MAP[dir_num]
    
    # Try to find direction name in filename
    filename_lower = filename.lower()
    for dir_num, dir_name in DIRECTION_MAP.items():
        if dir_name in filename_lower:
            return dir_name
    
    # Try single-letter directions in filename
    for letter, dir_name in SINGLE_LETTER_MAP.items():
        if re.search(r'[_-]' + letter + r'(?:[_-]|\.)', filename_lower):
            return dir_name
    
    return None

def organize_exported_files():
    """Organize exported files into proper folder structure"""
    print("="*60)
    print("Auto-Organizing Halberd Animations")
    print("="*60)
    print()
    
    EXPORT_BASE.mkdir(parents=True, exist_ok=True)
    
    # Find all BMP/PNG files in animations directory
    exported_files = []
    for ext in ['*.bmp', '*.png']:
        exported_files.extend(EXPORT_BASE.rglob(ext))
    
    if not exported_files:
        print("[INFO] No exported files found in animations directory")
        print(f"      Looking in: {EXPORT_BASE}")
        print("\n[INFO] Export files from UOFiddler to this directory")
        print("      The script will automatically organize them!")
        return
    
    print(f"[OK] Found {len(exported_files)} exported files")
    print()
    
    # Organize files by animation type and direction
    organized = {}
    
    for file_path in exported_files:
        filename = file_path.name
        parent_dir = file_path.parent.name
        
        # Detect animation type (check both filename and parent)
        anim_type = detect_animation_type(filename, parent_dir)
        
        # Detect direction (check parent first, then filename)
        direction = detect_direction(filename, parent_dir)
        
        # If still no direction, check if parent is a direction folder
        if not direction:
            parent_lower = parent_dir.lower()
            # Check for common direction folder patterns
            if 'north' in parent_lower and 'east' not in parent_lower and 'west' not in parent_lower:
                direction = 'north'
            elif 'south' in parent_lower and 'east' not in parent_lower and 'west' not in parent_lower:
                direction = 'south'
            elif 'east' in parent_lower and 'north' not in parent_lower and 'south' not in parent_lower:
                direction = 'east'
            elif 'west' in parent_lower and 'north' not in parent_lower and 'south' not in parent_lower:
                direction = 'west'
            elif 'northeast' in parent_lower:
                direction = 'northeast'
            elif 'northwest' in parent_lower:
                direction = 'northwest'
            elif 'southeast' in parent_lower:
                direction = 'southeast'
            elif 'southwest' in parent_lower:
                direction = 'southwest'
        
        if not anim_type:
            anim_type = 'unknown'
        
        if not direction:
            direction = 'unknown'
        
        key = f"{anim_type}_{direction}"
        if key not in organized:
            organized[key] = []
        organized[key].append(file_path)
    
    print(f"[OK] Organized into {len(organized)} animation groups")
    print()
    
    # Create organized folder structure
    for key, files in organized.items():
        anim_type, direction = key.rsplit('_', 1)
        
        # Skip "unknown" - these might be equipment sprites or need manual organization
        if anim_type == 'unknown' and direction == 'unknown':
            print(f"  [SKIP] {key}: {len(files)} files (unknown type - might be equipment sprites)")
            continue
        
        # Create organized folder with proper naming
        # Format: halberd_{animation_type}_{direction}
        org_folder = EXPORT_BASE / f"halberd_{anim_type}_{direction}"
        org_folder.mkdir(parents=True, exist_ok=True)
        
        # Copy files to organized folder (only if not already there)
        copied = 0
        for file_path in files:
            # Don't copy if file is already in the target folder
            if file_path.parent == org_folder:
                continue
            dest = org_folder / file_path.name
            if not dest.exists():
                shutil.copy2(file_path, dest)
                copied += 1
        
        if copied > 0:
            print(f"  [OK] {key}: {len(files)} files -> {org_folder.name}/ ({copied} copied)")
        else:
            print(f"  [OK] {key}: {len(files)} files already in {org_folder.name}/")
    
    return organized

def process_organized_animations(organized):
    """Process organized animations into sprite sheets"""
    print("\n" + "="*60)
    print("Processing Animations into Sprite Sheets")
    print("="*60)
    print()
    
    if not organized:
        print("[WARN] No animations to process")
        return
    
    processed = 0
    failed = 0
    
    # Process organized animation groups directly
    # organized dict contains: {anim_type_direction: [list of BMP files]}
    for key, bmp_files in organized.items():
        if not bmp_files:
            continue
        
        anim_type, direction = key.rsplit('_', 1)
        
        # Skip unknown
        if anim_type == 'unknown' or direction == 'unknown':
            continue
        
        print(f"Processing: {key}")
        
        # Load frames from BMP files
        frames = []
        for bmp_file in sorted(bmp_files):
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
            except Exception as e:
                print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames found")
            failed += 1
            continue
        
        # Create sprite sheet
        frame_width = max(img.width for img in frames)
        frame_height = max(img.height for img in frames)
        sheet_width = frame_width * len(frames)
        sheet_height = frame_height
        
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        for i, frame in enumerate(frames):
            x_offset = i * frame_width
            paste_x = x_offset + (frame_width - frame.width) // 2
            paste_y = (frame_height - frame.height) // 2
            sprite_sheet.paste(frame, (paste_x, paste_y), frame)
        
        # Map to our naming convention (we already have anim_type and direction)
        if 'attack_2h' in anim_type or ('attack' in anim_type and '2h' in anim_type):
            output_name = f"male_attack_2h_{direction}_sheet.png"
        elif 'attack_1h' in anim_type or ('attack' in anim_type and '1h' in anim_type):
            output_name = f"male_attack_1h_{direction}_sheet.png"
        elif 'walk' in anim_type:
            output_name = f"male_walk_{direction}_sheet.png"
        elif 'run' in anim_type:
            output_name = f"male_run_{direction}_sheet.png"
        elif 'idle' in anim_type:
            output_name = f"male_idle_{direction}_sheet.png"
        elif 'hit' in anim_type or 'gethit' in anim_type:
            output_name = f"male_hit_{direction}_sheet.png"
        elif 'death' in anim_type or 'die' in anim_type:
            output_name = f"male_death_{direction}_sheet.png"
        elif 'cast' in anim_type or 'spell' in anim_type:
            output_name = f"male_cast_{direction}_sheet.png"
        else:
            output_name = f"male_{anim_type}_{direction}_sheet.png"
        
        # Save sprite sheet
        output_path = OUTPUT_DIR / output_name
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"  [OK] Created sprite sheet: {output_name} ({len(frames)} frames)")
        processed += 1
    
    print("\n" + "="*60)
    print(f"Processing complete!")
    print(f"  Processed: {processed}")
    print(f"  Failed: {failed}")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)

def main():
    """Main function"""
    # Step 1: Organize exported files
    organized = organize_exported_files()
    
    # Step 2: Process into sprite sheets
    if organized:
        process_organized_animations(organized)
    else:
        print("\n[INFO] No files to process yet.")
        print("       Export animations from UOFiddler to:")
        print(f"       {EXPORT_BASE}")
        print("\n       Then run this script again!")

if __name__ == "__main__":
    main()

