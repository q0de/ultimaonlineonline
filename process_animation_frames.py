"""
Process the exported UO animation frames into a sprite sheet
"""

from pathlib import Path
from PIL import Image
import glob

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
FRAMES_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

def process_frames():
    """Process all BMP frames into PNG sprite sheets"""
    print("=" * 60)
    print("Processing UO Animation Frames")
    print("=" * 60)
    
    # Find all BMP files
    bmp_files = sorted(FRAMES_DIR.glob("Mob 400*.bmp"))
    
    if not bmp_files:
        print("[ERROR] No BMP files found!")
        return
    
    print(f"\nFound {len(bmp_files)} frames:")
    for f in bmp_files:
        print(f"  - {f.name}")
    
    # Convert each frame to PNG
    frames = []
    for bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            print(f"\nProcessing {bmp_file.name}:")
            print(f"  Size: {img.size}, Mode: {img.mode}")
            
            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Remove white background (make transparent)
            # UO sprites typically have white/light backgrounds
            data = img.getdata()
            new_data = []
            for item in data:
                # If pixel is white/very light (R, G, B all > 240), make it transparent
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))  # Transparent
                else:
                    new_data.append(item)
            img.putdata(new_data)
            
            frames.append(img)
            print(f"  [OK] Converted")
        except Exception as e:
            print(f"  [ERROR] {e}")
    
    if not frames:
        print("\n[ERROR] No frames processed!")
        return
    
    # Create sprite sheet (horizontal)
    print(f"\nCreating sprite sheet from {len(frames)} frames...")
    
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    print(f"  Frame size: {max_width}x{max_height}")
    print(f"  Sheet size: {sheet_width}x{sheet_height}")
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame)
    
    # Save sprite sheet
    output_file = OUTPUT_DIR / "male_attack_2h_sheet.png"
    sheet.save(output_file, "PNG")
    print(f"\n[SUCCESS] Created sprite sheet: {output_file.name}")
    print(f"  Frames: {len(frames)}")
    print(f"  Size: {sheet_width}x{sheet_height}")
    
    # Also save first frame as idle
    if frames:
        idle_file = OUTPUT_DIR / "male_idle.png"
        frames[0].save(idle_file, "PNG")
        print(f"[OK] Saved idle frame: {idle_file.name}")
        
        idle_file_p2 = OUTPUT_DIR / "male_idle_p2.png"
        frames[0].save(idle_file_p2, "PNG")
        print(f"[OK] Saved idle frame P2: {idle_file_p2.name}")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Processing Complete!")
    print("=" * 60)
    print("\nNext: Update the game to use the sprite sheet for animations!")

if __name__ == "__main__":
    process_frames()

