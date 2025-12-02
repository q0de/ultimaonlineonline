"""
Bulk Extract Halberd Animations Using Ultima.dll
Automatically extracts all character animations for halberd-wielding characters
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io

# Configuration
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

# Animation configuration
BODY_ID = 400  # Male human
ACTIONS = {
    3: "idle",      # Standing/Idle
    8: "attack_1h", # 1-handed attack
    9: "attack_2h", # 2-handed attack (HALBERD!)
    12: "getHit",   # Get hit
    13: "death",    # Death
    16: "cast",     # Cast spell
    1: "walk",      # Walk
    2: "run"        # Run
}

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
    print("\nPlease ensure:")
    print("1. Python.NET is installed: pip install pythonnet")
    print("2. Ultima.dll is unblocked (right-click > Properties > Unblock)")
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
        print(f"[ERROR] Failed to convert bitmap: {e}")
        return None

def remove_white_background(img):
    """Remove white background and make transparent"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    
    for item in data:
        # If pixel is white (or very close to white), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def extract_animation_frames(body_id, action, direction):
    """Extract all frames for a specific animation"""
    try:
        frames = []
        
        # Try the API method from extract_with_ultima_dll.py
        # GetAnimation returns an array of AnimationFrame objects
        try:
            # Method: GetAnimation(body_id, action, direction, hue, back, mirror, repeat)
            anim_frames = Ultima.Animations.GetAnimation(body_id, action, direction, 0, False, False, False)
            
            if anim_frames is not None and len(anim_frames) > 0:
                # Extract bitmaps from each frame
                for frame in anim_frames:
                    if frame is not None and hasattr(frame, 'Bitmap'):
                        bitmap = frame.Bitmap
                        if bitmap is not None:
                            frames.append(bitmap)
        except Exception as e:
            print(f"    [WARN] API method failed: {e}")
            return None
        
        if not frames:
            return None
        
        return frames
    except Exception as e:
        print(f"  [ERROR] Failed to extract animation: {e}")
        return None

def save_animation_sheet(frames, output_path, action_name, direction_name):
    """Save animation frames as a sprite sheet"""
    if not frames:
        return False
    
    try:
        # Convert frames to PIL Images
        pil_frames = []
        for frame in frames:
            pil_img = bitmap_to_pil(frame)
            if pil_img:
                pil_img = remove_white_background(pil_img)
                pil_frames.append(pil_img)
        
        if not pil_frames:
            return False
        
        # Get frame dimensions
        frame_width = max(img.width for img in pil_frames)
        frame_height = max(img.height for img in pil_frames)
        
        # Create sprite sheet
        sheet_width = frame_width * len(pil_frames)
        sheet_height = frame_height
        
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        # Paste frames horizontally
        for i, frame in enumerate(pil_frames):
            x_offset = i * frame_width
            sprite_sheet.paste(frame, (x_offset, 0), frame)
        
        # Save sprite sheet
        output_path.parent.mkdir(parents=True, exist_ok=True)
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"  [OK] Saved {len(pil_frames)} frames to {output_path.name}")
        return True
    except Exception as e:
        print(f"  [ERROR] Failed to save sprite sheet: {e}")
        return False

def main():
    """Main extraction function"""
    print("="*60)
    print("Bulk Halberd Animation Extractor")
    print("="*60)
    print()
    
    if not setup_uo_path():
        return
    
    print("\nExtracting animations...")
    print(f"Body ID: {BODY_ID} (Male Human)")
    print(f"Actions: {len(ACTIONS)}")
    print(f"Directions: {len(DIRECTIONS)}")
    print(f"Total animations: {len(ACTIONS) * len(DIRECTIONS)}")
    print()
    
    extracted = 0
    failed = 0
    
    for action_id, action_name in ACTIONS.items():
        print(f"\n[{action_name.upper()}] Action {action_id}:")
        
        for direction_id, direction_name in DIRECTIONS.items():
            output_dir = OUTPUT_BASE / f"{action_name}_{direction_name}"
            output_file = output_dir / f"male_{action_name}_{direction_name}_sheet.png"
            
            print(f"  Direction {direction_id} ({direction_name})...", end=" ")
            
            # Extract frames
            frames = extract_animation_frames(BODY_ID, action_id, direction_id)
            
            if frames:
                # Save as sprite sheet
                if save_animation_sheet(frames, output_file, action_name, direction_name):
                    extracted += 1
                else:
                    failed += 1
            else:
                print("  [SKIP] No frames found")
                failed += 1
    
    print("\n" + "="*60)
    print(f"Extraction complete!")
    print(f"  Extracted: {extracted}")
    print(f"  Failed: {failed}")
    print(f"  Total: {extracted + failed}")
    print("="*60)

if __name__ == "__main__":
    main()

