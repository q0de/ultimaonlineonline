"""
Extract Animations Using Reflection to Find Correct API
Uses .NET reflection to discover the correct method signatures
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

def discover_animation_methods():
    """Use reflection to find all GetAnimation method signatures"""
    print("\nDiscovering GetAnimation methods...")
    anim_type = type(Ultima.Animations)
    methods = anim_type.GetMethods(System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public)
    
    animation_methods = []
    for method in methods:
        if 'GetAnimation' in method.Name or 'GetFrame' in method.Name:
            params = [p.ParameterType.Name for p in method.GetParameters()]
            animation_methods.append({
                'name': method.Name,
                'params': params,
                'method': method
            })
            print(f"  Found: {method.Name}({', '.join(params)})")
    
    return animation_methods

def try_extract_with_reflection(body_id, action, direction):
    """Try to extract animation using discovered methods"""
    methods = discover_animation_methods()
    
    for method_info in methods:
        method = method_info['method']
        param_count = len(method_info['params'])
        
        # Try different parameter combinations
        try:
            if param_count == 3:
                result = method.Invoke(None, [body_id, action, direction])
            elif param_count == 4:
                result = method.Invoke(None, [body_id, action, direction, 0])
            elif param_count == 5:
                result = method.Invoke(None, [body_id, action, direction, 0, False])
            elif param_count == 6:
                result = method.Invoke(None, [body_id, action, direction, 0, False, False])
            elif param_count == 7:
                result = method.Invoke(None, [body_id, action, direction, 0, False, False, False])
            else:
                continue
            
            if result is not None:
                print(f"    [SUCCESS] {method_info['name']} worked!")
                return result
        except Exception as e:
            continue
    
    return None

def bitmap_to_pil(bitmap):
    """Convert .NET Bitmap to PIL Image"""
    try:
        stream = System.IO.MemoryStream()
        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png)
        stream.Position = 0
        img = Image.open(io.BytesIO(stream.ToArray()))
        return img
    except:
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

def extract_animation(body_id, action, direction, direction_name):
    """Extract animation using reflection"""
    print(f"  Direction {direction} ({direction_name})...", end=" ")
    
    result = try_extract_with_reflection(body_id, action, direction)
    
    if result is None:
        print("[SKIP] No method worked")
        return False
    
    # Try to extract frames from result
    frames = []
    
    # Check if result is enumerable
    if hasattr(result, '__iter__') and not isinstance(result, str):
        for item in result:
            if hasattr(item, 'Bitmap'):
                frames.append(item.Bitmap)
            elif isinstance(item, System.Drawing.Bitmap):
                frames.append(item)
    elif isinstance(result, System.Drawing.Bitmap):
        frames.append(result)
    elif hasattr(result, 'Bitmap'):
        frames.append(result.Bitmap)
    
    if not frames:
        print("[SKIP] No frames extracted")
        return False
    
    print(f"[OK] Found {len(frames)} frames")
    
    # Convert to PIL and create sprite sheet
    pil_frames = []
    for frame in frames:
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
    print("Extracting Halberd Attack Animations (Using Reflection)")
    print("="*60)
    
    if not setup_uo_path():
        return
    
    # Discover methods first
    methods = discover_animation_methods()
    if not methods:
        print("[ERROR] No animation methods found!")
        return
    
    print(f"\nExtracting Action 9 (2-Handed Attack) for Body 400")
    
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
    
    extracted = 0
    failed = 0
    
    for direction, direction_name in DIRECTIONS.items():
        if extract_animation(400, 9, direction, direction_name):
            extracted += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"Extraction complete!")
    print(f"  Extracted: {extracted}")
    print(f"  Failed: {failed}")
    print("="*60)

if __name__ == "__main__":
    main()









