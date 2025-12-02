"""
Export All Halberd Animations
Based on the animation list shown in UOFiddler/Animation tool
"""

# Animation mapping based on the list shown
HALBERD_ANIMATIONS = {
    # Movement
    0: {"name": "Walk_01", "action": 1, "description": "Walk"},
    1: {"name": "Walk_Staff_01", "action": 1, "description": "Walk with Staff"},
    2: {"name": "Run_01", "action": 2, "description": "Run"},
    3: {"name": "Run_Staff_01", "action": 2, "description": "Run with Staff"},
    
    # Idle
    4: {"name": "Idle_01", "action": 3, "description": "Idle"},
    5: {"name": "Idle_01_alt", "action": 3, "description": "Idle (alternate)"},
    6: {"name": "Fidget_Yawn_Stretch_01", "action": 3, "description": "Fidget"},
    
    # Combat Idle
    7: {"name": "CombatIdle_1H_01", "action": 3, "description": "Combat Idle 1H"},
    8: {"name": "CombatIdle_1H_01_alt", "action": 3, "description": "Combat Idle 1H (alternate)"},
    
    # Attacks
    9: {"name": "Attack_Slash_1H_01", "action": 8, "description": "Attack Slash 1H"},
    10: {"name": "Attack_Pierce_1H_01", "action": 8, "description": "Attack Pierce 1H"},
    11: {"name": "Attack_Bash_1H_01", "action": 8, "description": "Attack Bash 1H"},
    12: {"name": "Attack_Bash_2H_01", "action": 9, "description": "Attack Bash 2H"},
    13: {"name": "Attack_Slash_2H_01", "action": 9, "description": "Attack Slash 2H (HALBERD!)"},
    14: {"name": "Attack_Pierce_2H_01", "action": 9, "description": "Attack Pierce 2H"},
    15: {"name": "Combat_Advance_1H_01", "action": 8, "description": "Combat Advance 1H"},
    
    # Spells
    16: {"name": "Spell1", "action": 16, "description": "Spell 1"},
    17: {"name": "Spell2", "action": 16, "description": "Spell 2"},
    
    # Ranged
    18: {"name": "Attack_Bow_01", "action": 18, "description": "Attack Bow"},
    19: {"name": "Attack_Crossbow_01", "action": 19, "description": "Attack Crossbow"},
    
    # Reactions
    20: {"name": "GetHit_Fr_Hi_01", "action": 12, "description": "Get Hit"},
    21: {"name": "Die_Hard_Fwd_01", "action": 13, "description": "Die Forward"},
    22: {"name": "Die_Hard_Back_01", "action": 13, "description": "Die Backward"},
    
    # Mounted (probably not needed for halberd)
    23: {"name": "Horse_Walk_01", "action": 1, "description": "Horse Walk"},
    24: {"name": "Horse_Run_01", "action": 2, "description": "Horse Run"},
    25: {"name": "Horse_Idle_01", "action": 3, "description": "Horse Idle"},
    26: {"name": "Horse_Attack_1H_SlashRight_01", "action": 8, "description": "Horse Attack 1H"},
    27: {"name": "Horse_Attack_Bow_01", "action": 18, "description": "Horse Attack Bow"},
    28: {"name": "Horse_Attack_Crossbow_01", "action": 19, "description": "Horse Attack Crossbow"},
    29: {"name": "Horse_Attack_2H_SlashRight_01", "action": 9, "description": "Horse Attack 2H"},
    
    # Other
    30: {"name": "Block_Shield_Hard_01", "action": 20, "description": "Block Shield"},
    31: {"name": "Punch_Punch_Jab_01", "action": 8, "description": "Punch"},
    32: {"name": "Bow_Lesser_01", "action": 18, "description": "Bow"},
    33: {"name": "Salute_Armed_1H_01", "action": 3, "description": "Salute"},
    34: {"name": "Ingest_Eat_01", "action": 3, "description": "Eat"},
}

# Essential animations for halberd combat (prioritize these)
ESSENTIAL_ANIMATIONS = [
    13,  # Attack Slash 2H (HALBERD!)
    4,   # Idle
    0,   # Walk
    2,   # Run
    20,  # Get Hit
    21,  # Die Forward
    16,  # Spell 1
]

DIRECTIONS = {
    0: "north",
    1: "northeast",
    2: "east",
    3: "southeast",
    4: "south",
    5: "southwest",
    6: "west",
    7: "northwest"
}

def generate_export_guide():
    """Generate a guide for exporting all animations"""
    guide = []
    guide.append("# Halberd Animation Export Guide")
    guide.append("")
    guide.append("## Total Animations: 35 types × 8 directions = 280 animations")
    guide.append("")
    guide.append("## Essential Animations (Export These First):")
    guide.append("")
    
    for anim_id in ESSENTIAL_ANIMATIONS:
        anim = HALBERD_ANIMATIONS[anim_id]
        guide.append(f"### {anim['name']} ({anim['description']})")
        guide.append(f"- **UO Action ID:** {anim['action']}")
        guide.append(f"- **Export all 8 directions** (0-7)")
        guide.append(f"- **Save to:** `assets/sprites/animations/halberd_{anim['name'].lower()}/`")
        guide.append("")
    
    guide.append("## All Animations:")
    guide.append("")
    for anim_id, anim in HALBERD_ANIMATIONS.items():
        guide.append(f"{anim_id}. **{anim['name']}** - Action {anim['action']} - {anim['description']}")
    
    return "\n".join(guide)

def create_batch_processing_script():
    """Create a script to process exported animations"""
    script = '''"""
Process All Halberd Animations
Automatically processes exported animations from UOFiddler
"""

from pathlib import Path
from PIL import Image
import os

ANIMATIONS_DIR = Path(r"C:\\Users\\micha\\Projects\\utlima-onmind\\assets\\sprites\\animations")
OUTPUT_DIR = Path(r"C:\\Users\\micha\\Projects\\utlima-onmind\\assets\\sprites\\characters\\test")

def remove_white_background(img):
    """Remove white background"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def process_animation_directory(anim_dir):
    """Process all BMP files in a directory into a sprite sheet"""
    if not anim_dir.exists():
        return False
    
    bmp_files = sorted(anim_dir.glob("*.bmp"))
    if not bmp_files:
        return False
    
    frames = []
    for bmp_file in bmp_files:
        try:
            img = Image.open(bmp_file)
            img = remove_white_background(img)
            frames.append(img)
        except Exception as e:
            print(f"    [WARN] Failed to load {bmp_file.name}: {e}")
    
    if not frames:
        return False
    
    frame_width = max(img.width for img in frames)
    frame_height = max(img.height for img in frames)
    sheet_width = frame_width * len(frames)
    sheet_height = frame_height
    
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        x_offset = i * frame_width
        sprite_sheet.paste(frame, (x_offset, 0), frame)
    
    # Determine output filename
    dir_name = anim_dir.name.lower().replace('halberd_', 'male_').replace('_01', '')
    if not dir_name.endswith('_sheet'):
        dir_name += '_sheet'
    output_name = f"{dir_name}.png"
    
    output_path = OUTPUT_DIR / output_name
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite_sheet.save(output_path, 'PNG')
    
    print(f"  [OK] Processed {len(frames)} frames -> {output_name}")
    return True

def main():
    print("="*60)
    print("Processing All Halberd Animations")
    print("="*60)
    
    processed = 0
    for anim_dir in ANIMATIONS_DIR.iterdir():
        if anim_dir.is_dir() and 'halberd' in anim_dir.name.lower():
            print(f"\\nProcessing: {anim_dir.name}")
            if process_animation_directory(anim_dir):
                processed += 1
    
    print(f"\\nProcessed {processed} animations!")

if __name__ == "__main__":
    main()
'''
    return script

if __name__ == "__main__":
    # Generate export guide
    guide = generate_export_guide()
    with open("HALBERD_ANIMATIONS_EXPORT_GUIDE.md", "w", encoding="utf-8") as f:
        f.write(guide)
    print("[OK] Created HALBERD_ANIMATIONS_EXPORT_GUIDE.md")
    
    # Create processing script
    script = create_batch_processing_script()
    with open("process_all_halberd_animations.py", "w", encoding="utf-8") as f:
        f.write(script)
    print("[OK] Created process_all_halberd_animations.py")
    
    print("\n" + "="*60)
    print("Next Steps:")
    print("="*60)
    print("1. Read HALBERD_ANIMATIONS_EXPORT_GUIDE.md")
    print("2. Export animations from UOFiddler (35 types × 8 directions)")
    print("3. Run: python process_all_halberd_animations.py")
    print("="*60)









