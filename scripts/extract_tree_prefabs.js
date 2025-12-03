#!/usr/bin/env node
/**
 * Tree Prefab Extractor
 *
 * Scans Ultima Online statics data (statics0.mul / staidx0.mul) and derives
 * multi-part tree prefabs by clustering contiguous tree statics. Prefabs are
 * emitted as JSON files under assets/prefabs/trees/.
 */

const fs = require('fs');
const path = require('path');

const MAP_WIDTH = 7168;
const MAP_HEIGHT = 4096;
const BLOCK_SIZE = 8;
const blocksPerColumn = Math.ceil(MAP_HEIGHT / BLOCK_SIZE);

const DEFAULT_REGION = {
    startX: 2000,
    startY: 1000,
    width: 256,
    height: 256
};

const MIN_CLUSTER_SIZE = 2; // Ignore single-tile statics
const MAX_CLUSTER_AREA = 16; // Skip clusters that sprawl too far (likely multiple trees)
const STACK_Z_INCREMENT = 4; // Extra Z per stacked sprite on same tile (pixels in UO units)

// Tree graphic IDs derived from biomeStaticPlacer definitions.
const TREE_GRAPHICS = new Set([
    0x0CCA, 0x0CCB, 0x0CCC, 0x0CCD, 0x0CCE,
    0x0CD0, 0x0CD3, 0x0CD6, 0x0CD8, 0x0CDA,
    0x0CE0, 0x0CE3, 0x0CE6, 0x0D41, 0x0D45,
    0x0D46, 0x0D48, 0x0D49, 0x0D4A, 0x0D4B,
    0x0D4C
]);

function parseArgs() {
    const args = process.argv.slice(2);
    const options = { ...DEFAULT_REGION };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--startX') options.startX = parseInt(args[++i], 10);
        else if (arg === '--startY') options.startY = parseInt(args[++i], 10);
        else if (arg === '--width') options.width = parseInt(args[++i], 10);
        else if (arg === '--height') options.height = parseInt(args[++i], 10);
        else if (arg === '--statics') options.staticsPath = args[++i];
        else if (arg === '--staidx') options.indexPath = args[++i];
    }
    options.staticsPath = options.staticsPath || path.resolve('assets', 'mul', 'statics0.mul');
    options.indexPath = options.indexPath || path.resolve('assets', 'mul', 'staidx0.mul');
    return options;
}

function loadData(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file: ${filePath}`);
    }
    return fs.readFileSync(filePath);
}

function getIndexEntry(indexBuffer, blockIndex) {
    const offset = blockIndex * 12;
    if (offset + 12 > indexBuffer.length) {
        return null;
    }
    const position = indexBuffer.readUInt32LE(offset);
    const size = indexBuffer.readUInt32LE(offset + 4);
    return { position, size };
}

function getStaticsForRegion({ startX, startY, width, height }, indexBuffer, staticBuffer) {
    const statics = [];
    const startBlockX = Math.floor(startX / BLOCK_SIZE);
    const startBlockY = Math.floor(startY / BLOCK_SIZE);
    const endBlockX = Math.floor((startX + width - 1) / BLOCK_SIZE);
    const endBlockY = Math.floor((startY + height - 1) / BLOCK_SIZE);

    for (let blockY = startBlockY; blockY <= endBlockY; blockY++) {
        for (let blockX = startBlockX; blockX <= endBlockX; blockX++) {
            const blockIndex = blockX * blocksPerColumn + blockY;
            const entry = getIndexEntry(indexBuffer, blockIndex);
            if (!entry || entry.size === 0 || entry.position === 0xFFFFFFFF) continue;

            const staticsInBlock = Math.min(1024, Math.floor(entry.size / 7));
            for (let i = 0; i < staticsInBlock; i++) {
                const staticOffset = entry.position + i * 7;
                if (staticOffset + 7 > staticBuffer.length) break;

                const graphic = staticBuffer.readUInt16LE(staticOffset);
                if (!TREE_GRAPHICS.has(graphic)) continue;

                const localX = staticBuffer.readUInt8(staticOffset + 2);
                const localY = staticBuffer.readUInt8(staticOffset + 3);
                let z = staticBuffer.readInt8(staticOffset + 4);
                const hue = staticBuffer.readUInt16LE(staticOffset + 5);

                const worldX = blockX * BLOCK_SIZE + localX;
                const worldY = blockY * BLOCK_SIZE + localY;

                if (worldX < startX || worldX >= startX + width ||
                    worldY < startY || worldY >= startY + height) {
                    continue;
                }

                statics.push({ graphic, worldX, worldY, z, hue });
            }
        }
    }

    return statics;
}

function clusterStatics(statics) {
    const visited = new Array(statics.length).fill(false);
    const clusters = [];

    const isNeighbor = (a, b) =>
        Math.abs(a.worldX - b.worldX) <= 1 &&
        Math.abs(a.worldY - b.worldY) <= 1;

    for (let i = 0; i < statics.length; i++) {
        if (visited[i]) continue;

        const queue = [i];
        const cluster = [];
        visited[i] = true;

        while (queue.length) {
            const idx = queue.shift();
            const node = statics[idx];
            cluster.push(node);

            for (let j = 0; j < statics.length; j++) {
                if (visited[j]) continue;
                if (isNeighbor(node, statics[j])) {
                    visited[j] = true;
                    queue.push(j);
                }
            }
        }

        if (cluster.length >= MIN_CLUSTER_SIZE) {
            const minX = Math.min(...cluster.map(s => s.worldX));
            const maxX = Math.max(...cluster.map(s => s.worldX));
            const minY = Math.min(...cluster.map(s => s.worldY));
            const maxY = Math.max(...cluster.map(s => s.worldY));
            const area = (maxX - minX + 1) * (maxY - minY + 1);
            if (area <= MAX_CLUSTER_AREA) {
                clusters.push(cluster);
            }
        }
    }

    return clusters;
}

function canonicalizeCluster(cluster) {
    const minX = Math.min(...cluster.map(s => s.worldX));
    const minY = Math.min(...cluster.map(s => s.worldY));
    const minZ = Math.min(...cluster.map(s => s.z));

    const parts = cluster.map(s => ({
        graphic: s.graphic,
        dx: s.worldX - minX,
        dy: s.worldY - minY,
        dz: s.z - minZ
    })).sort((a, b) => (
        a.dx - b.dx ||
        a.dy - b.dy ||
        a.dz - b.dz ||
        a.graphic - b.graphic
    ));

    // Ensure stacked sprites (same tile) render canopy above trunk by bumping dz
    const stackGroups = new Map();
    for (const part of parts) {
        const key = `${part.dx},${part.dy}`;
        if (!stackGroups.has(key)) stackGroups.set(key, []);
        stackGroups.get(key).push(part);
    }
    for (const group of stackGroups.values()) {
        if (group.length <= 1) continue;
        group.sort((a, b) => (a.dz - b.dz) || (a.graphic - b.graphic));
        for (let i = 0; i < group.length; i++) {
            group[i].dz += i * STACK_Z_INCREMENT;
        }
    }

    return {
        width: Math.max(...parts.map(p => p.dx)) + 1,
        height: Math.max(...parts.map(p => p.dy)) + 1,
        baseZ: minZ,
        parts,
        signature: JSON.stringify(parts)
    };
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function writePrefabs(prefabs, outputDir) {
    ensureDir(outputDir);
    // Clean old prefabs to avoid stale files
    const existing = fs.readdirSync(outputDir);
    for (const file of existing) {
        if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(outputDir, file));
        }
    }

    let index = 1;
    for (const prefab of prefabs) {
        const name = `tree_prefab_${index.toString().padStart(3, '0')}`;
        const filePath = path.join(outputDir, `${name}.json`);
        const payload = {
            name,
            width: prefab.width,
            height: prefab.height,
            baseZ: prefab.baseZ,
            parts: prefab.parts
        };
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
        index++;
    }

    const manifestPath = path.join(outputDir, 'tree_prefabs_manifest.json');
    const manifest = prefabs.map((_, idx) => `tree_prefab_${(idx + 1).toString().padStart(3, '0')}`);
    fs.writeFileSync(manifestPath, JSON.stringify({ prefabs: manifest }, null, 2));
}

function main() {
    const options = parseArgs();
    console.log('[PrefabExtractor] Options:', options);

    const indexBuffer = loadData(options.indexPath);
    const staticBuffer = loadData(options.staticsPath);

    const statics = getStaticsForRegion(options, indexBuffer, staticBuffer);
    console.log(`[PrefabExtractor] Found ${statics.length} tree statics in region`);

    const clusters = clusterStatics(statics);
    console.log(`[PrefabExtractor] Clustered into ${clusters.length} candidates`);

    const prefabMap = new Map();
    for (const cluster of clusters) {
        const prefab = canonicalizeCluster(cluster);
        if (!prefabMap.has(prefab.signature)) {
            prefabMap.set(prefab.signature, prefab);
        }
    }

    const prefabs = Array.from(prefabMap.values());
    console.log(`[PrefabExtractor] ${prefabs.length} unique prefabs`);

    const outputDir = path.resolve('assets', 'prefabs', 'trees');
    writePrefabs(prefabs, outputDir);
    console.log(`[PrefabExtractor] Wrote prefabs to ${outputDir}`);
}

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error('[PrefabExtractor] Error:', err);
        process.exit(1);
    }
}

