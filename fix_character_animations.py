"""
Fix Character Walk/Run Animations - Ensure exactly 10 frames each
"""

from pathlib import Path
from PIL import Image

OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

DIRECTIONS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']

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

def fix_animation_sheet(anim_type, direction):
    """Fix a walk/run animation sheet to have exactly 10 frames"""
    sheet_name = f"male_{anim_type}_{direction}_sheet.png"
    sheet_path = OUTPUT_DIR / sheet_name
    
    if not sheet_path.exists():
        print(f"  [SKIP] {anim_type} {direction}: File not found")
        return False
    
    # Load existing sheet
    try:
        sheet = Image.open(sheet_path)
        sheet_width = sheet.width
        sheet_height = sheet.height
    except Exception as e:
        print(f"  [ERROR] {anim_type} {direction}: Failed to load: {e}")
        return False
    
    # Detect current frame count by trying different frame widths
    # UO frames are typically 20-55px wide
    best_frame_count = 10
    best_frame_width = sheet_width // 10
    
    # Try to detect actual frame count
    for test_count in [10, 9, 8, 11, 12, 13, 14, 15, 20, 30, 34]:
        test_width = sheet_width // test_count
        remainder = sheet_width % test_count
        
        # If it divides evenly or close, and width is reasonable
        if remainder <= 5 and 15 <= test_width <= 60:
            best_frame_count = test_count
            best_frame_width = test_width
            break
    
    print(f"  [INFO] {anim_type} {direction}: Sheet is {sheet_width}x{sheet_height}, detected {best_frame_count} frames at {best_frame_width}px each")
    
    # If already 10 frames, check if frame width is correct
    if best_frame_count == 10:
        print(f"  [OK] {anim_type} {direction}: Already has 10 frames")
        return True
    
    # Extract frames
    frames = []
    for i in range(min(best_frame_count, 20)):  # Limit to 20 frames max
        x = i * best_frame_width
        if x + best_frame_width <= sheet_width:
            frame = sheet.crop((x, 0, x + best_frame_width, sheet_height))
            frame = remove_white_background(frame)
            frames.append(frame)
    
    if len(frames) < 10:
        print(f"  [WARN] {anim_type} {direction}: Only extracted {len(frames)} frames, need 10")
        # Duplicate last frame to reach 10
        while len(frames) < 10:
            frames.append(frames[-1].copy() if frames else Image.new('RGBA', (best_frame_width, sheet_height)))
    elif len(frames) > 10:
        print(f"  [INFO] {anim_type} {direction}: Extracted {len(frames)} frames, taking first 10")
        frames = frames[:10]
    
    # Create new sheet with exactly 10 frames
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * 10
    sheet_height = frame_height
    
    new_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for j, frame in enumerate(frames):
        x_offset = j * frame_width
        paste_x = x_offset + (frame_width - frame.width) // 2
        paste_y = (frame_height - frame.height) // 2
        new_sheet.paste(frame, (paste_x, paste_y), frame)
    
    # Save over original
    new_sheet.save(sheet_path, 'PNG')
    
    print(f"  [OK] {anim_type} {direction}: Fixed to 10 frames ({sheet_width}x{sheet_height})")
    return True

def main():
    print("="*60)
    print("Fixing Character Walk/Run Animations")
    print("Ensuring exactly 10 frames per direction")
    print("="*60)
    
    fixed_walk = 0
    fixed_run = 0
    failed_walk = 0
    failed_run = 0
    
    for direction in DIRECTIONS:
        print(f"\nProcessing walk: {direction}")
        if fix_animation_sheet('walk', direction):
            fixed_walk += 1
        else:
            failed_walk += 1
        
        print(f"Processing run: {direction}")
        if fix_animation_sheet('run', direction):
            fixed_run += 1
        else:
            failed_run += 1
    
    print("\n" + "="*60)
    print(f"Fix complete!")
    print(f"  Walk: {fixed_walk}/8 fixed, {failed_walk}/8 failed")
    print(f"  Run: {fixed_run}/8 fixed, {failed_run}/8 failed")
    print(f"  Output: {OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()









