"""
Extract UO Character Animations
Extracts animated sprite sheets from UO client files
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io

# Add UOFiddler path
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

sys.path.append(UOFIDDLER_PATH)

try:
    clr.AddReference(str(Path(UOFIDDLER_PATH) / "Ultima.dll"))
    clr.AddReference("System.Drawing")
    clr.AddReference("System.IO")
    import Ultima
    import System
    import System.Drawing
    import System.IO
    print("[OK] Loaded Ultima.dll successfully!")
except Exception as e:
    print(f"[ERROR] Failed to load Ultima.dll: {e}")
    sys.exit(1)

def setup_uo_path():
    """Set UO client path"""
    try:
        Ultima.Files.SetMulPath(UO_CLIENT_PATH)
        print(f"[OK] Set UO path to: {UO_CLIENT_PATH}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to set UO path: {e}")
        return False

def bitmap_to_pil(bitmap):
    """Convert .NET Bitmap to PIL Image"""
    try:
        if bitmap is None:
            return None
            
        ms = System.IO.MemoryStream()
        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png)
        ms.Seek(0, System.IO.SeekOrigin.Begin)
        
        buffer = System.Array.CreateInstance(System.Byte, ms.Length)
        ms.Read(buffer, 0, ms.Length)
        
        img_bytes = bytes(buffer)
        return Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        print(f"[ERROR] Bitmap conversion failed: {e}")
        return None

def extract_animation_frames(body_id, action_id, direction, output_dir):
    """
    Extract animation frames for a body/action/direction
    
    Body IDs:
    - 400-401: Male human
    - 402-403: Female human
    
    Action IDs:
    - 0: Walk
    - 1: Walk (alt)
    - 2: Run
    - 3: Stand
    - 4: Fidget 1
    - 5: Fidget 2
    - 6: Stand (one-handed attack ready)
    - 7: Stand (two-handed attack ready)
    - 8: Attack (one-handed)
    - 9: Attack (two-handed)
    - 10: Attack (bow)
    - 11: Attack (crossbow)
    - 12: Get hit
    - 13: Die (fall back)
    - 14: Die (fall forward)
    - 15: Ride
    - 16: Mount
    - 17: Kick
    - 18: Cast spell (1-handed)
    - 19: Cast spell (2-handed)
    - 20: Salute
    - 21: Bow
    
    Directions: 0-7 (N, NE, E, SE, S, SW, W, NW)
    """
    try:
        frames = []
        frame_count = Ultima.Animations.GetAnimLength(body_id, action_id)
        
        if frame_count == 0:
            return []
        
        print(f"  Body {body_id}, Action {action_id}, Dir {direction}: {frame_count} frames")
        
        for frame_idx in range(frame_count):
            try:
                # Get frame bitmap
                bitmap = Ultima.Animations.GetFrame(body_id, action_id, direction, frame_idx)
                
                if bitmap is not None:
                    img = bitmap_to_pil(bitmap)
                    if img:
                        frames.append(img)
            except Exception as e:
                print(f"    [WARN] Frame {frame_idx} failed: {e}")
                continue
        
        return frames
    except Exception as e:
        print(f"  [ERROR] Failed to extract animation: {e}")
        return []

def create_sprite_sheet(frames, output_path):
    """Create a horizontal sprite sheet from frames"""
    if not frames:
        return False
    
    # Calculate sprite sheet dimensions
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    # Create sprite sheet
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Paste frames
    for i, frame in enumerate(frames):
        x = i * max_width
        # Center frame vertically and horizontally in its cell
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame if frame.mode == 'RGBA' else None)
    
    sheet.save(output_path)
    return True

def main():
    print("=" * 60)
    print("UO Animation Extractor")
    print("=" * 60)
    
    if not setup_uo_path():
        return
    
    # Create output directory
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Animations to extract
    animations = [
        # Male character animations
        (400, 3, 2, "male_idle.png"),           # Standing facing SE
        (400, 8, 2, "male_attack_1h.png"),      # 1H attack facing SE
        (400, 9, 2, "male_attack_2h.png"),      # 2H attack facing SE
        (400, 18, 2, "male_cast_1h.png"),       # Cast 1H facing SE
        (400, 12, 2, "male_hit.png"),           # Get hit facing SE
        (400, 13, 2, "male_death.png"),         # Die facing SE
        
        # Female character animations
        (401, 3, 2, "female_idle.png"),
        (401, 8, 2, "female_attack_1h.png"),
        (401, 9, 2, "female_attack_2h.png"),
        (401, 18, 2, "female_cast_1h.png"),
        (401, 12, 2, "female_hit.png"),
        (401, 13, 2, "female_death.png"),
    ]
    
    print("\nExtracting animations...")
    print("-" * 60)
    
    for body_id, action_id, direction, filename in animations:
        print(f"\n{filename}:")
        frames = extract_animation_frames(body_id, action_id, direction, OUTPUT_PATH)
        
        if frames:
            output_file = OUTPUT_PATH / filename
            if create_sprite_sheet(frames, output_file):
                print(f"  [OK] Created sprite sheet: {filename} ({len(frames)} frames)")
            else:
                print(f"  [ERROR] Failed to create sprite sheet")
        else:
            print(f"  [ERROR] No frames extracted")
    
    print("\n" + "=" * 60)
    print("Extraction complete!")
    print(f"Output directory: {OUTPUT_PATH}")
    print("=" * 60)

if __name__ == "__main__":
    main()

