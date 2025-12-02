#!/usr/bin/env python3
"""
Organize Equipment files - CHOOSE which direction
"""

import shutil
from pathlib import Path
import json

# Paths
source = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")
output_base = source / "running-halberd"
tracker_file = source / ".direction_tracker.json"

# Direction order: NE, E, SE, S, SW, W, NW, N
directions = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north']

print("=" * 60)
print("  AUTO-ORGANIZE RUNNING HALBERD FRAMES")
print("=" * 60)
print()

# Find Equipment files
all_files = list(source.glob('Equipment*.bmp'))
numbered_files = sorted([f for f in all_files if '-' in f.stem])

if not numbered_files:
    print("❌ No Equipment files found!")
    input("\nPress Enter...")
    exit()

print(f"📦 Found {len(numbered_files)} frames: {numbered_files[0].name} to {numbered_files[-1].name}")
print()

# Show direction options
print("DIRECTIONS:")
for i, d in enumerate(directions):
    print(f"  {i}: {d.upper()}")
print()

# Load last used direction
if tracker_file.exists():
    with open(tracker_file, 'r') as f:
        tracker = json.load(f)
        last_index = tracker.get('current_index', 0)
        suggested = directions[last_index]
else:
    last_index = 0
    suggested = directions[0]

# Ask user
print(f"💡 Suggested: {suggested.upper()} (press Enter)")
choice = input(f"Choose direction (0-7 or name) [{suggested}]: ").strip().lower()

# Parse choice
if not choice:
    # Use suggested
    direction = suggested
    current_index = last_index
elif choice.isdigit():
    # Number chosen
    current_index = int(choice)
    if 0 <= current_index < 8:
        direction = directions[current_index]
    else:
        print("Invalid number, using suggested")
        direction = suggested
        current_index = last_index
else:
    # Direction name chosen
    if choice in directions:
        direction = choice
        current_index = directions.index(choice)
    else:
        print("Invalid name, using suggested")
        direction = suggested
        current_index = last_index

print()
print(f"📂 Organizing into: {direction.upper()}")
print()

# Create target folder
target_dir = output_base / direction
target_dir.mkdir(parents=True, exist_ok=True)

# Copy all files to this direction folder
for i, file in enumerate(numbered_files):
    target_file = target_dir / f"frame{i}.bmp"
    print(f"✅ {file.name} -> running-halberd/{direction}/frame{i}.bmp")
    shutil.copy(file, target_file)

print()
print(f"🎉 Organized {len(numbered_files)} frames into {direction}!")
print(f"📁 Location: {target_dir}")
print()

# Save next direction as suggestion
next_index = (current_index + 1) % 8
next_direction = directions[next_index]

with open(tracker_file, 'w') as f:
    json.dump({'current_index': next_index}, f)

if next_index == 0:
    print("✅ That was NORTH (last direction)! Cycle complete - reset to NORTHEAST.")
else:
    print(f"➡️  NEXT TIME suggested: {next_direction.upper()}")

print()
print("⚠️  NOTE: You must RUN THIS SCRIPT each time after exporting!")
print("   (It does NOT auto-watch the folder)")
print()
input("Press Enter...")
