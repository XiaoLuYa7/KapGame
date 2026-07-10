import { _decorator, Button, Color, Component, instantiate, Label, Layout, Node, resources, ScrollView, Sprite, SpriteFrame, UITransform } from 'cc';
import { dataManager } from '../core/DataManager';
import { PopupStack } from './PopupStack';

const { ccclass, property } = _decorator;

type RankingsTab = 'charm' | 'rank' | 'gold' | 'record';
type RankingsScope = 'world' | 'friend';
type RankingsWeek = 'week' | 'lastWeek';
const DROPDOWN_MENU_PRIORITY = 1000;
const DROPDOWN_MENU_UP_SPRITE = 'image/rankings/rankings_menu_up_tag';
const DROPDOWN_MENU_DOWN_SPRITE = 'image/rankings/rankings_menu_down_tag';

interface DropdownMenuPlacement {
    parent: Node;
    siblingIndex: number;
}

interface RankingUser {
    rank: number;
    name: string;
    charm: number;
    gold: number;
    victory: number;
    rankCode: string;
    rankName: string;
    rankIcon: string;
    avatar: string;
}

interface RankingsPanelConfig {
    tab: RankingsTab;
    node: Node;
    valuePath: string;
    valueFormatter: (user: RankingUser) => string;
}

@ccclass('RankingsPage')
export class RankingsPage extends Component {
    @property(Node)
    topTabs: Node | null = null;

    @property(Node)
    charmRankingsNode: Node | null = null;

    @property(Node)
    listRankingsNode: Node | null = null;

    @property(Node)
    goldRankingsNode: Node | null = null;

    @property(Node)
    recordRankingsNode: Node | null = null;

    private initialized = false;
    private currentTab: RankingsTab = 'charm';
    private readonly selectedColor = this.makeColor('#6C0AFF');
    private readonly unselectedColor = this.makeColor('#FFFFFF');
    private readonly spriteFrameCache = new Map<string, SpriteFrame>();
    private readonly dropdownMenuPlacements = new WeakMap<Node, DropdownMenuPlacement>();
    private initializePromise: Promise<void> | null = null;

    start() {
        void this.initialize();
    }

    async initialize() {
        if (this.initialized) {
            this.applyCurrentState();
            return;
        }
        if (this.initializePromise) {
            await this.initializePromise;
            return;
        }

        const initializePromise = this.doInitialize();
        this.initializePromise = initializePromise;
        try {
            await initializePromise;
        } finally {
            if (this.initializePromise === initializePromise) {
                this.initializePromise = null;
            }
        }
    }

    preload() {
        return this.initialize();
    }

    private async doInitialize() {
        if (this.initialized) {
            this.applyCurrentState();
            return;
        }

        this.resolveNodes();
        await this.preloadStaticSpriteFrames();
        this.bindEvents();
        this.renderAllPanels();
        this.setActiveTab('charm');
        this.initialized = true;
        console.log('[RankingsPage] initialized');
    }

    async open() {
        await this.initialize();
        PopupStack.open(this.node, { hideSiblings: false });
    }

    close() {
        PopupStack.close(this.node);
    }

    private resolveNodes() {
        const contentNode = this.node.getChildByPath('ConentNode');
        this.topTabs = this.topTabs?.isValid ? this.topTabs : contentNode?.getChildByName('TopTabs') ?? null;
        this.charmRankingsNode = this.charmRankingsNode?.isValid ? this.charmRankingsNode : contentNode?.getChildByName('CharmRankingsNode') ?? null;
        this.listRankingsNode = this.listRankingsNode?.isValid ? this.listRankingsNode : contentNode?.getChildByName('ListRankingsNode') ?? null;
        this.goldRankingsNode = this.goldRankingsNode?.isValid ? this.goldRankingsNode : contentNode?.getChildByName('GoldRankingsNode') ?? null;
        this.recordRankingsNode = this.recordRankingsNode?.isValid ? this.recordRankingsNode : contentNode?.getChildByName('RecordRankingsNode') ?? null;
    }

    private async preloadStaticSpriteFrames() {
        await Promise.all([
            this.loadSpriteFrame('image/rankings/rankings_select_tab'),
            this.loadSpriteFrame('image/rankings/rankings_unselect_tab'),
            this.loadSpriteFrame(DROPDOWN_MENU_UP_SPRITE),
            this.loadSpriteFrame(DROPDOWN_MENU_DOWN_SPRITE),
            this.loadSpriteFrame('image/first_tag'),
            this.loadSpriteFrame('image/second_tag'),
            this.loadSpriteFrame('image/three_tag'),
            this.loadSpriteFrame('image/avatar'),
            this.loadSpriteFrame('image/rank/bronze'),
            this.loadSpriteFrame('image/rank/silver'),
            this.loadSpriteFrame('image/rank/gold'),
            this.loadSpriteFrame('image/rank/platinum'),
            this.loadSpriteFrame('image/rank/diamond'),
            this.loadSpriteFrame('image/rank/starshine'),
            this.loadSpriteFrame('image/rank/master'),
            this.loadSpriteFrame('image/rank/king')
        ]);
    }

    private bindEvents() {
        this.bindClick(this.node.getChildByPath('TitleNode/BackSprite'), () => this.close(), 'BackSprite');

        this.bindClick(this.topTabs?.getChildByName('CharmTab') ?? null, () => this.setActiveTab('charm'), 'CharmTab');
        this.bindClick(this.topTabs?.getChildByName('RankTab') ?? null, () => this.setActiveTab('rank'), 'RankTab');
        this.bindClick(this.topTabs?.getChildByName('GoldTab') ?? null, () => this.setActiveTab('gold'), 'GoldTab');
        this.bindClick(this.topTabs?.getChildByName('RecordTab') ?? null, () => this.setActiveTab('record'), 'RecordTab');

        for (const panel of this.getPanelConfigs()) {
            this.bindPanelWeekControls(panel.node);
            this.bindPanelDropdown(panel.node);
        }
    }

    private bindPanelWeekControls(panelNode: Node) {
        const weekNode = panelNode.getChildByPath('ControlsNode/WeekNode');
        const weekSelectNode = weekNode?.getChildByName('WeekSelectSprite') ?? null;
        const currWeekNode = weekNode?.getChildByName('CurrWeekNode') ?? null;
        const lastWeekSelectNode = weekNode?.getChildByName('LastWeekSelectSprite') ?? weekNode?.getChildByName('LastWeekNode') ?? null;

        this.bindClick(weekSelectNode, () => this.setPanelWeek(panelNode, 'week'), `${panelNode.name}/WeekSelectSprite`);
        this.bindClick(currWeekNode, () => this.setPanelWeek(panelNode, 'week'), `${panelNode.name}/CurrWeekNode`);
        this.bindClick(lastWeekSelectNode, () => this.setPanelWeek(panelNode, 'lastWeek'), `${panelNode.name}/LastWeekSelectSprite`);
        this.setPanelWeek(panelNode, 'week');
    }

    private bindPanelDropdown(panelNode: Node) {
        const dropdownNode = this.getPanelChild(panelNode, 'DropdownMenuNode');
        const menuListNode = this.getPanelChild(panelNode, 'MenuListNode');
        const worldNode = menuListNode?.getChildByName('WorldRankingsLabel') ?? null;
        const friendNode = menuListNode?.getChildByName('FriendRankingsLabel') ?? null;

        if (menuListNode) {
            this.applyDropdownMenuPriority(menuListNode);
            menuListNode.active = false;
            this.updateDropdownSprite(panelNode, false);
        }

        this.bindClick(dropdownNode ?? null, () => {
            if (menuListNode) {
                console.log(`[RankingsPage] ${panelNode.name}/DropdownMenuNode clicked, MenuListNode active before toggle: ${menuListNode.active}`);
                this.applyDropdownMenuPriority(menuListNode);
                if (menuListNode.active) {
                    this.hideDropdownMenu(panelNode, menuListNode);
                } else {
                    this.showDropdownMenu(panelNode, menuListNode);
                }
                console.log(`[RankingsPage] ${panelNode.name}/MenuListNode active after toggle: ${menuListNode.active}`);
            }
        }, `${panelNode.name}/DropdownMenuNode`);
        this.bindClick(worldNode, () => {
            console.log(`[RankingsPage] ${panelNode.name}/MenuListNode/WorldRankingsLabel clicked`);
            this.selectDropdownScope(panelNode, 'world');
        }, `${panelNode.name}/WorldRankingsLabel`);
        this.bindClick(friendNode, () => {
            console.log(`[RankingsPage] ${panelNode.name}/MenuListNode/FriendRankingsLabel clicked`);
            this.selectDropdownScope(panelNode, 'friend');
        }, `${panelNode.name}/FriendRankingsLabel`);
        this.selectDropdownScope(panelNode, 'world');
    }

    private setActiveTab(tab: RankingsTab) {
        this.currentTab = tab;
        const tabMap: Array<[RankingsTab, Node | null, Node | null]> = [
            ['charm', this.topTabs?.getChildByName('CharmTab') ?? null, this.charmRankingsNode],
            ['rank', this.topTabs?.getChildByName('RankTab') ?? null, this.listRankingsNode],
            ['gold', this.topTabs?.getChildByName('GoldTab') ?? null, this.goldRankingsNode],
            ['record', this.topTabs?.getChildByName('RecordTab') ?? null, this.recordRankingsNode]
        ];

        for (const [tabName, tabNode, panelNode] of tabMap) {
            const selected = tabName === tab;
            this.setNodeSprite(tabNode, selected ? 'image/rankings/rankings_select_tab' : 'image/rankings/rankings_unselect_tab');
            if (panelNode?.isValid) {
                panelNode.active = selected;
            }
        }

        console.log(`[RankingsPage] setActiveTab ${tab}`);
    }

    private setPanelWeek(panelNode: Node, week: RankingsWeek) {
        const weekSelectSprite = panelNode.getChildByPath('ControlsNode/WeekNode/WeekSelectSprite');
        const lastWeekSelectSprite = panelNode.getChildByPath('ControlsNode/WeekNode/LastWeekSelectSprite')
            ?? panelNode.getChildByPath('ControlsNode/WeekNode/LastWeekNode');
        const currWeekLabel = weekSelectSprite?.getChildByPath('CurrWeekLabel')?.getComponent(Label)
            ?? panelNode.getChildByPath('ControlsNode/WeekNode/CurrWeekNode/CurrWeekLabel')?.getComponent(Label)
            ?? null;
        const lastWeekLabel = lastWeekSelectSprite?.getChildByPath('LastWeekLabel')?.getComponent(Label)
            ?? panelNode.getChildByPath('ControlsNode/WeekNode/LastWeekNode/LastWeekLabel')?.getComponent(Label)
            ?? null;

        const isCurrentWeek = week === 'week';
        this.setSpriteEnabled(weekSelectSprite, isCurrentWeek);
        this.setSpriteEnabled(lastWeekSelectSprite, !isCurrentWeek);
        if (currWeekLabel) {
            currWeekLabel.color = isCurrentWeek ? this.selectedColor : this.unselectedColor;
        }
        if (lastWeekLabel) {
            lastWeekLabel.color = isCurrentWeek ? this.unselectedColor : this.selectedColor;
        }
    }

    private selectDropdownScope(panelNode: Node, scope: RankingsScope) {
        const menuListNode = this.getPanelChild(panelNode, 'MenuListNode');
        const dropdownLabel = this.getPanelChild(panelNode, 'DropdownMenuNode')?.getChildByName('Label')?.getComponent(Label) ?? null;
        const sourceLabelNode = menuListNode?.getChildByName(scope === 'world' ? 'WorldRankingsLabel' : 'FriendRankingsLabel') ?? null;
        const sourceLabel = sourceLabelNode?.getComponent(Label);

        if (dropdownLabel && sourceLabel) {
            dropdownLabel.string = sourceLabel.string;
            dropdownLabel.color = this.selectedColor;
        }
        if (menuListNode) {
            this.hideDropdownMenu(panelNode, menuListNode);
        }
    }

    private getPanelChild(panelNode: Node, childName: string) {
        return panelNode.getChildByPath(`ControlsNode/${childName}`) ?? panelNode.getChildByName(childName) ?? null;
    }

    private applyDropdownMenuPriority(menuListNode: Node) {
        this.setNodePriority(menuListNode, DROPDOWN_MENU_PRIORITY);
        for (const child of menuListNode.children) {
            this.setNodePriority(child, DROPDOWN_MENU_PRIORITY + 1);
        }
    }

    private setNodePriority(node: Node, priority: number) {
        const transform = node.getComponent(UITransform) as (UITransform & { priority?: number }) | null;
        if (transform) {
            transform.priority = priority;
        }
    }

    private showDropdownMenu(panelNode: Node, menuListNode: Node) {
        this.rememberDropdownMenuPlacement(menuListNode);
        if (menuListNode.parent !== panelNode) {
            menuListNode.setParent(panelNode, true);
        }
        menuListNode.setSiblingIndex(panelNode.children.length - 1);
        menuListNode.active = true;
        this.updateDropdownSprite(panelNode, true);
    }

    private hideDropdownMenu(panelNode: Node, menuListNode: Node) {
        menuListNode.active = false;
        this.updateDropdownSprite(panelNode, false);
        const placement = this.dropdownMenuPlacements.get(menuListNode);
        if (!placement?.parent?.isValid) {
            return;
        }

        if (menuListNode.parent !== placement.parent) {
            menuListNode.setParent(placement.parent, true);
        }
        const maxIndex = Math.max(0, placement.parent.children.length - 1);
        menuListNode.setSiblingIndex(Math.min(placement.siblingIndex, maxIndex));
    }

    private rememberDropdownMenuPlacement(menuListNode: Node) {
        if (this.dropdownMenuPlacements.has(menuListNode) || !menuListNode.parent) {
            return;
        }

        this.dropdownMenuPlacements.set(menuListNode, {
            parent: menuListNode.parent,
            siblingIndex: menuListNode.getSiblingIndex()
        });
    }

    private updateDropdownSprite(panelNode: Node, menuVisible: boolean) {
        const dropDownSpriteNode = this.getPanelChild(panelNode, 'DropdownMenuNode')?.getChildByName('DropDownSprite') ?? null;
        this.setNodeSprite(dropDownSpriteNode, menuVisible ? DROPDOWN_MENU_DOWN_SPRITE : DROPDOWN_MENU_UP_SPRITE);
    }

    private renderAllPanels() {
        for (const panel of this.getPanelConfigs()) {
            this.renderPanel(panel);
        }
    }

    private renderPanel(config: RankingsPanelConfig) {
        const content = config.node.getChildByPath('UserListPanel/UserListScrollView/view/content');
        const template = content?.getChildByName('UserItem') ?? null;
        if (!content || !template) {
            console.warn(`[RankingsPage] renderPanel failed: ${config.node.name} template missing`);
            return;
        }

        const users = this.createRankingUsers(config.tab);
        for (const child of [...content.children]) {
            if (child !== template) {
                child.destroy();
            }
        }

        template.active = false;
        for (const user of users) {
            const item = instantiate(template);
            item.name = `UserItem_${user.rank}`;
            item.active = true;
            content.addChild(item);
            this.renderRankingItem(item, user, config);
        }

        this.resizeScrollContent(content, config.node.getChildByPath('UserListPanel/UserListScrollView/view'));
        const scrollView = config.node.getChildByPath('UserListPanel/UserListScrollView')?.getComponent(ScrollView) ?? null;
        this.configureRigidScrollView(scrollView);
        scrollView?.scrollToTop(0);
        this.renderCurrentUser(config);
    }

    private configureRigidScrollView(scrollView: ScrollView | null) {
        if (!scrollView) {
            return;
        }

        scrollView.stopAutoScroll();
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.elastic = false;
        scrollView.bounceDuration = 0;
        scrollView.inertia = true;
        scrollView.horizontalScrollBar = null;
        scrollView.verticalScrollBar = null;
        scrollView.enabled = true;
    }

    private renderCurrentUser(config: RankingsPanelConfig) {
        const currentItem = config.node.getChildByPath('CurrentUserNode/CurrentUserItem');
        if (!currentItem) {
            return;
        }

        const currentUser = this.createCurrentUser(config.tab);
        this.renderRankingItem(currentItem, currentUser, config, currentUser.rank > 50);
    }

    private renderRankingItem(item: Node, user: RankingUser, config: RankingsPanelConfig, outOfRank = false) {
        this.renderRankNode(item, item.getChildByName('RankNode'), user.rank, outOfRank);
        this.setLabel(item.getChildByPath('DescNode/NameLabel'), user.name);
        this.setNodeSprite(item.getChildByPath('AvatarMask/Avatar'), user.avatar || 'image/avatar');

        if (config.tab === 'rank') {
            this.setLabel(item.getChildByPath('DescNode/RankInfoNode/NameLabel'), user.rankName);
            this.setLabel(item.getChildByPath('DescNode/RankInfoNode/CountLabel'), user.rankName);
            this.setNodeSprite(item.getChildByPath('DescNode/RankInfoNode/RankSprite'), user.rankIcon);
            return;
        }

        this.setLabel(item.getChildByPath(config.valuePath) ?? this.findFirstCountLabel(item.getChildByName('DescNode')), config.valueFormatter(user));
    }

    private renderRankNode(item: Node, rankNode: Node | null, rank: number, outOfRank: boolean) {
        const notListedNode = this.resolveNotListedNode(item, outOfRank);
        const rankSpriteNode = rankNode?.getChildByName('RankSprite') ?? null;
        const rankLabelNode = rankNode?.getChildByName('RankLabel') ?? null;
        const rankLabel = rankLabelNode?.getComponent(Label);

        if (!rankNode) {
            if (notListedNode) {
                notListedNode.active = outOfRank;
                this.setLabel(notListedNode.getChildByName('RankLabel'), '未上榜');
            }
            return;
        }

        if (outOfRank) {
            rankNode.active = false;
            if (notListedNode) {
                notListedNode.active = true;
                this.setLabel(notListedNode.getChildByName('RankLabel'), '未上榜');
            }
            return;
        }

        rankNode.active = true;
        if (notListedNode) {
            notListedNode.active = false;
        }

        if (rank <= 3) {
            if (rankSpriteNode) {
                rankSpriteNode.active = true;
                this.setNodeSprite(rankSpriteNode, rank === 1 ? 'image/first_tag' : rank === 2 ? 'image/second_tag' : 'image/three_tag');
            }
            if (rankLabelNode) {
                rankLabelNode.active = false;
            }
            return;
        }

        if (rankSpriteNode) {
            rankSpriteNode.active = false;
        }
        if (rankLabelNode) {
            rankLabelNode.active = true;
        }
        if (rankLabel) {
            rankLabel.string = String(rank);
        }
    }

    private resolveNotListedNode(item: Node, shouldCreate: boolean) {
        const existing = item.getChildByPath('RankNode/NotListedNode') ?? item.getChildByName('NotListedNode') ?? null;
        if (existing || !shouldCreate) {
            return existing;
        }

        const template = this.findFirstNodeByName(this.node, 'NotListedNode');
        if (!template) {
            return null;
        }

        const notListedNode = instantiate(template);
        notListedNode.name = 'NotListedNode';
        notListedNode.active = false;
        item.addChild(notListedNode);

        const avatarNode = item.getChildByName('AvatarMask') ?? item.getChildByName('Mask') ?? null;
        if (avatarNode) {
            notListedNode.setSiblingIndex(avatarNode.getSiblingIndex());
        }

        return notListedNode;
    }

    private findFirstNodeByName(root: Node | null, name: string): Node | null {
        if (!root?.isValid) {
            return null;
        }

        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const found = this.findFirstNodeByName(child, name);
            if (found) {
                return found;
            }
        }

        return null;
    }

    private resizeScrollContent(content: Node, view: Node | null) {
        const contentTransform = content.getComponent(UITransform);
        const viewHeight = view?.getComponent(UITransform)?.height ?? 0;
        const layout = content.getComponent(Layout);
        layout?.updateLayout();

        if (!contentTransform) {
            return;
        }

        let realHeight = 0;
        for (const child of content.children) {
            if (!child.active) {
                continue;
            }
            realHeight += child.getComponent(UITransform)?.height ?? 0;
        }

        const spacingY = layout?.spacingY ?? 0;
        const visibleCount = content.children.filter(child => child.active).length;
        realHeight += Math.max(0, visibleCount - 1) * spacingY + (layout?.paddingTop ?? 0) + (layout?.paddingBottom ?? 0);
        contentTransform.height = Math.max(realHeight, viewHeight);
        layout?.updateLayout();
    }

    private getPanelConfigs(): RankingsPanelConfig[] {
        const configs: RankingsPanelConfig[] = [];
        if (this.charmRankingsNode) {
            configs.push({
                tab: 'charm',
                node: this.charmRankingsNode,
                valuePath: 'DescNode/CharmCount/CountLabel',
                valueFormatter: user => String(user.charm)
            });
        }
        if (this.listRankingsNode) {
            configs.push({
                tab: 'rank',
                node: this.listRankingsNode,
                valuePath: 'DescNode/RankInfoNode/NameLabel',
                valueFormatter: user => user.rankName
            });
        }
        if (this.goldRankingsNode) {
            configs.push({
                tab: 'gold',
                node: this.goldRankingsNode,
                valuePath: 'DescNode/GoldCount/CountLabel',
                valueFormatter: user => String(user.gold)
            });
        }
        if (this.recordRankingsNode) {
            configs.push({
                tab: 'record',
                node: this.recordRankingsNode,
                valuePath: 'DescNode/VictoryCount/CountLabel',
                valueFormatter: user => String(user.victory)
            });
        }
        return configs;
    }

    private createRankingUsers(tab: RankingsTab): RankingUser[] {
        const currentUser = this.createCurrentUser(tab);
        const users = Array.from({ length: 50 }, (_, index) => {
            const rank = index + 1;
            return this.createVirtualUser(rank, tab);
        });

        if (currentUser.rank >= 1 && currentUser.rank <= 50) {
            users[currentUser.rank - 1] = currentUser;
        }

        return users;
    }

    private createCurrentUser(tab: RankingsTab): RankingUser {
        const userData = dataManager.userData;
        const rank = tab === 'gold' ? 58 : tab === 'rank' ? 17 : tab === 'record' ? 29 : 12;
        return {
            rank,
            name: userData.nickName || userData.username || '当前用户',
            charm: Math.max(1000, Math.floor((userData.gold ?? 0) / 4) + 6800),
            gold: Number(userData.gold ?? 0),
            victory: Math.max(1, Math.floor((userData.level ?? 1) * 1.8)),
            rankCode: userData.rankCode || 'GOLD',
            rankName: userData.rankName || userData.rank || '黄金',
            rankIcon: userData.rankIcon || 'image/rank/gold',
            avatar: 'image/avatar'
        };
    }

    private createVirtualUser(rank: number, tab: RankingsTab): RankingUser {
        const rankCodes = ['KING', 'MASTER', 'STARSHINE', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];
        const code = rankCodes[Math.min(rankCodes.length - 1, Math.floor((rank - 1) / 7))];
        const base = 51 - rank;
        return {
            rank,
            name: `${this.virtualName(rank)}${rank}`,
            charm: base * 530 + (tab === 'charm' ? 2000 : 700),
            gold: base * 720 + 1300,
            victory: base * 3 + 8,
            rankCode: code,
            rankName: this.getRankNameByCode(code),
            rankIcon: this.getRankIconByCode(code),
            avatar: 'image/avatar'
        };
    }

    private virtualName(rank: number) {
        const names = ['星河玩家', '金币猎手', '魅力达人', '段位骑士', '连胜高手', '快乐挑战者', '本地好友', '世界玩家'];
        return names[(rank - 1) % names.length];
    }

    private getRankNameByCode(code: string) {
        const map: Record<string, string> = {
            BRONZE: '青铜',
            SILVER: '白银',
            GOLD: '黄金',
            PLATINUM: '铂金',
            DIAMOND: '钻石',
            STARSHINE: '星耀',
            MASTER: '大师',
            KING: '王者'
        };
        return map[String(code).toUpperCase()] ?? '青铜';
    }

    private getRankIconByCode(code: string) {
        const value = String(code || 'BRONZE').toLowerCase();
        return `image/rank/${value}`;
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
        node.on(Node.EventType.TOUCH_END, wrappedHandler, this);
        if (button) {
            node.on(Button.EventType.CLICK, wrappedHandler, this);
        }
    }

    private setLabel(node: Node | null, value: string) {
        const label = node?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private setNodeSprite(node: Node | null, path: string) {
        const sprite = node?.getComponent(Sprite);
        if (!sprite) {
            return;
        }

        const spriteFrame = this.spriteFrameCache.get(path);
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
            return;
        }

        void this.loadSpriteFrame(path).then(frame => {
            if (frame && sprite.isValid) {
                sprite.spriteFrame = frame;
            }
        });
    }

    private findFirstCountLabel(root: Node | null): Node | null {
        if (!root?.isValid) {
            return null;
        }

        if (root.name === 'CountLabel' && root.getComponent(Label)) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findFirstCountLabel(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private setSpriteEnabled(node: Node | null, enabled: boolean) {
        const sprite = node?.getComponent(Sprite);
        if (sprite) {
            sprite.enabled = enabled;
        }
    }

    private async loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        const cached = this.spriteFrameCache.get(path);
        if (cached) {
            return cached;
        }

        return new Promise(resolve => {
            const spriteFramePath = path.endsWith('/spriteFrame') ? path : `${path}/spriteFrame`;
            resources.load(spriteFramePath, SpriteFrame, (error, spriteFrame) => {
                if (!error && spriteFrame) {
                    this.spriteFrameCache.set(path, spriteFrame);
                    resolve(spriteFrame);
                    return;
                }

                resources.load(path, SpriteFrame, (fallbackError, fallbackFrame) => {
                    if (fallbackError || !fallbackFrame) {
                        console.warn(`[RankingsPage] 加载图片失败: ${path}`, fallbackError || error);
                        resolve(null);
                        return;
                    }

                    this.spriteFrameCache.set(path, fallbackFrame);
                    resolve(fallbackFrame);
                });
            });
        });
    }

    private applyCurrentState() {
        this.resolveNodes();
        this.setActiveTab(this.currentTab);
    }

    private makeColor(hex: string) {
        const value = hex.replace('#', '');
        const r = parseInt(value.slice(0, 2), 16);
        const g = parseInt(value.slice(2, 4), 16);
        const b = parseInt(value.slice(4, 6), 16);
        return new Color(r, g, b, 255);
    }
}
