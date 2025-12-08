"""
Extract All UO Creature Animations
Batch extracts sprites for multiple creature types from UO client files

API: GetAnimation(body, action, direction, hue) returns Frame[]
Each Frame has a Bitmap property
"""

import clr
import sys
from pathlib import Path
from PIL import Image
import io
import os

# Add UOFiddler path
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

# Creature definitions
# Body IDs from UO client files
CREATURES = {
    'orc': {
        'body_id': 7,
        'name': 'Orc',
    },
    'orc_captain': {
        'body_id': 8,
        'name': 'Orc Captain',
    },
    'orc_lord': {
        'body_id': 9,
        'name': 'Orc Lord',
    },
    'ogre': {
        'body_id': 17,
        'name': 'Ogre',
    },
    'ettin': {
        'body_id': 20,
        'name': 'Ettin',
    },
    'skeleton': {
        'body_id': 50,
        'name': 'Skeleton',
    },
    'zombie': {
        'body_id': 3,
        'name': 'Zombie',
    },
    'troll': {
        'body_id': 54,
        'name': 'Troll',
    },
    'lich': {
        'body_id': 24,
        'name': 'Lich',
    },
    'daemon': {
        'body_id': 9,
        'name': 'Daemon',
    },
    'dragon': {
        'body_id': 59,
        'name': 'Dragon',
    },
    'gazer': {
        'body_id': 22,
        'name': 'Gazer',
    },
    'harpy': {
        'body_id': 73,
        'name': 'Harpy',
    },
    'headless': {
        'body_id': 31,
        'name': 'Headless',
    },
    'lizardman': {
        'body_id': 35,
        'name': 'Lizardman',
    },
    'ratman': {
        'body_id': 44,
        'name': 'Ratman',
    },
    'reaper': {
        'body_id': 47,
        'name': 'Reaper',
    },
    'scorpion': {
        'body_id': 48,
        'name': 'Scorpion',
    },
    'slime': {
        'body_id': 51,
        'name': 'Slime',
    },
    'spider': {
        'body_id': 28,
        'name': 'Giant Spider',
    },
    'earth_elemental': {
        'body_id': 14,
        'name': 'Earth Elemental',
    },
    'fire_elemental': {
        'body_id': 15,
        'name': 'Fire Elemental',
    },
    'water_elemental': {
        'body_id': 16,
        'name': 'Water Elemental',
    },
    'air_elemental': {
        'body_id': 13,
        'name': 'Air Elemental',
    },
}

# Monster action IDs
MONSTER_ACTIONS = {
    0: 'walk',      # Walk animation
    1: 'idle',      # Idle/stand
    2: 'death',     # Die (fall back)
    3: 'death2',    # Die (fall forward) - optional
    4: 'attack1',   # Attack 1
    5: 'attack2',   # Attack 2
    6: 'attack3',   # Attack 3 - optional
    10: 'hit',      # Get hit (some creatures use action 10)
}

# Direction names
# UO directions: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']


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


def extract_animation_frames(body_id, action_id, direction, output_dir):
    """
    Extract animation frames for a body/action/direction
    
    API: GetAnimation(body, action, direction, hue) returns Frame[]
    Each Frame has a Bitmap property
    """
    try:
        frames = []
        
        # Use the correct API: GetAnimation(body, action, direction, hue)
        anim_frames = Ultima.Animations.GetAnimation(body_id, action_id, direction, 0)
        
        if anim_frames is None or len(anim_frames) == 0:
            return []
        
        frame_count = len(anim_frames)
        
        for frame_idx in range(frame_count):
            try:
                frame = anim_frames[frame_idx]
                
                if frame is None or frame.Bitmap is None:
                    continue
                    
                bitmap = frame.Bitmap
                pil_img = bitmap_to_pil(bitmap)
                
                if pil_img:
                    frames.append(pil_img)
                    
                    # Save individual frame
                    frame_path = output_dir / f"Mob {body_id}-{frame_idx}.bmp"
                    pil_img.save(frame_path, "BMP")
                        
            except Exception as e:
                continue
        
        return frames
        
    except Exception as e:
        return []


def extract_creature(creature_key, creature_info):
    """Extract all animations for a creature"""
    body_id = creature_info['body_id']
    name = creature_info['name']
    
    print(f"\n{'='*50}")
    print(f"Extracting {name} (Body ID: {body_id})")
    print(f"{'='*50}")
    
    total_extracted = 0
    
    for action_id, action_name in MONSTER_ACTIONS.items():
        action_frames = 0
        
        for dir_idx, dir_name in enumerate(DIRECTIONS):
            # Create output directory
            output_dir = OUTPUT_PATH / f"{creature_key}_{action_name}_{dir_name}"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            frames = extract_animation_frames(body_id, action_id, dir_idx, output_dir)
            
            if frames:
                action_frames += len(frames)
        
        if action_frames > 0:
            print(f"  ✓ {action_name}: {action_frames} frames")
            total_extracted += action_frames
    
    return total_extracted


def main():
    print("=" * 60)
    print("UO Creature Animation Batch Extractor")
    print("=" * 60)
    
    if not setup_uo_path():
        return
    
    # Verify animations are loaded
    try:
        Ultima.Animations.Reload()
        print("[OK] Animations loaded")
    except Exception as e:
        print(f"[ERROR] Failed to load animations: {e}")
        return
    
    # Which creatures to extract (can be filtered)
    creatures_to_extract = ['orc', 'ettin', 'skeleton', 'troll', 'ogre', 'zombie']
    
    grand_total = 0
    
    for creature_key in creatures_to_extract:
        if creature_key in CREATURES:
            total = extract_creature(creature_key, CREATURES[creature_key])
            grand_total += total
            print(f"  Total for {CREATURES[creature_key]['name']}: {total} frames")
    
    print("\n" + "=" * 60)
    print(f"Batch extraction complete!")
    print(f"Grand total: {grand_total} frames")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()



