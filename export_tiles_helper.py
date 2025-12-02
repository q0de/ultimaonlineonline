"""
Helper script to prepare for tile export from UOFiddler
Reads LandData.csv and generates a list of all tile IDs that need to be exported
"""

import csv
import os
from pathlib import Path

def get_tile_ids_from_csv(csv_path):
    """Extract all tile IDs from the CSV file"""
    tile_ids = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            tile_id = row.get('ID', '').strip()
            tile_name = row.get('Name', '').strip()
            
            # Skip empty IDs and special tiles
            if not tile_id or tile_id == '0x0000':
                continue
            
            # Skip void and nodraw
            if tile_name.upper() in ['VOID!!!!!!', 'NODRAW', 'ED']:
                continue
            
            # Skip empty names
            if not tile_name or tile_name == '':
                continue
            
            tile_ids.append({
                'id': tile_id,
                'name': tile_name,
                'id_num': int(tile_id, 16) if tile_id.startswith('0x') else int(tile_id)
            })
    
    # Sort by ID number
    tile_ids.sort(key=lambda x: x['id_num'])
    
    return tile_ids

def generate_export_guide(csv_path, output_dir):
    """Generate a guide and list of tiles to export"""
    
    print("=" * 60)
    print("UO TILE EXPORT HELPER")
    print("=" * 60)
    
    tile_ids = get_tile_ids_from_csv(csv_path)
    
    print(f"\nFound {len(tile_ids)} tiles to export")
    print(f"\nOutput directory: {output_dir}")
    
    # Group by name for easier viewing
    tiles_by_name = {}
    for tile in tile_ids:
        name = tile['name'].lower()
        if name not in tiles_by_name:
            tiles_by_name[name] = []
        tiles_by_name[name].append(tile)
    
    print(f"\nTiles grouped by type:")
    for name, tiles in sorted(tiles_by_name.items()):
        print(f"  {name}: {len(tiles)} tiles")
    
    # Generate ID list file
    id_list_path = Path(output_dir) / 'tile_ids_to_export.txt'
    with open(id_list_path, 'w') as f:
        f.write("Tile IDs to export from UOFiddler:\n")
        f.write("=" * 60 + "\n\n")
        f.write("Copy these IDs and use them in UOFiddler's export function\n\n")
        
        for tile in tile_ids:
            f.write(f"{tile['id']} - {tile['name']}\n")
    
    print(f"\n[OK] Generated tile ID list: {id_list_path}")
    
    # Generate range file (for batch export)
    ranges = []
    current_range_start = None
    current_range_end = None
    
    for i, tile in enumerate(tile_ids):
        if current_range_start is None:
            current_range_start = tile['id_num']
            current_range_end = tile['id_num']
        elif tile['id_num'] == current_range_end + 1:
            current_range_end = tile['id_num']
        else:
            ranges.append((current_range_start, current_range_end))
            current_range_start = tile['id_num']
            current_range_end = tile['id_num']
    
    if current_range_start is not None:
        ranges.append((current_range_start, current_range_end))
    
    range_file_path = Path(output_dir) / 'tile_id_ranges.txt'
    with open(range_file_path, 'w') as f:
        f.write("Tile ID Ranges for Batch Export:\n")
        f.write("=" * 60 + "\n\n")
        f.write("Use these ranges in UOFiddler to export multiple tiles at once\n\n")
        
        for start, end in ranges:
            if start == end:
                f.write(f"0x{start:04X}\n")
            else:
                f.write(f"0x{start:04X} - 0x{end:04X}\n")
    
    print(f"[OK] Generated tile ID ranges: {range_file_path}")
    
    # Generate UOFiddler export instructions
    instructions_path = Path(output_dir) / 'EXPORT_INSTRUCTIONS.txt'
    with open(instructions_path, 'w', encoding='utf-8') as f:
        f.write("HOW TO EXPORT TILES FROM UOFIDDLER\n")
        f.write("=" * 60 + "\n\n")
        f.write("METHOD 1: Export All Selected Tiles\n")
        f.write("-" * 60 + "\n")
        f.write("1. Open UOFiddler\n")
        f.write("2. Go to 'LandTiles' tab\n")
        f.write("3. Press Ctrl+A to select all tiles\n")
        f.write("4. Right-click → Export → Export to BMP\n")
        f.write("5. Choose destination: assets/tiles/\n")
        f.write("6. UOFiddler will export each tile as '0xXXXX.bmp'\n\n")
        f.write("METHOD 2: Export Specific Range\n")
        f.write("-" * 60 + "\n")
        f.write("1. Open UOFiddler → LandTiles tab\n")
        f.write("2. Use the ID ranges from 'tile_id_ranges.txt'\n")
        f.write("3. Select tiles in that range\n")
        f.write("4. Right-click → Export → Export Selected\n")
        f.write("5. Save to assets/tiles/\n\n")
        f.write("METHOD 3: Export by Type\n")
        f.write("-" * 60 + "\n")
        f.write("1. Use 'tile_ids_to_export.txt' to find tiles by name\n")
        f.write("2. Search for tiles (e.g., 'grass', 'sand')\n")
        f.write("3. Select all tiles of that type\n")
        f.write("4. Export to assets/tiles/\n\n")
        f.write("EXPECTED OUTPUT:\n")
        f.write("-" * 60 + "\n")
        f.write("After export, you should have files like:\n")
        f.write("  assets/tiles/0x0003.bmp (grass)\n")
        f.write("  assets/tiles/0x0004.bmp (grass)\n")
        f.write("  assets/tiles/0x0016.bmp (sand)\n")
        f.write("  ... etc\n\n")
        f.write(f"Total tiles to export: {len(tile_ids)}\n")
    
    print(f"[OK] Generated export instructions: {instructions_path}")
    
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Open UOFiddler")
    print("2. Go to LandTiles tab")
    print("3. Press Ctrl+A to select all tiles")
    print("4. Right-click -> Export -> Export to BMP")
    print(f"5. Save to: {os.path.abspath(output_dir)}")
    print("6. Run this script again to verify all tiles are exported")
    print("=" * 60)

if __name__ == '__main__':
    csv_path = Path('assets/tiles/LandData.csv')
    output_dir = Path('assets/tiles')
    
    if not csv_path.exists():
        print(f"[ERROR] CSV file not found at {csv_path}")
        print("Please make sure LandData.csv is in assets/tiles/")
        exit(1)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generate_export_guide(csv_path, output_dir)

