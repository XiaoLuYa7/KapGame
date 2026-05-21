import { _decorator, Button, director, Label, Node, resources, Sprite, SpriteFrame, sys, UITransform } from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { dataManager } from '../core/DataManager';
import { TabBarComponent } from './TabBar';
import { GameView } from './GameView';
import { ChatView } from './ChatView';
import { ActivityPopupRoot } from './ActivityPopupRoot';
import { LastWeekRankingPopupLayer } from './LastWeekRankingPopupLayer';
import { WeekRankingPopupLayer } from './WeekRankingPopupLayer';
import { PopupPrefabLoader } from './PopupPrefabLoader';
import { SettingsPopupRoot } from './SettingsPopupRoot';

const { ccclass, property } = _decorator;
type HomeTabName = 'Game' | 'Chat';

@ccclass('HomeView')
export class HomeView extends BaseUI {
    static sceneName: string = SceneName.Home;
    private readonly startupPopupNames = [
        'SettingsPopupLayer',
        'PrivacyPolicyLayer',
        'UserAgreementLayer',
        'BindPhoneLayer',
        'RealNameLayer',
        'LevelRewardPopupLayer',
        'BountyTaskPopupLayer',
        'ChangeTaskPopupLayer',
        'DailyCheckInPopupLayer',
        'RewardPopupLayer',
        'RewardPoptoRoot',
        'LastWeekRankingPopupLayer',
        'WeekRankingPopupLayer',
        'BackPackPopupLayer',
        'FlipRewardPopupLayer',
        'RankingsPage'
    ];
    private readonly lastWeekRankingPopupShownStorageKey = 'kapgame_last_week_ranking_popup_shown';

    @property(Sprite)
    avatarSprite: Sprite | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(Label)
    rankLabel: Label | null = null;

    @property(Sprite)
    rankButtonIcon: Sprite | null = null;

    @property(Label)
    rankButtonLabel: Label | null = null;

    @property(Label)
    diamondLabel: Label | null = null;

    @property(Label)
    goldLabel: Label | null = null;

    @property(Node)
    headerContainer: Node | null = null;

    @property(Node)
    gameContainer: Node | null = null;

    @property(Node)
    chatContainer: Node | null = null;

    @property(Node)
    tabBarNode: Node | null = null;

    @property(Node)
    rankButtonNode: Node | null = null;

    @property(Node)
    dailyCheckInButtonNode: Node | null = null;

    @property(Node)
    bountyTaskButtonNode: Node | null = null;

    @property(Node)
    levelRewardButtonNode: Node | null = null;

    @property(Node)
    settingButtonNode: Node | null = null;

    @property
    defaultTab: HomeTabName = 'Game';

    private currentTab: HomeTabName = 'Game';
    private entering = false;
    private unsubscribeUserDataChange: (() => void) | null = null;
    private cachedGameView: GameView | null = null;
    private activityPopupRootNode: Node | null = null;
    private settingsPopupRootNode: Node | null = null;
    private weekRankingPopupLayerNode: Node | null = null;
    private lastWeekRankingPopupLayerNode: Node | null = null;
    private rankingPopupsPreloadPromise: Promise<void> | null = null;

    onInit() {
        super.onInit();
        this.currentTab = this.defaultTab;
        this.resolveNodes();
        this.hideStartupPopups();
        this.hidePopupRoots();
        this.logTabState('onInit:beforeApply');
        this.applyActiveTabVisibility(this.currentTab);
        this.logTabState('onInit:afterApply');
        this.bindHomeEntryEvents();
        this.scheduleOnce(this.rebindHomeEntryEvents, 0);
        void this.preloadRankingPopups();
        this.unsubscribeUserDataChange = dataManager.subscribeUserData(this.onUserDataChanged);
    }

    protected onCleanup() {
        this.unsubscribeUserDataChange?.();
        this.unsubscribeUserDataChange = null;
    }

    start() {
        super.start();
        this.onEnter();
    }

    async onEnter(data?: SceneData) {
        if (this.entering) {
            return;
        }

        this.entering = true;
        this.currentTab = this.normalizeTabName(data?.tab) || this.currentTab || this.defaultTab;
        console.log(`[HomeView] onEnter tab=${this.currentTab} dataTab=${data?.tab ?? ''}`);

        this.resolveNodes();
        this.hideStartupPopups();
        this.ensureChildViewComponents();
        this.bindHomeEntryEvents();
        this.scheduleOnce(this.rebindHomeEntryEvents, 0);
        await this.preloadRankingPopups();
        await this.setActiveTab(this.currentTab, true);
        this.updateUserInfo();
        const showedLastWeekRankingPopup = await this.tryShowLastWeekRankingPopupOnceThisWeek();
        if (!showedLastWeekRankingPopup) {
            void this.preloadActivityPopups();
        }
        this.entering = false;
    }

    onTabSwitch(tabName: string) {
        console.log(`[HomeView] onTabSwitch tab=${tabName}`);
        switch (tabName) {
            case 'Chat':
                void this.setActiveTab('Chat');
                break;
            case 'Battle':
            case 'Game':
            case 'Home':
            default:
                void this.setActiveTab('Game');
                break;
        }
    }

    onGameBarButtonClick() {
        console.log('[HomeView] onGameBarButtonClick');
        void this.setActiveTab('Game', true);
    }

    onChatBarButtonClick() {
        console.log('[HomeView] onChatBarButtonClick');
        void this.setActiveTab('Chat', true);
    }

    onSettingButtonClick() {
        console.log('[HomeView] onSettingButtonClick');
        void this.openSettingsPopupRoot();
    }

    onLevelRewardButtonClick() {
        console.log('[HomeView] onLevelRewardButtonClick');
        void this.showLevelRewardPopup();
    }

    onBountyTaskButtonClick() {
        console.log('[HomeView] onBountyTaskButtonClick');
        void this.showBountyTaskPopup();
    }

    onDailyCheckInButtonClick() {
        console.log('[HomeView] onDailyCheckInButtonClick');
        void this.showDailyCheckInPopup();
    }

    onRankButtonClick() {
        console.log('[HomeView] onRankButtonClick');
        const weeklyBattleGold = Number(dataManager.userData.weeklyBattleGold ?? 0);
        if (weeklyBattleGold <= 0) {
            void this.openLastWeekRankingPopup();
            return;
        }

        void this.openWeekRankingPopup();
    }

    onSettingsCloseButtonClick(event?: any) {
        this.findSettingsPopupRoot()?.onSettingsCloseButtonClick(event);
    }

    onPrivacyPolicyClick() {
        this.findSettingsPopupRoot()?.onPrivacyPolicyClick();
    }

    onUserAgreementClick() {
        this.findSettingsPopupRoot()?.onUserAgreementClick();
    }

    onPhoneNodeClick() {
        this.findSettingsPopupRoot()?.onPhoneNodeClick();
    }

    onBindPhoneCloseButtonClick() {
        this.findSettingsPopupRoot()?.onBindPhoneCloseButtonClick();
    }

    onRealNameNodeClick() {
        this.findSettingsPopupRoot()?.onRealNameNodeClick();
    }

    onRealNameCloseButtonClick() {
        this.findSettingsPopupRoot()?.onRealNameCloseButtonClick();
    }

    onPhoneInputChanged() {
        this.findSettingsPopupRoot()?.onPhoneInputChanged();
    }

    onCodeInputChanged() {
        this.findSettingsPopupRoot()?.onCodeInputChanged();
    }

    onSendCodeButtonClick() {
        this.findSettingsPopupRoot()?.onSendCodeButtonClick();
    }

    onSavePhoneButtonClick() {
        void this.findSettingsPopupRoot()?.onSavePhoneButtonClick();
    }

    onRealNameInputChanged() {
        this.findSettingsPopupRoot()?.onRealNameInputChanged();
    }

    onIdCardInputChanged() {
        this.findSettingsPopupRoot()?.onIdCardInputChanged();
    }

    onSaveRealNameButtonClick() {
        void this.findSettingsPopupRoot()?.onSaveRealNameButtonClick();
    }

    onSoundEffectsToggleChanged() {
        this.findSettingsPopupRoot()?.onSoundEffectsToggleChanged();
    }

    onMusicToggleChanged() {
        this.findSettingsPopupRoot()?.onMusicToggleChanged();
    }

    onVibrationToggleChanged() {
        this.findSettingsPopupRoot()?.onVibrationToggleChanged();
    }

    async setActiveTab(tabName: HomeTabName, syncTabBar: boolean = true) {
        console.log(`[HomeView] setActiveTab tab=${tabName} syncTabBar=${syncTabBar}`);
        this.currentTab = tabName;
        this.resolveNodes();
        this.ensureChildViewComponents();
        this.applyActiveTabVisibility(tabName);
        this.logTabState(`setActiveTab:${tabName}`);

        if (syncTabBar) {
            const tabBar = this.ensureTabBarComponent();
            tabBar?.setCurrentTab(this.getTabIndex(tabName), false);
        }

        this.updateUserInfo();
    }

    onLogout() {
        dataManager.logout();
        SceneManager.goToLoading();
    }

    updateUserInfo() {
        this.resolveNodes();

        const userData = dataManager.userData;
        if (this.levelLabel) {
            this.levelLabel.string = String(userData.level || 1);
        }
        if (this.rankLabel) {
            this.rankLabel.string = userData.rank || '';
        }
        if (this.rankButtonLabel) {
            this.rankButtonLabel.string = userData.rankName || userData.rank || '';
        }
        this.setResourceSprite(this.rankButtonIcon, userData.rankIcon);
        if (this.diamondLabel) {
            this.diamondLabel.string = String(userData.diamond ?? 0);
        }
        if (this.goldLabel) {
            this.goldLabel.string = String(userData.gold ?? 0);
        }
    }

    private onUserDataChanged = () => {
        this.updateUserInfo();
    };

    private applyActiveTabVisibility(tabName: HomeTabName) {
        const showHeader = tabName !== 'Chat';
        this.setNodeVisible(this.headerContainer, showHeader);
        this.setNodeVisible(this.gameContainer, tabName === 'Game');
        this.setNodeVisible(this.chatContainer, tabName === 'Chat');
        this.setNodeVisible(this.tabBarNode, true);
    }

    private resolveNodes() {
        this.headerContainer = this.resolveHomeChildNode('HeaderContainer');
        this.gameContainer = this.resolveHomeChildNode('GameContainer');
        this.chatContainer = this.resolveHomeChildNode('ChatContainer');
        this.tabBarNode = this.resolveHomeChildNode('TabBarContainer');

        this.avatarSprite ??= this.findComponentByPaths([
            'HeaderContainer/AvatarNode/Mask/Avatar',
            'Avatar'
        ], Sprite);
        this.levelLabel ??= this.findComponentByPaths([
            'HeaderContainer/AvatarNode/LevelSprite/LevelLabel',
            'AvatarNode/LevelSprite/LevelLabel',
            'LevelSprite/LevelLabel'
        ], Label);
        this.rankLabel ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/UserInfoPanel/RankLabel',
            'HeaderContainer/UserInfoPanel/RankLabel',
            'RankLabel'
        ], Label);
        this.rankButtonIcon ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/RankButton/RankIcon',
            'HeaderContainer/UserResPanel/UserInfoPanel/RankButton/RankIcon',
            'HeaderContainer/RankButton/RankIcon',
            'RankButton/RankIcon'
        ], Sprite);
        this.rankButtonLabel ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/RankButton/RankLabel',
            'HeaderContainer/UserResPanel/UserInfoPanel/RankButton/RankLabel',
            'HeaderContainer/RankButton/RankLabel',
            'RankButton/RankLabel'
        ], Label);
        this.diamondLabel ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel',
            'HeaderContainer/ResourcesPanel/DiamondPanel/DiamondLabel',
            'DiamondLabel'
        ], Label);
        this.goldLabel ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel',
            'HeaderContainer/ResourcesPanel/GoldPanel/GoldLabel',
            'GoldPanel/GoldLabel',
            'HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/DiamondLabel',
            'HeaderContainer/ResourcesPanel/GoldPanel/DiamondLabel',
            'GoldPanel/DiamondLabel'
        ], Label);
    }

    private ensureChildViewComponents() {
        if (this.gameContainer && !this.gameContainer.getComponent(GameView)) {
            this.gameContainer.addComponent(GameView);
        }
        if (this.chatContainer && !this.chatContainer.getComponent(ChatView)) {
            this.chatContainer.addComponent(ChatView);
        }
    }

    private ensureTabBarComponent(): TabBarComponent | null {
        if (!this.tabBarNode) {
            return null;
        }

        return this.tabBarNode.getComponent(TabBarComponent) ?? this.tabBarNode.addComponent(TabBarComponent);
    }

    private bindHomeEntryEvents() {
        const homeRoot = this.getHomeRootNodeForContainers() ?? this.node;
        this.bindHomeEntryButton(this.rankButtonNode, [
            'HeaderContainer/UserResPanel/UserInfoPanel/RankButton',
            'HeaderContainer/UserResPanel/RankButton',
            'HeaderContainer/RankButton',
            'RankButton'
        ], this.onRankButtonClick, 'RankButton', homeRoot);
        this.bindHomeEntryButton(this.dailyCheckInButtonNode, [
            'GameContainer/ActivityPanel/NodeActivityItem-001',
            'ActivityPanel/NodeActivityItem-001',
            'NodeActivityItem-001'
        ], this.onDailyCheckInButtonClick, 'DailyCheckInButton', homeRoot);
        this.bindHomeEntryButton(this.bountyTaskButtonNode, [
            'GameContainer/ActivityPanel/NodeActivityItem-002',
            'ActivityPanel/NodeActivityItem-002',
            'NodeActivityItem-002'
        ], this.onBountyTaskButtonClick, 'BountyTaskButton', homeRoot);
        this.bindHomeEntryButton(this.levelRewardButtonNode, [
            'GameContainer/ActivityPanel/NodeActivityItem-003',
            'ActivityPanel/NodeActivityItem-003',
            'NodeActivityItem-003'
        ], this.onLevelRewardButtonClick, 'LevelRewardButton', homeRoot);
        this.bindHomeEntryButton(this.settingButtonNode, [
            'GameContainer/SettingButton',
            'GameContainer/SettingsPanel/SettingButton',
            'GameContainer/SettingPanel/SettingButton',
            'SettingButton'
        ], this.onSettingButtonClick, 'SettingButton', homeRoot);
    }

    private rebindHomeEntryEvents = () => {
        this.resolveNodes();
        this.bindHomeEntryEvents();
    };

    private bindHomeEntryButton(
        assignedNode: Node | null,
        paths: string[],
        handler: () => void,
        debugName: string,
        root: Node
    ) {
        const nodes = this.resolveEntryButtonNodes(assignedNode, paths, root);
        if (nodes.length === 0) {
            console.warn(`[HomeView] bind entry failed: ${debugName} not found`);
            return;
        }

        for (const buttonNode of nodes) {
            this.bindHomeEntryButtonNode(buttonNode, handler, debugName, assignedNode?.isValid ? 'property' : 'path');
            const visualNode = buttonNode.getChildByName('ActivityBackGround');
            if (visualNode?.isValid) {
                this.bindHomeEntryButtonNode(visualNode, handler, `${debugName}/ActivityBackGround`, 'child');
            }
        }
    }

    private bindHomeEntryButtonNode(buttonNode: Node, handler: () => void, debugName: string, source: string) {
        const button = buttonNode.getComponent(Button);
        if (button) {
            button.clickEvents = [];
            button.interactable = true;
        }

        buttonNode.targetOff(this);
        let lastTriggerAt = 0;
        const wrappedHandler = () => {
            const now = Date.now();
            if (now - lastTriggerAt < 80) {
                return;
            }
            lastTriggerAt = now;
            handler.call(this);
        };
        buttonNode.on(Node.EventType.TOUCH_END, wrappedHandler, this);
        if (button) {
            buttonNode.on(Button.EventType.CLICK, wrappedHandler, this);
        }
        console.log(`[HomeView] bind entry success: ${debugName} -> ${buttonNode.name} (${source})`);
    }

    private resolveEntryButtonNodes(assignedNode: Node | null, paths: string[], root: Node): Node[] {
        const nodes: Node[] = [];
        const addNode = (node: Node | null | undefined) => {
            if (node?.isValid && !nodes.includes(node)) {
                nodes.push(node);
            }
        };

        addNode(assignedNode);
        for (const path of paths) {
            addNode(root.getChildByPath(path));
        }

        const fallbackName = paths[paths.length - 1];
        this.collectNodesByName(root, fallbackName, nodes);
        return nodes;
    }

    private collectNodesByName(root: Node | null, name: string, nodes: Node[]) {
        if (!root?.isValid || !name) {
            return;
        }

        if (root.name === name && !nodes.includes(root)) {
            nodes.push(root);
        }

        for (const child of root.children) {
            this.collectNodesByName(child, name, nodes);
        }
    }

    private setNodeVisible(node: Node | null, visible: boolean) {
        if (node?.isValid) {
            node.active = visible;
            return;
        }

        console.warn(`[HomeView] setNodeVisible skipped visible=${visible}, node invalid`);
    }

    private resolveHomeChildNode(nodeName: string): Node | null {
        const homeRoot = this.getHomeRootNodeForContainers();
        const node = homeRoot?.getChildByName(nodeName) ?? null;
        if (!node) {
            console.warn(`[HomeView] resolve home child failed: ${nodeName}`);
        }
        return node;
    }

    private getHomeRootNodeForContainers(): Node | null {
        if (this.node.getChildByName('HeaderContainer') || this.node.getChildByName('GameContainer')) {
            return this.node;
        }

        return this.node.getChildByName('Home') ?? null;
    }

    private findGameView(): GameView | null {
        const view = (this.cachedGameView as any)?.node?.isValid
            ? this.cachedGameView
            : this.findGameViewFromGameContainer();
        this.cachedGameView = view;
        if (!view) {
            console.warn('[HomeView] GameView not found');
        }
        return view;
    }

    private findGameViewFromGameContainer(): GameView | null {
        const gameContainer = this.getHomeRootNodeForContainers()?.getChildByName('GameContainer');
        if (gameContainer) {
            return gameContainer.getComponent(GameView) ?? gameContainer.addComponent(GameView);
        }

        return this.node.getComponentInChildren(GameView);
    }

    private findSettingsPopupRoot(): SettingsPopupRoot | null {
        const canvas = this.getCanvasNode();
        const rootNode = canvas?.getChildByName('SettingsPopupRoot') ?? canvas?.getChildByName('SettinsPopupRoot') ?? null;
        const view = rootNode
            ? rootNode.getComponent(SettingsPopupRoot) ?? rootNode.addComponent(SettingsPopupRoot)
            : null;
        if (!view) {
            console.warn('[HomeView] SettingsPopupRoot not found');
        }
        return view;
    }

    private async openSettingsPopupRoot() {
        const root = await this.getSettingsPopupRootAsync();
        if (!root) {
            console.warn('[HomeView] openSettingsPopupRoot failed');
            return;
        }

        this.activatePopupNode(root.node);
        root.showSettingsPopup();
    }

    private async showLevelRewardPopup() {
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            console.warn('[HomeView] showLevelRewardPopup failed');
            return;
        }

        this.activatePopupNode(root.node);
        await root.showLevelRewardPopup();
    }

    private async preloadActivityPopups() {
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            console.warn('[HomeView] preloadActivityPopups failed');
            return;
        }

        await root.preloadActivityPopups();
    }

    private async preloadRankingPopups() {
        if (this.rankingPopupsPreloadPromise) {
            await this.rankingPopupsPreloadPromise;
            return;
        }

        const preloadPromise = this.doPreloadRankingPopups();
        this.rankingPopupsPreloadPromise = preloadPromise;
        try {
            await preloadPromise;
        } finally {
            if (this.rankingPopupsPreloadPromise === preloadPromise) {
                this.rankingPopupsPreloadPromise = null;
            }
        }
    }

    private async doPreloadRankingPopups() {
        const [weekPopup, lastWeekPopup] = await Promise.all([
            this.getWeekRankingPopupLayerAsync(false),
            this.getLastWeekRankingPopupLayer(false)
        ]);
        this.hideRankingPopupNode(weekPopup?.node);
        this.hideRankingPopupNode(lastWeekPopup?.node);
        void PopupPrefabLoader.preloadPopup('WeekRankingPopupLayer');
        void PopupPrefabLoader.preloadPopup('LastWeekRankingPopupLayer');
        await Promise.all([
            weekPopup?.preload() ?? Promise.resolve(),
            lastWeekPopup?.preload() ?? Promise.resolve()
        ]);
        this.hideRankingPopupNode(weekPopup?.node);
        this.hideRankingPopupNode(lastWeekPopup?.node);
    }

    private async showBountyTaskPopup() {
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            console.warn('[HomeView] showBountyTaskPopup failed');
            return;
        }

        this.activatePopupNode(root.node);
        await root.showBountyTaskPopup();
    }

    private async showDailyCheckInPopup() {
        const root = await this.getActivityPopupRootAsync();
        if (!root) {
            console.warn('[HomeView] showDailyCheckInPopup failed');
            return;
        }

        this.activatePopupNode(root.node);
        await root.showDailyCheckInPopup();
    }

    private async openWeekRankingPopup() {
        const popup = await this.getWeekRankingPopupLayerAsync(false);
        if (!popup) {
            console.warn('[HomeView] openWeekRankingPopup failed');
            return;
        }

        await popup.open();
        this.activatePopupNode(popup.node);
    }

    private async openLastWeekRankingPopup() {
        const popup = await this.getLastWeekRankingPopupLayer(false);
        if (!popup) {
            console.warn('[HomeView] openLastWeekRankingPopup failed');
            return;
        }

        await popup.open();
        this.activatePopupNode(popup.node);
    }

    private async getSettingsPopupRootAsync(): Promise<SettingsPopupRoot | null> {
        const canvas = this.getHomeCanvasNode();
        this.settingsPopupRootNode = this.settingsPopupRootNode?.isValid
            ? this.settingsPopupRootNode
            : this.findNodeByPaths(['SettingsPopupRoot', 'SettinsPopupRoot'], canvas);

        if (!this.settingsPopupRootNode?.isValid) {
            this.settingsPopupRootNode = await PopupPrefabLoader.ensurePopupNode(canvas, 'SettinsPopupRoot');
        }

        this.activatePopupNode(this.settingsPopupRootNode);
        return this.settingsPopupRootNode
            ? this.settingsPopupRootNode.getComponent(SettingsPopupRoot) ?? this.settingsPopupRootNode.addComponent(SettingsPopupRoot)
            : null;
    }

    private async getActivityPopupRootAsync(activate = true): Promise<ActivityPopupRoot | null> {
        const canvas = this.getHomeCanvasNode();
        this.activityPopupRootNode = this.activityPopupRootNode?.isValid
            ? this.activityPopupRootNode
            : this.findNodeByPaths(['PopupRoot'], canvas);

        if (!this.activityPopupRootNode?.isValid && canvas?.isValid) {
            this.activityPopupRootNode = new Node('PopupRoot');
            canvas.addChild(this.activityPopupRootNode);
        }

        if (activate) {
            this.activatePopupNode(this.activityPopupRootNode);
        }
        return this.activityPopupRootNode
            ? this.activityPopupRootNode.getComponent(ActivityPopupRoot) ?? this.activityPopupRootNode.addComponent(ActivityPopupRoot)
            : null;
    }

    private async getWeekRankingPopupLayerAsync(activate = true): Promise<WeekRankingPopupLayer | null> {
        const parent = await this.getPopupParentNodeAsync(activate);
        this.weekRankingPopupLayerNode = this.weekRankingPopupLayerNode?.isValid
            ? this.weekRankingPopupLayerNode
            : this.findNodeByPaths(['WeekRankingPopupLayer'], parent);

        if (!this.weekRankingPopupLayerNode?.isValid) {
            this.weekRankingPopupLayerNode = await PopupPrefabLoader.ensurePopupNode(parent, 'WeekRankingPopupLayer');
        }

        if (activate) {
            this.activatePopupNode(this.weekRankingPopupLayerNode);
        } else {
            this.hideRankingPopupNode(this.weekRankingPopupLayerNode);
        }
        return this.weekRankingPopupLayerNode
            ? this.weekRankingPopupLayerNode.getComponent(WeekRankingPopupLayer) ?? this.weekRankingPopupLayerNode.addComponent(WeekRankingPopupLayer)
            : null;
    }

    private async getPopupParentNodeAsync(activate = true): Promise<Node | null> {
        const root = await this.getActivityPopupRootAsync(activate);
        return root?.node ?? this.getHomeCanvasNode();
    }

    private activatePopupNode(node: Node | null | undefined) {
        if (!node?.isValid) {
            return;
        }

        let current: Node | null = node;
        while (current) {
            current.active = true;
            current = current.parent;
        }

        if (node.parent?.isValid) {
            node.setSiblingIndex(node.parent.children.length - 1);
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

    private logTabState(stage: string) {
        console.log(
            `[HomeView] ${stage} currentTab=${this.currentTab} `
            + `header=${this.headerContainer?.isValid ? this.headerContainer.active : 'missing'} `
            + `game=${this.gameContainer?.isValid ? this.gameContainer.active : 'missing'} `
            + `chat=${this.chatContainer?.isValid ? this.chatContainer.active : 'missing'} `
            + `tabBar=${this.tabBarNode?.isValid ? this.tabBarNode.active : 'missing'}`
        );
    }

    private getTabIndex(tabName: HomeTabName): number {
        switch (tabName) {
            case 'Chat':
                return 1;
            case 'Game':
            default:
                return 0;
        }
    }

    private normalizeTabName(tabName: any): HomeTabName | null {
        return tabName === 'Chat' ? 'Chat' : tabName === 'Game' || tabName === 'Home' || tabName === 'Battle' ? 'Game' : null;
    }

    private hideStartupPopups() {
        const canvas = this.getHomeCanvasNode();
        for (const popupName of this.startupPopupNames) {
            const popupNode = this.findNodeByPaths([popupName], canvas);
            if (popupNode?.isValid) {
                popupNode.active = false;
            }
        }
    }

    private hidePopupRoots() {
        const canvas = this.getHomeCanvasNode();
        for (const rootName of ['PopupRoot', 'SettinsPopupRoot', 'SettingsPopupRoot', 'RewardPoptoRoot']) {
            const root = this.findNodeByPaths([rootName], canvas);
            if (root?.isValid) {
                root.active = false;
            }
        }
    }

    private async tryShowLastWeekRankingPopupOnceThisWeek(): Promise<boolean> {
        if (!dataManager.isLoggedIn) {
            return false;
        }

        const storageKey = this.getLastWeekRankingPopupShownKey();
        if (sys.localStorage.getItem(storageKey) === '1') {
            return false;
        }

        const popup = await this.getLastWeekRankingPopupLayer(false);
        if (!popup) {
            return false;
        }

        sys.localStorage.setItem(storageKey, '1');
        popup.onClosedOnce(() => {
            this.scheduleOnce(() => {
                void this.preloadActivityPopups();
            }, 0);
        });
        this.scheduleOnce(() => {
            void popup.openAsWeeklyFirstLoginPopup().then(() => {
                this.activatePopupNode(popup.node);
            });
        }, 0);
        return true;
    }

    private async getLastWeekRankingPopupLayer(activate = true): Promise<LastWeekRankingPopupLayer | null> {
        const canvas = this.getHomeCanvasNode();
        let popupNode = this.findLastWeekRankingPopupNode(canvas);
        if (!popupNode?.isValid) {
            popupNode = await PopupPrefabLoader.ensurePopupNode(this.getPopupParentNode(activate), 'LastWeekRankingPopupLayer');
        }
        if (activate) {
            this.activatePopupNode(popupNode);
        } else {
            this.hideRankingPopupNode(popupNode);
        }
        return popupNode
            ? popupNode.getComponent(LastWeekRankingPopupLayer) ?? popupNode.addComponent(LastWeekRankingPopupLayer)
            : null;
    }

    private hideRankingPopupNode(node: Node | null | undefined) {
        if (node?.isValid) {
            node.active = false;
        }
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

    private getLastWeekRankingPopupShownKey() {
        const userId = dataManager.userData.userId || 'guest';
        return `${this.lastWeekRankingPopupShownStorageKey}_${userId}_${this.getWeekStartKey()}`;
    }

    private getWeekStartKey() {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        const month = monday.getMonth() + 1;
        const date = monday.getDate();
        return `${monday.getFullYear()}-${month < 10 ? `0${month}` : month}-${date < 10 ? `0${date}` : date}`;
    }

    private getHomeCanvasNode(): Node | null {
        let current: Node | null = this.node;
        while (current?.parent) {
            if (current.parent.name === 'Canvas') {
                return current.parent;
            }
            current = current.parent;
        }

        return this.node;
    }

    private getPopupParentNode(activate = true): Node | null {
        const canvas = this.getHomeCanvasNode();
        const root = this.findNodeByPaths(['PopupRoot'], canvas);
        if (activate) {
            this.activatePopupNode(root);
        }
        return root ?? canvas;
    }

    private setResourceSprite(sprite: Sprite | null | undefined, path: string) {
        if (!sprite || !path) {
            return;
        }

        const transform = sprite.getComponent(UITransform);
        const width = transform?.width ?? 0;
        const height = transform?.height ?? 0;

        this.loadFirstAvailableSpriteFrame(this.getSpriteCandidatePaths(path), (frame) => {
            if (!sprite.isValid) {
                return;
            }

            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = frame;
            if (transform?.isValid && width > 0 && height > 0) {
                transform.setContentSize(width, height);
            }
        });
    }

    private loadFirstAvailableSpriteFrame(paths: string[], onLoaded: (spriteFrame: SpriteFrame) => void) {
        const loadAt = (index: number) => {
            const path = paths[index];
            if (!path) {
                return;
            }

            resources.load(this.toSpriteFramePath(path), SpriteFrame, (error, frame) => {
                if (error || !frame) {
                    loadAt(index + 1);
                    return;
                }
                onLoaded(frame);
            });
        };

        loadAt(0);
    }

    private getSpriteCandidatePaths(path: string) {
        const cleanPath = this.cleanResourcePath(path);
        if (cleanPath.startsWith('rank/')) {
            return [`tool/${cleanPath}`, cleanPath];
        }
        return [cleanPath];
    }

    private toSpriteFramePath(path: string) {
        const cleanPath = this.cleanResourcePath(path);
        return `${cleanPath}/spriteFrame`;
    }

    private cleanResourcePath(path: string) {
        return path
            .replace(/^resources\//, '')
            .replace(/\.(png|jpg|jpeg|webp)$/i, '')
            .replace(/\/spriteFrame$/, '')
            .replace(/^\/|\/$/g, '');
    }
}
