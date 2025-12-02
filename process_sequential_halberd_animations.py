"""
Process Sequential Halberd Animations
Handles animations exported in order: NE, E, SE, S, SW, W, NW, N
"""

from pathlib import Path
from PIL import Image
import re

# Configuration
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
        # Check if the pixel is close to white (allowing for slight variations)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def find_animation_folders(animation_name):
    """
    Find folders matching the animation name (e.g., "Walk_01", "halberd walk")
    Returns folders sorted by modification time (most recent first)
    """
    animation_name_lower = animation_name.lower()
    matching_folders = []
    
    # Also check for partial matches and common patterns
    search_terms = [
        animation_name_lower,
        animation_name_lower.replace('_', ' '),
        animation_name_lower.replace(' ', '_'),
        'walk' if 'walk' in animation_name_lower else None,
        'halberd' if 'halberd' in animation_name_lower else None,
    ]
    search_terms = [s for s in search_terms if s]
    
    for folder in EXPORT_BASE.iterdir():
        if not folder.is_dir():
            continue
        
        # Skip already-organized folders
        if folder.name.startswith('halberd_'):
            continue
        
        folder_name_lower = folder.name.lower()
        
        # Check if folder name matches any search term
        matches = False
        for term in search_terms:
            if term and term in folder_name_lower:
                matches = True
                break
        
        if matches:
            # Check if it contains BMP files
            bmp_files = list(folder.glob("*.bmp")) + list(folder.glob("*.BMP"))
            if bmp_files:
                matching_folders.append((folder, bmp_files))
    
    # Sort by modification time (most recent first) - this gives us the export order
    matching_folders.sort(key=lambda x: x[0].stat().st_mtime, reverse=True)
    
    return matching_folders

def process_sequential_animation(animation_name, animation_type='walk'):
    """
    Process an animation exported in sequential order (NE, E, SE, S, SW, W, NW, N)
    
    Args:
        animation_name: Name of the animation folder (e.g., "Walk_01", "halberd walk")
        animation_type: Type of animation ('walk', 'run', 'attack_2h', etc.)
    """
    print("="*60)
    print(f"Processing Sequential Halberd {animation_type.upper()} Animation")
    print(f"Looking for: {animation_name}")
    print("="*60)
    
    # Find matching folders
    folders = find_animation_folders(animation_name)
    
    if not folders:
        print(f"\n[ERROR] No folders found matching '{animation_name}'")
        print(f"        Searched in: {EXPORT_BASE}")
        return False
    
    # Get the 8 most recent folders (one for each direction)
    if len(folders) < 8:
        print(f"\n[WARN] Found {len(folders)} folders, expected 8 directions")
        print("       Will process what we have...")
    
    folders_to_process = folders[:8]
    
    print(f"\n[OK] Found {len(folders_to_process)} folders to process")
    print(f"     Direction order: {', '.join(DIRECTION_ORDER[:len(folders_to_process)])}")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    
    for i, (folder, bmp_files) in enumerate(folders_to_process):
        if i >= len(DIRECTION_ORDER):
            break
        
        direction = DIRECTION_ORDER[i]
        
        print(f"\nProcessing: {folder.name} -> {direction}")
        
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
        output_name = f"male_{animation_type}_{direction}_sheet.png"
        output_path = OUTPUT_DIR / output_name
        
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"  [OK] Created: {output_name} ({len(frames)} frames)")
        processed += 1
    
    print("\n" + "="*60)
    print(f"Processing complete!")
    print(f"  Processed: {processed}/8 directions")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)
    
    return processed == 8

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python process_sequential_halberd_animations.py <animation_name> [animation_type]")
        print("\nExample:")
        print("  python process_sequential_halberd_animations.py 'Walk_01' walk")
        print("  python process_sequential_halberd_animations.py 'halberd walk' walk")
        sys.exit(1)
    
    animation_name = sys.argv[1]
    animation_type = sys.argv[2] if len(sys.argv) > 2 else 'walk'
    
    process_sequential_animation(animation_name, animation_type)

