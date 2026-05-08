import { _decorator, Component, Label, ProgressBar, director, resources, Prefab, tween, Sprite, Color, Node, UITransform, SpriteFrame } from 'cc';
import { HomeUI } from './HomeUI';
import { dataManager } from '../core/DataManager';

const { ccclass, property } = _decorator;

@ccclass('ProgressBarCtrl')
export class ProgressBarCtrl extends Component {
    @property(Sprite)
    frameBg: Sprite | null = null;

    @property(Label)
    progressLabel: Label | null = null;

    @property(Node)
    barMask: Node | null = null;

    @property(Sprite)
    barFill: Sprite | null = null;

    @property
    fillSpritePath: string = 'progress/progress_fill/spriteFrame';

    @property
    fillWidth: number = 900;

    @property
    fillHeight: number = 104;

    @property
    fillOffsetX: number = 0;

    @property
    fillOffsetY: number = 0;

    @property(ProgressBar)
    progressBar: ProgressBar | null = null;

    @property(Label)
    percentLabel: Label | null = null;

    @property
    autoStartLoading: boolean = true;

    @property
    targetScene: string = 'Home';

    @property
    completeDelay: number = 0.2;

    @property
    minLoadingSeconds: number = 0;

    @property({ type: [String] })
    preloadPrefabPaths: string[] = [
        'prefabs/HeaderContainer',
        'prefabs/GameContainer',
        'prefabs/ChatContainer',
        'prefabs/TabBarContainer'
    ];

    private progress = 0;
    private tweenTarget: any = null;
    private stopped = false;
    private loadingStarted = false;
    private fillFullWidth = 0;
    private fillFullHeight = 0;
    private fillLeftX = 0;
    private fillY = 0;
    private fillScaleX = 1;
    private fillScaleY = 1;
    private fillConfigured = false;

    onLoad() {
        this.resolveNodes();
        this.setupBarFill();
        this.setProgressImmediate(0);
    }

    start() {
        if (this.autoStartLoading) {
            this.startLoading();
        }
    }

    setProgress(percent: number, duration: number = 0.12) {
        percent = Math.max(0, Math.min(100, percent));

        if (this.tweenTarget) {
            tween(this.tweenTarget).stop();
            this.tweenTarget = null;
        }

        if (duration <= 0) {
            this.setProgressImmediate(percent);
            return;
        }

        const state = { value: this.progress };
        this.tweenTarget = state;
        tween(state)
            .to(duration, { value: percent }, {
                onUpdate: target => this.applyProgress(target.value)
            })
            .call(() => {
                this.tweenTarget = null;
                this.setProgressImmediate(percent);
            })
            .start();
    }

    setProgressImmediate(percent: number) {
        this.applyProgress(Math.max(0, Math.min(100, percent)));
    }

    getProgress(): number {
        return this.progress;
    }

    private async startLoading() {
        if (this.loadingStarted) {
            return;
        }

        this.resolveNodes();
        this.setupBarFill();

        if (!this.barFill && !this.progressBar) {
            console.error('[ProgressBarCtrl] BarFill Sprite or ProgressBar is not ready.');
            return;
        }

        this.loadingStarted = true;
        this.stopped = false;
        const startTime = Date.now();
        this.setProgressImmediate(0);
        this.setProgress(8, 0.3);

        await this.preloadTargetScene();
        if (this.stopped) {
            return;
        }

        await this.preloadHomePrefabs();
        if (this.stopped) {
            return;
        }

        this.setProgress(96, 0.35);
        await this.waitForMinLoadingTime(startTime);
        if (this.stopped) {
            return;
        }

        this.setProgress(100, 0.25);
        await this.delay(this.completeDelay * 1000);
        dataManager.ensureDevelopmentLogin();

        director.loadScene(this.targetScene, (error: any) => {
            if (error) {
                console.error(`[ProgressBarCtrl] Failed to load scene: ${this.targetScene}`, error);
                return;
            }

            this.ensureHomeUI();
        });
    }

    private preloadTargetScene(): Promise<void> {
        return new Promise(resolve => {
            director.preloadScene(
                this.targetScene,
                (completedCount: number, totalCount: number) => {
                    if (this.stopped) {
                        return;
                    }

                    const sceneProgress = totalCount > 0 ? completedCount / totalCount : 0;
                    this.setProgress(sceneProgress * 70, 0.35);
                },
                error => {
                    if (error) {
                        console.error(`[ProgressBarCtrl] Failed to preload scene: ${this.targetScene}`, error);
                    }
                    resolve();
                }
            );
        });
    }

    private async preloadHomePrefabs() {
        const paths = this.preloadPrefabPaths.filter(path => !!path && path !== 'prefabs/ShopContainer');
        if (paths.length === 0) {
            this.setProgressImmediate(95);
            return;
        }

        let loadedCount = 0;
        await Promise.all(paths.map(path => this.loadPrefab(path).then(() => {
            loadedCount += 1;
            this.setProgress(70 + (loadedCount / paths.length) * 25, 0.35);
        })));
    }

    private loadPrefab(path: string): Promise<void> {
        return new Promise(resolve => {
            resources.load(path, Prefab, error => {
                if (error) {
                    console.error(`[ProgressBarCtrl] Failed to preload prefab: ${path}`, error);
                }
                resolve();
            });
        });
    }

    private ensureHomeUI() {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        const homeNode = canvas?.getChildByName('Home') ?? canvas;
        if (!homeNode) {
            console.warn('[ProgressBarCtrl] Home root node not found.');
            return;
        }

        if (!homeNode.getComponent(HomeUI)) {
            console.warn('[ProgressBarCtrl] HomeUI component is not mounted. Please add HomeUI to Home scene Canvas in Cocos Creator.');
        }
    }

    private applyProgress(percent: number) {
        this.progress = Math.max(0, Math.min(100, percent));

        this.updateFillScale(this.progress / 100);

        if (this.progressBar) {
            this.progressBar.progress = this.progress / 100;
        }

        const label = this.progressLabel ?? this.percentLabel;
        if (label) {
            label.string = `${Math.floor(this.progress)}%`;
        }
    }

    private resolveNodes() {
        this.frameBg ??= this.node.getChildByName('FrameBg')?.getComponent(Sprite) ?? null;
        this.barMask ??= this.node.getChildByName('BarMask');
        this.barFill ??= this.node.getChildByPath('BarMask/BarFill')?.getComponent(Sprite) ?? null;
        this.progressLabel ??= this.node.getChildByName('ProgressLabel')?.getComponent(Label) ?? null;
        this.percentLabel ??= this.node.getChildByName('PercentLabel')?.getComponent(Label) ?? null;
        this.percentLabel ??= this.node.getChildByName('PercentLabe')?.getComponent(Label) ?? null;
        this.progressBar ??= this.getComponent(ProgressBar);
    }

    private setupBarFill() {
        if (this.barFill) {
            this.configureBarFill();
            this.loadFillSpriteFrameIfNeeded();
            return;
        }

        console.error('[ProgressBarCtrl] BarFill node is missing. Expected: ProgressBar/BarMask/BarFill');
    }

    private configureBarFill() {
        if (!this.barFill) {
            return;
        }

        const transform = this.barFill.getComponent(UITransform);
        const width = transform?.width ?? this.fillWidth;
        const height = transform?.height ?? this.fillHeight;

        this.barFill.color = Color.WHITE;
        this.barFill.sizeMode = Sprite.SizeMode.CUSTOM;

        if (!this.fillConfigured && transform && width > 0 && height > 0) {
            const position = this.barFill.node.position;
            const scale = this.barFill.node.scale;
            this.fillFullWidth = width;
            this.fillFullHeight = height;
            this.fillLeftX = position.x - width * transform.anchorX;
            this.fillY = position.y;
            this.fillScaleX = scale.x;
            this.fillScaleY = scale.y;

            transform.setAnchorPoint(0, transform.anchorY);
            this.barFill.node.setPosition(this.fillLeftX, this.fillY, position.z);
            transform.setContentSize(width, height);
            this.fillConfigured = true;
        }
    }

    private updateFillScale(progress: number) {
        if (!this.barFill || !this.fillConfigured) {
            return;
        }

        const scaleX = this.fillScaleX * Math.max(0.001, Math.min(1, progress));
        this.barFill.node.setScale(scaleX, this.fillScaleY, this.barFill.node.scale.z);
        this.barFill.node.setPosition(this.fillLeftX, this.fillY, this.barFill.node.position.z);
    }

    private loadFillSpriteFrameIfNeeded() {
        if (!this.barFill || !this.fillSpritePath) {
            return;
        }

        if (this.barFill.spriteFrame) {
            return;
        }

        resources.load(this.fillSpritePath, SpriteFrame, (error, frame) => {
            if (error || !frame || !this.barFill?.isValid) {
                console.warn(`[ProgressBarCtrl] Failed to load fill sprite: ${this.fillSpritePath}`, error);
                return;
            }

            this.barFill.spriteFrame = frame;
            this.configureBarFill();
            this.applyProgress(this.progress);
        });
    }

    private async waitForMinLoadingTime(startTime: number) {
        const elapsed = Date.now() - startTime;
        const minMs = Math.max(0, this.minLoadingSeconds * 1000);
        if (elapsed < minMs) {
            await this.delay(minMs - elapsed);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onDestroy() {
        this.stopped = true;
        if (this.tweenTarget) {
            tween(this.tweenTarget).stop();
            this.tweenTarget = null;
        }
    }
}
