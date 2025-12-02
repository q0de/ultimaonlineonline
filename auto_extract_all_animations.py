"""
Automated UO Animation Extractor
Extracts all necessary animations for the PvP simulator using Ultima.dll
Falls back to GUI automation if needed
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io

# Configuration
UOFIDDLER_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8")
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Animation definitions: (body_id, action_id, direction, name, description)
ANIMATIONS_TO_EXTRACT = [
    # Male Human (Body 400) animations
    (400, 3, 2, "male_idle", "Idle/Standing"),
    (400, 9, 2, "male_attack_2h", "Attack 2H"),
    (400, 12, 2, "male_hit", "Get Hit"),
    (400, 16, 2, "male_cast", "Cast Spell"),
    (400, 20, 2, "male_death", "Death"),
    
    # Walking animations for all 8 directions
    (400, 0, 0, "male_walk_north", "Walk North"),
    (400, 0, 1, "male_walk_northeast", "Walk Northeast"),
    (400, 0, 2, "male_walk_east", "Walk East"),
    (400, 0, 3, "male_walk_southeast", "Walk Southeast"),
    (400, 0, 4, "male_walk_south", "Walk South"),
    (400, 0, 5, "male_walk_southwest", "Walk Southwest"),
    (400, 0, 6, "male_walk_west", "Walk West"),
    (400, 0, 7, "male_walk_northwest", "Walk Northwest"),
]

sys.path.append(str(UOFIDDLER_PATH))

def load_ultima_dll():
    """Load Ultima.dll"""
    try:
        clr.AddReference(str(UOFIDDLER_PATH / "Ultima.dll"))
        clr.AddReference("System.Drawing")
        clr.AddReference("System.IO")
        import Ultima
        import System
        import System.Drawing
        import System.IO
        print("[OK] Loaded Ultima.dll successfully!")
        return Ultima, System, System.Drawing, System.IO
    except Exception as e:
        print(f"[ERROR] Failed to load Ultima.dll: {e}")
        return None, None, None, None

def setup_uo_path(Ultima):
    """Set UO client path"""
    try:
        Ultima.Files.SetMulPath(UO_CLIENT_PATH)
        print(f"[OK] Set UO path to: {UO_CLIENT_PATH}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to set UO path: {e}")
        return False

def bitmap_to_pil(bitmap, SystemIO, SystemDrawing):
    """Convert .NET Bitmap to PIL Image"""
    try:
        ms = SystemIO.MemoryStream()
        bitmap.Save(ms, SystemDrawing.Imaging.ImageFormat.Png)
        ms.Seek(0, SystemIO.SeekOrigin.Begin)
        
        buffer = System.Array.CreateInstance(System.Byte, ms.Length)
        ms.Read(buffer, 0, ms.Length)
        img_bytes = bytes(buffer)
        
        return Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        print(f"    [ERROR] Bitmap conversion failed: {e}")
        return None

def remove_white_background(img):
    """Remove white/light backgrounds and make transparent"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    for item in data:
        # If pixel is white/very light (R, G, B all > 240), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def extract_animation_frames(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction):
    """Extract all frames for an animation"""
    frames = []
    
    # Try multiple methods to get animation frames
    methods = [
        # Method 1: Try GetAnimation with different parameters
        lambda: try_get_animation_method1(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction),
        # Method 2: Try GetAnimationFrame for each frame
        lambda: try_get_animation_method2(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction),
        # Method 3: Try reading directly from animation data
        lambda: try_get_animation_method3(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction),
    ]
    
    for i, method in enumerate(methods, 1):
        try:
            result = method()
            if result:
                frames = result
                print(f"    [OK] Method {i} succeeded: {len(frames)} frames")
                break
        except Exception as e:
            print(f"    [SKIP] Method {i} failed: {e}")
            continue
    
    return frames

def try_get_animation_method1(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction):
    """Method 1: Try GetAnimation with standard parameters"""
    try:
        # Try different parameter combinations
        params_list = [
            (body_id, action_id, direction, 0, False, False, False),
            (body_id, action_id, direction, 0, False, True, False),
            (body_id, action_id, direction, 0, True, False, False),
        ]
        
        for params in params_list:
            try:
                anim_frames = Ultima.Animations.GetAnimation(*params)
                if anim_frames is not None:
                    return process_animation_frames(anim_frames, SystemIO, SystemDrawing)
            except:
                continue
    except:
        pass
    return None

def try_get_animation_method2(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction):
    """Method 2: Try GetAnimationFrame for each frame"""
    frames = []
    # Try up to 20 frames (most animations have fewer)
    for frame_num in range(20):
        try:
            # Try different method signatures
            frame = None
            try:
                frame = Ultima.Animations.GetAnimationFrame(body_id, action_id, direction, frame_num)
            except:
                try:
                    frame = Ultima.Animations.GetAnimationFrame(body_id, action_id, direction, frame_num, 0)
                except:
                    continue
            
            if frame is None:
                break
            
            bitmap = None
            if hasattr(frame, 'Bitmap'):
                bitmap = frame.Bitmap
            elif isinstance(frame, SystemDrawing.Bitmap):
                bitmap = frame
            
            if bitmap:
                img = bitmap_to_pil(bitmap, SystemIO, SystemDrawing)
                if img:
                    frames.append(img)
        except:
            break
    
    return frames if frames else None

def try_get_animation_method3(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction):
    """Method 3: Try accessing animation data directly"""
    try:
        # Try to get animation data structure
        if hasattr(Ultima.Animations, 'GetAnimationData'):
            data = Ultima.Animations.GetAnimationData(body_id, action_id, direction)
            if data:
                return process_animation_data(data, SystemIO, SystemDrawing)
    except:
        pass
    return None

def process_animation_frames(anim_frames, SystemIO, SystemDrawing):
    """Process animation frames array"""
    frames = []
    
    # Try to get length
    frame_count = 0
    if hasattr(anim_frames, '__len__'):
        frame_count = len(anim_frames)
    elif hasattr(anim_frames, 'Count'):
        frame_count = anim_frames.Count
    elif hasattr(anim_frames, 'Length'):
        frame_count = anim_frames.Length
    
    if frame_count == 0:
        # Try to iterate anyway
        try:
            for frame in anim_frames:
                bitmap = extract_bitmap_from_frame(frame, SystemDrawing)
                if bitmap:
                    img = bitmap_to_pil(bitmap, SystemIO, SystemDrawing)
                    if img:
                        frames.append(img)
        except:
            pass
    else:
        # Iterate by index
        for i in range(frame_count):
            try:
                frame = anim_frames[i]
                bitmap = extract_bitmap_from_frame(frame, SystemDrawing)
                if bitmap:
                    img = bitmap_to_pil(bitmap, SystemIO, SystemDrawing)
                    if img:
                        frames.append(img)
            except:
                break
    
    return frames if frames else None

def extract_bitmap_from_frame(frame, SystemDrawing):
    """Extract bitmap from animation frame object"""
    bitmap = None
    
    # Try different properties
    for prop_name in ['Bitmap', 'Image', 'Frame', 'Texture']:
        if hasattr(frame, prop_name):
            try:
                bitmap = getattr(frame, prop_name)
                if isinstance(bitmap, SystemDrawing.Bitmap):
                    return bitmap
            except:
                continue
    
    # Try if frame itself is a bitmap
    if isinstance(frame, SystemDrawing.Bitmap):
        return frame
    
    return None

def process_animation_data(data, SystemIO, SystemDrawing):
    """Process animation data structure"""
    # Placeholder - implement based on actual data structure
    return None

def create_sprite_sheet(frames, output_path):
    """Create sprite sheet from frames"""
    if not frames:
        return False
    
    # Remove white backgrounds
    processed_frames = [remove_white_background(f) for f in frames]
    
    # Calculate sheet dimensions
    max_width = max(f.width for f in processed_frames)
    max_height = max(f.height for f in processed_frames)
    sheet_width = max_width * len(processed_frames)
    sheet_height = max_height
    
    # Create sprite sheet
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(processed_frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame)
    
    # Save
    sheet.save(output_path, "PNG")
    return True

def main():
    """Main extraction function"""
    print("=" * 70)
    print("Automated UO Animation Extractor")
    print("=" * 70)
    
    # Load Ultima.dll
    Ultima, System, SystemDrawing, SystemIO = load_ultima_dll()
    if not Ultima:
        print("\n[ERROR] Cannot proceed without Ultima.dll")
        print("Please ensure UOFiddler is installed at:", UOFIDDLER_PATH)
        return False
    
    # Setup UO path
    if not setup_uo_path(Ultima):
        print("\n[ERROR] Cannot proceed without UO client path")
        return False
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"\n[INFO] Extracting {len(ANIMATIONS_TO_EXTRACT)} animations...")
    print(f"[INFO] Output directory: {OUTPUT_DIR}\n")
    
    success_count = 0
    failed_count = 0
    
    for body_id, action_id, direction, name, description in ANIMATIONS_TO_EXTRACT:
        print(f"{'='*70}")
        print(f"Extracting: {name} ({description})")
        print(f"  Body: {body_id}, Action: {action_id}, Direction: {direction}")
        print(f"{'='*70}")
        
        # Extract frames
        frames = extract_animation_frames(Ultima, SystemIO, SystemDrawing, body_id, action_id, direction)
        
        if not frames:
            print(f"  [FAILED] Could not extract frames")
            failed_count += 1
            continue
        
        print(f"  [OK] Extracted {len(frames)} frames")
        
        # Create sprite sheet
        output_file = OUTPUT_DIR / f"{name}_sheet.png"
        if create_sprite_sheet(frames, output_file):
            print(f"  [SUCCESS] Saved: {output_file.name}")
            success_count += 1
        else:
            print(f"  [FAILED] Could not create sprite sheet")
            failed_count += 1
        
        print()
    
    # Summary
    print("=" * 70)
    print("Extraction Summary")
    print("=" * 70)
    print(f"Successfully extracted: {success_count}/{len(ANIMATIONS_TO_EXTRACT)}")
    print(f"Failed: {failed_count}/{len(ANIMATIONS_TO_EXTRACT)}")
    
    if failed_count > 0:
        print("\n[NOTE] Some animations failed to extract.")
        print("This might be due to:")
        print("  1. Animation not existing in UO client")
        print("  2. Ultima.dll API limitations")
        print("  3. Need to use GUI export method instead")
        print("\nYou can manually export failed animations using UOFiddler GUI.")
    
    return success_count > 0

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED] Extraction cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

