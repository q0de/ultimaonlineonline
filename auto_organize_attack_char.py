#!/usr/bin/env python3
"""
Auto-organize exported character attack bash 2h animations.
Watches for Mob 400-X.bmp files and organizes them into directional folders.
"""

import os
import sys
import time
import shutil
import json
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Project root
PROJECT_ROOT = Path(__file__).parent
ANIMATIONS_DIR = PROJECT_ROOT / "assets" / "sprites" / "animations"
STATE_FILE = ANIMATIONS_DIR / ".direction_tracker_attack_char.json"

# Direction order (user specified)
DIRECTIONS = [
    "northeast", "east", "southeast", "south",
    "southwest", "west", "northwest", "north"
]

# Target folder name
TARGET_FOLDER = "attack-bash-2h-char"

class AttackCharHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_processed = set()
        self.load_state()
        print(f"📦 Watching: {ANIMATIONS_DIR}")
        print(f"🎯 Current direction: {DIRECTIONS[self.current_index]} ({self.current_index + 1}/8)")
        print(f"🔄 Waiting for Mob 400-X.bmp files...")
    
    def load_state(self):
        """Load the current direction index from state file."""
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE, 'r') as f:
                    data = json.load(f)
                    self.current_index = data.get('current_index', 0)
                    print(f"📂 Resumed from: {DIRECTIONS[self.current_index]}")
            except:
                self.current_index = 0
        else:
            self.current_index = 0
    
    def save_state(self):
        """Save the current direction index to state file."""
        with open(STATE_FILE, 'w') as f:
            json.dump({'current_index': self.current_index}, f)
    
    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = Path(event.src_path)
        
        # Only process Mob 400-X.bmp files (not Mob 400.bmp without number)
        if filepath.name.startswith("Mob 400-") and filepath.name.endswith(".bmp"):
            # Wait a bit to ensure file is fully written
            time.sleep(0.5)
            
            # Avoid processing same file twice
            if filepath.name in self.last_processed:
                return
            
            self.process_file(filepath)
    
    def process_file(self, filepath):
        """Process a single BMP file."""
        try:
            # Get current direction
            direction = DIRECTIONS[self.current_index]
            
            # Create target directory
            target_dir = ANIMATIONS_DIR / TARGET_FOLDER / direction
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract frame number from filename (Mob 400-0.bmp -> 0)
            filename = filepath.name
            frame_num = filename.replace("Mob 400-", "").replace(".bmp", "")
            
            # New filename
            new_filename = f"frame{frame_num}.bmp"
            target_path = target_dir / new_filename
            
            # Copy file
            shutil.copy2(filepath, target_path)
            
            # Delete original
            filepath.unlink()
            
            print(f"✅ {direction}/frame{frame_num}.bmp")
            
            # Mark as processed
            self.last_processed.add(filepath.name)
            
            # Check if we have all frames for this direction (typically 7-10 frames)
            existing_frames = list(target_dir.glob("frame*.bmp"))
            if len(existing_frames) >= 7:  # Most attack animations have 7+ frames
                print(f"\n🎉 Direction complete: {direction} ({len(existing_frames)} frames)")
                
                # Move to next direction
                self.current_index += 1
                if self.current_index < len(DIRECTIONS):
                    self.save_state()
                    print(f"➡️  Next direction: {DIRECTIONS[self.current_index]} ({self.current_index + 1}/8)")
                    print(f"🔄 Ready for next export...\n")
                    self.last_processed.clear()
                else:
                    print("\n🎊 ALL DIRECTIONS COMPLETE!")
                    print(f"📁 Organized into: {ANIMATIONS_DIR / TARGET_FOLDER}")
                    print("✅ Character attack animations ready!")
                    self.save_state()
                    # Reset for next time
                    self.current_index = 0
                    self.save_state()
                    
        except Exception as e:
            print(f"❌ Error processing {filepath.name}: {e}")

def main():
    # Ensure watchdog is installed
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("📦 Installing watchdog...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog"])
        print("✅ Watchdog installed!")
    
    # Create animations directory if it doesn't exist
    ANIMATIONS_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("🎬 AUTO-ORGANIZE: Attack Bash 2H Character Animations")
    print("=" * 60)
    print(f"📂 Watching: {ANIMATIONS_DIR}")
    print(f"🎯 Target: {TARGET_FOLDER}/")
    print(f"📋 Directions: {', '.join(DIRECTIONS)}")
    print("=" * 60)
    print()
    
    # Set up file watcher
    event_handler = AttackCharHandler()
    observer = Observer()
    observer.schedule(event_handler, str(ANIMATIONS_DIR), recursive=False)
    observer.start()
    
    print("👁️  Watching for files... (Press Ctrl+C to stop)")
    print()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping watcher...")
        observer.stop()
    
    observer.join()
    print("✅ Done!")

if __name__ == "__main__":
    main()



