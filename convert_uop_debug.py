"""
Debug version - shows exactly what's happening
"""

from pathlib import Path
import struct
import zlib

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

print(f"Looking for UOP files in: {UO_PATH.absolute()}")
print(f"Output will go to: {OUTPUT_PATH.absolute()}\n")

# Check if path exists
if not UO_PATH.exists():
    print(f"❌ ERROR: {UO_PATH.absolute()} does not exist!")
    exit(1)

print(f"✅ Path exists\n")

# Check for map files
for map_num in range(6):
    uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
    print(f"Checking map{map_num}...")
    print(f"  Path: {uop_file.absolute()}")
    print(f"  Exists: {uop_file.exists()}")
    
    if uop_file.exists():
        size_mb = uop_file.stat().st_size / 1024 / 1024
        print(f"  Size: {size_mb:.1f} MB")
        
        # Try to read header
        try:
            with open(uop_file, 'rb') as f:
                magic = f.read(4)
                print(f"  Magic: {magic} ({'✅ Valid UOP' if magic == b'MYP\x00' else '❌ Invalid'})")
        except Exception as e:
            print(f"  ❌ Error reading: {e}")
    print()

# Now try to convert map0
print("="*60)
print("Attempting to convert map0...")
print("="*60)

uop_file = UO_PATH / "map0LegacyMUL.uop"
output_file = OUTPUT_PATH / "map0.mul"

if not uop_file.exists():
    print(f"❌ {uop_file} not found!")
    exit(1)

try:
    print(f"Reading {uop_file.name}...")
    with open(uop_file, 'rb') as f:
        magic = f.read(4)
        if magic != b'MYP\x00':
            raise ValueError(f"Invalid magic: {magic}")
        
        version = struct.unpack('<I', f.read(4))[0]
        signature = struct.unpack('<I', f.read(4))[0]
        next_table = struct.unpack('<Q', f.read(8))[0]
        block_size = struct.unpack('<I', f.read(4))[0]
        file_count = struct.unpack('<I', f.read(4))[0]
        
        print(f"  Version: {version}")
        print(f"  File count: {file_count}")
        print(f"  First table offset: {next_table}")
        
        entries = []
        table_num = 0
        while next_table != 0:
            f.seek(next_table)
            files_in_block = struct.unpack('<I', f.read(4))[0]
            next_table = struct.unpack('<Q', f.read(8))[0]
            
            print(f"  Table {table_num}: {files_in_block} files, next_table={next_table}")
            
            for i in range(files_in_block):
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
            
            table_num += 1
            if table_num > 10:  # Safety limit
                break
        
        print(f"\n✅ Found {len(entries)} entries")
        print(f"Extracting data...")
        
        mul_data = bytearray()
        with open(uop_file, 'rb') as f:
            for i, entry in enumerate(entries[:10]):  # Just first 10 for testing
                f.seek(entry['offset'])
                data = f.read(entry['compressed_size'])
                
                if entry['compression'] == 1:
                    data = zlib.decompress(data)
                
                mul_data.extend(data)
                print(f"  Entry {i+1}: {len(data)} bytes")
        
        print(f"\n✅ Extracted {len(mul_data)} bytes (first 10 entries)")
        print(f"Full conversion would process all {len(entries)} entries")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()











