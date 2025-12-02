#!/usr/bin/env python3
"""
AUTO-WATCH folder and organize Equipment files automatically
"""

import time
import shutil
from pathlib import Path
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Paths
source = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
output_base = source / "running-halberd"
tracker_file = source / ".direction_tracker.json"

# Direction order: NE, E, SE, S, SW, W, NW, N
directions = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

class EquipmentHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing = False
        self.last_process_time = 0
        
    def on_created(self, event):
        # Trigger organization when files are created
        if not event.is_directory and 'Equipment' in event.src_path and event.src_path.endswith('.bmp'):
            print(f"\n📥 Detected: {Path(event.src_path).name}")
            # Wait a bit for all files to finish copying
            time.sleep(2)
            self.organize_files()
    
    def organize_files(self):
        # Prevent multiple simultaneous runs
        current_time = time.time()
        if self.processing or (current_time - self.last_process_time) < 5:
            return
        
        self.processing = True
        self.last_process_time = current_time
        
        try:
            # Find Equipment files
            all_files = list(source.glob('Equipment*.bmp'))
            numbered_files = sorted([f for f in all_files if '-' in f.stem])
            
            if len(numbered_files) < 5:  # Need at least a few files
                print(f"   Waiting for more files... ({len(numbered_files)} found)")
                self.processing = False
                return
            
            print(f"\n{'='*60}")
            print(f"  AUTO-ORGANIZING {len(numbered_files)} FRAMES")
            print(f"{'='*60}")
            
            # Load tracker
            if tracker_file.exists():
                with open(tracker_file, 'r') as f:
                    tracker = json.load(f)
                    current_index = tracker.get('current_index', 0)
            else:
                current_index = 0
            
            direction = directions[current_index]
            
            print(f"\n📂 Direction: {direction.upper()} ({current_index + 1}/8)")
            
            # Create target folder
            target_dir = output_base / direction
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy files
            for i, file in enumerate(numbered_files):
                target_file = target_dir / f"frame{i}.bmp"
                print(f"✅ {file.name} -> running-halberd/{direction}/frame{i}.bmp")
                shutil.copy(file, target_file)
            
            # Delete source files after copying
            for file in numbered_files:
                file.unlink()
            
            print(f"\n🎉 Organized {len(numbered_files)} frames into {direction}!")
            
            # Update tracker
            next_index = (current_index + 1) % 8
            next_direction = directions[next_index]
            
            with open(tracker_file, 'w') as f:
                json.dump({'current_index': next_index}, f)
            
            if next_index == 0:
                print("✅ That was NORTH! Cycle complete - reset to NORTHEAST.")
            else:
                print(f"➡️  NEXT export will auto-organize to: {next_direction.upper()}")
            
            print(f"\n{'='*60}")
            print("Watching for next export...")
            print(f"{'='*60}\n")
            
        finally:
            self.processing = False

print("=" * 60)
print("  AUTO-ORGANIZE WATCHER - RUNNING HALBERD")
print("=" * 60)
print()
print("👁️  Watching folder:")
print(f"   {source}")
print()
print("When you export Equipment files, they will AUTO-ORGANIZE!")
print()

# Load current position
if tracker_file.exists():
    with open(tracker_file, 'r') as f:
        tracker = json.load(f)
        current_index = tracker.get('current_index', 0)
else:
    current_index = 0

print(f"📍 Current position: {directions[current_index].upper()}")
print()
print("=" * 60)
print("READY - Waiting for files...")
print("Press Ctrl+C to stop")
print("=" * 60)
print()

# Start watching
event_handler = EquipmentHandler()
observer = Observer()
observer.schedule(event_handler, str(source), recursive=False)
observer.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n\nStopping watcher...")
    observer.stop()
    observer.join()
    print("Stopped!")

