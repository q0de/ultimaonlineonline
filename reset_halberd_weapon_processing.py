"""
Reset Halberd Weapon Processing - Start Fresh
Moves all processed files back to root for reprocessing
"""

from pathlib import Path
import shutil

EXPORT_BASE = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

def reset_processing():
    """Move all processed files back to root"""
    print("="*60)
    print("Resetting Halberd Weapon Processing")
    print("="*60)
    
    # Find all processed folders
    processed_folders = [d for d in EXPORT_BASE.iterdir() 
                        if d.is_dir() and d.name.startswith('processed_halberd_weapon_')]
    
    if not processed_folders:
        print("\n[INFO] No processed folders found - nothing to reset")
        return
    
    print(f"\n[INFO] Found {len(processed_folders)} processed folders")
    
    moved_count = 0
    for folder in processed_folders:
        print(f"\nProcessing: {folder.name}")
        bmp_files = list(folder.glob("Equipment 624*.bmp")) + list(folder.glob("Equipment 624*.BMP"))
        
        for bmp_file in bmp_files:
            dest = EXPORT_BASE / bmp_file.name
            # If file already exists in root, skip or rename
            if dest.exists():
                # Add folder name prefix to avoid conflicts
                dest = EXPORT_BASE / f"{folder.name}_{bmp_file.name}"
            
            shutil.move(str(bmp_file), str(dest))
            moved_count += 1
        
        # Remove empty folder
        try:
            folder.rmdir()
            print(f"  [OK] Moved {len(bmp_files)} files, removed folder")
        except:
            print(f"  [WARN] Could not remove folder (may not be empty)")
    
    print("\n" + "="*60)
    print(f"Reset complete!")
    print(f"  Moved {moved_count} files back to root")
    print(f"  Removed {len(processed_folders)} processed folders")
    print("\n[INFO] You can now start fresh with the export process")
    print("="*60)

if __name__ == "__main__":
    response = input("\nThis will move all processed files back to root. Continue? (y/n): ")
    if response.lower() == 'y':
        reset_processing()
    else:
        print("Cancelled.")









