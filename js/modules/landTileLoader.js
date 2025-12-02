/**
 * Land Tile Data Loader
 * Parses UOFiddler CSV export and converts to usable format
 */

export class LandTileLoader {
    /**
     * Parse CSV data from UOFiddler export
     * @param {string} csvText - Raw CSV text
     * @returns {Array<Object>} Array of tile objects
     */
    static parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }

        // Parse header
        const headers = lines[0].split(';').map(h => h.trim());
        
        // Parse data rows
        const tiles = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            const tile = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                value = value.trim();
                
                // Convert hex IDs to numbers
                if (header === 'ID' && value.startsWith('0x')) {
                    tile[header] = value; // Keep hex string
                    tile['id'] = parseInt(value, 16); // Also store as number
                } else if (header === 'TextureID' && value.startsWith('0x')) {
                    tile[header] = value;
                    tile['textureId'] = parseInt(value, 16);
                } else {
                    // Try to convert to number if it's numeric
                    const numValue = Number(value);
                    if (!isNaN(numValue) && value !== '') {
                        tile[header] = numValue;
                    } else {
                        tile[header] = value;
                    }
                }
            });
            
            tiles.push(tile);
        }
        
        return tiles;
    }

    /**
     * Load CSV file from URL
     * @param {string} url - Path to CSV file
     * @returns {Promise<Array<Object>>} Promise resolving to array of tiles
     */
    static async loadFromURL(url) {
        try {
            console.log(`[LandTileLoader] Fetching CSV from: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details');
                throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText.substring(0, 100)}`);
            }
            
            const csvText = await response.text();
            console.log(`[LandTileLoader] CSV loaded, ${csvText.length} characters`);
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV file is empty');
            }
            
            const tiles = this.parseCSV(csvText);
            console.log(`[LandTileLoader] Parsed ${tiles.length} tiles`);
            
            return tiles;
        } catch (error) {
            console.error('[LandTileLoader] Error loading CSV:', error);
            console.error('[LandTileLoader] URL attempted:', url);
            console.error('[LandTileLoader] Make sure you are accessing via http://localhost:8000, not file://');
            throw error;
        }
    }

    /**
     * Filter tiles by property
     * @param {Array<Object>} tiles - Array of tile objects
     * @param {Object} filters - Filter criteria
     * @returns {Array<Object>} Filtered tiles
     */
    static filterTiles(tiles, filters) {
        return tiles.filter(tile => {
            for (const [key, value] of Object.entries(filters)) {
                if (tile[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Get tiles that are walkable (not impassible)
     * @param {Array<Object>} tiles - Array of tile objects
     * @returns {Array<Object>} Walkable tiles
     */
    static getWalkableTiles(tiles) {
        return tiles.filter(tile => !tile.Impassible || tile.Impassible === 0);
    }

    /**
     * Get tiles that are water
     * @param {Array<Object>} tiles - Array of tile objects
     * @returns {Array<Object>} Water tiles
     */
    static getWaterTiles(tiles) {
        return tiles.filter(tile => {
            const name = (tile.Name || '').toLowerCase();
            return name.includes('water') || tile.Wet === 1;
        });
    }

    /**
     * Generate tile sets from raw tile list
     * Finds sequential groups of 4 tiles (Quad Sets) that share a biome name
     * @param {Array<Object>} tiles - All parsed tiles
     * @returns {Object} Organized sets { grass: [[id1,id2,id3,id4], ...], dirt: [...] }
     */
    static generateTileSets(tiles) {
        const sets = {
            grass: [],
            dirt: [],
            sand: [],
            rock: [],
            forest: [],
            jungle: [],
            water: [],
            snow: [],
            cave: [],
            lava: [],
            misc: []
        };
        
        // Filter valid tiles (must have ID and Name)
        const validTiles = tiles.filter(t => t.id !== undefined && t.Name);
        
        // Sort by ID to ensure we find sequential blocks
        validTiles.sort((a, b) => a.id - b.id);
        
        // Scan for sequences of 4
        // We look for: id, id+1, id+2, id+3 sharing the same base name
        for (let i = 0; i < validTiles.length - 3; i++) {
            const t1 = validTiles[i];
            const t2 = validTiles[i+1];
            const t3 = validTiles[i+2];
            const t4 = validTiles[i+3];
            
            // Check for sequential IDs
            if (t2.id !== t1.id + 1 || t3.id !== t1.id + 2 || t4.id !== t1.id + 3) {
                continue;
            }
            
            // Check names to categorize
            const name = (t1.Name || t1.name || '').toString().toLowerCase();
            
            // Determine category
            let category = null;
            if (name.includes('grass')) category = 'grass';
            else if (name.includes('dirt') || name.includes('mud')) category = 'dirt';
            else if (name.includes('sand') || name.includes('desert')) category = 'sand';
            else if (name.includes('rock') || name.includes('stone') || name.includes('mountain')) category = 'rock';
            else if (name.includes('forest') || name.includes('leaves')) category = 'forest';
            else if (name.includes('jungle')) category = 'jungle';
            else if (name.includes('water')) category = 'water';
            else if (name.includes('snow') || name.includes('ice')) category = 'snow';
            else if (name.includes('cave')) category = 'cave';
            else if (name.includes('lava')) category = 'lava';
            
            if (category) {
                // Format as hex strings for the generator
                const tileSet = [
                    t1.ID, // Already hex string from parser
                    t2.ID,
                    t3.ID,
                    t4.ID
                ];
                sets[category].push(tileSet);
                
                // Skip ahead 3 indexes (loop increments by 1, so effectively skip 4)
                i += 3;
            }
        }
        
        console.log(`[LandTileLoader] Generated sets:`, 
            Object.keys(sets).map(k => `${k}: ${sets[k].length} sets`).join(', '));
            
        return sets;
    }
}

