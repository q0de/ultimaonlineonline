---
name: Fix Creature Targeting
overview: Wire up creature click detection so clicking on a creature targets it and triggers auto-swing attacks when in war mode.
todos:
  - id: wire-creature-click
    content: Add handleCreatureClick call in left-click handler before moveToTile
    status: completed
  - id: fix-return-value
    content: Make handleCreatureClick return true when creature is found
    status: completed
---

# Fix Creature Targeting and Auto-Swing

## Problem

The `handleCreatureClick()` function exists but is never called from the click handler. When clicking on the map, it moves the character without checking for creatures first.

## Solution

Integrate creature targeting into the left-click handler so:

1. Clicking on a creature selects it as target
2. Auto-swing attacks the target when in war mode and within range

## Changes

### 1. Update click handler to check for creatures first

In [terrain_generator_demo.html](terrain_generator_demo.html) around line 9449, add creature check before movement:

```javascript
// Check for creature click FIRST (targeting/attacking)
if (handleCreatureClick(tile.x, tile.y)) {
    return;
}
```

### 2. Fix handleCreatureClick return value

In [terrain_generator_demo.html](terrain_generator_demo.html) around line 8100, make the function return `true` when a creature is found so the click handler knows not to move:

```javascript
 selectedCreature = creature;
// ... existing targeting code ...
return true;  // Add this
```

## Files Modified

| File | Change |

|------|--------|

| `terrain_generator_demo.html` | Add creature check in click handler, fix return value |