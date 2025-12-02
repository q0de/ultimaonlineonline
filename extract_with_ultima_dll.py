"""
Automatic UO Asset Extractor using Ultima.dll
Uses UOFiddler's library to extract assets programmatically
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io

# Add UOFiddler path
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets")

sys.path.append(UOFIDDLER_PATH)

try:
    # Load Ultima.dll and System
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
    print("Installing pythonnet if needed...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pythonnet"])
    print("Please run this script again after pythonnet is installed.")
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
        # Save to memory stream
        ms = System.IO.MemoryStream()
        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png)
        ms.Seek(0, System.IO.SeekOrigin.Begin)
        
        # Convert to bytes
        buffer = System.Array.CreateInstance(System.Byte, ms.Length)
        ms.Read(buffer, 0, ms.Length)
        
        # Convert to Python bytes
        img_bytes = bytes(buffer)
        
        # Load with PIL
        return Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        print(f"[ERROR] Bitmap conversion failed: {e}")
        return None

def extract_art_item(item_id, output_path):
    """Extract item art"""
    try:
        # Try different methods to get the item
        bitmap = None
        
        # Method 1: Direct GetStatic with bool parameter
        try:
            bitmap = Ultima.Art.GetStatic(item_id, True)
        except:
            pass
        
        # Method 2: GetStatic without params
        if bitmap is None:
            try:
                bitmap = Ultima.Art.GetStatic(item_id)
            except:
                pass
        
        # Method 3: GetLand for tiles
        if bitmap is None:
            try:
                bitmap = Ultima.Art.GetLand(item_id)
            except:
                pass
        
        if bitmap is None:
            return False
        
        img = bitmap_to_pil(bitmap)
        if img:
            img.save(output_path)
            print(f"[OK] Extracted item {item_id} -> {output_path.name}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to extract item {item_id}: {e}")
        return False

def extract_animation(body_id, action, direction, frame_num, output_path):
    """Extract animation frame"""
    try:
        # Get animation frames array
        frames = Ultima.Animations.GetAnimation(body_id, action, direction, 0, False, False, False)
        
        if frames is None or len(frames) == 0:
            return False
        
        # Get first frame
        frame = frames[0]
        if frame is None:
            return False
        
        # Get bitmap from frame
        bitmap = frame.Bitmap
        if bitmap is None:
            return False
        
        img = bitmap_to_pil(bitmap)
        if img:
            img.save(output_path)
            print(f"[OK] Extracted animation {body_id}/{action}/{direction} -> {output_path.name}")
            return True
        
        return False
    except Exception as e:
        print(f"[ERROR] Failed to extract animation: {e}")
        return False

def extract_texture(texture_id, output_path):
    """Extract texture/tile"""
    try:
        bitmap = Ultima.Textures.GetTexture(texture_id)
        if bitmap is None:
            return False
        
        img = bitmap_to_pil(bitmap)
        if img:
            img.save(output_path)
            print(f"[OK] Extracted texture {texture_id} -> {output_path.name}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to extract texture: {e}")
        return False

def main():
    print("=" * 60)
    print("UO Asset Extractor (Using Ultima.dll)")
    print("=" * 60)
    print()
    
    if not setup_uo_path():
        return
    
    print()
    print("Extracting assets...")
    print()
    
    # Extract halberd
    print("Extracting Halberd (ID 5182)...")
    halberd_path = OUTPUT_PATH / 'sprites' / 'weapons' / 'halberd.png'
    if extract_art_item(5182, halberd_path):
        print("  Success!")
    else:
        print("  Failed - keeping placeholder")
    
    print()
    
    # Extract character animation
    print("Extracting Character (Body 400, Walk)...")
    char_path = OUTPUT_PATH / 'sprites' / 'characters' / 'male' / 'idle.png'
    if extract_animation(400, 0, 0, 0, char_path):
        print("  Success!")
    else:
        print("  Failed - keeping placeholder")
    
    print()
    
    # Extract grass texture
    print("Extracting Grass Texture...")
    grass_path = OUTPUT_PATH / 'tiles' / 'grass.png'
    for tex_id in [0, 1, 2, 3, 4, 5, 10, 20]:
        if extract_texture(tex_id, grass_path):
            print("  Success!")
            break
    else:
        print("  Failed - keeping placeholder")
    
    print()
    print("=" * 60)
    print("[DONE] Asset extraction complete!")
    print("Refresh your browser to see the results!")
    print("=" * 60)

if __name__ == '__main__':
    main()

