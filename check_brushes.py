"""
Check specific grass brush tiles for dirt content.
"""
from PIL import Image
import os

def is_dirt(r, g, b):
    return r > 60 and r > g * 1.1 and r > b * 1.2 and g < r and g > b

def analyze(tile_id):
    path = f"assets/tiles/{tile_id}.bmp"
    if not os.path.exists(path):
        print(f"{tile_id}: Missing")
        return
        
    img = Image.open(path).convert('RGB')
    dirt_pixels = 0
    total = 0
    for y in range(10, 34):
        for x in range(10, 34):
            r, g, b = img.getpixel((x, y))
            if r < 15 and g < 15 and b < 15: continue
            total += 1
            if is_dirt(r, g, b):
                dirt_pixels += 1
                
    percent = (dirt_pixels / total) * 100 if total > 0 else 0
    print(f"{tile_id}: {percent:.1f}% dirt")

ids = [
    # Grass Brush 2
    '0x0231', '0x0232', '0x0233', '0x0234',
    # Grass Brush 3
    '0x036F', '0x0370', '0x0371', '0x0372'
]

print("Scanning Brush Tiles...")
for i in ids:
    analyze(i)












