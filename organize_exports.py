#!/usr/bin/env python3
"""
Organize exported animation frames into folders
Moves files from Downloads into proper folder structure
"""

import os
import shutil
from pathlib import Path

# Get user's Downloads folder
downloads = Path.home() / 'Downloads'
output_base = Path('exports')

def organize_exports():
    """Find and organize all exported animation frames"""
    
    # Create base exports folder
    output_base.mkdir(exist_ok=True)
    
    # Find all exported files in Downloads
    exported_files = []
    for file in downloads.glob('*.bmp'):
        # Look for pattern: animation-weapon-direction-frameX.bmp
        if '-frame' in file.name:
            exported_files.append(file)
    
    if not exported_files:
        print("❌ No exported frames found in Downloads folder")
        print(f"   Looking for files like: running-halberd-north-frame0.bmp")
        return
    
    print(f"📦 Found {len(exported_files)} exported frames")
    print()
    
    # Organize each file
    moved_count = 0
    for file in exported_files:
        # Parse filename: animation-weapon-direction-frameX.png
        parts = file.stem.split('-')
        if len(parts) < 4:
            print(f"⚠️  Skipping invalid filename: {file.name}")
            continue
        
        # Extract parts
        animation = parts[0]  # e.g., "running"
        weapon = parts[1]     # e.g., "halberd"
        direction = parts[2]  # e.g., "north"
        frame_part = parts[3] # e.g., "frame0"
        
        # Create folder structure: exports/animation/weapon/direction/
        target_folder = output_base / animation / weapon / direction
        target_folder.mkdir(parents=True, exist_ok=True)
        
        # Rename to just frame0.bmp, frame1.bmp, etc.
        new_name = f"{frame_part}.bmp"
        target_path = target_folder / new_name
        
        # Move file
        shutil.move(str(file), str(target_path))
        print(f"✅ {file.name} → {animation}/{weapon}/{direction}/{new_name}")
        moved_count += 1
    
    print()
    print(f"🎉 Organized {moved_count} files into exports/ folder!")
    print()
    print("📁 Folder structure:")
    
    # Show the directory structure
    for animation_folder in sorted(output_base.iterdir()):
        if animation_folder.is_dir():
            print(f"   {animation_folder.name}/")
            for weapon_folder in sorted(animation_folder.iterdir()):
                if weapon_folder.is_dir():
                    print(f"      {weapon_folder.name}/")
                    for direction_folder in sorted(weapon_folder.iterdir()):
                        if direction_folder.is_dir():
                            frame_count = len(list(direction_folder.glob('*.bmp')))
                            print(f"         {direction_folder.name}/ ({frame_count} frames)")

if __name__ == '__main__':
    print("═" * 60)
    print("  ANIMATION FRAME ORGANIZER")
    print("═" * 60)
    print()
    
    try:
        organize_exports()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    input("Press Enter to exit...")

