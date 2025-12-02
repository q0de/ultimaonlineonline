"""
Process halberd WALK weapon animations from processed_halberd_weapon_* folders
These 10-frame animations are for walking, not attacking!
"""

import re
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
SOURCE_DIR = PROJECT_ROOT / "assets" / "sprites" / "animations"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "weapons"

# Direction mapping
DIRECTIONS = ['east', 'north', 'northeast', 'northwest', 'south', 'southeast', 'southwest', 'west']

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

def process_walk_weapon_animations():
    print("=" * 70)
    print("Processing Halberd WALK Weapon Animations")
    print("=" * 70)
    print(f"\nSource: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")
    
    processed = 0
    
    for direction in DIRECTIONS:
        source_folder = SOURCE_DIR / f"processed_halberd_weapon_{direction}"
        
        if not source_folder.exists():
            print(f"⚠ Skipping {direction}: Folder not found")
            continue
        
        # Get all BMP files
        bmp_files = sorted(list(source_folder.glob("*.bmp")))
        
        if not bmp_files:
            print(f"⚠ Skipping {direction}: No BMP files found")
            continue
        
        print(f"\n{'='*70}")
        print(f"Processing: {direction.upper()} ({len(bmp_files)} frames)")
        print(f"{'='*70}")
        
        # Load all frames
        frames = []
        max_width = 0
        max_height = 0
        
        for bmp_file in bmp_files:
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
                max_width = max(max_width, img.width)
                max_height = max(max_height, img.height)
                print(f"  [OK] Frame {len(frames)-1}: {bmp_file.name} ({img.width}x{img.height})")
            except Exception as e:
                print(f"  [ERROR] Failed to load {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames found")
            continue
        
        # Create sprite sheet (horizontal layout)
        sheet_width = max_width * len(frames)
        sheet_height = max_height
        
        print(f"\n  Creating sprite sheet:")
        print(f"    Frame size: {max_width}x{max_height}")
        print(f"    Sheet size: {sheet_width}x{sheet_height}")
        print(f"    Total frames: {len(frames)}")
        
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (255, 255, 255, 0))
        
        for i, frame in enumerate(frames):
            x_offset = i * max_width
            sprite_sheet.paste(frame, (x_offset, 0), frame)
        
        # Save as walk animation
        output_file = OUTPUT_DIR / f"halberd_walk_{direction}_sheet.png"
        sprite_sheet.save(output_file, 'PNG')
        print(f"\n  [SUCCESS] Saved: {output_file.name}")
        processed += 1
    
    print(f"\n{'='*70}")
    print(f"Processing Complete!")
    print(f"Successfully processed: {processed}/{len(DIRECTIONS)} directions")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    process_walk_weapon_animations()




