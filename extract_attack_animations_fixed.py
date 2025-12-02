"""
Extract Halberd Attack Animations - Fixed Version
Tries multiple API methods to extract animations
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io
import System
import System.Reflection

# Configuration
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Animation config
BODY_ID = 400  # Male human
ACTION = 9     # 2-handed attack (halberd)
DIRECTIONS = {
    0: "north",
    1: "northeast", 
    2: "east",
    3: "southeast",
    4: "south",
    5: "southwest",
    6: "west",
    7: "northwest"
}

sys.path.append(UOFIDDLER_PATH)

try:
    clr.AddReference(str(Path(UOFIDDLER_PATH) / "Ultima.dll"))
    clr.AddReference("System.Drawing")
    import Ultima
    import System.Drawing
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
        stream = System.IO.MemoryStream()
        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png)
        stream.Position = 0
        img = Image.open(io.BytesIO(stream.ToArray()))
        return img
    except Exception as e:
        print(f"    [ERROR] Bitmap conversion failed: {e}")
        return None

def remove_white_background(img):
    """Remove white background"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def try_get_animation_methods(body_id, action, direction):
    """Try multiple methods to get animation"""
    frames = []
    
    # Method 1: Try GetAnimation with different signatures
    methods_to_try = [
        # (hue, back, mirror, repeat)
        (0, False, False, False),
        (0, True, False, False),
        # Try with int parameters instead of bool
        (0, 0, 0, 0),
        (0, 1, 0, 0),
    ]
    
    for params in methods_to_try:
        try:
            result = Ultima.Animations.GetAnimation(body_id, action, direction, *params)
            if result is not None:
                # Check if it's an array/list
                if hasattr(result, '__iter__') and not isinstance(result, str):
                    for item in result:
                        if hasattr(item, 'Bitmap'):
                            bitmap = item.Bitmap
                            if bitmap:
                                frames.append(bitmap)
                        elif hasattr(item, 'Image'):
                            frames.append(item.Image)
                    if frames:
                        return frames
        except:
            continue
    
    # Method 2: Try GetFrame directly
    for frame_idx in range(20):  # Try up to 20 frames
        try:
            frame = Ultima.Animations.GetFrame(body_id, action, direction, frame_idx)
            if frame and hasattr(frame, 'Bitmap'):
                bitmap = frame.Bitmap
                if bitmap:
                    frames.append(bitmap)
        except:
            break
    
    return frames if frames else None

def extract_and_save_animation(body_id, action, direction, direction_name):
    """Extract animation and save as sprite sheet"""
    print(f"  Direction {direction} ({direction_name})...", end=" ")
    
    # Try to get frames
    frames = try_get_animation_methods(body_id, action, direction)
    
    if not frames:
        print("[SKIP] No frames found")
        return False
    
    print(f"[OK] Found {len(frames)} frames")
    
    # Convert to PIL images
    pil_frames = []
    for i, frame in enumerate(frames):
        pil_img = bitmap_to_pil(frame)
        if pil_img:
            pil_img = remove_white_background(pil_img)
            pil_frames.append(pil_img)
    
    if not pil_frames:
        print("    [ERROR] Failed to convert frames")
        return False
    
    # Create sprite sheet
    frame_width = max(img.width for img in pil_frames)
    frame_height = max(img.height for img in pil_frames)
    sheet_width = frame_width * len(pil_frames)
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(pil_frames):
        x_offset = i * frame_width
        sprite_sheet.paste(frame, (x_offset, 0), frame)
    
    # Save
    output_file = OUTPUT_DIR / f"male_attack_2h_{direction_name}_sheet.png"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_file, 'PNG')
    
    print(f"    [OK] Saved: {output_file.name}")
    return True

def main():
    """Main extraction"""
    print("="*60)
    print("Extracting Halberd Attack Animations")
    print("="*60)
    print()
    
    if not setup_uo_path():
        return
    
    print(f"\nExtracting Action {ACTION} (2-Handed Attack) for Body {BODY_ID}")
    print(f"Directions: {len(DIRECTIONS)}")
    print()
    
    extracted = 0
    failed = 0
    
    for direction, direction_name in DIRECTIONS.items():
        if extract_and_save_animation(BODY_ID, ACTION, direction, direction_name):
            extracted += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"Extraction complete!")
    print(f"  Extracted: {extracted}")
    print(f"  Failed: {failed}")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()









