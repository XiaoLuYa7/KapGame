import { _decorator, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { dataManager } from '../core/DataManager';
import { TabBarComponent } from './TabBar';
import { GameView } from './GameView';
import { ChatView } from './ChatView';

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
        'LastWeekRankingPopupLayer'
    ];

    @property(Label)
    usernameLabel: Label | null = null;

    @property(Sprite)
    avatarSprite: Sprite | null = null;

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

    @property
    defaultTab: HomeTabName = 'Game';

    private currentTab: HomeTabName = 'Game';
    private entering = false;

    onInit() {
        super.onInit();
        this.currentTab = this.defaultTab;
        this.resolveNodes();
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

        this.resolveNodes();
        this.hideStartupPopups();
        this.ensureChildViewComponents();
        await this.setActiveTab(this.currentTab, true);
        this.updateUserInfo();
        this.entering = false;
    }

    onTabSwitch(tabName: string) {
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

    async setActiveTab(tabName: HomeTabName, syncTabBar: boolean = true) {
        this.currentTab = tabName;
        this.resolveNodes();
        this.ensureChildViewComponents();

        const showHeader = tabName !== 'Chat';
        this.setNodeVisible(this.headerContainer, showHeader);
        this.setNodeVisible(this.gameContainer, tabName === 'Game');
        this.setNodeVisible(this.chatContainer, tabName === 'Chat');
        this.setNodeVisible(this.tabBarNode, true);

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
        if (this.usernameLabel) {
            this.usernameLabel.string = userData.username || 'Guest';
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

    private resolveNodes() {
        this.headerContainer ??= this.findNodeByPaths(['HeaderContainer'], this.node);
        this.gameContainer ??= this.findNodeByPaths(['GameContainer'], this.node);
        this.chatContainer ??= this.findNodeByPaths(['ChatContainer'], this.node);
        this.tabBarNode ??= this.findNodeByPaths(['TabBarContainer'], this.node);

        this.usernameLabel ??= this.findComponentByPaths([
            'HeaderContainer/UserResPanel/UserInfoPanel/UsernameLabel',
            'HeaderContainer/UserInfoPanel/UsernameLabel',
            'UsernameLabel'
        ], Label);
        this.avatarSprite ??= this.findComponentByPaths([
            'HeaderContainer/AvatarNode/Mask/Avatar',
            'Avatar'
        ], Sprite);
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

    private setNodeVisible(node: Node | null, visible: boolean) {
        if (node?.isValid) {
            node.active = visible;
        }
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

    private setResourceSprite(sprite: Sprite | null | undefined, path: string) {
        if (!sprite || !path) {
            return;
        }

        const transform = sprite.getComponent(UITransform);
        const width = transform?.width ?? 0;
        const height = transform?.height ?? 0;

        resources.load(this.toSpriteFramePath(path), SpriteFrame, (error, frame) => {
            if (error || !frame || !sprite.isValid) {
                return;
            }

            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = frame;
            if (transform?.isValid && width > 0 && height > 0) {
                transform.setContentSize(width, height);
            }
        });
    }

    private toSpriteFramePath(path: string) {
        const cleanPath = path
            .replace(/^resources\//, '')
            .replace(/\.(png|jpg|jpeg|webp)$/i, '')
            .replace(/\/spriteFrame$/, '')
            .replace(/^\/|\/$/g, '');
        return `${cleanPath}/spriteFrame`;
    }
}
