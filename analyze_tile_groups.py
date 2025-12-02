#!/usr/bin/env python3
"""
Analyze UO Land Tiles to understand how they group together.
Key insight: Tiles with the SAME TextureID tessellate together.
Tiles come in groups of 4 that form a seamless pattern.
"""

import csv
from collections import defaultdict

def parse_hex(s):
    """Parse hex string like '0x0003' to int"""
    if s.startswith('0x') or s.startswith('0X'):
        return int(s, 16)
    return int(s)

def analyze_tiles():
    tiles = []
    
    # Read the CSV
    with open('assets/tiles/LandData.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            tile_id = row['ID']
            name = row['Name']
            texture_id = row['TextureID']
            
            if name and name not in ['', 'NoName', 'VOID!!!!!!', 'NODRAW', 'ED']:
                tiles.append({
                    'id': tile_id,
                    'id_int': parse_hex(tile_id),
                    'name': name.lower(),
                    'texture_id': texture_id,
                    'texture_int': parse_hex(texture_id) if texture_id != '0x0000' else 0
                })
    
    # Group tiles by name
    by_name = defaultdict(list)
    for t in tiles:
        by_name[t['name']].append(t)
    
    print("=" * 60)
    print("TILE GROUPS BY NAME")
    print("=" * 60)
    
    # Find groups of 4 consecutive tiles (these tessellate)
    for name in sorted(by_name.keys()):
        tile_list = sorted(by_name[name], key=lambda x: x['id_int'])
        
        if len(tile_list) < 4:
            continue
            
        print(f"\n{name.upper()} ({len(tile_list)} tiles):")
        
        # Find consecutive groups of 4
        groups = []
        current_group = [tile_list[0]]
        
        for i in range(1, len(tile_list)):
            if tile_list[i]['id_int'] == current_group[-1]['id_int'] + 1:
                current_group.append(tile_list[i])
            else:
                if len(current_group) >= 4:
                    groups.append(current_group[:4])
                current_group = [tile_list[i]]
        
        if len(current_group) >= 4:
            groups.append(current_group[:4])
        
        for group in groups:
            ids = [t['id'] for t in group]
            tex_ids = [t['texture_id'] for t in group]
            
            # Check if texture IDs match tile IDs (self-referencing = center tile)
            is_center = all(t['id'] == t['texture_id'] for t in group)
            
            print(f"  Group: {ids[0]} - {ids[-1]}")
            print(f"    TextureIDs: {tex_ids}")
            print(f"    Type: {'CENTER (tessellating)' if is_center else 'EDGE/TRANSITION'}")

    print("\n" + "=" * 60)
    print("GENERATING JS TILE SETS")
    print("=" * 60)
    
    # Generate JavaScript tile sets
    js_output = []
    js_output.append("// Auto-generated UO Tile Sets")
    js_output.append("// Tiles in each set tessellate together perfectly")
    js_output.append("// Use ONLY tiles from the same set for a region")
    js_output.append("")
    js_output.append("export const UO_TILE_SETS = {")
    
    for name in sorted(by_name.keys()):
        tile_list = sorted(by_name[name], key=lambda x: x['id_int'])
        
        if len(tile_list) < 4:
            continue
        
        # Find consecutive groups of 4
        groups = []
        current_group = [tile_list[0]]
        
        for i in range(1, len(tile_list)):
            if tile_list[i]['id_int'] == current_group[-1]['id_int'] + 1:
                current_group.append(tile_list[i])
            else:
                if len(current_group) >= 4:
                    groups.append(current_group[:4])
                current_group = [tile_list[i]]
        
        if len(current_group) >= 4:
            groups.append(current_group[:4])
        
        if groups:
            js_output.append(f"    '{name}': [")
            for idx, group in enumerate(groups):
                ids = [f"'{t['id']}'" for t in group]
                is_center = all(t['id'] == t['texture_id'] for t in group)
                comment = "// center" if is_center else "// edge"
                js_output.append(f"        [{', '.join(ids)}], {comment}")
            js_output.append("    ],")
    
    js_output.append("};")
    js_output.append("")
    js_output.append("// Get a random tile from a specific set")
    js_output.append("export function getTileFromSet(biome, setIndex = 0, rng = Math.random) {")
    js_output.append("    const sets = UO_TILE_SETS[biome];")
    js_output.append("    if (!sets || sets.length === 0) return null;")
    js_output.append("    const set = sets[Math.min(setIndex, sets.length - 1)];")
    js_output.append("    return set[Math.floor(rng() * set.length)];")
    js_output.append("}")
    
    # Write JS file
    with open('js/data/uoTileSets.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_output))
    
    print("\nGenerated js/data/uoTileSets.js")
    
    # Now analyze which tiles are CENTER vs EDGE
    print("\n" + "=" * 60)
    print("CENTER vs EDGE TILE ANALYSIS")
    print("=" * 60)
    
    for name in ['grass', 'sand', 'dirt', 'water', 'forest', 'furrows', 'jungle', 'rock']:
        if name not in by_name:
            continue
            
        tile_list = sorted(by_name[name], key=lambda x: x['id_int'])
        
        center_tiles = []
        edge_tiles = []
        
        for t in tile_list:
            # If TextureID == ID, it's a self-referencing center tile
            if t['id'] == t['texture_id']:
                center_tiles.append(t['id'])
            elif t['texture_int'] != 0:
                edge_tiles.append(t['id'])
        
        print(f"\n{name.upper()}:")
        print(f"  Center tiles (tessellate): {len(center_tiles)}")
        if center_tiles[:12]:
            print(f"    First 12: {center_tiles[:12]}")
        print(f"  Edge/transition tiles: {len(edge_tiles)}")
        if edge_tiles[:12]:
            print(f"    First 12: {edge_tiles[:12]}")

if __name__ == '__main__':
    analyze_tiles()









