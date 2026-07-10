import {
    _decorator,
    BlockInputEvents,
    Button,
    Color,
    instantiate,
    Label,
    Layout,
    Node,
    ProgressBar,
    ScrollView,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
    Widget
} from 'cc';
import { BaseUI } from './BaseUI';
import { dataManager } from '../core/DataManager';
import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';
import { PopupPrefabLoader } from './PopupPrefabLoader';
import { PopupStack } from './PopupStack';
import { BundleResourceLoader } from './BundleResourceLoader';

const { ccclass, property } = _decorator;

interface LevelRewardItem {
    id?: number;
    activityId?: number;
    level: number;
    rewardType?: string;
    rewardCount: number;
    rewards?: LevelRewardPart[];
    rewardDesc?: string;
    canClaim?: boolean;
    claimed?: boolean;
}

interface LevelRewardPart {
    rewardType: string;
    rewardCount: number;
}

interface LevelRewardData {
    username: string;
    avatarUrl?: string;
    level: number;
    exp: number;
    nextLevelExp: number;
    rewards: LevelRewardItem[];
}

type BountyTaskRewardType = 'GOLD' | 'DIAMOND';
type BountyTaskStatus = 'UNCLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

interface BountyTaskItem {
    id: number;
    rewardType: BountyTaskRewardType;
    title: string;
    desc: string;
    rewardAmount: number;
    progress: number;
    targetProgress: number;
    challengeCount: number;
    status?: BountyTaskStatus;
    acceptedAt?: number;
    deadlineAt?: number;
}

interface BountyTaskData {
    goldTask: BountyTaskItem;
    diamondTask: BountyTaskItem;
    freeChangeAvailable: boolean;
    changeCostDiamond: number;
}

interface DailyCheckInReward {
    dayIndex: number;
    rewardType: string;
    rewardCount: number;
    claimed: boolean;
    claimable: boolean;
}

interface DailyCheckInData {
    weekStartDate: string;
    todayIndex: number;
    todayClaimed: boolean;
    userGold?: number;
    userDiamond?: number;
    rewards: DailyCheckInReward[];
}

type RewardPopupSource = 'level' | 'dailyCheckIn' | 'bountyTask';

interface RewardPopupPendingReward {
    source: RewardPopupSource;
    rewardType: string;
    rewardCount: number;
    allowDiamondMultiplier?: boolean;
    levelReward?: LevelRewardItem;
    levelRewardPart?: LevelRewardPart;
    finishLevelRewardClaim?: boolean;
    dailyReward?: DailyCheckInReward;
    bountyTask?: BountyTaskItem;
}

@ccclass('ActivityPopupRoot')
export class ActivityPopupRoot extends BaseUI {
    @property(Node)
    levelRewardPopupLayer: Node | null = null;

    @property(Node)
    bountyTaskPopupLayer: Node | null = null;

    @property(Node)
    changeTaskPopupLayer: Node | null = null;

    @property(Node)
    dailyCheckInPopupLayer: Node | null = null;

    rewardScrollView: ScrollView | null = null;

    rewardContent: Node | null = null;

    rewardItemTemplate: Node | null = null;

    usernameLabel: Label | null = null;

    levelLabel: Label | null = null;

    expProgressBar: ProgressBar | null = null;

    expLabel: Label | null = null;

    private readonly generatedRewardItemPrefix = 'GeneratedLevelRewardItem';
    private readonly rewardItemSpacing = 16;
    private readonly rewardListPaddingTop = 12;
    private readonly rewardListPaddingBottom = 12;
    private rewardContentTopY = 0;
    private rewardMaxScrollY = 0;
    private receiveSpriteFrame: SpriteFrame | null = null;
    private receivedSpriteFrame: SpriteFrame | null = null;
    private bountyTaskData: BountyTaskData | null = null;
    private readonly bountyTaskChangeCosts = [4, 6, 8, 10];
    private bountyTaskChangeCount = 0;
    private readonly bountyTaskFreeChangeStorageKey = 'kapgame_bounty_task_free_change_date';
    private readonly bountyTaskDurationMs = 2 * 60 * 60 * 1000;
    private readonly bountyTaskCollapsedCardHeight = 200;
    private readonly bountyTaskExpandedCardHeight = 210;
    private readonly bountyTaskSwapDuration = 0.22;
    private readonly mockStorage = new Map<string, string>();
    private bountyTaskYellowButtonSpriteFrame: SpriteFrame | null = null;
    private bountyTaskGrayButtonSpriteFrame: SpriteFrame | null = null;
    private bountyTaskBlueButtonSpriteFrame: SpriteFrame | null = null;
    private bountyTaskCompletedStatusSpriteFrame: SpriteFrame | null = null;
    private bountyTaskUnfinishedStatusSpriteFrame: SpriteFrame | null = null;
    private bountyTaskSwapPlaying = false;
    private readonly bountyTaskButtonLabelDefaultX = new WeakMap<Node, number>();
    private readonly bountyTaskButtonLabelDefaultWidth = new WeakMap<Node, number>();
    private readonly bountyTaskButtonLabelDefaultAnchor = new WeakMap<Node, { x: number; y: number }>();
    private dailyCheckInData: DailyCheckInData | null = null;
    private rewardPopupRoot: Node | null = null;
    private rewardPopupLayer: Node | null = null;
    private rewardPopupStarEffectNode: Node | null = null;
    private rewardPopupStarGroupNode: Node | null = null;
    private rewardPopupHaloRingSprite: Node | null = null;
    private rewardPopupLightSprite: Node | null = null;
    private rewardPopupGetResourceNode: Node | null = null;
    private rewardPopupFlyNode: Node | null = null;
    private rewardPopupFlyEffectNode: Node | null = null;
    private rewardPopupGoldFlyNode: Node | null = null;
    private rewardPopupDiamondFlyNode: Node | null = null;
    private rewardPopupGoldFlySprites: Node[] = [];
    private rewardPopupDiamondFlySprites: Node[] = [];
    private readonly rewardPopupFlyDefaultPositions = new WeakMap<Node, Vec3>();
    private rewardPopupItemSprite: Sprite | null = null;
    private rewardPopupGoldIcon: Sprite | null = null;
    private rewardPopupDiamondIcon: Sprite | null = null;
    private rewardPopupStandardButton: Node | null = null;
    private rewardPopupDoubleButton: Node | null = null;
    private rewardPopupTenTimeButton: Node | null = null;
    private rewardPopupPendingReward: RewardPopupPendingReward | null = null;
    private rewardPopupQueue: RewardPopupPendingReward[] = [];
    private rewardPopupClaiming = false;
    private rewardPopupDelayResourceSync = false;
    private readonly rewardPopupDiamondCost = 20;
    private rewardPopupEffectAssetsPromise: Promise<void> | null = null;
    private rewardPopupHaloSpriteFrame: SpriteFrame | null = null;
    private rewardPopupStarSpriteFrame: SpriteFrame | null = null;
    private rewardPopupLightSpriteFrame: SpriteFrame | null = null;
    private cachedLevelRewardData: LevelRewardData | null = null;
    private levelRewardDataLoading: Promise<LevelRewardData> | null = null;
    private levelRewardRendered = false;
    private levelRewardAssetsPromise: Promise<void> | null = null;
    private levelRewardGoldSpriteFrame: SpriteFrame | null = null;
    private levelRewardDiamondSpriteFrame: SpriteFrame | null = null;
    private unsubscribeUserDataChange: (() => void) | null = null;

    private readonly mockGoldBountyTasks: BountyTaskItem[] = [
        {
            id: 1001,
            rewardType: 'GOLD',
            title: '金币任务',
            desc: '完成 3 局任意模式对战',
            rewardAmount: 200,
            progress: 0,
            targetProgress: 3,
            challengeCount: 100
        },
        {
            id: 1002,
            rewardType: 'GOLD',
            title: '金币任务',
            desc: '今日累计获得 5 次胜利',
            rewardAmount: 320,
            progress: 1,
            targetProgress: 5,
            challengeCount: 86
        },
        {
            id: 1003,
            rewardType: 'GOLD',
            title: '金币任务',
            desc: '和好友完成 2 次互动',
            rewardAmount: 180,
            progress: 0,
            targetProgress: 2,
            challengeCount: 64
        }
    ];

    private readonly mockDiamondBountyTasks: BountyTaskItem[] = [
        {
            id: 2001,
            rewardType: 'DIAMOND',
            title: '钻石任务',
            desc: '完成 1 次高难度挑战',
            rewardAmount: 20,
            progress: 0,
            targetProgress: 1,
            challengeCount: 58
        },
        {
            id: 2002,
            rewardType: 'DIAMOND',
            title: '钻石任务',
            desc: '累计达成 10 次连击',
            rewardAmount: 35,
            progress: 4,
            targetProgress: 10,
            challengeCount: 42
        },
        {
            id: 2003,
            rewardType: 'DIAMOND',
            title: '钻石任务',
            desc: '今日分享并完成 1 局游戏',
            rewardAmount: 15,
            progress: 0,
            targetProgress: 1,
            challengeCount: 73
        }
    ];

    onInit() {
        super.onInit();
        this.resolveNodes();
        this.hideLevelRewardPopup();
        this.hideBountyTaskPopup();
        this.hideChangeTaskPopup();
        this.hideDailyCheckInPopup();
        this.hideRewardPopup();
        this.unsubscribeUserDataChange = dataManager.subscribeUserData(this.onUserDataChanged);
    }

    protected onCleanup() {
        this.unsubscribeUserDataChange?.();
        this.unsubscribeUserDataChange = null;
        this.stopRewardPopupEffects();
    }

    async preloadActivityPopups() {
        const wasActive = this.node.active;
        this.node.active = true;
        this.bringSelfToFront();
        await this.ensureActivityPopupPrefabNodes();
        this.bindActivityPopupRuntimeEvents();
        await Promise.all([
            this.preloadLevelRewardAssets(),
            this.preloadRewardPopupEffectAssets()
        ]);

        const levelData = this.getImmediateLevelRewardData();
        this.renderLevelRewardData(levelData, true);
        void this.refreshLevelRewardData(false, true, false);

        const [bountyTaskData, dailyCheckInData] = await Promise.all([
            this.loadBountyTaskData(),
            this.loadDailyCheckInData()
        ]);
        this.renderBountyTaskData(bountyTaskData);
        this.renderDailyCheckInData(dailyCheckInData);

        this.hideLevelRewardPopup();
        this.hideBountyTaskPopup();
        this.hideChangeTaskPopup();
        this.hideDailyCheckInPopup();
        this.hideRewardPopup();
        this.node.active = this.hasVisiblePopupChildren() || wasActive;
        console.log('[ActivityPopupRoot] preloadActivityPopups completed');
    }

    async showLevelRewardPopup() {
        this.node.active = true;
        this.bringSelfToFront();
        this.resolveNodes();
        await this.ensureActivityPopupPrefabNodes(['LevelRewardPopupLayer']);
        this.bindActivityPopupRuntimeEvents();
        if (!this.levelRewardPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] LevelRewardPopupLayer not found');
            return;
        }

        PopupStack.open(this.levelRewardPopupLayer);
        this.ensureBlockInputEvents(this.levelRewardPopupLayer);

        if (!this.levelRewardRendered) {
            const data = this.getImmediateLevelRewardData();
            this.renderLevelRewardData(data, true);
        }
        void this.refreshLevelRewardData(false, true, false);
    }

    hideLevelRewardPopup() {
        this.resolveNodes();
        if (this.levelRewardPopupLayer?.isValid) {
            PopupStack.close(this.levelRewardPopupLayer);
        }
    }

    onLevelRewardCloseButtonClick() {
        this.hideLevelRewardPopup();
    }

    async showBountyTaskPopup() {
        this.node.active = true;
        this.bringSelfToFront();
        this.resolveNodes();
        await this.ensureActivityPopupPrefabNodes(['BountyTaskPopupLayer']);
        this.bindActivityPopupRuntimeEvents();
        if (!this.bountyTaskPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] BountyTaskPopupLayer not found');
            return;
        }

        PopupStack.open(this.bountyTaskPopupLayer);
        this.ensureBlockInputEvents(this.bountyTaskPopupLayer);
        await this.loadBountyTaskButtonSpriteFrames();

        const data = await this.loadBountyTaskData();
        this.renderBountyTaskData(data);
    }

    hideBountyTaskPopup() {
        this.resolveNodes();
        this.unschedule(this.updateBountyTaskCountdowns);
        this.hideChangeTaskPopup();
        if (this.bountyTaskPopupLayer?.isValid) {
            PopupStack.close(this.bountyTaskPopupLayer);
        }
    }

    onBountyTaskCloseButtonClick() {
        this.hideBountyTaskPopup();
    }

    async showDailyCheckInPopup() {
        this.node.active = true;
        this.bringSelfToFront();
        this.resolveNodes();
        await this.ensureActivityPopupPrefabNodes(['DailyCheckInPopupLayer']);
        this.bindActivityPopupRuntimeEvents();
        if (!this.dailyCheckInPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] DailyCheckInPopupLayer not found');
            return;
        }

        PopupStack.open(this.dailyCheckInPopupLayer);
        this.ensureBlockInputEvents(this.dailyCheckInPopupLayer);
        console.log('[ActivityPopupRoot] showDailyCheckInPopup active', {
            rootActive: this.node.active,
            layerActive: this.dailyCheckInPopupLayer.active,
            layerParent: this.dailyCheckInPopupLayer.parent?.name ?? ''
        });
        const data = await this.loadDailyCheckInData();
        this.renderDailyCheckInData(data);
    }

    hideDailyCheckInPopup() {
        this.resolveNodes();
        if (this.dailyCheckInPopupLayer?.isValid) {
            PopupStack.close(this.dailyCheckInPopupLayer);
        }
    }

    onDailyCheckInCloseButtonClick() {
        this.hideDailyCheckInPopup();
    }

    async onDailyCheckInReceiveButtonClick() {
        void this.showRewardPopupForDailyCheckIn();
    }

    async onDailyCheckInDoubleReceiveButtonClick() {
        void this.showRewardPopupForDailyCheckIn();
    }

    async onBountyTaskChangeButtonClick() {
        if (this.hasInProgressBountyTask()) {
            void this.showChangeTaskPopup();
            return;
        }

        await this.changeBountyTasks();
    }

    onChangeTaskCancelButtonClick() {
        this.hideChangeTaskPopup();
    }

    async onChangeTaskConfirmButtonClick() {
        this.hideChangeTaskPopup();
        await this.changeBountyTasks();
    }

    async showChangeTaskPopup() {
        this.node.active = true;
        this.bringSelfToFront();
        this.resolveNodes();
        await this.ensureActivityPopupPrefabNodes(['ChangeTaskPopupLayer']);
        this.bindActivityPopupRuntimeEvents();
        if (!this.changeTaskPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] ChangeTaskPopupLayer not found');
            return;
        }

        this.setBountyTaskBackgroundSpriteEnabled(false);
        PopupStack.open(this.changeTaskPopupLayer, { hideSiblings: false });
        this.ensureBlockInputEvents(this.changeTaskPopupLayer);
    }

    hideChangeTaskPopup() {
        this.resolveNodes();
        if (this.changeTaskPopupLayer?.isValid) {
            PopupStack.close(this.changeTaskPopupLayer);
        }
        this.setBountyTaskBackgroundSpriteEnabled(true);
    }

    private hasInProgressBountyTask(): boolean {
        const data = this.bountyTaskData;
        if (!data) {
            return false;
        }

        for (const task of [data.goldTask, data.diamondTask]) {
            this.normalizeBountyTaskStatus(task);
            if (task.status === 'IN_PROGRESS') {
                return true;
            }
        }
        return false;
    }

    private async loadBountyTaskData(): Promise<BountyTaskData> {
        if (this.bountyTaskData) {
            return this.bountyTaskData;
        }

        try {
            if (dataManager.isLoggedIn && !dataManager.userData.isDevelopmentUser) {
                const data = await Http.get<BountyTaskData>('/bounty-tasks/current');
                if (this.isValidBountyTaskData(data)) {
                    this.bountyTaskData = data;
                    return data;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock bounty task data:', error);
        }

        const mockData = this.createMockBountyTaskData();
        this.bountyTaskData = mockData;
        return mockData;
    }

    private async changeBountyTasks() {
        const wasFreeChange = this.bountyTaskData?.freeChangeAvailable ?? this.bountyTaskChangeCount === 0;
        const changeCost = wasFreeChange ? 0 : this.bountyTaskData?.changeCostDiamond ?? this.getBountyTaskChangeCost();

        try {
            if (dataManager.isLoggedIn && !dataManager.userData.isDevelopmentUser) {
                const data = await Http.post<BountyTaskData>('/bounty-tasks/change');
                if (this.isValidBountyTaskData(data)) {
                    this.resetBountyTasksAfterChange(data);
                    this.bountyTaskChangeCount += 1;
                    this.bountyTaskData = data;
                    await this.playBountyTaskCardSwap(data);
                    Platform.showToast('更换成功', 'success');
                    return;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock bounty task change:', error);
        }

        if (changeCost > 0) {
            if ((dataManager.userData.diamond ?? 0) < changeCost) {
                Platform.showToast('钻石不足', 'none');
                return;
            }
            dataManager.updateUserData({ diamond: dataManager.userData.diamond - changeCost });
        }

        this.bountyTaskChangeCount += 1;
        const mockData = this.createMockBountyTaskData();
        this.resetBountyTasksAfterChange(mockData);
        this.bountyTaskData = mockData;
        await this.playBountyTaskCardSwap(mockData);
        Platform.showToast('更换成功', 'success');
    }

    private async playBountyTaskCardSwap(data: BountyTaskData) {
        const cards = this.getBountyTaskCardNodes();
        if (cards.length === 0) {
            this.renderBountyTaskData(data);
            return;
        }

        if (this.bountyTaskSwapPlaying) {
            this.renderBountyTaskData(data);
            return;
        }

        this.bountyTaskSwapPlaying = true;
        const originalPositions = cards.map(card => card.position.clone());
        const originalOpacities = cards.map(card => this.getBountyTaskCardOpacity(card).opacity);
        await Promise.all(cards.map((card, index) => this.tweenBountyTaskCardTo(
            card,
            this.getBountyTaskCardEdgePosition(card, originalPositions[index], 'left'),
            'quadIn',
            0
        )));

        this.renderBountyTaskData(data);

        cards.forEach((card, index) => {
            const original = originalPositions[index];
            card.setPosition(this.getBountyTaskCardEdgePosition(card, original, 'right'));
            this.getBountyTaskCardOpacity(card).opacity = 0;
        });

        await Promise.all(cards.map((card, index) => this.tweenBountyTaskCardTo(
            card,
            originalPositions[index],
            'quadOut',
            originalOpacities[index]
        )));
        this.bountyTaskSwapPlaying = false;
    }

    private getBountyTaskCardEdgePosition(card: Node, originalPosition: Vec3, side: 'left' | 'right'): Vec3 {
        const panelEdgeX = this.getBountyTaskPopupPanelEdgeX(card, side);
        if (panelEdgeX === null) {
            const fallbackDistance = 420;
            return new Vec3(
                side === 'left' ? originalPosition.x - fallbackDistance : originalPosition.x + fallbackDistance,
                originalPosition.y,
                originalPosition.z
            );
        }

        return new Vec3(panelEdgeX, originalPosition.y, originalPosition.z);
    }

    private getBountyTaskPopupPanelEdgeX(card: Node, side: 'left' | 'right'): number | null {
        const layer = this.bountyTaskPopupLayer;
        const panel = layer ? this.findNodeByPaths(['PopupPanel'], layer) : null;
        const panelTransform = panel?.getComponent(UITransform);
        const cardParentTransform = card.parent?.getComponent(UITransform);
        if (!panelTransform || !cardParentTransform) {
            return null;
        }

        const panelLocalEdgeX = side === 'left'
            ? -panelTransform.width * panelTransform.anchorX
            : panelTransform.width * (1 - panelTransform.anchorX);
        const worldEdge = panelTransform.convertToWorldSpaceAR(new Vec3(panelLocalEdgeX, 0, 0));
        return cardParentTransform.convertToNodeSpaceAR(worldEdge).x;
    }

    private getBountyTaskCardNodes(): Node[] {
        const layer = this.bountyTaskPopupLayer;
        if (!layer) {
            return [];
        }

        return [
            this.findNodeByPaths(['PopupPanel/CoinTaskCard', 'CoinTaskCard'], layer),
            this.findNodeByPaths(['PopupPanel/DiamondTaskCard', 'DiamondTaskCard'], layer)
        ].filter((card): card is Node => !!card);
    }

    private tweenBountyTaskCardTo(card: Node, position: Vec3, easing: 'quadIn' | 'quadOut', opacity: number): Promise<void> {
        return new Promise(resolve => {
            const uiOpacity = this.getBountyTaskCardOpacity(card);
            tween(uiOpacity)
                .to(this.bountyTaskSwapDuration, { opacity }, { easing })
                .start();
            tween(card)
                .to(this.bountyTaskSwapDuration, { position }, { easing })
                .call(() => resolve())
                .start();
        });
    }

    private getBountyTaskCardOpacity(card: Node): UIOpacity {
        return card.getComponent(UIOpacity) ?? card.addComponent(UIOpacity);
    }

    private renderBountyTaskData(data: BountyTaskData) {
        const layer = this.bountyTaskPopupLayer;
        if (!layer) {
            return;
        }

        this.applyBountyTaskCard(
            this.findNodeByPaths(['PopupPanel/CoinTaskCard', 'CoinTaskCard'], layer),
            data.goldTask
        );
        this.applyBountyTaskCard(
            this.findNodeByPaths(['PopupPanel/DiamondTaskCard', 'DiamondTaskCard'], layer),
            data.diamondTask
        );
        this.renderBountyTaskChangeCost(data);
        this.refreshBountyTaskCountdownSchedule();
    }

    private applyBountyTaskCard(card: Node | null, task: BountyTaskItem) {
        if (!card) {
            return;
        }

        this.normalizeBountyTaskStatus(task);
        this.setLabelString(card, [
            'TitleNode/Node/TitleLabel',
            'TitleLabel'
        ], task.title);
        this.setLabelString(card, [
            'DescLabel',
            'ContentNode/DescLabel'
        ], task.desc);
        this.setLabelString(card, [
            'ProgressLabel',
            'ContentNode/ProgressLabel'
        ], `已完成 ${task.progress}/${task.targetProgress}`);
        this.setBountyTaskProgressVisible(card, task.status !== 'UNCLAIMED');
        this.setLabelString(card, [
            'TitleNode/IconSprite/Count',
            'IconSprite/Count'
        ], String(task.rewardAmount));
        this.applyBountyTaskRewardIcon(card, task.rewardType);
        this.setLabelString(card, [
            'TitleNode/Node/ChallengeCountNode/CountLabel',
            'ChallengeCountNode/CountLabel'
        ], String(task.challengeCount));
        this.applyBountyTaskCompleteStatus(card, task);
        this.applyBountyTaskReceiveButton(card, task);
    }

    private applyBountyTaskRewardIcon(card: Node, rewardTypeValue?: string) {
        const rewardType = this.normalizeRewardType(rewardTypeValue);
        this.setLabelString(card, [
            'TitleNode/IconSprite/NameLabel',
            'IconSprite/NameLabel'
        ], this.getRewardPopupName(rewardType));

        const rewardSprite = this.findComponentByPaths([
            'TitleNode/IconSprite',
            'IconSprite'
        ], Sprite, card);
        this.applyLevelRewardSpriteFrameByType(rewardSprite, rewardType);
        if (!rewardSprite?.spriteFrame) {
            void this.preloadLevelRewardAssets().then(() => {
                this.applyLevelRewardSpriteFrameByType(rewardSprite, rewardType);
            });
        }
    }

    private applyBountyTaskCompleteStatus(card: Node, task: BountyTaskItem) {
        const statusNode = this.findBountyTaskCompleteStatusNode(card, task);
        if (!statusNode) {
            return;
        }

        const sprite = statusNode.getComponent(Sprite);
        const visible = task.status === 'COMPLETED' || task.status === 'FAILED';
        statusNode.active = visible;
        if (sprite) {
            sprite.enabled = visible;
        }
        if (!sprite || !visible) {
            return;
        }

        if (task.status === 'COMPLETED') {
            sprite.spriteFrame = this.bountyTaskCompletedStatusSpriteFrame ?? sprite.spriteFrame;
            sprite.color = new Color(255, 148, 148, 255);
            return;
        }

        sprite.spriteFrame = this.bountyTaskUnfinishedStatusSpriteFrame ?? sprite.spriteFrame;
        sprite.color = new Color(160, 160, 160, 255);
    }

    private findBountyTaskCompleteStatusNode(card: Node, task: BountyTaskItem): Node | null {
        const taskNodeName = task.rewardType === 'DIAMOND' ? 'DiamondTaskNode' : 'CoinTaskNode';
        if (this.bountyTaskPopupLayer) {
            return this.findNodeByPaths([
                `PopupPanel/TaskClipNode/${taskNodeName}/CompletStatusSprite`
            ], this.bountyTaskPopupLayer);
        }

        return this.findNodeByPaths([
            `TaskClipNode/${taskNodeName}/CompletStatusSprite`
        ], card);
    }

    private applyBountyTaskReceiveButton(card: Node, task: BountyTaskItem) {
        const buttonNode = this.findNodeByPaths(['ReceiveButton'], card);
        if (!buttonNode) {
            return;
        }

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.interactable = task.status !== 'FAILED';
        }

        const sprite = buttonNode.getComponent(Sprite);
        if (sprite) {
            if (task.status === 'COMPLETED') {
                sprite.spriteFrame = this.bountyTaskYellowButtonSpriteFrame ?? sprite.spriteFrame;
            } else if (task.status === 'FAILED') {
                sprite.spriteFrame = this.bountyTaskGrayButtonSpriteFrame ?? sprite.spriteFrame;
            } else {
                sprite.spriteFrame = this.bountyTaskBlueButtonSpriteFrame ?? sprite.spriteFrame;
            }
        }

        this.setBountyTaskReceiveButtonContent(buttonNode, task);
    }

    async onBountyTaskReceiveButtonClick(event?: any, customEventData?: string) {
        const context = this.getBountyTaskReceiveContext(event, customEventData);
        const task = context.task;
        if (!task) {
            this.openBountyTaskRewardPopup(
                context.rewardType,
                context.rewardCount,
                context.allowDiamondMultiplier
            );
            return;
        }

        if (!this.bountyTaskData) {
            return;
        }

        this.normalizeBountyTaskStatus(task);

        if (task.status === 'COMPLETED') {
            this.openBountyTaskRewardPopup(
                task.rewardType,
                task.rewardAmount,
                context.allowDiamondMultiplier,
                task
            );
            return;
        }

        if (task.status === 'IN_PROGRESS') {
            return;
        }

        task.status = 'IN_PROGRESS';
        task.acceptedAt = Date.now();
        task.deadlineAt = task.acceptedAt + this.bountyTaskDurationMs;

        try {
            if (dataManager.isLoggedIn) {
                await Http.post(`/bounty-tasks/${task.id}/accept`);
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock bounty task accept:', error);
        }

        if (task.progress >= task.targetProgress) {
            task.status = 'COMPLETED';
        }

        this.renderBountyTaskData(this.bountyTaskData);
    }

    private getBountyTaskReceiveContext(event?: any, customEventData?: string): {
        rewardType: BountyTaskRewardType;
        rewardCount: number;
        allowDiamondMultiplier: boolean;
        task?: BountyTaskItem;
    } {
        const parsed = this.parseBountyTaskReceiveCustomData(customEventData);
        const rewardType = parsed.rewardType ?? this.inferBountyTaskRewardTypeFromEvent(event) ?? 'GOLD';
        const task = this.getBountyTaskByRewardType(rewardType);
        return {
            rewardType,
            rewardCount: parsed.rewardCount ?? task?.rewardAmount ?? 0,
            allowDiamondMultiplier: parsed.allowDiamondMultiplier ?? rewardType !== 'DIAMOND',
            task
        };
    }

    private parseBountyTaskReceiveCustomData(customEventData?: string): {
        rewardType?: BountyTaskRewardType;
        rewardCount?: number;
        allowDiamondMultiplier?: boolean;
    } {
        const raw = (customEventData || '').trim();
        if (!raw) {
            return {};
        }

        try {
            const data = JSON.parse(raw);
            return {
                rewardType: this.normalizeBountyTaskRewardType(data.rewardType || data.type),
                rewardCount: isFinite(Number(data.rewardCount ?? data.count)) ? Number(data.rewardCount ?? data.count) : undefined,
                allowDiamondMultiplier: typeof data.allowDiamondMultiplier === 'boolean'
                    ? data.allowDiamondMultiplier
                    : typeof data.allowFiveTimes === 'boolean'
                        ? data.allowFiveTimes
                        : undefined
            };
        } catch {
            const [type, count, allow] = raw.split(/[,|]/).map(item => item.trim());
            return {
                rewardType: this.normalizeBountyTaskRewardType(type),
                rewardCount: isFinite(Number(count)) ? Number(count) : undefined,
                allowDiamondMultiplier: allow ? allow !== 'false' && allow !== '0' : undefined
            };
        }
    }

    private inferBountyTaskRewardTypeFromEvent(event?: any): BountyTaskRewardType | null {
        let current: Node | null = event?.target ?? null;
        while (current) {
            if (current.name === 'DiamondTaskNode' || current.name === 'DiamondTaskCard') {
                return 'DIAMOND';
            }
            if (current.name === 'CoinTaskNode' || current.name === 'CoinTaskCard') {
                return 'GOLD';
            }
            current = current.parent;
        }
        return null;
    }

    private getBountyTaskByRewardType(rewardType: BountyTaskRewardType): BountyTaskItem | undefined {
        if (!this.bountyTaskData) {
            return undefined;
        }
        return rewardType === 'DIAMOND'
            ? this.bountyTaskData.diamondTask
            : this.bountyTaskData.goldTask;
    }

    private normalizeBountyTaskRewardType(value?: string): BountyTaskRewardType | undefined {
        if (!value) {
            return undefined;
        }
        return String(value).toUpperCase() === 'DIAMOND' ? 'DIAMOND' : 'GOLD';
    }

    private normalizeBountyTaskStatus(task: BountyTaskItem) {
        task.status ??= 'UNCLAIMED';

        if (task.acceptedAt && this.getLocalDateKey(task.acceptedAt) !== this.getLocalDateKey()) {
            task.status = 'UNCLAIMED';
            task.progress = 0;
            task.acceptedAt = undefined;
            task.deadlineAt = undefined;
            return;
        }

        if (task.status !== 'IN_PROGRESS') {
            return;
        }

        if ((task.deadlineAt ?? 0) <= Date.now()) {
            task.status = task.progress >= task.targetProgress ? 'COMPLETED' : 'FAILED';
            return;
        }

        if (task.progress >= task.targetProgress) {
            task.status = 'COMPLETED';
        }
    }

    private getBountyTaskButtonText(task: BountyTaskItem): string {
        switch (task.status) {
            case 'IN_PROGRESS':
                return this.formatBountyTaskRemainingTime(task);
            case 'COMPLETED':
                return '领取奖励';
            case 'FAILED':
                return '挑战失败';
            case 'UNCLAIMED':
            default:
                return '领取任务';
        }
    }

    private formatBountyTaskRemainingTime(task: BountyTaskItem): string {
        const remainingSeconds = Math.max(0, Math.ceil(((task.deadlineAt ?? Date.now()) - Date.now()) / 1000));
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        return `${this.padTimePart(hours)}:${this.padTimePart(minutes)}:${this.padTimePart(seconds)}`;
    }

    private padTimePart(value: number): string {
        return value < 10 ? `0${value}` : String(value);
    }

    private setBountyTaskReceiveButtonContent(buttonNode: Node, task: BountyTaskItem) {
        const showReward = task.status === 'UNCLAIMED';
        const spriteNode = this.findNodeByPaths(['SpriteNode'], buttonNode);

        if (spriteNode) {
            spriteNode.active = showReward;
        }

        this.resizeBountyTaskReceiveButton(buttonNode, !showReward);
        this.setBountyTaskReceiveButtonLabel(buttonNode, this.getBountyTaskButtonText(task), !showReward);
    }

    private resizeBountyTaskReceiveButton(buttonNode: Node, expanded: boolean) {
        const transform = buttonNode.getComponent(UITransform);
        if (!transform) {
            return;
        }

        transform.setContentSize(expanded ? 110 : 80, transform.height);
    }

    private setBountyTaskReceiveButtonLabel(buttonNode: Node, text: string, centered: boolean) {
        const label = this.findLabelByPaths(['Label'], buttonNode);
        if (label) {
            if (!this.bountyTaskButtonLabelDefaultX.has(label.node)) {
                this.bountyTaskButtonLabelDefaultX.set(label.node, label.node.position.x);
            }
            const labelTransform = label.node.getComponent(UITransform);
            if (labelTransform && !this.bountyTaskButtonLabelDefaultWidth.has(label.node)) {
                this.bountyTaskButtonLabelDefaultWidth.set(label.node, labelTransform.width);
            }
            if (labelTransform && !this.bountyTaskButtonLabelDefaultAnchor.has(label.node)) {
                this.bountyTaskButtonLabelDefaultAnchor.set(label.node, {
                    x: labelTransform.anchorX,
                    y: labelTransform.anchorY
                });
            }

            const defaultX = this.bountyTaskButtonLabelDefaultX.get(label.node) ?? label.node.position.x;
            const defaultWidth = this.bountyTaskButtonLabelDefaultWidth.get(label.node) ?? labelTransform?.width ?? 80;
            const defaultAnchor = this.bountyTaskButtonLabelDefaultAnchor.get(label.node);
            const widget = label.node.getComponent(Widget);
            if (widget) {
                widget.enabled = false;
                widget.destroy();
            }

            if (labelTransform) {
                labelTransform.setAnchorPoint(centered ? 0.5 : defaultAnchor?.x ?? labelTransform.anchorX, defaultAnchor?.y ?? labelTransform.anchorY);
                labelTransform.setContentSize(centered ? Math.max(defaultWidth, 110) : defaultWidth, labelTransform.height);
            }

            label.string = text;
            label.fontSize = centered && text.includes(':') ? 24 : 20;
            label.lineHeight = centered && text.includes(':') ? 40 : 40;
            (label as any).isBold = centered;

            const layout = buttonNode.getComponent(Layout);
            if (layout?.enabled) {
                layout.updateLayout();
            }

            label.node.setPosition(centered ? 0 : defaultX, label.node.position.y, label.node.position.z);
        }
    }

    private setBountyTaskProgressVisible(card: Node, visible: boolean) {
        const progressNode = this.findNodeByPaths(['ProgressLabel', 'ContentNode/ProgressLabel'], card);
        if (progressNode) {
            progressNode.active = visible;
        }

        const transform = card.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(transform.width, visible ? this.bountyTaskExpandedCardHeight : this.bountyTaskCollapsedCardHeight);
        }

        const layout = card.parent?.getComponent(Layout);
        if (layout?.enabled) {
            layout.updateLayout();
        }
    }

    private refreshBountyTaskCountdownSchedule() {
        this.unschedule(this.updateBountyTaskCountdowns);
        if (this.hasActiveBountyTaskCountdown()) {
            this.schedule(this.updateBountyTaskCountdowns, 1);
        }
    }

    private hasActiveBountyTaskCountdown(): boolean {
        const data = this.bountyTaskData;
        if (!data) {
            return false;
        }
        return [data.goldTask, data.diamondTask].some(task => task.status === 'IN_PROGRESS');
    }

    private updateBountyTaskCountdowns = () => {
        if (!this.bountyTaskData) {
            this.unschedule(this.updateBountyTaskCountdowns);
            return;
        }

        this.renderBountyTaskData(this.bountyTaskData);
    };

    private async loadBountyTaskButtonSpriteFrames() {
        const [yellow, gray, blue, completed, unfinished] = await Promise.all([
            this.loadSpriteFrame('image/glodtask/yellow_button/spriteFrame'),
            this.loadSpriteFrame('image/glodtask/gray_button/spriteFrame'),
            this.loadSpriteFrame('image/glodtask/blue_button/spriteFrame'),
            this.loadSpriteFrame('image/glodtask/completed/spriteFrame'),
            this.loadSpriteFrame('image/glodtask/unfinished/spriteFrame')
        ]);
        this.bountyTaskYellowButtonSpriteFrame = yellow;
        this.bountyTaskGrayButtonSpriteFrame = gray;
        this.bountyTaskBlueButtonSpriteFrame = blue;
        this.bountyTaskCompletedStatusSpriteFrame = completed;
        this.bountyTaskUnfinishedStatusSpriteFrame = unfinished;
    }

    private renderBountyTaskChangeCost(data: BountyTaskData) {
        const conditionNode = this.findBountyTaskConditionNode();
        const label = this.findBountyTaskConditionLabel();
        if (!label) {
            return;
        }

        label.string = data.freeChangeAvailable ? '今日首次免费' : String(data.changeCostDiamond);

        const costSpriteNode = conditionNode ? this.findNodeByPaths(['Sprite'], conditionNode) : null;
        if (costSpriteNode) {
            costSpriteNode.active = !data.freeChangeAvailable;
            const sprite = costSpriteNode.getComponent(Sprite);
            if (sprite) {
                sprite.enabled = !data.freeChangeAvailable;
            }
        }
    }
    private findBountyTaskConditionLabel(): Label | null {
        const conditionNode = this.findBountyTaskConditionNode();
        if (conditionNode) {
            return this.findLabelByPaths(['ConditionLabel'], conditionNode);
        }

        return null;
    }

    private findBountyTaskConditionNode(): Node | null {
        const layer = this.bountyTaskPopupLayer;
        if (!layer) {
            return null;
        }

        return this.findNodeByPaths([
            'PopupPanel/ChangeTaskNode/ChangeTaskNode/ConditionNode',
            'PopupPanel/ChangeTaskNode/ConditionNode',
            'ChangeTaskNode/ChangeTaskNode/ConditionNode',
            'ChangeTaskNode/ConditionNode',
            'ConditionNode'
        ], layer);
    }

    private createMockBountyTaskData(): BountyTaskData {
        return {
            goldTask: this.pickRandomBountyTask(this.mockGoldBountyTasks),
            diamondTask: this.pickRandomBountyTask(this.mockDiamondBountyTasks),
            freeChangeAvailable: this.bountyTaskChangeCount === 0,
            changeCostDiamond: this.getBountyTaskChangeCost()
        };
    }

    private getBountyTaskChangeCost() {
        if (this.bountyTaskChangeCount <= 0) {
            return 0;
        }

        const costIndex = Math.min(this.bountyTaskChangeCount - 1, this.bountyTaskChangeCosts.length - 1);
        return this.bountyTaskChangeCosts[costIndex];
    }

    private pickRandomBountyTask(tasks: BountyTaskItem[]): BountyTaskItem {
        const index = Math.floor(Math.random() * tasks.length);
        return { ...tasks[index] };
    }

    private resetBountyTasksAfterChange(data: BountyTaskData) {
        for (const task of [data.goldTask, data.diamondTask]) {
            task.status = 'UNCLAIMED';
            task.acceptedAt = undefined;
            task.deadlineAt = undefined;
        }
    }

    private isValidBountyTaskData(data: BountyTaskData | null | undefined): data is BountyTaskData {
        return !!data
            && this.isValidBountyTaskItem(data.goldTask)
            && this.isValidBountyTaskItem(data.diamondTask)
            && typeof data.freeChangeAvailable === 'boolean'
            && typeof data.changeCostDiamond === 'number';
    }

    private isValidBountyTaskItem(task: BountyTaskItem | null | undefined): task is BountyTaskItem {
        return !!task
            && typeof task.id === 'number'
            && typeof task.title === 'string'
            && typeof task.desc === 'string'
            && typeof task.rewardAmount === 'number'
            && typeof task.progress === 'number'
            && typeof task.targetProgress === 'number'
            && typeof task.challengeCount === 'number';
    }

    private isMockBountyTaskFreeChangeAvailable(): boolean {
        return this.readBountyTaskStorage(this.bountyTaskFreeChangeStorageKey) !== this.getLocalDateKey();
    }

    private markMockBountyTaskFreeChangeUsedToday() {
        this.writeBountyTaskStorage(this.bountyTaskFreeChangeStorageKey, this.getLocalDateKey());
    }

    private getLocalDateKey(timestamp?: number): string {
        const date = timestamp ? new Date(timestamp) : new Date();
        const monthNumber = date.getMonth() + 1;
        const dayNumber = date.getDate();
        const month = monthNumber < 10 ? `0${monthNumber}` : String(monthNumber);
        const day = dayNumber < 10 ? `0${dayNumber}` : String(dayNumber);
        return `${date.getFullYear()}-${month}-${day}`;
    }

    private readBountyTaskStorage(key: string): string {
        return this.mockStorage.get(key) || '';
    }

    private writeBountyTaskStorage(key: string, value: string) {
        this.mockStorage.set(key, value);
    }

    private async claimDailyCheckIn(multiplier: number = 1, diamondCost: number = 0): Promise<boolean> {
        if (!this.dailyCheckInData) {
            return false;
        }

        if (this.dailyCheckInData.todayClaimed) {
            Platform.showToast('今日已领取', 'none');
            return false;
        }

        if (diamondCost > 0 && (dataManager.userData.diamond ?? 0) < diamondCost) {
            Platform.showToast('钻石不足', 'none');
            return false;
        }

        if (dataManager.userData.isDevelopmentUser) {
            const data = dataManager.claimDevelopmentDailyCheckIn(multiplier, diamondCost);
            if (data) {
                this.dailyCheckInData = data;
                this.renderDailyCheckInData(data);
                return true;
            }
            Platform.showToast('钻石不足', 'none');
            return false;
        }

        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.post<DailyCheckInData>('/user/daily-check-in/claim', {
                    multiplier,
                    diamondCost
                });
                if (data?.rewards?.length) {
                    this.applyRewardToLocalUserData(
                        this.getDailyCheckInClaimReward(this.dailyCheckInData)?.rewardType || 'GOLD',
                        this.getDailyCheckInClaimReward(this.dailyCheckInData)?.rewardCount || 0,
                        multiplier,
                        diamondCost
                    );
                    this.dailyCheckInData = data;
                    this.renderDailyCheckInData(data);
                    return true;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock daily check-in claim:', error);
        }

        const nextClaimableDayIndex = this.getNextMockDailyCheckInClaimableDayIndex(
            this.dailyCheckInData.rewards
                .filter(reward => reward.claimed)
                .map(reward => reward.dayIndex),
            this.dailyCheckInData.todayIndex
        );
        const claimReward = this.dailyCheckInData.rewards.find(reward => reward.dayIndex === nextClaimableDayIndex) ?? null;
        if (claimReward) {
            claimReward.claimed = true;
            claimReward.claimable = false;
            this.applyRewardToLocalUserData(claimReward.rewardType, claimReward.rewardCount, multiplier, diamondCost);
            this.writeMockDailyCheckInClaimedDays([
                ...this.readMockDailyCheckInClaimedDays(),
                claimReward.dayIndex
            ]);
        }

        this.dailyCheckInData.todayClaimed = true;
        this.dailyCheckInData.rewards.forEach(reward => {
            reward.claimable = false;
        });
        this.writeBountyTaskStorage('kapgame_daily_check_in_claim_date', this.getLocalDateKey());
        this.renderDailyCheckInData(this.dailyCheckInData);
        return true;
    }

    private getDailyCheckInClaimReward(data: DailyCheckInData): DailyCheckInReward | null {
        const claimedDays = data.rewards
            .filter(reward => reward.claimed)
            .map(reward => reward.dayIndex);
        const claimableDayIndex = this.getNextMockDailyCheckInClaimableDayIndex(claimedDays, data.todayIndex);
        return data.rewards.find(reward => reward.dayIndex === claimableDayIndex) ?? null;
    }

    private readMockDailyCheckInClaimedDays(): number[] {
        const value = this.readBountyTaskStorage('kapgame_daily_check_in_claimed_days');
        return value
            .split(',')
            .map(part => Number(part))
            .filter(dayIndex => Number.isInteger(dayIndex) && dayIndex >= 1 && dayIndex <= 7);
    }

    private writeMockDailyCheckInClaimedDays(dayIndexes: number[]) {
        const normalized = Array.from(new Set(dayIndexes))
            .filter(dayIndex => dayIndex >= 1 && dayIndex <= 7)
            .sort((a, b) => a - b);
        this.writeBountyTaskStorage('kapgame_daily_check_in_claimed_days', normalized.join(','));
    }

    private getNextMockDailyCheckInClaimableDayIndex(claimedDays: number[], todayIndex: number): number {
        for (let dayIndex = 1; dayIndex <= todayIndex; dayIndex++) {
            if (claimedDays.indexOf(dayIndex) < 0) {
                return dayIndex;
            }
        }
        return 0;
    }

    private async loadDailyCheckInData(): Promise<DailyCheckInData> {
        if (dataManager.userData.isDevelopmentUser) {
            const data = dataManager.getDevelopmentDailyCheckInData();
            if (data) {
                this.dailyCheckInData = data;
                return data;
            }
        }

        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.get<DailyCheckInData>('/user/daily-check-in');
                if (data?.rewards?.length) {
                    this.dailyCheckInData = data;
                    return data;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock daily check-in data:', error);
        }

        const mockData = this.createMockDailyCheckInData();
        this.dailyCheckInData = mockData;
        return mockData;
    }

    private createMockDailyCheckInData(): DailyCheckInData {
        const todayIndex = new Date().getDay();
        const normalizedTodayIndex = todayIndex === 0 ? 7 : todayIndex;
        const claimedToday = this.readBountyTaskStorage('kapgame_daily_check_in_claim_date') === this.getLocalDateKey();
        const claimedDays = this.readMockDailyCheckInClaimedDays();
        const nextClaimableDayIndex = claimedToday ? 0 : this.getNextMockDailyCheckInClaimableDayIndex(claimedDays, normalizedTodayIndex);
        const rewards = [100, 120, 150, 180, 220, 260, 320].map((rewardCount, index) => {
            const dayIndex = index + 1;
            return {
                dayIndex,
                rewardType: 'GOLD',
                rewardCount,
                claimed: claimedDays.indexOf(dayIndex) >= 0,
                claimable: dayIndex === nextClaimableDayIndex
            };
        });

        return {
            weekStartDate: '',
            todayIndex: normalizedTodayIndex,
            todayClaimed: claimedToday,
            rewards
        };
    }

    private renderDailyCheckInData(data: DailyCheckInData) {
        const layer = this.dailyCheckInPopupLayer;
        if (!layer) {
            return;
        }

        const dayNodes = this.getDailyCheckInDayNodes();
        data.rewards.forEach((reward, index) => {
            const dayNode = dayNodes[index];
            if (dayNode) {
                this.applyDailyCheckInDayNode(dayNode, reward);
            }
        });
        this.applyDailyCheckInReceiveButton(data);
    }

    private applyDailyCheckInDayNode(dayNode: Node, reward: DailyCheckInReward) {
        this.setLabelString(dayNode, ['CountNode/CountLabel'], String(reward.rewardCount));

        const receiveStatusNode = this.findNodeByPaths(['RewardNode/ReceiveStatusSprite', 'ReceiveStatusSprite'], dayNode);
        if (receiveStatusNode) {
            receiveStatusNode.active = reward.claimed;
        }

        const rewardSprite = this.findNodeByPaths(['RewardNode/RewardSprite', 'RewardSprite'], dayNode)?.getComponent(Sprite);
        if (rewardSprite) {
            const color = rewardSprite.color.clone();
            color.a = reward.claimed ? 140 : 255;
            rewardSprite.color = color;
        }
    }

    private applyDailyCheckInReceiveButton(data: DailyCheckInData) {
        this.applyDailyCheckInButtonState(this.findDailyCheckInReceiveButton(), data.todayClaimed, '签到');

        const doubleReceiveButton = this.findDailyCheckInDoubleReceiveButton();
        if (doubleReceiveButton) {
            doubleReceiveButton.active = !data.todayClaimed;
        }
        this.applyDailyCheckInButtonState(doubleReceiveButton, data.todayClaimed, '双倍领取');
    }

    private applyDailyCheckInButtonState(buttonNode: Node | null, claimedToday: boolean, defaultText: string) {
        if (!buttonNode) {
            return;
        }

        const label = this.findLabelByPaths(['Label'], buttonNode);
        if (label) {
            label.string = claimedToday ? '今日已领取' : defaultText;
            label.color = claimedToday ? new Color(255, 255, 255, 255) : new Color(0, 0, 0, 255);
            (label as any).isBold = true;
            if (claimedToday) {
                const labelTransform = label.node.getComponent(UITransform);
                if (labelTransform) {
                    labelTransform.width = 140;
                }
            }
        }

        const sprite = buttonNode.getComponent(Sprite);
        if (sprite) {
            sprite.color = claimedToday ? new Color(150, 150, 150, 255) : new Color(255, 255, 255, 255);
        }

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.interactable = !claimedToday;
        }
    }
    private getDailyCheckInDayNodes(): Node[] {
        const container = this.dailyCheckInPopupLayer
            ? this.findNodeByPaths(['PopupPanel/CheckInInfoNode', 'CheckInInfoNode'], this.dailyCheckInPopupLayer)
            : null;
        return container?.children ?? [];
    }

    private findDailyCheckInReceiveButton(): Node | null {
        const layer = this.dailyCheckInPopupLayer;
        if (!layer) {
            return null;
        }

        return this.findNodeByPaths([
            'PopupPanel/ButtonNode/ReceiveButton',
            'PopupPanel/ReceiveButtom',
            'PopupPanel/ReceiveButton',
            'ButtonNode/ReceiveButton',
            'ReceiveButtom',
            'ReceiveButton'
        ], layer);
    }

    private findDailyCheckInDoubleReceiveButton(): Node | null {
        const layer = this.dailyCheckInPopupLayer;
        if (!layer) {
            return null;
        }

        return this.findNodeByPaths([
            'PopupPanel/ButtonNode/DoubleReceiveButton',
            'PopupPanel/DoubleReceiveButton',
            'ButtonNode/DoubleReceiveButton',
            'DoubleReceiveButton'
        ], layer);
    }

    private findDailyCheckInCloseButton(): Node | null {
        const layer = this.dailyCheckInPopupLayer;
        if (!layer) {
            return null;
        }

        return this.findNodeByPaths([
            'CloseButton',
            'PopupPanel/CloseButton'
        ], layer);
    }

    private async loadLevelRewardData(): Promise<LevelRewardData> {
        if (dataManager.userData.isDevelopmentUser) {
            const data = dataManager.getDevelopmentLevelRewardData();
            if (data) {
                this.cachedLevelRewardData = data;
                return data;
            }
        }

        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.get<LevelRewardData>('/user/level-rewards');
                if (data && Array.isArray(data.rewards)) {
                    this.cachedLevelRewardData = data;
                    return data;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock level reward data:', error);
        }

        const data = this.getMockLevelRewardData();
        this.cachedLevelRewardData = data;
        return data;
    }

    private getImmediateLevelRewardData(): LevelRewardData {
        if (dataManager.userData.isDevelopmentUser) {
            const data = dataManager.getDevelopmentLevelRewardData();
            if (data) {
                this.cachedLevelRewardData = data;
                return data;
            }
        }

        if (this.cachedLevelRewardData) {
            return this.cachedLevelRewardData;
        }

        const data = this.getMockLevelRewardData();
        this.cachedLevelRewardData = data;
        return data;
    }

    private prepareLevelRewardPopup() {
        const data = this.getImmediateLevelRewardData();
        this.renderLevelRewardData(data, true);
        void this.preloadLevelRewardAssets().then(() => {
            if (this.cachedLevelRewardData) {
                this.renderLevelRewardData(this.cachedLevelRewardData, true);
            }
        });
        void this.refreshLevelRewardData(false, true, false);
    }

    private async refreshLevelRewardData(
        resetToTop: boolean = false,
        renderWhenHidden: boolean = true,
        forceRender: boolean = true
    ) {
        if (!this.levelRewardDataLoading) {
            this.levelRewardDataLoading = this.loadLevelRewardData()
                .then(data => {
                    this.levelRewardDataLoading = null;
                    return data;
                })
                .catch(error => {
                    this.levelRewardDataLoading = null;
                    throw error;
                });
        }

        const data = await this.levelRewardDataLoading;
        await this.preloadLevelRewardAssets();
        if (!forceRender) {
            return data;
        }

        if (renderWhenHidden || this.levelRewardPopupLayer?.active) {
            this.renderLevelRewardData(data, resetToTop);
        }
        return data;
    }

    private renderLevelRewardData(data: LevelRewardData, resetToTop: boolean = true) {
        this.cachedLevelRewardData = data;
        this.renderUserLevelInfo(data);
        this.renderRewards(data.rewards, resetToTop);
        this.levelRewardRendered = true;
    }

    private deferRenderLevelRewardData(data: LevelRewardData, resetToTop: boolean = false) {
        this.cachedLevelRewardData = data;
        setTimeout(() => {
            if (this.levelRewardPopupLayer?.active) {
                this.renderLevelRewardData(data, resetToTop);
            }
        }, 0);
    }

    private getMockLevelRewardData(): LevelRewardData {
        return {
            username: dataManager.userData.username || '测试玩家',
            level: dataManager.userData.level > 0 ? dataManager.userData.level : 1,
            exp: dataManager.userData.exp > 0 ? dataManager.userData.exp : 100,
            nextLevelExp: 200,
            rewards: Array.from({ length: 60 }, (_, index) => {
                const level = index + 1;
                const rewardParts = this.getLevelRewardPartsByLevel(level);
                return {
                    level,
                    rewardType: rewardParts[0].rewardType,
                    rewardCount: rewardParts[0].rewardCount,
                    rewards: rewardParts,
                    canClaim: (dataManager.userData.level || 1) >= level,
                    claimed: false
                };
            })
        };
    }

    private renderUserLevelInfo(data: LevelRewardData) {
        const exp = Math.max(0, data.exp || 0);
        const nextLevelExp = Math.max(1, data.nextLevelExp || 1);

        if (this.usernameLabel) {
            this.usernameLabel.string = data.username || '玩家';
        }
        if (this.levelLabel) {
            this.levelLabel.string = String(data.level || 1);
        }
        if (this.expLabel) {
            this.expLabel.string = `${exp}/${nextLevelExp}`;
        }
        this.updateExpProgress(Math.max(0, Math.min(1, exp / nextLevelExp)));
    }

    private getLevelRewardPartsByLevel(level: number): LevelRewardPart[] {
        if (level <= 30) {
            return [{
                rewardType: 'GOLD',
                rewardCount: this.interpolateRewardCount(level, 1, 30, 100, 500)
            }];
        }

        return [
            {
                rewardType: 'GOLD',
                rewardCount: this.interpolateRewardCount(level, 31, 60, 100, 500)
            },
            {
                rewardType: 'DIAMOND',
                rewardCount: this.interpolateRewardCount(level, 31, 60, 10, 100)
            }
        ];
    }

    private interpolateRewardCount(level: number, minLevel: number, maxLevel: number, minReward: number, maxReward: number) {
        if (maxLevel <= minLevel) {
            return maxReward;
        }

        const progress = Math.max(0, Math.min(1, (level - minLevel) / (maxLevel - minLevel)));
        return Math.round(minReward + (maxReward - minReward) * progress);
    }

    private renderRewards(rewards: LevelRewardItem[], resetToTop: boolean = true) {
        this.resolveNodes();
        if (!this.rewardContent || !this.rewardItemTemplate) {
            console.warn('[ActivityPopupRoot] Reward content or item template not found');
            return;
        }

        const rewardScrollY = this.getRewardScrollY();
        this.rewardItemTemplate.active = false;
        this.clearGeneratedRewardItems();

        this.prepareRewardContent();

        rewards.forEach((reward, index) => {
            const item = instantiate(this.rewardItemTemplate);
            item.name = `${this.generatedRewardItemPrefix}_${index + 1}`;
            item.active = true;
            this.disableRootAutoLayout(item);
            this.rewardContent.addChild(item);
            this.applyRewardItem(item, reward);
        });

        this.refreshRewardScrollView(resetToTop);
        if (!resetToTop) {
            this.restoreRewardScrollY(rewardScrollY);
        }
    }

    private applyRewardItem(item: Node, reward: LevelRewardItem) {
        const levelLabel = item.getChildByPath('LevelRequireNode/LevelRequireSprite/LevelLabel')?.getComponent(Label);
        const requireLabel = item.getChildByPath('LevelRequireNode/LevelRequireLabel')?.getComponent(Label);
        const receiveButton = item.getChildByName('ReceiveButton');

        if (levelLabel) {
            levelLabel.string = String(reward.level);
        }
        if (requireLabel) {
            requireLabel.string = `等级达到${reward.level}级`;
        }
        this.applyRewardDisplayByType(item, reward.rewardType);
        this.renderLevelRewardSprites(item, reward);
        this.applyRewardReceiveButton(receiveButton, reward);
    }

    private renderLevelRewardSprites(item: Node, reward: LevelRewardItem) {
        const levelRewardNode = item.getChildByPath('LevelRewardNode');
        const coinRewardNode = levelRewardNode?.getChildByName('CoinRewardSprite') ?? null;
        const diamondRewardNode = levelRewardNode?.getChildByName('DiamondRewardSprite') ?? null;
        if (!levelRewardNode || !coinRewardNode || !diamondRewardNode) {
            return;
        }

        const rewardParts = this.normalizeLevelRewardParts(reward);
        const coinPart = this.getLevelRewardPartByType(rewardParts, 'GOLD');
        const diamondPart = this.getLevelRewardPartByType(rewardParts, 'DIAMOND');

        this.applyLevelRewardPartNode(coinRewardNode, coinPart, 'GOLD');
        this.applyLevelRewardPartNode(diamondRewardNode, diamondPart, 'DIAMOND');
    }

    private applyRewardReceiveButton(buttonNode: Node | null, reward: LevelRewardItem) {
        if (!buttonNode) {
            return;
        }

        const canClaim = reward.canClaim === true;
        const claimed = reward.claimed === true;
        buttonNode.active = canClaim || claimed;

        this.applyRewardReceiveButtonSprite(buttonNode, claimed);
        this.setRewardReceiveButtonLabelByType(buttonNode, reward.rewardType, canClaim, claimed);

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.interactable = canClaim && !claimed;
        }
        buttonNode.targetOff(this);
        if (canClaim && !claimed) {
            buttonNode.on(Button.EventType.CLICK, () => {
                this.showRewardPopupForLevelReward(reward);
            }, this);
        }
    }

    private applyRewardReceiveButtonSprite(buttonNode: Node | null, claimed: boolean) {
        if (!buttonNode) {
            return;
        }

        const spriteFrame = claimed ? this.receivedSpriteFrame : this.receiveSpriteFrame;
        if (!spriteFrame) {
            return;
        }

        const sprite = buttonNode.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = spriteFrame;
        }

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.normalSprite = spriteFrame;
            button.hoverSprite = spriteFrame;
            button.pressedSprite = spriteFrame;
            button.disabledSprite = spriteFrame;
        }
    }

    private async claimLevelReward(
        reward: LevelRewardItem,
        multiplier: number = 1,
        diamondCost: number = 0,
        rewardPart?: LevelRewardPart,
        finishLevelRewardClaim: boolean = true
    ): Promise<boolean> {
        const claimPart = rewardPart ?? this.normalizeLevelRewardParts(reward)[0];
        if (diamondCost > 0 && this.normalizeRewardType(claimPart.rewardType) === 'DIAMOND') {
            Platform.showToast('钻石奖励不能使用钻石倍数领取', 'none');
            return false;
        }

        if (dataManager.userData.isDevelopmentUser && reward.id) {
            const data = dataManager.claimDevelopmentLevelReward(
                reward.id,
                multiplier,
                diamondCost,
                claimPart.rewardType,
                claimPart.rewardCount,
                finishLevelRewardClaim
            );
            if (data) {
                this.deferRenderLevelRewardData(data, false);
                return true;
            }
            Platform.showToast('钻石不足', 'none');
            return false;
        }

        if (!reward.id) {
            Platform.showToast('奖励配置异常', 'none');
            return false;
        }

        try {
            await Http.post(`/user/level-rewards/${reward.id}/claim`, {
                multiplier,
                diamondCost,
                rewardType: claimPart.rewardType,
                rewardCount: claimPart.rewardCount,
                finishClaim: finishLevelRewardClaim
            });
            this.applyLevelRewardToLocalUserData(reward, multiplier, diamondCost, claimPart);
            void this.refreshLevelRewardData(false);
            return true;
        } catch (error) {
            console.warn('[ActivityPopupRoot] Claim level reward failed:', error);
            Platform.showToast(error instanceof Error ? error.message : '领取失败', 'none');
            return false;
        }
    }

    private createLevelRewardPopupPendingRewards(reward: LevelRewardItem): RewardPopupPendingReward[] {
        const sortOrder = (part: LevelRewardPart) => part.rewardType === 'GOLD' ? 0 : 1;
        const rewardParts = this.normalizeLevelRewardParts(reward)
            .sort((left, right) => sortOrder(left) - sortOrder(right));
        return rewardParts.map((part, index) => ({
            source: 'level',
            rewardType: part.rewardType,
            rewardCount: part.rewardCount,
            levelReward: reward,
            levelRewardPart: part,
            finishLevelRewardClaim: index === rewardParts.length - 1
        }));
    }

    private normalizeLevelRewardParts(reward: LevelRewardItem): LevelRewardPart[] {
        const rewardParts = Array.isArray(reward.rewards) && reward.rewards.length > 0
            ? reward.rewards
            : [{
                rewardType: reward.rewardType || 'GOLD',
                rewardCount: reward.rewardCount
            }];
        return rewardParts.map(part => ({
            rewardType: this.normalizeRewardType(part.rewardType),
            rewardCount: Math.max(0, Math.floor(part.rewardCount || 0))
        }));
    }

    private getLevelRewardPartByType(rewardParts: LevelRewardPart[], rewardTypeValue: string): LevelRewardPart | null {
        const rewardType = this.normalizeRewardType(rewardTypeValue);
        return rewardParts.find(part => this.normalizeRewardType(part.rewardType) === rewardType && part.rewardCount > 0) ?? null;
    }

    private applyLevelRewardPartNode(rewardNode: Node | null, part: LevelRewardPart | null, rewardType: string) {
        if (!rewardNode) {
            return;
        }

        rewardNode.active = part !== null;
        if (!part) {
            return;
        }

        this.setLabelString(rewardNode, ['NumberLabel'], String(part.rewardCount));
        this.applyLevelRewardDisplayByType(rewardNode, rewardType);
    }

    private showRewardPopupForLevelReward(reward: LevelRewardItem) {
        const pendingRewards = this.createLevelRewardPopupPendingRewards(reward);
        const firstPending = pendingRewards.shift();
        if (!firstPending) {
            return;
        }

        this.rewardPopupQueue = pendingRewards;
        void this.showRewardPopup(firstPending);
    }

    private async showRewardPopupForDailyCheckIn() {
        if (!this.dailyCheckInData) {
            const data = await this.loadDailyCheckInData();
            this.renderDailyCheckInData(data);
        }

        const dailyCheckInData = this.dailyCheckInData;
        if (!dailyCheckInData) {
            return;
        }

        if (dailyCheckInData.todayClaimed) {
            Platform.showToast('今日已领取', 'none');
            return;
        }

        const reward = this.getDailyCheckInClaimReward(dailyCheckInData);
        if (!reward) {
            Platform.showToast('暂无可领取奖励', 'none');
            return;
        }

        await this.showRewardPopup({
            source: 'dailyCheckIn',
            rewardType: reward.rewardType || 'GOLD',
            rewardCount: reward.rewardCount,
            dailyReward: reward
        });
    }

    private openBountyTaskRewardPopup(
        rewardType: string,
        rewardCount: number,
        allowDiamondMultiplier: boolean,
        task?: BountyTaskItem
    ) {
        void this.showRewardPopup({
            source: 'bountyTask',
            rewardType,
            rewardCount,
            allowDiamondMultiplier,
            bountyTask: task
        });
    }

    private async showRewardPopup(pending: RewardPopupPendingReward) {
        await this.ensureRewardPopupLayer();
        this.resolveRewardPopupNodes();
        if (!this.rewardPopupRoot?.isValid || !this.rewardPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] Reward receive popup not found');
            return;
        }

        const rewardType = this.normalizeRewardType(pending.rewardType);
        const rewardName = this.getRewardPopupName(rewardType);
        const rewardCount = Math.max(0, pending.rewardCount || 0);
        const canUseDiamondMultiplier = rewardType !== 'DIAMOND' && pending.allowDiamondMultiplier !== false;

        this.rewardPopupPendingReward = {
            ...pending,
            rewardType,
            rewardCount
        };
        this.rewardPopupClaiming = false;
        this.rewardPopupDelayResourceSync = false;
        this.rewardPopupRoot.active = true;
        this.rewardPopupLayer.active = true;
        this.setRewardPopupClaimVisualMode(false);
        this.ensureBlockInputEvents(this.rewardPopupLayer);
        if (this.rewardPopupRoot.parent) {
            this.rewardPopupRoot.setSiblingIndex(this.rewardPopupRoot.parent.children.length - 1);
        }

        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondLabel'], String(dataManager.userData.diamond || 0));
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldLabel'], String(dataManager.userData.gold || 0));
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/GetResourceNode/RewardNode/DescNode/CountLabel'], String(rewardCount));
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/GetResourceNode/RewardNode/DescNode/NameLabel'], rewardName);
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/GetResourceNode/ButtonsNode/StandardButton/Label'], '普通领取');
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/GetResourceNode/ButtonsNode/DoubleButton/Label'], '双倍领取');
        this.setLabelString(this.rewardPopupLayer, [
            'PopupPanel/GetResourceNode/ButtonsNode/FiveTimesNode/Label'
        ], '5倍领取');
        this.setLabelString(this.rewardPopupLayer, [
            'PopupPanel/GetResourceNode/ButtonsNode/FiveTimesNode/RewardNode/CountLabel'
        ], String(this.rewardPopupDiamondCost));
        if (this.rewardPopupTenTimeButton?.isValid) {
            this.rewardPopupTenTimeButton.active = canUseDiamondMultiplier;
            const tenTimeButton = this.rewardPopupTenTimeButton.getComponent(Button);
            if (tenTimeButton) {
                tenTimeButton.interactable = canUseDiamondMultiplier;
            }
        }
        this.setRewardPopupButtonsInteractable(true);
        this.applyRewardPopupIcon(rewardType);
        this.prepareRewardPopupEffectSprites();
        this.playRewardPopupEffects();
    }

    private async ensureRewardPopupLayer() {
        this.resolveRewardPopupNodes();
        if (this.rewardPopupRoot?.isValid && this.rewardPopupLayer?.isValid) {
            return;
        }

        const rewardPopupLayer = await PopupPrefabLoader.ensurePopupNode(this.node, 'RewardPopupLayer');
        if (rewardPopupLayer?.isValid) {
            this.rewardPopupLayer = rewardPopupLayer;
            this.rewardPopupRoot = rewardPopupLayer;
        }
    }

    private hideRewardPopup(clearQueue: boolean = true) {
        if (!this.rewardPopupLayer?.isValid && !this.rewardPopupRoot?.isValid) {
            this.resolveRewardPopupNodes();
        }

        const popupLayer = this.rewardPopupLayer;
        const popupRoot = this.rewardPopupRoot;
        if (popupLayer?.isValid) {
            popupLayer.active = false;
        }
        if (popupRoot?.isValid) {
            popupRoot.active = false;
        }

        if (clearQueue) {
            this.rewardPopupQueue = [];
        }
        this.rewardPopupPendingReward = null;
        this.rewardPopupClaiming = false;
        this.rewardPopupDelayResourceSync = false;
        setTimeout(() => this.stopRewardPopupEffects(), 0);
    }

    private hasVisiblePopupChildren() {
        return this.node.children.some(child => child.active);
    }

    onRewardPopupStandardButtonClick() {
        void this.claimPendingLevelReward(1);
    }

    onRewardPopupDoubleButtonClick() {
        void this.claimPendingLevelReward(2, true);
    }

    onRewardPopupFiveTimesButtonClick() {
        if (this.rewardPopupPendingReward?.rewardType === 'DIAMOND') {
            Platform.showToast('钻石奖励不能使用钻石倍数领取', 'none');
            return;
        }
        void this.claimPendingLevelReward(5, false, this.rewardPopupDiamondCost);
    }

    async claimPendingLevelReward(multiplier: number, requireAd: boolean = false, diamondCost: number = 0) {
        const pending = this.rewardPopupPendingReward;
        if (!pending || this.rewardPopupClaiming) {
            return;
        }

        if (diamondCost > 0 && pending.rewardType === 'DIAMOND') {
            this.rewardPopupClaiming = false;
            Platform.showToast('钻石奖励不能使用钻石倍数领取', 'none');
            return;
        }

        if (diamondCost > 0 && (dataManager.userData.diamond ?? 0) < diamondCost) {
            Platform.showToast('钻石不足', 'none');
            return;
        }

        this.rewardPopupClaiming = true;
        this.setRewardPopupButtonsInteractable(false);
        this.rewardPopupDelayResourceSync = true;
        if (requireAd) {
            const watched = await Platform.showRewardedVideoAd();
            if (!watched) {
                this.rewardPopupDelayResourceSync = false;
                this.rewardPopupClaiming = false;
                this.setRewardPopupButtonsInteractable(true);
                Platform.showToast('完整观看广告后可领取', 'none');
                return;
            }
        }

        this.setRewardPopupClaimVisualMode(true);
        const rollbackOptimisticClaim = this.applyOptimisticLevelRewardClaim(pending);
        const claimed = await this.claimRewardPopupPendingReward(pending, multiplier, diamondCost);
        if (!claimed) {
            this.setRewardPopupClaimVisualMode(false);
            this.rewardPopupDelayResourceSync = false;
            rollbackOptimisticClaim?.();
            this.rewardPopupClaiming = false;
            this.setRewardPopupButtonsInteractable(true);
            this.syncRewardPopupResourceLabels();
            this.syncAccountResourceLabels();
            return;
        }

        await this.playRewardPopupClaimAnimation(pending.rewardType);
        this.rewardPopupDelayResourceSync = false;
        this.syncRewardPopupResourceLabels();
        this.syncAccountResourceLabels();
        await this.waitForRewardPopupCloseDelay();
        this.hideRewardPopup(false);
        this.showRewardClaimSuccessToast(pending);
        await this.waitForPopupCloseFrame();
        const nextPending = this.rewardPopupQueue.shift();
        if (nextPending) {
            void this.showRewardPopup(nextPending);
        }
    }

    private waitForNextFrame(): Promise<void> {
        return new Promise(resolve => this.scheduleOnce(() => resolve(), 0));
    }

    private async waitForPopupCloseFrame(): Promise<void> {
        await this.waitForNextFrame();
        await this.waitForNextFrame();
    }

    private waitForRewardPopupCloseDelay(): Promise<void> {
        return new Promise(resolve => this.scheduleOnce(() => resolve(), 0.2));
    }

    private setRewardPopupButtonsInteractable(interactable: boolean) {
        for (const node of [
            this.rewardPopupStandardButton,
            this.rewardPopupDoubleButton,
            this.rewardPopupTenTimeButton
        ]) {
            const button = node?.getComponent(Button);
            if (button) {
                button.interactable = interactable && node!.active;
            }
        }
    }

    private applyOptimisticLevelRewardClaim(pending: RewardPopupPendingReward): (() => void) | null {
        if (pending.source !== 'level' || pending.finishLevelRewardClaim === false || !pending.levelReward) {
            return null;
        }

        const targetReward = pending.levelReward;
        const cachedReward = this.findCachedLevelReward(targetReward);
        const rewardToUpdate = cachedReward ?? targetReward;
        const previousTargetState = {
            claimed: targetReward.claimed,
            canClaim: targetReward.canClaim
        };
        const previousCachedState = cachedReward && cachedReward !== targetReward
            ? {
                claimed: cachedReward.claimed,
                canClaim: cachedReward.canClaim
            }
            : null;

        targetReward.claimed = true;
        targetReward.canClaim = false;
        rewardToUpdate.claimed = true;
        rewardToUpdate.canClaim = false;
        this.refreshVisibleLevelRewardItem(rewardToUpdate);

        return () => {
            targetReward.claimed = previousTargetState.claimed;
            targetReward.canClaim = previousTargetState.canClaim;
            if (cachedReward && previousCachedState) {
                cachedReward.claimed = previousCachedState.claimed;
                cachedReward.canClaim = previousCachedState.canClaim;
            }
            this.refreshVisibleLevelRewardItem(rewardToUpdate);
        };
    }

    private findCachedLevelReward(targetReward: LevelRewardItem): LevelRewardItem | null {
        const rewards = this.cachedLevelRewardData?.rewards ?? [];
        return rewards.find(reward => this.isSameLevelReward(reward, targetReward)) ?? null;
    }

    private isSameLevelReward(left: LevelRewardItem, right: LevelRewardItem): boolean {
        if (left.id !== undefined && right.id !== undefined) {
            return String(left.id) === String(right.id);
        }
        return left.level === right.level;
    }

    private refreshVisibleLevelRewardItem(reward: LevelRewardItem) {
        const rewards = this.cachedLevelRewardData?.rewards ?? [];
        const index = rewards.findIndex(item => this.isSameLevelReward(item, reward));
        if (index < 0 || !this.rewardContent?.isValid) {
            return;
        }

        const item = this.rewardContent.getChildByName(`${this.generatedRewardItemPrefix}_${index + 1}`);
        if (item?.isValid) {
            this.applyRewardItem(item, reward);
        }
    }

    private refreshVisibleLevelRewardButtons() {
        const rewards = this.cachedLevelRewardData?.rewards ?? [];
        if (!this.rewardContent?.isValid || rewards.length <= 0) {
            return;
        }

        rewards.forEach((reward, index) => {
            const item = this.rewardContent?.getChildByName(`${this.generatedRewardItemPrefix}_${index + 1}`);
            const buttonNode = item?.getChildByName('ReceiveButton') ?? null;
            this.applyRewardReceiveButtonSprite(buttonNode, reward.claimed === true);
        });
    }

    private showRewardClaimSuccessToast(pending: RewardPopupPendingReward) {
        switch (pending.source) {
            case 'dailyCheckIn':
                Platform.showToast('签到成功', 'success');
                return;
            case 'bountyTask':
                Platform.showToast('领取奖励成功', 'success');
                return;
            default:
                Platform.showToast('领取成功', 'success');
        }
    }

    private playRewardPopupClaimAnimation(rewardTypeValue: string): Promise<void> {
        return new Promise(resolve => {
            const popupLayer = this.rewardPopupLayer;
            const itemNode = this.rewardPopupItemSprite?.node ?? null;
            if (!popupLayer?.isValid || !itemNode?.isValid) {
                resolve();
                return;
            }

            const rewardType = this.normalizeRewardType(rewardTypeValue);
            const itemOpacity = itemNode.getComponent(UIOpacity) ?? itemNode.addComponent(UIOpacity);

            const buttonsNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode'], popupLayer);
            const titleNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/TitleLabel'], popupLayer);
            const descNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/DescNode'], popupLayer);
            for (const node of [buttonsNode, titleNode, descNode]) {
                if (!node?.isValid) {
                    continue;
                }
                const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
                Tween.stopAllByTarget(node);
                Tween.stopAllByTarget(opacity);
                tween(opacity).to(0.12, { opacity: 0 }, { easing: 'quadOut' }).start();
            }

            const flyNodes = rewardType === 'DIAMOND'
                ? this.rewardPopupDiamondFlySprites
                : this.rewardPopupGoldFlySprites;
            const activeFlyGroup = rewardType === 'DIAMOND'
                ? this.rewardPopupDiamondFlyNode
                : this.rewardPopupGoldFlyNode;
            const inactiveFlyGroup = rewardType === 'DIAMOND'
                ? this.rewardPopupGoldFlyNode
                : this.rewardPopupDiamondFlyNode;

            Tween.stopAllByTarget(itemNode);
            Tween.stopAllByTarget(itemOpacity);
            tween(itemNode)
                .to(0.12, { scale: new Vec3(0.82, 0.82, 1) }, { easing: 'quadOut' })
                .start();
            tween(itemOpacity)
                .to(0.12, { opacity: 0 }, { easing: 'quadOut' })
                .start();

            if (flyNodes.length <= 0 || !activeFlyGroup?.isValid) {
                tween(itemOpacity)
                    .delay(0.22)
                    .call(() => resolve())
                    .start();
                return;
            }

            if (this.rewardPopupFlyEffectNode?.isValid) {
                this.rewardPopupFlyEffectNode.active = true;
            }
            activeFlyGroup.active = true;
            if (inactiveFlyGroup?.isValid) {
                inactiveFlyGroup.active = false;
            }

            const parentNode = activeFlyGroup;
            const parentTransform = parentNode.getComponent(UITransform);
            const targetNode = this.findRewardPopupResourceTargetNode(rewardType);
            const targetWorld = targetNode?.getWorldPosition() ?? parentNode.getWorldPosition();
            const target = parentTransform?.convertToNodeSpaceAR(targetWorld) ?? new Vec3(0, 260, 0);

            let completed = 0;
            const finishOne = () => {
                completed += 1;
                if (completed >= flyNodes.length) {
                    this.resetRewardPopupFlyNodes(flyNodes, activeFlyGroup);
                    resolve();
                }
            };

            flyNodes.forEach((particle, index) => {
                if (!particle?.isValid) {
                    finishOne();
                    return;
                }

                const defaultPosition = this.getRewardPopupFlyDefaultPosition(particle);
                const offset = defaultPosition;
                const opacity = particle.getComponent(UIOpacity) ?? particle.addComponent(UIOpacity);
                const gatherPosition = new Vec3(offset.x, offset.y, 0);
                opacity.opacity = 0;
                particle.setPosition(gatherPosition);
                particle.active = true;

                tween(opacity)
                    .to(0.3, { opacity: 255 }, { easing: 'quadOut' })
                    .delay(0.72)
                    .to(0.16, { opacity: 0 }, { easing: 'quadIn' })
                    .start();

                tween(particle)
                    .delay(0.6)
                    .to(0.52, {
                        position: target
                    }, { easing: 'sineInOut' })
                    .call(() => {
                        particle.active = false;
                        particle.setPosition(defaultPosition);
                        finishOne();
                    })
                    .start();
            });
        });
    }

    private getRewardPopupFlyDefaultPosition(node: Node): Vec3 {
        let position = this.rewardPopupFlyDefaultPositions.get(node);
        if (!position) {
            position = node.position.clone();
            this.rewardPopupFlyDefaultPositions.set(node, position);
        }
        return position.clone();
    }

    private resetRewardPopupFlyNodes(nodes: Node[], groupNode?: Node | null) {
        for (const node of nodes) {
            if (!node?.isValid) {
                continue;
            }

            Tween.stopAllByTarget(node);
            const opacity = node.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 0;
            }

            node.setPosition(this.getRewardPopupFlyDefaultPosition(node));
            node.active = false;
        }

        if (groupNode?.isValid) {
            groupNode.active = false;
        }
    }

    private setRewardPopupClaimVisualMode(claiming: boolean) {
        if (this.rewardPopupGetResourceNode?.isValid) {
            this.rewardPopupGetResourceNode.active = !claiming;
        }

        if (claiming && this.rewardPopupFlyNode?.isValid) {
            this.rewardPopupFlyNode.active = true;
        }

        if (this.rewardPopupFlyEffectNode?.isValid) {
            this.rewardPopupFlyEffectNode.active = claiming;
        }

        if (!claiming) {
            this.resetRewardPopupFlyNodes(this.rewardPopupGoldFlySprites, this.rewardPopupGoldFlyNode);
            this.resetRewardPopupFlyNodes(this.rewardPopupDiamondFlySprites, this.rewardPopupDiamondFlyNode);
        }
    }

    private findRewardPopupResourceTargetNode(rewardType: string): Node | null {
        if (!this.rewardPopupLayer?.isValid) {
            return null;
        }

        const paths = rewardType === 'DIAMOND'
            ? [
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondIcon',
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel'
            ]
            : [
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldIcon',
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel'
            ];
        return this.findNodeByPaths(paths, this.rewardPopupLayer);
    }

    private async claimRewardPopupPendingReward(
        pending: RewardPopupPendingReward,
        multiplier: number,
        diamondCost: number
    ): Promise<boolean> {
        switch (pending.source) {
            case 'level':
                return pending.levelReward
                    ? this.claimLevelReward(
                        pending.levelReward,
                        multiplier,
                        diamondCost,
                        pending.levelRewardPart,
                        pending.finishLevelRewardClaim !== false
                    )
                    : false;
            case 'dailyCheckIn':
                return this.claimDailyCheckIn(multiplier, diamondCost);
            case 'bountyTask':
                return this.claimBountyTaskReward(pending, multiplier, diamondCost);
            default:
                return false;
        }
    }

    private applyRewardPopupIcon(rewardType: string) {
        if (!this.rewardPopupItemSprite) {
            return;
        }

        const sourceSprite = rewardType === 'DIAMOND' ? this.rewardPopupDiamondIcon : this.rewardPopupGoldIcon;
        if (sourceSprite?.spriteFrame) {
            this.rewardPopupItemSprite.spriteFrame = sourceSprite.spriteFrame;
        }
    }

    private applyRewardDisplayByType(root: Node, rewardTypeValue?: string) {
        const rewardType = this.normalizeRewardType(rewardTypeValue);
        const rewardName = this.getRewardPopupName(rewardType);
        this.setLabelString(root, [
            'LevelRewardNode/RewardSprite/NameLabel',
            'LevelRewardNode/NameLabel',
            'RewardNode/RewardSprite/NameLabel',
            'RewardNode/NameLabel',
            'RewardSprite/NameLabel',
            'RewardNameLabel',
            'TitleNode/IconSprite/NameLabel',
            'IconSprite/NameLabel'
        ], rewardName);

        const rewardSprite = this.findComponentByPaths([
            'LevelRewardNode/RewardSprite',
            'RewardNode/RewardSprite',
            'RewardSprite',
            'TitleNode/IconSprite',
            'IconSprite'
        ], Sprite, root);
        this.applyRewardSpriteFrameByType(rewardSprite, rewardType);
    }

    private setRewardReceiveButtonLabelByType(buttonNode: Node, rewardType: string | undefined, canClaim: boolean, claimed: boolean) {
        const label = this.findLabelByPaths(['Label', 'ReceiveLabel'], buttonNode);
        if (!label) {
            return;
        }

        if (claimed) {
            label.string = '已领取';
            return;
        }

        label.string = canClaim ? `领取${this.getRewardPopupName(this.normalizeRewardType(rewardType))}` : '';
    }

    private applyRewardSpriteFrameByType(rewardSprite: Sprite | null, rewardType: string) {
        if (!rewardSprite) {
            return;
        }

        this.resolveRewardPopupNodes();
        const sourceSprite = rewardType === 'DIAMOND' ? this.rewardPopupDiamondIcon : this.rewardPopupGoldIcon;
        if (sourceSprite?.spriteFrame) {
            rewardSprite.spriteFrame = sourceSprite.spriteFrame;
        }
    }

    private syncRewardPopupResourceLabels() {
        if (!this.rewardPopupLayer?.isValid) {
            return;
        }

        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondLabel'], String(dataManager.userData.diamond || 0));
        this.setLabelString(this.rewardPopupLayer, ['PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldLabel'], String(dataManager.userData.gold || 0));
    }

    private onUserDataChanged = () => {
        if (this.rewardPopupDelayResourceSync) {
            return;
        }

        this.syncRewardPopupResourceLabels();
        this.syncAccountResourceLabels();
    };

    private syncAccountResourceLabels() {
        const canvas = this.getCanvasNode();
        if (!canvas) {
            return;
        }

        const diamond = String(dataManager.userData.diamond || 0);
        const gold = String(dataManager.userData.gold || 0);
        this.setLabelString(canvas, [
            'Home/HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel',
            'HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel',
            'HeaderContainer/ResourcesPanel/DiamondPanel/DiamondLabel'
        ], diamond);
        this.setLabelString(canvas, [
            'Home/HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel',
            'HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel',
            'HeaderContainer/ResourcesPanel/GoldPanel/GoldLabel'
        ], gold);
    }

    private async claimBountyTaskReward(
        pending: RewardPopupPendingReward,
        multiplier: number = 1,
        diamondCost: number = 0
    ): Promise<boolean> {
        if (!this.bountyTaskData) {
            return false;
        }

        const task = pending.bountyTask;
        if (task) {
            this.normalizeBountyTaskStatus(task);
        }
        if (task && task.status !== 'COMPLETED') {
            return false;
        }

        if (diamondCost > 0 && (dataManager.userData.diamond ?? 0) < diamondCost) {
            Platform.showToast('钻石不足', 'none');
            return false;
        }

        try {
            if (dataManager.isLoggedIn && !dataManager.userData.isDevelopmentUser) {
                await Http.post(task ? `/bounty-tasks/${task.id}/claim` : '/bounty-tasks/claim', {
                    rewardType: pending.rewardType,
                    rewardCount: pending.rewardCount,
                    multiplier,
                    diamondCost
                });
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock bounty task claim:', error);
        }

        this.applyRewardToLocalUserData(pending.rewardType, pending.rewardCount, multiplier, diamondCost);
        if (task) {
            task.status = 'UNCLAIMED';
            task.progress = 0;
            task.acceptedAt = undefined;
            task.deadlineAt = undefined;
        }
        this.renderBountyTaskData(this.bountyTaskData);
        return true;
    }

    private applyLevelRewardToLocalUserData(
        reward: LevelRewardItem,
        multiplier: number,
        diamondCost: number,
        rewardPart?: LevelRewardPart
    ) {
        const claimPart = rewardPart ?? this.normalizeLevelRewardParts(reward)[0];
        this.applyRewardToLocalUserData(claimPart.rewardType, claimPart.rewardCount, multiplier, diamondCost);
    }

    private applyRewardToLocalUserData(rewardTypeValue: string, rewardCount: number, multiplier: number, diamondCost: number) {
        const rewardType = this.normalizeRewardType(rewardTypeValue);
        const finalRewardCount = Math.max(0, rewardCount || 0) * Math.max(1, Math.floor(multiplier || 1));
        const nextDiamond = Math.max(0, (dataManager.userData.diamond || 0) - Math.max(0, diamondCost || 0));

        if (rewardType === 'DIAMOND') {
            dataManager.updateUserData({ diamond: nextDiamond + finalRewardCount });
            return;
        }

        dataManager.updateUserData({
            diamond: nextDiamond,
            gold: (dataManager.userData.gold || 0) + finalRewardCount
        });
    }

    private prepareRewardPopupEffectSprites() {
        this.applyRewardPopupEffectSpriteFrames();
        void this.preloadRewardPopupEffectAssets().then(() => {
            this.applyRewardPopupEffectSpriteFrames();
        });
    }

    private applyRewardPopupEffectSpriteFrames() {
        const haloSprite = this.rewardPopupHaloRingSprite?.getComponent(Sprite) ?? null;
        if (haloSprite && this.rewardPopupHaloSpriteFrame) {
            haloSprite.spriteFrame = this.rewardPopupHaloSpriteFrame;
        }

        const lightSprite = this.rewardPopupLightSprite?.getComponent(Sprite) ?? null;
        if (lightSprite && this.rewardPopupLightSpriteFrame) {
            lightSprite.spriteFrame = this.rewardPopupLightSpriteFrame;
        }

        const stars = this.ensureRewardPopupStarNodes();
        stars.forEach(star => {
            const starSprite = star.getComponent(Sprite) ?? star.addComponent(Sprite);
            if (this.rewardPopupStarSpriteFrame) {
                starSprite.spriteFrame = this.rewardPopupStarSpriteFrame;
            }
        });
    }

    private ensureRewardPopupStarNodes(): Node[] {
        const starRoot = this.rewardPopupStarGroupNode?.isValid
            ? this.rewardPopupStarGroupNode
            : this.rewardPopupStarEffectNode;
        if (!starRoot?.isValid) {
            return [];
        }

        return starRoot.children.filter(star => !!star.getComponent(Sprite));
    }

    private playRewardPopupEffects() {
        this.stopRewardPopupEffects();

        const itemNode = this.rewardPopupItemSprite?.node ?? null;
        const titleNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/TitleLabel'], this.rewardPopupLayer);
        const buttonsNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode'], this.rewardPopupLayer);
        const descNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/DescNode'], this.rewardPopupLayer);

        for (const node of [titleNode, buttonsNode, descNode]) {
            if (!node?.isValid) {
                continue;
            }
            const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
            opacity.opacity = 0;
            const targetScale = node === buttonsNode ? new Vec3(1, 1, 1) : new Vec3(1, 1, 1);
            node.setScale(new Vec3(0.92, 0.92, 1));
            tween(node)
                .delay(node === buttonsNode ? 0.12 : 0.02)
                .to(0.18, { scale: targetScale }, { easing: 'backOut' })
                .start();
            tween(opacity)
                .delay(node === buttonsNode ? 0.12 : 0.02)
                .to(0.14, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        }

        if (itemNode?.isValid) {
            itemNode.active = true;
            itemNode.setScale(new Vec3(0.7, 0.7, 1));

            const itemOpacity = itemNode.getComponent(UIOpacity) ?? itemNode.addComponent(UIOpacity);
            itemOpacity.opacity = 0;

            tween(itemNode)
                .to(0.2, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'backOut' })
                .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .repeatForever(
                    tween()
                        .to(0.9, { scale: new Vec3(1.04, 1.04, 1) }, { easing: 'sineInOut' })
                        .to(0.9, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
                )
                .start();
            tween(itemOpacity)
                .to(0.12, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        }

        this.playRewardPopupHaloEffect();
        this.playRewardPopupLightEffect();
        this.playRewardPopupStarBurst();
    }

    private playRewardPopupHaloEffect() {
        if (!this.rewardPopupHaloRingSprite?.isValid) {
            return;
        }

        const haloNode = this.rewardPopupHaloRingSprite;
        const haloOpacity = haloNode.getComponent(UIOpacity) ?? haloNode.addComponent(UIOpacity);
        haloNode.active = true;
        haloNode.angle = -4;
        haloNode.setScale(new Vec3(0.42, 0.42, 1));
        haloOpacity.opacity = 0;

        tween(haloNode)
            .repeatForever(
                tween()
                    .to(1.2, {
                        scale: new Vec3(0.46, 0.46, 1),
                        angle: 8
                    }, { easing: 'sineInOut' })
                    .to(1.2, {
                        scale: new Vec3(0.42, 0.42, 1),
                        angle: -4
                    }, { easing: 'sineInOut' })
            )
            .start();

        tween(haloOpacity)
            .to(0.2, { opacity: 48 }, { easing: 'quadOut' })
            .start();
    }

    private playRewardPopupLightEffect() {
        if (!this.rewardPopupLightSprite?.isValid) {
            return;
        }

        const lightNode = this.rewardPopupLightSprite;
        const lightOpacity = lightNode.getComponent(UIOpacity) ?? lightNode.addComponent(UIOpacity);
        lightNode.active = true;
        lightNode.angle = 0;
        lightNode.setScale(new Vec3(1, 1, 1));
        lightOpacity.opacity = 0;

        tween(lightNode)
            .repeatForever(
                tween()
                    .to(4.8, {
                        angle: 18
                    }, { easing: 'linear' })
                    .to(4.8, {
                        angle: 36
                    }, { easing: 'linear' })
            )
            .start();

        tween(lightOpacity)
            .to(0.18, { opacity: 185 }, { easing: 'quadOut' })
            .start();
    }

    private playRewardPopupStarBurst() {
        const starRoot = this.rewardPopupStarGroupNode?.isValid
            ? this.rewardPopupStarGroupNode
            : this.rewardPopupStarEffectNode;
        if (!starRoot?.isValid) {
            return;
        }

        if (this.rewardPopupStarEffectNode?.isValid) {
            this.rewardPopupStarEffectNode.active = true;
        }
        starRoot.active = true;

        const stars = this.ensureRewardPopupStarNodes();
        const paths = [
            { scale: 0.5, angle: -18 },
            { scale: 0.46, angle: 16 },
            { scale: 0.42, angle: 18 },
            { scale: 0.44, angle: -16 },
            { scale: 0.38, angle: 20 },
            { scale: 0.36, angle: -20 }
        ];

        stars.forEach((star, index) => {
            const path = paths[index % paths.length];
            const opacity = star.getComponent(UIOpacity) ?? star.addComponent(UIOpacity);

            star.active = true;
            star.setScale(new Vec3(path.scale, path.scale, 1));
            star.angle = path.angle * 0.35;
            opacity.opacity = 0;

            tween(star)
                .delay(index * 0.08)
                .repeatForever(
                    tween()
                        .to(0.55, {
                            scale: new Vec3(path.scale * 1.16, path.scale * 1.16, 1),
                            angle: path.angle
                        }, { easing: 'sineOut' })
                        .to(0.75, {
                            scale: new Vec3(path.scale * 0.72, path.scale * 0.72, 1),
                            angle: path.angle + (path.angle > 0 ? 18 : -18)
                        }, { easing: 'sineIn' })
                        .to(0.45, {
                            scale: new Vec3(path.scale, path.scale, 1),
                            angle: path.angle * 0.35
                        }, { easing: 'sineOut' })
                )
                .start();

            tween(opacity)
                .delay(index * 0.08)
                .repeatForever(
                    tween()
                        .to(0.35, { opacity: 180 }, { easing: 'sineOut' })
                        .to(0.75, { opacity: 70 }, { easing: 'sineIn' })
                        .to(0.45, { opacity: 120 }, { easing: 'sineOut' })
                )
                .start();
        });
    }

    private stopRewardPopupEffects() {
        const popupLayer = this.rewardPopupLayer?.isValid ? this.rewardPopupLayer : null;
        const resetNodes = [
            this.findNodeByPaths(['PopupPanel/GetResourceNode/TitleLabel'], popupLayer),
            this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode'], popupLayer),
            this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/DescNode'], popupLayer)
        ];
        for (const node of resetNodes) {
            if (!node?.isValid) {
                continue;
            }

            Tween.stopAllByTarget(node);
            node.setScale(new Vec3(1, 1, 1));

            const opacity = node.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 255;
            }
        }

        if (this.rewardPopupItemSprite?.node?.isValid) {
            const itemNode = this.rewardPopupItemSprite.node;
            Tween.stopAllByTarget(itemNode);
            itemNode.setScale(new Vec3(1, 1, 1));
            const itemOpacity = itemNode.getComponent(UIOpacity);
            if (itemOpacity) {
                Tween.stopAllByTarget(itemOpacity);
                itemOpacity.opacity = 255;
            }
        }

        for (const effectNode of [this.rewardPopupHaloRingSprite, this.rewardPopupLightSprite]) {
            if (!effectNode?.isValid) {
                continue;
            }

            Tween.stopAllByTarget(effectNode);
            effectNode.active = false;
            effectNode.angle = 0;
            effectNode.setScale(new Vec3(1, 1, 1));

            const opacity = effectNode.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 0;
            }
        }

        for (const star of this.ensureRewardPopupStarNodes()) {
            Tween.stopAllByTarget(star);

            const opacity = star.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 0;
            }

            star.active = false;
            star.angle = 0;
            star.setScale(new Vec3(0.35, 0.35, 1));
        }

        this.resetRewardPopupFlyNodes(this.rewardPopupGoldFlySprites, this.rewardPopupGoldFlyNode);
        this.resetRewardPopupFlyNodes(this.rewardPopupDiamondFlySprites, this.rewardPopupDiamondFlyNode);
    }

    private normalizeRewardType(rewardType?: string) {
        return String(rewardType || 'GOLD').toUpperCase();
    }

    private getRewardPopupName(rewardType: string) {
        switch (rewardType) {
            case 'DIAMOND':
                return '钻石';
            case 'GOLD':
            default:
                return '金币';
        }
    }

    private async loadRewardButtonSpriteFrames() {
        if (this.receiveSpriteFrame && this.receivedSpriteFrame) {
            return;
        }

        const [receive, received] = await Promise.all([
            this.loadSpriteFrame('image/receive/spriteFrame'),
            this.loadSpriteFrame('image/seceived/spriteFrame')
        ]);
        this.receiveSpriteFrame = receive;
        this.receivedSpriteFrame = received;
        this.refreshVisibleLevelRewardButtons();
    }

    private preloadLevelRewardAssets() {
        if (!this.levelRewardAssetsPromise) {
            this.levelRewardAssetsPromise = this.loadLevelRewardAssets();
        }
        return this.levelRewardAssetsPromise;
    }

    private preloadRewardPopupEffectAssets() {
        if (!this.rewardPopupEffectAssetsPromise) {
            this.rewardPopupEffectAssetsPromise = this.loadRewardPopupEffectAssets();
        }
        return this.rewardPopupEffectAssetsPromise;
    }

    private async loadLevelRewardAssets() {
        const [, coinReward, diamondReward] = await Promise.all([
            this.loadRewardButtonSpriteFrames(),
            this.loadSpriteFrame('image/coin_reward/spriteFrame'),
            this.loadSpriteFrame('image/diamond_bg/spriteFrame')
        ]);
        this.levelRewardGoldSpriteFrame = coinReward;
        this.levelRewardDiamondSpriteFrame = diamondReward;
    }

    private async loadRewardPopupEffectAssets() {
        const [halo, star, light] = await Promise.all([
            this.loadSpriteFrame('image/reward/halo_ring/spriteFrame'),
            this.loadSpriteFrame('image/reward/star/spriteFrame'),
            this.loadSpriteFrame('image/reward/reward_light/spriteFrame')
        ]);
        this.rewardPopupHaloSpriteFrame = halo;
        this.rewardPopupStarSpriteFrame = star;
        this.rewardPopupLightSpriteFrame = light;
    }

    private applyLevelRewardSpriteFrameByType(rewardSprite: Sprite | null, rewardTypeValue?: string) {
        if (!rewardSprite) {
            return;
        }

        const rewardType = this.normalizeRewardType(rewardTypeValue);
        const spriteFrame = rewardType === 'DIAMOND'
            ? this.levelRewardDiamondSpriteFrame
            : this.levelRewardGoldSpriteFrame;
        if (spriteFrame) {
            rewardSprite.spriteFrame = spriteFrame;
        }
    }

    private applyLevelRewardDisplayByType(root: Node, rewardTypeValue?: string) {
        const rewardType = this.normalizeRewardType(rewardTypeValue);
        this.setLabelString(root, ['NameLabel', 'RewardNameLabel'], this.getRewardPopupName(rewardType));
        this.applyLevelRewardSpriteFrameByType(root.getComponent(Sprite), rewardType);
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        return BundleResourceLoader.loadSpriteFrame(path);
    }

    private refreshRewardScrollView(resetToTop: boolean) {
        const scrollable = this.updateRewardScrollContentHeight(resetToTop);
        if (!this.rewardScrollView) {
            return;
        }

        this.configureRewardNativeScrollView(scrollable);

        if (resetToTop || !scrollable) {
            this.alignRewardContentToTop();
        }
    }

    private updateRewardScrollContentHeight(resetToTop: boolean): boolean {
        const content = this.rewardContent;
        const scrollView = this.rewardScrollView;
        if (!content || !scrollView) {
            return false;
        }

        const contentTransform = content.getComponent(UITransform);
        const view = scrollView.node.getChildByName('view');
        const viewTransform = view?.getComponent(UITransform) ?? scrollView.node.getComponent(UITransform);
        if (!contentTransform || !viewTransform) {
            return false;
        }

        const items = content.children.filter(child => child !== this.rewardItemTemplate && child.active);
        const itemHeight = this.rewardItemTemplate?.getComponent(UITransform)?.height ?? 90;
        const realListHeight = items.length > 0
            ? this.rewardListPaddingTop
                + this.rewardListPaddingBottom
                + itemHeight * items.length
                + this.rewardItemSpacing * Math.max(0, items.length - 1)
            : 0;
        const realHeight = Math.max(viewTransform.height, realListHeight);

        contentTransform.setContentSize(contentTransform.width, realHeight);
        this.rewardContentTopY = this.getRewardContentTopY();
        this.rewardMaxScrollY = Math.max(0, realHeight - viewTransform.height);
        if (resetToTop) {
            this.alignRewardContentToTop();
        }
        this.updateRewardContentLayout();

        return realHeight > viewTransform.height + 1;
    }

    private prepareRewardContent() {
        if (!this.rewardContent) {
            return;
        }

        const contentTransform = this.rewardContent.getComponent(UITransform);
        if (contentTransform) {
            contentTransform.setAnchorPoint(0.5, 1);
        }

        const contentWidget = this.rewardContent.getComponent(Widget);
        if (contentWidget) {
            contentWidget.enabled = false;
        }

        this.configureRewardContentLayout();

        this.alignRewardContentToTop();
    }

    private getRewardScrollY() {
        return this.rewardContent?.position.y ?? this.getRewardContentTopY();
    }

    private restoreRewardScrollY(rewardScrollY: number) {
        if (!this.rewardContent) {
            return;
        }

        const clampedY = Math.max(
            this.rewardContentTopY,
            Math.min(this.rewardContentTopY + this.rewardMaxScrollY, rewardScrollY)
        );
        this.rewardContent.setPosition(this.rewardContent.position.x, clampedY, this.rewardContent.position.z);
    }

    private configureRewardContentLayout() {
        if (!this.rewardContent) {
            return;
        }

        const layout = this.rewardContent.getComponent(Layout) ?? this.rewardContent.addComponent(Layout);
        layout.enabled = true;
        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.NONE;
        layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
        layout.paddingTop = this.rewardListPaddingTop;
        layout.paddingBottom = this.rewardListPaddingBottom;
        layout.paddingLeft = 0;
        layout.paddingRight = 0;
        layout.spacingY = this.rewardItemSpacing;
        layout.updateLayout();
    }

    private updateRewardContentLayout() {
        const layout = this.rewardContent?.getComponent(Layout);
        if (layout?.enabled) {
            layout.updateLayout();
        }
    }

    private alignRewardContentToTop() {
        const content = this.rewardContent;
        const scrollView = this.rewardScrollView;
        if (!content || !scrollView) {
            return;
        }

        const view = scrollView.node.getChildByName('view');
        const viewTransform = view?.getComponent(UITransform) ?? scrollView.node.getComponent(UITransform);
        if (!viewTransform) {
            return;
        }

        const topY = viewTransform.height * (1 - viewTransform.anchorY);
        content.setPosition(content.position.x, topY, content.position.z);
    }

    private getRewardContentTopY(): number {
        const view = this.rewardScrollView?.node.getChildByName('view');
        const viewTransform = view?.getComponent(UITransform) ?? this.rewardScrollView?.node.getComponent(UITransform);
        return viewTransform ? viewTransform.height * (1 - viewTransform.anchorY) : 0;
    }

    private configureRewardNativeScrollView(scrollable: boolean) {
        if (!this.rewardScrollView) {
            return;
        }
        this.rewardScrollView.stopAutoScroll();
        this.rewardScrollView.horizontal = false;
        this.rewardScrollView.vertical = scrollable;
        this.rewardScrollView.elastic = false;
        this.rewardScrollView.bounceDuration = 0;
        this.rewardScrollView.inertia = false;
        this.rewardScrollView.horizontalScrollBar = null;
        this.rewardScrollView.verticalScrollBar = null;
        this.rewardScrollView.enabled = true;
    }
    private disableRootAutoLayout(item: Node) {
        const widget = item.getComponent(Widget);
        if (widget) {
            widget.enabled = false;
        }

        const layout = item.getComponent(Layout);
        if (layout) {
            layout.enabled = false;
        }
    }

    private clearGeneratedRewardItems() {
        if (!this.rewardContent) {
            return;
        }

        for (const child of [...this.rewardContent.children]) {
            if (child !== this.rewardItemTemplate) {
                child.removeFromParent();
                child.destroy();
            }
        }
    }

    private updateExpProgress(progress: number) {
        if (!this.expProgressBar) {
            return;
        }

        const progressTransform = this.expProgressBar.node.getComponent(UITransform);
        const barNode = this.expProgressBar.node.getChildByName('Bar');
        const barTransform = barNode?.getComponent(UITransform);
        const barWidget = barNode?.getComponent(Widget);

        if (!progressTransform || !barNode || !barTransform) {
            this.expProgressBar.progress = progress;
            return;
        }

        this.expProgressBar.enabled = false;
        if (barWidget) {
            barWidget.enabled = false;
        }

        const fullWidth = progressTransform.width;
        const height = barTransform.height;
        barTransform.setAnchorPoint(0, barTransform.anchorY);
        barTransform.setContentSize(fullWidth, height);
        barNode.setPosition(-fullWidth * 0.5, barNode.position.y, barNode.position.z);
        barNode.setScale(progress, barNode.scale.y, barNode.scale.z);
    }

    private setLabelString(root: Node, paths: string[], value: string) {
        const label = this.findLabelByPaths(paths, root);
        if (label) {
            label.string = value;
        }
    }

    private findLabelByPaths(paths: string[], root: Node): Label | null {
        for (const path of paths) {
            const label = root.getChildByPath(path)?.getComponent(Label);
            if (label) {
                return label;
            }
        }
        return null;
    }

    private resolveRewardPopupNodes() {
        const canvas = this.getCanvasNode();
        const namedRewardPopupLayer = this.findNodeByPaths([
            'PopupRoot/RewardPopupLayer',
            'RewardPopupLayer',
            'RewardPoptoRoot/RewardPopupLayer'
        ], canvas);
        this.rewardPopupLayer = namedRewardPopupLayer?.getChildByPath('PopupPanel/GetResourceNode')
            ? namedRewardPopupLayer
            : this.findRewardPopupLayerByStructure(canvas);
        this.rewardPopupRoot = this.rewardPopupLayer?.parent?.name === 'RewardPoptoRoot'
            ? this.rewardPopupLayer.parent
            : this.rewardPopupLayer;

        const popupLayer = this.rewardPopupLayer;
        if (!popupLayer?.isValid) {
            return;
        }

        this.rewardPopupStarEffectNode = null;
        this.rewardPopupStarGroupNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/StarGroupNode'], popupLayer);
        this.rewardPopupHaloRingSprite = this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/HaloRingSprite'], popupLayer);
        this.rewardPopupLightSprite = this.findNodeByPaths(['PopupPanel/GetResourceNode/RewardNode/LightSprite'], popupLayer);
        this.rewardPopupGetResourceNode = this.findNodeByPaths(['PopupPanel/GetResourceNode'], popupLayer);
        this.rewardPopupFlyNode = this.findNodeByPaths(['PopupPanel/FlyNode'], popupLayer);
        this.rewardPopupFlyEffectNode = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode'], popupLayer);
        this.rewardPopupGoldFlyNode = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode/GoldFlyNode'], popupLayer);
        this.rewardPopupDiamondFlyNode = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode/DiamondFlyNode'], popupLayer);
        this.rewardPopupGoldFlySprites = this.collectRewardPopupFlySprites(this.rewardPopupGoldFlyNode, 'GoldFly');
        this.rewardPopupDiamondFlySprites = this.collectRewardPopupFlySprites(this.rewardPopupDiamondFlyNode, 'DiamondFly');
        this.rewardPopupItemSprite = this.findComponentByPaths(['PopupPanel/GetResourceNode/RewardNode/ItemSprite'], Sprite, popupLayer);
        this.rewardPopupGoldIcon = this.findComponentByPaths(['PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldIcon'], Sprite, popupLayer);
        this.rewardPopupDiamondIcon = this.findComponentByPaths(['PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondIcon'], Sprite, popupLayer);
        this.rewardPopupStandardButton = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode/StandardButton'], popupLayer);
        this.rewardPopupDoubleButton = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode/DoubleButton'], popupLayer);
        this.rewardPopupTenTimeButton = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonsNode/FiveTimesNode'], popupLayer);
        this.bindRewardPopupRuntimeEvents();
    }

    private collectRewardPopupFlySprites(root: Node | null, prefix: string): Node[] {
        if (!root?.isValid) {
            return [];
        }

        return root.children
            .filter(child => child.isValid && child.name.startsWith(prefix) && !!child.getComponent(Sprite))
            .sort((left, right) => left.name.localeCompare(right.name));
    }

    private bindActivityPopupRuntimeEvents() {
        this.bindButtonByPaths(this.levelRewardPopupLayer, [
            'PopupPanel/CloseButton',
            'CloseButton'
        ], () => this.onLevelRewardCloseButtonClick());

        this.bindButtonByPaths(this.bountyTaskPopupLayer, [
            'PopupPanel/TaskClipNode/CoinTaskNode/CoinTaskCard/ReceiveButton',
            'TaskClipNode/CoinTaskNode/CoinTaskCard/ReceiveButton'
        ], () => void this.onBountyTaskReceiveButtonClick(undefined, 'GOLD'));
        this.bindButtonByPaths(this.bountyTaskPopupLayer, [
            'PopupPanel/TaskClipNode/DiamondTaskNode/DiamondTaskCard/ReceiveButton',
            'TaskClipNode/DiamondTaskNode/DiamondTaskCard/ReceiveButton'
        ], () => void this.onBountyTaskReceiveButtonClick(undefined, 'DIAMOND'));
        this.bindButtonByPaths(this.bountyTaskPopupLayer, [
            'PopupPanel/ChangeTaskNode/ChangeTaskNode/ChangeTaskButton',
            'PopupPanel/ChangeTaskNode/ChangeTaskButton',
            'ChangeTaskNode/ChangeTaskNode/ChangeTaskButton',
            'ChangeTaskNode/ChangeTaskButton'
        ], () => void this.onBountyTaskChangeButtonClick());
        this.bindButtonByPaths(this.bountyTaskPopupLayer, [
            'PopupPanel/CloseButton',
            'CloseButton'
        ], () => this.onBountyTaskCloseButtonClick());

        this.bindButtonByPaths(this.changeTaskPopupLayer, [
            'PopupPanel/ButtonsNode/CancelButton',
            'PopupPanel/CancelButton',
            'CancelButton'
        ], () => this.onChangeTaskCancelButtonClick());
        this.bindButtonByPaths(this.changeTaskPopupLayer, [
            'PopupPanel/ButtonsNode/ConfirmButton',
            'PopupPanel/ConfirmButton',
            'ConfirmButton'
        ], () => void this.onChangeTaskConfirmButtonClick());

        this.bindButtonByPaths(this.dailyCheckInPopupLayer, [
            'PopupPanel/ButtonNode/ReceiveButton',
            'PopupPanel/ReceiveButton',
            'ButtonNode/ReceiveButton',
            'ReceiveButton'
        ], () => void this.onDailyCheckInReceiveButtonClick());
        this.bindOptionalButtonByPaths(this.dailyCheckInPopupLayer, [
            'PopupPanel/ButtonNode/DoubleReceiveButton',
            'PopupPanel/DoubleReceiveButton',
            'ButtonNode/DoubleReceiveButton',
            'DoubleReceiveButton'
        ], () => void this.onDailyCheckInDoubleReceiveButtonClick());
        this.bindButtonByPaths(this.dailyCheckInPopupLayer, [
            'PopupPanel/CloseButton',
            'CloseButton'
        ], () => this.onDailyCheckInCloseButtonClick());

        this.bindRewardPopupRuntimeEvents();
    }

    private bindRewardPopupRuntimeEvents() {
        this.bindButton(this.rewardPopupStandardButton, () => this.onRewardPopupStandardButtonClick());
        this.bindButton(this.rewardPopupDoubleButton, () => this.onRewardPopupDoubleButtonClick());
        this.bindButton(this.rewardPopupTenTimeButton, () => this.onRewardPopupFiveTimesButtonClick());
    }

    private bindButtonByPaths(root: Node | null, paths: string[], callback: () => void) {
        const node = this.findNodeByPaths(paths, root);
        if (!node?.isValid) {
            console.warn(`[ActivityPopupRoot] button node not found: ${paths[0]}`);
            return;
        }

        this.bindButton(node, callback);
    }

    private bindOptionalButtonByPaths(root: Node | null, paths: string[], callback: () => void) {
        const node = this.findNodeByPaths(paths, root);
        if (node?.isValid) {
            this.bindButton(node, callback);
        }
    }

    private bindButton(node: Node | null | undefined, callback: () => void) {
        if (!node?.isValid || !node.getComponent(Button)) {
            return;
        }
        node.targetOff(this);
        node.on(Button.EventType.CLICK, callback, this);
    }

    private findRewardPopupLayerByStructure(root: Node | null): Node | null {
        if (!root) {
            return null;
        }

        const isRewardPopupLayer = !!root.getChildByPath('PopupPanel/GetResourceNode')
            && !!root.getChildByPath('PopupPanel/GetResourceNode/RewardNode/DescNode/CountLabel')
            && !!root.getChildByPath('PopupPanel/GetResourceNode/ButtonsNode/StandardButton')
            && !!root.getChildByPath('PopupPanel/FlyNode/FlyEffectNode');
        if (isRewardPopupLayer) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findRewardPopupLayerByStructure(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private async ensureActivityPopupPrefabNodes(popupNames?: string[]) {
        if (!this.node?.isValid) {
            return;
        }

        this.sanitizePopupLayerRefs();
        const shouldLoad = (popupName: string) => !popupNames || popupNames.indexOf(popupName) >= 0;

        const [
            levelRewardPopupLayer,
            bountyTaskPopupLayer,
            changeTaskPopupLayer,
            dailyCheckInPopupLayer
        ] = await Promise.all([
            shouldLoad('LevelRewardPopupLayer') ? PopupPrefabLoader.ensurePopupNode(this.node, 'LevelRewardPopupLayer') : Promise.resolve(null),
            shouldLoad('BountyTaskPopupLayer') ? PopupPrefabLoader.ensurePopupNode(this.node, 'BountyTaskPopupLayer') : Promise.resolve(null),
            shouldLoad('ChangeTaskPopupLayer') ? PopupPrefabLoader.ensurePopupNode(this.node, 'ChangeTaskPopupLayer') : Promise.resolve(null),
            shouldLoad('DailyCheckInPopupLayer') ? PopupPrefabLoader.ensurePopupNode(this.node, 'DailyCheckInPopupLayer') : Promise.resolve(null)
        ]);

        this.levelRewardPopupLayer = this.isMountedPopupLayer(this.levelRewardPopupLayer) ? this.levelRewardPopupLayer : levelRewardPopupLayer ?? this.levelRewardPopupLayer;
        this.bountyTaskPopupLayer = this.isMountedPopupLayer(this.bountyTaskPopupLayer) ? this.bountyTaskPopupLayer : bountyTaskPopupLayer ?? this.bountyTaskPopupLayer;
        this.changeTaskPopupLayer = this.isMountedPopupLayer(this.changeTaskPopupLayer) ? this.changeTaskPopupLayer : changeTaskPopupLayer ?? this.changeTaskPopupLayer;
        this.dailyCheckInPopupLayer = this.isMountedPopupLayer(this.dailyCheckInPopupLayer) ? this.dailyCheckInPopupLayer : dailyCheckInPopupLayer ?? this.dailyCheckInPopupLayer;
        this.resolveNodes();
        this.resolveRewardPopupNodes();
    }

    private resolveNodes() {
        this.sanitizePopupLayerRefs();
        this.levelRewardPopupLayer ??= this.findNodeByPaths(['LevelRewardPopupLayer'], this.node);
        this.bountyTaskPopupLayer ??= this.findNodeByPaths(['BountyTaskPopupLayer'], this.node);
        this.changeTaskPopupLayer ??= this.findNodeByPaths(['ChangeTaskPopupLayer'], this.node);
        this.dailyCheckInPopupLayer ??= this.findNodeByPaths(['DailyCheckInPopupLayer'], this.node);
        this.rewardScrollView ??= this.findComponentByPaths([
            'LevelRewardPopupLayer/PopupPanel/ScrollView'
        ], ScrollView);
        this.rewardContent ??= this.findNodeByPaths([
            'LevelRewardPopupLayer/PopupPanel/ScrollView/view/content'
        ], this.node);
        this.rewardItemTemplate ??= this.rewardContent?.children[0] ?? null;
        this.usernameLabel ??= this.findComponentByPaths([
            'LevelRewardPopupLayer/PopupPanel/UserLevelInfoPanel/LevelInfoNode/UserLabel'
        ], Label);
        this.levelLabel ??= this.findComponentByPaths([
            'LevelRewardPopupLayer/PopupPanel/UserLevelInfoPanel/LevelInfoNode/LevelNode/LevelSprite/LevelLabel'
        ], Label);
        this.expProgressBar ??= this.findComponentByPaths([
            'LevelRewardPopupLayer/PopupPanel/UserLevelInfoPanel/LevelInfoNode/LevelNode/ProgressBar'
        ], ProgressBar);
        this.expLabel ??= this.findComponentByPaths([
            'LevelRewardPopupLayer/PopupPanel/UserLevelInfoPanel/LevelInfoNode/LevelNode/ProgressBar/Label'
        ], Label);
        this.resolveRewardPopupNodes();
    }

    private sanitizePopupLayerRefs() {
        if (!this.isMountedPopupLayer(this.levelRewardPopupLayer)) {
            this.levelRewardPopupLayer = null;
        }
        if (!this.isMountedPopupLayer(this.bountyTaskPopupLayer)) {
            this.bountyTaskPopupLayer = null;
        }
        if (!this.isMountedPopupLayer(this.changeTaskPopupLayer)) {
            this.changeTaskPopupLayer = null;
        }
        if (!this.isMountedPopupLayer(this.dailyCheckInPopupLayer)) {
            this.dailyCheckInPopupLayer = null;
        }
        if (!this.isMountedPopupLayer(this.rewardPopupLayer)) {
            this.rewardPopupLayer = null;
        }
    }

    private isMountedPopupLayer(node: Node | null | undefined): node is Node {
        return !!node?.isValid && node.parent === this.node;
    }

    private getCanvasNode(): Node | null {
        let current: Node | null = this.node;
        while (current?.parent) {
            if (current.parent.name === 'Canvas') {
                return current.parent;
            }
            current = current.parent;
        }

        return this.node;
    }

    private bringSelfToFront() {
        if (!this.node?.isValid || !this.node.parent?.isValid) {
            return;
        }

        this.node.setSiblingIndex(this.node.parent.children.length - 1);
    }

    private ensureBlockInputEvents(layer: Node) {
        if (!layer.getComponent(BlockInputEvents)) {
            layer.addComponent(BlockInputEvents);
        }

        const background = layer.getChildByName('Background');
        if (background && !background.getComponent(BlockInputEvents)) {
            background.addComponent(BlockInputEvents);
        }
    }

    private setBountyTaskBackgroundSpriteEnabled(enabled: boolean) {
        const backgroundSprite = this.bountyTaskPopupLayer
            ?.getChildByName('Background')
            ?.getComponent(Sprite);
        if (backgroundSprite) {
            backgroundSprite.enabled = enabled;
        }
    }
}
