"""
Check what files UOFiddler exported and help process them
"""

from pathlib import Path
import os

# Common UOFiddler export locations
export_paths = [
    Path(r"C:\Users\micha\AppData\Roaming\UoFiddler\Mob"),
    Path(r"C:\Users\micha\AppData\Roaming\UoFiddler"),
    Path(r"C:\Users\micha\AppData\Local\UoFiddler"),
    Path.home() / "Desktop",
    Path.home() / "Documents",
]

def find_exported_files():
    """Find exported UO files"""
    print("=" * 60)
    print("Searching for exported UO files...")
    print("=" * 60)
    
    found_files = []
    
    for base_path in export_paths:
        if base_path.exists():
            print(f"\nChecking: {base_path}")
            
            # Look for BMP files with UO naming patterns
            patterns = ["400-*.bmp", "401-*.bmp", "*.bmp"]
            
            for pattern in patterns:
                files = list(base_path.rglob(pattern))
                if files:
                    print(f"  Found {len(files)} files matching {pattern}")
                    for f in files[:10]:  # Show first 10
                        print(f"    - {f.name} ({f.stat().st_size} bytes)")
                    found_files.extend(files)
    
    if not found_files:
        print("\n[INFO] No exported files found in common locations.")
        print("\nTo export animations properly:")
        print("1. In UOFiddler, right-click the ANIMATION PREVIEW")
        print("2. Select 'Export Animation' (not 'Export Image')")
        print("3. This should export ALL frames")
        print("\nOr manually export each frame:")
        print("- Use the frame navigation arrows")
        print("- Export each frame individually")
        print("- Save them all to one folder")
    else:
        print(f"\n[OK] Found {len(found_files)} exported files!")
        print("\nTo process these into a sprite sheet:")
        print("  python process_exported_frames.py <folder_path> output_name.png")
    
    return found_files

if __name__ == "__main__":
    find_exported_files()

