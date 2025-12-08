/**
 * User-Approved Curve Sequences for Terrain Generation
 * 
 * These 3x3 tile arrangements have been visually verified by the user
 * to create smooth, natural-looking transitions between grass and sand.
 * 
 * Each sequence is a 3x3 grid where:
 * - tiles[y][x] = the tile ID to use
 * - biomes[y][x] = the biome category (for neighbor matching)
 * 
 * The terrain generator can randomly select from approved sequences
 * for each corner type to add variety while maintaining correctness.
 */

export const APPROVED_CURVE_SEQUENCES = {
    // Top-Left Corner: Grass surrounds sand at top-left
    // Sand appears in bottom-right area
    topLeft: [
        {
            id: "tl_sharp",
            name: "Sharp Corner",
            tiles: [
                ["0x0003", "0x0003", "0x0003"],
                ["0x0003", "0x003D", "0x003A"],
                ["0x0003", "0x0038", "0x0016"]
            ],
            biomes: [
                ["grass", "grass", "grass"],
                ["grass", "sand", "sand"],
                ["grass", "sand", "sand"]
            ],
            // Key tiles for this pattern
            cornerTile: "0x003D",  // The main corner transition
            edgeTiles: ["0x003A", "0x0038"]  // Edge transitions
        },
        {
            id: "tl_smooth1",
            name: "Smooth Curve A",
            tiles: [
                ["0x0003", "0x0003", "0x0003"],
                ["0x0003", "0x037E", "0x0003"],
                ["0x0003", "0x03C6", "0x003A"]
            ],
            biomes: [
                ["grass", "grass", "grass"],
                ["grass", "grass", "grass"],
                ["grass", "sand", "sand"]
            ],
            // Key tiles for this pattern
            cornerTile: "0x03C6",  // Smooth curve tile
            transitionTile: "0x037E"  // Feathered grass transition
        }
    ],

    // Top-Right Corner: Grass surrounds sand at top-right
    // Sand appears in bottom-left area
    topRight: [
        {
            id: "tr_sharp",
            name: "Sharp Corner",
            tiles: [
                ["0x0003", "0x0003", "0x0003"],
                ["0x003A", "0x003C", "0x0003"],
                ["0x0016", "0x0037", "0x0003"]
            ],
            biomes: [
                ["grass", "grass", "grass"],
                ["sand", "sand", "grass"],
                ["sand", "sand", "grass"]
            ],
            cornerTile: "0x003C",
            edgeTiles: ["0x003A", "0x0037"]
        },
        {
            id: "tr_smooth3",
            name: "Smooth Curve C",
            tiles: [
                ["0x0003", "0x0003", "0x0003"],
                ["0x003A", "0x003C", "0x037C"],
                ["0x0016", "0x0037", "0x0003"]
            ],
            biomes: [
                ["grass", "grass", "grass"],
                ["sand", "sand", "grass"],
                ["sand", "sand", "grass"]
            ],
            cornerTile: "0x003C",
            transitionTile: "0x037C",  // Grass transition tile
            edgeTiles: ["0x003A", "0x0037"]
        }
    ],

    // Bottom-Left Corner: Grass surrounds sand at bottom-left
    // Sand appears in top-right area
    bottomLeft: [
        // No approved sequences yet - user needs to review these
    ],

    // Bottom-Right Corner: Grass surrounds sand at bottom-right
    // Sand appears in top-left area
    bottomRight: [
        // No approved sequences yet - user needs to review these
    ]
};

/**
 * Get a random approved sequence for a corner type
 * @param {string} cornerType - 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
 * @returns {object|null} A random approved sequence or null if none available
 */
export function getRandomApprovedSequence(cornerType) {
    const sequences = APPROVED_CURVE_SEQUENCES[cornerType];
    if (!sequences || sequences.length === 0) {
        return null;
    }
    return sequences[Math.floor(Math.random() * sequences.length)];
}

/**
 * Check if we have approved sequences for a corner type
 * @param {string} cornerType - 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
 * @returns {boolean}
 */
export function hasApprovedSequences(cornerType) {
    const sequences = APPROVED_CURVE_SEQUENCES[cornerType];
    return sequences && sequences.length > 0;
}

/**
 * Get all corner types that have approved sequences
 * @returns {string[]}
 */
export function getApprovedCornerTypes() {
    return Object.keys(APPROVED_CURVE_SEQUENCES).filter(
        key => APPROVED_CURVE_SEQUENCES[key].length > 0
    );
}

// Export for use in terrain generator
export default APPROVED_CURVE_SEQUENCES;












