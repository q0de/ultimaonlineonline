/**
 * Prefab Loader
 * Loads prefab JSON definitions (currently tree prefabs) from assets.
 */

export class PrefabLoader {
    constructor(basePath = './assets/prefabs/trees') {
        this.basePath = basePath;
        this.treePrefabs = null;
        this.treePrefabNames = [];
        this.loadingPromise = null;
    }

    async loadTreePrefabs(force = false) {
        if (this.treePrefabs && !force) {
            return this.treePrefabs;
        }
        if (this.loadingPromise && !force) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._fetchTreePrefabs()
            .then((prefabs) => {
                this.treePrefabs = prefabs;
                this.loadingPromise = null;
                return prefabs;
            })
            .catch((err) => {
                console.warn('[PrefabLoader] Failed to load tree prefabs:', err);
                this.loadingPromise = null;
                this.treePrefabs = {};
                return this.treePrefabs;
            });

        return this.loadingPromise;
    }

    async _fetchTreePrefabs() {
        const manifestUrl = `${this.basePath}/tree_prefabs_manifest.json`;
        const manifestResponse = await fetch(manifestUrl);
        if (!manifestResponse.ok) {
            throw new Error(`Manifest fetch failed: ${manifestResponse.status}`);
        }
        const manifest = await manifestResponse.json();
        const names = manifest.prefabs || [];
        this.treePrefabNames = names;

        const prefabEntries = {};
        for (const name of names) {
            try {
                const prefabUrl = `${this.basePath}/${name}.json`;
                const response = await fetch(prefabUrl);
                if (!response.ok) {
                    console.warn(`[PrefabLoader] Failed to fetch prefab ${name}: ${response.status}`);
                    continue;
                }
                const data = await response.json();
                prefabEntries[name] = data;
            } catch (err) {
                console.warn(`[PrefabLoader] Error loading prefab ${name}:`, err);
            }
        }

        return prefabEntries;
    }

    getTreePrefab(name) {
        if (!this.treePrefabs) return null;
        return this.treePrefabs[name] || null;
    }

    getTreePrefabList() {
        return this.treePrefabNames.slice();
    }
}

export const prefabLoader = new PrefabLoader();




