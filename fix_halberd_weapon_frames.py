"""
Fix Halberd Weapon Sprite Sheets - Ensure exactly 10 frames each
"""

from pathlib import Path
from PIL import Image

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons")

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

def fix_sprite_sheet(direction):
    """Fix a sprite sheet to have exactly 10 frames"""
    processed_folder = EXPORT_BASE / f"processed_halberd_weapon_{direction}"
    
    if not processed_folder.exists():
        print(f"  [SKIP] {direction}: No processed folder found")
        return False
    
    # Get all BMP files (should be 0-9, exactly 10)
    import re
    bmp_files = []
    for bmp_file in sorted(processed_folder.glob("Equipment 624*.bmp")):
        match = re.search(r'Equipment\s*624\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            bmp_files.append((frame_num, bmp_file))
    
    # Sort by frame number
    bmp_files.sort(key=lambda x: x[0])
    
    if len(bmp_files) != 10:
        print(f"  [WARN] {direction}: Found {len(bmp_files)} files, expected 10")
        # Take first 10 if we have more, or pad if we have fewer
        if len(bmp_files) > 10:
            print(f"         Taking first 10 frames")
            bmp_files = bmp_files[:10]
        elif len(bmp_files) < 10:
            print(f"         Missing frames: {set(range(10)) - {f[0] for f in bmp_files}}")
            return False
    
    # Load exactly 10 frames
    frames = []
    for frame_num, bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"    [ERROR] Failed to load {bmp_file.name}: {e}")
            return False
    
    if len(frames) != 10:
        print(f"  [ERROR] {direction}: Only loaded {len(frames)} frames")
        return False
    
    # Create sprite sheet with exactly 10 frames
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * 10  # Exactly 10 frames
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
    
    print(f"  [OK] {direction}: Created {output_name} (10 frames, {sheet_width}x{sheet_height})")
    return True

def main():
    print("="*60)
    print("Fixing Halberd Weapon Sprite Sheets")
    print("Ensuring exactly 10 frames per direction")
    print("="*60)
    
    fixed = 0
    failed = 0
    
    for direction in DIRECTION_ORDER:
        print(f"\nProcessing: {direction}")
        if fix_sprite_sheet(direction):
            fixed += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"Fix complete!")
    print(f"  Fixed: {fixed}/8")
    print(f"  Failed: {failed}/8")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()









