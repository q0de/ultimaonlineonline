"""
Process exported UO animation frames into sprite sheets
Handles both individual frames and GIF files
"""

from pathlib import Path
from PIL import Image
import sys

OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

def process_gif(gif_path, output_name):
    """Extract frames from GIF and create sprite sheet"""
    try:
        gif = Image.open(gif_path)
        frames = []
        
        print(f"Processing GIF: {gif_path.name}")
        print(f"  Frames: {gif.n_frames}")
        
        for frame_num in range(gif.n_frames):
            gif.seek(frame_num)
            frame = gif.copy()
            
            # Convert to RGBA if needed
            if frame.mode != 'RGBA':
                frame = frame.convert('RGBA')
            
            frames.append(frame)
        
        # Create sprite sheet
        if frames:
            create_sprite_sheet(frames, OUTPUT_PATH / output_name)
            print(f"[OK] Created sprite sheet: {output_name}")
            return True
        
    except Exception as e:
        print(f"[ERROR] Failed to process GIF: {e}")
        return False

def process_frame_folder(folder_path, output_name):
    """Process folder of individual frame images"""
    try:
        folder = Path(folder_path)
        frames = []
        
        # Find all image files
        image_files = sorted(folder.glob("*.png")) + sorted(folder.glob("*.bmp")) + sorted(folder.glob("*.jpg"))
        
        print(f"Processing folder: {folder.name}")
        print(f"  Found {len(image_files)} frames")
        
        for img_file in image_files:
            img = Image.open(img_file)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            frames.append(img)
        
        if frames:
            create_sprite_sheet(frames, OUTPUT_PATH / output_name)
            print(f"[OK] Created sprite sheet: {output_name}")
            return True
        
    except Exception as e:
        print(f"[ERROR] Failed to process folder: {e}")
        return False

def create_sprite_sheet(frames, output_path):
    """Create horizontal sprite sheet from frames"""
    if not frames:
        return False
    
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Find max dimensions
    max_width = max(f.width for f in frames)
    max_height = max(f.height for f in frames)
    
    # Create sprite sheet
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Paste frames
    for i, frame in enumerate(frames):
        x = i * max_width
        y = (max_height - frame.height) // 2
        x_offset = (max_width - frame.width) // 2
        sheet.paste(frame, (x + x_offset, y), frame)
    
    sheet.save(output_path)
    print(f"  Saved: {output_path} ({len(frames)} frames, {sheet_width}x{sheet_height})")
    return True

def main():
    print("=" * 60)
    print("UO Animation Frame Processor")
    print("=" * 60)
    print("\nThis script processes exported UO animation frames.")
    print("\nUsage:")
    print("  1. Export animation from UOFiddler")
    print("  2. Run: python process_exported_frames.py <path_to_gif_or_folder> <output_name>")
    print("\nExample:")
    print("  python process_exported_frames.py exported_animation.gif male_attack_2h.png")
    print("  python process_exported_frames.py frames_folder/ male_attack_2h.png")
    print("=" * 60)
    
    if len(sys.argv) < 3:
        print("\n[ERROR] Missing arguments!")
        print("Usage: python process_exported_frames.py <input> <output_name>")
        return
    
    input_path = Path(sys.argv[1])
    output_name = sys.argv[2]
    
    if not input_path.exists():
        print(f"\n[ERROR] Path does not exist: {input_path}")
        return
    
    # Determine if it's a GIF or folder
    if input_path.is_file() and input_path.suffix.lower() == '.gif':
        process_gif(input_path, output_name)
    elif input_path.is_dir():
        process_frame_folder(input_path, output_name)
    else:
        print(f"\n[ERROR] Unsupported file type: {input_path}")
        print("Supported: .gif files or folders containing image frames")

if __name__ == "__main__":
    main()

