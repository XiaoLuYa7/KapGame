import { instantiate, Node, Prefab, resources } from 'cc';
import { BundleResourceLoader } from './BundleResourceLoader';

export class PopupPrefabLoader {
    private static readonly prefabRootPath = 'prefabs/pop';
    private static readonly prefabCache = new Map<string, Promise<Prefab | null>>();

    static async ensurePopupNode(parent: Node | null, prefabName: string): Promise<Node | null> {
        if (!parent?.isValid || !prefabName) {
            return null;
        }

        const existing = this.findNodeByName(parent, prefabName);
        if (existing?.isValid) {
            return existing;
        }

        const prefab = await this.loadPopupPrefab(prefabName);
        if (!prefab) {
            return null;
        }

        const loadedExisting = this.findNodeByName(parent, prefabName);
        if (loadedExisting?.isValid) {
            return loadedExisting;
        }

        const popupNode = instantiate(prefab);
        popupNode.name = prefabName;
        popupNode.active = false;
        parent.addChild(popupNode);
        return popupNode;
    }

    static async preloadPopup(prefabName: string): Promise<boolean> {
        return (await this.loadPopupPrefab(prefabName)) !== null;
    }

    static findNodeByName(root: Node | null, name: string): Node | null {
        if (!root || !name) {
            return null;
        }

        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findNodeByName(child, name);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private static loadPopupPrefab(prefabName: string): Promise<Prefab | null> {
        const path = `${this.prefabRootPath}/${prefabName}`;
        const cached = this.prefabCache.get(path);
        if (cached) {
            return cached;
        }

        const task = new Promise<Prefab | null>(resolve => {
            const bundleName = BundleResourceLoader.getBundleNameForPopup(prefabName);
            if (bundleName) {
                void BundleResourceLoader.loadPrefab(path, prefabName).then(prefab => {
                    if (!prefab) {
                        console.warn(`[PopupPrefabLoader] Load prefab failed: ${bundleName}/${path}`);
                    }
                    resolve(prefab);
                });
                return;
            }

            resources.load(path, Prefab, (error, prefab) => {
                if (error || !prefab) {
                    console.warn(`[PopupPrefabLoader] Load prefab failed: ${path}`, error);
                    resolve(null);
                    return;
                }

                resolve(prefab);
            });
        });
        this.prefabCache.set(path, task);
        return task;
    }
}
