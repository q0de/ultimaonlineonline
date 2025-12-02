/**
 * USER TILE CORRECTIONS V2 - Comprehensive Natural Terrain Transitions
 * 
 * Generated from user paint corrections on 2025-11-28
 * 
 * KEY INSIGHT: Natural terrain uses SEQUENCES of tiles, not just single transitions!
 * The user demonstrated smooth diagonal blends using multiple tile series.
 */

// ============================================================================
// NEW TILE SERIES DISCOVERED - SMOOTH DIAGONAL TRANSITIONS (0x03B7-0x03C6)
// ============================================================================
// These tiles create natural curved/diagonal transitions between grass and sand
// They are MORE NATURAL than the basic edge tiles (0x0037-0x003E)

export const SMOOTH_DIAGONAL_TILES = {
    // These go on the SAND side of diagonal grass-sand boundaries
    // They create smooth curves instead of staircase patterns
    '0x03B7': { description: 'Smooth diagonal - grass TL to sand BR', grassSide: 'top-left' },
    '0x03B9': { description: 'Smooth diagonal variant', grassSide: 'top-left' },
    '0x03BA': { description: 'Smooth diagonal variant', grassSide: 'top-right' },
    '0x03BB': { description: 'Smooth diagonal - grass TL corner', grassSide: 'top-left' },
    '0x03BC': { description: 'Smooth diagonal - grass TL edge', grassSide: 'top-left' },
    '0x03BD': { description: 'Smooth diagonal - grass RIGHT edge', grassSide: 'right' },
    '0x03C0': { description: 'Smooth diagonal - grass TR to sand BL', grassSide: 'top-right' },
    '0x03C1': { description: 'Smooth diagonal variant', grassSide: 'top-right' },
    '0x03C2': { description: 'Smooth diagonal - grass TR corner', grassSide: 'top-right' },
    '0x03C4': { description: 'Smooth diagonal - grass TL to sand BR', grassSide: 'top-left' },
    '0x03C5': { description: 'Smooth diagonal - grass LEFT edge', grassSide: 'left' },
    '0x03C6': { description: 'Smooth diagonal variant', grassSide: 'left' },
};

// ============================================================================
// GRASS TRANSITION TILES (0x01A5-0x01AB) - Go on GRASS tiles near sand
// ============================================================================
// These are GRASS tiles that have subtle sand coloring to blend better

export const GRASS_TRANSITION_SERIES = {
    '0x01A5': { description: 'Grass with sand hint - general use', position: 'any diagonal' },
    '0x01A6': { description: 'Grass with sand hint - BR diagonal', position: 'bottom-right' },
    '0x01A7': { description: 'Grass with sand hint - BR diagonal variant', position: 'bottom-right' },
    '0x01A8': { description: 'Grass with sand hint - corner transition', position: 'corner' },
    '0x01A9': { description: 'Grass with sand hint - BL diagonal', position: 'bottom-left' },
    '0x01AA': { description: 'Grass with sand hint - BR corner', position: 'bottom-right' },
    '0x01AB': { description: 'Grass with sand hint - edge blend', position: 'edge' },
};

// ============================================================================
// SPECIAL GRASS TILES - Subtle sand hints for feathered edges
// ============================================================================

export const FEATHERED_GRASS_TILES = {
    '0x0375': { description: 'Grass with very subtle sand - edge feathering' },
    '0x037E': { description: 'Grass with subtle sand corner hint' },
    '0x0684': { description: 'Grass with distant sand influence' },
    '0x012A': { description: 'Grass-sand blend - inner area' },
    '0x012C': { description: 'Grass-sand blend - corner area' },
};

// ============================================================================
// USER-CONFIRMED TILE PLACEMENT RULES
// ============================================================================

export const PLACEMENT_RULES = {
    // When grass is TOP+RIGHT of sand, use these sequences:
    GRASS_TOP_RIGHT: {
        // Position relative to the grass-sand boundary
        cornerTile: '0x003C',           // The actual corner
        diagonalSmooth: ['0x03C0', '0x03C2', '0x03BD'], // Smooth diagonal tiles
        grassTransition: ['0x01A5', '0x0375'], // Grass tiles near the boundary
    },
    
    // When grass is TOP+LEFT of sand:
    GRASS_TOP_LEFT: {
        cornerTile: '0x003D',
        diagonalSmooth: ['0x03BB', '0x03BC', '0x03B7', '0x03C5'],
        grassTransition: ['0x007D', '0x037E', '0x0684'],
    },
    
    // When grass is BOTTOM+LEFT of sand:
    GRASS_BOTTOM_LEFT: {
        cornerTile: '0x003B',
        diagonalSmooth: ['0x03C4', '0x03C5', '0x03C6'],
        grassTransition: ['0x01A5', '0x01A9'],
    },
    
    // When grass is BOTTOM+RIGHT of sand:
    GRASS_BOTTOM_RIGHT: {
        cornerTile: '0x003E',
        diagonalSmooth: ['0x03BD'],
        grassTransition: ['0x00C2', '0x00C1'],
    },
    
    // Inner corner tiles (sand only in ONE corner of a mostly-grass area):
    INNER_CORNERS: {
        SAND_TOP_LEFT: '0x0036',
        SAND_TOP_RIGHT: '0x0035',
        SAND_BOTTOM_LEFT: '0x0034',
        SAND_BOTTOM_RIGHT: '0x0033',
    },
};

// ============================================================================
// SPECIFIC POSITION CORRECTIONS FROM USER
// ============================================================================

export const POSITION_CORRECTIONS = [
    // TOP-RIGHT CORNER AREA (positions around 13,7 and 14,7)
    {
        pattern: 'Grass TOP+RIGHT, Sand BOTTOM+LEFT',
        neighbors: { top: 'grass', right: 'grass', bottom: 'sand', left: 'sand' },
        correctTiles: {
            cornerPosition: '0x003C',      // Basic corner
            smoothDiagonal: '0x03C0',      // Smooth diagonal
            innerSmooth: '0x03C2',         // Inner smooth
            edgeSmooth: '0x03BD',          // Edge smooth
        },
        grassNearby: ['0x01A5', '0x0375', '0x0036'], // Grass tiles to use nearby
    },
    
    // TOP-LEFT CORNER AREA (positions around 7,7 and 8,6)
    {
        pattern: 'Grass TOP+LEFT, Sand BOTTOM+RIGHT',
        neighbors: { top: 'grass', right: 'sand', bottom: 'sand', left: 'grass' },
        correctTiles: {
            cornerPosition: '0x003D',
            smoothDiagonal: '0x03BB',
            innerSmooth: '0x03BC',
            edgeSmooth: '0x03C5',
        },
        grassNearby: ['0x007D', '0x037E', '0x0684', '0x0035', '0x012A', '0x012C'],
    },
    
    // BOTTOM-LEFT CORNER AREA
    {
        pattern: 'Grass BOTTOM+LEFT, Sand TOP+RIGHT',
        neighbors: { top: 'sand', right: 'sand', bottom: 'grass', left: 'grass' },
        correctTiles: {
            cornerPosition: '0x003B',
            smoothDiagonal: '0x03C4',
            innerSmooth: '0x0034',
        },
        grassNearby: ['0x01A5', '0x01A9'],
    },
    
    // BOTTOM-RIGHT CORNER AREA
    {
        pattern: 'Grass BOTTOM+RIGHT, Sand TOP+LEFT',
        neighbors: { top: 'sand', right: 'grass', bottom: 'grass', left: 'sand' },
        correctTiles: {
            cornerPosition: '0x003E',
            smoothDiagonal: '0x0037',
            innerSmooth: '0x0033',
        },
        grassNearby: ['0x00C2', '0x00C1'],
    },
];

// ============================================================================
// EDGE TILE CONFIRMATIONS
// ============================================================================

export const EDGE_TILES = {
    // Single edges - grass on ONE side only
    GRASS_TOP: '0x003A',
    GRASS_RIGHT: '0x0037',
    GRASS_BOTTOM: '0x0039',
    GRASS_LEFT: '0x0038',
};

// ============================================================================
// ALL CORRECTIONS RAW DATA (for reference)
// ============================================================================

export const RAW_CORRECTIONS = [
    // Smooth diagonal tiles discovered:
    { tile: '0x03C0', context: 'Grass TR, smooth diagonal to sand' },
    { tile: '0x03B7', context: 'Grass TL, diagonal transition' },
    { tile: '0x03B9', context: 'Grass TL, diagonal variant' },
    { tile: '0x03BB', context: 'Grass TL corner, smooth' },
    { tile: '0x03BC', context: 'Grass TL edge, smooth' },
    { tile: '0x03BD', context: 'Grass RIGHT edge, smooth diagonal' },
    { tile: '0x03C1', context: 'Grass TR, diagonal variant' },
    { tile: '0x03C2', context: 'Grass TR corner, smooth' },
    { tile: '0x03C4', context: 'Grass TL diagonal variant' },
    { tile: '0x03C5', context: 'Grass LEFT edge, smooth' },
    { tile: '0x03C6', context: 'Grass LEFT variant' },
    
    // Grass transition tiles discovered:
    { tile: '0x01A5', context: 'General grass transition near sand' },
    { tile: '0x01A8', context: 'Grass corner transition' },
    { tile: '0x01A9', context: 'Grass BL diagonal' },
    { tile: '0x01AA', context: 'Grass BR corner' },
    { tile: '0x01AB', context: 'Grass edge blend' },
    
    // Feathered grass tiles:
    { tile: '0x0375', context: 'Subtle sand feathering on grass' },
    { tile: '0x037E', context: 'Grass with sand corner hint' },
    { tile: '0x0684', context: 'Grass with distant sand influence' },
    { tile: '0x012A', context: 'Grass-sand blend inner' },
    { tile: '0x012C', context: 'Grass-sand blend corner' },
];

export default {
    SMOOTH_DIAGONAL_TILES,
    GRASS_TRANSITION_SERIES,
    FEATHERED_GRASS_TILES,
    PLACEMENT_RULES,
    POSITION_CORRECTIONS,
    EDGE_TILES,
    RAW_CORRECTIONS,
};








