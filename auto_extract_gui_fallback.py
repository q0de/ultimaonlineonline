"""
GUI Automation Fallback for UO Animation Extraction
Uses pyautogui to automate UOFiddler GUI if Ultima.dll method fails
"""

import pyautogui
import time
from pathlib import Path
import subprocess
import sys

# Configuration
UOFIDDLER_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8")
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")

# Animation definitions: (body_id, action_id, direction, name)
ANIMATIONS_TO_EXTRACT = [
    (400, 3, 2, "male_idle"),
    (400, 9, 2, "male_attack_2h"),
    (400, 12, 2, "male_hit"),
    (400, 16, 2, "male_cast"),
    (400, 20, 2, "male_death"),
    (400, 0, 0, "male_walk_north"),
    (400, 0, 1, "male_walk_northeast"),
    (400, 0, 2, "male_walk_east"),
    (400, 0, 3, "male_walk_southeast"),
    (400, 0, 4, "male_walk_south"),
    (400, 0, 5, "male_walk_southwest"),
    (400, 0, 6, "male_walk_west"),
    (400, 0, 7, "male_walk_northwest"),
]

def check_dependencies():
    """Check if pyautogui is installed"""
    try:
        import pyautogui
        return True
    except ImportError:
        print("[ERROR] pyautogui not installed. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyautogui"])
        return True

def launch_uofiddler():
    """Launch UOFiddler"""
    uofiddler_exe = UOFIDDLER_PATH / "UoFiddler.exe"
    if not uofiddler_exe.exists():
        print(f"[ERROR] UOFiddler not found at: {uofiddler_exe}")
        return False
    
    print(f"[INFO] Launching UOFiddler...")
    subprocess.Popen([str(uofiddler_exe)])
    time.sleep(5)  # Wait for UOFiddler to load
    return True

def navigate_to_animation(body_id, action_id, direction):
    """Navigate UOFiddler to specific animation"""
    # This is a simplified version - actual implementation would need
    # to find UI elements and click them
    print(f"  [INFO] Navigating to Body {body_id}, Action {action_id}, Direction {direction}")
    print(f"  [NOTE] GUI automation requires manual setup of UI element positions")
    print(f"  [NOTE] Consider using the Ultima.dll method instead")
    return False

def export_animation(name):
    """Export current animation"""
    print(f"  [INFO] Exporting {name}...")
    # Right-click on animation preview
    # Select Export -> Export Frames
    # Save to OUTPUT_DIR
    return False

def main():
    """Main GUI automation function"""
    print("=" * 70)
    print("UOFiddler GUI Automation (Fallback Method)")
    print("=" * 70)
    print("\n[NOTE] GUI automation is complex and fragile.")
    print("[RECOMMENDED] Use auto_extract_all_animations.py (Ultima.dll method) instead.")
    print("\nThis script would require:")
    print("  1. Finding UI element positions")
    print("  2. Clicking through menus")
    print("  3. Handling file dialogs")
    print("  4. Error recovery")
    print("\nFor now, manual export via UOFiddler GUI is more reliable.")
    return False

if __name__ == "__main__":
    print("[INFO] GUI automation fallback - not fully implemented")
    print("[INFO] Please use auto_extract_all_animations.py instead")

