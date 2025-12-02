"""
Fixed UOP to MUL Converter - Uses absolute paths
Run: python convert_maps_fixed.py
"""

from pathlib import Path
import struct
import zlib
import os

# Use absolute paths to avoid any path issues
SCRIPT_DIR = Path(__file__).parent.absolute()
UO_PATH = SCRIPT_DIR / 'Ultima Online Classic'
OUTPUT_PATH = SCRIPT_DIR / 'assets' / 'mul'
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

print(f"Script directory: {SCRIPT_DIR}")
print(f"UO Path: {UO_PATH}")
print(f"Output Path: {OUTPUT_PATH}")
print(f"UO Path exists: {UO_PATH.exists()}\n")

if not UO_PATH.exists():
    print(f"❌ ERROR: Cannot find '{UO_PATH}'")
    print(f"   Make sure 'Ultima Online Classic' folder is in the project root")
    exit(1)

def convert_map(map_num):
    """Convert one map file"""
    uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
    output_file = OUTPUT_PATH / f"map{map_num}.mul"
    
    print(f"\n{'='*70}")
    print(f"Map {map_num}: {uop_file.name}")
    print(f"{'='*70}")
    
    if not uop_file.exists():
        print(f"❌ File not found: {uop_file}")
        return False
    
    file_size_mb = uop_file.stat().st_size / 1024 / 1024
    print(f"✅ File found ({file_size_mb:.1f} MB)")
    
    try:
        entries = []
        with open(uop_file, 'rb') as f:
            magic = f.read(4)
            if magic != b'MYP\x00':
                print(f"❌ Invalid UOP magic: {magic}")
                return False
            
            version = struct.unpack('<I', f.read(4))[0]
            signature = struct.unpack('<I', f.read(4))[0]
            next_table = struct.unpack('<Q', f.read(8))[0]
            block_size = struct.unpack('<I', f.read(4))[0]
            file_count = struct.unpack('<I', f.read(4))[0]
            
            print(f"   UOP Version: {version}, File count: {file_count}")
            
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
                    f.read(8)  # file_hash
                    f.read(4)  # crc
                    compression = struct.unpack('<H', f.read(2))[0]
                    
                    entries.append({
                        'offset': offset + header_size,
                        'compressed_size': comp_size,
                        'decompressed_size': decomp_size,
                        'compression': compression
                    })
        
        print(f"   Found {len(entries)} entries")
        print(f"   Extracting and decompressing...")
        
        mul_data = bytearray()
        with open(uop_file, 'rb') as f:
            for i, entry in enumerate(entries):
                f.seek(entry['offset'])
                data = f.read(entry['compressed_size'])
                
                if entry['compression'] == 1:
                    data = zlib.decompress(data)
                
                mul_data.extend(data)
                
                if (i + 1) % 100 == 0 or (i + 1) == len(entries):
                    mb = len(mul_data) / 1024 / 1024
                    pct = ((i + 1) / len(entries)) * 100
                    print(f"   [{pct:5.1f}%] {i + 1}/{len(entries)} entries ({mb:.1f} MB)", end='\r')
        
        print()  # New line
        
        print(f"   Writing {len(mul_data) / 1024 / 1024:.1f} MB to {output_file.name}...")
        with open(output_file, 'wb') as f:
            f.write(mul_data)
        
        print(f"✅ Successfully created {output_file.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Convert all maps
print("="*70)
print("UO LegacyMUL UOP to MUL Converter")
print("="*70)

success_count = 0
for map_num in range(6):
    if convert_map(map_num):
        success_count += 1

print(f"\n{'='*70}")
print(f"Conversion Summary: {success_count}/6 maps converted")
print(f"Output directory: {OUTPUT_PATH}")
print(f"{'='*70}")

if success_count > 0:
    print("\n✅ Conversion complete! You can now use these map files.")
else:
    print("\n❌ No maps were converted. Check the errors above.")



