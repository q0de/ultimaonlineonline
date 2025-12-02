"""
Process All Halberd Animations
Automatically processes exported animations from UOFiddler
"""

from pathlib import Path
from PIL import Image
import os

ANIMATIONS_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

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

def process_animation_directory(anim_dir):
    """Process all BMP files in a directory into a sprite sheet"""
    if not anim_dir.exists():
        return False
    
    bmp_files = sorted(anim_dir.glob("*.bmp"))
    if not bmp_files:
        return False
    
    frames = []
    for bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
    
    if not frames:
        return False
    
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * len(frames)
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x_offset = i * frame_width
        sprite_sheet.paste(frame, (x_offset, 0), frame)
    
    # Determine output filename
    dir_name = anim_dir.name.lower().replace('halberd_', 'male_').replace('_01', '')
    if not dir_name.endswith('_sheet'):
        dir_name += '_sheet'
    output_name = f"{dir_name}.png"
    
    output_path = OUTPUT_DIR / output_name
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"  [OK] Processed {len(frames)} frames -> {output_name}")
    return True

def main():
    print("="*60)
    print("Processing All Halberd Animations")
    print("="*60)
    
    processed = 0
    for anim_dir in ANIMATIONS_DIR.iterdir():
        if anim_dir.is_dir() and 'halberd' in anim_dir.name.lower():
            print(f"\nProcessing: {anim_dir.name}")
            if process_animation_directory(anim_dir):
                processed += 1
    
    print(f"\nProcessed {processed} animations!")

if __name__ == "__main__":
    main()
