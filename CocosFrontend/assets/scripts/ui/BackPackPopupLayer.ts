import { _decorator, Button, instantiate, Label, Layout, Node, resources, ScrollView, Sprite, SpriteFrame, UITransform } from 'cc';
import { BaseUI } from './BaseUI';

const { ccclass } = _decorator;

type BackPackCategory = 'decorate' | 'present' | 'prop';

interface BackPackItem {
    category?: BackPackCategory | string;
    itemName?: string;
    name?: string;
    itemIcon?: string;
    icon?: string;
    iconPath?: string;
    iconUrl?: string;
    quantity?: number;
    count?: number;
    expireTime?: string;
    expireAt?: string;
    numberOrDate?: string;
}

@ccclass('BackPackPopupLayer')
export class BackPackPopupLayer extends BaseUI {
    private readonly selectButtonSpritePath = 'tool/backpack/bp_select_button/spriteFrame';
    private readonly generatedItemPrefix = 'GeneratedBackPackItem_';
    private selectedCategory: BackPackCategory = 'decorate';
    private selectedSpriteFrame: SpriteFrame | null = null;
    private closeButtonNode: Node | null = null;
    private decorateNode: Node | null = null;
    private presentNode: Node | null = null;
    private propNode: Node | null = null;
    private emptyNode: Node | null = null;
    private scrollViewNode: Node | null = null;
    private contentNode: Node | null = null;
    private itemTemplateNode: Node | null = null;
    private hasBoundEvents = false;
    private spriteFrameCache = new Map<string, SpriteFrame | null>();
    private spriteFrameLoading = new Map<string, Promise<SpriteFrame | null>>();

    protected onInit() {
        super.onInit();
        this.resolveNodes();
        void this.loadSelectedSpriteFrame();
    }

    protected onCleanup() {
        this.node.targetOff(this);
        this.closeButtonNode?.targetOff(this);
        this.decorateNode?.targetOff(this);
        this.presentNode?.targetOff(this);
        this.propNode?.targetOff(this);
    }

    async open(category: BackPackCategory = this.selectedCategory) {
        this.resolveNodes();
        this.bindEvents();
        this.sanitizeScrollView();
        this.node.active = true;
        if (this.node.parent?.isValid) {
            this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }
        await this.selectCategory(category);
    }

    close() {
        this.node.active = false;
    }

    private bindEvents() {
        if (this.hasBoundEvents) {
            return;
        }

        this.bindClick(this.closeButtonNode, () => this.close(), 'CloseButton');
        this.bindClick(this.decorateNode, () => void this.selectCategory('decorate'), 'DecorateNode');
        this.bindClick(this.presentNode, () => void this.selectCategory('present'), 'PresentNode');
        this.bindClick(this.propNode, () => void this.selectCategory('prop'), 'PropNode');
        this.hasBoundEvents = true;
    }

    private bindClick(node: Node | null, handler: () => void, debugName: string) {
        if (!node?.isValid) {
            console.warn(`[BackPackPopupLayer] bind click failed: ${debugName}`);
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
            console.log(`[BackPackPopupLayer] click ${debugName}`);
            handler();
        };
        if (button) {
            button.interactable = true;
            node.on(Button.EventType.CLICK, wrappedHandler, this);
        } else {
            node.on(Node.EventType.TOUCH_END, wrappedHandler, this);
        }
    }

    private async selectCategory(category: BackPackCategory) {
        this.selectedCategory = category;
        await this.loadSelectedSpriteFrame();
        this.updateTabSprites();

        try {
            const items = await this.fetchItems(category);
            this.renderItems(items);
        } catch (error) {
            console.error(`[BackPackPopupLayer] load ${category} items failed:`, error);
            this.renderItems([]);
        }
    }

    private async fetchItems(category: BackPackCategory): Promise<BackPackItem[]> {
        return this.getMockItems(category);
    }

    private getMockItems(category: BackPackCategory): BackPackItem[] {
        const mockItems: Record<BackPackCategory, BackPackItem[]> = {
            decorate: [
                { category, itemName: '星辉头像框', itemIcon: 'tool/charm/charm01', quantity: 1 },
                { category, itemName: '紫晶称号牌', itemIcon: 'tool/charm/charm07', quantity: 2 },
                { category, itemName: '黄金入场特效', itemIcon: 'tool/charm/charm12', expireTime: '7天后到期' },
                { category, itemName: '月光卡背', itemIcon: 'tool/charm/charm18', expireTime: '永久' },
                { category, itemName: '粉晶挂件', itemIcon: 'tool/charm/charm03', quantity: 1 },
                { category, itemName: '蓝焰名片', itemIcon: 'tool/charm/charm06', expireTime: '5天后到期' },
                { category, itemName: '星河气泡', itemIcon: 'tool/charm/charm09', quantity: 4 },
                { category, itemName: '王者边框', itemIcon: 'tool/charm/charm15', expireTime: '永久' },
                { category, itemName: '幸运尾迹', itemIcon: 'tool/charm/charm10', quantity: 1 },
                { category, itemName: '糖果徽章', itemIcon: 'tool/charm/charm04', expireTime: '2天后到期' }
            ],
            present: [
                { category, itemName: '金币礼盒', itemIcon: 'tool/icon_coin', quantity: 5 },
                { category, itemName: '钻石礼盒', itemIcon: 'tool/icon_diamond', quantity: 2 },
                { category, itemName: '幸运星礼物', itemIcon: 'tool/reward/star', expireTime: '3天后到期' },
                { category, itemName: '好友感谢包', itemIcon: 'tool/share', quantity: 6 },
                { category, itemName: '赛季补给箱', itemIcon: 'tool/general_popup', expireTime: '明天到期' },
                { category, itemName: '成长礼包', itemIcon: 'tool/receive', quantity: 3 },
                { category, itemName: '闪耀礼券', itemIcon: 'tool/seceived', expireTime: '6天后到期' },
                { category, itemName: '欢庆宝箱', itemIcon: 'tool/coin_reward', quantity: 9 },
                { category, itemName: '惊喜红包', itemIcon: 'tool/dailycheck/coin4', quantity: 12 }
            ],
            prop: [
                { category, itemName: '双倍金币卡', itemIcon: 'tool/coin_reward', quantity: 3 },
                { category, itemName: '改名卡', itemIcon: 'tool/backpack/empty_icon', quantity: 1 },
                { category, itemName: '护盾道具', itemIcon: 'tool/right_mark', expireTime: '12小时后到期' },
                { category, itemName: '经验加速卡', itemIcon: 'tool/progress/progress_icon_right', quantity: 8 },
                { category, itemName: '刷新券', itemIcon: 'tool/progress/progress_icon_left', quantity: 5 },
                { category, itemName: '挑战门票', itemIcon: 'game/Gameplay/Rank_Challenge', quantity: 2 },
                { category, itemName: '保护卡', itemIcon: 'tool/general_radius_bg', expireTime: '今晚到期' },
                { category, itemName: '幸运骰子', itemIcon: 'tool/bofang', quantity: 7 },
                { category, itemName: '复活道具', itemIcon: 'tool/first_tag', quantity: 4 },
                { category, itemName: '加时卡', itemIcon: 'tool/second_tag', expireTime: '4天后到期' }
            ]
        };

        const baseItems = mockItems[category];
        return Array.from({ length: 24 }, (_, index) => {
            const item = baseItems[index % baseItems.length];
            const group = Math.floor(index / baseItems.length) + 1;
            return {
                ...item,
                itemName: group === 1 ? item.itemName : `${item.itemName}${group}`,
                numberOrDate: item.expireTime || (item.quantity === undefined ? '' : `x${item.quantity}`)
            };
        });
    }

    private renderItems(items: BackPackItem[]) {
        this.resolveNodes();
        if (!this.contentNode?.isValid || !this.itemTemplateNode?.isValid) {
            console.warn('[BackPackPopupLayer] render skipped: content or template missing');
            return;
        }

        this.sanitizeScrollView();
        this.clearRenderedItems();
        this.hideTemplateItems();
        this.itemTemplateNode.active = false;

        items.forEach((item, index) => {
            const itemNode = instantiate(this.itemTemplateNode!);
            itemNode.name = `${this.generatedItemPrefix}${index}`;
            itemNode.active = true;
            this.contentNode!.addChild(itemNode);
            this.applyItem(itemNode, item);
        });

        this.updateEmptyState();
        this.refreshScrollContent(items.length);
    }

    private clearRenderedItems() {
        if (!this.contentNode?.isValid) {
            return;
        }

        for (const child of [...this.contentNode.children]) {
            if (child.name.startsWith(this.generatedItemPrefix)) {
                child.destroy();
            }
        }
    }

    private hideTemplateItems() {
        if (!this.contentNode?.isValid) {
            return;
        }

        for (const child of this.contentNode.children) {
            if (child.name === 'ItemNode' || child.name.startsWith('ItemNode-')) {
                child.active = false;
            }
        }
    }

    private updateEmptyState() {
        const hasVisibleItem = !!this.contentNode?.children.some((child) => {
            return child.active && child.name.startsWith(this.generatedItemPrefix);
        });

        if (this.emptyNode?.isValid) {
            this.emptyNode.active = !hasVisibleItem;
        }
        if (this.scrollViewNode?.isValid) {
            this.scrollViewNode.active = hasVisibleItem;
        }
    }

    private applyItem(itemNode: Node, item: BackPackItem) {
        const nameLabel = itemNode.getChildByName('NameLabel')?.getComponent(Label) ?? null;
        const iconSprite = itemNode.getChildByName('IconSprite')?.getComponent(Sprite) ?? null;
        const numberOrDateLabel = itemNode.getChildByName('NumberOrDateLabel')?.getComponent(Label) ?? null;

        if (nameLabel) {
            nameLabel.string = item.itemName || item.name || '';
        }
        if (numberOrDateLabel) {
            numberOrDateLabel.string = this.formatNumberOrDate(item);
        }
        if (iconSprite) {
            void this.setIconSprite(iconSprite, item.itemIcon || item.icon || item.iconPath || item.iconUrl || '');
        }
    }

    private formatNumberOrDate(item: BackPackItem): string {
        if (item.numberOrDate) {
            return item.numberOrDate;
        }

        const expireText = item.expireTime || item.expireAt || '';
        if (expireText) {
            return expireText;
        }

        const quantity = item.quantity ?? item.count;
        return quantity === undefined || quantity === null ? '' : `x${quantity}`;
    }

    private async setIconSprite(sprite: Sprite, iconPath: string) {
        if (!iconPath) {
            sprite.spriteFrame = null;
            return;
        }

        const spriteFrame = await this.loadSpriteFrame(iconPath);
        if (sprite?.isValid) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private async loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        const resourcePath = this.normalizeResourcePath(path);
        if (!resourcePath) {
            return null;
        }

        if (this.spriteFrameCache.has(resourcePath)) {
            return this.spriteFrameCache.get(resourcePath) ?? null;
        }

        const loading = this.spriteFrameLoading.get(resourcePath);
        if (loading) {
            return loading;
        }

        const promise = new Promise<SpriteFrame | null>((resolve) => {
            resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
                if (!error && spriteFrame) {
                    resolve(spriteFrame);
                    return;
                }
                resources.load(`${resourcePath}/spriteFrame`, SpriteFrame, (fallbackError, fallbackSpriteFrame) => {
                    resolve(fallbackError ? null : fallbackSpriteFrame ?? null);
                });
            });
        }).then((spriteFrame) => {
            this.spriteFrameCache.set(resourcePath, spriteFrame);
            this.spriteFrameLoading.delete(resourcePath);
            return spriteFrame;
        });

        this.spriteFrameLoading.set(resourcePath, promise);
        return promise;
    }

    private normalizeResourcePath(path: string): string {
        let resourcePath = path.trim();
        if (!resourcePath) {
            return '';
        }

        resourcePath = resourcePath.replace(/\\/g, '/');
        const resourcesIndex = resourcePath.indexOf('/resources/');
        if (resourcesIndex >= 0) {
            resourcePath = resourcePath.slice(resourcesIndex + '/resources/'.length);
        }
        resourcePath = resourcePath.replace(/^resources\//, '');
        resourcePath = resourcePath.replace(/\.(png|jpg|jpeg|webp)$/i, '');
        resourcePath = resourcePath.replace(/\/spriteFrame$/, '');
        return resourcePath;
    }

    private refreshScrollContent(itemCount: number) {
        if (!this.contentNode?.isValid) {
            return;
        }

        const layout = this.contentNode.getComponent(Layout);
        layout?.updateLayout();

        const contentTransform = this.contentNode.getComponent(UITransform);
        const viewTransform = this.contentNode.parent?.getComponent(UITransform) ?? null;
        const itemTransform = this.itemTemplateNode?.getComponent(UITransform) ?? null;
        if (contentTransform && viewTransform && itemTransform) {
            const realHeight = this.calculateContentHeight(itemCount, contentTransform, itemTransform, layout);
            contentTransform.setContentSize(contentTransform.width, Math.max(realHeight, viewTransform.height));
        }

        layout?.updateLayout();
        const scrollView = this.sanitizeScrollView();
        scrollView?.scrollToTop(0);
    }

    private sanitizeScrollView(): ScrollView | null {
        const scrollView = this.scrollViewNode?.getComponent(ScrollView) ?? null;
        if (!scrollView) {
            return null;
        }

        this.configureScrollView(scrollView);
        return scrollView;
    }

    private configureScrollView(scrollView: ScrollView) {
        const view = scrollView.node.getChildByName('view');
        const content = scrollView.content ?? view?.getChildByName('content') ?? this.contentNode;
        if (content?.isValid && scrollView.content !== content) {
            scrollView.content = content;
        }

        scrollView.stopAutoScroll();
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.elastic = false;
        scrollView.inertia = true;
        scrollView.brake = 0.5;
        scrollView.cancelInnerEvents = true;
        scrollView.horizontalScrollBar = null;
        scrollView.verticalScrollBar = null;
        scrollView.enabled = true;
    }

    private calculateContentHeight(
        itemCount: number,
        contentTransform: UITransform,
        itemTransform: UITransform,
        layout: Layout | null
    ): number {
        if (itemCount <= 0) {
            return 0;
        }

        const paddingTop = layout?.paddingTop ?? 0;
        const paddingBottom = layout?.paddingBottom ?? 0;
        const paddingLeft = layout?.paddingLeft ?? 0;
        const paddingRight = layout?.paddingRight ?? 0;
        const spacingX = layout?.spacingX ?? 0;
        const spacingY = layout?.spacingY ?? 0;
        const availableWidth = Math.max(itemTransform.width, contentTransform.width - paddingLeft - paddingRight);
        const columns = Math.max(1, Math.floor((availableWidth + spacingX) / (itemTransform.width + spacingX)));
        const rows = Math.ceil(itemCount / columns);
        return paddingTop + paddingBottom + rows * itemTransform.height + Math.max(0, rows - 1) * spacingY;
    }

    private updateTabSprites() {
        this.setTabSprite(this.decorateNode, this.selectedCategory === 'decorate');
        this.setTabSprite(this.presentNode, this.selectedCategory === 'present');
        this.setTabSprite(this.propNode, this.selectedCategory === 'prop');
    }

    private setTabSprite(node: Node | null, selected: boolean) {
        const sprite = node?.getComponent(Sprite) ?? null;
        if (!sprite) {
            return;
        }

        sprite.spriteFrame = selected ? this.selectedSpriteFrame : null;
    }

    private async loadSelectedSpriteFrame() {
        if (this.selectedSpriteFrame) {
            return;
        }

        this.selectedSpriteFrame = await new Promise<SpriteFrame | null>((resolve) => {
            resources.load(this.selectButtonSpritePath, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error('[BackPackPopupLayer] load selected tab sprite failed:', error);
                    resolve(null);
                    return;
                }
                resolve(spriteFrame ?? null);
            });
        });
    }

    private resolveNodes() {
        this.closeButtonNode ??= this.findNodeByPaths([
            'CloseButton',
            'PopupPanel/CloseButton',
            'BGTitle/CloseButton'
        ]);
        this.decorateNode ??= this.findNodeByPaths([
            'PopupPanel/TabBarNode/TabBarBgSprite/DecorateNode',
            'TabBarNode/TabBarBgSprite/DecorateNode',
            'DecorateNode'
        ]);
        this.presentNode ??= this.findNodeByPaths([
            'PopupPanel/TabBarNode/TabBarBgSprite/PresentNode',
            'TabBarNode/TabBarBgSprite/PresentNode'
        ]);
        this.propNode ??= this.findNodeByPaths([
            'PopupPanel/TabBarNode/TabBarBgSprite/PropNode',
            'TabBarNode/TabBarBgSprite/PropNode'
        ]);
        this.emptyNode ??= this.findNodeByPaths([
            'PopupPanel/EmptyNode',
            'EmptyNode'
        ]);
        this.scrollViewNode ??= this.findNodeByPaths([
            'PopupPanel/ItemPanel/ScrollView',
            'PopupPanel/ItemNode/ScrollView',
            'ItemPanel/ScrollView',
            'ItemNode/ScrollView',
            'ScrollView'
        ]);
        this.contentNode ??= this.findNodeByPaths([
            'PopupPanel/ItemPanel/ScrollView/view/content',
            'PopupPanel/ItemNode/ScrollView/view/content',
            'ItemPanel/ScrollView/view/content',
            'ItemNode/ScrollView/view/content',
            'ScrollView/view/content'
        ]);
        if (!this.contentNode?.isValid) {
            const scrollView = this.scrollViewNode?.getComponent(ScrollView) ?? null;
            this.contentNode = scrollView?.content
                ?? this.scrollViewNode?.getChildByPath('view/content')
                ?? null;
        }
        this.itemTemplateNode ??= this.contentNode?.getChildByName('ItemNode') ?? null;
    }
}
