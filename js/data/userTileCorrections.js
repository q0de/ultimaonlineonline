/**
 * USER TILE CORRECTIONS - Learned from Paint Mode corrections
 * 
 * This file documents the user's corrections to help improve the transition logic.
 * Each entry shows what tile was wrong and what it should be, with neighbor context.
 * 
 * Generated from user paint corrections on 2025-11-28
 */

// USER CORRECTIONS FROM PAINT MODE
export const USER_CORRECTIONS = [
    // ==================== SAND TILE CORRECTIONS ====================
    // These corrections show when specific sand transition tiles should be used
    
    // Position (13,7): Top+Right=grass, Bottom+Left=sand
    // Code picked 0x003C (TR corner), should be 0x003B (BL corner) or 0x0036
    // Pattern: Grass on TOP and RIGHT → sand is in BOTTOM-LEFT area
    {
        position: { x: 13, y: 7 },
        was: '0x003C',
        shouldBe: '0x003B',  // Then changed to 0x0036, then 0x003C
        neighbors: { top: 'grass', right: 'grass', bottom: 'sand', left: 'sand' },
        lesson: 'When grass is TOP+RIGHT, use 0x003B (BL corner) for sand tile'
    },
    
    // Position (8,6): Top=grass, Right=edge, Bottom=sand, Left=grass
    // Pattern: Grass wrapping around TOP-LEFT
    {
        position: { x: 8, y: 6 },
        was: '0x003D',
        shouldBe: '0x003D',  // Confirmed correct after testing 0x0035, 0x0006
        neighbors: { top: 'grass', right: 'sand(edge)', bottom: 'sand', left: 'grass' },
        lesson: 'When grass is TOP+LEFT, use 0x003D (TL corner)'
    },
    
    // Position (8,7): Near water, needs smooth transition
    {
        position: { x: 8, y: 7 },
        was: '0x0016',  // Pure sand
        shouldBe: '0x0035',  // Inner corner TR
        neighbors: { top: 'sand', right: 'sand', bottom: 'water', left: 'sand(corner)' },
        lesson: 'Sand near water with grass diagonal needs inner corner'
    },
    
    // Position (7,7): Grass on TOP+LEFT, sand elsewhere
    {
        position: { x: 7, y: 7 },
        was: '0x003D',
        shouldBe: '0x003D',  // Confirmed correct
        neighbors: { top: 'grass', right: 'sand', bottom: 'sand', left: 'grass' },
        lesson: 'Grass on TOP+LEFT = 0x003D'
    },
    
    // Position (7,8): Complex transition near water
    {
        position: { x: 7, y: 8 },
        was: '0x0016',
        shouldBe: '0x0035',  // Changed from 0x003D
        neighbors: { top: 'sand(corner)', right: 'water', bottom: 'sand', left: 'sand(corner)' },
        lesson: 'Inner corner for diagonal grass connection'
    },
    
    // Position (7,12): Sand near water edge
    {
        position: { x: 7, y: 12 },
        was: '0x0016',
        shouldBe: '0x0034',  // Inner corner BL
        neighbors: { top: 'sand', right: 'water', bottom: 'sand(BL corner)', left: 'sand(BL corner)' },
        lesson: 'Use 0x0034 when grass is diagonally in BOTTOM-LEFT'
    },
    
    // Position (8,13): Sand near water
    {
        position: { x: 8, y: 13 },
        was: '0x0016',
        shouldBe: '0x0034',  // Inner corner BL
        neighbors: { top: 'water', right: 'sand', bottom: 'sand(BL)', left: 'sand(BL)' },
        lesson: 'Use 0x0034 for BL diagonal grass'
    },
    
    // Position (12,13): Sand with grass in BR diagonal
    {
        position: { x: 12, y: 13 },
        was: '0x0016',
        shouldBe: '0x0033',  // Inner corner BR
        neighbors: { top: 'water', right: 'sand(BR)', bottom: 'sand(BR)', left: 'sand' },
        lesson: 'Use 0x0033 when grass is diagonally in BOTTOM-RIGHT'
    },
    
    // Position (13,12): Sand with grass in BR
    {
        position: { x: 13, y: 12 },
        was: '0x0016',
        shouldBe: '0x0033',  // Inner corner BR
        neighbors: { top: 'sand', right: 'sand(BR)', bottom: 'sand(BR)', left: 'water' },
        lesson: 'Use 0x0033 for BR diagonal grass'
    },
    
    // Position (13,8): Sand between water and grass
    {
        position: { x: 13, y: 8 },
        was: '0x0016',
        shouldBe: '0x0036',  // Inner corner TL
        neighbors: { top: 'sand(0x0036)', right: 'sand(0x003C)', bottom: 'sand', left: 'water' },
        lesson: 'Use 0x0036 when grass is diagonally in TOP-LEFT'
    },
    
    // Position (12,7): Sand with grass diagonal TR
    {
        position: { x: 12, y: 7 },
        was: '0x0016',
        shouldBe: '0x0036',  // Inner corner TL
        neighbors: { top: 'sand(0x003C)', right: 'sand(0x003C)', bottom: 'water', left: 'sand' },
        lesson: 'Use 0x0036 for TL diagonal grass'
    },
    
    // ==================== GRASS TILE CORRECTIONS ====================
    // These are GRASS tiles that need special transition tiles for diagonal sand
    
    // Position (5,7): Grass with sand diagonal in BR
    {
        position: { x: 5, y: 7 },
        was: '0x0036',  // Inner corner (wrong - this is a SAND tile)
        shouldBe: '0x007D',  // GRASS transition tile
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', bottomRight: 'sand' },
        lesson: 'GRASS tile with diagonal sand in BR should use 0x007D (grass transition)'
    },
    
    // Position (7,5): Grass with sand diagonal in BR
    {
        position: { x: 7, y: 5 },
        was: '0x0036',
        shouldBe: '0x01A6',  // GRASS transition tile
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', bottomRight: 'sand' },
        lesson: 'GRASS tile with diagonal sand in BR should use 0x01A6'
    },
    
    // Position (6,6): Grass with sand diagonal in BR
    {
        position: { x: 6, y: 6 },
        was: '0x0036',
        shouldBe: '0x00DA',  // GRASS transition tile
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', bottomRight: 'sand' },
        lesson: 'GRASS tile with diagonal sand in BR should use 0x00DA'
    },
    
    // Position (5,13): Grass with sand diagonal in TR
    {
        position: { x: 5, y: 13 },
        was: '0x0034',
        shouldBe: '0x01A7',  // GRASS transition tile
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', topRight: 'sand' },
        lesson: 'GRASS tile with diagonal sand in TR should use 0x01A7'
    },
    
    // Position (8,15): Grass with sand diagonal in TL
    {
        position: { x: 8, y: 15 },
        was: '0x0003',  // Pure grass
        shouldBe: '0x01A5',  // GRASS transition tile
        neighbors: { top: 'sand(BL)', right: 'grass', bottom: 'grass', left: 'grass(transition)', topRight: 'sand' },
        lesson: 'GRASS tile with diagonal sand should use 0x01A5'
    },
    
    // Position (7,15): Grass with sand diagonal
    {
        position: { x: 7, y: 15 },
        was: '0x0034',
        shouldBe: '0x01A5',
        neighbors: { top: 'grass', right: 'grass(0x01A5)', bottom: 'grass', left: 'grass', topRight: 'sand' },
        lesson: 'Use 0x01A5 for grass with diagonal sand'
    },
    
    // Position (6,14): Grass with diagonal sand
    {
        position: { x: 6, y: 14 },
        was: '0x0034',
        shouldBe: '0x00C2',  // GRASS transition tile
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', topRight: 'sand' },
        lesson: 'Use 0x00C2 for grass with diagonal sand'
    },
    
    // Position (15,13): Grass with sand diagonal in TL
    {
        position: { x: 15, y: 13 },
        was: '0x0033',
        shouldBe: '0x00C2',
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', topLeft: 'sand' },
        lesson: 'Use 0x00C2 for grass with diagonal sand in TL'
    },
    
    // Position (14,13): Grass with sand diagonal
    {
        position: { x: 14, y: 13 },
        was: '0x0003',
        shouldBe: '0x00C2',
        neighbors: { top: 'sand(BR)', right: 'grass(0x00C2)', bottom: 'grass', left: 'sand(BR)' },
        lesson: 'Use 0x00C2 for grass adjacent to sand corners'
    },
    
    // Position (14,14): Grass with sand diagonal
    {
        position: { x: 14, y: 14 },
        was: '0x0033',
        shouldBe: '0x00C2',
        neighbors: { top: 'grass(0x00C2)', right: 'grass', bottom: 'grass', left: 'grass', topLeft: 'sand' },
        lesson: 'Use 0x00C2 for grass with diagonal sand'
    },
    
    // Position (13,15): Grass with sand diagonal in TL
    {
        position: { x: 13, y: 15 },
        was: '0x0033',
        shouldBe: '0x00C1',  // Different grass transition
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', topLeft: 'sand' },
        lesson: 'Use 0x00C1 for grass with diagonal sand in TL'
    },
    
    // Position (15,7): Grass with sand diagonal in BL
    {
        position: { x: 15, y: 7 },
        was: '0x0035',
        shouldBe: '0x01A5',
        neighbors: { top: 'grass', right: 'grass', bottom: 'grass', left: 'grass', bottomLeft: 'sand' },
        lesson: 'Use 0x01A5 for grass with diagonal sand in BL'
    },
    
    // Positions (15,6), (14,5), (14,6), (13,5): All grass with diagonal sand
    // All should use 0x01A5
];

/**
 * LEARNED RULES FROM CORRECTIONS:
 * 
 * 1. INNER CORNER TILES (0x0033-0x0036) go on SAND tiles, NOT grass tiles!
 *    - 0x0033: Use when grass is diagonally in BOTTOM-RIGHT
 *    - 0x0034: Use when grass is diagonally in BOTTOM-LEFT
 *    - 0x0035: Use when grass is diagonally in TOP-RIGHT
 *    - 0x0036: Use when grass is diagonally in TOP-LEFT
 * 
 * 2. GRASS TRANSITION TILES go on GRASS tiles with diagonal sand neighbors:
 *    - 0x01A5: General grass transition (multiple diagonal directions)
 *    - 0x01A6, 0x01A7: Grass with sand diagonal in BOTTOM-RIGHT area
 *    - 0x00C1, 0x00C2: Grass with sand diagonal in TOP-LEFT area
 *    - 0x00DA, 0x007D: Alternative grass transitions
 * 
 * 3. OUTER CORNER TILES (0x003B-0x003E) for sand with TWO adjacent grass cardinals:
 *    - 0x003B: Grass on BOTTOM + LEFT
 *    - 0x003C: Grass on TOP + RIGHT
 *    - 0x003D: Grass on TOP + LEFT
 *    - 0x003E: Grass on BOTTOM + RIGHT
 * 
 * 4. EDGE TILES (0x0037-0x003A) for sand with ONE grass cardinal:
 *    - 0x0037: Grass on RIGHT
 *    - 0x0038: Grass on LEFT
 *    - 0x0039: Grass on BOTTOM
 *    - 0x003A: Grass on TOP
 */

// Mapping of grass transition tiles by diagonal sand direction
export const GRASS_DIAGONAL_TILES = {
    // When a GRASS tile has diagonal sand in these directions:
    BOTTOM_RIGHT: ['0x007D', '0x01A6', '0x00DA'],  // Sand is in BR diagonal
    BOTTOM_LEFT: ['0x01A5'],                       // Sand is in BL diagonal
    TOP_RIGHT: ['0x01A5', '0x01A7'],               // Sand is in TR diagonal
    TOP_LEFT: ['0x00C1', '0x00C2'],                // Sand is in TL diagonal
};

// Export for use in terrain generator
export default {
    USER_CORRECTIONS,
    GRASS_DIAGONAL_TILES
};








