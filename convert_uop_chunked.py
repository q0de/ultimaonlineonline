"""
Chunked UOP to MUL Converter - Processes in batches, saves progress, can resume
Run: python convert_uop_chunked.py [map_number]
Example: python convert_uop_chunked.py 0
"""

from pathlib import Path
import struct
import zlib
import json
import sys

UO_PATH = Path('Ultima Online Classic')
OUTPUT_PATH = Path('assets/mul')
PROGRESS_FILE = Path('assets/mul/conversion_progress.json')
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 50  # Process 50 entries at a time

def load_progress():
    """Load previous progress if it exists"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_progress(map_num, processed_count, total_size):
    """Save current progress"""
    progress = load_progress()
    progress[f'map{map_num}'] = {
        'processed': processed_count,
        'size_mb': total_size / 1024 / 1024
    }
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def convert_map_chunked(map_num, resume=True):
    """Convert one map file in chunks"""
    uop_file = UO_PATH / f"map{map_num}LegacyMUL.uop"
    output_file = OUTPUT_PATH / f"map{map_num}.mul"
    temp_file = OUTPUT_PATH / f"map{map_num}.mul.tmp"
    
    print(f"\n{'='*70}")
    print(f"Map {map_num}: {uop_file.name}")
    print(f"{'='*70}")
    
    if not uop_file.exists():
        print(f"❌ File not found: {uop_file}")
        return False
    
    file_size_mb = uop_file.stat().st_size / 1024 / 1024
    print(f"✅ File found ({file_size_mb:.1f} MB)")
    
    # Check for existing progress
    progress = load_progress()
    start_entry = 0
    mul_data = bytearray()
    
    if resume and temp_file.exists():
        print(f"📂 Found partial file: {temp_file.name}")
        with open(temp_file, 'rb') as f:
            mul_data = bytearray(f.read())
        start_entry = progress.get(f'map{map_num}', {}).get('processed', 0)
        print(f"   Resuming from entry {start_entry} ({len(mul_data) / 1024 / 1024:.1f} MB already processed)")
    
    try:
        # Read UOP structure
        entries = []
        with open(uop_file, 'rb') as f:
            magic = f.read(4)
            if magic != b'MYP\x00':
                print(f"❌ Invalid UOP magic: {magic}")
                return False
            
            version = struct.unpack('<I', f.read(4))[0]
            format_timestamp = struct.unpack('<I', f.read(4))[0]
            next_block = struct.unpack('<Q', f.read(8))[0]
            block_size = struct.unpack('<I', f.read(4))[0]
            count = struct.unpack('<i', f.read(4))[0]
            
            print(f"   UOP Version: {version}, Total entries: {count}")
            
            while next_block != 0:
                f.seek(next_block)
                files_count = struct.unpack('<i', f.read(4))[0]
                next_block = struct.unpack('<q', f.read(8))[0]
                
                for _ in range(files_count):
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
        
        # Sort by offset for sequential processing
        entries.sort(key=lambda x: x['offset'])
        total_entries = len(entries)
        
        print(f"   Found {total_entries} entries")
        print(f"   Processing in chunks of {CHUNK_SIZE} entries...")
        print(f"   Starting from entry {start_entry}\n")
        
        # Process in chunks
        with open(uop_file, 'rb') as f:
            for chunk_start in range(start_entry, total_entries, CHUNK_SIZE):
                chunk_end = min(chunk_start + CHUNK_SIZE, total_entries)
                chunk = entries[chunk_start:chunk_end]
                
                print(f"   Processing entries {chunk_start}-{chunk_end-1}...", end=' ')
                
                chunk_data = bytearray()
                for entry in chunk:
                    try:
                        f.seek(entry['offset'])
                        data = f.read(entry['compressed'])
                        
                        if entry['flag'] == 1:  # zlib
                            data = zlib.decompress(data)
                        elif entry['flag'] == 3:  # zlib+bwt (try zlib first)
                            try:
                                data = zlib.decompress(data)
                            except:
                                print(f"\n      ⚠ Warning: Entry uses BWT, skipping")
                                continue
                        
                        chunk_data.extend(data)
                    except Exception as e:
                        print(f"\n      ⚠ Warning: Error processing entry: {e}")
                        continue
                
                mul_data.extend(chunk_data)
                
                # Save progress after each chunk
                with open(temp_file, 'wb') as tf:
                    tf.write(mul_data)
                save_progress(map_num, chunk_end, len(mul_data))
                
                mb = len(mul_data) / 1024 / 1024
                pct = (chunk_end / total_entries) * 100
                print(f"✓ ({pct:.1f}%, {mb:.1f} MB)")
        
        # Finalize - rename temp to final
        print(f"\n   Finalizing...")
        with open(output_file, 'wb') as f:
            f.write(mul_data)
        
        # Clean up temp file and progress
        if temp_file.exists():
            temp_file.unlink()
        progress = load_progress()
        if f'map{map_num}' in progress:
            del progress[f'map{map_num}']
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(progress, f, indent=2)
        
        print(f"✅ Successfully created {output_file.name} ({len(mul_data) / 1024 / 1024:.1f} MB)")
        return True
        
    except KeyboardInterrupt:
        print(f"\n\n⚠ Interrupted! Progress saved.")
        print(f"   Run again to resume from entry {len(entries)}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    # Get map number from command line or default to 0
    map_num = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    
    print("="*70)
    print("Chunked UOP to MUL Converter")
    print("="*70)
    print(f"Processing map{map_num} in chunks of {CHUNK_SIZE} entries")
    print(f"Progress is saved after each chunk - safe to interrupt (Ctrl+C)")
    print(f"Run again to resume if interrupted\n")
    
    if convert_map_chunked(map_num):
        print(f"\n✅ Map {map_num} conversion complete!")
        print(f"   Output: {OUTPUT_PATH / f'map{map_num}.mul'}")
    else:
        print(f"\n⚠ Map {map_num} conversion incomplete or failed")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Conversion cancelled by user")
        sys.exit(1)








