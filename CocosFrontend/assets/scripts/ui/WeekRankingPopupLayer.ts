import {
    _decorator,
    Button,
    instantiate,
    Label,
    Layout,
    Node,
    resources,
    ScrollView,
    Sprite,
    SpriteFrame,
    UITransform
} from 'cc';
import { BaseUI } from './BaseUI';
import { Http } from '../network/Http';
import { dataManager } from '../core/DataManager';
import { PopupStack } from './PopupStack';

declare const wx: any;

const { ccclass, property } = _decorator;

interface RankInfo {
    rankCode: string;
    rankName: string;
    rankIcon: string;
}

interface RankingUserItem {
    userId: number | string;
    nickname: string;
    avatarUrl?: string;
    rankNo: number;
    weeklyBattleGold: number;
}

interface WeeklyRankData {
    rankInfo: RankInfo;
    groupInfo: {
        groupId: number | string;
        memberCount: number;
        settleTime: string;
    };
    rankingList: RankingUserItem[];
}

@ccclass('WeekRankingPopupLayer')
export class WeekRankingPopupLayer extends BaseUI {
    @property(Sprite)
    rankSprite: Sprite | null = null;

    @property(Label)
    rankLabel: Label | null = null;

    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Node)
    content: Node | null = null;

    @property(Node)
    userItemTemplate: Node | null = null;

    @property(Node)
    excisionNodeTemplate: Node | null = null;

    @property(Node)
    currentUserItem: Node | null = null;

    @property(Node)
    closeButton: Node | null = null;

    private cachedRankingData: WeeklyRankData | null = null;
    private loadingTask: Promise<void> | null = null;
    private readonly rankRewards = [50, 30, 10];
    private readonly promotionCutoffRatio = 0.2;
    private readonly retentionCutoffRatio = 0.6;

    protected onInit() {
        this.resolveNodes();
        if (this.userItemTemplate) {
            this.userItemTemplate.active = false;
        }
        if (this.excisionNodeTemplate) {
            this.excisionNodeTemplate.active = false;
        }
        if (this.currentUserItem) {
            this.currentUserItem.active = false;
        }
        this.bindRuntimeEvents();
    }

    openWeekRankingPopup() {
        void this.open();
    }

    preload(): Promise<void> {
        this.resolveNodes();
        if (this.cachedRankingData) {
            return Promise.resolve();
        }
        if (this.loadingTask) {
            return this.loadingTask;
        }

        const task = this.loadRankingData();
        this.loadingTask = task;
        task.then(
            () => {
                if (this.loadingTask === task) {
                    this.loadingTask = null;
                }
            },
            () => {
                if (this.loadingTask === task) {
                    this.loadingTask = null;
                }
            }
        );
        return task;
    }

    async open() {
        this.resolveNodes();
        this.bindRuntimeEvents();
        if (this.cachedRankingData) {
            this.refreshRankingData(this.cachedRankingData);
        }
        if (!this.cachedRankingData && !this.loadingTask) {
            this.loadingTask = this.loadRankingData();
        }
        const task = this.loadingTask;
        if (task) {
            try {
                await task;
            } finally {
                if (this.loadingTask === task) {
                    this.loadingTask = null;
                }
            }
        }
        PopupStack.open(this.node);
    }

    close() {
        PopupStack.close(this.node);
    }

    onClickShare() {
        if (typeof wx !== 'undefined' && wx.shareAppMessage) {
            wx.shareAppMessage({
                title: '我正在参加段位周排行，快来挑战我！',
                imageUrl: '',
                query: ''
            });
            return;
        }

        console.log('[WeekRankingPopupLayer] 当前不是微信环境，跳过分享');
    }

    onClickChat() {
        console.log('[WeekRankingPopupLayer] 进入段位分组聊天页面，功能暂未完成');
    }

    async loadRankingData() {
        const data = await this.fetchRankingData();
        this.cachedRankingData = data;
        this.refreshRankingData(data);
    }

    refreshRankingData(data: WeeklyRankData) {
        this.refreshRankInfo(data.rankInfo);
        this.refreshRankingList(data.rankingList);
    }

    refreshRankInfo(rankInfo: RankInfo) {
        this.resolveNodes();

        if (this.rankLabel) {
            this.rankLabel.string = `${rankInfo.rankName}组`;
        }

        if (!this.rankSprite) {
            console.warn('[WeekRankingPopupLayer] rankSprite 未绑定');
            return;
        }

        this.loadFirstAvailableSpriteFrame(this.getRankIconCandidatePaths(rankInfo.rankIcon), (spriteFrame) => {
            if (this.rankSprite) {
                this.rankSprite.spriteFrame = spriteFrame;
            }
        });
    }

    refreshRankingList(list: RankingUserItem[]) {
        this.resolveNodes();

        if (!this.content || !this.userItemTemplate) {
            console.warn('[WeekRankingPopupLayer] content 或 userItemTemplate 未绑定');
            return;
        }

        this.userItemTemplate.active = false;
        if (this.excisionNodeTemplate) {
            this.excisionNodeTemplate.active = false;
        }
        this.clearGeneratedItems();

        const sortedList = [...list].sort((a, b) => b.weeklyBattleGold - a.weeklyBattleGold);
        const currentGold = this.getCurrentUserWeeklyGold(sortedList);
        const promotionRankNo = this.getCutoffRankNo(sortedList.length, this.promotionCutoffRatio);
        const retentionRankNo = this.getCutoffRankNo(sortedList.length, this.retentionCutoffRatio);

        sortedList.forEach((item, index) => {
            const rankNo = index + 1;
            const userItem = instantiate(this.userItemTemplate!);
            userItem.name = `RankingUserItem_${rankNo}`;
            userItem.active = true;
            this.content!.addChild(userItem);
            this.refreshUserItem(userItem, item, rankNo);

            if (rankNo === promotionRankNo && this.shouldShowExcisionNode('promotion', item.weeklyBattleGold, currentGold)) {
                this.addExcisionNode('promotion', item.weeklyBattleGold, currentGold);
            }
            if (
                rankNo === retentionRankNo
                && retentionRankNo !== promotionRankNo
                && this.shouldShowExcisionNode('retention', item.weeklyBattleGold, currentGold)
            ) {
                this.addExcisionNode('retention', item.weeklyBattleGold, currentGold);
            }
        });

        this.updateContentHeight();
        this.refreshCurrentUserItem(sortedList);
    }

    refreshUserItem(userItem: Node, item: RankingUserItem, rankNo: number) {
        const rankSpriteNode = userItem.getChildByPath('RankNode/RankSprite')
            ?? userItem.getChildByPath('RankSprite')
            ?? userItem.getChildByPath('UserNode/RankNode/RankSprite')
            ?? userItem.getChildByPath('UserNode/RankSprite');
        const rankLabelNode = userItem.getChildByPath('RankNode/RankLabel')
            ?? userItem.getChildByPath('RankLabel')
            ?? userItem.getChildByPath('UserNode/RankNode/RankLabel')
            ?? userItem.getChildByPath('UserNode/RankLabel');
        const rankSprite = rankSpriteNode?.getComponent(Sprite) ?? null;
        const rankLabel = rankLabelNode?.getComponent(Label) ?? null;

        if (!rankSpriteNode || !rankLabelNode || !rankSprite || !rankLabel) {
            console.warn('[WeekRankingPopupLayer] UserItem 排名节点未绑定完整');
        } else if (rankNo <= 3) {
            rankSpriteNode.active = true;
            rankLabelNode.active = false;
            this.loadRankTagSprite(rankNo, rankSprite);
        } else {
            rankSpriteNode.active = false;
            rankLabelNode.active = true;
            rankLabel.string = String(rankNo);
        }

        this.setLabelText(userItem, [
            'NameLabel',
            'NicknameLabel',
            'UserNameLabel',
            'UserNode/NameLabel',
            'UserNode/NicknameLabel'
        ], item.nickname);

        this.setLabelText(userItem, [
            'GoldAndRewardNode/GoldNode/CountLabel',
            'GoldNode/CountLabel',
            'UserNode/GoldAndRewardNode/GoldNode/CountLabel',
            'UserNode/GoldNode/CountLabel',
            'WeeklyBattleGoldLabel',
            'BattleGoldLabel',
            'GoldLabel',
            'CoinLabel',
            'CountLabel'
        ], String(item.weeklyBattleGold));

        const rewardNode = userItem.getChildByPath('GoldAndRewardNode/RewardNode')
            ?? userItem.getChildByPath('RewardNode')
            ?? userItem.getChildByPath('UserNode/GoldAndRewardNode/RewardNode')
            ?? userItem.getChildByPath('UserNode/RewardNode');
        const reward = this.getRankReward(rankNo);
        if (rewardNode) {
            rewardNode.active = reward > 0;
            if (reward > 0) {
                this.setLabelText(userItem, [
                    'GoldAndRewardNode/RewardNode/CountLabel',
                    'RewardNode/CountLabel',
                    'UserNode/GoldAndRewardNode/RewardNode/CountLabel',
                    'UserNode/RewardNode/CountLabel'
                ], String(reward));
            }
        }
    }

    private async fetchRankingData(): Promise<WeeklyRankData> {
        if (this.isDevelopmentEnvironment()) {
            return this.getMockRankingData();
        }

        try {
            const data = await Http.get<WeeklyRankData>('/rank/weekly/current');
            if (this.isValidWeeklyRankData(data)) {
                return data;
            }
            console.warn('[WeekRankingPopupLayer] weekly rank API data invalid, use mock');
        } catch (error) {
            console.warn('[WeekRankingPopupLayer] load weekly rank failed, use mock:', error);
        }

        return this.getMockRankingData();
    }

    private getMockRankingData(): WeeklyRankData {
        const names = [
            '玩家A', '玩家B', '玩家C', '玩家D', '玩家E', '玩家F', '玩家G', '玩家H', '玩家I', '玩家J',
            '玩家K', '玩家L', '玩家M', '玩家N', '玩家O', '玩家P', '玩家Q', '玩家R', '玩家S', '玩家T',
            '玩家U', '玩家V', '玩家W', '玩家X', '玩家Y', '玩家Z', '玩家AA', '玩家AB', '玩家AC', '玩家AD'
        ];

        return {
            rankInfo: {
                rankCode: dataManager.userData.rankCode || 'BRONZE',
                rankName: dataManager.userData.rankName || '青铜',
                rankIcon: dataManager.userData.rankIcon || 'image/rank/bronze'
            },
            groupInfo: {
                groupId: 10001,
                memberCount: 30,
                settleTime: '2026-05-10 20:00:00'
            },
            rankingList: names.map((nickname, index) => ({
                userId: index === 0 ? dataManager.userData.userId || 1 : index + 1,
                nickname: index === 0 ? dataManager.userData.username || nickname : nickname,
                avatarUrl: index === 0 ? dataManager.userData.avatarUrl : '',
                rankNo: index + 1,
                weeklyBattleGold: index === 0
                    ? dataManager.userData.weeklyBattleGold || 12800
                    : Math.max(800, 12800 - index * 420 - (index % 4) * 130)
            }))
        };
    }

    private isValidWeeklyRankData(data: WeeklyRankData | null | undefined): data is WeeklyRankData {
        return !!data
            && !!data.rankInfo
            && typeof data.rankInfo.rankName === 'string'
            && typeof data.rankInfo.rankIcon === 'string'
            && Array.isArray(data.rankingList);
    }

    private loadRankTagSprite(rankNo: number, sprite: Sprite) {
        const paths = rankNo === 1
            ? ['image/first_tag']
            : rankNo === 2
                ? ['image/second_tag', 'image/second_atg']
                : ['image/three_tag'];

        this.loadFirstAvailableSpriteFrame(paths, (spriteFrame) => {
            sprite.spriteFrame = spriteFrame;
        });
    }

    private getRankReward(rankNo: number) {
        return this.rankRewards[rankNo - 1] ?? 0;
    }

    private getCutoffRankNo(totalCount: number, ratio: number) {
        if (totalCount <= 0) {
            return 0;
        }

        return Math.max(1, Math.min(totalCount, Math.ceil(totalCount * ratio)));
    }

    private getCurrentUserWeeklyGold(list: RankingUserItem[]) {
        const currentUser = this.getCurrentRankingUserItem(list);

        return Number(currentUser?.weeklyBattleGold ?? dataManager.userData.weeklyBattleGold ?? 0);
    }

    private getCurrentRankingUserItem(list: RankingUserItem[]): RankingUserItem {
        const currentUserId = dataManager.userData.userId;
        const currentUserIndex = currentUserId === undefined || currentUserId === null
            ? -1
            : list.findIndex((item) => String(item.userId) === String(currentUserId));
        if (currentUserIndex >= 0) {
            return {
                ...list[currentUserIndex],
                rankNo: currentUserIndex + 1
            };
        }

        const weeklyBattleGold = Number(dataManager.userData.weeklyBattleGold ?? 0);
        return {
            userId: currentUserId || 'local-current-user',
            nickname: dataManager.userData.nickName || dataManager.userData.username || '当前用户',
            avatarUrl: dataManager.userData.avatarUrl,
            rankNo: this.getRankNoByGold(list, weeklyBattleGold),
            weeklyBattleGold
        };
    }

    private refreshCurrentUserItem(sortedList: RankingUserItem[]) {
        if (!this.currentUserItem) {
            return;
        }

        const currentUser = this.getCurrentRankingUserItem(sortedList);
        this.currentUserItem.active = true;
        this.refreshUserItem(this.currentUserItem, currentUser, currentUser.rankNo);
        this.setLabelText(this.currentUserItem, [
            'RewardNode/NameLabel',
            'GoldAndRewardNode/RewardNode/NameLabel',
            'UserNode/RewardNode/NameLabel',
            'UserNode/GoldAndRewardNode/RewardNode/NameLabel'
        ], currentUser.nickname);
        this.refreshCurrentUserRankStatus(sortedList, currentUser);
    }

    private getRankNoByGold(sortedList: RankingUserItem[], weeklyBattleGold: number) {
        return sortedList.filter((item) => Number(item.weeklyBattleGold) > weeklyBattleGold).length + 1;
    }

    private refreshCurrentUserRankStatus(sortedList: RankingUserItem[], currentUser: RankingUserItem) {
        if (!this.currentUserItem) {
            return;
        }

        const rewardNode = this.currentUserItem.getChildByPath('GoldAndRewardNode/RewardNode')
            ?? this.currentUserItem.getChildByPath('RewardNode')
            ?? this.currentUserItem.getChildByPath('UserNode/GoldAndRewardNode/RewardNode')
            ?? this.currentUserItem.getChildByPath('UserNode/RewardNode');
        if (!rewardNode) {
            return;
        }

        rewardNode.active = true;
        this.setLabelText(this.currentUserItem, [
            'GoldAndRewardNode/RewardNode/Label',
            'RewardNode/Label',
            'UserNode/GoldAndRewardNode/RewardNode/Label',
            'UserNode/RewardNode/Label'
        ], this.getCurrentUserRankStatusText(sortedList, currentUser.rankNo));
        this.setNodeActive(rewardNode, ['CountLabel', 'DiamontSprite', 'DiamondSprite'], false);
    }

    private getCurrentUserRankStatusText(sortedList: RankingUserItem[], rankNo: number) {
        const totalCount = Math.max(sortedList.length, rankNo, 1);
        if (rankNo <= this.getCutoffRankNo(totalCount, this.promotionCutoffRatio)) {
            return '下周将升级段位';
        }
        if (rankNo <= this.getCutoffRankNo(totalCount, this.retentionCutoffRatio)) {
            return '下周将保留段位';
        }
        return '下周将降低段位';
    }

    private getNeedGoldToOvertake(targetGold: number, currentGold: number) {
        return Math.max(0, Math.floor(Number(targetGold) - Number(currentGold) + 1));
    }

    private shouldShowExcisionNode(_type: 'promotion' | 'retention', targetGold: number, currentGold: number) {
        return currentGold <= targetGold;
    }

    private addExcisionNode(type: 'promotion' | 'retention', targetGold: number, currentGold: number) {
        if (!this.content || !this.excisionNodeTemplate) {
            return;
        }

        const excisionNode = instantiate(this.excisionNodeTemplate);
        excisionNode.name = type === 'promotion'
            ? 'GeneratedExcisionNode_Promotion'
            : 'GeneratedExcisionNode_Retention';
        excisionNode.active = true;

        this.setLabelText(excisionNode, ['BeforeLabel'], '再赢');
        this.setLabelText(excisionNode, ['NeedCountLabel'], String(this.getNeedGoldToOvertake(targetGold, currentGold)));
        const coinSprite = excisionNode.getChildByPath('CoinSprite');
        if (coinSprite) {
            coinSprite.active = true;
        }
        this.setLabelText(excisionNode, ['AfterLabel'], type === 'promotion'
            ? '超过Ta，本周将升段'
            : '超过Ta，本周将保留段位');

        this.content.addChild(excisionNode);
    }

    private loadFirstAvailableSpriteFrame(paths: string[], onLoaded: (spriteFrame: SpriteFrame) => void) {
        const loadAt = (index: number) => {
            const path = paths[index];
            if (!path) {
                console.warn('[WeekRankingPopupLayer] 加载图片失败，使用现有图片:', paths.join(', '));
                return;
            }

            const spriteFramePath = this.toSpriteFramePath(path);
            resources.load(spriteFramePath, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame) {
                    loadAt(index + 1);
                    return;
                }
                onLoaded(spriteFrame);
            });
        };

        loadAt(0);
    }

    private getRankIconCandidatePaths(rankIcon: string) {
        const cleanPath = this.cleanResourcePath(rankIcon);
        if (!cleanPath) {
            return ['image/rank/bronze'];
        }
        if (cleanPath.startsWith('image/rank/')) {
            return [cleanPath];
        }
        if (cleanPath.startsWith('rank/')) {
            return [`image/${cleanPath}`, cleanPath];
        }
        return [`image/rank/${cleanPath}`, `rank/${cleanPath}`, cleanPath];
    }

    private toSpriteFramePath(path: string) {
        const cleanPath = this.cleanResourcePath(path);
        return cleanPath.endsWith('/spriteFrame') ? cleanPath : `${cleanPath}/spriteFrame`;
    }

    private cleanResourcePath(path: string) {
        return path
            .replace(/^resources\//, '')
            .replace(/\.(png|jpg|jpeg|webp)$/i, '')
            .replace(/^\/|\/$/g, '');
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
        const itemHeight = itemTransform?.height ?? 110;
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

        console.warn('[WeekRankingPopupLayer] 未找到 Label:', paths.join(' | '));
        return false;
    }

    private setNodeActive(root: Node, childNames: string[], active: boolean) {
        childNames.forEach((childName) => {
            const child = root.getChildByName(childName);
            if (child) {
                child.active = active;
            }
        });
    }
    private resolveNodes() {
        this.rankSprite ??= this.findComponentByPaths([
            'PopupPanel/ContentNode/DescNode/RankSprite'
        ], Sprite);
        this.rankLabel ??= this.findComponentByPaths([
            'PopupPanel/ContentNode/DescNode/RankLabel'
        ], Label);
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
            'PopupPanel/ContentNode/ScrollView/view/content/MessageItem',
            'PopupPanel/ScrollView/view/content/UserItem',
            'PopupPanel/ScrollView/view/content/MessageItem'
        ]);
        this.excisionNodeTemplate ??= this.findNodeByPaths([
            'PopupPanel/ContentNode/ScrollView/view/content/ExcisionNode',
            'PopupPanel/ScrollView/view/content/ExcisionNode'
        ]);
        this.currentUserItem ??= this.findNodeByPaths([
            'PopupPanel/ContentNode/CurrentUserItem',
            'PopupPanel/CurrentUserItem'
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
            this.closeButton.on(Button.EventType.CLICK, this.close, this);
        } else {
            this.closeButton.on(Node.EventType.TOUCH_END, this.close, this);
        }
    }
}
