"""
Fix All Idle Animations - Ensure they're all single frames
"""

from pathlib import Path
from PIL import Image

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

DIRECTIONS = {
    'north': 'idle-static_n',
    'northeast': 'idle-static_ne',
    'east': 'idle-static_e',
    'southeast': 'idle-static_se',
    'south': 'idle-static_s',
    'southwest': 'idle-static_sw',
    'west': 'idle-static_w',
    'northwest': 'idle-static_nw'
}

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

def fix_idle_direction(direction_name, folder_name):
    """Fix one idle direction"""
    idle_folder = EXPORT_BASE / folder_name
    
    if not idle_folder.exists():
        print(f"  [SKIP] {direction_name}: Folder not found")
        return False
    
    # Get BMP files
    bmp_files = sorted(idle_folder.glob("Mob 400*.bmp")) + sorted(idle_folder.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        print(f"  [SKIP] {direction_name}: No BMP files found")
        return False
    
    # Load first frame only (idle should be single frame)
    try:
        img = Image.open(bmp_files[0])
        img = remove_white_background(img)
        
        # Create sprite sheet with single frame
        output_path = OUTPUT_DIR / f"male_idle_{direction_name}_sheet.png"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'PNG')
        
        print(f"  [OK] {direction_name}: Created (1 frame, {img.width}x{img.height})")
        return True
    except Exception as e:
        print(f"  [ERROR] {direction_name}: {e}")
        return False

def main():
    print("="*60)
    print("Fixing All Idle Animations")
    print("Ensuring all are single frames")
    print("="*60)
    
    fixed = 0
    failed = 0
    
    for direction_name, folder_name in DIRECTIONS.items():
        print(f"\nProcessing: {direction_name}")
        if fix_idle_direction(direction_name, folder_name):
            fixed += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"Fix complete!")
    print(f"  Fixed: {fixed}/8")
    print(f"  Failed: {failed}/8")
    print("="*60)

if __name__ == "__main__":
    main()









