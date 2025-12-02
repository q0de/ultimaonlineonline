"""
Watch for and automatically process halberd idle weapon animations
Runs continuously, checking for new Equipment 624 exports every 2 seconds
"""

from pathlib import Path
import time
import subprocess
import sys

EXPORT_BASE = Path('assets/sprites/animations')
SCRIPT_PATH = Path('process_halberd_idle_weapon.py')

def watch_and_process():
    """Watch for new Equipment 624 files and process them automatically."""
    print("=" * 60)
    print("HALBERD IDLE WEAPON ANIMATION WATCHER")
    print("=" * 60)
    print(f"Watching: {EXPORT_BASE}")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    last_file_count = 0
    
    while True:
        try:
            # Count unprocessed Equipment 624 files (exclude both idle and attack processed folders)
            unprocessed_files = [
                f for f in EXPORT_BASE.glob("Equipment 624-*.bmp")
                if (not f.parent.name.startswith('processed_halberd_idle_') and 
                    not f.parent.name.startswith('processed_halberd_weapon_'))
            ]
            current_file_count = len(unprocessed_files)
            
            # If new files detected, run the processor
            if current_file_count > last_file_count and current_file_count > 0:
                print(f"\n[INFO] Detected {current_file_count} new Equipment 624 file(s)")
                print("[INFO] Running processor...")
                
                # Run the processor script
                result = subprocess.run(
                    [sys.executable, str(SCRIPT_PATH)],
                    capture_output=True,
                    text=True
                )
                
                # Print output
                if result.stdout:
                    print(result.stdout)
                if result.stderr:
                    print(result.stderr)
                
                if result.returncode == 0:
                    print("[OK] Processing complete!")
                else:
                    print("[WARNING] Processing may have encountered issues")
                
                # Update file count
                last_file_count = len([
                    f for f in EXPORT_BASE.glob("Equipment 624-*.bmp")
                    if (not f.parent.name.startswith('processed_halberd_idle_') and 
                        not f.parent.name.startswith('processed_halberd_weapon_'))
                ])
            
            # Wait before checking again
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\n\n[INFO] Watcher stopped by user.")
            break
        except Exception as e:
            print(f"\n[ERROR] Unexpected error: {e}")
            time.sleep(2)

if __name__ == '__main__':
    watch_and_process()

