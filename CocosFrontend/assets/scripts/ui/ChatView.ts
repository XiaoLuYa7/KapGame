import {
    _decorator,
    Node,
    Label,
    Button,
    ScrollView,
    Color,
    Sprite,
    resources,
    Prefab,
    instantiate,
    Layout,
    UITransform,
    SpriteFrame,
    assetManager,
    ImageAsset,
    Texture2D
} from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { Platform } from '../utils/Platform';
import { Http } from '../network/Http';
import { dataManager } from '../core/DataManager';

const { ccclass, property } = _decorator;

type ChatTab = 'messages' | 'friends' | 'recent';

interface ChatUserItem {
    id: number | string;
    name: string;
    avatar?: string;
    avatarUrl?: string;
    content?: string;
    time?: string;
    rank?: string;
    rankIcon?: string;
    charmIcon?: string;
    unread?: number;
    status?: string;
}

@ccclass('ChatView')
export class ChatView extends BaseUI {
    static sceneName: string = 'Chat';
    private static ignoredNoticeSessionId: number | null = null;

    @property
    currentTab: ChatTab = 'messages';

    @property(Button)
    messageTabBtn: Button | null = null;

    @property(Button)
    friendTabBtn: Button | null = null;

    @property(Button)
    recentTabBtn: Button | null = null;

    @property(Label)
    messageTabLabel: Label | null = null;

    @property(Label)
    friendTabLabel: Label | null = null;

    @property(Label)
    recentTabLabel: Label | null = null;

    @property(Node)
    panelRoot: Node | null = null;

    private readonly panelNames: Record<ChatTab, string> = {
        messages: 'MessagePanel',
        friends: 'FriendPanel',
        recent: 'RecentPanel'
    };

    private readonly apiPaths: Record<ChatTab, string> = {
        messages: '/messages',
        friends: '/friends',
        recent: '/recent'
    };

    private selectedTabFrame: SpriteFrame | null = null;
    private unselectedTabFrame: SpriteFrame | null = null;
    private panels = new Map<ChatTab, Node>();
    private panelLoadingTasks = new Map<ChatTab, Promise<Node>>();
    private loadedTabs = new Set<ChatTab>();

    onInit() {
        super.onInit();
        this.resolvePrefabNodes();
        this.collectExistingPanels();
        this.loadTabFrames();
    }

    onEnter(data?: SceneData) {
        this.resolvePrefabNodes();
        this.switchTab((data?.chatTab as ChatTab) || 'messages');
    }

    start() {
        this.onEnter();
    }

    onExit() {
    }

    onCleanup() {
    }

    async switchTab(tab: ChatTab) {
        this.currentTab = tab;
        this.resolvePrefabNodes();
        this.setNodeVisible(this.findNode('TopTabs'), true);
        this.syncTabState(tab);
        this.deactivateManagedPanels();

        const panel = await this.ensurePanel(tab);
        if (this.currentTab !== tab) {
            panel.active = false;
            return;
        }

        this.showOnlyActivePanel(tab);

        if (!this.loadedTabs.has(tab)) {
            const list = await this.loadList(tab);
            this.renderList(panel, list);
            this.loadedTabs.add(tab);
        }

        if (tab === 'messages') {
            await this.refreshNoticeBar(panel);
        }
    }

    switchMessageTab() {
        this.switchTab('messages');
    }

    switchFriendTab() {
        this.switchTab('friends');
    }

    switchRecentTab() {
        this.switchTab('recent');
    }

    forceRecentTab() {
        this.switchTab('recent');
    }

    onMessageClick(item: ChatUserItem) {
        console.log('[ChatView] Message clicked:', item);
        Platform.showToast('Chat is in development', 'none');
    }

    onFriendClick(item: ChatUserItem) {
        console.log('[ChatView] Friend clicked:', item);
        Platform.showToast('Friend chat is in development', 'none');
    }

    onAddFriend() {
        Platform.showToast('Add friend is in development', 'none');
    }

    onFriendApply() {
        Platform.showToast('Friend requests are in development', 'none');
    }

    onIgnoreMessages() {
        ChatView.ignoredNoticeSessionId = dataManager.loginSessionId;
        this.refreshCurrentNoticeBar(false);
    }

    async onOpenSettings() {
        const granted = await Platform.openNotificationSettings();
        if (granted) {
            this.refreshCurrentNoticeBar(false);
            return;
        }

        const panel = this.panels.get('messages');
        if (panel?.isValid) {
            await this.refreshNoticeBar(panel);
        }
    }

    private async ensurePanel(tab: ChatTab): Promise<Node> {
        this.collectExistingPanels();

        const cached = this.panels.get(tab);
        if (cached?.isValid) {
            this.sanitizePanelScrollBars(cached);
            return cached;
        }

        const loadingTask = this.panelLoadingTasks.get(tab);
        if (loadingTask) {
            return loadingTask;
        }

        const panelName = this.panelNames[tab];
        const task = this.loadPrefab(`prefabs/${panelName}`)
            .then(prefab => {
                const existing = this.findUniquePanel(tab);
                if (existing) {
                    this.sanitizePanelScrollBars(existing);
                    return existing;
                }

                const panel = instantiate(prefab);
                panel.name = panelName;
                panel.active = false;
                this.getPanelRoot().addChild(panel);
                this.panels.set(tab, panel);
                this.sanitizePanelScrollBars(panel);
                return panel;
            })
            .then(
                panel => {
                    this.panelLoadingTasks.delete(tab);
                    return panel;
                },
                error => {
                    this.panelLoadingTasks.delete(tab);
                    throw error;
                }
            );

        this.panelLoadingTasks.set(tab, task);
        return task;
    }

    private loadPrefab(path: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            resources.load(path, Prefab, (error, prefab) => {
                if (error || !prefab) {
                    reject(error ?? new Error(`Prefab not found: ${path}`));
                    return;
                }
                resolve(prefab);
            });
        });
    }

    private async loadList(tab: ChatTab): Promise<ChatUserItem[]> {
        try {
            const result = await Http.get<any>(this.apiPaths[tab]);
            const list = Array.isArray(result) ? result : (result?.list ?? result?.records ?? []);
            const normalized = list.map((item: any, index: number) => this.normalizeItem(item, index));
            return normalized.length >= 12 ? normalized : this.fillListForScrollTest(tab, normalized);
        } catch (error) {
            console.error(`[ChatView] Load ${tab} error:`, error);
            return this.getMockList(tab);
        }
    }

    private renderList(panel: Node, list: ChatUserItem[]) {
        const scrollView = panel.getComponentInChildren(ScrollView);
        this.sanitizeScrollView(scrollView);
        const content = scrollView?.content;
        if (!scrollView || !content) {
            console.warn('[ChatView] ScrollView content not found:', panel.name);
            return;
        }

        const template = content.children[0];
        if (!template) {
            console.warn('[ChatView] List item template not found:', panel.name);
            return;
        }

        content.children.slice(1).forEach(child => child.destroy());
        template.active = false;

        list.forEach(item => {
            const node = instantiate(template);
            node.active = true;
            content.addChild(node);
            this.bindItem(node, item);
        });

        const layout = content.getComponent(Layout);
        layout?.updateLayout();

        const contentTransform = content.getComponent(UITransform);
        const viewTransform = scrollView.node.getChildByName('view')?.getComponent(UITransform);
        if (contentTransform && viewTransform) {
            contentTransform.height = Math.max(this.calculateContentHeight(content, layout), viewTransform.height);
        }

        layout?.updateLayout();
        scrollView.scrollToTop(0);
    }

    private calculateContentHeight(content: Node, layout: Layout | null): number {
        const activeChildren = content.children.filter(child => child.active);
        const childrenHeight = activeChildren.reduce((height, child) => {
            return height + (child.getComponent(UITransform)?.height ?? 0);
        }, 0);
        const spacing = Math.max(0, activeChildren.length - 1) * (layout?.spacingY ?? 0);
        const padding = (layout?.paddingTop ?? 0) + (layout?.paddingBottom ?? 0);
        return childrenHeight + spacing + padding;
    }

    private bindItem(node: Node, item: ChatUserItem) {
        const nameLabel = node.getChildByName('NameLabel')?.getComponent(Label);
        const descLabel = node.getChildByName('DescLabel')?.getComponent(Label);
        const dateLabel = node.getChildByName('DateLabel')?.getComponent(Label);
        const rankLabel = node.getChildByName('Layout')?.getChildByName('RankLabel')?.getComponent(Label);
        const unreadLabel = node.getChildByName('Badge')?.getChildByPath('Mask/Bg/Label')?.getComponent(Label);

        if (nameLabel) {
            nameLabel.string = item.name;
        }
        if (descLabel) {
            descLabel.string = item.content || item.status || '';
        }
        if (dateLabel) {
            dateLabel.string = item.time || '';
        }
        if (rankLabel) {
            rankLabel.string = item.rank || '';
        }
        if (unreadLabel) {
            unreadLabel.string = String(item.unread ?? 0);
            const badge = node.getChildByName('Badge');
            if (badge) {
                badge.active = Number(item.unread ?? 0) > 0;
            }
        }

        const avatarSprite = node.getChildByPath('Mask/Avatar')?.getComponent(Sprite);
        this.setAvatar(avatarSprite, item);

        const rankSprite = node.getChildByName('Layout')?.getChildByName('RankIcon')?.getComponent(Sprite);
        this.setResourceSprite(rankSprite, this.getRankIconPath(item));

        const charmSprite = node.getChildByName('Layout')?.getChildByName('CharmIcon')?.getComponent(Sprite)
            ?? node.getChildByName('Layout')?.getChildByName('StarIcon')?.getComponent(Sprite)
            ?? node.getChildByName('StarIcon-001')?.getComponent(Sprite);
        this.setResourceSprite(charmSprite, this.getCharmIconPath(item));

    }

    private setAvatar(sprite: Sprite | null | undefined, item: ChatUserItem) {
        if (!sprite) {
            return;
        }

        const avatar = item.avatarUrl || item.avatar;
        if (!avatar) {
            return;
        }

        if (/^https?:\/\//i.test(avatar)) {
            assetManager.loadRemote<ImageAsset>(avatar, (error, imageAsset) => {
                if (error || !imageAsset || !sprite.isValid) {
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;
                const frame = new SpriteFrame();
                frame.texture = texture;
                sprite.spriteFrame = frame;
            });
            return;
        }

        this.setResourceSprite(sprite, this.toSpriteFramePath(avatar, 'tool'));
    }

    private setResourceSprite(sprite: Sprite | null | undefined, path: string | null) {
        if (!sprite || !path) {
            return;
        }

        const transform = sprite.getComponent(UITransform);
        const width = transform?.width ?? 0;
        const height = transform?.height ?? 0;

        resources.load(path, SpriteFrame, (error, frame) => {
            if (!error && frame && sprite.isValid) {
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                sprite.spriteFrame = frame;
                if (transform?.isValid && width > 0 && height > 0) {
                    transform.setContentSize(width, height);
                }
            }
        });
    }

    private getRankIconPath(item: ChatUserItem): string | null {
        if (item.rankIcon) {
            return this.toSpriteFramePath(item.rankIcon, 'image/rank');
        }

        const rank = item.rank || '';
        const rankMap: [RegExp, string][] = [
            [/王者|king/i, 'king'],
            [/大师|master/i, 'master'],
            [/星耀|starshine|starlight/i, 'starshine'],
            [/钻石|diamond/i, 'diamond'],
            [/铂金|platinum/i, 'platinum'],
            [/黄金|gold/i, 'gold'],
            [/白银|silver/i, 'silver'],
            [/青铜|bronze/i, 'bronze']
        ];

        const match = rankMap.find(([pattern]) => pattern.test(rank));
        return match ? `image/rank/${match[1]}/spriteFrame` : null;
    }

    private getCharmIconPath(item: ChatUserItem): string | null {
        if (item.charmIcon) {
            return this.toSpriteFramePath(item.charmIcon, 'image/charm');
        }

        return null;
    }

    private toSpriteFramePath(name: string, defaultRoot: string): string {
        const cleanName = name
            .replace(/^resources\//, '')
            .replace(/\.(png|jpg|jpeg)$/i, '')
            .replace(/\/spriteFrame$/, '')
            .replace(/^\/|\/$/g, '');

        const path = cleanName.includes('/') ? cleanName : `${defaultRoot}/${cleanName}`;
        return `${path}/spriteFrame`;
    }

    private normalizeItem(item: any, index: number): ChatUserItem {
        return {
            id: item.id ?? index,
            name: item.name ?? item.nickname ?? item.nickName ?? item.username ?? item.userName ?? 'Player',
            avatar: item.avatar ?? item.avatarName ?? item.avatarIcon,
            avatarUrl: item.avatarUrl ?? item.avatar_url,
            content: item.content ?? item.message ?? item.lastMessage ?? item.desc ?? item.description,
            time: item.time ?? item.createTime ?? item.updatedAt ?? item.lastTime,
            rank: item.rank ?? item.rankName ?? item.rank_name,
            rankIcon: item.rankIcon ?? item.rank_icon,
            charmIcon: item.charmIcon ?? item.charm_icon,
            unread: item.unread ?? item.unreadCount ?? 0,
            status: item.status
        };
    }

    private fillListForScrollTest(tab: ChatTab, list: ChatUserItem[]): ChatUserItem[] {
        if (list.length >= 12) {
            return list;
        }

        const mocks = this.createMockList(tab);
        return [...list, ...mocks.slice(list.length)].slice(0, 12);
    }

    private getMockList(tab: ChatTab): ChatUserItem[] {
        return this.createMockList(tab);
    }

    private createMockList(tab: ChatTab): ChatUserItem[] {
        if (tab === 'messages') {
            return this.createMockUsers('Message', 12).map((item, index) => ({
                ...item,
                content: index % 3 === 0 ? 'Ready for a match?' : index % 3 === 1 ? 'Daily reward received' : 'Friend request accepted',
                time: index < 6 ? `${12 - index}:30` : 'Yesterday',
                unread: index % 4 === 0 ? index + 1 : 0
            }));
        }

        if (tab === 'friends') {
            return this.createMockUsers('Friend', 12).map((item, index) => ({
                ...item,
                status: index % 3 === 0 ? 'Online' : index % 3 === 1 ? 'Offline' : 'In team'
            }));
        }

        return this.createMockUsers('Recent', 12);
    }

    private createMockUsers(prefix: string, count: number): ChatUserItem[] {
        return Array.from({ length: count }, (_, index) => ({
            id: `${prefix}-${index + 1}`,
            name: `${prefix} Player ${index + 1}`,
            ...this.createRandomSocialBadgeData()
        }));
    }

    private createRandomSocialBadgeData(): Pick<ChatUserItem, 'rank' | 'rankIcon' | 'charmIcon'> {
        const rankOptions = [
            { name: '青铜', icon: 'image/rank/bronze' },
            { name: '白银', icon: 'image/rank/silver' },
            { name: '黄金', icon: 'image/rank/gold' },
            { name: '铂金', icon: 'image/rank/platinum' },
            { name: '钻石', icon: 'image/rank/diamond' },
            { name: '星耀', icon: 'image/rank/starshine' },
            { name: '大师', icon: 'image/rank/master' },
            { name: '王者', icon: 'image/rank/king' }
        ];
        const rank = rankOptions[Math.floor(Math.random() * rankOptions.length)];
        const charmLevel = Math.floor(Math.random() * 18) + 1;

        return {
            rank: rank.name,
            rankIcon: rank.icon,
            charmIcon: `image/charm/charm${charmLevel < 10 ? `0${charmLevel}` : charmLevel}`
        };
    }

    private preparePanelState(panel: Node, tab: ChatTab) {
        if (tab !== 'messages') {
            this.setNodeVisible(panel.getChildByName('NoticeBar'), false);
        }
    }

    private syncTabState(activeTab: ChatTab) {
        this.updateTab(this.messageTabBtn, activeTab === 'messages', 'messages');
        this.updateTab(this.friendTabBtn, activeTab === 'friends', 'friends');
        this.updateTab(this.recentTabBtn, activeTab === 'recent', 'recent');
    }

    private updateTab(button: Button | null, active: boolean, tab: ChatTab) {
        if (!button) {
            return;
        }

        const sprite = this.getTopTabSprite(tab) ?? button.target?.getComponent(Sprite) ?? button.node.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = (active ? this.selectedTabFrame : this.unselectedTabFrame)
                ?? (active ? button.pressedSprite : button.normalSprite)
                ?? sprite.spriteFrame;
            sprite.color = Color.WHITE;
        }
    }

    private loadTabFrames() {
        resources.load('image/chat/chat_select_tag/spriteFrame', SpriteFrame, (error, frame) => {
            if (!error && frame) {
                this.selectedTabFrame = frame;
                this.syncTabState(this.currentTab);
            }
        });

        resources.load('image/chat/chat_unselect_tag/spriteFrame', SpriteFrame, (error, frame) => {
            if (!error && frame) {
                this.unselectedTabFrame = frame;
                this.syncTabState(this.currentTab);
            }
        });
    }

    private getTopTabSprite(tab: ChatTab): Sprite | null {
        const nodeName = tab === 'messages' ? 'MsgTab' : tab === 'friends' ? 'FriendTab' : 'RecentTab';
        return this.findComponentByPaths([
            `TopTabs/${nodeName}`,
            `HeaderContainer/TopTabs/${nodeName}`,
            `Home/HeaderContainer/TopTabs/${nodeName}`,
            `TopTabs/TopTabsLayout/${nodeName}`,
            nodeName
        ], Sprite);
    }

    private resolvePrefabNodes() {
        this.panelRoot = this.panelRoot ?? this.node;
        this.messageTabBtn ??= this.findComponentByPaths(['TopTabs/MsgTab', 'HeaderContainer/TopTabs/MsgTab', 'Home/HeaderContainer/TopTabs/MsgTab', 'TopTabs/TopTabsLayout/MsgTab', 'MsgTab'], Button);
        this.friendTabBtn ??= this.findComponentByPaths(['TopTabs/FriendTab', 'HeaderContainer/TopTabs/FriendTab', 'Home/HeaderContainer/TopTabs/FriendTab', 'TopTabs/TopTabsLayout/FriendTab', 'FriendTab'], Button);
        this.recentTabBtn ??= this.findComponentByPaths(['TopTabs/RecentTab', 'HeaderContainer/TopTabs/RecentTab', 'Home/HeaderContainer/TopTabs/RecentTab', 'TopTabs/TopTabsLayout/RecentTab', 'RecentTab'], Button);
        this.messageTabLabel ??= this.findComponentByPaths(['TopTabs/MsgTab/Label', 'HeaderContainer/TopTabs/MsgTab/Label', 'Home/HeaderContainer/TopTabs/MsgTab/Label', 'TopTabs/TopTabsLayout/MsgTab/Label'], Label);
        this.friendTabLabel ??= this.findComponentByPaths(['TopTabs/FriendTab/Label', 'HeaderContainer/TopTabs/FriendTab/Label', 'Home/HeaderContainer/TopTabs/FriendTab/Label', 'TopTabs/TopTabsLayout/FriendTab/Label'], Label);
        this.recentTabLabel ??= this.findComponentByPaths(['TopTabs/RecentTab/Label', 'HeaderContainer/TopTabs/RecentTab/Label', 'Home/HeaderContainer/TopTabs/RecentTab/Label', 'TopTabs/TopTabsLayout/RecentTab/Label'], Label);
    }

    private collectExistingPanels() {
        (['messages', 'friends', 'recent'] as ChatTab[]).forEach(tab => {
            this.findUniquePanel(tab);
        });
    }

    private findUniquePanel(tab: ChatTab): Node | null {
        const panelRoot = this.getPanelRoot();
        const panelName = this.panelNames[tab];
        const panels = panelRoot.children.filter(child => child.name === panelName && child.isValid);
        const first = panels[0] ?? null;

        panels.slice(1).forEach(panel => {
            panel.active = false;
            panel.removeFromParent();
            panel.destroy();
        });

        if (first) {
            this.panels.set(tab, first);
            this.preparePanelState(first, tab);
            this.sanitizePanelScrollBars(first);
        }

        return first;
    }

    private getPanelRoot(): Node {
        return this.panelRoot?.isValid ? this.panelRoot : this.node;
    }

    private showOnlyActivePanel(activeTab: ChatTab) {
        const panelRoot = this.getPanelRoot();
        (['messages', 'friends', 'recent'] as ChatTab[]).forEach(tab => {
            const panel = this.panels.get(tab) ?? panelRoot.getChildByName(this.panelNames[tab]);
            if (panel?.isValid) {
                panel.active = tab === activeTab;
            }

            panelRoot.children
                .filter(child => child.name === this.panelNames[tab] && child !== panel)
                .forEach(child => {
                    child.active = false;
                    child.removeFromParent();
                    child.destroy();
                });
        });
    }

    private deactivateManagedPanels() {
        const panelRoot = this.getPanelRoot();
        (['messages', 'friends', 'recent'] as ChatTab[]).forEach(tab => {
            const cached = this.panels.get(tab);
            if (cached?.isValid) {
                cached.active = false;
            }

            panelRoot.children
                .filter(child => child.name === this.panelNames[tab])
                .forEach(child => {
                    child.active = false;
                });
        });
    }

    private sanitizePanelScrollBars(panel: Node) {
        panel.getComponentsInChildren(ScrollView).forEach(scrollView => this.sanitizeScrollView(scrollView));
    }

    private sanitizeScrollView(scrollView: ScrollView | null | undefined) {
        if (!scrollView) {
            return;
        }

        const view = scrollView.node.getChildByName('view');
        const content = scrollView.content ?? view?.getChildByName('content') ?? null;
        if (content && scrollView.content !== content) {
            scrollView.content = content;
        }

        scrollView.stopAutoScroll();
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.elastic = false;
        scrollView.bounceDuration = 0;
        scrollView.inertia = true;
        scrollView.enabled = true;

        const verticalBar = scrollView.verticalScrollBar;
        if (verticalBar && (!verticalBar.node || !(verticalBar as any).handle)) {
            (scrollView as any).verticalScrollBar = null;
        }

        const horizontalBar = scrollView.horizontalScrollBar;
        if (horizontalBar && (!horizontalBar.node || !(horizontalBar as any).handle)) {
            (scrollView as any).horizontalScrollBar = null;
        }
    }

    private async refreshNoticeBar(panel: Node) {
        const noticeBar = panel.getChildByName('NoticeBar');
        if (!noticeBar) {
            return;
        }

        if (this.isNoticeIgnoredThisLogin()) {
            this.setNodeVisible(noticeBar, false);
            return;
        }

        const granted = await Platform.hasNotificationPermission();
        this.setNodeVisible(noticeBar, !granted);
    }

    private refreshCurrentNoticeBar(visible: boolean) {
        const panel = this.panels.get('messages');
        const noticeBar = panel?.getChildByName('NoticeBar');
        this.setNodeVisible(noticeBar ?? null, visible);
    }

    private isNoticeIgnoredThisLogin(): boolean {
        return ChatView.ignoredNoticeSessionId === dataManager.loginSessionId;
    }

    private setNodeVisible(node: Node | null, visible: boolean) {
        if (node?.isValid) {
            node.active = visible;
        }
    }
}
