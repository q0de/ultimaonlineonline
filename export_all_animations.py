"""
Export and process all character animations from UOFiddler exports
This script processes BMP files exported from UOFiddler into sprite sheets
"""

from pathlib import Path
from PIL import Image
import glob

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
UOFIDDLER_EXPORT_DIR = Path(r"%APPDATA%\UoFiddler").expanduser()
FRAMES_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

# Animation mappings: (UOFiddler export pattern, output filename, description)
ANIMATIONS = [
    ("Mob 400-0", "male_idle", "Idle/Stand"),
    ("Mob 400-1", "male_walk", "Walk"),
    ("Mob 400-9", "male_attack_2h", "Attack 2H"),  # We already have this
    ("Mob 400-12", "male_hit", "Get Hit"),
    ("Mob 400-16", "male_cast", "Cast Spell"),
    ("Mob 400-20", "male_death", "Death"),
]

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

def process_animation(pattern, output_name, description):
    """Process a single animation sequence"""
    print(f"\n{'='*60}")
    print(f"Processing: {description} ({output_name})")
    print(f"{'='*60}")
    
    # Find all BMP files matching the pattern
    bmp_files = sorted(FRAMES_DIR.glob(f"{pattern}*.bmp"))
    
    if not bmp_files:
        print(f"[SKIP] No files found matching '{pattern}*.bmp'")
        print(f"  Expected in: {FRAMES_DIR}")
        print(f"  Please export from UOFiddler:")
        print(f"    - Body ID: 400 (Male)")
        print(f"    - Action: {pattern.split('-')[1] if '-' in pattern else '?'}")
        print(f"    - Direction: 2 (SE)")
        return False
    
    print(f"Found {len(bmp_files)} frames:")
    for f in bmp_files[:5]:  # Show first 5
        print(f"  - {f.name}")
    if len(bmp_files) > 5:
        print(f"  ... and {len(bmp_files) - 5} more")
    
    # Convert each frame to PNG with transparency
    frames = []
    for bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"  [ERROR] Failed to process {bmp_file.name}: {e}")
    
    if not frames:
        print("[ERROR] No frames processed!")
        return False
    
    # Create sprite sheet (horizontal)
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    print(f"\nCreating sprite sheet:")
    print(f"  Frame size: {max_width}x{max_height}")
    print(f"  Sheet size: {sheet_width}x{sheet_height}")
    print(f"  Total frames: {len(frames)}")
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame)
    
    # Save sprite sheet
    output_file = OUTPUT_DIR / f"{output_name}_sheet.png"
    sheet.save(output_file, "PNG")
    print(f"\n[SUCCESS] Saved: {output_file.name}")
    
    # Also save first frame as single image (for idle)
    if frames and output_name == "male_idle":
        idle_file = OUTPUT_DIR / "male_idle.png"
        frames[0].save(idle_file, "PNG")
        print(f"[OK] Saved idle frame: {idle_file.name}")
        
        idle_file_p2 = OUTPUT_DIR / "male_idle_p2.png"
        frames[0].save(idle_file_p2, "PNG")
        print(f"[OK] Saved idle frame P2: {idle_file_p2.name}")
    
    return True

def main():
    """Process all animations"""
    print("="*60)
    print("UO Character Animation Processor")
    print("="*60)
    print(f"\nLooking for exported animations in:")
    print(f"  {FRAMES_DIR}")
    print(f"\nTo export animations from UOFiddler:")
    print(f"  1. Open UOFiddler -> Animations tab")
    print(f"  2. Select Body ID: 400 (Male Human)")
    print(f"  3. Select Action and Direction 2 (SE)")
    print(f"  4. Right-click -> Export -> Export Frames")
    print(f"  5. Save to: {FRAMES_DIR}")
    print(f"\n" + "="*60)
    
    processed = []
    skipped = []
    
    for pattern, output_name, description in ANIMATIONS:
        if process_animation(pattern, output_name, description):
            processed.append(output_name)
        else:
            skipped.append((pattern, description))
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nProcessed ({len(processed)}):")
    for name in processed:
        print(f"  [OK] {name}_sheet.png")
    
    if skipped:
        print(f"\nSkipped ({len(skipped)}):")
        for pattern, desc in skipped:
            print(f"  [SKIP] {desc} (pattern: {pattern})")
        print(f"\nExport these from UOFiddler and run this script again!")
    
    print("\n" + "="*60)
    print("[SUCCESS] Processing Complete!")
    print("="*60)

if __name__ == "__main__":
    main()

