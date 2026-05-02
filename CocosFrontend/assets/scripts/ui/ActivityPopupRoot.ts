import {
    _decorator,
    BlockInputEvents,
    EventTouch,
    instantiate,
    Label,
    Layout,
    Node,
    ProgressBar,
    ScrollView,
    UITransform,
    Widget
} from 'cc';
import { BaseUI } from './BaseUI';
import { dataManager } from '../core/DataManager';
import { Http } from '../network/Http';

const { ccclass, property } = _decorator;

interface LevelRewardItem {
    level: number;
    rewardCount: number;
    claimed?: boolean;
}

interface LevelRewardData {
    username: string;
    level: number;
    exp: number;
    nextLevelExp: number;
    rewards: LevelRewardItem[];
}

@ccclass('ActivityPopupRoot')
export class ActivityPopupRoot extends BaseUI {
    @property(Node)
    levelRewardPopupLayer: Node | null = null;

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

    onInit() {
        super.onInit();
        this.resolveNodes();
        this.hideLevelRewardPopup();
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

    private async loadLevelRewardData(): Promise<LevelRewardData> {
        try {
            if (dataManager.isLoggedIn) {
                const data = await Http.get<LevelRewardData>('/user/level-rewards');
                if (data?.rewards?.length) {
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
            ]
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

        if (levelLabel) {
            levelLabel.string = String(reward.level);
        }
        if (requireLabel) {
            requireLabel.string = `等级达到${reward.level}级`;
        }
        if (numberLabel) {
            numberLabel.string = String(reward.rewardCount);
        }
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

    private resolveNodes() {
        this.levelRewardPopupLayer ??= this.findNodeByPaths(['LevelRewardPopupLayer'], this.node);
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
}
