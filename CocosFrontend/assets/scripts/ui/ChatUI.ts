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
    cosmicValue?: number | string;
    cosmicIcon?: string;
    unread?: number;
    status?: string;
}

@ccclass('ChatUI')
export class ChatUI extends BaseUI {
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

    private readonly normalTabColor = new Color(255, 255, 255, 255);
    private readonly activeTabColor = new Color(255, 226, 91, 255);
    private readonly normalLabelColor = new Color(0, 0, 0, 255);
    private readonly activeLabelColor = new Color(255, 255, 255, 255);
    private selectedTabFrame: SpriteFrame | null = null;
    private unselectedTabFrame: SpriteFrame | null = null;
    private panels = new Map<ChatTab, Node>();
    private panelLoadingTasks = new Map<ChatTab, Promise<Node>>();
    private loadedTabs = new Set<ChatTab>();
    private normalButtonColors: Partial<Record<ChatTab, Color>> = {};
    private pressedButtonColors: Partial<Record<ChatTab, Color>> = {};

    onInit() {
        super.onInit();
        this.resolvePrefabNodes();
        this.collectExistingPanels();
        this.loadTabFrames();
    }

    onEnter(data?: SceneData) {
        this.resolvePrefabNodes();
        this.bindEvents();
        this.switchTab((data?.chatTab as ChatTab) || 'messages');
    }

    start() {
        this.onEnter();
    }

    onExit() {
        this.unbindEvents();
    }

    onCleanup() {
        this.unbindEvents();
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
        console.log('[ChatUI] Message clicked:', item);
        Platform.showToast('Chat is in development', 'none');
    }

    onFriendClick(item: ChatUserItem) {
        console.log('[ChatUI] Friend clicked:', item);
        Platform.showToast('Friend chat is in development', 'none');
    }

    onAddFriend() {
        Platform.showToast('Add friend is in development', 'none');
    }

    onFriendApply() {
        Platform.showToast('Friend requests are in development', 'none');
    }

    onIgnoreMessages() {
        ChatUI.ignoredNoticeSessionId = dataManager.loginSessionId;
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
                this.bindPanelEvents(panel, tab);
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
            console.error(`[ChatUI] Load ${tab} error:`, error);
            return this.getMockList(tab);
        }
    }

    private renderList(panel: Node, list: ChatUserItem[]) {
        const scrollView = panel.getComponentInChildren(ScrollView);
        this.sanitizeScrollView(scrollView);
        const content = scrollView?.content;
        if (!scrollView || !content) {
            console.warn('[ChatUI] ScrollView content not found:', panel.name);
            return;
        }

        const template = content.children[0];
        if (!template) {
            console.warn('[ChatUI] List item template not found:', panel.name);
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

        const cosmicSprite = node.getChildByName('Layout')?.getChildByName('StarIcon')?.getComponent(Sprite)
            ?? node.getChildByName('StarIcon-001')?.getComponent(Sprite);
        this.setResourceSprite(cosmicSprite, this.getCosmicIconPath(item));

        node.off(Button.EventType.CLICK);
        node.on(Button.EventType.CLICK, () => {
            if (this.currentTab === 'messages') {
                this.onMessageClick(item);
            } else {
                this.onFriendClick(item);
            }
        }, this);
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
            return this.toSpriteFramePath(item.rankIcon, 'rank');
        }

        const rank = item.rank || '';
        const rankMap: [RegExp, string][] = [
            [/王者|king/i, 'rank_king_王者'],
            [/大师|master/i, 'rank_master_大师'],
            [/星耀|starlight/i, 'rank_starlight_星耀'],
            [/钻石|diamond/i, 'rank_diamond_钻石'],
            [/铂金|platinum/i, 'rank_platinum_铂金'],
            [/黄金|gold/i, 'rank_gold_黄金'],
            [/白银|silver/i, 'rank_silver_白银'],
            [/青铜|bronze/i, 'rank_bronze_青铜']
        ];

        const match = rankMap.find(([pattern]) => pattern.test(rank));
        return match ? `rank/${match[1]}/spriteFrame` : null;
    }

    private getCosmicIconPath(item: ChatUserItem): string | null {
        if (item.cosmicIcon) {
            return this.toSpriteFramePath(item.cosmicIcon, 'cosmic');
        }

        const value = Number(item.cosmicValue ?? 1);
        const level = Math.max(1, Math.min(3, Number.isFinite(value) ? value : 1));
        return `cosmic/cosmic_star_${level}/spriteFrame`;
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
            cosmicValue: item.cosmicValue ?? item.star ?? item.starLevel ?? item.universeValue,
            cosmicIcon: item.cosmicIcon ?? item.starIcon ?? item.universeIcon,
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
        /*

        if (tab === 'messages') {
            return [
                { id: 1, name: '玩家小明', content: '今晚一起开黑吗？', time: '12:30', rank: '钻石', cosmicValue: 3, unread: 2 },
                { id: 2, name: '系统通知', content: '每日奖励已到账', time: '10:00', rank: '青铜', cosmicValue: 1, unread: 1 }
            ];
        }

        if (tab === 'friends') {
            return [
                { id: 1, name: '玩家小明', status: 'online', rank: '钻石', cosmicValue: 3 },
                { id: 2, name: '玩家小红', status: 'offline', rank: '铂金', cosmicValue: 2 }
            ];
        }

        return [
            { id: 1, name: '最近队友A', rank: '黄金', cosmicValue: 2 },
            { id: 2, name: '最近队友B', rank: '白银', cosmicValue: 1 }
        ];
        */
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
        const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
        return Array.from({ length: count }, (_, index) => ({
            id: `${prefix}-${index + 1}`,
            name: `${prefix} Player ${index + 1}`,
            rank: ranks[index % ranks.length],
            cosmicValue: (index % 3) + 1
        }));
    }

    private bindPanelEvents(panel: Node, tab: ChatTab) {
        panel.targetOff(this);
        this.bindButton(panel.getChildByPath('NoticeBar/IgnoreBtn')?.getComponent(Button), this.onIgnoreMessages);
        this.bindButton(panel.getChildByPath('NoticeBar/SettingBtn')?.getComponent(Button), this.onOpenSettings);
        this.bindButton(panel.getChildByPath('ActionBar/FriendApplyBtn')?.getComponent(Button), this.onFriendApply);
        this.bindButton(panel.getChildByPath('ActionBar/AddFriendBtn')?.getComponent(Button), this.onAddFriend);

        if (tab !== 'messages') {
            this.setNodeVisible(panel.getChildByName('NoticeBar'), false);
        }
    }

    private bindButton(button: Button | null | undefined, handler: () => void) {
        if (!button?.node?.isValid) {
            return;
        }

        button.node.off(Button.EventType.CLICK, handler, this);
        button.node.on(Button.EventType.CLICK, handler, this);
    }

    private bindEvents() {
        this.unbindEvents();
        this.messageTabBtn?.node.on(Button.EventType.CLICK, () => this.switchTab('messages'), this);
        this.friendTabBtn?.node.on(Button.EventType.CLICK, () => this.switchTab('friends'), this);
        this.recentTabBtn?.node.on(Button.EventType.CLICK, () => this.switchTab('recent'), this);
    }

    private unbindEvents() {
        this.messageTabBtn?.node.targetOff(this);
        this.friendTabBtn?.node.targetOff(this);
        this.recentTabBtn?.node.targetOff(this);
    }

    private syncTabState(activeTab: ChatTab) {
        this.updateTab(this.messageTabBtn, this.messageTabLabel, activeTab === 'messages', 'messages');
        this.updateTab(this.friendTabBtn, this.friendTabLabel, activeTab === 'friends', 'friends');
        this.updateTab(this.recentTabBtn, this.recentTabLabel, activeTab === 'recent', 'recent');
    }

    private updateTab(button: Button | null, label: Label | null, active: boolean, tab: ChatTab) {
        if (label) {
            label.color = active ? this.activeLabelColor : this.normalLabelColor;
        }

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

        const targetColor = active ? this.activeTabColor : this.normalTabColor;
        button.normalColor = targetColor.clone();
        button.hoverColor = targetColor.clone();
        button.pressedColor = this.activeTabColor.clone();
        button.transition = Button.Transition.NONE;
    }

    private loadTabFrames() {
        resources.load('tool/select_tab/spriteFrame', SpriteFrame, (error, frame) => {
            if (!error && frame) {
                this.selectedTabFrame = frame;
                this.syncTabState(this.currentTab);
            }
        });

        resources.load('tool/unselect_tab/spriteFrame', SpriteFrame, (error, frame) => {
            if (!error && frame) {
                this.unselectedTabFrame = frame;
                this.syncTabState(this.currentTab);
            }
        });
    }

    private getTopTabSprite(tab: ChatTab): Sprite | null {
        const nodeName = tab === 'messages' ? 'MsgTab' : tab === 'friends' ? 'FriendTab' : 'RecentTab';
        return this.node.getChildByPath(`TopTabs/TopTabsLayout/${nodeName}`)?.getComponent(Sprite) ?? null;
    }

    private resolvePrefabNodes() {
        this.panelRoot = this.panelRoot ?? this.node;
        this.messageTabBtn ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/MsgTab'], Button);
        this.friendTabBtn ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/FriendTab'], Button);
        this.recentTabBtn ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/RecentTab'], Button);
        this.messageTabLabel ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/MsgTab/Label'], Label);
        this.friendTabLabel ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/FriendTab/Label'], Label);
        this.recentTabLabel ??= this.findComponentByPaths(['TopTabs/TopTabsLayout/RecentTab/Label'], Label);

        this.captureButtonColors('messages', this.messageTabBtn);
        this.captureButtonColors('friends', this.friendTabBtn);
        this.captureButtonColors('recent', this.recentTabBtn);
    }

    private captureButtonColors(tab: ChatTab, button: Button | null) {
        if (!button || this.normalButtonColors[tab]) {
            return;
        }

        this.normalButtonColors[tab] = button.normalColor.clone();
        this.pressedButtonColors[tab] = button.pressedColor.clone();
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
            this.bindPanelEvents(first, tab);
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
        return ChatUI.ignoredNoticeSessionId === dataManager.loginSessionId;
    }

    private setNodeVisible(node: Node | null, visible: boolean) {
        if (node?.isValid) {
            node.active = visible;
        }
    }
}
