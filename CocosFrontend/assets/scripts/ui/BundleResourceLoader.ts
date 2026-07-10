import { Asset, AssetManager, assetManager, Prefab, resources, SpriteFrame } from 'cc';

export type PopupBundleName =
    | 'popup_backpack'
    | 'popup_flip_reward'
    | 'popup_invite_reward'
    | 'popup_activity';

interface BundleWarmupConfig {
    bundleName: PopupBundleName;
    imageDirs: string[];
    prefabPaths: string[];
}

const POPUP_PREFAB_BUNDLES: Record<string, PopupBundleName> = {
    BackPackPopupLayer: 'popup_backpack',
    FlipRewardPopupLayer: 'popup_flip_reward',
    InviteRewardPopupLayer: 'popup_invite_reward',
    LevelRewardPopupLayer: 'popup_activity',
    BountyTaskPopupLayer: 'popup_activity',
    ChangeTaskPopupLayer: 'popup_activity',
    DailyCheckInPopupLayer: 'popup_activity',
    RewardPopupLayer: 'popup_activity',
};

const ASSET_BUNDLE_PREFIXES: Array<{ prefix: string; bundleName: PopupBundleName }> = [
    { prefix: 'image/backpack/', bundleName: 'popup_backpack' },
    { prefix: 'image/flip_reward/', bundleName: 'popup_flip_reward' },
    { prefix: 'image/invite_reward/', bundleName: 'popup_invite_reward' },
    { prefix: 'image/dailycheck/', bundleName: 'popup_activity' },
    { prefix: 'image/glodtask/', bundleName: 'popup_activity' },
    { prefix: 'image/reward/', bundleName: 'popup_activity' },
];

const WARMUP_CONFIGS: Record<PopupBundleName, BundleWarmupConfig> = {
    popup_backpack: {
        bundleName: 'popup_backpack',
        imageDirs: ['image/backpack'],
        prefabPaths: ['prefabs/pop/BackPackPopupLayer'],
    },
    popup_flip_reward: {
        bundleName: 'popup_flip_reward',
        imageDirs: ['image/flip_reward'],
        prefabPaths: ['prefabs/pop/FlipRewardPopupLayer'],
    },
    popup_invite_reward: {
        bundleName: 'popup_invite_reward',
        imageDirs: ['image/invite_reward'],
        prefabPaths: ['prefabs/pop/InviteRewardPopupLayer'],
    },
    popup_activity: {
        bundleName: 'popup_activity',
        imageDirs: ['image/dailycheck', 'image/glodtask', 'image/reward'],
        prefabPaths: [
            'prefabs/pop/LevelRewardPopupLayer',
            'prefabs/pop/BountyTaskPopupLayer',
            'prefabs/pop/ChangeTaskPopupLayer',
            'prefabs/pop/DailyCheckInPopupLayer',
            'prefabs/pop/RewardPopupLayer',
        ],
    },
};

export class BundleResourceLoader {
    private static readonly bundleTasks = new Map<string, Promise<AssetManager.Bundle | null>>();
    private static readonly assetTasks = new Map<string, Promise<Asset | null>>();
    private static readonly warmupTasks = new Map<string, Promise<void>>();
    private static readonly warmedBundles = new Set<string>();

    static getBundleNameForPopup(prefabName: string): PopupBundleName | null {
        return POPUP_PREFAB_BUNDLES[prefabName] ?? null;
    }

    static getBundleNameForAssetPath(path: string): PopupBundleName | null {
        const normalizedPath = this.normalizeAssetPath(path);
        const rule = ASSET_BUNDLE_PREFIXES.find(item => normalizedPath.indexOf(item.prefix) === 0);
        return rule?.bundleName ?? null;
    }

    static isBundleReady(bundleName: string): boolean {
        return !!assetManager.getBundle(bundleName);
    }

    static isBundleWarm(bundleName: string): boolean {
        return this.warmedBundles.has(bundleName);
    }

    static async loadBundle(bundleName: string): Promise<AssetManager.Bundle | null> {
        const existing = assetManager.getBundle(bundleName);
        if (existing) {
            return existing;
        }

        const cached = this.bundleTasks.get(bundleName);
        if (cached) {
            return cached;
        }

        const task = new Promise<AssetManager.Bundle | null>(resolve => {
            assetManager.loadBundle(bundleName, (error, bundle) => {
                if (error || !bundle) {
                    console.warn(`[BundleResourceLoader] load bundle failed: ${bundleName}`, error);
                    resolve(null);
                    return;
                }
                resolve(bundle);
            });
        });
        this.bundleTasks.set(bundleName, task);
        return task;
    }

    static async loadPrefab(prefabPath: string, prefabName?: string): Promise<Prefab | null> {
        const bundleName = prefabName ? this.getBundleNameForPopup(prefabName) : null;
        if (bundleName) {
            const asset = await this.loadFromBundle(bundleName, prefabPath, Prefab);
            if (asset instanceof Prefab) {
                return asset;
            }
        }

        return this.loadFromResources(prefabPath, Prefab);
    }

    static async loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        const normalizedPath = this.normalizeSpriteFramePath(path);
        const bundleName = this.getBundleNameForAssetPath(normalizedPath);
        if (bundleName) {
            const asset = await this.loadFromBundle(bundleName, normalizedPath, SpriteFrame);
            if (asset instanceof SpriteFrame) {
                return asset;
            }
        }

        return this.loadFromResources(normalizedPath, SpriteFrame);
    }

    static async preloadBundleAssets(bundleName: PopupBundleName): Promise<void> {
        const cached = this.warmupTasks.get(bundleName);
        if (cached) {
            return cached;
        }
        if (this.warmedBundles.has(bundleName)) {
            return;
        }

        const config = WARMUP_CONFIGS[bundleName];
        const task = this.doPreloadBundleAssets(config);
        this.warmupTasks.set(bundleName, task);
        try {
            await task;
            this.warmedBundles.add(bundleName);
        } finally {
            if (this.warmupTasks.get(bundleName) === task) {
                this.warmupTasks.delete(bundleName);
            }
        }
    }

    static async preloadBundles(bundleNames: PopupBundleName[]): Promise<void> {
        for (const bundleName of bundleNames) {
            await this.preloadBundleAssets(bundleName);
        }
    }

    private static async doPreloadBundleAssets(config: BundleWarmupConfig): Promise<void> {
        const bundle = await this.loadBundle(config.bundleName);
        if (!bundle) {
            return;
        }

        await Promise.all([
            ...config.prefabPaths.map(path => this.loadFromBundle(config.bundleName, path, Prefab)),
            ...config.imageDirs.map(path => this.preloadDir(bundle, path, SpriteFrame)),
        ]);
    }

    private static preloadDir<T extends Asset>(
        bundle: AssetManager.Bundle,
        path: string,
        type: new () => T
    ): Promise<void> {
        return new Promise(resolve => {
            (bundle as any).preloadDir(path, type, null, (error: Error | null) => {
                if (error) {
                    console.warn(`[BundleResourceLoader] preload dir failed: ${bundle.name}/${path}`, error);
                }
                resolve();
            });
        });
    }

    private static async loadFromBundle<T extends Asset>(
        bundleName: string,
        path: string,
        type: new () => T
    ): Promise<T | null> {
        const normalizedPath = this.normalizeAssetPath(path);
        const cacheKey = `${bundleName}:${normalizedPath}:${type.name}`;
        const cached = this.assetTasks.get(cacheKey) as Promise<T | null> | undefined;
        if (cached) {
            return cached;
        }

        const task = this.doLoadFromBundle(bundleName, normalizedPath, type);
        this.assetTasks.set(cacheKey, task as Promise<Asset | null>);
        const asset = await task;
        this.assetTasks.delete(cacheKey);
        return asset;
    }

    private static async doLoadFromBundle<T extends Asset>(
        bundleName: string,
        path: string,
        type: new () => T
    ): Promise<T | null> {
        const bundle = await this.loadBundle(bundleName);
        if (!bundle) {
            return null;
        }

        return new Promise<T | null>(resolve => {
            bundle.load(path, type, (error, asset) => {
                if (error || !asset) {
                    console.warn(`[BundleResourceLoader] load asset failed: ${bundleName}/${path}`, error);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private static loadFromResources<T extends Asset>(path: string, type: new () => T): Promise<T | null> {
        const normalizedPath = this.normalizeAssetPath(path);
        return new Promise<T | null>(resolve => {
            resources.load(normalizedPath, type, (error, asset) => {
                if (error || !asset) {
                    console.warn(`[BundleResourceLoader] load resource failed: ${normalizedPath}`, error);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private static normalizeSpriteFramePath(path: string): string {
        const normalizedPath = this.normalizeAssetPath(path);
        return normalizedPath.endsWith('/spriteFrame') ? normalizedPath : `${normalizedPath}/spriteFrame`;
    }

    private static normalizeAssetPath(path: string): string {
        let normalizedPath = (path || '').trim().replace(/\\/g, '/');
        const resourcesIndex = normalizedPath.indexOf('/resources/');
        if (resourcesIndex >= 0) {
            normalizedPath = normalizedPath.slice(resourcesIndex + '/resources/'.length);
        }
        const bundlesIndex = normalizedPath.indexOf('/bundles/');
        if (bundlesIndex >= 0) {
            const bundlePath = normalizedPath.slice(bundlesIndex + '/bundles/'.length);
            normalizedPath = bundlePath.split('/').slice(1).join('/');
        }
        normalizedPath = normalizedPath.replace(/^resources\//, '');
        normalizedPath = normalizedPath.replace(/^assets\/bundles\/[^/]+\//, '');
        normalizedPath = normalizedPath.replace(/^assets\//, '');
        normalizedPath = normalizedPath.replace(/\.(png|jpg|jpeg|webp|prefab)$/i, '');
        return normalizedPath;
    }
}
