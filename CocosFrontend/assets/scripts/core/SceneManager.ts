/**
 * SceneManager - 场景管理
 * 负责 Cocos Creator 内部的场景切换和生命周期管理
 */

import { _decorator, Component, director, Node, Scene } from 'cc';
import { BaseUI, SceneData } from '../ui/BaseUI';

export enum SceneName {
    Loading = 'Loading',
    Battle = 'Battle',
    Shop = 'Shop',
    Chat = 'Chat',
    Home = 'Home',
    Lobby = 'Lobby',
    Login = 'Login'
}

// 场景注册信息
interface SceneInfo {
    name: SceneName;
    prefabPath: string;
    uiClass: typeof BaseUI | null;
}

export class SceneManager {
    private static instance: SceneManager;

    // 当前活动场景
    private static _currentScene: BaseUI | null = null;
    private static _currentSceneName: SceneName = SceneName.Loading;

    // 场景注册表
    private static sceneRegistry: Map<SceneName, SceneInfo> = new Map();

    // 加载中的场景
    private static loadingScene: BaseUI | null = null;

    private constructor() {}

    static getInstance(): SceneManager {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }

    // 获取当前场景实例
    static getCurrentScene(): BaseUI | null {
        return SceneManager._currentScene;
    }

    // 获取当前场景名称
    static getCurrentSceneName(): SceneName {
        return SceneManager._currentSceneName;
    }

    // 注册场景
    static registerScene(sceneInfo: SceneInfo) {
        SceneManager.sceneRegistry.set(sceneInfo.name, sceneInfo);
    }

    // 注册所有默认场景
    static registerDefaultScenes() {
        // 在 Cocos Creator 中需要在场景中手动挂载脚本或使用预制体
        // 这里注册只是建立映射关系
        const scenes: SceneInfo[] = [
            { name: SceneName.Loading, prefabPath: 'prefabs/ProgressBarCtrl', uiClass: null },
            { name: SceneName.Battle, prefabPath: 'prefabs/BattleUI', uiClass: null },
            { name: SceneName.Shop, prefabPath: 'prefabs/ShopUI', uiClass: null },
            { name: SceneName.Chat, prefabPath: 'prefabs/ChatUI', uiClass: null },
            { name: SceneName.Home, prefabPath: 'prefabs/HomeUI', uiClass: null },
            { name: SceneName.Lobby, prefabPath: 'prefabs/LobbyUI', uiClass: null },
            { name: SceneName.Login, prefabPath: 'prefabs/LoginUI', uiClass: null }
        ];

        scenes.forEach(info => {
            SceneManager.registerScene(info);
        });
    }

    // 切换场景（使用 Cocos Creator 场景系统）
    static async switchScene(sceneName: SceneName, data?: SceneData): Promise<void> {
        console.log(`[SceneManager] Switching to scene: ${sceneName}`);

        const sceneInfo = SceneManager.sceneRegistry.get(sceneName);
        if (!sceneInfo) {
            console.warn(`[SceneManager] Scene not registered: ${sceneName}`);
            // 如果未注册，尝试直接使用 director.loadScene
            await SceneManager.loadWithDirector(sceneName, data);
            return;
        }

        // 调用 onExit 清理当前场景
        if (SceneManager._currentScene) {
            SceneManager._currentScene.onExit();
        }

        // 加载新场景
        await SceneManager.loadWithDirector(sceneName, data);
    }

    // 使用 director.loadScene 加载场景
    private static async loadWithDirector(sceneName: string, data?: SceneData): Promise<void> {
        return new Promise((resolve, reject) => {
            // 检查场景是否存在
            const scene = director.getScene();
            if (scene && scene.name === sceneName) {
                console.log(`[SceneManager] Already in scene: ${sceneName}`);
                resolve();
                return;
            }

            director.loadScene(sceneName, (err: any) => {
                if (err) {
                    console.error('[SceneManager] Failed to load scene:', err);
                    reject(err);
                } else {
                    console.log(`[SceneManager] Scene loaded: ${sceneName}`);
                    SceneManager._currentSceneName = sceneName as SceneName;
                    SceneManager._currentScene = null;

                    // 在下一帧查找场景中的 UI 组件并调用 onEnter
                    setTimeout(() => {
                        SceneManager.notifySceneEnter(sceneName as SceneName, data);
                        resolve();
                    }, 0);
                }
            });
        });
    }

    // 通知场景已进入
    private static notifySceneEnter(sceneName: SceneName, data?: SceneData) {
        // 在实际项目中，可以通过事件或直接获取挂载的组件
        // 这里假设场景根节点上有对应的 UI 组件
        const scene = director.getScene();
        if (!scene) return;

        const rootNode = scene.getChildByName('Canvas');
        if (!rootNode) return;

        // 查找继承 BaseUI 的组件
        const uiComponents = rootNode.getComponentsInChildren(BaseUI);
        uiComponents.forEach(ui => {
            if (ui.getSceneName() === sceneName || ui.getSceneName() === rootNode.name) {
                SceneManager._currentScene = ui;
                ui.onEnter(data);
            }
        });
    }

    // 创建并显示 UI（内存中场景切换）
    static async showUI<T extends BaseUI>(
        uiClass: new () => T,
        parentNode: Node,
        data?: SceneData
    ): Promise<T> {
        // 清理当前 UI
        if (SceneManager._currentScene) {
            SceneManager._currentScene.onExit();
            SceneManager._currentScene.hide();
        }

        // 创建新 UI
        const node = new Node();
        node.setParent(parentNode);

        const ui = node.addComponent(uiClass);
        if (ui) {
            SceneManager._currentScene = ui;
            ui.onEnter(data);
        }

        return ui!;
    }

    // 跳转到 Loading 场景
    static async goToLoading(): Promise<void> {
        await this.switchScene(SceneName.Loading);
    }

    // 跳转到 Battle 场景
    static async goToBattle(): Promise<void> {
        await this.switchScene(SceneName.Battle);
    }

    // 跳转到 Shop 场景
    static async goToShop(): Promise<void> {
        await this.switchScene(SceneName.Shop);
    }

    // 跳转到 Chat 场景
    static async goToChat(): Promise<void> {
        await this.switchScene(SceneName.Chat);
    }

    // 跳转到主页
    static async goToHome(): Promise<void> {
        await this.switchScene(SceneName.Home);
    }

    // 跳转到游戏大厅
    static async goToLobby(): Promise<void> {
        await this.switchScene(SceneName.Lobby);
    }

    // 跳转到登录页
    static async goToLogin(): Promise<void> {
        await this.switchScene(SceneName.Login);
    }

    // 带数据跳转（用于 Loading 完成后跳转）
    static async goToBattleWithData(data: SceneData): Promise<void> {
        await this.switchScene(SceneName.Battle, data);
    }

    // 初始化
    static async init() {
        SceneManager.registerDefaultScenes();
        console.log('[SceneManager] Initialized');
    }
}
