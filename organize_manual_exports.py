#!/usr/bin/env python3
"""
Organize manually captured frames into proper folder structure
Auto-organizes Equipment files by direction: NE, E, SE, S, SW, W, NW, N
"""

import os
import shutil
from pathlib import Path

# Look in multiple locations
current_dir = Path('.')
animations_dir = Path('assets/sprites/animations')
downloads = Path.home() / 'Downloads'

# Output to project root exports folder
output_base = Path('exports')

def organize_manual_frames():
    """Auto-organize frames using direction order: NE, E, SE, S, SW, W, NW, N"""
    
    print("═" * 60)
    print("  AUTO FRAME ORGANIZER - RUN HALBERD")
    print("═" * 60)
    print()
    
    # Direction mapping based on Equipment file order
    # Equipment 624-0.bmp = NE, 624-1.bmp = E, etc.
    direction_order = [
        'northeast',  # 0
        'east',       # 1
        'southeast',  # 2
        'south',      # 3
        'southwest',  # 4
        'west',       # 5
        'northwest',  # 6
        'north'       # 7
    ]
    
    # Auto-set for Run Halberd (user said they're doing these in order)
    animation = "running"
    weapon = "halberd"
    
    # Find Equipment BMP files - check multiple locations
    equipment_files = []
    search_location = ""
    
    # Check animations directory first (most likely location)
    if animations_dir.exists():
        equipment_files = sorted(animations_dir.glob('Equipment*.bmp'))
        if equipment_files:
            search_location = "assets/sprites/animations"
    
    # Check current directory
    if not equipment_files:
        equipment_files = sorted(current_dir.glob('Equipment*.bmp'))
        if equipment_files:
            search_location = "current directory"
    
    # Check Downloads folder
    if not equipment_files:
        equipment_files = sorted(downloads.glob('Equipment*.bmp'))
        if equipment_files:
            search_location = "Downloads folder"
    
    if not equipment_files:
        print("❌ No Equipment BMP files found!")
        print("   Searched:")
        print(f"   - {animations_dir.absolute()}")
        print(f"   - {current_dir.absolute()}")
        print(f"   - {downloads}")
        return
    
    print(f"📂 Found files in: {search_location}")
    
    print(f"📦 Found {len(equipment_files)} files: {equipment_files[0].name} to {equipment_files[-1].name}")
    print(f"🎯 Animation: {animation.upper()}")
    print(f"⚔️  Weapon: {weapon.upper()}")
    print(f"📂 Output: exports/{animation}-{weapon}/[direction]/")
    print()
    print("Direction order: NE → E → SE → S → SW → W → NW → N")
    print()
    
    # Determine if we have multiples of 8 (all directions) or just frames for one direction
    total_files = len(equipment_files)
    
    # Simplified folder structure: exports/running-halberd/northeast/
    export_folder_name = f"{animation}-{weapon}"
    
    if total_files % 8 == 0:
        # We have complete sets of all 8 directions
        frames_per_direction = total_files // 8
        print(f"✅ Detected {frames_per_direction} frame(s) × 8 directions = {total_files} files")
        print()
        print("⚡ Auto-organizing...")
        print()
        
        # Organize by direction sets
        for dir_idx, direction in enumerate(direction_order):
            # Create target folder: exports/running-halberd/northeast/
            target_folder = output_base / export_folder_name / direction
            target_folder.mkdir(parents=True, exist_ok=True)
            
            # Get files for this direction (every 8th file starting at dir_idx)
            direction_files = equipment_files[dir_idx::8]
            
            for frame_idx, file in enumerate(direction_files):
                new_name = f"frame{frame_idx}.bmp"
                target_path = target_folder / new_name
                
                shutil.move(str(file), str(target_path))
                print(f"✅ {file.name} → {export_folder_name}/{direction}/{new_name}")
        
        print()
        print(f"🎉 Organized {total_files} frames across 8 directions!")
        print(f"📁 Location: exports/{export_folder_name}/")
        
    else:
        # Not a multiple of 8 - assume they're all the same direction
        # Default to first direction in sequence (northeast)
        print(f"⚠️  You have {total_files} files (not 8)")
        print(f"📂 Organizing as NORTHEAST (first in sequence)")
        print()
        
        direction = "northeast"
        
        # Create target folder: exports/running-halberd/northeast/
        target_folder = output_base / export_folder_name / direction
        target_folder.mkdir(parents=True, exist_ok=True)
        
        # Move and rename files
        print("⚡ Auto-organizing...")
        print()
        for i, file in enumerate(equipment_files):
            new_name = f"frame{i}.bmp"
            target_path = target_folder / new_name
            
            shutil.move(str(file), str(target_path))
            print(f"✅ {file.name} → {export_folder_name}/{direction}/{new_name}")
        
        print()
        print(f"🎉 Organized {len(equipment_files)} frames!")
        print(f"📁 Location: exports/{export_folder_name}/{direction}/")

if __name__ == '__main__':
    try:
        organize_manual_frames()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    input("Press Enter to exit...")

