/**
 * BaseUI - UI 控制器基类
 * 所有 UI 控制器必须继承此类
 */

import { _decorator, Component, Node, Color } from 'cc';

const { ccclass } = _decorator;

export interface SceneData {
    [key: string]: any;
}

@ccclass('BaseUI')
export abstract class BaseUI extends Component {
    // 场景名称
    static sceneName: string = '';

    // 场景节点
    protected rootNode: Node | null = null;

    // 是否已初始化
    protected _isInitialized: boolean = false;

    onLoad() {
        this.rootNode = this.node;
        this.onInit();
    }

    start() {
        this._isInitialized = true;
    }

    onDestroy() {
        this.onCleanup();
    }

    // 初始化时调用（onLoad 中）
    protected onInit() { }

    // 清理时调用（onDestroy 中）
    protected onCleanup() { }

    // 显示 UI
    show() {
        if (this.rootNode) {
            this.rootNode.active = true;
        }
    }

    // 隐藏 UI
    hide() {
        if (this.rootNode) {
            this.rootNode.active = false;
        }
    }

    // 进入场景时调用（子类可重写）
    onEnter(data?: SceneData) { }

    // 退出场景时调用（子类可重写）
    onExit() { }

    // 获取场景名称
    getSceneName(): string {
        const ctor = this.constructor as typeof BaseUI;
        return ctor.sceneName || this.node.name;
    }

    protected findNode(pathOrName: string, root: Node | null = this.node): Node | null {
        if (!root || !pathOrName) {
            return null;
        }

        const byPath = root.getChildByPath(pathOrName);
        if (byPath) {
            return byPath;
        }

        return this.findNodeByName(pathOrName, root);
    }

    protected findNodeByPaths(paths: string[], root: Node | null = this.node): Node | null {
        for (const path of paths) {
            const node = this.findNode(path, root);
            if (node) {
                return node;
            }
        }

        return null;
    }

    protected findComponent<T extends Component>(
        pathOrName: string,
        component: new () => T,
        root: Node | null = this.node
    ): T | null {
        const node = this.findNode(pathOrName, root);
        return node?.getComponent(component) ?? null;
    }

    protected findComponentByPaths<T extends Component>(
        paths: string[],
        component: new () => T,
        root: Node | null = this.node
    ): T | null {
        const node = this.findNodeByPaths(paths, root);
        return node?.getComponent(component) ?? null;
    }

    // 设置节点透明度
    setOpacity(opacity: number) {
        if (this.rootNode) {
            (this.rootNode as any).opacity = opacity;
        }
    }

    // 渐显动画
    fadeIn(duration: number = 0.3) {
        this.show();
        if (this.rootNode) {
            (this.rootNode as any).opacity = 0;
            // 注意：Cocos Creator 的 opacity 渐变需要使用 tween
            // 这里简化处理，实际项目可使用 tween 动画
        }
    }

    // 渐隐动画
    fadeOut(duration: number = 0.3, onComplete?: () => void) {
        if (this.rootNode) {
            (this.rootNode as any).opacity = 255;
            // 实际项目使用 tween 动画
            // tween(this.rootNode)
            //     .to(duration, { opacity: 0 })
            //     .call(() => {
            //         this.hide();
            //         onComplete?.();
            //     })
            //     .start();
        }
    }

    private findNodeByName(name: string, root: Node): Node | null {
        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findNodeByName(name, child);
            if (result) {
                return result;
            }
        }

        return null;
    }
}
