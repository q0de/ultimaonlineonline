"""
Analyze embank tiles to determine which edges have water.
UO tiles are diamond-shaped (44x44 pixels typically).
Water appears as blue pixels, grass as green.

In a diamond tile:
- North = top point (center-top area)
- East = right point (center-right area)
- South = bottom point (center-bottom area)  
- West = left point (center-left area)
"""

from PIL import Image
import os
import glob

def is_water_color(r, g, b):
    """Check if pixel color is water-like (blue tones)"""
    # Water in UO is typically blue
    return b > 100 and b > r * 1.5 and b > g * 1.2

def is_grass_color(r, g, b):
    """Check if pixel color is grass-like (green tones)"""
    return g > 80 and g > r * 1.2 and g > b * 1.2

def analyze_tile(image_path):
    """
    Analyze a tile image to determine which edges have water.
    Returns bitmask: N=1, E=2, S=4, W=8
    """
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        width, height = img.size
        
        # Define edge regions for a diamond tile
        # For a 44x44 tile, the diamond points are at:
        # North: (22, 0) - top center
        # East: (43, 22) - right center
        # South: (22, 43) - bottom center
        # West: (0, 22) - left center
        
        cx, cy = width // 2, height // 2
        
        # Sample regions for each direction
        # North region: top third, center band
        north_region = [(x, y) for x in range(cx-8, cx+8) for y in range(0, height//4)]
        # East region: right third, center band
        east_region = [(x, y) for x in range(3*width//4, width) for y in range(cy-8, cy+8)]
        # South region: bottom third, center band
        south_region = [(x, y) for x in range(cx-8, cx+8) for y in range(3*height//4, height)]
        # West region: left third, center band
        west_region = [(x, y) for x in range(0, width//4) for y in range(cy-8, cy+8)]
        
        def count_water_in_region(region):
            water_count = 0
            total = 0
            for x, y in region:
                if 0 <= x < width and 0 <= y < height:
                    r, g, b = img.getpixel((x, y))
                    # Skip black (transparent) pixels
                    if r < 10 and g < 10 and b < 10:
                        continue
                    total += 1
                    if is_water_color(r, g, b):
                        water_count += 1
            return water_count, total
        
        # Count water in each region
        n_water, n_total = count_water_in_region(north_region)
        e_water, e_total = count_water_in_region(east_region)
        s_water, s_total = count_water_in_region(south_region)
        w_water, w_total = count_water_in_region(west_region)
        
        # Determine if each edge has water (threshold: 30% of non-black pixels)
        threshold = 0.3
        bitmask = 0
        edges = []
        
        if n_total > 0 and n_water / n_total > threshold:
            bitmask |= 1
            edges.append('N')
        if e_total > 0 and e_water / e_total > threshold:
            bitmask |= 2
            edges.append('E')
        if s_total > 0 and s_water / s_total > threshold:
            bitmask |= 4
            edges.append('S')
        if w_total > 0 and w_water / w_total > threshold:
            bitmask |= 8
            edges.append('W')
        
        return {
            'bitmask': bitmask,
            'edges': edges,
            'details': {
                'north': f"{n_water}/{n_total}",
                'east': f"{e_water}/{e_total}",
                'south': f"{s_water}/{s_total}",
                'west': f"{w_water}/{w_total}"
            }
        }
        
    except Exception as e:
        return {'error': str(e)}

def analyze_grass_coverage(image_path):
    """
    Analyze WHERE the grass content is in the tile.
    Embank tiles have grass on certain sides - the sides WITHOUT grass
    are where water would be (rendered as black/transparent).
    """
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        width, height = img.size
        
        # Divide tile into quadrants (for corner detection)
        # And also edge strips
        def is_content(r, g, b):
            """Check if pixel has actual content (not black/transparent)"""
            return not (r < 20 and g < 20 and b < 20)
        
        # Check the 4 corners of the diamond more precisely
        # North corner: top center area
        # East corner: right center area
        # South corner: bottom center area
        # West corner: left center area
        
        corner_regions = {
            'N': [(x, y) for x in range(width//2-5, width//2+5) for y in range(3, 12)],
            'E': [(x, y) for x in range(width-12, width-3) for y in range(height//2-5, height//2+5)],
            'S': [(x, y) for x in range(width//2-5, width//2+5) for y in range(height-12, height-3)],
            'W': [(x, y) for x in range(3, 12) for y in range(height//2-5, height//2+5)]
        }
        
        results = {}
        for corner, region in corner_regions.items():
            content_count = 0
            black_count = 0
            for x, y in region:
                if 0 <= x < width and 0 <= y < height:
                    r, g, b = img.getpixel((x, y))
                    if is_content(r, g, b):
                        content_count += 1
                    else:
                        black_count += 1
            total = content_count + black_count
            content_pct = content_count / total * 100 if total > 0 else 0
            results[corner] = {'content': content_count, 'black': black_count, 'pct': content_pct}
        
        return results
    except Exception as e:
        return {'error': str(e)}

def main():
    tiles_dir = 'assets/tiles'
    
    # Embank tile IDs
    embank_ids = [
        '0x098C', '0x098D', '0x098E', '0x098F',
        '0x0990', '0x0991', '0x0992', '0x0993',
        '0x0994', '0x0995', '0x0996', '0x0997',
        '0x0998', '0x0999', '0x099A', '0x099B',
        '0x099C', '0x099D', '0x099E', '0x099F',
        '0x09AC', '0x09AD', '0x09AE', '0x09AF',
        '0x09B0', '0x09B1', '0x09B2', '0x09B3',
        '0x09B4', '0x09B5', '0x09B6', '0x09B7',
        '0x09B8', '0x09B9', '0x09BA', '0x09BB',
        '0x09BC', '0x09BD', '0x09BE', '0x09BF'
    ]
    
    print("\n=== ASYMMETRY ANALYSIS ===")
    print("Looking for ASYMMETRY in tiles (grass density difference between sides)")
    print("The side with LOWER density = water side\n")
    
    mapping = {}
    
    for tile_id in embank_ids:
        image_path = os.path.join(tiles_dir, f"{tile_id}.bmp")
        if os.path.exists(image_path):
            result = analyze_grass_coverage(image_path)
            if 'error' not in result:
                # Get percentages
                n_pct = result['N']['pct']
                e_pct = result['E']['pct']
                s_pct = result['S']['pct']
                w_pct = result['W']['pct']
                
                avg = (n_pct + e_pct + s_pct + w_pct) / 4
                
                # Find which sides are SIGNIFICANTLY lower than average (water side)
                threshold = 8  # Must be 8% below average
                water_sides = []
                bitmask = 0
                
                if n_pct < avg - threshold:
                    water_sides.append('N')
                    bitmask |= 1
                if e_pct < avg - threshold:
                    water_sides.append('E')
                    bitmask |= 2
                if s_pct < avg - threshold:
                    water_sides.append('S')
                    bitmask |= 4
                if w_pct < avg - threshold:
                    water_sides.append('W')
                    bitmask |= 8
                
                water_str = '+'.join(water_sides) if water_sides else 'center'
                stats = f"N:{n_pct:4.0f}% E:{e_pct:4.0f}% S:{s_pct:4.0f}% W:{w_pct:4.0f}% avg:{avg:4.0f}%"
                print(f"{tile_id}: bitmask={bitmask:2d} [{water_str:10s}] ({stats})")
                
                if bitmask not in mapping:
                    mapping[bitmask] = []
                mapping[bitmask].append(tile_id)
    
    print("\n" + "=" * 60)
    print("CORRECTED EMBANK_TILE_MAPPING based on asymmetry:")
    print("=" * 60)
    for bitmask in sorted(mapping.keys()):
        tiles = mapping[bitmask]
        edges = []
        if bitmask & 1: edges.append('N')
        if bitmask & 2: edges.append('E')
        if bitmask & 4: edges.append('S')
        if bitmask & 8: edges.append('W')
        edge_str = '+'.join(edges) if edges else 'NONE/CENTER'
        tiles_str = ', '.join([f"'{t}'" for t in tiles])
        print(f"    {bitmask}: [{tiles_str}],  // Water on: {edge_str}")
    
    # Group results by bitmask
    by_bitmask = {}
    
    print("Analyzing embank tiles...")
    print("=" * 60)
    
    for tile_id in embank_ids:
        image_path = os.path.join(tiles_dir, f"{tile_id}.bmp")
        if os.path.exists(image_path):
            result = analyze_tile(image_path)
            if 'error' not in result:
                bitmask = result['bitmask']
                edges = ','.join(result['edges']) if result['edges'] else 'NONE'
                print(f"{tile_id}: bitmask={bitmask:2d} edges=[{edges:8s}] {result['details']}")
                
                if bitmask not in by_bitmask:
                    by_bitmask[bitmask] = []
                by_bitmask[bitmask].append(tile_id)
            else:
                print(f"{tile_id}: ERROR - {result['error']}")
        else:
            print(f"{tile_id}: FILE NOT FOUND")
    
    print("\n" + "=" * 60)
    print("GROUPED BY BITMASK (for embankTileMapping.js):")
    print("=" * 60)
    
    for bitmask in sorted(by_bitmask.keys()):
        tiles = by_bitmask[bitmask]
        edges = []
        if bitmask & 1: edges.append('N')
        if bitmask & 2: edges.append('E')
        if bitmask & 4: edges.append('S')
        if bitmask & 8: edges.append('W')
        edge_str = '+'.join(edges) if edges else 'NONE'
        tiles_str = ', '.join([f"'{t}'" for t in tiles])
        print(f"  {bitmask}: [{tiles_str}], // Water on: {edge_str}")

if __name__ == '__main__':
    main()

