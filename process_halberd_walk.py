"""
Process Halberd Walk Animation - Sequential Export Order
Exports should be in order: NE, E, SE, S, SW, W, NW, N
"""

from pathlib import Path
from PIL import Image

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Direction order for sequential exports
DIRECTION_ORDER = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

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

def process_halberd_walk():
    """Process halberd walk animations exported in sequential order"""
    print("="*60)
    print("Processing Halberd Walk Animation")
    print("Looking for folders with BMP files...")
    print("="*60)
    
    # Find all folders with BMP files, excluding already-organized ones
    folders_with_bmp = []
    for folder in EXPORT_BASE.iterdir():
        if not folder.is_dir():
            continue
        
        # Skip already-organized folders and old folders
        if folder.name.startswith('halberd_'):
            continue
        
        # Skip old folders (walk_e, run_n, etc.) - only process NEW exports
        # Look for folders created in the last hour
        import time
        folder_age = time.time() - folder.stat().st_ctime
        if folder_age > 3600:  # Older than 1 hour
            continue
        
        bmp_files = list(folder.glob("*.bmp")) + list(folder.glob("*.BMP"))
        if bmp_files:
            folders_with_bmp.append((folder, bmp_files))
    
    # Also check for BMP files directly in root (might be new export)
    root_bmp_files = list(EXPORT_BASE.glob("Mob *.bmp")) + list(EXPORT_BASE.glob("Mob *.BMP"))
    if root_bmp_files:
        import time
        # Check if they're recent
        recent_root_files = [f for f in root_bmp_files if (time.time() - f.stat().st_ctime) < 3600]
        if recent_root_files:
            print(f"\n[INFO] Found {len(recent_root_files)} BMP files in root directory")
            print("       These might be your new export - please put them in a folder!")
    
    if not folders_with_bmp:
        print("\n[ERROR] No NEW folders with BMP files found!")
        print(f"        Check: {EXPORT_BASE}")
        print("        Make sure you exported to a FOLDER (not directly to animations/)")
        return
    
    # Sort by creation time (oldest first) - this gives us the export order
    folders_with_bmp.sort(key=lambda x: x[0].stat().st_ctime)
    
    # Get the 8 most recent folders (or all if less than 8)
    folders_to_process = folders_with_bmp[-8:] if len(folders_with_bmp) >= 8 else folders_with_bmp
    
    print(f"\n[OK] Found {len(folders_to_process)} folders")
    print(f"     Processing in order: {', '.join(DIRECTION_ORDER[:len(folders_to_process)])}")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    
    for i, (folder, bmp_files) in enumerate(folders_to_process):
        if i >= len(DIRECTION_ORDER):
            break
        
        direction = DIRECTION_ORDER[i]
        
        print(f"\n[{i+1}/8] Processing: {folder.name} -> {direction}")
        
        # Load frames
        frames = []
        for bmp_file in sorted(bmp_files):
            try:
                img = Image.open(bmp_file)
                img = remove_white_background(img)
                frames.append(img)
            except Exception as e:
                print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
        
        if not frames:
            print(f"  [SKIP] No valid frames")
            continue
        
        # Create sprite sheet
        frame_width = max(img.width for img in frames)
        frame_height = max(img.height for img in frames)
        sheet_width = frame_width * len(frames)
        sheet_height = frame_height
        
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        for j, frame in enumerate(frames):
            x_offset = j * frame_width
            paste_x = x_offset + (frame_width - frame.width) // 2
            paste_y = (frame_height - frame.height) // 2
            sprite_sheet.paste(frame, (paste_x, paste_y), frame)
        
        # Generate output filename
        output_name = f"male_walk_{direction}_sheet.png"
        output_path = OUTPUT_DIR / output_name
        
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"  [OK] Created: {output_name} ({len(frames)} frames)")
        processed += 1
    
    print("\n" + "="*60)
    print(f"Processing complete!")
    print(f"  Processed: {processed}/8 directions")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)
    
    if processed == 8:
        print("\n[SUCCESS] All 8 directions processed!")
    else:
        print(f"\n[INFO] Processed {processed} directions. Export {8-processed} more folders to complete.")

if __name__ == "__main__":
    process_halberd_walk()

