import { _decorator, Component, Label, ProgressBar, director, resources, Prefab, tween, Sprite, Color, Node, UITransform, SpriteFrame } from 'cc';
import { HomeView } from './HomeView';
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

    @property(Node)
    safetyKeySlider: Node | null = null;

    @property({ type: [Node] })
    gearTicks: Node[] = [];

    @property
    sliderTravelPadding: number = 0;

    @property
    gearRotateSpeed: number = 120;

    @property
    fillSpritePath: string = 'image/loading/loading_bar_fill/spriteFrame';

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
    preloadPrefabPaths: string[] = [];

    private progress = 0;
    private tweenTarget: any = null;
    private stopped = false;
    private loadingStarted = false;
    private fillFullWidth = 0;
    private fillFullHeight = 0;
    private fillLeftX = 0;
    private fillY = 0;
    private sliderStartX = 0;
    private sliderEndX = 0;
    private sliderY = 0;
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

            this.ensureHomeView();
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

    private ensureHomeView() {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        const homeNode = canvas?.getChildByName('Home') ?? canvas;
        if (!homeNode) {
            console.warn('[ProgressBarCtrl] Home root node not found.');
            return;
        }

        if (!homeNode.getComponent(HomeView)) {
            console.warn('[ProgressBarCtrl] HomeView component is not mounted. Please add HomeView to Home scene Canvas in Cocos Creator.');
        }
    }

    private applyProgress(percent: number) {
        this.progress = Math.max(0, Math.min(100, percent));

        const normalizedProgress = this.progress / 100;
        this.updateFillSize(normalizedProgress);
        this.updateSliderPosition(normalizedProgress);

        if (this.progressBar) {
            this.progressBar.progress = normalizedProgress;
        }

        const label = this.progressLabel ?? this.percentLabel;
        if (label) {
            label.string = `加载中 ${Math.floor(this.progress)}%`;
        }
    }

    private resolveNodes() {
        this.frameBg ??= this.node.getChildByName('FrameBg')?.getComponent(Sprite) ?? null;
        this.frameBg ??= this.findNode('BarFrame')?.getComponent(Sprite) ?? null;
        this.barMask ??= this.node.getChildByName('BarMask');
        this.barMask ??= this.findNode('BarFillMask');
        this.barFill ??= this.node.getChildByPath('BarMask/BarFill')?.getComponent(Sprite) ?? null;
        this.barFill ??= this.findNode('BarFill')?.getComponent(Sprite) ?? null;
        this.safetyKeySlider ??= this.findNode('SafetyKeySlider');
        this.progressLabel ??= this.node.getChildByName('ProgressLabel')?.getComponent(Label) ?? null;
        this.percentLabel ??= this.node.getChildByName('PercentLabel')?.getComponent(Label) ?? null;
        this.percentLabel ??= this.node.getChildByName('PercentLabe')?.getComponent(Label) ?? null;
        this.progressLabel ??= this.findNode('LoadingText')?.getComponent(Label) ?? null;
        this.progressBar ??= this.getComponent(ProgressBar);

        if (this.gearTicks.length === 0) {
            const gearRoot = this.findNode('GearTicks');
            if (gearRoot) {
                this.gearTicks = gearRoot.children.slice();
            }
        }
    }

    private setupBarFill() {
        if (this.barFill) {
            this.configureBarFill();
            this.loadFillSpriteFrameIfNeeded();
            return;
        }

        console.error('[ProgressBarCtrl] BarFill node is missing. Expected: LoadingGroup/BarFillMask/BarFill');
    }

    private configureBarFill() {
        if (!this.barFill) {
            return;
        }

        const transform = this.barFill.getComponent(UITransform);
        const maskTransform = this.barMask?.getComponent(UITransform) ?? null;
        const width = maskTransform?.width ?? transform?.width ?? this.fillWidth;
        const height = transform?.height ?? this.fillHeight;

        this.barFill.color = Color.WHITE;
        this.barFill.sizeMode = Sprite.SizeMode.CUSTOM;

        if (!this.fillConfigured && transform && width > 0 && height > 0) {
            this.fillFullWidth = width;
            this.fillFullHeight = height;
            this.fillLeftX = -(maskTransform?.width ?? width) * (maskTransform?.anchorX ?? 0.5);
            this.fillY = this.barFill.node.position.y + this.fillOffsetY;
            transform.setAnchorPoint(0, transform.anchorY);
            this.barFill.node.setPosition(this.fillLeftX + this.fillOffsetX, this.fillY, this.barFill.node.position.z);
            this.barFill.node.setScale(1, 1, this.barFill.node.scale.z);
            transform.setContentSize(0.001, height);
            this.configureSliderRange(maskTransform);
            this.fillConfigured = true;
        }
    }

    private updateFillSize(progress: number) {
        if (!this.barFill || !this.fillConfigured) {
            return;
        }

        const transform = this.barFill.getComponent(UITransform);
        if (!transform) {
            return;
        }

        const width = this.fillFullWidth * Math.max(0.001, Math.min(1, progress));
        transform.setContentSize(width, this.fillFullHeight);
        this.barFill.node.setPosition(this.fillLeftX + this.fillOffsetX, this.fillY, this.barFill.node.position.z);
    }

    private configureSliderRange(maskTransform: UITransform | null) {
        if (!this.barMask || !maskTransform) {
            return;
        }

        const maskPosition = this.barMask.position;
        const left = maskPosition.x - maskTransform.width * maskTransform.anchorX + this.sliderTravelPadding;
        const right = maskPosition.x + maskTransform.width * (1 - maskTransform.anchorX) - this.sliderTravelPadding;

        this.sliderStartX = left;
        this.sliderEndX = right;
        this.sliderY = this.safetyKeySlider?.position.y ?? maskPosition.y;
    }

    private updateSliderPosition(progress: number) {
        if (!this.safetyKeySlider || !this.fillConfigured) {
            return;
        }

        const clampedProgress = Math.max(0, Math.min(1, progress));
        const x = this.sliderStartX + (this.sliderEndX - this.sliderStartX) * clampedProgress;
        this.safetyKeySlider.setPosition(x, this.sliderY, this.safetyKeySlider.position.z);
    }

    private findNode(name: string, root: Node = this.node): Node | null {
        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const found = this.findNode(name, child);
            if (found) {
                return found;
            }
        }

        return null;
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

    update(deltaTime: number) {
        if (this.gearTicks.length === 0 || this.gearRotateSpeed === 0) {
            return;
        }

        const deltaAngle = this.gearRotateSpeed * deltaTime;
        this.gearTicks.forEach((gear, index) => {
            if (!gear?.isValid) {
                return;
            }

            gear.angle += index % 2 === 0 ? deltaAngle : -deltaAngle;
        });
    }

    onDestroy() {
        this.stopped = true;
        if (this.tweenTarget) {
            tween(this.tweenTarget).stop();
            this.tweenTarget = null;
        }
    }
}
