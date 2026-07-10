import {
    _decorator,
    Button,
    instantiate,
    Label,
    Node,
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
import { BundleResourceLoader } from './BundleResourceLoader';

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
    basePosition: Vec3;
    baseAngle: number;
}

@ccclass('FlipRewardPopupLayer')
export class FlipRewardPopupLayer extends BaseUI {
    private readonly diamondCost = 10;
    private readonly standardMultiplier = 1;
    private readonly adMultiplier = 2;
    private readonly diamondMultiplier = 5;
    private popupPanel: Node | null = null;
    private getResourceNode: Node | null = null;
    private flyNode: Node | null = null;
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
    private cardBasePositions: Vec3[] = [];
    private cardBaseScales: Vec3[] = [];

    protected onInit() {
        super.onInit();
        this.resolveNodes();
        if (this.state === 'closed') {
            this.node.active = false;
        }
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
            this.loadSpriteFrame('image/icon_coin/spriteFrame').then(frame => this.coinSpriteFrame = frame),
            this.loadSpriteFrame('image/icon_diamond/spriteFrame').then(frame => this.diamondSpriteFrame = frame),
            this.loadSpriteFrame('image/flip_reward/flip_card_back/spriteFrame').then(frame => this.cardBackSpriteFrame = frame),
            this.loadSpriteFrame('image/flip_reward/flip_card_front/spriteFrame').then(frame => this.cardFrontSpriteFrame = frame),
            this.loadSpriteFrame('image/flip_reward/flip_card_glow/spriteFrame').then(frame => this.cardGlowSpriteFrame = frame),
            this.loadSpriteFrame('image/flip_reward/flip_fly_glow/spriteFrame').then(frame => this.flyGlowSpriteFrame = frame)
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
        this.setClaimVisualMode(false);
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
        this.cards.forEach(card => {
            Tween.stopAllByTarget(card.node);
            card.node.setPosition(card.basePosition);
            card.node.angle = card.baseAngle;
            card.node.setScale(0.02, card.baseScale.y * 0.96, card.baseScale.z);
            this.setCardFace(card, true);
            if (card.glow) {
                card.glow.active = false;
            }
            const opacity = card.node.getComponent(UIOpacity) ?? card.node.addComponent(UIOpacity);
            opacity.opacity = 0;
        });

        await Promise.all(this.cards.map((card, index) => this.playCardExpand(card, index * 0.12)));
        if (this.state !== 'intro' || !this.node.active) {
            return;
        }

        await this.wait(1.0);
        if (this.state !== 'intro' || !this.node.active) {
            return;
        }

        await Promise.all(this.cards.map((card, index) => this.flipCard(card, false, index * 0.06)));
        if (this.state === 'intro') {
            this.shuffleRewardsAfterPreview();
            await this.playShuffleCards();
        }

        if (this.state === 'intro') {
            this.state = 'waiting';
        }
    }

    private playCardExpand(card: FlipCardView, delay: number): Promise<void> {
        return new Promise(resolve => {
            if (!card.node.isValid || !this.node.active) {
                resolve();
                return;
            }

            const opacity = card.node.getComponent(UIOpacity) ?? card.node.addComponent(UIOpacity);
            tween(opacity)
                .delay(delay)
                .to(0.08, { opacity: 255 }, { easing: 'quadOut' })
                .start();

            tween(card.node)
                .delay(delay)
                .to(0.22, { scale: new Vec3(card.baseScale.x * 1.04, card.baseScale.y, card.baseScale.z) }, { easing: 'quadOut' })
                .to(0.12, { scale: card.baseScale }, { easing: 'backOut' })
                .call(() => resolve())
                .start();
        });
    }

    private async playShuffleCards() {
        if (this.cards.length < 2 || this.state !== 'intro' || !this.node.active) {
            return;
        }

        const tracks = this.cards.map(card => card.basePosition.clone());
        const first = tracks[0];
        const second = tracks[1] ?? first;
        const third = tracks[2] ?? second;
        const shuffleRounds = [
            [third, second, first],
            [first, second, third]
        ];

        for (let roundIndex = 0; roundIndex < shuffleRounds.length; roundIndex++) {
            if (this.state !== 'intro' || !this.node.active) {
                return;
            }

            await this.moveCardsToPositions(shuffleRounds[roundIndex], roundIndex);
        }

        this.cards.forEach(card => {
            card.node.setPosition(card.basePosition);
            card.node.setScale(card.baseScale);
            card.node.angle = card.baseAngle;
        });
    }

    private moveCardsToPositions(positions: Vec3[], roundIndex: number): Promise<void> {
        return new Promise(resolve => {
            let completed = 0;
            const finishOne = () => {
                completed++;
                if (completed >= this.cards.length) {
                    resolve();
                }
            };

            this.cards.forEach((card, index) => {
                const target = positions[index] ?? card.basePosition;
                Tween.stopAllByTarget(card.node);
                card.node.setSiblingIndex(index === 1 ? this.cards.length - 1 : index);
                tween(card.node)
                    .to(0.34, {
                        position: target,
                        scale: new Vec3(card.baseScale.x * 1.025, card.baseScale.y * 1.025, card.baseScale.z),
                        angle: card.baseAngle + (index - 1) * 4 * (roundIndex % 2 === 0 ? 1 : -1)
                    }, { easing: 'sineInOut' })
                    .to(0.1, {
                        scale: card.baseScale,
                        angle: card.baseAngle
                    }, { easing: 'quadOut' })
                    .call(finishOne)
                    .start();
            });
        });
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

        this.setClaimVisualMode(true);
        void this.playClaimAnimation(selectedReward.type)
            .then(() => {
                dataManager.updateUserData({ diamond: nextDiamond, gold: nextGold });
                this.syncResourceLabels();
            })
            .then(() => this.wait(0.2))
            .then(() => this.close());
    }

    private async playClaimAnimation(type: FlipRewardType) {
        if (!this.flyEffectNode?.isValid) {
            return;
        }

        const targetNode = this.findResourceTargetNode(type);
        const targetWorld = targetNode ? this.getWorldCenter(targetNode) : this.flyEffectNode.worldPosition.clone().add(new Vec3(240, 460, 0));
        const particles = 8;
        const tasks: Promise<void>[] = [];

        for (let i = 0; i < particles; i++) {
            const offset = new Vec3((i % 4 - 1.5) * 18, Math.floor(i / 4) * 18 - 9, 0);
            tasks.push(this.flyOneReward(type, offset, targetWorld));
        }

        await Promise.all(tasks);
    }

    private flyOneReward(type: FlipRewardType, offset: Vec3, targetWorld: Vec3): Promise<void> {
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
            const target = parentTransform?.convertToNodeSpaceAR(targetWorld) ?? targetWorld;
            const start = new Vec3(offset.x, offset.y, 0);
            const opacity = flyNode.getComponent(UIOpacity) ?? flyNode.addComponent(UIOpacity);
            opacity.opacity = 0;
            flyNode.setPosition(start);
            flyNode.setScale(0.9, 0.9, 1);

            tween(opacity)
                .to(0.3, { opacity: 255 }, { easing: 'quadOut' })
                .delay(0.72)
                .to(0.16, { opacity: 0 }, { easing: 'quadIn' })
                .start();

            tween(flyNode)
                .delay(0.5)
                .to(0.68, { position: target }, { easing: 'sineInOut' })
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
            if (!this.cardBasePositions[index]) {
                this.cardBasePositions[index] = card.node.position.clone();
            }
            if (!this.cardBaseScales[index]) {
                this.cardBaseScales[index] = card.node.scale.clone();
            }

            card.reward = rewards[index];
            card.basePosition = this.cardBasePositions[index].clone();
            card.baseScale = this.cardBaseScales[index].clone();
            card.baseAngle = index === 0 ? 8 : index === 2 ? -8 : 0;
            card.node.active = true;
            card.node.setPosition(card.basePosition);
            card.node.setScale(card.baseScale);
            card.node.angle = card.baseAngle;
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
        this.setClaimVisualMode(false);
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
        this.getResourceNode = this.findNodeByPaths(['PopupPanel/GetResourceNode']);
        this.flyNode = this.findNodeByPaths(['PopupPanel/FlyNode']);
        this.titleLabel = this.findComponentByPaths(['PopupPanel/GetResourceNode/TitleNode/TitleLabel'], Label);
        this.closeButtonNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/TitleNode/CloseButton']);
        this.resourcesPanel = this.findNodeByPaths(['PopupPanel/FlyNode/ResourcesPanel']);
        this.resourcesDiamondLabel = this.findComponentByPaths([
            'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondLabel',
            'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/CountLabel',
            'PopupPanel/FlyNode/ResourcesPanel/DiamondLabel'
        ], Label);
        this.resourcesGoldLabel = this.findComponentByPaths([
            'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldLabel',
            'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/CountLabel',
            'PopupPanel/FlyNode/ResourcesPanel/GoldLabel'
        ], Label);
        this.starEffectNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/StarEffectNode']);
        this.cardGroupNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/CardGroupNode']);
        this.buttonNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonNode']);
        this.standardButtonNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonNode/StandardButton']);
        this.doubleButtonNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonNode/DoubleButton']);
        this.fiveTimesNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonNode/FiveTimesNode']);
        this.fiveTimesButtonNode = this.findNodeByPaths(['PopupPanel/GetResourceNode/ButtonNode/FiveTimesNode/FiveTimeButton']);
        this.flyEffectNode = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode']);
        this.flyCoinTemplate = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode/FlyCoinTemplate']);
        this.flyDiamondTemplate = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode/FlyDiamondTemplate']);
        this.flyGlowTemplate = this.findNodeByPaths(['PopupPanel/FlyNode/FlyEffectNode/FlyGlowTemplate']);
        if (this.titleLabel) {
            this.titleLabel.string = '翻牌抽奖';
        }
    }

    private resolveCards(): FlipCardView[] {
        const cardGroup = this.cardGroupNode ?? this.findNodeByPaths(['PopupPanel/GetResourceNode/CardGroupNode']);
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
                baseScale: node.scale.clone(),
                basePosition: node.position.clone(),
                baseAngle: node.angle
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

    private shuffleRewardsAfterPreview() {
        const rewards = this.cards.map(card => card.reward);
        if (rewards.length <= 1) {
            return;
        }

        const shuffledRewards = rewards.slice();
        for (let index = shuffledRewards.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffledRewards[index], shuffledRewards[swapIndex]] = [shuffledRewards[swapIndex], shuffledRewards[index]];
        }

        const unchanged = shuffledRewards.every((reward, index) => reward === rewards[index]);
        if (unchanged) {
            shuffledRewards.push(shuffledRewards.shift()!);
        }

        this.cards.forEach((card, index) => {
            card.reward = shuffledRewards[index];
            this.applyRewardToCard(card);
            this.setCardFace(card, false);
        });
    }

    private pick<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }

    private findResourceTargetNode(type: FlipRewardType): Node | null {
        const canvas = this.getCanvasNode();
        const paths = type === 'DIAMOND'
            ? [
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondIcon',
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamondSprite',
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel/DiamontSprite',
                'PopupPanel/FlyNode/ResourcesPanel/DiamondPanel',
                'PopupPanel/FlyNode/ResourcesPanel'
            ]
            : [
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldIcon',
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/GoldSprite',
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel/CoinSprite',
                'PopupPanel/FlyNode/ResourcesPanel/GoldPanel',
                'PopupPanel/FlyNode/ResourcesPanel'
            ];
        return this.findNodeByPaths(paths, this.node) ?? this.findNodeByPaths(paths, canvas);
    }

    private setClaimVisualMode(claiming: boolean) {
        if (this.getResourceNode?.isValid) {
            this.getResourceNode.active = !claiming;
        }
        if (this.flyNode?.isValid) {
            this.flyNode.active = true;
        }
        if (this.flyEffectNode?.isValid) {
            this.flyEffectNode.active = claiming;
        }
        for (const template of [this.flyCoinTemplate, this.flyDiamondTemplate, this.flyGlowTemplate]) {
            if (template?.isValid) {
                template.active = false;
            }
        }
        if (!claiming) {
            this.clearFlyNodes();
        }
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
        return BundleResourceLoader.loadSpriteFrame(path);
    }

    private wait(seconds: number): Promise<void> {
        return new Promise(resolve => this.scheduleOnce(resolve, seconds));
    }
}
