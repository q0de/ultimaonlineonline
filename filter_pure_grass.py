"""
Filter PURE_GRASS_TILES to ensure they don't contain dirt/brown pixels at the edges.
"""

from PIL import Image
import os
import re

# Helper to check pixel color
def is_dirt(r, g, b):
    # Dirt/Brown: R > G, R > B, usually R > 60
    return r > 60 and r > g * 1.1 and r > b * 1.2 and g < r and g > b

def is_green(r, g, b):
    # Green dominant
    return g > r and g > b and g > 30

def analyze_edges_for_dirt(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        width, height = img.size
        
        # Sample random points in the tile, not just edges, 
        # because the screenshot showed the dirt pattern crossing the middle.
        # But let's focus on the 4 corners of the diamond first.
        
        dirt_pixels = 0
        green_pixels = 0
        total_sampled = 0
        
        # Scan central diamond area roughly
        for y in range(10, 34):
            for x in range(10, 34):
                r, g, b = img.getpixel((x, y))
                
                # Ignore black/transparent
                if r < 15 and g < 15 and b < 15:
                    continue
                    
                total_sampled += 1
                if is_dirt(r, g, b):
                    dirt_pixels += 1
                elif is_green(r, g, b):
                    green_pixels += 1
                    
        if total_sampled == 0: return False
        
        # If significant dirt content (> 15%), it's not pure grass
        return dirt_pixels > total_sampled * 0.15

    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return False

def main():
    # Read current grassTileMapping.js
    with open('js/data/grassTileMapping.js', 'r') as f:
        content = f.read()
        
    # Extract IDs
    ids = re.findall(r"'0x[0-9A-F]+'", content)
    ids = [i.strip("'") for i in ids]
    
    print(f"Scanning {len(ids)} 'Pure' Grass tiles for dirt...")
    
    clean_grass = []
    dirty_grass = []
    
    for tile_id in ids:
        path = f"assets/tiles/{tile_id}.bmp"
        if os.path.exists(path):
            has_dirt = analyze_edges_for_dirt(path)
            if has_dirt:
                dirty_grass.append(tile_id)
                print(f"DIRTY: {tile_id}")
            else:
                clean_grass.append(tile_id)
        else:
            print(f"Missing: {path}")
            
    print(f"\nResults: {len(clean_grass)} clean, {len(dirty_grass)} dirty.")
    
    # Write new file
    with open('js/data/grassTileMapping_FIXED.js', 'w') as f:
        f.write("export const PURE_GRASS_TILES = [\n")
        
        # Write clean tiles in chunks of 4
        for i in range(0, len(clean_grass), 4):
            chunk = clean_grass[i:i+4]
            quoted = [f"'{t}'" for t in chunk]
            f.write(f"    {', '.join(quoted)},\n")
            
        f.write("];\n\n")
        f.write("export function getPureGrassTile(rng = Math.random) {\n")
        f.write("    return PURE_GRASS_TILES[Math.floor(rng() * PURE_GRASS_TILES.length)];\n")
        f.write("}\n")
        
    print("Wrote js/data/grassTileMapping_FIXED.js")

if __name__ == '__main__':
    main()












