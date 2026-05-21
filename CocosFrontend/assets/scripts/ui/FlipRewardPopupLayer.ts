import {
    _decorator,
    Button,
    instantiate,
    Label,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    UITransform,
    UIOpacity,
    Vec3
} from 'cc';
import { BaseUI } from './BaseUI';
import { dataManager } from '../core/DataManager';
import { Platform } from '../utils/Platform';

const { ccclass } = _decorator;

type FlipRewardType = 'GOLD' | 'DIAMOND';
type FlipRewardState = 'closed' | 'intro' | 'waiting' | 'revealing' | 'claimed';

interface FlipRewardItem {
    type: FlipRewardType;
    count: number;
}

interface FlipCardView {
    node: Node;
    back: Node | null;
    front: Node | null;
    frontBg: Sprite | null;
    rewardIcon: Sprite | null;
    rewardCountLabel: Label | null;
    glow: Node | null;
    reward: FlipRewardItem;
    baseScale: Vec3;
}

@ccclass('FlipRewardPopupLayer')
export class FlipRewardPopupLayer extends BaseUI {
    private readonly diamondCost = 10;
    private readonly standardMultiplier = 1;
    private readonly adMultiplier = 2;
    private readonly diamondMultiplier = 5;
    private popupPanel: Node | null = null;
    private titleLabel: Label | null = null;
    private closeButtonNode: Node | null = null;
    private resourcesPanel: Node | null = null;
    private resourcesDiamondLabel: Label | null = null;
    private resourcesGoldLabel: Label | null = null;
    private starEffectNode: Node | null = null;
    private cardGroupNode: Node | null = null;
    private buttonNode: Node | null = null;
    private standardButtonNode: Node | null = null;
    private doubleButtonNode: Node | null = null;
    private fiveTimesNode: Node | null = null;
    private fiveTimesButtonNode: Node | null = null;
    private flyEffectNode: Node | null = null;
    private flyCoinTemplate: Node | null = null;
    private flyDiamondTemplate: Node | null = null;
    private flyGlowTemplate: Node | null = null;
    private coinSpriteFrame: SpriteFrame | null = null;
    private diamondSpriteFrame: SpriteFrame | null = null;
    private cardBackSpriteFrame: SpriteFrame | null = null;
    private cardFrontSpriteFrame: SpriteFrame | null = null;
    private cardGlowSpriteFrame: SpriteFrame | null = null;
    private flyGlowSpriteFrame: SpriteFrame | null = null;
    private state: FlipRewardState = 'closed';
    private cards: FlipCardView[] = [];
    private selectedCardIndex = -1;
    private hasBoundEvents = false;
    private loadingAssetsTask: Promise<void> | null = null;

    protected onInit() {
        super.onInit();
        this.resolveNodes();
        this.node.active = false;
        void this.preload();
    }

    protected onCleanup() {
        this.stopAllTweens();
        this.node.targetOff(this);
        this.closeButtonNode?.targetOff(this);
        this.standardButtonNode?.targetOff(this);
        this.doubleButtonNode?.targetOff(this);
        this.fiveTimesButtonNode?.targetOff(this);
        this.cards.forEach(card => card.node.targetOff(this));
    }

    async preload() {
        this.resolveNodes();
        if (this.loadingAssetsTask) {
            return this.loadingAssetsTask;
        }

        this.loadingAssetsTask = Promise.all([
            this.loadSpriteFrame('tool/icon_coin/spriteFrame').then(frame => this.coinSpriteFrame = frame),
            this.loadSpriteFrame('tool/icon_diamond/spriteFrame').then(frame => this.diamondSpriteFrame = frame),
            this.loadSpriteFrame('tool/flip_reward/flip_card_back/spriteFrame').then(frame => this.cardBackSpriteFrame = frame),
            this.loadSpriteFrame('tool/flip_reward/flip_card_front/spriteFrame').then(frame => this.cardFrontSpriteFrame = frame),
            this.loadSpriteFrame('tool/flip_reward/flip_card_glow/spriteFrame').then(frame => this.cardGlowSpriteFrame = frame),
            this.loadSpriteFrame('tool/flip_reward/flip_fly_glow/spriteFrame').then(frame => this.flyGlowSpriteFrame = frame)
        ]).then(() => {
            this.applyStaticSprites();
        });

        return this.loadingAssetsTask;
    }

    open() {
        this.resolveNodes();
        this.bindEvents();
        this.node.active = true;
        this.node.setSiblingIndex(this.node.parent?.children.length ? this.node.parent.children.length - 1 : 0);
        this.resetRound();
        this.syncResourceLabels();
        this.playStarEffect();

        void this.preload().then(() => {
            if (!this.node.active) {
                return;
            }
            this.applyStaticSprites();
            this.cards.forEach(card => this.applyRewardToCard(card));
            void this.playIntro();
        });
    }

    close() {
        this.stopAllTweens();
        this.state = 'closed';
        this.node.active = false;
    }

    private async playIntro() {
        this.state = 'intro';
        this.showAllCardsFront(false);
        this.cards.forEach((card, index) => {
            card.node.setScale(0.9, 0.9, 1);
            tween(card.node)
                .delay(index * 0.05)
                .to(0.18, { scale: card.baseScale }, { easing: 'backOut' })
                .start();
        });

        await this.wait(0.75);
        if (this.state !== 'intro' || !this.node.active) {
            return;
        }

        await Promise.all(this.cards.map((card, index) => this.flipCard(card, false, index * 0.06)));
        if (this.state === 'intro') {
            this.state = 'waiting';
        }
    }

    private onCardClick(index: number) {
        if (this.state !== 'waiting') {
            return;
        }

        this.selectedCardIndex = index;
        this.state = 'revealing';
        void this.revealCards(index);
    }

    private async revealCards(selectedIndex: number) {
        const selectedCard = this.cards[selectedIndex];
        if (selectedCard) {
            await this.flipCard(selectedCard, true, 0);
            this.showSelectedGlow(selectedCard);
        }

        const others = this.cards
            .map((card, index) => ({ card, index }))
            .filter(item => item.index !== selectedIndex);
        await Promise.all(others.map((item, order) => this.flipCard(item.card, true, 0.12 + order * 0.1)));

        if (this.state !== 'revealing') {
            return;
        }

        this.state = 'revealing';
        if (this.buttonNode) {
            this.buttonNode.active = true;
            this.buttonNode.setScale(0.9, 0.9, 1);
            tween(this.buttonNode)
                .to(0.16, { scale: Vec3.ONE }, { easing: 'backOut' })
                .start();
        }
        this.floatSelectedCard(selectedCard);
    }

    private claim(multiplier: number, diamondCost: number) {
        if (this.state === 'claimed' || this.selectedCardIndex < 0) {
            return;
        }

        if (diamondCost > 0 && (dataManager.userData.diamond || 0) < diamondCost) {
            Platform.showToast('钻石不足', 'none');
            return;
        }

        const selectedReward = this.cards[this.selectedCardIndex]?.reward;
        if (!selectedReward) {
            return;
        }

        this.state = 'claimed';
        this.setButtonsInteractable(false);

        const finalCount = selectedReward.count * multiplier;
        const nextDiamond = Math.max(0, (dataManager.userData.diamond || 0) - diamondCost)
            + (selectedReward.type === 'DIAMOND' ? finalCount : 0);
        const nextGold = (dataManager.userData.gold || 0)
            + (selectedReward.type === 'GOLD' ? finalCount : 0);
        dataManager.updateUserData({ diamond: nextDiamond, gold: nextGold });
        this.syncResourceLabels();

        void this.playClaimAnimation(selectedReward.type).then(() => this.close());
    }

    private async playClaimAnimation(type: FlipRewardType) {
        const sourceNode = this.cards[this.selectedCardIndex]?.rewardIcon?.node ?? this.cards[this.selectedCardIndex]?.node;
        if (!sourceNode?.isValid || !this.flyEffectNode?.isValid) {
            return;
        }

        const targetNode = this.findResourceTargetNode(type);
        const sourceWorld = this.getWorldCenter(sourceNode);
        const targetWorld = targetNode ? this.getWorldCenter(targetNode) : new Vec3(300, 1160, 0);
        const particles = 8;
        const tasks: Promise<void>[] = [];

        for (let i = 0; i < particles; i++) {
            const delay = i * 0.035;
            const offset = new Vec3((i % 4 - 1.5) * 18, Math.floor(i / 4) * 18 - 9, 0);
            tasks.push(this.flyOneReward(type, sourceWorld.clone().add(offset), targetWorld, delay));
        }

        await Promise.all(tasks);
    }

    private flyOneReward(type: FlipRewardType, startWorld: Vec3, targetWorld: Vec3, delay: number): Promise<void> {
        return new Promise(resolve => {
            if (!this.flyEffectNode?.isValid) {
                resolve();
                return;
            }

            const template = type === 'DIAMOND' ? this.flyDiamondTemplate : this.flyCoinTemplate;
            const flyNode = template?.isValid ? instantiate(template) : new Node(type === 'DIAMOND' ? 'FlyDiamond' : 'FlyCoin');
            flyNode.active = true;
            flyNode.name = `FlipRewardFly_${Date.now()}`;
            this.flyEffectNode.addChild(flyNode);
            this.ensureSprite(flyNode).spriteFrame = type === 'DIAMOND' ? this.diamondSpriteFrame : this.coinSpriteFrame;
            flyNode.getComponent(UITransform)?.setContentSize(46, 46);

            const glow = this.flyGlowTemplate?.isValid ? instantiate(this.flyGlowTemplate) : new Node('FlyGlow');
            glow.active = true;
            glow.name = 'FlipRewardFlyGlow';
            flyNode.addChild(glow);
            this.ensureSprite(glow).spriteFrame = this.flyGlowSpriteFrame;
            glow.getComponent(UITransform)?.setContentSize(76, 76);
            glow.setSiblingIndex(0);

            const parentTransform = this.flyEffectNode.getComponent(UITransform);
            const start = parentTransform?.convertToNodeSpaceAR(startWorld) ?? startWorld;
            const target = parentTransform?.convertToNodeSpaceAR(targetWorld) ?? targetWorld;
            const mid = new Vec3((start.x + target.x) / 2, Math.max(start.y, target.y) + 90, 0);
            flyNode.setPosition(start);
            flyNode.setScale(0.55, 0.55, 1);

            tween(flyNode)
                .delay(delay)
                .to(0.12, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadOut' })
                .to(0.3, { position: mid }, { easing: 'quadOut' })
                .to(0.28, { position: target, scale: new Vec3(0.35, 0.35, 1) }, { easing: 'quadIn' })
                .call(() => {
                    flyNode.destroy();
                    resolve();
                })
                .start();
        });
    }

    private resetRound() {
        this.stopAllTweens();
        this.selectedCardIndex = -1;
        this.state = 'closed';
        this.cards = this.resolveCards();
        const rewards = this.createRoundRewards();
        this.cards.forEach((card, index) => {
            card.reward = rewards[index];
            card.baseScale = card.node.scale.clone();
            card.node.active = true;
            card.node.setScale(card.baseScale);
            card.node.angle = index === 0 ? 8 : index === 2 ? -8 : 0;
            this.applyRewardToCard(card);
            this.setCardFace(card, true);
            if (card.glow) {
                card.glow.active = false;
                card.glow.setScale(1, 1, 1);
            }
        });
        if (this.buttonNode) {
            this.buttonNode.active = false;
            this.buttonNode.setScale(1, 1, 1);
        }
        if (this.doubleButtonNode) {
            this.doubleButtonNode.active = true;
        }
        if (this.fiveTimesNode) {
            this.fiveTimesNode.active = true;
        }
        this.setButtonsInteractable(true);
        this.updateButtonLabels();
        this.clearFlyNodes();
    }

    private showAllCardsFront(showGlow: boolean) {
        this.cards.forEach(card => {
            this.setCardFace(card, true);
            if (card.glow) {
                card.glow.active = showGlow;
            }
        });
    }

    private setCardFace(card: FlipCardView, front: boolean) {
        if (card.back) {
            card.back.active = !front;
        }
        if (card.front) {
            card.front.active = front;
        }
    }

    private async flipCard(card: FlipCardView, showFront: boolean, delay: number = 0) {
        await this.wait(delay);
        if (!card.node.isValid || !this.node.active) {
            return;
        }

        return new Promise<void>(resolve => {
            const base = card.baseScale || Vec3.ONE;
            Tween.stopAllByTarget(card.node);
            tween(card.node)
                .to(0.12, { scale: new Vec3(0.02, base.y, base.z) }, { easing: 'quadIn' })
                .call(() => this.setCardFace(card, showFront))
                .to(0.14, { scale: base }, { easing: 'quadOut' })
                .call(() => resolve())
                .start();
        });
    }

    private showSelectedGlow(card: FlipCardView | undefined) {
        if (!card?.glow) {
            return;
        }

        card.glow.active = true;
        card.glow.setScale(0.88, 0.88, 1);
        tween(card.glow)
            .repeatForever(
                tween()
                    .to(0.65, { scale: new Vec3(1.06, 1.06, 1) }, { easing: 'sineOut' })
                    .to(0.65, { scale: new Vec3(0.92, 0.92, 1) }, { easing: 'sineIn' })
            )
            .start();
    }

    private floatSelectedCard(card: FlipCardView | undefined) {
        if (!card?.node) {
            return;
        }

        const basePosition = card.node.position.clone();
        tween(card.node)
            .repeatForever(
                tween()
                    .to(0.8, { position: new Vec3(basePosition.x, basePosition.y + 8, basePosition.z) }, { easing: 'sineOut' })
                    .to(0.8, { position: basePosition }, { easing: 'sineIn' })
            )
            .start();
    }

    private playStarEffect() {
        const stars = this.starEffectNode?.children ?? [];
        const positions = [
            new Vec3(-285, 235, 0),
            new Vec3(285, 235, 0),
            new Vec3(-315, 55, 0),
            new Vec3(315, 45, 0),
            new Vec3(-290, -245, 0),
            new Vec3(290, -245, 0),
            new Vec3(-210, 315, 0),
            new Vec3(210, 315, 0)
        ];
        const sizes = [30, 34, 28, 30, 26, 26, 24, 24];

        stars.forEach((star, index) => {
            const transform = star.getComponent(UITransform);
            transform?.setContentSize(sizes[index] ?? 32, sizes[index] ?? 32);
            star.setPosition(positions[index] ?? Vec3.ZERO);
            star.angle = index * 18;
            star.active = true;
            const opacity = star.getComponent(UIOpacity) ?? star.addComponent(UIOpacity);
            opacity.opacity = index % 2 === 0 ? 210 : 150;
            tween(star)
                .delay(index * 0.12)
                .repeatForever(
                    tween()
                        .to(0.55, { angle: star.angle + 28, scale: new Vec3(1.28, 1.28, 1) }, { easing: 'sineOut' })
                        .to(0.55, { angle: star.angle, scale: Vec3.ONE }, { easing: 'sineIn' })
                )
                .start();
            tween(opacity)
                .delay(index * 0.1)
                .repeatForever(
                    tween()
                        .to(0.48, { opacity: 255 })
                        .to(0.58, { opacity: 95 })
                )
                .start();
        });
    }

    private applyRewardToCard(card: FlipCardView) {
        if (card.frontBg && this.cardFrontSpriteFrame) {
            card.frontBg.spriteFrame = this.cardFrontSpriteFrame;
        }
        if (card.rewardIcon) {
            card.rewardIcon.spriteFrame = card.reward.type === 'DIAMOND'
                ? this.diamondSpriteFrame
                : this.coinSpriteFrame;
            card.rewardIcon.node.getComponent(UITransform)?.setContentSize(card.reward.type === 'DIAMOND' ? 76 : 84, card.reward.type === 'DIAMOND' ? 76 : 84);
        }
        if (card.rewardCountLabel) {
            card.rewardCountLabel.string = `x${card.reward.count}`;
        }
        if (card.back) {
            this.ensureSprite(card.back).spriteFrame = this.cardBackSpriteFrame;
        }
        if (card.glow) {
            this.ensureSprite(card.glow).spriteFrame = this.cardGlowSpriteFrame;
            card.glow.getComponent(UITransform)?.setContentSize(220, 290);
        }
    }

    private applyStaticSprites() {
        this.resolveCards().forEach(card => {
            if (card.back) {
                this.ensureSprite(card.back).spriteFrame = this.cardBackSpriteFrame;
            }
            if (card.frontBg) {
                card.frontBg.spriteFrame = this.cardFrontSpriteFrame;
            }
            if (card.glow) {
                this.ensureSprite(card.glow).spriteFrame = this.cardGlowSpriteFrame;
            }
        });
        if (this.flyCoinTemplate) {
            this.ensureSprite(this.flyCoinTemplate).spriteFrame = this.coinSpriteFrame;
            this.flyCoinTemplate.active = false;
        }
        if (this.flyDiamondTemplate) {
            this.ensureSprite(this.flyDiamondTemplate).spriteFrame = this.diamondSpriteFrame;
            this.flyDiamondTemplate.active = false;
        }
        if (this.flyGlowTemplate) {
            this.ensureSprite(this.flyGlowTemplate).spriteFrame = this.flyGlowSpriteFrame;
            this.flyGlowTemplate.active = false;
        }
    }

    private updateButtonLabels() {
        this.setLabel(this.standardButtonNode, ['Label'], '领取');
        this.setLabel(this.fiveTimesButtonNode, ['Label'], `${this.diamondMultiplier}倍领取`);
        this.setLabel(this.fiveTimesNode, ['RewardNode/CountLabel', 'CountLabel'], String(this.diamondCost));
    }

    private setButtonsInteractable(interactable: boolean) {
        [this.standardButtonNode, this.doubleButtonNode, this.fiveTimesButtonNode].forEach(node => {
            const button = node?.getComponent(Button);
            if (button) {
                button.interactable = interactable;
            }
        });
    }

    private bindEvents() {
        if (this.hasBoundEvents) {
            return;
        }

        this.bindClick(this.closeButtonNode, () => this.close(), 'CloseButton');
        this.bindClick(this.standardButtonNode, () => this.claim(this.standardMultiplier, 0), 'StandardButton');
        this.bindClick(this.doubleButtonNode, () => this.claimWithAd(), 'DoubleButton');
        this.bindClick(this.fiveTimesButtonNode, () => this.claim(this.diamondMultiplier, this.diamondCost), 'FiveTimeButton');
        this.resolveCards().forEach((card, index) => {
            this.bindClick(card.node, () => this.onCardClick(index), `CardNode0${index + 1}`);
        });
        this.hasBoundEvents = true;
    }

    private claimWithAd() {
        console.log('[FlipRewardPopupLayer] claim with rewarded ad');
        this.claim(this.adMultiplier, 0);
    }

    private bindClick(node: Node | null, handler: () => void, debugName: string) {
        if (!node?.isValid) {
            console.warn(`[FlipRewardPopupLayer] bind click failed: ${debugName}`);
            return;
        }

        node.targetOff(this);
        const button = node.getComponent(Button);
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
            return;
        }

        node.on(Node.EventType.TOUCH_END, wrappedHandler, this);
    }

    private resolveNodes() {
        this.popupPanel = this.node.getChildByPath('PopupPanel') ?? null;
        this.titleLabel = this.findComponentByPaths(['PopupPanel/TitleNode/TitleLabel'], Label);
        this.closeButtonNode = this.findNodeByPaths(['PopupPanel/TitleNode/CloseButton']);
        this.resourcesPanel = this.findNodeByPaths(['PopupPanel/ResourcesPanel']);
        this.resourcesDiamondLabel = this.findComponentByPaths([
            'PopupPanel/ResourcesPanel/DiamondPanel/DiamondLabel',
            'PopupPanel/ResourcesPanel/DiamondPanel/CountLabel',
            'PopupPanel/ResourcesPanel/DiamondLabel'
        ], Label);
        this.resourcesGoldLabel = this.findComponentByPaths([
            'PopupPanel/ResourcesPanel/GoldPanel/GoldLabel',
            'PopupPanel/ResourcesPanel/GoldPanel/CountLabel',
            'PopupPanel/ResourcesPanel/GoldLabel'
        ], Label);
        this.starEffectNode = this.findNodeByPaths([
            'PopupPanel/StarEffectNode',
            'PopupPanel/FlyEffectNode/StarEffectNode'
        ]);
        this.cardGroupNode = this.findNodeByPaths(['PopupPanel/CardGroupNode']);
        this.buttonNode = this.findNodeByPaths(['PopupPanel/ButtonNode']);
        this.standardButtonNode = this.findNodeByPaths(['PopupPanel/ButtonNode/StandardButton']);
        this.doubleButtonNode = this.findNodeByPaths(['PopupPanel/ButtonNode/DoubleButton']);
        this.fiveTimesNode = this.findNodeByPaths(['PopupPanel/ButtonNode/FiveTimesNode']);
        this.fiveTimesButtonNode = this.findNodeByPaths(['PopupPanel/ButtonNode/FiveTimesNode/FiveTimeButton']);
        this.flyEffectNode = this.findNodeByPaths(['PopupPanel/FlyEffectNode']);
        this.flyCoinTemplate = this.findNodeByPaths(['PopupPanel/FlyEffectNode/FlyCoinTemplate']);
        this.flyDiamondTemplate = this.findNodeByPaths(['PopupPanel/FlyEffectNode/FlyDiamondTemplate']);
        this.flyGlowTemplate = this.findNodeByPaths(['PopupPanel/FlyEffectNode/FlyGlowTemplate']);
        if (this.titleLabel) {
            this.titleLabel.string = '翻牌抽奖';
        }
    }

    private resolveCards(): FlipCardView[] {
        const cardGroup = this.cardGroupNode ?? this.findNodeByPaths(['PopupPanel/CardGroupNode']);
        if (!cardGroup) {
            return [];
        }

        return ['CardNode01', 'CardNode02', 'CardNode03'].map((name): FlipCardView | null => {
            const node = cardGroup.getChildByName(name);
            if (!node) {
                return null;
            }

            return {
                node,
                back: node.getChildByName('CardBackSprite'),
                front: node.getChildByName('CardFrontNode'),
                frontBg: node.getChildByPath('CardFrontNode/CardFrontBgSprite')?.getComponent(Sprite) ?? null,
                rewardIcon: node.getChildByPath('CardFrontNode/RewardIconSprite')?.getComponent(Sprite) ?? null,
                rewardCountLabel: node.getChildByPath('CardFrontNode/RewardCountLabel')?.getComponent(Label) ?? null,
                glow: node.getChildByName('SelectGlowSprite'),
                reward: { type: 'GOLD', count: 0 },
                baseScale: node.scale.clone()
            };
        }).filter((card): card is FlipCardView => !!card);
    }

    private createRoundRewards(): FlipRewardItem[] {
        const goldRewards = [59, 88, 100, 128, 188];
        const diamondRewards = [1, 2, 3];
        const rewards: FlipRewardItem[] = [
            { type: 'GOLD', count: this.pick(goldRewards) },
            { type: 'GOLD', count: this.pick(goldRewards) },
            { type: 'DIAMOND', count: this.pick(diamondRewards) }
        ];

        return rewards.sort(() => Math.random() - 0.5);
    }

    private pick<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }

    private findResourceTargetNode(type: FlipRewardType): Node | null {
        const canvas = this.getCanvasNode();
        const paths = type === 'DIAMOND'
            ? [
                'PopupPanel/ResourcesPanel/DiamondPanel/DiamondIcon',
                'PopupPanel/ResourcesPanel/DiamondPanel/DiamondSprite',
                'PopupPanel/ResourcesPanel/DiamondPanel/DiamontSprite',
                'PopupPanel/ResourcesPanel/DiamondPanel',
                'PopupPanel/ResourcesPanel',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondIcon',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondSprite',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel',
                'HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel'
            ]
            : [
                'PopupPanel/ResourcesPanel/GoldPanel/GoldIcon',
                'PopupPanel/ResourcesPanel/GoldPanel/GoldSprite',
                'PopupPanel/ResourcesPanel/GoldPanel/CoinSprite',
                'PopupPanel/ResourcesPanel/GoldPanel',
                'PopupPanel/ResourcesPanel',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldIcon',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldSprite',
                'Home/HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel',
                'HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel'
            ];
        return this.findNodeByPaths(paths, this.node) ?? this.findNodeByPaths(paths, canvas);
    }

    private syncResourceLabels() {
        this.resolveNodes();
        if (this.resourcesDiamondLabel) {
            this.resourcesDiamondLabel.string = String(dataManager.userData.diamond || 0);
        }
        if (this.resourcesGoldLabel) {
            this.resourcesGoldLabel.string = String(dataManager.userData.gold || 0);
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

        return null;
    }

    private getWorldCenter(node: Node): Vec3 {
        const transform = node.getComponent(UITransform);
        return transform?.convertToWorldSpaceAR(Vec3.ZERO) ?? node.worldPosition.clone();
    }

    private ensureSprite(node: Node): Sprite {
        return node.getComponent(Sprite) ?? node.addComponent(Sprite);
    }

    private setLabel(root: Node | null, paths: string[], value: string) {
        if (!root) {
            return;
        }

        const label = this.findComponentByPaths(paths, Label, root);
        if (label) {
            label.string = value;
        }
    }

    private clearFlyNodes() {
        if (!this.flyEffectNode) {
            return;
        }

        this.flyEffectNode.children
            .filter(child => child.name.startsWith('FlipRewardFly_'))
            .forEach(child => child.destroy());
    }

    private stopAllTweens() {
        if (this.buttonNode) {
            Tween.stopAllByTarget(this.buttonNode);
        }
        if (this.starEffectNode) {
            Tween.stopAllByTarget(this.starEffectNode);
        }
        this.starEffectNode?.children.forEach(star => {
            Tween.stopAllByTarget(star);
            const opacity = star.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
            }
        });
        this.cards.forEach(card => {
            Tween.stopAllByTarget(card.node);
            if (card.glow) {
                Tween.stopAllByTarget(card.glow);
            }
        });
    }

    private async loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        return new Promise(resolve => {
            resources.load(path, SpriteFrame, (error, frame) => {
                if (error) {
                    console.warn(`[FlipRewardPopupLayer] load sprite failed: ${path}`, error);
                    resolve(null);
                    return;
                }
                resolve(frame);
            });
        });
    }

    private wait(seconds: number): Promise<void> {
        return new Promise(resolve => this.scheduleOnce(resolve, seconds));
    }
}
