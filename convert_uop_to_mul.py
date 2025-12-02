"""
Convert UO LegacyMUL UOP files to classic MUL format
Extracts map data from map#LegacyMUL.uop files and writes map#.mul files
"""

from pathlib import Path
import struct
import zlib

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

def read_uop_file(uop_path):
    """Read UOP file and extract all entries"""
    entries = []
    
    with open(uop_path, 'rb') as f:
        # Read header
        magic = f.read(4)
        if magic != b'MYP\x00':
            raise ValueError(f"Not a valid UOP file: {uop_path}")
        
        version = struct.unpack('<I', f.read(4))[0]
        signature = struct.unpack('<I', f.read(4))[0]
        next_table = struct.unpack('<Q', f.read(8))[0]
        block_size = struct.unpack('<I', f.read(4))[0]
        file_count = struct.unpack('<I', f.read(4))[0]
        
        # Read all file entries
        while next_table != 0:
            f.seek(next_table)
            files_in_block = struct.unpack('<I', f.read(4))[0]
            next_table = struct.unpack('<Q', f.read(8))[0]
            
            for _ in range(files_in_block):
                offset = struct.unpack('<Q', f.read(8))[0]
                
                if offset == 0:
                    # Skip empty entry
                    f.seek(30, 1)
                    continue
                
                header_size = struct.unpack('<I', f.read(4))[0]
                compressed_size = struct.unpack('<I', f.read(4))[0]
                decompressed_size = struct.unpack('<I', f.read(4))[0]
                file_hash = struct.unpack('<Q', f.read(8))[0]
                crc = struct.unpack('<I', f.read(4))[0]
                compression = struct.unpack('<H', f.read(2))[0]
                
                entries.append({
                    'offset': offset + header_size,
                    'compressed_size': compressed_size,
                    'decompressed_size': decompressed_size,
                    'compression': compression
                })
    
    return entries

def extract_uop_to_mul(uop_path, output_mul_path):
    """Extract UOP file and write as MUL file"""
    print(f"Converting {uop_path.name} -> {output_mul_path.name}...")
    
    entries = read_uop_file(uop_path)
    print(f"  Found {len(entries)} entries")
    
    # Extract and concatenate all entries
    mul_data = bytearray()
    
    with open(uop_path, 'rb') as f:
        for i, entry in enumerate(entries):
            f.seek(entry['offset'])
            data = f.read(entry['compressed_size'])
            
            # Decompress if needed
            if entry['compression'] == 1:  # zlib
                try:
                    data = zlib.decompress(data)
                except Exception as e:
                    print(f"  Warning: Failed to decompress entry {i}: {e}")
                    continue
            
            # Ensure we have the expected size
            if len(data) != entry['decompressed_size']:
                print(f"  Warning: Entry {i} size mismatch: expected {entry['decompressed_size']}, got {len(data)}")
            
            mul_data.extend(data)
            
            if (i + 1) % 100 == 0:
                print(f"  Processed {i + 1}/{len(entries)} entries...")
    
    # Write MUL file
    with open(output_mul_path, 'wb') as f:
        f.write(mul_data)
    
    print(f"  ✓ Wrote {len(mul_data)} bytes to {output_mul_path.name}")
    return len(mul_data)

def main():
    """Convert all map LegacyMUL UOP files to MUL format"""
    print("Converting UO LegacyMUL UOP files to classic MUL format...\n")
    
    # Convert map files (map0LegacyMUL.uop -> map0.mul, etc.)
    for map_num in range(6):  # Maps 0-5
        uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
        
        if not uop_file.exists():
            print(f"⚠ {uop_file.name} not found, skipping...")
            continue
        
        output_file = OUTPUT_PATH / f"map{map_num}.mul"
        
        try:
            size = extract_uop_to_mul(uop_file, output_file)
            print(f"  ✓ Successfully converted map{map_num}\n")
        except Exception as e:
            print(f"  ✗ Error converting map{map_num}: {e}\n")
    
    # Also convert the "x" versions (zoomed maps) if they exist
    for map_num in range(6):
        uop_file = UO_PATH / f"map{map_num}xLegacyMUL.uop"
        
        if not uop_file.exists():
            continue
        
        output_file = OUTPUT_PATH / f"map{map_num}x.mul"
        
        try:
            extract_uop_to_mul(uop_file, output_file)
            print(f"  ✓ Successfully converted map{map_num}x\n")
        except Exception as e:
            print(f"  ✗ Error converting map{map_num}x: {e}\n")
    
    print("\n✓ Conversion complete!")
    print(f"  Output directory: {OUTPUT_PATH.absolute()}")

if __name__ == '__main__':
    main()








