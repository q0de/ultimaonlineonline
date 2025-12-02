"""
Fix Specific Broken Animations
- Idle Northwest (should be single frame)
- Run North (check and fix)
"""

from pathlib import Path
from PIL import Image

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

def remove_white_background(img):
    """Remove white background from an image, making it transparent."""
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

def fix_idle_northwest():
    """Fix idle northwest - should be single frame"""
    print("="*60)
    print("Fixing Idle Northwest")
    print("="*60)
    
    idle_folder = EXPORT_BASE / "idle-static_nw"
    
    if not idle_folder.exists():
        print("[ERROR] idle-static_nw folder not found!")
        return False
    
    # Get BMP files
    bmp_files = sorted(idle_folder.glob("Mob 400*.bmp")) + sorted(idle_folder.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        print("[ERROR] No BMP files found in idle-static_nw")
        return False
    
    print(f"[INFO] Found {len(bmp_files)} files")
    
    # Load first frame (idle should be single frame)
    try:
        img = Image.open(bmp_files[0])
        img = remove_white_background(img)
        
        # Create sprite sheet with single frame
        output_path = OUTPUT_DIR / "male_idle_northwest_sheet.png"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'PNG')
        
        print(f"[OK] Created male_idle_northwest_sheet.png (1 frame, {img.width}x{img.height})")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to process: {e}")
        return False

def fix_run_north():
    """Fix run north - ensure exactly 10 frames"""
    print("\n" + "="*60)
    print("Fixing Run North")
    print("="*60)
    
    run_folder = EXPORT_BASE / "run_n"
    
    if not run_folder.exists():
        print("[ERROR] run_n folder not found!")
        return False
    
    # Get BMP files
    import re
    bmp_files = {}
    for bmp_file in sorted(run_folder.glob("Mob 400*.bmp")) + sorted(run_folder.glob("Mob 400*.BMP")):
        match = re.search(r'Mob\s*400\s*-\s*(\d+)', bmp_file.name)
        if match:
            frame_num = int(match.group(1))
            bmp_files[frame_num] = bmp_file
        elif bmp_file.name == "Mob 400.bmp":
            bmp_files[0] = bmp_file
    
    if not bmp_files:
        print("[ERROR] No valid BMP files found")
        return False
    
    print(f"[INFO] Found {len(bmp_files)} frames")
    
    # Load frames (take first 10)
    frames = []
    for frame_num in sorted(bmp_files.keys())[:10]:
        try:
            img = Image.open(bmp_files[frame_num])
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"  [WARN] Failed to load frame {frame_num}: {e}")
    
    if len(frames) < 5:
        print(f"[ERROR] Only loaded {len(frames)} frames")
        return False
    
    # Ensure exactly 10 frames
    while len(frames) < 10:
        frames.append(frames[-1].copy())
    frames = frames[:10]
    
    # Create sprite sheet
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * 10
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for j, frame in enumerate(frames):
        x_offset = j * frame_width
        paste_x = x_offset + (frame_width - frame.width) // 2
        paste_y = (frame_height - frame.height) // 2
        sprite_sheet.paste(frame, (paste_x, paste_y), frame)
    
    output_path = OUTPUT_DIR / "male_run_north_sheet.png"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"[OK] Created male_run_north_sheet.png (10 frames, {sheet_width}x{sheet_height})")
    return True

def fix_idle_east():
    """Fix idle east - should be single frame"""
    print("\n" + "="*60)
    print("Fixing Idle East")
    print("="*60)
    
    idle_folder = EXPORT_BASE / "idle-static_e"
    
    if not idle_folder.exists():
        print("[ERROR] idle-static_e folder not found!")
        return False
    
    # Get BMP files
    bmp_files = sorted(idle_folder.glob("Mob 400*.bmp")) + sorted(idle_folder.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        print("[ERROR] No BMP files found in idle-static_e")
        return False
    
    print(f"[INFO] Found {len(bmp_files)} files")
    
    # Load first frame (idle should be single frame)
    try:
        img = Image.open(bmp_files[0])
        img = remove_white_background(img)
        
        # Create sprite sheet with single frame
        output_path = OUTPUT_DIR / "male_idle_east_sheet.png"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'PNG')
        
        print(f"[OK] Created male_idle_east_sheet.png (1 frame, {img.width}x{img.height})")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to process: {e}")
        return False

def fix_idle_west():
    """Fix idle west - should be single frame"""
    print("\n" + "="*60)
    print("Fixing Idle West")
    print("="*60)
    
    idle_folder = EXPORT_BASE / "idle-static_w"
    
    if not idle_folder.exists():
        print("[ERROR] idle-static_w folder not found!")
        return False
    
    # Get BMP files
    bmp_files = sorted(idle_folder.glob("Mob 400*.bmp")) + sorted(idle_folder.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        print("[ERROR] No BMP files found in idle-static_w")
        return False
    
    print(f"[INFO] Found {len(bmp_files)} files")
    
    # Load first frame (idle should be single frame)
    try:
        img = Image.open(bmp_files[0])
        img = remove_white_background(img)
        
        # Create sprite sheet with single frame
        output_path = OUTPUT_DIR / "male_idle_west_sheet.png"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'PNG')
        
        print(f"[OK] Created male_idle_west_sheet.png (1 frame, {img.width}x{img.height})")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to process: {e}")
        return False

def fix_idle_south():
    """Fix idle south - should be single frame"""
    print("\n" + "="*60)
    print("Fixing Idle South")
    print("="*60)
    
    idle_folder = EXPORT_BASE / "idle-static_s"
    
    if not idle_folder.exists():
        print("[ERROR] idle-static_s folder not found!")
        return False
    
    # Get BMP files
    bmp_files = sorted(idle_folder.glob("Mob 400*.bmp")) + sorted(idle_folder.glob("Mob 400*.BMP"))
    
    if not bmp_files:
        print("[ERROR] No BMP files found in idle-static_s")
        return False
    
    print(f"[INFO] Found {len(bmp_files)} files")
    
    # Load first frame (idle should be single frame)
    try:
        img = Image.open(bmp_files[0])
        img = remove_white_background(img)
        
        # Create sprite sheet with single frame
        output_path = OUTPUT_DIR / "male_idle_south_sheet.png"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        img.save(output_path, 'PNG')
        
        print(f"[OK] Created male_idle_south_sheet.png (1 frame, {img.width}x{img.height})")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to process: {e}")
        return False

if __name__ == "__main__":
    fix_idle_northwest()
    fix_idle_east()
    fix_idle_west()
    fix_idle_south()
    fix_run_north()
    print("\n" + "="*60)
    print("Fix complete!")
    print("="*60)

