"""
Extract UO Orc Animations (Mob ID 7)
Extracts animated sprite frames from UO client files

API: GetAnimation(body, action, direction, hue) returns Frame[]
Each Frame has a Bitmap property
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io
import os

# Add UOFiddler path
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

# Orc Mob IDs
ORC_MOB_ID = 7  # Regular Orc

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
    
    API: GetAnimation(body, action, direction, hue) returns Frame[]
    Each Frame has a Bitmap property
    
    Monster Body IDs:
    - 7: Orc
    - 8: Orc Captain
    - 9: Orc Lord
    - 17: Ogre
    - 20: Ettin
    - 50: Skeleton
    
    Action IDs for monsters:
    - 0: Walk
    - 1: Idle/Stand
    - 2: Die (fall back)
    - 3: Die (fall forward)
    - 4: Attack 1
    - 5: Attack 2
    - 6: Attack 3
    - 7: Get hit
    
    Directions: 0-7 (S, SW, W, NW, N, NE, E, SE)
    """
    try:
        frames = []
        
        # Use the correct API: GetAnimation(body, action, direction, hue)
        # Returns Frame[] where each Frame has a Bitmap property
        anim_frames = Ultima.Animations.GetAnimation(body_id, action_id, direction, 0)
        
        if anim_frames is None or len(anim_frames) == 0:
            print(f"    No frames found for body {body_id}, action {action_id}, dir {direction}")
            return []
        
        frame_count = len(anim_frames)
        print(f"  Body {body_id}, Action {action_id}, Dir {direction}: {frame_count} frames")
        
        for frame_idx in range(frame_count):
            try:
                frame = anim_frames[frame_idx]
                
                # Get bitmap from Frame object
                if frame is None or frame.Bitmap is None:
                    continue
                    
                bitmap = frame.Bitmap
                pil_img = bitmap_to_pil(bitmap)
                
                if pil_img:
                    frames.append(pil_img)
                    
                    # Save individual frame
                    frame_path = output_dir / f"Mob {body_id}-{frame_idx}.bmp"
                    pil_img.save(frame_path, "BMP")
                        
            except Exception as e:
                print(f"    [WARN] Frame {frame_idx} failed: {e}")
                continue
        
        return frames
        
    except Exception as e:
        print(f"[ERROR] Extract failed for body {body_id}, action {action_id}, dir {direction}: {e}")
        return []

def extract_orc_animations():
    """Extract all orc animations"""
    
    # Direction names matching the human sprite folder convention
    # UO directions: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
    DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']
    
    # Actions to extract
    ACTIONS = {
        0: 'walk',      # Walk animation
        1: 'idle',      # Idle/stand
        4: 'attack1',   # Attack 1
        5: 'attack2',   # Attack 2
        7: 'hit',       # Get hit
        2: 'death',     # Die (fall back)
    }
    
    mob_id = ORC_MOB_ID
    
    print(f"\n=== Extracting Orc (Mob {mob_id}) ===")
    
    total_extracted = 0
    
    for action_id, action_name in ACTIONS.items():
        for dir_idx, dir_name in enumerate(DIRECTIONS):
            # Create output directory
            output_dir = OUTPUT_PATH / f"orc_{action_name}_{dir_name}"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            print(f"\nExtracting {action_name}_{dir_name}...")
            frames = extract_animation_frames(mob_id, action_id, dir_idx, output_dir)
            
            if frames:
                print(f"  ✓ Saved {len(frames)} frames to {output_dir}")
                total_extracted += len(frames)
            else:
                print(f"  ✗ No frames extracted")
    
    return total_extracted

def main():
    print("=" * 50)
    print("UO Orc Animation Extractor")
    print("Using GetAnimation(body, action, dir, hue) API")
    print("=" * 50)
    
    if not setup_uo_path():
        return
    
    # Verify animations are loaded
    try:
        Ultima.Animations.Reload()
        print("[OK] Animations loaded")
    except Exception as e:
        print(f"[ERROR] Failed to load animations: {e}")
        return
    
    total = extract_orc_animations()
    
    print("\n" + "=" * 50)
    print(f"Extraction complete! Total frames: {total}")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 50)

if __name__ == "__main__":
    main()
