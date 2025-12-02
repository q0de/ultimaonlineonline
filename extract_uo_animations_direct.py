"""
Extract UO Animations using Ultima.dll - Direct Method
Tries multiple approaches to get animation frames
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io
import System
import System.Reflection

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

def list_animation_methods():
    """List all available methods in Ultima.Animations"""
    print("\nTrying to discover Ultima.Animations methods...")
    print("-" * 60)
    # Just skip reflection - we'll try methods directly
    print("Will try GetAnimation and GetAnimLength methods")
    print("-" * 60)

def try_get_animation(body_id, action_id, direction):
    """Try different methods to get animation"""
    frames = []
    
    # Method 1: Try GetAnimation (returns AnimationFrame[])
    try:
        print(f"  Trying GetAnimation({body_id}, {action_id}, {direction})...")
        # GetAnimation signature: (int body, int action, int direction, int hue, bool preserveHue, bool firstFrame, bool lastFrame)
        anim_frames = Ultima.Animations.GetAnimation(body_id, action_id, direction, 0, False, False, False)
        
        if anim_frames is not None:
            frame_count = len(anim_frames) if hasattr(anim_frames, '__len__') else 0
            print(f"    [OK] Got {frame_count} frames!")
            
            # Try to iterate through frames
            for i in range(frame_count):
                try:
                    frame = anim_frames[i]
                    
                    # Try to get bitmap from frame
                    bitmap = None
                    if hasattr(frame, 'Bitmap'):
                        bitmap = frame.Bitmap
                    elif hasattr(frame, 'Image'):
                        bitmap = frame.Image
                    elif isinstance(frame, System.Drawing.Bitmap):
                        bitmap = frame
                    
                    if bitmap is not None:
                        img = bitmap_to_pil(bitmap)
                        if img:
                            frames.append(img)
                            print(f"      Frame {i}: {img.width}x{img.height}")
                except Exception as e:
                    print(f"      Frame {i} error: {e}")
                    continue
            
            if frames:
                return frames
    except Exception as e:
        print(f"    [FAIL] GetAnimation: {e}")
        import traceback
        traceback.print_exc()
    
    # Method 2: Try GetAnimationFrame
    try:
        print(f"  Trying GetAnimationFrame...")
        frame_count = Ultima.Animations.GetAnimLength(body_id, action_id)
        print(f"    Animation length: {frame_count}")
        
        for frame_idx in range(min(frame_count, 10)):  # Try first 10 frames
            try:
                # Try different method signatures
                frame = None
                
                # Try with all parameters
                try:
                    frame = Ultima.Animations.GetAnimationFrame(body_id, action_id, direction, frame_idx)
                except:
                    pass
                
                # Try without direction
                if frame is None:
                    try:
                        frame = Ultima.Animations.GetAnimationFrame(body_id, action_id, frame_idx)
                    except:
                        pass
                
                if frame is not None:
                    if hasattr(frame, 'Bitmap'):
                        img = bitmap_to_pil(frame.Bitmap)
                    elif hasattr(frame, 'Image'):
                        img = bitmap_to_pil(frame.Image)
                    else:
                        img = bitmap_to_pil(frame)
                    
                    if img:
                        frames.append(img)
                        print(f"    [OK] Extracted frame {frame_idx}")
            except Exception as e:
                print(f"    [WARN] Frame {frame_idx}: {e}")
                continue
        
        if frames:
            return frames
    except Exception as e:
        print(f"    [FAIL] {e}")
    
    return frames

def create_sprite_sheet(frames, output_path):
    """Create a horizontal sprite sheet from frames"""
    if not frames:
        return False
    
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame if frame.mode == 'RGBA' else None)
    
    sheet.save(output_path)
    return True

def main():
    print("=" * 60)
    print("UO Animation Extractor - Direct Method")
    print("=" * 60)
    
    if not setup_uo_path():
        return
    
    # List available methods first
    list_animation_methods()
    
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Test with a simple animation first
    print("\n" + "=" * 60)
    print("Testing extraction...")
    print("=" * 60)
    
    # Male human, standing, facing SE (direction 2)
    body_id = 400
    action_id = 3  # Stand
    direction = 2  # SE
    
    print(f"\nExtracting: Body {body_id}, Action {action_id}, Direction {direction}")
    frames = try_get_animation(body_id, action_id, direction)
    
    if frames:
        output_file = OUTPUT_PATH / "male_idle_test.png"
        if create_sprite_sheet(frames, output_file):
            print(f"\n[SUCCESS] Created sprite sheet: {output_file}")
            print(f"  Extracted {len(frames)} frames")
        else:
            print("\n[ERROR] Failed to create sprite sheet")
    else:
        print("\n[ERROR] No frames extracted")
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

