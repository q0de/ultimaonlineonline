"""
Process the new AttackSlash2H_01 animation
"""

from pathlib import Path
from PIL import Image
import re

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
FRAMES_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

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

def process_attack_animation():
    """Process attack animation frames"""
    print("=" * 60)
    print("Processing Attack Animation (Action 13)")
    print("=" * 60)
    
    # Find attack animation files - Action 13 = AttackSlash2H
    # Pattern: Mob 400-13-{direction}-{frame}.bmp or Mob 400-13-{frame}.bmp
    all_bmp_files = sorted(FRAMES_DIR.glob("Mob 400*.bmp"))
    
    # Look for Action 13 files
    attack_frames = []
    
    for bmp_file in all_bmp_files:
        name = bmp_file.name
        # Pattern: Mob 400-13-{direction}-{frame}.bmp
        match1 = re.match(r'Mob 400-13-(\d+)-(\d+)\.bmp', name)
        if match1:
            direction = int(match1.group(1))
            frame = int(match1.group(2))
            attack_frames.append((direction, frame, bmp_file))
            continue
        
        # Pattern: Mob 400-13-{frame}.bmp (default direction 2)
        match2 = re.match(r'Mob 400-13-(\d+)\.bmp', name)
        if match2:
            frame = int(match2.group(1))
            attack_frames.append((2, frame, bmp_file))  # Default to direction 2 (SE)
            continue
    
    # If no Action 13 files, check if user exported as different pattern
    # Maybe they're numbered 0-9 but are actually action 13 frames
    if not attack_frames:
        print("\n[INFO] No Action 13 files found. Checking for recent attack frames...")
        # Check recent files that might be attack animation
        recent_files = [f for f in all_bmp_files if f.stat().st_mtime > (Path(__file__).stat().st_mtime - 3600)]
        
        if recent_files:
            print(f"Found {len(recent_files)} recent files:")
            for f in recent_files[:10]:
                print(f"  - {f.name}")
            
            # Try to process them as attack frames
            attack_frames = [(2, i, f) for i, f in enumerate(sorted(recent_files, key=lambda x: x.name))]
    
    if not attack_frames:
        print("\n[ERROR] No attack animation files found!")
        print("\nExpected patterns:")
        print("  - Mob 400-13-{direction}-{frame}.bmp")
        print("  - Mob 400-13-{frame}.bmp")
        print("\nPlease export Action 13 (AttackSlash2H) from UOFiddler:")
        print("  - Body ID: 400")
        print("  - Action: 13")
        print("  - Direction: 2 (SE)")
        return
    
    print(f"\nFound {len(attack_frames)} attack animation frames")
    
    # Group by direction (usually just direction 2 for SE)
    frames_by_dir = {}
    for direction, frame, bmp_file in attack_frames:
        if direction not in frames_by_dir:
            frames_by_dir[direction] = []
        frames_by_dir[direction].append((frame, bmp_file))
    
    # Process each direction (usually just one)
    for direction in sorted(frames_by_dir.keys()):
        frames_data = sorted(frames_by_dir[direction], key=lambda x: x[0])
        
        print(f"\n{'='*60}")
        print(f"Processing Direction {direction} ({len(frames_data)} frames)")
        print(f"{'='*60}")
        
        # Load and process frames
        frames = []
        for frame_num, bmp_file in frames_data:
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
                print(f"  [OK] Frame {frame_num}: {bmp_file.name} ({img.size[0]}x{img.size[1]})")
            except Exception as e:
                print(f"  [ERROR] Failed to process {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames")
            continue
        
        # Create sprite sheet
        max_width = max(f.width for f in frames)
        max_height = max(f.height for f in frames)
        sheet_width = max_width * len(frames)
        sheet_height = max_height
        
        print(f"\n  Creating sprite sheet:")
        print(f"    Frame size: {max_width}x{max_height}")
        print(f"    Sheet size: {sheet_width}x{sheet_height}")
        print(f"    Total frames: {len(frames)}")
        
        sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        for i, frame in enumerate(frames):
            x = i * max_width
            y = (max_height - frame.height) // 2
            x_offset = (max_width - frame.width) // 2
            sheet.paste(frame, (x + x_offset, y), frame)
        
        # Save sprite sheet (replace the old one)
        output_file = OUTPUT_DIR / "male_attack_2h_sheet.png"
        sheet.save(output_file, "PNG")
        print(f"\n  [SUCCESS] Saved: {output_file.name}")
        print(f"  This will replace the existing attack animation!")

if __name__ == "__main__":
    process_attack_animation()

