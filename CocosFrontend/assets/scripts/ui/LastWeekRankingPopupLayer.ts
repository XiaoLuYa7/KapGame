import {
    _decorator,
    Button,
    instantiate,
    Label,
    Layout,
    Node,
    ScrollView,
    tween,
    Tween,
    Vec3,
    UITransform
} from 'cc';
import { BaseUI } from './BaseUI';
import { Http } from '../network/Http';
import { dataManager } from '../core/DataManager';
import { PopupStack } from './PopupStack';

declare const wx: any;

const { ccclass, property } = _decorator;

interface LastWeekRankingUserItem {
    userId: number | string;
    nickname: string;
    avatarUrl?: string;
    rankNo: number;
    weeklyBattleGold: number;
}

interface LastWeekRankingData {
    groupInfo: {
        groupId: number | string;
        memberCount: number;
        settleTime: string;
    };
    rankingList: LastWeekRankingUserItem[];
}

@ccclass('LastWeekRankingPopupLayer')
export class LastWeekRankingPopupLayer extends BaseUI {
    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Node)
    content: Node | null = null;

    @property(Node)
    userItemTemplate: Node | null = null;

    @property(Node)
    excisionNodeTemplate: Node | null = null;

    @property(Node)
    closeButton: Node | null = null;

    private cachedRankingData: LastWeekRankingData | null = null;
    private loadingTask: Promise<LastWeekRankingData> | null = null;
    private currentUserRankNo = 0;
    private prepared = false;
    private preparingTask: Promise<void> | null = null;
    private closeCallbacks: Array<() => void> = [];
    private closeButtonDefaultScale: Vec3 | null = null;

    protected onInit() {
        this.resolveNodes();
        if (this.userItemTemplate) {
            this.userItemTemplate.active = false;
        }
        if (this.excisionNodeTemplate) {
            this.excisionNodeTemplate.active = false;
        }
        this.bindRuntimeEvents();
    }

    async openAsWeeklyFirstLoginPopup() {
        await this.open();
    }

    async preload(): Promise<LastWeekRankingData | null> {
        this.resolveNodes();
        if (this.cachedRankingData && this.prepared) {
            return this.cachedRankingData;
        }
        await this.prepareContent();
        return this.cachedRankingData;
    }

    private async prepareContent() {
        if (this.prepared) {
            return;
        }
        if (this.preparingTask) {
            await this.preparingTask;
            return;
        }

        const task = this.doPrepareContent();
        this.preparingTask = task;
        try {
            await task;
        } finally {
            if (this.preparingTask === task) {
                this.preparingTask = null;
            }
        }
    }

    private async doPrepareContent() {
        const data = await this.ensureRankingData();
        this.refreshRankingList(data.rankingList);
        this.prepared = true;
    }

    async open() {
        this.resolveNodes();
        this.bindRuntimeEvents();
        await this.prepareContent();
        PopupStack.open(this.node);
    }

    close() {
        PopupStack.close(this.node);
        const callbacks = [...this.closeCallbacks];
        this.closeCallbacks = [];
        callbacks.forEach((callback) => callback());
    }

    onClosedOnce(callback: () => void) {
        this.closeCallbacks.push(callback);
    }

    onClickShare() {
        const shareTitle = this.currentUserRankNo > 0
            ? `我上周排名第${this.currentUserRankNo}名，快来挑战我！`
            : '我上周进入排行榜，快来挑战我！';
        if (typeof wx !== 'undefined' && wx.shareAppMessage) {
            wx.shareAppMessage({
                title: shareTitle,
                imageUrl: '',
                query: ''
            });
            return;
        }

        console.log(`[LastWeekRankingPopupLayer] 分享上周排名: ${shareTitle}`);
    }

    private async loadRankingData(): Promise<LastWeekRankingData> {
        const data = await this.fetchRankingData();
        this.cachedRankingData = data;
        this.prepared = false;
        return data;
    }

    private async ensureRankingData(): Promise<LastWeekRankingData> {
        if (this.cachedRankingData) {
            return this.cachedRankingData;
        }
        if (this.loadingTask) {
            return this.loadingTask;
        }

        const task = this.loadRankingData();
        this.loadingTask = task;
        try {
            return await task;
        } finally {
            if (this.loadingTask === task) {
                this.loadingTask = null;
            }
        }
    }

    private async fetchRankingData(): Promise<LastWeekRankingData> {
        if (this.isDevelopmentEnvironment()) {
            return this.getMockRankingData();
        }

        try {
            const data = await Http.get<LastWeekRankingData>('/rank/weekly/last');
            if (this.isValidLastWeekRankingData(data)) {
                return data;
            }
            console.warn('[LastWeekRankingPopupLayer] last week ranking API data invalid, use mock');
        } catch (error) {
            console.warn('[LastWeekRankingPopupLayer] load last week ranking failed, use mock:', error);
        }

        return this.getMockRankingData();
    }

    private refreshRankingList(list: LastWeekRankingUserItem[]) {
        this.resolveNodes();

        if (!this.content || !this.userItemTemplate) {
            console.warn('[LastWeekRankingPopupLayer] content 或 userItemTemplate 未绑定');
            return;
        }

        this.userItemTemplate.active = false;
        if (this.excisionNodeTemplate) {
            this.excisionNodeTemplate.active = false;
        }
        this.clearGeneratedItems();

        const sortedList = [...list].sort((a, b) => b.weeklyBattleGold - a.weeklyBattleGold);
        const currentUser = this.getCurrentRankingUserItem(sortedList);
        const displayList = sortedList.some((item) => String(item.userId) === String(currentUser.userId))
            ? sortedList
            : this.insertCurrentUserItem(sortedList, currentUser);
        this.currentUserRankNo = currentUser.rankNo;

        displayList.forEach((item, index) => {
            const rankNo = index + 1;
            const userItem = instantiate(this.userItemTemplate!);
            userItem.name = `LastWeekRankingUserItem_${rankNo}`;
            userItem.active = true;
            this.content!.addChild(userItem);
            this.refreshUserItem(userItem, item, rankNo);

            if (String(item.userId) === String(currentUser.userId)) {
                this.addCurrentUserMarker();
            }
        });

        this.updateContentHeight();
    }

    private refreshUserItem(userItem: Node, item: LastWeekRankingUserItem, rankNo: number) {
        const rankSpriteNode = userItem.getChildByPath('RankNode/RankSprite') ?? userItem.getChildByPath('RankSprite');
        const rankLabelNode = userItem.getChildByPath('RankNode/RankLabel') ?? userItem.getChildByPath('RankLabel');
        const rankLabel = rankLabelNode?.getComponent(Label) ?? null;

        if (rankSpriteNode && rankLabelNode && rankLabel) {
            rankSpriteNode.active = false;
            rankLabelNode.active = true;
            rankLabel.string = String(rankNo);
        }

        this.setLabelText(userItem, [
            'NameLabel',
            'NicknameLabel',
            'UserNameLabel'
        ], item.nickname);

        this.setLabelText(userItem, [
            'GoldAndRewardNode/GoldNode/CountLabel',
            'GoldNode/CountLabel',
            'WeeklyBattleGoldLabel',
            'BattleGoldLabel',
            'GoldLabel',
            'CoinLabel',
            'CountLabel'
        ], String(item.weeklyBattleGold));
    }

    private addCurrentUserMarker() {
        if (!this.content || !this.excisionNodeTemplate) {
            return;
        }

        const excisionNode = instantiate(this.excisionNodeTemplate);
        excisionNode.name = 'GeneratedExcisionNode_CurrentUser';
        excisionNode.active = true;
        this.setLabelText(excisionNode, ['BeforeLabel'], '您在这里');
        this.setLabelText(excisionNode, ['NeedCountLabel'], '');
        this.setLabelText(excisionNode, ['AfterLabel'], '');
        this.content.addChild(excisionNode);
    }

    private getCurrentRankingUserItem(list: LastWeekRankingUserItem[]): LastWeekRankingUserItem {
        const currentUserId = dataManager.userData.userId || 'local-current-user';
        const currentUserIndex = list.findIndex((item) => String(item.userId) === String(currentUserId));
        if (currentUserIndex >= 0) {
            return {
                ...list[currentUserIndex],
                rankNo: currentUserIndex + 1
            };
        }

        const weeklyBattleGold = Number(dataManager.userData.weeklyBattleGold ?? 0);
        return {
            userId: currentUserId,
            nickname: dataManager.userData.nickName || dataManager.userData.username || '当前用户',
            avatarUrl: dataManager.userData.avatarUrl,
            rankNo: this.getRankNoByGold(list, weeklyBattleGold),
            weeklyBattleGold
        };
    }

    private getRankNoByGold(sortedList: LastWeekRankingUserItem[], weeklyBattleGold: number) {
        return sortedList.filter((item) => Number(item.weeklyBattleGold) > weeklyBattleGold).length + 1;
    }

    private insertCurrentUserItem(sortedList: LastWeekRankingUserItem[], currentUser: LastWeekRankingUserItem) {
        const displayList = [...sortedList];
        displayList.splice(Math.max(0, currentUser.rankNo - 1), 0, currentUser);
        return displayList;
    }

    private getMockRankingData(): LastWeekRankingData {
        const names = [
            '玩家A', '玩家B', '玩家C', '玩家D', '玩家E', '玩家F', '玩家G', '玩家H', '玩家I', '玩家J',
            '玩家K', '玩家L', '玩家M', '玩家N', '玩家O', '玩家P', '玩家Q', '玩家R', '玩家S', '玩家T',
            '玩家U', '玩家V', '玩家W', '玩家X', '玩家Y', '玩家Z', '玩家AA', '玩家AB', '玩家AC', '玩家AD'
        ];
        const currentUserIndex = Math.min(29, Math.max(0, Math.floor(names.length / 2)));

        return {
            groupInfo: {
                groupId: 10001,
                memberCount: 30,
                settleTime: this.getLastWeekSettleTime()
            },
            rankingList: names.map((nickname, index) => ({
                userId: index === currentUserIndex ? dataManager.userData.userId || 'local-current-user' : index + 1,
                nickname: index === currentUserIndex ? dataManager.userData.username || '当前用户' : nickname,
                avatarUrl: index === currentUserIndex ? dataManager.userData.avatarUrl : '',
                rankNo: index + 1,
                weeklyBattleGold: Math.max(800, 14200 - index * 390 - (index % 5) * 120)
            }))
        };
    }

    private isValidLastWeekRankingData(data: LastWeekRankingData | null | undefined): data is LastWeekRankingData {
        return !!data
            && !!data.groupInfo
            && Number(data.groupInfo.memberCount || 0) > 0
            && Array.isArray(data.rankingList);
    }

    private getLastWeekSettleTime() {
        const now = new Date();
        const day = now.getDay() || 7;
        const lastSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        return `${lastSunday.getFullYear()}-${lastSunday.getMonth() + 1}-${lastSunday.getDate()} 23:59:59`;
    }

    private isDevelopmentEnvironment(): boolean {
        return typeof window === 'undefined' || !(window as any).wx;
    }

    private clearGeneratedItems() {
        if (!this.content) {
            return;
        }

        for (const child of [...this.content.children]) {
            if (child === this.userItemTemplate || child === this.excisionNodeTemplate) {
                continue;
            }
            child.removeFromParent();
            child.destroy();
        }
    }

    private updateContentHeight() {
        if (!this.content) {
            return;
        }

        const contentTransform = this.content.getComponent(UITransform);
        const viewTransform = this.scrollView?.node.getChildByName('view')?.getComponent(UITransform) ?? null;
        const itemTransform = this.userItemTemplate?.getComponent(UITransform) ?? null;
        const layout = this.content.getComponent(Layout);
        const itemHeight = itemTransform?.height ?? 90;
        const spacingY = layout?.spacingY ?? 0;
        const paddingTop = layout?.paddingTop ?? 0;
        const paddingBottom = layout?.paddingBottom ?? 0;
        const visibleItems = this.content.children.filter((child) => {
            return child.active && child !== this.userItemTemplate && child !== this.excisionNodeTemplate;
        });
        const childrenHeight = visibleItems.reduce((total, child) => {
            return total + (child.getComponent(UITransform)?.height ?? itemHeight);
        }, 0);
        const realHeight = paddingTop
            + paddingBottom
            + childrenHeight
            + Math.max(0, visibleItems.length - 1) * spacingY;
        const viewHeight = viewTransform?.height ?? this.scrollView?.node.getComponent(UITransform)?.height ?? 0;

        if (contentTransform) {
            contentTransform.height = Math.max(realHeight, viewHeight);
        }

        layout?.updateLayout();
        this.configureRigidScrollView();
        this.scrollView?.scrollToTop(0);
    }

    private configureRigidScrollView() {
        if (!this.scrollView) {
            return;
        }

        this.scrollView.stopAutoScroll();
        this.scrollView.horizontal = false;
        this.scrollView.vertical = true;
        this.scrollView.elastic = false;
        this.scrollView.bounceDuration = 0;
        this.scrollView.inertia = true;
        this.scrollView.horizontalScrollBar = null;
        this.scrollView.verticalScrollBar = null;
        this.scrollView.enabled = true;
    }

    private setLabelText(root: Node, paths: string[], text: string) {
        for (const path of paths) {
            const label = root.getChildByPath(path)?.getComponent(Label) ?? null;
            if (label) {
                label.string = text;
                return true;
            }
        }

        return false;
    }
    private resolveNodes() {
        this.scrollView ??= this.findComponentByPaths([
            'PopupPanel/ContentNode/ScrollView',
            'PopupPanel/ScrollView'
        ], ScrollView);
        this.content ??= this.findNodeByPaths([
            'PopupPanel/ContentNode/ScrollView/view/content',
            'PopupPanel/ScrollView/view/content'
        ]);
        this.userItemTemplate ??= this.findNodeByPaths([
            'PopupPanel/ContentNode/ScrollView/view/content/UserItem',
            'PopupPanel/ScrollView/view/content/UserItem'
        ]);
        this.excisionNodeTemplate ??= this.findNodeByPaths([
            'PopupPanel/ContentNode/ScrollView/view/content/ExcisionNode',
            'PopupPanel/ScrollView/view/content/ExcisionNode'
        ]);
        this.closeButton ??= this.findNodeByPaths([
            'PopupPanel/ButtonNode/Button'
        ]);
    }

    private bindRuntimeEvents() {
        if (!this.closeButton?.isValid) {
            return;
        }

        const button = this.closeButton.getComponent(Button);
        this.closeButton.targetOff(this);
        if (button) {
            button.clickEvents = [];
        }

        this.closeButton.on(Node.EventType.TOUCH_START, this.onCloseButtonTouchStart, this);
        this.closeButton.on(Node.EventType.TOUCH_END, this.onCloseButtonTouchEnd, this);
        this.closeButton.on(Node.EventType.TOUCH_CANCEL, this.onCloseButtonTouchCancel, this);
    }

    private onCloseButtonTouchStart() {
        if (!this.closeButton?.isValid) {
            return;
        }

        this.closeButtonDefaultScale = this.closeButtonDefaultScale ?? this.closeButton.scale.clone();
        Tween.stopAllByTarget(this.closeButton);
        this.closeButton.setScale(
            this.closeButtonDefaultScale.x * 0.9,
            this.closeButtonDefaultScale.y * 0.9,
            this.closeButtonDefaultScale.z
        );
    }

    private onCloseButtonTouchEnd() {
        this.close();
        this.restoreCloseButtonScale();
    }

    private onCloseButtonTouchCancel() {
        this.restoreCloseButtonScale();
    }

    private restoreCloseButtonScale() {
        if (!this.closeButton?.isValid || !this.closeButtonDefaultScale) {
            return;
        }

        Tween.stopAllByTarget(this.closeButton);
        tween(this.closeButton)
            .to(0.08, { scale: this.closeButtonDefaultScale.clone() })
            .start();
    }
}
