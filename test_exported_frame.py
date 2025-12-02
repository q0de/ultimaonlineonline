"""
Test the exported UO frame in the game
Converts BMP to PNG and sets it up for testing
"""

from pathlib import Path
from PIL import Image
import shutil

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
ASSETS_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters"

def find_exported_file():
    """Find the exported 400-X.bmp file"""
    search_paths = [
        Path(r"C:\Users\micha\AppData\Roaming\UoFiddler\Mob"),
        PROJECT_ROOT,
        Path.home() / "Desktop",
        Path.home() / "Documents",
    ]
    
    print("Searching for exported file...")
    for path in search_paths:
        if path.exists():
            bmp_files = list(path.rglob("400-*.bmp"))
            if bmp_files:
                # Get the most recent one
                latest = max(bmp_files, key=lambda p: p.stat().st_mtime)
                print(f"[OK] Found: {latest}")
                return latest
    
    # Check if user copied it to test folder
    test_file = ASSETS_DIR / "test" / "400-X.bmp"
    if test_file.exists():
        print(f"[OK] Found in test folder: {test_file}")
        return test_file
    
    print("[ERROR] Could not find exported file!")
    print(f"\nPlease copy your 400-X.bmp file to:")
    print(f"  {ASSETS_DIR / 'test' / '400-X.bmp'}")
    return None

def convert_and_setup(bmp_path):
    """Convert BMP to PNG and set up for game"""
    print(f"\nConverting {bmp_path.name}...")
    
    # Read BMP
    img = Image.open(bmp_path)
    print(f"  Original: {img.size}, Mode: {img.mode}")
    
    # Convert to RGBA (add alpha channel)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        print(f"  Converted to RGBA")
    
    # Save as PNG
    output_dir = ASSETS_DIR / "test"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save as character sprite
    output_file = output_dir / "male_idle.png"
    img.save(output_file, "PNG")
    print(f"[OK] Saved as: {output_file}")
    print(f"  Size: {img.size}")
    
    # Also create a copy for player 2
    output_file_p2 = output_dir / "male_idle_p2.png"
    img.save(output_file_p2, "PNG")
    print(f"[OK] Saved as: {output_file_p2}")
    
    return output_file

def update_asset_loader():
    """Update asset loader to use the test sprite"""
    asset_loader_path = PROJECT_ROOT / "js" / "modules" / "assetLoader.js"
    
    if not asset_loader_path.exists():
        print("[WARN] Could not find assetLoader.js")
        return
    
    print(f"\nUpdating asset loader...")
    
    # Read current file
    with open(asset_loader_path, 'r') as f:
        content = f.read()
    
    # Update sprite paths to use test sprites
    old_paths = [
        ("'char_p1_idle': 'assets/sprites/characters/male/idle.png'", 
         "'char_p1_idle': 'assets/sprites/characters/test/male_idle.png'"),
        ("'char_p2_idle': 'assets/sprites/characters/male/idle.png'",
         "'char_p2_idle': 'assets/sprites/characters/test/male_idle_p2.png'"),
    ]
    
    updated = False
    for old, new in old_paths:
        if old in content:
            content = content.replace(old, new)
            updated = True
            print(f"  Updated: {old.split(':')[0]}")
    
    if updated:
        with open(asset_loader_path, 'w') as f:
            f.write(content)
        print("[OK] Asset loader updated!")
    else:
        print("[WARN] Could not find sprite paths to update")

def main():
    print("=" * 60)
    print("Test Exported UO Frame")
    print("=" * 60)
    
    bmp_file = find_exported_file()
    if not bmp_file:
        return
    
    png_file = convert_and_setup(bmp_file)
    update_asset_loader()
    
    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Refresh your browser (http://localhost:8080)")
    print("2. You should see the exported UO character sprite!")
    print("\nIf it works, we can export all animation frames next!")

if __name__ == "__main__":
    main()

