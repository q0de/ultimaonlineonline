"""
Simple converter - just map0, extracts all data blocks sequentially
"""
from pathlib import Path
import struct
import zlib

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

uop_file = UO_PATH / 'map0LegacyMUL.uop'
output_file = OUTPUT_PATH / 'map0.mul'

print(f"Converting {uop_file.name}...")
print(f"Output: {output_file}")

if not uop_file.exists():
    print(f"❌ File not found!")
    exit(1)

print(f"✅ File exists ({uop_file.stat().st_size / 1024 / 1024:.1f} MB)")

try:
    entries = []
    with open(uop_file, 'rb') as f:
        # Read header
        magic = f.read(4)
        if magic != b'MYP\x00':
            print(f"❌ Invalid magic: {magic}")
            exit(1)
        
        version = struct.unpack('<I', f.read(4))[0]
        format_timestamp = struct.unpack('<I', f.read(4))[0]
        next_block = struct.unpack('<Q', f.read(8))[0]
        block_size = struct.unpack('<I', f.read(4))[0]
        count = struct.unpack('<i', f.read(4))[0]
        
        print(f"Version: {version}, Count: {count}, First block: {next_block}")
        
        # Read all blocks
        while next_block != 0:
            f.seek(next_block)
            files_count = struct.unpack('<i', f.read(4))[0]
            next_block = struct.unpack('<q', f.read(8))[0]
            
            print(f"  Block at {f.tell()-8}: {files_count} files, next: {next_block}")
            
            for i in range(files_count):
                offset = struct.unpack('<q', f.read(8))[0]
                header_length = struct.unpack('<i', f.read(4))[0]
                compressed_length = struct.unpack('<i', f.read(4))[0]
                decompressed_length = struct.unpack('<i', f.read(4))[0]
                file_hash = struct.unpack('<Q', f.read(8))[0]
                data_hash = struct.unpack('<I', f.read(4))[0]
                flag = struct.unpack('<h', f.read(2))[0]
                
                if offset == 0:
                    continue
                
                entries.append({
                    'offset': offset + header_length,
                    'compressed': compressed_length,
                    'decompressed': decompressed_length,
                    'flag': flag
                })
    
    print(f"\n✅ Found {len(entries)} entries")
    print(f"Extracting data...")
    
    # Sort by offset to ensure sequential order
    entries.sort(key=lambda x: x['offset'])
    
    mul_data = bytearray()
    with open(uop_file, 'rb') as f:
        for i, entry in enumerate(entries):
            f.seek(entry['offset'])
            data = f.read(entry['compressed'])
            
            # Decompress if needed (flag 1 = zlib)
            if entry['flag'] == 1:
                data = zlib.decompress(data)
            elif entry['flag'] == 3:  # zlib+bwt (not handling BWT for now)
                try:
                    data = zlib.decompress(data)
                except:
                    print(f"  Warning: Entry {i} uses BWT compression, skipping")
                    continue
            
            mul_data.extend(data)
            
            if (i + 1) % 50 == 0:
                mb = len(mul_data) / 1024 / 1024
                print(f"  [{i+1}/{len(entries)}] {mb:.1f} MB", end='\r')
    
    print(f"\n✅ Extracted {len(mul_data) / 1024 / 1024:.1f} MB")
    print(f"Writing {output_file.name}...")
    
    with open(output_file, 'wb') as f:
        f.write(mul_data)
    
    print(f"✅ Success! Created {output_file.name}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()








