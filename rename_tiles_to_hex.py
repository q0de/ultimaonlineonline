"""
Rename exported UOFiddler tiles from "Landtile X.bmp" to "0xXXXX.bmp" format
This matches the tile IDs in the CSV file
"""

import os
from pathlib import Path
import csv

def rename_tiles_to_hex(tiles_dir):
    """Rename tiles from Landtile X.bmp to 0xXXXX.bmp"""
    
    tiles_path = Path(tiles_dir)
    csv_path = tiles_path / 'LandData.csv'
    
    if not csv_path.exists():
        print(f"[ERROR] LandData.csv not found at {csv_path}")
        return
    
    # Read CSV to get ID mapping
    id_map = {}  # Maps numeric ID to hex ID
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            hex_id = row.get('ID', '').strip()
            if hex_id and hex_id.startswith('0x'):
                numeric_id = int(hex_id, 16)
                id_map[numeric_id] = hex_id
    
    print(f"Loaded {len(id_map)} tile IDs from CSV")
    
    # Find all Landtile X.bmp files
    tile_files = list(tiles_path.glob('Landtile *.bmp'))
    print(f"Found {len(tile_files)} Landtile files to rename")
    
    renamed_count = 0
    skipped_count = 0
    
    for tile_file in tile_files:
        # Extract numeric ID from filename (e.g., "Landtile 123.bmp" -> 123)
        try:
            numeric_id = int(tile_file.stem.replace('Landtile ', ''))
            
            if numeric_id in id_map:
                hex_id = id_map[numeric_id]
                new_name = f"{hex_id}.bmp"
                new_path = tiles_path / new_name
                
                # Skip if already exists
                if new_path.exists():
                    print(f"  Skipping {tile_file.name} -> {new_name} (already exists)")
                    skipped_count += 1
                else:
                    tile_file.rename(new_path)
                    renamed_count += 1
                    if renamed_count % 100 == 0:
                        print(f"  Renamed {renamed_count} files...")
            else:
                print(f"  Warning: No hex ID found for numeric ID {numeric_id}")
                skipped_count += 1
        except ValueError:
            print(f"  Warning: Could not parse numeric ID from {tile_file.name}")
            skipped_count += 1
    
    print(f"\n[OK] Renamed {renamed_count} files")
    print(f"[OK] Skipped {skipped_count} files")
    print(f"\nTiles are now named by hex ID (e.g., 0x0003.bmp)")

if __name__ == '__main__':
    tiles_dir = Path('assets/tiles')
    rename_tiles_to_hex(tiles_dir)



