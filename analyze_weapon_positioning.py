"""
Analyze weapon and character sprite dimensions to find optimal positioning
This helps research proper halberd alignment with character hands
"""

from pathlib import Path
from PIL import Image
import json

CHAR_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\characters\test")
WEAPON_DIR = Path(r"C:\Users\micha\Projects\utlima-onmind\assets\sprites\weapons")
OUTPUT_FILE = Path(r"C:\Users\micha\Projects\utlima-onmind\weapon_positioning_data.json")

def analyze_sprite_bounds(img):
    """Find the bounding box of non-transparent pixels"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    pixels = img.load()
    width, height = img.size
    
    # Find bounds
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 10:  # Non-transparent
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    
    if min_x >= max_x or min_y >= max_y:
        return None
    
    return {
        'bounds': {
            'left': min_x,
            'right': max_x,
            'top': min_y,
            'bottom': max_y
        },
        'size': {
            'width': max_x - min_x + 1,
            'height': max_y - min_y + 1
        },
        'center': {
            'x': (min_x + max_x) // 2,
            'y': (min_y + max_y) // 2
        }
    }

def estimate_hand_position(char_analysis):
    """Estimate hand position based on character sprite"""
    if not char_analysis:
        return None
    
    bounds = char_analysis['bounds']
    height = char_analysis['size']['height']
    
    # In UO sprites, hands are typically around 30-35% down from top
    # For a 2H weapon like halberd, character holds it with both hands
    # Right hand is around 30-35% down, left hand is around 40-45% down
    
    estimated_hand_y = bounds['top'] + int(height * 0.32)  # 32% down
    estimated_hand_x = bounds['left'] + (char_analysis['size']['width'] // 2)  # Center
    
    return {
        'x': estimated_hand_x,
        'y': estimated_hand_y,
        'percent_from_top': 0.32
    }

def analyze_animation_frame(image_path, frame_index=0, total_frames=1):
    """Analyze a single frame from a sprite sheet"""
    if not image_path.exists():
        return None
    
    try:
        img = Image.open(image_path)
        width = img.width
        height = img.height
        
        # Calculate frame width
        frame_width = width // total_frames if total_frames > 0 else width
        
        # Extract the specific frame
        if total_frames > 1:
            frame_x = frame_index * frame_width
            frame = img.crop((frame_x, 0, frame_x + frame_width, height))
        else:
            frame = img
        
        # Analyze bounds
        analysis = analyze_sprite_bounds(frame)
        if not analysis:
            return None
        
        analysis['sprite_info'] = {
            'full_width': width,
            'full_height': height,
            'frame_width': frame_width,
            'frame_count': total_frames,
            'frame_index': frame_index
        }
        
        return analysis
    except Exception as e:
        print(f"Error analyzing {image_path}: {e}")
        return None

def main():
    print("="*80)
    print("UO Weapon Positioning Analysis")
    print("="*80)
    
    results = {
        'character_animations': {},
        'weapon_animations': {},
        'recommendations': {}
    }
    
    # Analyze character idle sprite (single frame)
    print("\nAnalyzing character sprites...")
    char_idle_east = CHAR_DIR / "male_idle_east_sheet.png"
    if char_idle_east.exists():
        analysis = analyze_animation_frame(char_idle_east, 0, 1)
        if analysis:
            results['character_animations']['idle_east'] = analysis
            hand_pos = estimate_hand_position(analysis)
            results['character_animations']['idle_east']['estimated_hand'] = hand_pos
            print(f"  [OK] Idle East: {analysis['size']['width']}x{analysis['size']['height']} px")
            print(f"       Estimated hand position: ({hand_pos['x']}, {hand_pos['y']}) - {hand_pos['percent_from_top']*100:.1f}% down")
    
    # Analyze walking sprite (frame 0 of 10)
    char_walk_east = CHAR_DIR / "male_walk_east_sheet.png"
    if char_walk_east.exists():
        analysis = analyze_animation_frame(char_walk_east, 0, 10)
        if analysis:
            results['character_animations']['walk_east_frame0'] = analysis
            hand_pos = estimate_hand_position(analysis)
            results['character_animations']['walk_east_frame0']['estimated_hand'] = hand_pos
            print(f"  [OK] Walk East (frame 0): {analysis['size']['width']}x{analysis['size']['height']} px")
            print(f"       Estimated hand position: ({hand_pos['x']}, {hand_pos['y']}) - {hand_pos['percent_from_top']*100:.1f}% down")
    
    # Analyze weapon sprites
    print("\nAnalyzing weapon sprites...")
    
    # Halberd idle
    halberd_idle_east = WEAPON_DIR / "halberd_idle_east_sheet.png"
    if halberd_idle_east.exists():
        analysis = analyze_animation_frame(halberd_idle_east, 0, 1)
        if analysis:
            results['weapon_animations']['halberd_idle_east'] = analysis
            print(f"  [OK] Halberd Idle East: {analysis['size']['width']}x{analysis['size']['height']} px")
            print(f"       Center: ({analysis['center']['x']}, {analysis['center']['y']})")
    
    # Halberd attack (frame 0 of 10)
    halberd_weapon_east = WEAPON_DIR / "halberd_weapon_east_sheet.png"
    if halberd_weapon_east.exists():
        analysis = analyze_animation_frame(halberd_weapon_east, 0, 10)
        if analysis:
            results['weapon_animations']['halberd_weapon_east_frame0'] = analysis
            print(f"  [OK] Halberd Attack East (frame 0): {analysis['size']['width']}x{analysis['size']['height']} px")
            print(f"       Center: ({analysis['center']['x']}, {analysis['center']['y']})")
    
    # Calculate recommendations
    print("\n" + "="*80)
    print("POSITIONING RECOMMENDATIONS")
    print("="*80)
    
    if 'idle_east' in results['character_animations'] and 'halberd_idle_east' in results['weapon_animations']:
        char = results['character_animations']['idle_east']
        weapon = results['weapon_animations']['halberd_idle_east']
        hand = char.get('estimated_hand', {})
        
        # Calculate offset needed to position weapon at hand
        # Character is drawn at scale 1.5x, weapon is also drawn at scale 1.5x
        scale = 1.5
        
        # Weapon should be positioned so its grip point aligns with the hand
        # For a halberd, the grip is typically at the bottom 1/3 of the weapon
        weapon_grip_percent = 0.65  # 65% down the weapon (lower third)
        weapon_grip_y = weapon['bounds']['top'] + int(weapon['size']['height'] * weapon_grip_percent)
        
        # Calculate offsets
        offset_x = 0  # Horizontal offset (adjust if weapon needs to be left/right)
        offset_y = hand['y'] - weapon_grip_y  # Vertical offset to align grip with hand
        
        print(f"\nFor IDLE animations:")
        print(f"  Character hand position: Y = {hand['y']} ({hand['percent_from_top']*100:.1f}% from top)")
        print(f"  Weapon grip point: Y = {weapon_grip_y} ({weapon_grip_percent*100:.1f}% from top)")
        print(f"  Recommended offsetY: {offset_y} pixels")
        print(f"  Recommended offsetX: {offset_x} pixels")
        print(f"  Recommended hand percent: {hand['percent_from_top']*100:.1f}%")
        
        results['recommendations']['idle'] = {
            'offsetX': offset_x,
            'offsetY': offset_y,
            'handPercent': hand['percent_from_top'],
            'weaponGripPercent': weapon_grip_percent
        }
        
        print(f"\nTo apply in-game:")
        print(f"  1. Press F1 to enable debug mode")
        print(f"  2. Use Arrow Up/Down to set offsetY to {offset_y}")
        print(f"  3. Use Ctrl+Q/E to set hand position to {hand['percent_from_top']*100:.1f}%")
    
    # Save results
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n" + "="*80)
    print(f"Analysis saved to: {OUTPUT_FILE}")
    print("="*80)
    
    print("\nNext steps:")
    print("  1. Review the recommendations above")
    print("  2. Open the game and press F1 to enable debug mode")
    print("  3. Adjust weapon positioning using the recommended values")
    print("  4. Test with different animations (walk, run, attack)")
    print("  5. Fine-tune as needed")

if __name__ == "__main__":
    main()

