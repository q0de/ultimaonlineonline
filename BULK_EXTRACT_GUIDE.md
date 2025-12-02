# Bulk Extract Halberd Animations - Easy Method

## The Problem
You need to export **624 halberd animations** with all cardinal directions. Doing this manually in UOFiddler would take forever!

## ✅ Solution: Automated Script

I've created `bulk_extract_halberd_animations.py` that will automatically extract ALL animations for you!

### What It Extracts:
- **Body ID 400** (Male Human)
- **8 Actions**: Idle, Walk, Run, Attack 1H, Attack 2H (Halberd!), Get Hit, Death, Cast
- **8 Directions**: North, Northeast, East, Southeast, South, Southwest, West, Northwest
- **Total: 64 animations** (8 actions × 8 directions)

### How to Run:

1. **Install Python.NET** (if not already installed):
   ```bash
   pip install pythonnet
   ```

2. **Unblock Ultima.dll** (if needed):
   - Right-click `UOFiddler4.8\Ultima.dll`
   - Properties → Unblock → OK

3. **Run the script**:
   ```bash
   python bulk_extract_halberd_animations.py
   ```

4. **Output**:
   - All animations will be saved to `assets/sprites/animations/`
   - Organized by action and direction
   - Already converted to PNG sprite sheets with transparency!

### What You'll Get:

```
assets/sprites/animations/
├── attack_2h_north/
│   └── male_attack_2h_north_sheet.png
├── attack_2h_northeast/
│   └── male_attack_2h_northeast_sheet.png
├── attack_2h_east/
│   └── male_attack_2h_east_sheet.png
... (and so on for all 64 combinations)
```

## Alternative: If Script Doesn't Work

If the automated script has issues with Ultima.dll, you can:

1. **Use UOFiddler's Batch Export** (if available):
   - Some versions have batch export features
   - Check UOFiddler menu: File → Export → Batch Export Animations

2. **Use UOAnimTool**:
   - Download from: https://uoanim.sourceforge.net/
   - Can export animations in bulk
   - Supports multiple formats

3. **Manual but Faster Method**:
   - Export one action at a time (all 8 directions)
   - Use the processing scripts we already have
   - Still faster than 624 individual exports!

## Need Help?

If the script doesn't work, let me know and I can:
- Debug the Ultima.dll API calls
- Create an alternative method
- Help you set up UOAnimTool instead









