"""
Process Halberd Attack Animations
Automatically processes all exported halberd attack animations from UOFiddler
"""

from pathlib import Path
from PIL import Image
import os

# Configuration
ANIMATIONS_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Direction mapping
DIRECTION_NAMES = {
    'north': 0,
    'northeast': 1,
    'east': 2,
    'southeast': 3,
    'south': 4,
    'southwest': 5,
    'west': 6,
    'northwest': 7
}

def remove_white_background(img):
    """Remove white background and make transparent"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    
    for item in data:
        # If pixel is white (or very close to white), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def process_animation_directory(anim_dir):
    """Process all BMP files in a directory into a sprite sheet"""
    if not anim_dir.exists():
        print(f"  [SKIP] Directory not found: {anim_dir.name}")
        return False
    
    # Find all BMP files
    bmp_files = sorted(anim_dir.glob("*.bmp"))
    if not bmp_files:
        print(f"  [SKIP] No BMP files found in {anim_dir.name}")
        return False
    
    print(f"  [OK] Found {len(bmp_files)} frames in {anim_dir.name}")
    
    # Load and process frames
    frames = []
    for bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
    
    if not frames:
        print(f"  [ERROR] No valid frames found")
        return False
    
    # Get frame dimensions
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    
    # Create sprite sheet
    sheet_width = frame_width * len(frames)
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Paste frames horizontally
    for i, frame in enumerate(frames):
        x_offset = i * frame_width
        sprite_sheet.paste(frame, (x_offset, 0), frame)
    
    # Determine output filename from directory name
    dir_name = anim_dir.name.lower()
    if 'halberd' in dir_name or 'attack' in dir_name:
        # Extract direction from directory name
        for dir_name_key, dir_num in DIRECTION_NAMES.items():
            if dir_name_key in dir_name:
                output_name = f"male_attack_2h_{dir_name_key}_sheet.png"
                break
        else:
            output_name = f"male_attack_2h_{dir_name}_sheet.png"
    else:
        output_name = f"male_{dir_name}_sheet.png"
    
    # Save sprite sheet
    output_path = OUTPUT_DIR / output_name
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"  [OK] Saved sprite sheet: {output_name} ({len(frames)} frames)")
    return True

def main():
    """Main processing function"""
    print("="*60)
    print("Halberd Attack Animation Processor")
    print("="*60)
    print()
    
    if not ANIMATIONS_DIR.exists():
        print(f"[ERROR] Animations directory not found: {ANIMATIONS_DIR}")
        return
    
    # Look for halberd attack directories
    processed = 0
    failed = 0
    
    # Check for directories matching halberd attack patterns
    for anim_dir in ANIMATIONS_DIR.iterdir():
        if anim_dir.is_dir():
            dir_name_lower = anim_dir.name.lower()
            if 'halberd' in dir_name_lower or 'attack' in dir_name_lower or '2h' in dir_name_lower:
                print(f"\nProcessing: {anim_dir.name}")
                if process_animation_directory(anim_dir):
                    processed += 1
                else:
                    failed += 1
    
    # Also check for numbered directories (if exported as "halberd_attack_0", etc.)
    for i in range(8):
        dir_name = f"halberd_attack_{i}"
        anim_dir = ANIMATIONS_DIR / dir_name
        if anim_dir.exists():
            print(f"\nProcessing: {anim_dir.name}")
            if process_animation_directory(anim_dir):
                processed += 1
            else:
                failed += 1
    
    print("\n" + "="*60)
    print(f"Processing complete!")
    print(f"  Processed: {processed}")
    print(f"  Failed: {failed}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()









