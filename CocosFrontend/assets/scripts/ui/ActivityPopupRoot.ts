import {
    _decorator,
    BlockInputEvents,
    Button,
    Color,
    EventTouch,
    instantiate,
    Label,
    Layout,
    Node,
    ProgressBar,
    resources,
    ScrollView,
    Sprite,
    SpriteFrame,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
    Widget
} from 'cc';
import { BaseUI } from './BaseUI';
import { dataManager } from '../core/DataManager';
import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';

const { ccclass, property } = _decorator;

interface LevelRewardItem {
    id?: number;
    activityId?: number;
    level: number;
    rewardType?: string;
    rewardCount: number;
    rewardDesc?: string;
    canClaim?: boolean;
    claimed?: boolean;
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

    @property(ScrollView)
    rewardScrollView: ScrollView | null = null;

    @property(Node)
    rewardContent: Node | null = null;

    @property(Node)
    rewardItemTemplate: Node | null = null;

    @property(Label)
    usernameLabel: Label | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(ProgressBar)
    expProgressBar: ProgressBar | null = null;

    @property(Label)
    expLabel: Label | null = null;

    private readonly generatedRewardItemPrefix = 'GeneratedLevelRewardItem';
    private readonly rewardItemSpacing = 16;
    private readonly rewardListPaddingTop = 12;
    private readonly rewardListPaddingBottom = 12;
    private rewardContentTopY = 0;
    private rewardMaxScrollY = 0;
    private rewardScrollEventsBound = false;
    private rewardLastTouchY: number | null = null;
    private receiveSpriteFrame: SpriteFrame | null = null;
    private receivedSpriteFrame: SpriteFrame | null = null;
    private bountyTaskData: BountyTaskData | null = null;
    private readonly bountyTaskChangeCostDiamond = 20;
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
    }

    async showLevelRewardPopup() {
        this.resolveNodes();
        if (!this.levelRewardPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] LevelRewardPopupLayer not found');
            return;
        }

        this.levelRewardPopupLayer.active = true;
        this.ensureBlockInputEvents(this.levelRewardPopupLayer);
        this.levelRewardPopupLayer.setSiblingIndex(this.node.children.length - 1);

        await this.loadRewardButtonSpriteFrames();
        const data = await this.loadLevelRewardData();
        this.renderUserLevelInfo(data);
        this.renderRewards(data.rewards);
    }

    hideLevelRewardPopup() {
        this.resolveNodes();
        this.unbindRewardScrollEvents();
        if (this.levelRewardPopupLayer?.isValid) {
            this.levelRewardPopupLayer.active = false;
        }
    }

    onLevelRewardCloseButtonClick() {
        this.hideLevelRewardPopup();
    }

    async showBountyTaskPopup() {
        this.resolveNodes();
        if (!this.bountyTaskPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] BountyTaskPopupLayer not found');
            return;
        }

        this.bountyTaskPopupLayer.active = true;
        this.ensureBlockInputEvents(this.bountyTaskPopupLayer);
        this.bountyTaskPopupLayer.setSiblingIndex(this.node.children.length - 1);
        this.bindBountyTaskEvents();
        await this.loadBountyTaskButtonSpriteFrames();

        const data = await this.loadBountyTaskData();
        this.renderBountyTaskData(data);
    }

    hideBountyTaskPopup() {
        this.resolveNodes();
        this.unschedule(this.updateBountyTaskCountdowns);
        this.hideChangeTaskPopup();
        if (this.bountyTaskPopupLayer?.isValid) {
            this.bountyTaskPopupLayer.active = false;
        }
    }

    onBountyTaskCloseButtonClick() {
        this.hideBountyTaskPopup();
    }

    async showDailyCheckInPopup() {
        this.resolveNodes();
        if (!this.dailyCheckInPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] DailyCheckInPopupLayer not found');
            return;
        }

        this.dailyCheckInPopupLayer.active = true;
        this.ensureBlockInputEvents(this.dailyCheckInPopupLayer);
        this.dailyCheckInPopupLayer.setSiblingIndex(this.node.children.length - 1);
        this.bindDailyCheckInEvents();
        const data = await this.loadDailyCheckInData();
        this.renderDailyCheckInData(data);
    }

    hideDailyCheckInPopup() {
        this.resolveNodes();
        if (this.dailyCheckInPopupLayer?.isValid) {
            this.dailyCheckInPopupLayer.active = false;
        }
    }

    onDailyCheckInCloseButtonClick() {
        this.hideDailyCheckInPopup();
    }

    async onDailyCheckInReceiveButtonClick() {
        await this.claimDailyCheckIn(false);
    }

    async onDailyCheckInDoubleReceiveButtonClick() {
        console.log('[ActivityPopupRoot] onDailyCheckInDoubleReceiveButtonClick');
        // TODO 接入激励视频广告 SDK 后，在这里等待广告完整播放成功回调。
        await this.claimDailyCheckIn(true);
    }

    async onBountyTaskChangeButtonClick() {
        if (this.hasInProgressBountyTask()) {
            this.showChangeTaskPopup();
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

    showChangeTaskPopup() {
        this.resolveNodes();
        if (!this.changeTaskPopupLayer?.isValid) {
            console.warn('[ActivityPopupRoot] ChangeTaskPopupLayer not found');
            return;
        }

        this.setBountyTaskBackgroundSpriteEnabled(false);
        this.changeTaskPopupLayer.active = true;
        this.ensureBlockInputEvents(this.changeTaskPopupLayer);
        this.changeTaskPopupLayer.setSiblingIndex(this.node.children.length - 1);
    }

    hideChangeTaskPopup() {
        this.resolveNodes();
        if (this.changeTaskPopupLayer?.isValid) {
            this.changeTaskPopupLayer.active = false;
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
        try {
            if (dataManager.isLoggedIn) {
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
        const wasFreeChange = this.bountyTaskData?.freeChangeAvailable ?? this.isMockBountyTaskFreeChangeAvailable();

        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.post<BountyTaskData>('/bounty-tasks/change');
                if (this.isValidBountyTaskData(data)) {
                    this.resetBountyTasksAfterChange(data);
                    this.bountyTaskData = data;
                    await this.playBountyTaskCardSwap(data);
                    Platform.showToast('更换成功', 'success');
                    return;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock bounty task change:', error);
        }

        if (wasFreeChange) {
            this.markMockBountyTaskFreeChangeUsedToday();
        }

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
        this.setLabelString(card, [
            'TitleNode/Node/ChallengeCountNode/CountLabel',
            'ChallengeCountNode/CountLabel'
        ], String(task.challengeCount));
        this.applyBountyTaskCompleteStatus(card, task);
        this.applyBountyTaskReceiveButton(card, task);
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

        buttonNode.off(Button.EventType.CLICK);
        if (task.status !== 'FAILED') {
            buttonNode.on(Button.EventType.CLICK, () => {
                void this.onBountyTaskReceiveButtonClick(task);
            }, this);
        }
    }

    private async onBountyTaskReceiveButtonClick(task: BountyTaskItem) {
        if (!this.bountyTaskData) {
            return;
        }

        this.normalizeBountyTaskStatus(task);

        if (task.status === 'COMPLETED') {
            Platform.showToast('领取奖励成功', 'success');
            task.status = 'UNCLAIMED';
            task.progress = 0;
            task.acceptedAt = undefined;
            task.deadlineAt = undefined;
            this.renderBountyTaskData(this.bountyTaskData);
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
            this.loadSpriteFrame('tool/glodtask/yellow_button/spriteFrame'),
            this.loadSpriteFrame('tool/glodtask/gray_button/spriteFrame'),
            this.loadSpriteFrame('tool/glodtask/blue_button/spriteFrame'),
            this.loadSpriteFrame('tool/glodtask/completed/spriteFrame'),
            this.loadSpriteFrame('tool/glodtask/unfinished/spriteFrame')
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

    private bindBountyTaskEvents() {
        const layer = this.bountyTaskPopupLayer;
        if (!layer) {
            return;
        }

        const changeButtonNode = this.findNodeByPaths([
            'PopupPanel/ChangeTaskNode/ChangeTaskNode/ChangeTaskButton',
            'PopupPanel/ChangeTaskNode/ChangeTaskButton',
            'ChangeTaskNode/ChangeTaskNode/ChangeTaskButton',
            'ChangeTaskButton'
        ], layer);
        if (changeButtonNode) {
            changeButtonNode.off(Button.EventType.CLICK, this.onBountyTaskChangeButtonClick, this);
            changeButtonNode.on(Button.EventType.CLICK, this.onBountyTaskChangeButtonClick, this);
        }

        const closeButtonNode = this.findNodeByPaths([
            'PopupPanel/CloseButton',
            'CloseButton'
        ], layer);
        if (closeButtonNode) {
            closeButtonNode.off(Button.EventType.CLICK, this.onBountyTaskCloseButtonClick, this);
            closeButtonNode.on(Button.EventType.CLICK, this.onBountyTaskCloseButtonClick, this);
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
            freeChangeAvailable: this.isMockBountyTaskFreeChangeAvailable(),
            changeCostDiamond: this.bountyTaskChangeCostDiamond
        };
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

    private async claimDailyCheckIn(doubleReward: boolean) {
        if (!this.dailyCheckInData) {
            return;
        }

        if (this.dailyCheckInData.todayClaimed) {
            Platform.showToast('今日已领取', 'none');
            return;
        }

        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.post<DailyCheckInData>(
                    doubleReward ? '/user/daily-check-in/claim-double' : '/user/daily-check-in/claim'
                );
                if (data?.rewards?.length) {
                    Platform.showToast(doubleReward ? '双倍签到成功' : '签到成功', 'success');
                    this.dailyCheckInData = data;
                    this.renderDailyCheckInData(data);
                    return;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock daily check-in claim:', error);
        }

        const claimReward = this.dailyCheckInData.rewards.find(reward => reward.claimable)
            ?? this.dailyCheckInData.rewards.find(reward => !reward.claimed && reward.dayIndex <= this.dailyCheckInData!.todayIndex);
        if (claimReward) {
            claimReward.claimed = true;
            claimReward.claimable = false;
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
        Platform.showToast(doubleReward ? '双倍签到成功' : '签到成功', 'success');
        this.renderDailyCheckInData(this.dailyCheckInData);
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
            if (!claimedDays.includes(dayIndex)) {
                return dayIndex;
            }
        }
        return 0;
    }

    private async loadDailyCheckInData(): Promise<DailyCheckInData> {
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
                claimed: claimedDays.includes(dayIndex),
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

    private bindDailyCheckInEvents() {
        const receiveButton = this.findDailyCheckInReceiveButton();
        if (receiveButton) {
            this.bindDailyCheckInButtonClick(receiveButton, this.onDailyCheckInReceiveButtonClick);
        }

        const doubleReceiveButton = this.findDailyCheckInDoubleReceiveButton();
        if (doubleReceiveButton) {
            this.bindDailyCheckInButtonClick(doubleReceiveButton, this.onDailyCheckInDoubleReceiveButtonClick);
        }

        const closeButton = this.findDailyCheckInCloseButton();
        if (closeButton) {
            closeButton.off(Button.EventType.CLICK, this.onDailyCheckInCloseButtonClick, this);
            closeButton.on(Button.EventType.CLICK, this.onDailyCheckInCloseButtonClick, this);
        }
    }

    private bindDailyCheckInButtonClick(buttonNode: Node, handler: () => Promise<void>) {
        const button = buttonNode.getComponent(Button);
        if (button) {
            button.clickEvents = [];
        }

        buttonNode.off(Button.EventType.CLICK);
        buttonNode.on(Button.EventType.CLICK, handler, this);
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
        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.get<LevelRewardData>('/user/level-rewards');
                if (data && Array.isArray(data.rewards)) {
                    return data;
                }
            }
        } catch (error) {
            console.warn('[ActivityPopupRoot] Use mock level reward data:', error);
        }

        return this.getMockLevelRewardData();
    }

    private getMockLevelRewardData(): LevelRewardData {
        return {
            username: dataManager.userData.username || '测试玩家',
            level: dataManager.userData.level > 0 ? dataManager.userData.level : 1,
            exp: dataManager.userData.exp > 0 ? dataManager.userData.exp : 100,
            nextLevelExp: 200,
            rewards: [
                { level: 2, rewardCount: 100 },
                { level: 3, rewardCount: 120 },
                { level: 4, rewardCount: 150 },
                { level: 5, rewardCount: 180 },
                { level: 6, rewardCount: 220 },
                { level: 7, rewardCount: 260 },
                { level: 8, rewardCount: 300 },
                { level: 9, rewardCount: 350 },
                { level: 10, rewardCount: 400 },
                { level: 12, rewardCount: 500 }
            ].map(reward => ({
                ...reward,
                canClaim: (dataManager.userData.level || 1) >= reward.level,
                claimed: false
            }))
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

    private renderRewards(rewards: LevelRewardItem[]) {
        this.resolveNodes();
        if (!this.rewardContent || !this.rewardItemTemplate) {
            console.warn('[ActivityPopupRoot] Reward content or item template not found');
            return;
        }

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

        this.refreshRewardScrollView(true);
    }

    private applyRewardItem(item: Node, reward: LevelRewardItem) {
        const levelLabel = item.getChildByPath('LevelRequireNode/LevelRequireSprite/LevelLabel')?.getComponent(Label);
        const requireLabel = item.getChildByPath('LevelRequireNode/LevelRequireLabel')?.getComponent(Label);
        const numberLabel = item.getChildByPath('LevelRewardNode/RewardSprite/NumberLabel')?.getComponent(Label);
        const receiveButton = item.getChildByName('ReceiveButton');

        if (levelLabel) {
            levelLabel.string = String(reward.level);
        }
        if (requireLabel) {
            requireLabel.string = `等级达到${reward.level}级`;
        }
        if (numberLabel) {
            numberLabel.string = String(reward.rewardCount);
        }
        this.applyRewardReceiveButton(receiveButton, reward);
    }

    private applyRewardReceiveButton(buttonNode: Node | null, reward: LevelRewardItem) {
        if (!buttonNode) {
            return;
        }

        const canClaim = reward.canClaim === true;
        const claimed = reward.claimed === true;
        buttonNode.active = canClaim || claimed;

        const sprite = buttonNode.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = claimed ? this.receivedSpriteFrame : this.receiveSpriteFrame;
        }

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.interactable = canClaim && !claimed;
        }

        buttonNode.off(Button.EventType.CLICK);
        if (canClaim && !claimed) {
            buttonNode.on(Button.EventType.CLICK, () => {
                void this.claimLevelReward(reward);
            }, this);
        }
    }

    private async claimLevelReward(reward: LevelRewardItem) {
        if (!reward.id) {
            Platform.showToast('奖励配置异常', 'none');
            return;
        }

        try {
            await Http.post(`/user/level-rewards/${reward.id}/claim`);
            Platform.showToast('领取成功', 'success');
            const data = await this.loadLevelRewardData();
            this.renderUserLevelInfo(data);
            this.renderRewards(data.rewards);
        } catch (error) {
            console.warn('[ActivityPopupRoot] Claim level reward failed:', error);
            Platform.showToast(error instanceof Error ? error.message : '领取失败', 'none');
        }
    }

    private async loadRewardButtonSpriteFrames() {
        const [receive, received] = await Promise.all([
            this.loadSpriteFrame('tool/receive/spriteFrame'),
            this.loadSpriteFrame('tool/seceived/spriteFrame')
        ]);
        this.receiveSpriteFrame = receive;
        this.receivedSpriteFrame = received;
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        return new Promise(resolve => {
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.warn(`[ActivityPopupRoot] Load sprite frame failed: ${path}`, error);
                    resolve(null);
                    return;
                }
                resolve(spriteFrame);
            });
        });
    }

    private refreshRewardScrollView(resetToTop: boolean) {
        const scrollable = this.updateRewardScrollContentHeight();
        if (!this.rewardScrollView) {
            return;
        }

        this.configureRewardNativeScrollView(scrollable);

        if (resetToTop || !scrollable) {
            this.alignRewardContentToTop();
        }
    }

    private updateRewardScrollContentHeight(): boolean {
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
        this.alignRewardContentToTop();
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

        this.unbindRewardScrollEvents();
        this.rewardScrollView.stopAutoScroll();
        this.rewardScrollView.horizontal = false;
        this.rewardScrollView.vertical = scrollable;
        this.rewardScrollView.elastic = false;
        this.rewardScrollView.inertia = false;
        this.rewardScrollView.horizontalScrollBar = null;
        this.rewardScrollView.verticalScrollBar = null;
        this.rewardScrollView.enabled = true;
    }

    private bindRewardScrollEvents() {
        this.unbindRewardScrollEvents();

        const node = this.getRewardScrollEventNode();
        if (!node || this.rewardScrollEventsBound) {
            return;
        }

        node.on(Node.EventType.TOUCH_START, this.onRewardScrollTouchStart, this);
        node.on(Node.EventType.TOUCH_MOVE, this.onRewardScrollTouchMove, this);
        node.on(Node.EventType.TOUCH_END, this.onRewardScrollTouchEnd, this);
        node.on(Node.EventType.TOUCH_CANCEL, this.onRewardScrollTouchEnd, this);
        this.rewardScrollEventsBound = true;
    }

    private unbindRewardScrollEvents() {
        const eventNode = this.getRewardScrollEventNode();
        const scrollNode = this.rewardScrollView?.node;

        for (const node of [eventNode, scrollNode]) {
            if (!node) {
                continue;
            }

            node.off(Node.EventType.TOUCH_START, this.onRewardScrollTouchStart, this);
            node.off(Node.EventType.TOUCH_MOVE, this.onRewardScrollTouchMove, this);
            node.off(Node.EventType.TOUCH_END, this.onRewardScrollTouchEnd, this);
            node.off(Node.EventType.TOUCH_CANCEL, this.onRewardScrollTouchEnd, this);
        }

        this.rewardScrollEventsBound = false;
        this.rewardLastTouchY = null;
    }

    private getRewardScrollEventNode(): Node | null {
        return this.rewardScrollView?.node.getChildByName('view') ?? this.rewardScrollView?.node ?? null;
    }

    private onRewardScrollTouchStart(event: EventTouch) {
        this.rewardLastTouchY = event.getUILocation().y;
    }

    private onRewardScrollTouchMove(event: EventTouch) {
        if (!this.rewardContent || this.rewardMaxScrollY <= 0) {
            return;
        }

        const currentTouchY = event.getUILocation().y;
        const deltaY = this.rewardLastTouchY === null ? 0 : currentTouchY - this.rewardLastTouchY;
        this.rewardLastTouchY = currentTouchY;

        const currentY = this.rewardContent.position.y;
        const nextY = Math.max(
            this.rewardContentTopY,
            Math.min(this.rewardContentTopY + this.rewardMaxScrollY, currentY + deltaY)
        );

        this.rewardContent.setPosition(this.rewardContent.position.x, nextY, this.rewardContent.position.z);
        event.propagationStopped = true;
    }

    private onRewardScrollTouchEnd() {
        this.rewardLastTouchY = null;
        if (!this.rewardContent) {
            return;
        }

        const currentY = this.rewardContent.position.y;
        const clampedY = Math.max(
            this.rewardContentTopY,
            Math.min(this.rewardContentTopY + this.rewardMaxScrollY, currentY)
        );
        this.rewardContent.setPosition(this.rewardContent.position.x, clampedY, this.rewardContent.position.z);
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

    private resolveNodes() {
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
