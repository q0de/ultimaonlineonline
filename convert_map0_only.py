"""
Convert ONLY map0LegacyMUL.uop to map0.mul (for testing)
This is faster than converting all maps at once
"""

from pathlib import Path
import struct
import zlib

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

def convert_map(map_num=0):
    """Convert a single map file"""
    uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
    output_file = OUTPUT_PATH / f"map{map_num}.mul"
    
    if not uop_file.exists():
        print(f"❌ {uop_file.name} not found!")
        return False
    
    print(f"📖 Reading {uop_file.name}...")
    
    entries = []
    with open(uop_file, 'rb') as f:
        magic = f.read(4)
        if magic != b'MYP\x00':
            raise ValueError(f"Not a valid UOP file: {uop_file}")
        
        version = struct.unpack('<I', f.read(4))[0]
        signature = struct.unpack('<I', f.read(4))[0]
        next_table = struct.unpack('<Q', f.read(8))[0]
        block_size = struct.unpack('<I', f.read(4))[0]
        file_count = struct.unpack('<I', f.read(4))[0]
        
        print(f"   Found {file_count} file entries in UOP")
        
        while next_table != 0:
            f.seek(next_table)
            files_in_block = struct.unpack('<I', f.read(4))[0]
            next_table = struct.unpack('<Q', f.read(8))[0]
            
            for _ in range(files_in_block):
                offset = struct.unpack('<Q', f.read(8))[0]
                if offset == 0:
                    f.seek(30, 1)
                    continue
                
                header_size = struct.unpack('<I', f.read(4))[0]
                comp_size = struct.unpack('<I', f.read(4))[0]
                decomp_size = struct.unpack('<I', f.read(4))[0]
                file_hash = struct.unpack('<Q', f.read(8))[0]
                crc = struct.unpack('<I', f.read(4))[0]
                compression = struct.unpack('<H', f.read(2))[0]
                
                entries.append({
                    'offset': offset + header_size,
                    'compressed_size': comp_size,
                    'decompressed_size': decomp_size,
                    'compression': compression
                })
    
    print(f"📦 Extracting {len(entries)} entries...")
    
    mul_data = bytearray()
    with open(uop_file, 'rb') as f:
        for i, entry in enumerate(entries):
            f.seek(entry['offset'])
            data = f.read(entry['compressed_size'])
            
            if entry['compression'] == 1:
                data = zlib.decompress(data)
            
            mul_data.extend(data)
            
            if (i + 1) % 50 == 0:
                print(f"   Progress: {i + 1}/{len(entries)} entries ({len(mul_data) / 1024 / 1024:.1f} MB)")
    
    print(f"💾 Writing {output_file.name} ({len(mul_data) / 1024 / 1024:.1f} MB)...")
    with open(output_file, 'wb') as f:
        f.write(mul_data)
    
    print(f"✅ Success! Created {output_file.name}")
    return True

if __name__ == '__main__':
    print("Converting map0LegacyMUL.uop to map0.mul...\n")
    success = convert_map(0)
    if success:
        print(f"\n✅ Done! File saved to: {OUTPUT_PATH.absolute() / 'map0.mul'}")
    else:
        print("\n❌ Conversion failed!")








