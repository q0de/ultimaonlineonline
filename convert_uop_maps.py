"""
Simple UOP to MUL Converter
Converts map#LegacyMUL.uop files to map#.mul format
Run this manually: python convert_uop_maps.py
"""

from pathlib import Path
import struct
import zlib
import sys

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

def convert_single_map(map_num):
    """Convert one map file"""
    uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
    output_file = OUTPUT_PATH / f"map{map_num}.mul"
    
    if not uop_file.exists():
        print(f"❌ {uop_file.name} not found, skipping...")
        return False
    
    print(f"\n{'='*60}")
    print(f"Converting map{map_num}...")
    print(f"  Input:  {uop_file}")
    print(f"  Output: {output_file}")
    print(f"{'='*60}")
    
    try:
        # Read UOP structure
        with open(uop_file, 'rb') as f:
            magic = f.read(4)
            if magic != b'MYP\x00':
                raise ValueError("Not a valid UOP file")
            
            f.read(4)  # version
            f.read(4)  # signature
            next_table = struct.unpack('<Q', f.read(8))[0]
            f.read(4)  # block_size
            file_count = struct.unpack('<I', f.read(4))[0]
            
            entries = []
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
        
        print(f"Found {len(entries)} entries in UOP file")
        
        # Extract and combine all entries
        mul_data = bytearray()
        with open(uop_file, 'rb') as f:
            for i, entry in enumerate(entries):
                f.seek(entry['offset'])
                data = f.read(entry['compressed_size'])
                
                if entry['compression'] == 1:
                    data = zlib.decompress(data)
                
                mul_data.extend(data)
                
                # Progress update every 100 entries
                if (i + 1) % 100 == 0 or (i + 1) == len(entries):
                    mb = len(mul_data) / 1024 / 1024
                    print(f"  Progress: {i + 1}/{len(entries)} entries ({mb:.1f} MB)", end='\r')
        
        print()  # New line after progress
        
        # Write output file
        print(f"Writing {len(mul_data) / 1024 / 1024:.1f} MB to {output_file.name}...")
        with open(output_file, 'wb') as f:
            f.write(mul_data)
        
        print(f"✅ Successfully created {output_file.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("="*60)
    print("UO LegacyMUL UOP to MUL Converter")
    print("="*60)
    
    # Convert maps 0-5
    success_count = 0
    for map_num in range(6):
        if convert_single_map(map_num):
            success_count += 1
    
    print(f"\n{'='*60}")
    print(f"Conversion complete!")
    print(f"  Successfully converted: {success_count}/6 maps")
    print(f"  Output directory: {OUTPUT_PATH.absolute()}")
    print(f"{'='*60}")
    
    if success_count > 0:
        print("\n✅ You can now use these map files in the terrain generator!")
    else:
        print("\n❌ No maps were converted. Check the errors above.")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Conversion cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)



