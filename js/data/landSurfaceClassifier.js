const KEYWORD_GROUPS = {
    water: ['water', 'ocean', 'sea', 'river', 'lake', 'pond'],
    deepWater: ['deep water'],
    swamp: ['swamp', 'bog', 'marsh'],
    lava: ['lava', 'volcano'],
    sand: ['sand', 'desert', 'beach', 'dune'],
    snow: ['snow', 'ice', 'tundra', 'glacier', 'frozen'],
    road: ['road', 'path', 'trail', 'street', 'paved', 'cobbl', 'causeway', 'highway'],
    bridge: ['bridge', 'dock', 'pier', 'boardwalk', 'walkway', 'harbor', 'port'],
    cave: ['cave', 'cavern', 'dungeon'],
    rock: ['rock', 'stone', 'mountain', 'cliff'],
    dirt: ['dirt', 'mud', 'soil', 'earth'],
    grass: ['grass', 'field', 'plain', 'meadow'],
    jungle: ['jungle', 'rainforest'],
    forest: ['forest', 'wood', 'grove'],
    swampPlant: ['mire', 'reed'],
};

const TREE_ALLOWED_SURFACES = new Set(['grass', 'forest', 'jungle', 'dirt', 'sand', 'swamp']);

export function normalizeTileId(tileId) {
    if (tileId == null) return null;
    if (typeof tileId === 'number') return tileId;
    if (typeof tileId === 'string') {
        const trimmed = tileId.trim();
        if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
            const parsed = parseInt(trimmed, 16);
            return isNaN(parsed) ? null : parsed;
        }
        const parsed = parseInt(trimmed, 10);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
}

function fieldMatchesKeyword(field, keywords) {
    if (!field || !keywords) return false;
    const lower = field.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword));
}

function gatherMetadataFields(tileInfo) {
    if (!tileInfo) return [];
    const fields = [];
    ['Name', 'name', 'Texture', 'texture', 'Category', 'category'].forEach(key => {
        if (tileInfo[key]) fields.push(String(tileInfo[key]));
    });
    return fields;
}

export function classifySurfaceFromMetadata(tileInfo) {
    if (!tileInfo) return null;
    const fields = gatherMetadataFields(tileInfo);
    const wet = tileInfo.Wet ?? tileInfo.wet;
    if (wet === 1) return 'water';

    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.deepWater))) return 'deep_water';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.water))) return 'water';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.swamp) || fieldMatchesKeyword(field, KEYWORD_GROUPS.swampPlant))) return 'swamp';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.lava))) return 'lava';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.bridge))) return 'bridge';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.road))) return 'road';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.cave))) return 'cave';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.rock))) return 'rock';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.snow))) return 'snow';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.sand))) return 'sand';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.dirt))) return 'dirt';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.jungle))) return 'jungle';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.forest))) return 'forest';
    if (fields.some(field => fieldMatchesKeyword(field, KEYWORD_GROUPS.grass))) return 'grass';

    return null;
}

export function classifySurfaceFromBiome(biome) {
    if (!biome) return null;
    switch (biome) {
        case 'water':
            return 'water';
        case 'sand':
            return 'sand';
        case 'forest':
            return 'forest';
        case 'jungle':
            return 'jungle';
        case 'swamp':
            return 'swamp';
        case 'snow':
            return 'snow';
        case 'rock':
        case 'mountain':
            return 'rock';
        case 'dirt':
        case 'furrows':
            return 'dirt';
        case 'grass':
        default:
            return 'grass';
    }
}

export function classifySurfaceFromId(tileId) {
    const id = normalizeTileId(tileId);
    if (id == null) return null;

    if (id <= 0x0015) return 'deep_water';
    if (id >= 0x0016 && id <= 0x0033) return 'sand';
    if (id >= 0x00A8 && id <= 0x00B0) return 'water';
    if (id >= 0x0044 && id <= 0x004B) return 'sand';
    if (id >= 0x00C0 && id <= 0x00CF) return 'forest';
    if (id >= 0x00D0 && id <= 0x00DF) return 'grass';
    if (id >= 0x00E0 && id <= 0x00F0) return 'rock';
    if (id >= 0x0190 && id <= 0x01AF) return 'rock';
    if (id >= 0x02D0 && id <= 0x02FF) return 'snow';
    if (id >= 0x0320 && id <= 0x0350) return 'swamp';

    return null;
}

export function determineSurfaceClass({ tileId = null, biome = null, tileInfo = null } = {}) {
    let surface = null;
    if (!surface && tileInfo) {
        surface = classifySurfaceFromMetadata(tileInfo);
    }
    if (!surface && biome) {
        surface = classifySurfaceFromBiome(biome);
    }
    if (!surface && tileId != null) {
        surface = classifySurfaceFromId(tileId);
    }
    return surface || 'unknown';
}

export function annotateMapWithSurfaces(map, options = {}) {
    if (!Array.isArray(map) || map.length === 0) return map;
    const { landTileData = null } = options;

    for (let y = 0; y < map.length; y++) {
        const row = map[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
            const tile = row[x];
            if (!tile) continue;
            const tileId = normalizeTileId(tile.tileId ?? tile.originalTileId ?? tile.id);
            const tileInfo = landTileData && tileId != null ? landTileData.get(tileId) : null;
            if (tileInfo) {
                tile.name = tile.name || tileInfo.Name || tileInfo.name || '';
            }
            tile.surfaceClass = determineSurfaceClass({
                tileId,
                biome: tile.biome,
                tileInfo
            });
        }
    }

    return map;
}

export function isWaterSurface(surface) {
    return surface === 'water' || surface === 'deep_water';
}

export function isRoadSurface(surface) {
    return surface === 'road' || surface === 'bridge';
}

export function isTreeFriendlySurface(surface) {
    return TREE_ALLOWED_SURFACES.has(surface);
}

