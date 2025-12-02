"""
Check what action the BMP files actually are
UOFiddler exports: Mob 400-{action}-{direction}-{frame}.bmp
"""

from pathlib import Path
import re

PROJECT_ROOT = Path(r"C:\Users\micha\Projects\utlima-onmind")
FRAMES_DIR = PROJECT_ROOT / "assets" / "sprites" / "characters" / "test"

# UO Actions
ACTIONS = {
    0: "Walk",
    3: "Idle/Stand",
    8: "Attack 1H",
    9: "Attack 2H",
    12: "Get Hit",
    13: "Attack Slash 2H",
    16: "Cast Spell",
    20: "Death"
}

# UO Directions
DIRECTIONS = {
    0: "North",
    1: "Northeast",
    2: "East",
    3: "Southeast",
    4: "South",
    5: "Southwest",
    6: "West",
    7: "Northwest"
}

print("=" * 70)
print("Checking BMP Files - What Actions Are They?")
print("=" * 70)

bmp_files = sorted(FRAMES_DIR.glob("Mob 400*.bmp"))

if not bmp_files:
    print("No BMP files found!")
else:
    print(f"\nFound {len(bmp_files)} BMP files:\n")
    
    # Group by action
    by_action = {}
    
    for bmp_file in bmp_files:
        name = bmp_file.name
        
        # Try full pattern: Mob 400-{action}-{direction}-{frame}.bmp
        match1 = re.match(r'Mob\s+400-(\d+)-(\d+)-(\d+)\.bmp', name)
        if match1:
            action = int(match1.group(1))
            direction = int(match1.group(2))
            frame = int(match1.group(3))
            if action not in by_action:
                by_action[action] = []
            by_action[action].append((direction, frame, name))
            continue
        
        # Try: Mob 400-{action}-{direction}.bmp
        match2 = re.match(r'Mob\s+400-(\d+)-(\d+)\.bmp', name)
        if match2:
            action = int(match2.group(1))
            direction = int(match2.group(2))
            if action not in by_action:
                by_action[action] = []
            by_action[action].append((direction, 0, name))
            continue
        
        # Try: Mob 400-{number}.bmp (could be action or direction)
        match3 = re.match(r'Mob\s+400-(\d+)\.bmp', name)
        if match3:
            number = int(match3.group(1))
            # If number < 8, it's likely a direction (Action 0 assumed)
            # If number >= 8, it might be an action
            if number < 8:
                action = 0  # Assume walking
                direction = number
                if action not in by_action:
                    by_action[action] = []
                by_action[action].append((direction, 0, name))
            else:
                # Could be action, but unclear - mark as unknown
                print(f"  [WARN] {name}: Ambiguous - could be Action {number} or Direction {number}")
            continue
        
        # Try: Mob 400.bmp (no action/direction specified)
        if name == "Mob 400.bmp":
            print(f"  [WARN] {name}: No action/direction specified")
    
    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY BY ACTION:")
    print("=" * 70)
    
    for action in sorted(by_action.keys()):
        action_name = ACTIONS.get(action, f"Unknown Action {action}")
        files = by_action[action]
        directions = set(f[0] for f in files)
        
        print(f"\nAction {action} ({action_name}):")
        print(f"  Files: {len(files)}")
        print(f"  Directions: {sorted(directions)}")
        print(f"  Sample files:")
        for direction, frame, name in files[:5]:
            dir_name = DIRECTIONS.get(direction, f"Dir {direction}")
            print(f"    - {name} (Direction {direction}: {dir_name}, Frame {frame})")
        if len(files) > 5:
            print(f"    ... and {len(files) - 5} more")
    
    # Check if we have walking (Action 0)
    if 0 in by_action:
        print("\n[OK] Found Action 0 (Walking) animations!")
    else:
        print("\n[ERROR] NO Action 0 (Walking) animations found!")
        print("   You need to export Action 0 from UOFiddler for walking animations.")
    
    # Check if we have attack (Action 9)
    if 9 in by_action:
        print("\n[WARN] Found Action 9 (Attack 2H) animations - these are NOT walking animations!")

if __name__ == "__main__":
    pass

