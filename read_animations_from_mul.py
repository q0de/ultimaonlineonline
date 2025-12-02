"""
Read UO Animations directly from .mul/.uop files
This bypasses Ultima.dll entirely
"""

import struct
from pathlib import Path
from PIL import Image

UO_CLIENT_PATH = Path(r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic")
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

def unpack_rgb555(color):
    """Unpack RGB555 color format"""
    r = ((color >> 10) & 0x1F) << 3
    g = ((color >> 5) & 0x1F) << 3
    b = (color & 0x1F) << 3
    return r, g, b

def read_animation_index(mul_file):
    """Read animation index from anim.idx"""
    try:
        with open(mul_file, 'rb') as f:
            entries = []
            while True:
                data = f.read(12)  # Each entry is 12 bytes
                if len(data) < 12:
                    break
                
                lookup = struct.unpack('<I', data[0:4])[0]
                length = struct.unpack('<I', data[4:8])[0]
                extra = struct.unpack('<I', data[8:12])[0]
                
                entries.append({
                    'lookup': lookup,
                    'length': length,
                    'extra': extra
                })
            
            return entries
    except Exception as e:
        print(f"Error reading index: {e}")
        return []

def read_animation_frame(mul_file, offset, length):
    """Read a single animation frame from anim.mul"""
    try:
        with open(mul_file, 'rb') as f:
            f.seek(offset)
            data = f.read(length)
            
            if len(data) < 8:
                return None
            
            # Parse frame header
            center_x = struct.unpack('<h', data[0:2])[0]
            center_y = struct.unpack('<h', data[2:4])[0]
            width = struct.unpack('<H', data[4:6])[0]
            height = struct.unpack('<H', data[6:8])[0]
            
            if width == 0 or height == 0 or width > 512 or height > 512:
                return None
            
            # Create image
            img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            pixels = img.load()
            
            # Skip header table (height * 4 bytes)
            offset = 8 + (height * 4)
            
            # Read pixel data (RLE encoded)
            y = 0
            while y < height and offset < len(data):
                x = 0
                # Read line header
                if offset + 2 > len(data):
                    break
                
                line_start = struct.unpack('<H', data[offset:offset+2])[0]
                offset += 2
                
                if line_start == 0:
                    y += 1
                    continue
                
                # Read pixels until end marker
                while x < width and offset + 2 <= len(data):
                    color = struct.unpack('<H', data[offset:offset+2])[0]
                    offset += 2
                    
                    if color == 0:  # End of line
                        break
                    
                    r, g, b = unpack_rgb555(color)
                    if x < width and y < height:
                        pixels[x, y] = (r, g, b, 255)
                    x += 1
                
                y += 1
            
            return img
            
    except Exception as e:
        print(f"Error reading frame: {e}")
        return None

def calculate_animation_index(body_id, action_id, direction):
    """Calculate animation index from body/action/direction"""
    # UO uses a simpler formula: body_id * 200 + action_id * 8 + direction
    # But the actual format might be different - let's try multiple formulas
    index1 = body_id * 200 + action_id * 8 + direction
    index2 = (body_id << 9) | (action_id << 3) | direction
    index3 = body_id * 100 + action_id * 8 + direction
    
    # Return the one that's most likely to be in range
    for idx in [index1, index2, index3]:
        if idx < 148810:  # Max entries we found
            return idx
    
    return index1  # Return first one anyway

def main():
    print("=" * 60)
    print("UO Animation Reader - Direct from .mul files")
    print("=" * 60)
    
    # Find animation files
    anim_idx = UO_CLIENT_PATH / "anim.idx"
    anim_mul = UO_CLIENT_PATH / "anim.mul"
    
    # Also check for UOP format
    anim_uop = UO_CLIENT_PATH / "AnimationFrame.uop"
    
    if not anim_idx.exists() and not anim_uop.exists():
        print(f"[ERROR] Could not find animation files!")
        print(f"  Looked for: {anim_idx}")
        print(f"  Looked for: {anim_uop}")
        print(f"\nUO client path: {UO_CLIENT_PATH}")
        print("Please check if UO is installed correctly.")
        return
    
    print(f"[OK] Found animation files")
    
    # Try to read index
    if anim_idx.exists():
        print(f"\nReading index: {anim_idx}")
        entries = read_animation_index(anim_idx)
        print(f"  Found {len(entries)} entries in index")
        
        # Test: Extract male human standing (Body 400, Action 3, Dir 2)
        body_id = 400
        action_id = 3
        direction = 2
        
        index = calculate_animation_index(body_id, action_id, direction)
        print(f"\nCalculated index for Body {body_id}, Action {action_id}, Dir {direction}: {index}")
        
        if index < len(entries):
            entry = entries[index]
            print(f"  Lookup: {entry['lookup']}, Length: {entry['length']}")
            
            if entry['lookup'] != 0xFFFFFFFF and entry['length'] > 0:
                print(f"\nReading frame from anim.mul...")
                frame = read_animation_frame(anim_mul, entry['lookup'], entry['length'])
                
                if frame:
                    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
                    output_file = OUTPUT_PATH / "male_idle_test.png"
                    frame.save(output_file)
                    print(f"[SUCCESS] Saved frame: {output_file}")
                    print(f"  Size: {frame.width}x{frame.height}")
                else:
                    print("[ERROR] Failed to read frame")
            else:
                print("[ERROR] Invalid entry (lookup = 0xFFFFFFFF)")
        else:
            print(f"[ERROR] Index {index} out of range (max: {len(entries)})")
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

