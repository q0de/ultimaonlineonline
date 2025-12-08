"""
Create placeholder orc sprites by tinting existing human sprites green
"""

from PIL import Image, ImageEnhance
from pathlib import Path
import os

SOURCE_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

# Map human folders to orc folders
DIRECTION_MAP = {
    'walk_e': 'orc_walk_e',
    'walk_n': 'orc_walk_n', 
    'walk_ne': 'orc_walk_ne',
    'walk_nw': 'orc_walk_nw',
    'walk_s': 'orc_walk_s',
    'walk_se': 'orc_walk_se',
    'walk_sw': 'orc_walk_sw',
    'walk_w': 'orc_walk_w',
    'idle-static_e': 'orc_idle_e',
    'idle-static_n': 'orc_idle_n',
    'idle-static_ne': 'orc_idle_ne',
    'idle-static_nw': 'orc_idle_nw',
    'idle-static_s': 'orc_idle_s',
    'idle-static_se': 'orc_idle_se',
    'idle-static_sw': 'orc_idle_sw',
    'idle-static_w': 'orc_idle_w',
}

def tint_green(img):
    """Tint an image green to look like an orc"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a new image with green tint
    pixels = img.load()
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Apply green tint - reduce red and blue, boost green
            new_r = int(r * 0.5)  # Reduce red
            new_g = min(255, int(g * 1.3))  # Boost green
            new_b = int(b * 0.5)  # Reduce blue
            
            # Make skin tones more green
            if r > 180 and g > 150 and b > 100:  # Skin tone detection
                new_r = int(r * 0.4)
                new_g = min(255, int(g * 1.0) + 60)
                new_b = int(b * 0.4)
            
            pixels[x, y] = (new_r, new_g, new_b, a)
    
    return img

def process_folder(src_folder, dest_folder):
    """Process all images in a folder"""
    src_path = SOURCE_PATH / src_folder
    dest_path = OUTPUT_PATH / dest_folder
    
    if not src_path.exists():
        print(f"  [SKIP] Source folder not found: {src_folder}")
        return 0
    
    dest_path.mkdir(parents=True, exist_ok=True)
    
    count = 0
    for img_file in src_path.glob("*.bmp"):
        try:
            img = Image.open(img_file)
            tinted = tint_green(img)
            
            # Save as BMP with same name pattern but "Mob 7" instead of "Mob 400"
            new_name = img_file.name.replace("Mob 400", "Mob 7")
            output_file = dest_path / new_name
            
            # Convert to RGB for BMP (no alpha)
            if tinted.mode == 'RGBA':
                # Create white background
                background = Image.new('RGB', tinted.size, (0, 0, 0))
                background.paste(tinted, mask=tinted.split()[3])  # Use alpha as mask
                tinted = background
            
            tinted.save(output_file, "BMP")
            count += 1
            
        except Exception as e:
            print(f"    [ERROR] {img_file.name}: {e}")
    
    return count

def main():
    print("=" * 50)
    print("Creating Placeholder Orc Sprites")
    print("(Green-tinted human sprites)")
    print("=" * 50)
    
    total = 0
    for src, dest in DIRECTION_MAP.items():
        print(f"\nProcessing {src} -> {dest}...")
        count = process_folder(src, dest)
        if count > 0:
            print(f"  ✓ Created {count} orc sprites")
            total += count
    
    print("\n" + "=" * 50)
    print(f"Done! Created {total} placeholder orc sprites")
    print("=" * 50)

if __name__ == "__main__":
    main()



