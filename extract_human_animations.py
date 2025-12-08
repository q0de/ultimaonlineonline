"""
Extract ALL Human Character Animations from UO Client
Includes: walk, run, idle, attacks (melee/ranged), spells, hit, death, etc.
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io
import os

# Paths
UOFIDDLER_PATH = r"C:\Users\micha\Projects\utlima-onmind\UOFiddler4.8"
UO_CLIENT_PATH = r"C:\Program Files (x86)\Electronic Arts\Ultima Online Classic"
OUTPUT_PATH = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\animations")

sys.path.append(UOFIDDLER_PATH)

try:
    clr.AddReference(str(Path(UOFIDDLER_PATH) / "Ultima.dll"))
    clr.AddReference("System.Drawing")
    clr.AddReference("System.IO")
    import Ultima
    import System
    import System.Drawing
    import System.IO
    print("[OK] Loaded Ultima.dll successfully!")
except Exception as e:
    print(f"[ERROR] Failed to load Ultima.dll: {e}")
    sys.exit(1)

def setup_uo_path():
    """Set UO client path"""
    try:
        Ultima.Files.SetMulPath(UO_CLIENT_PATH)
        print(f"[OK] Set UO path to: {UO_CLIENT_PATH}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to set UO path: {e}")
        return False

def bitmap_to_pil(bitmap):
    """Convert .NET Bitmap to PIL Image"""
    try:
        if bitmap is None:
            return None
            
        ms = System.IO.MemoryStream()
        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png)
        ms.Seek(0, System.IO.SeekOrigin.Begin)
        
        buffer = System.Array.CreateInstance(System.Byte, ms.Length)
        ms.Read(buffer, 0, ms.Length)
        
        img_bytes = bytes(buffer)
        return Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        print(f"[ERROR] Bitmap conversion failed: {e}")
        return None

def extract_animation_frames(body_id, action_id, direction, hue=0):
    """
    Extract animation frames using GetAnimation API
    
    Returns list of PIL Images for each frame
    """
    try:
        # Use GetAnimation(body, action, direction, hue) - returns Frame[]
        anim_frames = Ultima.Animations.GetAnimation(body_id, action_id, direction, hue)
        
        if anim_frames is None:
            return []
        
        frames = []
        frame_count = len(anim_frames)
        
        for frame_idx in range(frame_count):
            try:
                frame = anim_frames[frame_idx]
                bitmap = frame.Bitmap
                
                if bitmap is not None:
                    img = bitmap_to_pil(bitmap)
                    if img:
                        frames.append(img)
            except Exception as e:
                continue
        
        return frames
    except Exception as e:
        print(f"  [ERROR] Failed to extract animation: {e}")
        return []

def save_frames_to_folder(frames, folder_path):
    """Save individual frames to a folder"""
    if not frames:
        return False
    
    folder_path = Path(folder_path)
    folder_path.mkdir(parents=True, exist_ok=True)
    
    for i, frame in enumerate(frames):
        frame_path = folder_path / f"frame_{i:03d}.png"
        frame.save(frame_path)
    
    return True

# UO Direction mapping
DIRECTIONS = {
    0: 'n',   # North
    1: 'ne',  # Northeast
    2: 'e',   # East
    3: 'se',  # Southeast
    4: 's',   # South
    5: 'sw',  # Southwest
    6: 'w',   # West
    7: 'nw'   # Northwest
}

# Human Animation Actions (Body 400 = Male, 401 = Female)
# These are the standard human animation action IDs
HUMAN_ACTIONS = {
    # Movement
    0: 'walk_unarmed',
    1: 'walk_armed',
    2: 'run_unarmed', 
    3: 'run_armed',
    
    # Standing/Idle
    4: 'stand',
    5: 'fidget1',
    6: 'fidget2',
    7: 'stand_1h_ready',    # Standing with 1-handed weapon ready
    8: 'stand_2h_ready',    # Standing with 2-handed weapon ready
    
    # Melee Attacks
    9: 'attack_slash_1h',   # One-handed slashing attack
    10: 'attack_pierce_1h', # One-handed piercing/stabbing attack
    11: 'attack_bash_1h',   # One-handed bashing attack
    12: 'attack_slash_2h',  # Two-handed slashing attack
    13: 'attack_pierce_2h', # Two-handed piercing attack
    14: 'attack_bash_2h',   # Two-handed bashing attack (like halberd)
    
    # Combat Reactions
    15: 'hit_high',         # Get hit from above/high
    16: 'hit_low',          # Get hit from below/low
    17: 'block',            # Block/Parry animation
    
    # Ranged Attacks
    18: 'attack_bow',       # Bow attack
    19: 'attack_xbow',      # Crossbow attack
    
    # Death
    20: 'death_backward',   # Fall backward death
    21: 'death_forward',    # Fall forward death
    
    # Magic/Spells
    22: 'cast_area',        # Area effect spell cast
    23: 'cast_directed',    # Directed spell cast (at target)
    24: 'cast_summon',      # Summon/self spell cast
    
    # Emotes/Actions
    25: 'salute',           # Salute emote
    26: 'bow',              # Bow emote
    27: 'eat',              # Eating animation
    28: 'drink',            # Drinking animation
}

def main():
    print("=" * 70)
    print("UO HUMAN CHARACTER ANIMATION EXTRACTOR")
    print("=" * 70)
    
    if not setup_uo_path():
        return
    
    # Create output directory
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Which body to use (400 = male, 401 = female)
    body_id = 400  # Male human
    
    # Animations we want to extract (most important for gameplay)
    animations_to_extract = [
        # Core animations
        (4, 'idle'),              # Standing idle
        (0, 'walk'),              # Walking
        (2, 'run'),               # Running
        
        # Melee Attacks - ALL types for variety
        (9, 'attack_slash_1h'),   # One-handed slash
        (10, 'attack_pierce_1h'), # One-handed pierce/stab
        (11, 'attack_bash_1h'),   # One-handed bash
        (12, 'attack_slash_2h'),  # Two-handed slash
        (13, 'attack_pierce_2h'), # Two-handed pierce
        (14, 'attack_bash_2h'),   # Two-handed bash (halberd swing)
        
        # Combat reactions
        (15, 'hit'),              # Get hit
        (17, 'block'),            # Block/parry
        
        # Death animations
        (20, 'death_back'),       # Fall backward
        (21, 'death_forward'),    # Fall forward
        
        # Spell casting - ALL types
        (22, 'cast_area'),        # Area spell
        (23, 'cast_directed'),    # Targeted spell (fireball, etc)
        (24, 'cast_summon'),      # Summon/self spell
        
        # Ranged attacks
        (18, 'attack_bow'),       # Bow
        (19, 'attack_xbow'),      # Crossbow
        
        # Ready stances
        (7, 'ready_1h'),          # 1-handed weapon ready
        (8, 'ready_2h'),          # 2-handed weapon ready
        
        # Armed movement
        (1, 'walk_armed'),        # Walk with weapon
        (3, 'run_armed'),         # Run with weapon
    ]
    
    total_extracted = 0
    failed = []
    
    print(f"\nExtracting {len(animations_to_extract)} animation types x 8 directions...")
    print("-" * 70)
    
    for action_id, action_name in animations_to_extract:
        print(f"\n📂 {action_name.upper()} (Action {action_id}):")
        
        action_success = 0
        for dir_id, dir_name in DIRECTIONS.items():
            folder_name = f"human_{action_name}_{dir_name}"
            folder_path = OUTPUT_PATH / folder_name
            
            frames = extract_animation_frames(body_id, action_id, dir_id)
            
            if frames:
                save_frames_to_folder(frames, folder_path)
                print(f"   ✅ {dir_name}: {len(frames)} frames")
                action_success += 1
                total_extracted += len(frames)
            else:
                print(f"   ❌ {dir_name}: No frames")
        
        if action_success < 8:
            failed.append(f"{action_name} ({action_success}/8 directions)")
    
    print("\n" + "=" * 70)
    print(f"EXTRACTION COMPLETE!")
    print(f"Total frames extracted: {total_extracted}")
    print(f"Output directory: {OUTPUT_PATH}")
    
    if failed:
        print(f"\n⚠️  Partial failures:")
        for f in failed:
            print(f"   - {f}")
    
    print("=" * 70)

if __name__ == "__main__":
    main()



