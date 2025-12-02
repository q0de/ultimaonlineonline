"""
Automatically find and test exported UO frame
"""

from pathlib import Path
from PIL import Image
import time

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
ASSETS_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

def find_and_process():
    """Find exported file and process it"""
    print("=" * 60)
    print("Auto-Test Exported UO Frame")
    print("=" * 60)
    
    # Check test folder first
    test_file = ASSETS_DIR / "400-X.bmp"
    if test_file.exists():
        print(f"[OK] Found file: {test_file}")
        process_file(test_file)
        return True
    
    # Search common locations
    search_paths = [
        Path(r"C:\Users\micha\AppData\Roaming\UoFiddler\Mob"),
        Path.home() / "Desktop",
        Path.home() / "Documents",
        PROJECT_ROOT,
    ]
    
    print("\nSearching for exported file...")
    for path in search_paths:
        if path.exists():
            bmp_files = list(path.rglob("400-*.bmp"))
            if bmp_files:
                latest = max(bmp_files, key=lambda p: p.stat().st_mtime)
                print(f"[FOUND] {latest}")
                # Copy to test folder
                import shutil
                shutil.copy2(latest, test_file)
                print(f"[COPIED] to test folder")
                process_file(test_file)
                return True
    
    print("\n[INFO] File not found yet.")
    print(f"\nPlease copy your exported 400-X.bmp file to:")
    print(f"  {test_file}")
    print("\nOr export it from UOFiddler and save it there.")
    print("\nOnce the file is there, run this script again!")
    return False

def process_file(bmp_path):
    """Process the BMP file"""
    print(f"\nProcessing {bmp_path.name}...")
    
    # Convert to PNG
    img = Image.open(bmp_path)
    print(f"  Size: {img.size}, Mode: {img.mode}")
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Save as character sprites
    output_p1 = ASSETS_DIR / "male_idle.png"
    output_p2 = ASSETS_DIR / "male_idle_p2.png"
    
    img.save(output_p1, "PNG")
    img.save(output_p2, "PNG")
    
    print(f"[OK] Created: {output_p1.name}")
    print(f"[OK] Created: {output_p2.name}")
    
    # Update asset loader
    update_asset_loader()
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print("\nNext: Refresh your browser at http://localhost:8080")
    print("You should see the exported UO character sprite!")

def update_asset_loader():
    """Update asset loader to use test sprites"""
    asset_loader_path = PROJECT_ROOT / "js" / "modules" / "assetLoader.js"
    
    if not asset_loader_path.exists():
        return
    
    with open(asset_loader_path, 'r') as f:
        content = f.read()
    
    # Update paths
    replacements = [
        ("'char_p1_idle': 'assets/sprites/characters/male/idle.png'",
         "'char_p1_idle': 'assets/sprites/characters/test/male_idle.png'"),
        ("'char_p2_idle': 'assets/sprites/characters/male/idle.png'",
         "'char_p2_idle': 'assets/sprites/characters/test/male_idle_p2.png'"),
    ]
    
    updated = False
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            updated = True
    
    if updated:
        with open(asset_loader_path, 'w') as f:
            f.write(content)
        print("[OK] Updated asset loader!")

if __name__ == "__main__":
    find_and_process()

