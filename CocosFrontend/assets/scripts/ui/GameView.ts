import { _decorator, Button, director, Node } from 'cc';
import { BaseUI } from './BaseUI';
import { Platform } from '../utils/Platform';
import { Http } from '../network/Http';
import { Activity, dataManager, FunctionItem, GameMode } from '../core/DataManager';
import { SettingsPopupRoot } from './SettingsPopupRoot';
import { ActivityPopupRoot } from './ActivityPopupRoot';
import { WeekRankingPopupLayer } from './WeekRankingPopupLayer';
import { LastWeekRankingPopupLayer } from './LastWeekRankingPopupLayer';
import { PopupPrefabLoader } from './PopupPrefabLoader';
import { RankingsPage } from './RankingsPage';
import { BackPackPopupLayer } from './BackPackPopupLayer';
import { FlipRewardPopupLayer } from './FlipRewardPopupLayer';
import { InviteRewardPopupLayer } from './InviteRewardPopupLayer';
import { RankChallengePopupLayer } from './RankChallengePopupLayer';
import { BattleMatchPopupLayer } from './BattleMatchPopupLayer';
import { PopupStack } from './PopupStack';
import { BundleResourceLoader, PopupBundleName } from './BundleResourceLoader';

const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends BaseUI {
    @property(Node)
    settingsPopupRootNode: Node | null = null;

    @property(Node)
    activityPopupRootNode: Node | null = null;

    @property(Node)
    weekRankingPopupLayerNode: Node | null = null;

    @property(Node)
    lastWeekRankingPopupLayerNode: Node | null = null;

    @property(Node)
    backPackPopupLayerNode: Node | null = null;

    @property(Node)
    flipRewardPopupLayerNode: Node | null = null;

    @property(Node)
    inviteRewardPopupLayerNode: Node | null = null;

    @property(Node)
    rankChallengePopupLayerNode: Node | null = null;

    @property(Node)
    battleMatchPopupLayerNode: Node | null = null;

    private openingBackPackPopup = false;
    private openingFlipRewardPopup = false;
    private openingInviteRewardPopup = false;
    private openingRankChallengePopup = false;

    onEnter() {
        this.resolveNodes();
        this.bindFunctionPanelEvents();
        this.loadActivities();
    }

    preloadGamePopupNodes() {
        this.resolveNodes();
        this.getRankChallengePopupLayer();
        if (this.battleMatchPopupLayerNode?.isValid && !this.battleMatchPopupLayerNode.getComponent(BattleMatchPopupLayer)) {
            this.battleMatchPopupLayerNode.addComponent(BattleMatchPopupLayer);
        }
    }

    start() {
        this.onEnter();
    }

    onSettingButtonClick() {
        console.log('[GameView] onSettingButtonClick');
        void this.openSettingsPopupRoot();
    }

    private async openSettingsPopupRoot() {
        const settingsPopupRoot = await this.getSettingsPopupRootAsync();
        if (settingsPopupRoot) {
            PopupStack.open(settingsPopupRoot.node, { hideSiblings: false });
            settingsPopupRoot.showSettingsPopup();
            return;
        }

        this.showSettingsPopupLayerFallback();
    }

    async loadActivities() {
        if (!dataManager.isLoggedIn) {
            return;
        }

        try {
            const activities = await Http.get('/activities') as any[];
            if (activities?.length > 0) {
                dataManager.setActivities(activities);
                this.updateActivitiesUI(activities);
            }
        } catch (error) {
            console.error('[GameView] Load activities error:', error);
            dataManager.setActivities([
                { id: 1, title: 'Daily Checkin', activityType: 'SIGNIN', imageUrl: '', showCountdown: false },
                { id: 2, title: 'Recharge Bonus', activityType: 'RECHARGE', imageUrl: '', showCountdown: false },
                { id: 3, title: 'New Player Gift', activityType: 'GIFT', imageUrl: '', showCountdown: false }
            ]);
            this.updateActivitiesUI(dataManager.activities);
        }
    }

    onActivityClick(activity: Activity) {
        console.log('[GameView] Activity clicked:', activity);
        if (activity.activityType === 'SIGNIN') {
            void this.showDailyCheckInPopup();
            return;
        }
        Platform.showToast('Activity detail is in development', 'none');
    }

    onGameModeClick(mode: GameMode) {
        console.log('[GameView] Game mode clicked:', mode);
        Platform.showToast(`${mode.title} 即将进入捣蛋工坊`, 'none');
    }

    onRankChallengeButtonClick() {
        console.log('[GameView] onRankChallengeButtonClick');
        void this.openRankChallengePopup();
    }

    onFunctionClick(func: FunctionItem) {
        console.log('[GameView] Function clicked:', func);
        if (func.route === 'rankings') {
            void this.openRankingsPage();
            return;
        }
        if (func.route === 'backpack') {
            void this.openBackPackPopup();
            return;
        }
        if (func.route === 'flipReward') {
            void this.openFlipRewardPopup();
            return;
        }
        if (func.route === 'inviteReward') {
            void this.openInviteRewardPopup();
            return;
        }
        Platform.showToast(`${func.title} is in development`, 'none');
    }

    onLevelRewardButtonClick() {
        console.log('[GameView] onLevelRewardButtonClick');
        void this.showLevelRewardPopup();
    }

    onBountyTaskButtonClick() {
        console.log('[GameView] onBountyTaskButtonClick');
        void this.showBountyTaskPopup();
    }

    onDailyCheckInButtonClick() {
        console.log('[GameView] onDailyCheckInButtonClick');
        void this.showDailyCheckInPopup();
    }

    onRankButtonClick() {
        const weeklyBattleGold = Number(dataManager.userData.weeklyBattleGold ?? 0);
        console.log(`[GameView] onRankButtonClick weeklyBattleGold=${weeklyBattleGold}`);
        if (weeklyBattleGold <= 0) {
            void this.openLastWeekRankingPopup();
            return;
        }

        void this.openWeekRankingPopup();
    }

    async openWeekRankingPopup() {
        console.log('[GameView] openWeekRankingPopup');
        const popup = await this.getWeekRankingPopupLayerAsync();
        if (!popup) {
            console.warn('[GameView] WeekRankingPopupLayer open failed: popup is null');
            return;
        }
        await popup.open();
        PopupStack.open(popup.node);
    }

    async openLastWeekRankingPopup() {
        console.log('[GameView] openLastWeekRankingPopup');
        const popup = await this.getLastWeekRankingPopupLayerAsync();
        if (!popup) {
            console.warn('[GameView] LastWeekRankingPopupLayer open failed: popup is null');
            return;
        }
        await popup.open();
        PopupStack.open(popup.node);
    }

    private async showLevelRewardPopup() {
        const loading = this.showLoadingIfBundleCold('popup_activity');
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            this.hideLoadingIfShown(loading);
            console.warn('[GameView] showLevelRewardPopup failed: ActivityPopupRoot is null');
            return;
        }
        PopupStack.open(root.node, { hideSiblings: false });
        root.node.active = true;
        try {
            await root.showLevelRewardPopup();
        } finally {
            this.hideLoadingIfShown(loading);
        }
    }

    private async showBountyTaskPopup() {
        const loading = this.showLoadingIfBundleCold('popup_activity');
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            this.hideLoadingIfShown(loading);
            console.warn('[GameView] showBountyTaskPopup failed: ActivityPopupRoot is null');
            return;
        }
        PopupStack.open(root.node, { hideSiblings: false });
        root.node.active = true;
        try {
            await root.showBountyTaskPopup();
        } finally {
            this.hideLoadingIfShown(loading);
        }
    }

    private async showDailyCheckInPopup() {
        const loading = this.showLoadingIfBundleCold('popup_activity');
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            this.hideLoadingIfShown(loading);
            console.warn('[GameView] showDailyCheckInPopup failed: ActivityPopupRoot is null');
            return;
        }
        PopupStack.open(root.node, { hideSiblings: false });
        root.node.active = true;
        try {
            await root.showDailyCheckInPopup();
        } finally {
            this.hideLoadingIfShown(loading);
        }
    }

    private preloadWeekRankingPopup() {
        this.getWeekRankingPopupLayer()?.preload();
        this.getLastWeekRankingPopupLayer()?.preload();
        void PopupPrefabLoader.preloadPopup('WeekRankingPopupLayer');
        void PopupPrefabLoader.preloadPopup('LastWeekRankingPopupLayer');
    }

    private preloadRankingsPage() {
        const rankingsPageNode = this.getCanvasNode()?.getChildByName('RankingsPage') ?? null;
        if (!rankingsPageNode?.isValid) {
            return;
        }

        const rankingsPage = rankingsPageNode.getComponent(RankingsPage) ?? rankingsPageNode.addComponent(RankingsPage);
        void rankingsPage.preload();
    }

    private updateActivitiesUI(activities: Activity[]) {
        console.log('[GameView] Activities:', activities);
    }

    private async openRankingsPage() {
        const rankingsPageNode = this.getCanvasNode()?.getChildByName('RankingsPage') ?? null;
        if (!rankingsPageNode?.isValid) {
            console.warn('[GameView] RankingsPage node not found');
            return;
        }

        const rankingsPage = rankingsPageNode.getComponent(RankingsPage) ?? rankingsPageNode.addComponent(RankingsPage);
        await rankingsPage.open();
    }

    private async openBackPackPopup() {
        if (this.openingBackPackPopup) {
            console.log('[GameView] openBackPackPopup skipped: opening');
            return;
        }

        this.openingBackPackPopup = true;
        console.log('[GameView] openBackPackPopup');
        const loading = this.showLoadingIfBundleCold('popup_backpack');
        try {
            const popup = await this.getBackPackPopupLayerAsync();
            if (!popup) {
                console.warn('[GameView] BackPackPopupLayer open failed: popup is null');
                return;
            }

            await popup.open('decorate');
            PopupStack.open(popup.node);
        } finally {
            this.hideLoadingIfShown(loading);
            this.openingBackPackPopup = false;
        }
    }

    async openFlipRewardPopup() {
        if (this.openingFlipRewardPopup) {
            console.log('[GameView] openFlipRewardPopup skipped: opening');
            return;
        }

        this.openingFlipRewardPopup = true;
        console.log('[GameView] openFlipRewardPopup');
        const loading = this.showLoadingIfBundleCold('popup_flip_reward');
        try {
            const popup = await this.getFlipRewardPopupLayerAsync();
            if (!popup) {
                console.warn('[GameView] FlipRewardPopupLayer open failed: popup is null');
                return;
            }

            popup.open();
            PopupStack.open(popup.node);
        } finally {
            this.hideLoadingIfShown(loading);
            this.openingFlipRewardPopup = false;
        }
    }

    async openInviteRewardPopup() {
        if (this.openingInviteRewardPopup) {
            console.log('[GameView] openInviteRewardPopup skipped: opening');
            return;
        }

        this.openingInviteRewardPopup = true;
        console.log('[GameView] openInviteRewardPopup');
        const loading = this.showLoadingIfBundleCold('popup_invite_reward');
        try {
            const popup = await this.getInviteRewardPopupLayerAsync();
            if (!popup) {
                console.warn('[GameView] InviteRewardPopupLayer open failed: popup is null');
                return;
            }

            void popup.open();
            PopupStack.open(popup.node);
        } finally {
            this.hideLoadingIfShown(loading);
            this.openingInviteRewardPopup = false;
        }
    }

    async openRankChallengePopup() {
        if (this.openingRankChallengePopup) {
            console.log('[GameView] openRankChallengePopup skipped: opening');
            return;
        }

        this.openingRankChallengePopup = true;
        console.log('[GameView] openRankChallengePopup');
        try {
            this.activateGamePopupRoot();
            const popup = await this.getRankChallengePopupLayerAsync();
            if (!popup) {
                console.warn('[GameView] RankChallengePopupLayer open failed: popup is null');
                return;
            }

            PopupStack.close(this.battleMatchPopupLayerNode);
            popup.setHandlers({
                onBack: () => popup.close(),
                onRankInfo: () => void this.openLastWeekRankingPopup()
            });
            popup.open();
        } finally {
            this.openingRankChallengePopup = false;
        }
    }

    private activateGamePopupRoot() {
        const root = this.getCanvasNode()?.getChildByName('GamePopupRoot') ?? null;
        if (root?.isValid) {
            root.active = true;
        }
    }

    private bindFunctionPanelEvents() {
        const rankChallengeNode = this.node.getChildByPath('GamePanel/RankChallenge')
            ?? this.getCanvasNode()?.getChildByPath('Home/GameContainer/GamePanel/RankChallenge')
            ?? null;
        this.bindClick(rankChallengeNode, () => void this.openRankChallengePopup(), 'GamePanel/RankChallenge');

        const rankingListNode = this.node.getChildByPath('FunctionPanel/RankingList')
            ?? this.getCanvasNode()?.getChildByPath('Home/GameContainer/FunctionPanel/RankingList')
            ?? null;
        this.bindClick(rankingListNode, () => void this.openRankingsPage(), 'FunctionPanel/RankingList');

        const backpackNode = this.node.getChildByPath('FunctionPanel/Backpack')
            ?? this.getCanvasNode()?.getChildByPath('Home/GameContainer/FunctionPanel/Backpack')
            ?? null;
        this.bindClick(backpackNode, () => void this.openBackPackPopup(), 'FunctionPanel/Backpack');

        // FlipReward lives on the Home scene entry layer, so HomeView owns this click binding.
    }

    private bindClick(node: Node | null, handler: () => void, debugName: string) {
        if (!node?.isValid) {
            return;
        }

        const button = node.getComponent(Button);
        node.targetOff(this);
        let lastTriggerAt = 0;
        const wrappedHandler = () => {
            const now = Date.now();
            if (now - lastTriggerAt < 80) {
                return;
            }
            lastTriggerAt = now;
            handler();
        };
        if (button) {
            button.interactable = true;
            node.on(Button.EventType.CLICK, wrappedHandler, this);
        }
        node.on(Node.EventType.TOUCH_END, wrappedHandler, this);
        console.log(`[GameView] bind click success: ${debugName}`);
    }

    private resolveNodes() {
        const canvas = this.getCanvasNode();
        this.settingsPopupRootNode ??= this.findNodeByPaths([
            'SettingsPopupRoot',
            'SettinsPopupRoot'
        ], canvas);
        this.activityPopupRootNode ??= this.findNodeByPaths([
            'PopupRoot'
        ], canvas);
        this.weekRankingPopupLayerNode ??= this.findNodeByPaths([
            'PopupRoot/WeekRankingPopupLayer',
            'WeekRankingPopupLayer'
        ], canvas);
        this.lastWeekRankingPopupLayerNode ??= this.findLastWeekRankingPopupNode(canvas);
        this.backPackPopupLayerNode ??= this.findNodeByPaths([
            'PopupRoot/BackPackPopupLayer',
            'BackPackPopupLayer'
        ], canvas);
        this.flipRewardPopupLayerNode ??= this.findNodeByPaths([
            'PopupRoot/FlipRewardPopupLayer',
            'FlipRewardPopupLayer'
        ], canvas);
        this.inviteRewardPopupLayerNode ??= this.findNodeByPaths([
            'PopupRoot/InviteRewardPopupLayer',
            'InviteRewardPopupLayer'
        ], canvas);
        this.rankChallengePopupLayerNode ??= this.findNodeByPaths([
            'GamePopupRoot/RankChallengePopupLayer',
            'RankChallengePopupLayer'
        ], canvas);
        this.battleMatchPopupLayerNode ??= this.findNodeByPaths([
            'GamePopupRoot/BattleMatchPopupLayer',
            'BattleMatchPopupLayer'
        ], canvas);
        if (this.battleMatchPopupLayerNode?.isValid && !this.battleMatchPopupLayerNode.getComponent(BattleMatchPopupLayer)) {
            this.battleMatchPopupLayerNode.addComponent(BattleMatchPopupLayer);
        }
    }

    private getSettingsPopupRoot(): SettingsPopupRoot | null {
        this.resolveNodes();
        const root = this.settingsPopupRootNode
            ? this.settingsPopupRootNode.getComponent(SettingsPopupRoot)
                ?? this.settingsPopupRootNode.addComponent(SettingsPopupRoot)
            : null;
        if (!root) {
            console.warn('[GameView] SettingsPopupRoot component not found');
        }
        return root;
    }

    private async getSettingsPopupRootAsync(): Promise<SettingsPopupRoot | null> {
        this.resolveNodes();
        if (!this.settingsPopupRootNode?.isValid) {
            this.settingsPopupRootNode = await PopupPrefabLoader.ensurePopupNode(this.getCanvasNode(), 'SettinsPopupRoot');
        }
        if (this.settingsPopupRootNode?.isValid) {
            this.settingsPopupRootNode.active = true;
        }
        return this.getSettingsPopupRoot();
    }

    private getActivityPopupRoot(): ActivityPopupRoot | null {
        this.resolveNodes();
        const root = this.activityPopupRootNode?.getComponent(ActivityPopupRoot) ?? null;
        if (!root) {
            console.warn('[GameView] ActivityPopupRoot component not found');
        }
        return root;
    }

    private async getActivityPopupRootAsync(): Promise<ActivityPopupRoot | null> {
        this.resolveNodes();
        if (!this.activityPopupRootNode?.isValid) {
            const canvas = this.getCanvasNode();
            this.activityPopupRootNode = PopupPrefabLoader.findNodeByName(canvas, 'PopupRoot');
            if (!this.activityPopupRootNode?.isValid && canvas?.isValid) {
                this.activityPopupRootNode = new Node('PopupRoot');
                canvas.addChild(this.activityPopupRootNode);
            }
        }

        if (!this.activityPopupRootNode?.isValid) {
            return null;
        }

        this.activityPopupRootNode.active = true;
        return this.activityPopupRootNode.getComponent(ActivityPopupRoot)
            ?? this.activityPopupRootNode.addComponent(ActivityPopupRoot);
    }

    private getWeekRankingPopupLayer(): WeekRankingPopupLayer | null {
        this.resolveNodes();
        const root = this.weekRankingPopupLayerNode
            ? this.weekRankingPopupLayerNode.getComponent(WeekRankingPopupLayer)
                ?? this.weekRankingPopupLayerNode.addComponent(WeekRankingPopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] WeekRankingPopupLayer component not found');
        }
        return root;
    }

    private async getWeekRankingPopupLayerAsync(): Promise<WeekRankingPopupLayer | null> {
        this.resolveNodes();
        if (!this.weekRankingPopupLayerNode?.isValid) {
            this.weekRankingPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(
                this.getPopupParentNode(),
                'WeekRankingPopupLayer'
            );
        }
        return this.getWeekRankingPopupLayer();
    }

    private getLastWeekRankingPopupLayer(): LastWeekRankingPopupLayer | null {
        this.resolveNodes();
        const root = this.lastWeekRankingPopupLayerNode
            ? this.lastWeekRankingPopupLayerNode.getComponent(LastWeekRankingPopupLayer)
                ?? this.lastWeekRankingPopupLayerNode.addComponent(LastWeekRankingPopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] LastWeekRankingPopupLayer component not found');
        }
        return root;
    }

    private async getLastWeekRankingPopupLayerAsync(): Promise<LastWeekRankingPopupLayer | null> {
        this.resolveNodes();
        if (!this.lastWeekRankingPopupLayerNode?.isValid) {
            this.lastWeekRankingPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(
                this.getPopupParentNode(),
                'LastWeekRankingPopupLayer'
            );
        }
        return this.getLastWeekRankingPopupLayer();
    }

    private getBackPackPopupLayer(): BackPackPopupLayer | null {
        this.resolveNodes();
        const root = this.backPackPopupLayerNode
            ? this.backPackPopupLayerNode.getComponent(BackPackPopupLayer)
                ?? this.backPackPopupLayerNode.addComponent(BackPackPopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] BackPackPopupLayer component not found');
        }
        return root;
    }

    private async getBackPackPopupLayerAsync(): Promise<BackPackPopupLayer | null> {
        this.resolveNodes();
        if (!this.backPackPopupLayerNode?.isValid) {
            this.backPackPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(
                this.getPopupParentNode(),
                'BackPackPopupLayer'
            ) ?? PopupPrefabLoader.findNodeByName(this.getCanvasNode(), 'BackPackPopupLayer');
        }
        return this.getBackPackPopupLayer();
    }

    private getFlipRewardPopupLayer(): FlipRewardPopupLayer | null {
        this.resolveNodes();
        if (this.flipRewardPopupLayerNode?.isValid && !this.flipRewardPopupLayerNode.getComponent(FlipRewardPopupLayer)) {
            this.activatePopupParent(this.flipRewardPopupLayerNode);
            this.flipRewardPopupLayerNode.active = true;
        }

        const root = this.flipRewardPopupLayerNode
            ? this.flipRewardPopupLayerNode.getComponent(FlipRewardPopupLayer)
                ?? this.flipRewardPopupLayerNode.addComponent(FlipRewardPopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] FlipRewardPopupLayer component not found');
        }
        return root;
    }

    private async getFlipRewardPopupLayerAsync(): Promise<FlipRewardPopupLayer | null> {
        this.resolveNodes();
        if (!this.flipRewardPopupLayerNode?.isValid) {
            this.flipRewardPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(
                this.getPopupParentNode(),
                'FlipRewardPopupLayer'
            ) ?? PopupPrefabLoader.findNodeByName(this.getCanvasNode(), 'FlipRewardPopupLayer');
        }
        return this.getFlipRewardPopupLayer();
    }

    private getInviteRewardPopupLayer(): InviteRewardPopupLayer | null {
        this.resolveNodes();
        if (this.inviteRewardPopupLayerNode?.isValid && !this.inviteRewardPopupLayerNode.getComponent(InviteRewardPopupLayer)) {
            this.activatePopupParent(this.inviteRewardPopupLayerNode);
            this.inviteRewardPopupLayerNode.active = true;
        }

        const root = this.inviteRewardPopupLayerNode
            ? this.inviteRewardPopupLayerNode.getComponent(InviteRewardPopupLayer)
                ?? this.inviteRewardPopupLayerNode.addComponent(InviteRewardPopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] InviteRewardPopupLayer component not found');
        }
        return root;
    }

    private async getInviteRewardPopupLayerAsync(): Promise<InviteRewardPopupLayer | null> {
        this.resolveNodes();
        const parent = this.getPopupParentNode();
        if (!this.inviteRewardPopupLayerNode?.isValid) {
            this.inviteRewardPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(
                parent,
                'InviteRewardPopupLayer'
            ) ?? PopupPrefabLoader.findNodeByName(this.getCanvasNode(), 'InviteRewardPopupLayer');
        }
        return this.getInviteRewardPopupLayer();
    }

    private getRankChallengePopupLayer(): RankChallengePopupLayer | null {
        this.resolveNodes();
        const root = this.rankChallengePopupLayerNode
            ? this.rankChallengePopupLayerNode.getComponent(RankChallengePopupLayer)
                ?? this.rankChallengePopupLayerNode.addComponent(RankChallengePopupLayer)
            : null;
        if (!root) {
            console.warn('[GameView] RankChallengePopupLayer component not found');
        }
        return root;
    }

    private async getRankChallengePopupLayerAsync(): Promise<RankChallengePopupLayer | null> {
        this.resolveNodes();
        const canvas = this.getCanvasNode();
        if (!this.rankChallengePopupLayerNode?.isValid) {
            this.rankChallengePopupLayerNode = PopupPrefabLoader.findNodeByName(canvas, 'RankChallengePopupLayer');
        }
        return this.getRankChallengePopupLayer();
    }

    private findLastWeekRankingPopupNode(root: Node | null): Node | null {
        if (!root) {
            return null;
        }

        if (
            root.name === 'LastWeekRankingPopupLayer'
            && root.getChildByPath('PopupPanel/ContentNode')
            && !root.getChildByPath('PopupPanel/ResourcesPanel')
        ) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findLastWeekRankingPopupNode(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private showSettingsPopupLayerFallback() {
        this.resolveNodes();
        const layer = this.settingsPopupRootNode?.getChildByName('SettingsPopupLayer') ?? null;
        if (!layer?.isValid) {
            console.warn('[GameView] SettingsPopupLayer fallback node not found');
            return;
        }

        this.settingsPopupRootNode!.active = true;
        layer.active = true;
        layer.setSiblingIndex(this.settingsPopupRootNode!.children.length - 1);
        console.log('[GameView] SettingsPopupLayer fallback active:', layer.active);
    }

    private getPopupParentNode(): Node | null {
        this.resolveNodes();
        return this.activityPopupRootNode?.isValid
            ? this.activityPopupRootNode
            : this.getCanvasNode();
    }

    private activatePopupParent(node: Node | null | undefined) {
        let current = node?.parent ?? null;
        while (current) {
            current.active = true;
            current = current.parent;
        }
    }

    private bringNodeToFront(node: Node | null | undefined) {
        if (!node?.isValid || !node.parent?.isValid) {
            return;
        }

        node.setSiblingIndex(node.parent.children.length - 1);
    }

    private showLoadingIfBundleCold(bundleName: PopupBundleName): boolean {
        if (BundleResourceLoader.isBundleWarm(bundleName)) {
            return false;
        }

        Platform.showLoading('资源加载中...');
        return true;
    }

    private hideLoadingIfShown(loading: boolean) {
        if (loading) {
            Platform.hideLoading();
        }
    }

    private getCanvasNode(): Node | null {
        let current: Node | null = this.node;
        while (current?.parent) {
            if (current.parent.name === 'Canvas') {
                return current.parent;
            }
            current = current.parent;
        }

        return director.getScene()?.getChildByName('Canvas') ?? null;
    }
}
