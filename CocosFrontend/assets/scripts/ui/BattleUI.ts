/**
 * BattleUI - 对战界面控制器
 */

import {
    _decorator,
    assetManager,
    Button,
    Color,
    ImageAsset,
    instantiate,
    Label,
    Layout,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    Texture2D,
    tween,
    UIOpacity,
    UITransform,
    Vec3
} from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { dataManager } from '../core/DataManager';
import { gameManager, GameState } from '../core/GameManager';
import { Platform } from '../utils/Platform';

const { ccclass, property } = _decorator;

type BattleMode = 'SOLO' | 'DUO';
type MechanismPlacement = 0 | 1 | 2 | 3 | 4 | 'random' | 'bottom';
type BattleCardId =
    | 'OUT_OF_CONTROL'
    | 'SAFETY_WRENCH'
    | 'DETECTION_RADAR'
    | 'SURVEILLANCE_LENS'
    | 'SNATCHING_BAG'
    | 'BACKPACK_INTERCHANGE'
    | 'RESTART_WORKSHOP'
    | 'PRETEND_STUPID'
    | 'REVERSE_TRANSMISSION'
    | 'BLAME_SHIFTING'
    | 'BLAME_SHIFTING_X2'
    | 'LOW_LEVEL_CHANNEL';

interface BattleCardDefinition {
    id: BattleCardId;
    name: string;
    type: string;
    timing: string;
    desc: string;
    spritePath: string;
}

interface BattleDeckConfigItem {
    id: BattleCardId;
    count: number;
}

interface BattleCardInstance {
    id: BattleCardId;
    serialNo: number;
}

interface BattlePlayerModel {
    playerIndex: number;
    username: string;
    avatarUrl?: string;
    handCards: BattleCardInstance[];
    isAlive: boolean;
    isAi: boolean;
}

const HAND_CARD_COUNT = 5;
const VISIBLE_OPPONENT_COUNT = 4;
const SWAP_COUNTDOWN_SECONDS = 5;
const DEFAULT_SWAP_DIAMOND_COST = 10;
const HAND_SELECTED_OFFSET_Y = 24;
const DRAW_EFFECT_CARD_WIDTH = 116;
const DRAW_EFFECT_CARD_HEIGHT = 160;
const PLAY_EFFECT_CARD_WIDTH = 112;
const PLAY_EFFECT_CARD_HEIGHT = 154;
const CURRENT_DRAW_TARGET_SCALE = 0.82;
const OPPONENT_DRAW_MIN_SCALE = 0.48;
const OPPONENT_DRAW_MAX_SCALE = 0.62;
const OPPONENT_PLAY_START_SCALE = 0.48;
const CURRENT_PLAY_START_SCALE = 0.92;
const DANGER_CARD_ID: BattleCardId = 'OUT_OF_CONTROL';

const CARD_DEFINITIONS: Record<BattleCardId, BattleCardDefinition> = {
    OUT_OF_CONTROL: {
        id: 'OUT_OF_CONTROL',
        name: '失控机关',
        type: '危险牌',
        timing: '摸到时',
        desc: '若没有安全扳手，玩家出局',
        spritePath: 'image/battle/out-of-control_mechanism/spriteFrame'
    },
    SAFETY_WRENCH: {
        id: 'SAFETY_WRENCH',
        name: '安全扳手',
        type: '防御牌',
        timing: '摸到失控机关时',
        desc: '解除一次失控机关，并将机关重新放回牌堆任意位置',
        spritePath: 'image/battle/safety_wrench/spriteFrame'
    },
    DETECTION_RADAR: {
        id: 'DETECTION_RADAR',
        name: '侦测雷达',
        type: '探查牌',
        timing: '摸牌前',
        desc: '查看下一张失控机关距离牌堆顶部第几张',
        spritePath: 'image/battle/detection_radar/spriteFrame'
    },
    SURVEILLANCE_LENS: {
        id: 'SURVEILLANCE_LENS',
        name: '监控镜片',
        type: '探查牌',
        timing: '摸牌前',
        desc: '查看牌堆顶部 3 张牌',
        spritePath: 'image/battle/surveillance_lens/spriteFrame'
    },
    SNATCHING_BAG: {
        id: 'SNATCHING_BAG',
        name: '顺手牵包',
        type: '干扰牌',
        timing: '摸牌前',
        desc: '指定一名玩家，对方选择 1 张手牌交给你',
        spritePath: 'image/battle/snatching_a_bag/spriteFrame'
    },
    BACKPACK_INTERCHANGE: {
        id: 'BACKPACK_INTERCHANGE',
        name: '背包互换',
        type: '强干扰牌',
        timing: '摸牌前',
        desc: '指定一名玩家，交换双方全部手牌',
        spritePath: 'image/battle/backpack_interchange/spriteFrame'
    },
    RESTART_WORKSHOP: {
        id: 'RESTART_WORKSHOP',
        name: '重启工坊',
        type: '控制牌',
        timing: '摸牌前',
        desc: '打乱整个牌堆顺序',
        spritePath: 'image/battle/restart_workshop/spriteFrame'
    },
    PRETEND_STUPID: {
        id: 'PRETEND_STUPID',
        name: '原地装傻',
        type: '生存牌',
        timing: '摸牌前',
        desc: '跳过本次摸牌，直接结束回合',
        spritePath: 'image/battle/pretend_to_be_stupid/spriteFrame'
    },
    REVERSE_TRANSMISSION: {
        id: 'REVERSE_TRANSMISSION',
        name: '反向传送',
        type: '顺序牌',
        timing: '摸牌前',
        desc: '跳过本次摸牌，并反转行动顺序',
        spritePath: 'image/battle/reverse_transmission/spriteFrame'
    },
    BLAME_SHIFTING: {
        id: 'BLAME_SHIFTING',
        name: '甩锅按钮',
        type: '转移牌',
        timing: '摸牌前',
        desc: '跳过自己的摸牌，指定一名玩家立即摸牌',
        spritePath: 'image/battle/blame-shifting_button/spriteFrame'
    },
    BLAME_SHIFTING_X2: {
        id: 'BLAME_SHIFTING_X2',
        name: '甩锅X2',
        type: '转移牌',
        timing: '摸牌前',
        desc: '跳过自己的摸牌，指定一名玩家立即摸两次牌',
        spritePath: 'image/battle/blame-shifting_button/spriteFrame'
    },
    LOW_LEVEL_CHANNEL: {
        id: 'LOW_LEVEL_CHANNEL',
        name: '底层通道',
        type: '摸牌替代牌',
        timing: '摸牌阶段',
        desc: '不摸顶部，改为摸牌堆底部 1 张',
        spritePath: 'image/battle/low-level_channel/spriteFrame'
    }
};

const SOLO_CARD_DECK_CONFIG: BattleDeckConfigItem[] = [
    { id: 'OUT_OF_CONTROL', count: 4 },
    { id: 'SAFETY_WRENCH', count: 6 },
    { id: 'DETECTION_RADAR', count: 4 },
    { id: 'SURVEILLANCE_LENS', count: 4 },
    { id: 'SNATCHING_BAG', count: 4 },
    { id: 'BACKPACK_INTERCHANGE', count: 3 },
    { id: 'RESTART_WORKSHOP', count: 4 },
    { id: 'PRETEND_STUPID', count: 7 },
    { id: 'REVERSE_TRANSMISSION', count: 5 },
    { id: 'BLAME_SHIFTING', count: 5 },
    { id: 'BLAME_SHIFTING_X2', count: 3 },
    { id: 'LOW_LEVEL_CHANNEL', count: 4 }
];

const DUO_CARD_DECK_CONFIG: BattleDeckConfigItem[] = [
    { id: 'OUT_OF_CONTROL', count: 5 },
    { id: 'SAFETY_WRENCH', count: 7 },
    { id: 'DETECTION_RADAR', count: 5 },
    { id: 'SURVEILLANCE_LENS', count: 5 },
    { id: 'SNATCHING_BAG', count: 4 },
    { id: 'BACKPACK_INTERCHANGE', count: 3 },
    { id: 'RESTART_WORKSHOP', count: 5 },
    { id: 'PRETEND_STUPID', count: 7 },
    { id: 'REVERSE_TRANSMISSION', count: 6 },
    { id: 'BLAME_SHIFTING', count: 6 },
    { id: 'BLAME_SHIFTING_X2', count: 3 },
    { id: 'LOW_LEVEL_CHANNEL', count: 4 }
];

const CARD_DEFINITION_LIST = [
    CARD_DEFINITIONS.OUT_OF_CONTROL,
    CARD_DEFINITIONS.SAFETY_WRENCH,
    CARD_DEFINITIONS.DETECTION_RADAR,
    CARD_DEFINITIONS.SURVEILLANCE_LENS,
    CARD_DEFINITIONS.SNATCHING_BAG,
    CARD_DEFINITIONS.BACKPACK_INTERCHANGE,
    CARD_DEFINITIONS.RESTART_WORKSHOP,
    CARD_DEFINITIONS.PRETEND_STUPID,
    CARD_DEFINITIONS.REVERSE_TRANSMISSION,
    CARD_DEFINITIONS.BLAME_SHIFTING,
    CARD_DEFINITIONS.BLAME_SHIFTING_X2,
    CARD_DEFINITIONS.LOW_LEVEL_CHANNEL
];

const MOCK_OPPONENT_NAMES = [
    '奶酪猎手',
    '毛线工匠',
    '夜班猫',
    '罐头守卫',
    '纸箱队长',
    '爪爪工程师',
    '铜铃学徒',
    '午睡专家'
];

@ccclass('BattleUI')
export class BattleUI extends BaseUI {
    static sceneName: string = SceneName.Battle;

    gameState: GameState | null = null;
    selectedCard: string | null = null;

    @property(Label)
    playerNameLabel: Label | null = null;

    @property(Label)
    opponentNameLabel: Label | null = null;

    @property(Label)
    turnLabel: Label | null = null;

    @property(Node)
    cardContainer: Node | null = null;

    @property(Button)
    playCardBtn: Button | null = null;

    @property(Button)
    drawCardBtn: Button | null = null;

    @property(Button)
    backBtn: Button | null = null;

    private battleMode: BattleMode = 'SOLO';
    private players: BattlePlayerModel[] = [];
    private deck: BattleCardInstance[] = [];
    private handCards: BattleCardInstance[] = [];
    private cardSerialNo = 0;
    private currentPlayerIndex = 0;
    private turnDirection: 1 | -1 = 1;
    private turnsEnabled = false;
    private selectedHandIndex = -1;
    private hasDrawnThisTurn = false;
    private pendingCurrentDrawSerialNo: number | null = null;
    private pendingMechanismCard: BattleCardInstance | null = null;
    private swapCountdown = 0;
    private swapDiamondCost = DEFAULT_SWAP_DIAMOND_COST;
    private cardSpriteFrames = new Map<BattleCardId, SpriteFrame>();
    private avatarSpriteFrame: SpriteFrame | null = null;
    private redButtonSpriteFrame: SpriteFrame | null = null;
    private grayButtonSpriteFrame: SpriteFrame | null = null;

    onInit() {
        super.onInit();
        this.gameState = gameManager.gameState;
    }

    onEnter(data?: SceneData) {
        console.log('[BattleUI] Battle entered', data ?? {});
        void this.initializeBattle(data);
    }

    onExit() {
        console.log('[BattleUI] Battle exited');
        this.stopSwapCountdown();
        this.stopAiTurn();
    }

    private async initializeBattle(data?: SceneData) {
        this.cardSerialNo = 0;
        this.currentPlayerIndex = 0;
        this.turnDirection = 1;
        this.turnsEnabled = false;
        this.selectedHandIndex = -1;
        this.selectedCard = null;
        this.hasDrawnThisTurn = false;
        this.pendingCurrentDrawSerialNo = null;
        this.pendingMechanismCard = null;
        this.stopAiTurn();
        this.setPlayingCardNodeVisible(false);
        this.battleMode = data?.matchType === 'DUO' ? 'DUO' : 'SOLO';
        this.swapDiamondCost = Number(data?.swapDiamondCost ?? DEFAULT_SWAP_DIAMOND_COST);
        await this.preloadBattleSpriteFrames();
        this.createMockBattleStateFromSceneData(data);
        this.renderBattleState();
        this.bindRuntimeEvents();
        this.hideBattlePopupLayers();
        this.startSwapCountdown();
    }

    private createMockBattleStateFromSceneData(data?: SceneData) {
        const sourceState = gameManager.gameState;
        const deck = this.createShuffledDeck(this.battleMode);
        const players = this.createPlayersFromMatch(data, sourceState);
        players.forEach(player => {
            player.handCards = this.dealInitialHand(deck);
        });

        this.deck = deck;
        this.players = players;
        this.handCards = players[0]?.handCards ?? [];
        this.currentPlayerIndex = Math.floor(Math.random() * Math.max(1, players.length));

        const gameState: GameState = {
            status: 'PLAYING',
            players: players.map(player => ({
                playerIndex: player.playerIndex,
                username: player.username,
                avatarUrl: player.avatarUrl,
                hp: 3,
                handCount: player.handCards.length,
                isAlive: player.isAlive,
                isAi: player.isAi
            })),
            deckRemaining: this.deck.length,
            currentTurn: this.currentPlayerIndex,
            yourPlayerIndex: 0,
            handCards: this.handCards.map(card => card.id),
            isYourTurn: false,
            matchType: this.battleMode,
            roomLevel: String(data?.roomLevel ?? sourceState?.roomLevel ?? 'PRIMARY')
        };
        gameManager.updateGameState(gameState);
        gameManager.isInGame = true;
        this.gameState = gameState;
    }

    private createPlayersFromMatch(data: SceneData | undefined, sourceState: GameState | null): BattlePlayerModel[] {
        const currentName = dataManager.userData.nickName || dataManager.userData.username || '玩家';
        const sourcePlayers = sourceState?.players ?? [];
        const players: BattlePlayerModel[] = [{
            playerIndex: 0,
            username: currentName,
            avatarUrl: dataManager.userData.avatarUrl,
            handCards: [],
            isAlive: true,
            isAi: false
        }];

        for (let index = 1; index <= VISIBLE_OPPONENT_COUNT; index++) {
            const sourcePlayer = sourcePlayers[index];
            players.push({
                playerIndex: index,
                username: sourcePlayer?.username || MOCK_OPPONENT_NAMES[index - 1] || `对手${index}`,
                avatarUrl: sourcePlayer?.avatarUrl,
                handCards: [],
                isAlive: true,
                isAi: true
            });
        }

        return players;
    }

    private createShuffledDeck(mode: BattleMode): BattleCardInstance[] {
        const config = mode === 'DUO' ? DUO_CARD_DECK_CONFIG : SOLO_CARD_DECK_CONFIG;
        const cards: BattleCardInstance[] = [];
        for (const item of config) {
            for (let index = 0; index < item.count; index++) {
                cards.push({
                    id: item.id,
                    serialNo: ++this.cardSerialNo
                });
            }
        }
        return this.shuffle(cards);
    }

    private dealInitialHand(deck: BattleCardInstance[]): BattleCardInstance[] {
        const hand: BattleCardInstance[] = [];
        const safetyWrench = this.drawCardById(deck, 'SAFETY_WRENCH');
        if (safetyWrench) {
            hand.push(safetyWrench);
        }

        while (hand.length < HAND_CARD_COUNT && deck.length > 0) {
            const card = this.drawInitialSafeCard(deck);
            if (!card) {
                break;
            }
            hand.push(card);
        }
        return hand;
    }

    private drawInitialSafeCard(deck: BattleCardInstance[]): BattleCardInstance | null {
        const safeIndexes = deck
            .map((card, index) => card.id !== DANGER_CARD_ID ? index : -1)
            .filter(index => index >= 0);
        const pool = safeIndexes.length > 0 ? safeIndexes : deck.map((_, index) => index);
        const deckIndex = pool[0];
        return deck.splice(deckIndex, 1)[0] ?? null;
    }

    private drawCardById(deck: BattleCardInstance[], cardId: BattleCardId): BattleCardInstance | null {
        const deckIndex = deck.findIndex(card => card.id === cardId);
        if (deckIndex < 0) {
            return null;
        }

        return deck.splice(deckIndex, 1)[0] ?? null;
    }

    private renderBattleState() {
        this.renderCurrentUser();
        this.renderOpponents();
        this.renderHandCards();
        this.updateCardCounter();
        this.updateCardPileLabel();
        this.setLabelString([
            'BattleNode/SwapCardNode/LabelNode/CountLabel',
            'SwapCardNode/LabelNode/CountLabel'
        ], String(this.swapDiamondCost));
    }

    private renderCurrentUser() {
        const user = this.players[0];
        if (!user) {
            return;
        }

        this.setLabelString([
            'BattleNode/CurrentUserNode/UserNameSprite/Label',
            'CurrentUserNode/UserNameSprite/Label'
        ], user.username);
        this.setAvatarSprite([
            'BattleNode/CurrentUserNode/AvatarNode/Mask/Avatar',
            'CurrentUserNode/AvatarNode/Mask/Avatar'
        ], user.avatarUrl);
    }

    private renderOpponents() {
        for (let index = 1; index <= VISIBLE_OPPONENT_COUNT; index++) {
            const nodeName = `OtherUser0${index}`;
            const player = this.players[index];
            const userNode = this.findNodeByPaths([
                `BattleNode/${nodeName}`,
                nodeName
            ]);
            if (userNode) {
                userNode.active = !!player;
            }
            if (!player) {
                continue;
            }
            this.setLabelString([
                `BattleNode/${nodeName}/UserNameSprite/Label`,
                `${nodeName}/UserNameSprite/Label`
            ], player.username);
            this.setAvatarSprite([
                `BattleNode/${nodeName}/AvatarNode/Mask/Avatar`,
                `${nodeName}/AvatarNode/Mask/Avatar`
            ], player.avatarUrl);
            this.refreshPlayerHandCount(index);
        }
    }

    private renderHandCards() {
        const handArea = this.findNodeByPaths(['BattleNode/HandAreaNode', 'HandAreaNode']);
        if (!handArea) {
            return;
        }

        const layout = handArea.getComponent(Layout);
        if (layout) {
            layout.enabled = false;
        }

        const displayHandCards = this.getDisplayHandCards();
        const visibleCount = Math.max(HAND_CARD_COUNT, displayHandCards.length);
        for (let index = 0; index < visibleCount; index++) {
            const cardNode = this.getOrCreateHandCardNode(handArea, index);
            const card = displayHandCards[index];
            if (!cardNode?.isValid) {
                continue;
            }

            cardNode.active = !!card;
            if (card) {
                this.layoutHandCard(cardNode, index, displayHandCards.length);
            }
            const sprite = cardNode.getComponent(Sprite);
            if (sprite && card) {
                sprite.spriteFrame = this.cardSpriteFrames.get(card.id) ?? null;
            }
            this.bindHandCard(cardNode, index);
        }
        for (let index = visibleCount; index < handArea.children.length; index++) {
            handArea.children[index].active = false;
        }

        this.syncHandCardSiblingOrder(handArea, displayHandCards.length);
        this.syncGameStateHandCards();
        this.refreshActionButtons();
    }

    private getDisplayHandCards(): BattleCardInstance[] {
        if (this.pendingCurrentDrawSerialNo === null) {
            return this.handCards;
        }

        return this.handCards.filter(card => card.serialNo !== this.pendingCurrentDrawSerialNo);
    }

    private getOrCreateHandCardNode(handArea: Node, index: number): Node | null {
        const nodeNumber = index + 1;
        const nodeName = `HandCard${nodeNumber < 10 ? `0${nodeNumber}` : nodeNumber}`;
        const existingNode = handArea.getChildByName(nodeName) ?? handArea.children[index] ?? null;
        if (existingNode?.isValid) {
            return existingNode;
        }

        const template = handArea.children[handArea.children.length - 1] ?? null;
        if (!template?.isValid) {
            return null;
        }

        const cardNode = instantiate(template);
        cardNode.name = nodeName;
        cardNode.setParent(handArea);
        return cardNode;
    }

    private layoutHandCard(cardNode: Node, index: number, totalCount: number) {
        const spacing = totalCount > 1 ? Math.min(95, 560 / (totalCount - 1)) : 0;
        const startX = -((totalCount - 1) * spacing) / 2;
        const isSelected = index === this.selectedHandIndex;
        const baseScale = totalCount > HAND_CARD_COUNT ? Math.max(0.74, HAND_CARD_COUNT / totalCount) : 1;
        const scale = isSelected ? baseScale * 1.18 : baseScale;
        cardNode.setPosition(startX + index * spacing, isSelected ? HAND_SELECTED_OFFSET_Y : 0, 0);
        cardNode.setScale(scale, scale, 1);
    }

    private syncHandCardSiblingOrder(handArea: Node, displayCount: number) {
        const selectedNode = this.findHandCardNode(this.selectedHandIndex);
        for (let index = 0; index < displayCount; index++) {
            const cardNode = this.findHandCardNode(index);
            if (cardNode?.isValid && cardNode !== selectedNode) {
                cardNode.setSiblingIndex(handArea.children.length - 1);
            }
        }

        if (selectedNode?.isValid) {
            selectedNode.setSiblingIndex(handArea.children.length - 1);
        }
    }

    private updateCardCounter() {
        const dangerCount = this.deck.filter(card => card.id === DANGER_CARD_ID).length;
        const percentage = this.deck.length > 0 ? Math.round((dangerCount / this.deck.length) * 100) : 0;
        const label = this.findComponentByPaths([
            'BattleNode/PlayingCards/CardCounterSprite/Label',
            'PlayingCards/CardCounterSprite/Label'
        ], Label) ?? this.createCardCounterLabel();
        if (label) {
            label.string = `${percentage}%`;
        }

        const pointer = this.findNodeByPaths([
            'BattleNode/PlayingCards/CardCounterPointerSprite',
            'PlayingCards/CardCounterPointerSprite'
        ]);
        if (pointer) {
            const normalized = Math.max(0, Math.min(1, percentage / 40));
            pointer.angle = -55 + normalized * 110;
        }
    }

    private updateCardPileLabel() {
        this.setLabelString([
            'BattleNode/PlayingCards/CardPileSprite/Label',
            'PlayingCards/CardPileSprite/Label'
        ], `剩${this.deck.length}张`);
    }

    private bindRuntimeEvents() {
        this.bindClick(this.findNodeByPaths([
            'BattleNode/SwapCardNode/SwapButton',
            'SwapCardNode/SwapButton'
        ]), () => this.swapCurrentUserHand());

        this.bindClick(this.findNodeByPaths(this.getDrawCardButtonPaths()), () => this.onCardPileClick());
        this.bindClick(this.findNodeByPaths(this.getPlayCardButtonPaths()), () => this.playSelectedHandCard());
        this.bindBattlePopupEvents();
        this.refreshActionButtons();
    }

    private bindBattlePopupEvents() {
        this.bindClick(this.findNodeByPaths([
            'BattlePopupLayerRoot/GetMechanismPopupLayer/TearDownButton',
            'GetMechanismPopupLayer/TearDownButton'
        ]), () => this.onTearDownButtonClick());

        this.bindClick(this.findNodeByPaths([
            'BattlePopupLayerRoot/MonitorCardPopupLayer/Sprite',
            'MonitorCardPopupLayer/Sprite'
        ]), () => this.setBattlePopupLayerVisible('MonitorCardPopupLayer', false));

        this.bindClick(this.findNodeByPaths([
            'BattlePopupLayerRoot/RadarPopupLayer/Sprite',
            'RadarPopupLayer/Sprite'
        ]), () => this.setBattlePopupLayerVisible('RadarPopupLayer', false));

        const placementButtons: Array<{ paths: string[]; placement: MechanismPlacement }> = [
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/FirstSprite', 'TearDownMechanismPopupLayer/ButtonsNode/FirstSprite'], placement: 0 },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/SecondSprite', 'TearDownMechanismPopupLayer/ButtonsNode/SecondSprite'], placement: 1 },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/ThreeSprite', 'TearDownMechanismPopupLayer/ButtonsNode/ThreeSprite'], placement: 2 },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/FourSprite', 'TearDownMechanismPopupLayer/ButtonsNode/FourSprite'], placement: 3 },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/FiveSprite', 'TearDownMechanismPopupLayer/ButtonsNode/FiveSprite'], placement: 4 },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/RandomSprite', 'TearDownMechanismPopupLayer/ButtonsNode/RandomSprite'], placement: 'random' },
            { paths: ['BattlePopupLayerRoot/TearDownMechanismPopupLayer/ButtonsNode/CardBottomSprite', 'TearDownMechanismPopupLayer/ButtonsNode/CardBottomSprite'], placement: 'bottom' }
        ];

        for (const item of placementButtons) {
            this.bindClick(this.findNodeByPaths(item.paths), () => this.onMechanismPlacementClick(item.placement));
        }
    }

    private getDrawCardButtonPaths(): string[] {
        return [
            'BattleNode/PlayingCardNode/DrawCardSprite',
            'PlayingCardNode/DrawCardSprite',
            'BattleNode/PlayingCards/DrawCardSprite',
            'PlayingCards/DrawCardSprite',
            'DrawCardSprite'
        ];
    }

    private getPlayCardButtonPaths(): string[] {
        return [
            'BattleNode/PlayingCardNode/PalyingCardSprite',
            'PlayingCardNode/PalyingCardSprite',
            'BattleNode/PlayingCardNode/PlayingCardSprite',
            'PlayingCardNode/PlayingCardSprite',
            'BattleNode/PlayingCards/PalyingCardSprite',
            'PlayingCards/PalyingCardSprite',
            'BattleNode/PlayingCards/PlayingCardSprite',
            'PlayingCards/PlayingCardSprite',
            'PalyingCardSprite',
            'PlayingCardSprite'
        ];
    }

    private getOpponentCardCountLabelPaths(playerIndex: number): string[] {
        const nodeName = `OtherUser0${playerIndex}`;
        return [
            `BattleNode/${nodeName}/CardCountSprite/Label`,
            `${nodeName}/CardCountSprite/Label`
        ];
    }

    private refreshAllOpponentHandCounts() {
        for (let index = 1; index <= VISIBLE_OPPONENT_COUNT; index++) {
            this.refreshPlayerHandCount(index);
        }
    }

    private refreshPlayerHandCount(playerIndex: number) {
        if (playerIndex <= 0) {
            return;
        }

        const player = this.players[playerIndex];
        if (!player) {
            return;
        }

        this.setLabelString(this.getOpponentCardCountLabelPaths(playerIndex), String(player.handCards.length));
    }

    private refreshChangedPlayerHandCounts(...playerIndexes: number[]) {
        const uniqueIndexes = [...new Set(playerIndexes)];
        for (const playerIndex of uniqueIndexes) {
            this.refreshPlayerHandCount(playerIndex);
        }
    }

    private refreshActionButtons() {
        const canAct = this.turnsEnabled
            && this.currentPlayerIndex === 0
            && !!this.players[0]?.isAlive
            && !this.hasDrawnThisTurn
            && this.pendingCurrentDrawSerialNo === null
            && this.pendingMechanismCard === null;
        const selectedCard = this.handCards[this.selectedHandIndex];
        this.setButtonInteractable(this.getDrawCardButtonPaths(), canAct);
        this.setButtonInteractable(this.getPlayCardButtonPaths(), canAct && !!selectedCard && this.isPlayableCard(selectedCard.id));
    }

    private setButtonInteractable(paths: string[], interactable: boolean) {
        const buttonNode = this.findNodeByPaths(paths);
        const button = buttonNode?.getComponent(Button);
        if (button) {
            button.interactable = interactable;
        }
    }

    private bindHandCard(cardNode: Node, handIndex: number) {
        const button = cardNode.getComponent(Button) ?? cardNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        button.duration = 0.08;
        cardNode.targetOff(this);
        cardNode.on(Button.EventType.CLICK, () => this.onHandCardClick(handIndex), this);
    }

    private onHandCardClick(handIndex: number) {
        if (!this.canCurrentUserAct()) {
            return;
        }

        const card = this.handCards[handIndex];
        if (!card) {
            return;
        }

        if (this.selectedHandIndex === handIndex) {
            this.selectedHandIndex = -1;
            this.selectedCard = null;
            this.renderHandCards();
            return;
        }

        this.selectHandCard(handIndex);
    }

    private onCardPileClick() {
        if (!this.canCurrentUserAct()) {
            return;
        }

        this.drawCardAndEndTurn(0);
    }

    private canCurrentUserAct(): boolean {
        if (!this.turnsEnabled) {
            Platform.showToast('换牌结束后开始出牌', 'none');
            return false;
        }

        if (this.currentPlayerIndex !== 0) {
            Platform.showToast('还没轮到你', 'none');
            return false;
        }

        if (!this.players[0]?.isAlive) {
            Platform.showToast('你已出局', 'none');
            return false;
        }

        if (this.hasDrawnThisTurn) {
            Platform.showToast('本回合已经摸过牌', 'none');
            return false;
        }

        return true;
    }

    private selectHandCard(handIndex: number) {
        const card = this.handCards[handIndex];
        if (!card) {
            return;
        }

        this.selectedHandIndex = handIndex;
        this.selectedCard = card.id;
        this.renderHandCards();
    }

    private playSelectedHandCard() {
        if (!this.canCurrentUserAct()) {
            return;
        }

        const card = this.handCards[this.selectedHandIndex];
        if (!card) {
            Platform.showToast('请先选择卡牌', 'none');
            return;
        }

        if (this.hasDrawnThisTurn) {
            Platform.showToast('本回合已经摸过牌', 'none');
            return;
        }

        if (!this.isPlayableCard(card.id)) {
            Platform.showToast(this.getUnplayableCardTips(card.id), 'none');
            return;
        }

        this.playCardForPlayer(0, this.selectedHandIndex);
    }

    private isPlayableCard(cardId: BattleCardId): boolean {
        return cardId !== DANGER_CARD_ID && cardId !== 'SAFETY_WRENCH';
    }

    private getUnplayableCardTips(cardId: BattleCardId): string {
        if (cardId === DANGER_CARD_ID) {
            return '失控机关只能摸到时触发';
        }
        if (cardId === 'SAFETY_WRENCH') {
            return '安全扳手只能解除失控机关';
        }
        return '这张牌当前不能主动使用';
    }

    private playCardForPlayer(playerIndex: number, handIndex: number) {
        const player = this.players[playerIndex];
        const card = player?.handCards[handIndex];
        if (!player || !card) {
            return;
        }

        if (!this.isPlayableCard(card.id)) {
            if (playerIndex === 0) {
                Platform.showToast(this.getUnplayableCardTips(card.id), 'none');
            }
            return;
        }

        const sourceNode = playerIndex === 0
            ? this.findHandCardNode(handIndex)
            : this.getPlayerAnchorNode(playerIndex);
        this.animatePlayedCard(card, sourceNode ?? undefined, playerIndex);
        player.handCards.splice(handIndex, 1);
        if (playerIndex === 0) {
            this.handCards = player.handCards;
        }
        this.refreshPlayerHandCount(playerIndex);

        const cardName = CARD_DEFINITIONS[card.id].name;
        let shouldEndTurn = false;
        let message = `${player.username}打出${cardName}`;

        switch (card.id) {
            case 'RESTART_WORKSHOP':
                this.deck = this.shuffle(this.deck);
                message = `${message}，牌堆已重启`;
                break;
            case 'PRETEND_STUPID':
                shouldEndTurn = true;
                message = `${message}，跳过摸牌`;
                break;
            case 'REVERSE_TRANSMISSION':
                this.turnDirection = this.turnDirection === 1 ? -1 : 1;
                shouldEndTurn = true;
                message = `${message}，行动顺序反转`;
                break;
            case 'LOW_LEVEL_CHANNEL':
                this.drawCardForPlayer(playerIndex, true);
                shouldEndTurn = true;
                message = `${message}，从底部摸牌`;
                break;
            case 'BLAME_SHIFTING':
                this.forceNextPlayerDraw(playerIndex, 1);
                shouldEndTurn = true;
                message = `${message}，甩锅给下一位`;
                break;
            case 'BLAME_SHIFTING_X2':
                this.forceNextPlayerDraw(playerIndex, 2);
                shouldEndTurn = true;
                message = `${message}，甩锅两次`;
                break;
            case 'SNATCHING_BAG':
                this.stealOneCardFromNextPlayer(playerIndex);
                message = `${message}，顺走一张牌`;
                break;
            case 'BACKPACK_INTERCHANGE':
                this.swapHandsWithNextPlayer(playerIndex);
                message = `${message}，交换背包`;
                break;
            case 'DETECTION_RADAR':
                message = `${message}，${this.getNextDangerDistanceText()}`;
                if (playerIndex === 0) {
                    this.showRadarPopupLayer();
                }
                break;
            case 'SURVEILLANCE_LENS':
                message = `${message}，顶部：${this.getTopCardNames(3)}`;
                if (playerIndex === 0) {
                    this.showMonitorCardPopupLayer();
                }
                break;
            default:
                break;
        }

        if (playerIndex === 0) {
            this.selectedHandIndex = -1;
            this.selectedCard = null;
        }
        this.refreshAfterCardChange();
        Platform.showToast(message, 'none');

        if (this.checkGameEnd()) {
            return;
        }

        if (shouldEndTurn) {
            this.completeCurrentTurn();
        } else if (player.isAi) {
            const followUpCardIndex = this.chooseAiFollowUpCardIndex(player);
            if (followUpCardIndex >= 0) {
                this.playCardForPlayer(playerIndex, followUpCardIndex);
                return;
            }
            this.drawCardAndEndTurn(playerIndex);
        }
    }

    private swapCurrentUserHand() {
        if (this.swapCountdown <= 0) {
            return;
        }

        if ((dataManager.userData.diamond ?? 0) < this.swapDiamondCost) {
            Platform.showToast('钻石不足，无法换牌', 'none');
            return;
        }

        dataManager.updateUserData({
            diamond: Math.max(0, (dataManager.userData.diamond ?? 0) - this.swapDiamondCost)
        });
        this.deck.push(...this.handCards);
        this.handCards = this.dealInitialHand(this.deck);
        if (this.players[0]) {
            this.players[0].handCards = this.handCards;
        }

        this.renderHandCards();
        this.updateCardCounter();
        this.updateCardPileLabel();
        Platform.showToast('已更换手牌', 'success');
    }

    private startSwapCountdown() {
        this.stopSwapCountdown();
        this.swapCountdown = SWAP_COUNTDOWN_SECONDS;
        this.setPlayingCardNodeVisible(false);
        const swapNode = this.findNodeByPaths(['BattleNode/SwapCardNode', 'SwapCardNode']);
        if (swapNode) {
            swapNode.active = true;
        }
        this.updateSwapCountdownLabel();
        this.schedule(this.tickSwapCountdown, 1);
    }

    private stopSwapCountdown() {
        this.unschedule(this.tickSwapCountdown);
    }

    private tickSwapCountdown = () => {
        this.swapCountdown -= 1;
        this.updateSwapCountdownLabel();
        if (this.swapCountdown <= 0) {
            this.stopSwapCountdown();
            const swapNode = this.findNodeByPaths(['BattleNode/SwapCardNode', 'SwapCardNode']);
            if (swapNode) {
                swapNode.active = false;
            }
            this.turnsEnabled = true;
            this.setPlayingCardNodeVisible(true);
            this.startCurrentTurn(0.4);
        }
    };

    private updateSwapCountdownLabel() {
        this.setLabelString([
            'BattleNode/SwapCardNode/SwapButton/CountdownLabel',
            'SwapCardNode/SwapButton/CountdownLabel'
        ], `(${Math.max(0, this.swapCountdown)})`);
    }

    private setPlayingCardNodeVisible(visible: boolean) {
        const playingCardNode = this.findNodeByPaths([
            'BattleNode/PlayingCardNode',
            'PlayingCardNode'
        ]);
        if (playingCardNode) {
            playingCardNode.active = visible;
        }
    }

    private syncGameStateHandCards() {
        if (!this.gameState) {
            return;
        }

        this.gameState.handCards = this.handCards.map(card => card.id);
        this.gameState.deckRemaining = this.deck.length;
        this.gameState.currentTurn = this.currentPlayerIndex;
        this.gameState.isYourTurn = this.currentPlayerIndex === 0 && this.turnsEnabled;
        for (const player of this.players) {
            const statePlayer = this.gameState.players[player.playerIndex];
            if (statePlayer) {
                statePlayer.handCount = player.handCards.length;
                statePlayer.isAlive = player.isAlive;
            }
        }
        gameManager.updateGameState(this.gameState);
    }

    private drawCardAndEndTurn(playerIndex: number) {
        const drawnCard = this.drawCardForPlayer(playerIndex, false);
        if (!drawnCard) {
            return;
        }

        this.refreshAfterCardChange();
        if (playerIndex === 0 && drawnCard.id === DANGER_CARD_ID && this.pendingMechanismCard) {
            return;
        }

        if (this.checkGameEnd()) {
            return;
        }

        this.completeCurrentTurn();
    }

    private drawCardForPlayer(playerIndex: number, fromBottom: boolean): BattleCardInstance | null {
        const player = this.players[playerIndex];
        if (!player?.isAlive) {
            return null;
        }

        if (this.deck.length <= 0) {
            Platform.showToast('牌堆已空', 'none');
            return null;
        }

        const card = fromBottom ? this.deck.pop() : this.deck.shift();
        if (!card) {
            return null;
        }

        const drawAnimationStarted = this.animateDrawCard(playerIndex, card, fromBottom);
        const cardName = CARD_DEFINITIONS[card.id].name;

        if (card.id === DANGER_CARD_ID) {
            if (playerIndex === 0) {
                this.pendingMechanismCard = card;
                this.showGetMechanismPopupLayer(this.hasUsableSafetyCard(player));
                Platform.showToast(`你摸到${cardName}`, 'none');
                return card;
            }

            if (this.consumeSafetyWrench(player)) {
                this.insertDangerCardBack(card);
                Platform.showToast(`${player.username}用安全扳手解除失控机关`, 'none');
            } else {
                player.isAlive = false;
                player.handCards = [];
                if (playerIndex === 0) {
                    this.handCards = [];
                }
                this.refreshPlayerHandCount(playerIndex);
                Platform.showToast(`${player.username}摸到${cardName}，已出局`, 'none');
            }
            return card;
        }

        if (playerIndex === 0 && drawAnimationStarted) {
            this.pendingCurrentDrawSerialNo = card.serialNo;
        }
        player.handCards.push(card);
        if (playerIndex === 0) {
            this.handCards = player.handCards;
        }
        this.refreshPlayerHandCount(playerIndex);
        Platform.showToast(`${player.username}摸到${cardName}`, 'none');
        return card;
    }

    private consumeSafetyWrench(player: BattlePlayerModel): boolean {
        const wrenchIndex = player.handCards.findIndex(card => card.id === 'SAFETY_WRENCH');
        if (wrenchIndex < 0) {
            return false;
        }

        const wrench = player.handCards.splice(wrenchIndex, 1)[0];
        if (wrench) {
            this.animatePlayedCard(wrench, this.getPlayerAnchorNode(player.playerIndex) ?? undefined, player.playerIndex);
        }
        this.refreshPlayerHandCount(player.playerIndex);
        return true;
    }

    private insertDangerCardBack(card: BattleCardInstance) {
        const insertIndex = Math.floor(Math.random() * (this.deck.length + 1));
        this.deck.splice(insertIndex, 0, card);
    }

    private onTearDownButtonClick() {
        const player = this.players[0];
        if (!this.pendingMechanismCard || !player) {
            this.setBattlePopupLayerVisible('GetMechanismPopupLayer', false);
            return;
        }

        if (!this.hasUsableSafetyCard(player)) {
            this.setBattlePopupLayerVisible('GetMechanismPopupLayer', false);
            this.eliminateCurrentUserByMechanism();
            return;
        }

        this.consumeSafetyWrench(player);
        this.refreshAfterCardChange();
        this.setBattlePopupLayerVisible('GetMechanismPopupLayer', false);
        this.showTearDownMechanismPopupLayer();
    }

    private onMechanismPlacementClick(placement: MechanismPlacement) {
        const card = this.pendingMechanismCard;
        if (!card) {
            this.setBattlePopupLayerVisible('TearDownMechanismPopupLayer', false);
            return;
        }

        this.insertDangerCardAtPosition(card, placement);
        this.pendingMechanismCard = null;
        this.setBattlePopupLayerVisible('TearDownMechanismPopupLayer', false);
        this.refreshAfterCardChange();
        Platform.showToast('失控机关已放回牌堆', 'success');

        if (this.checkGameEnd()) {
            return;
        }
        this.completeCurrentTurn();
    }

    private insertDangerCardAtPosition(card: BattleCardInstance, placement: MechanismPlacement) {
        if (placement === 'bottom') {
            this.deck.push(card);
            return;
        }

        if (placement === 'random') {
            this.insertDangerCardBack(card);
            return;
        }

        const insertIndex = Math.max(0, Math.min(placement, this.deck.length));
        this.deck.splice(insertIndex, 0, card);
    }

    private eliminateCurrentUserByMechanism() {
        const player = this.players[0];
        if (!player) {
            return;
        }

        player.isAlive = false;
        player.handCards = [];
        this.handCards = [];
        this.pendingMechanismCard = null;
        this.refreshAfterCardChange();
        Platform.showToast('没有安全扳手，已出局', 'none');

        if (this.checkGameEnd()) {
            return;
        }
        this.completeCurrentTurn();
    }

    private advanceTurn() {
        const nextPlayerIndex = this.findNextAlivePlayerIndex(this.currentPlayerIndex);
        if (nextPlayerIndex < 0) {
            this.checkGameEnd();
            return;
        }

        this.currentPlayerIndex = nextPlayerIndex;
        this.startCurrentTurn();
    }

    private completeCurrentTurn() {
        this.hasDrawnThisTurn = true;
        this.selectedHandIndex = -1;
        this.selectedCard = null;
        this.advanceTurn();
    }

    private startCurrentTurn(aiDelaySeconds = 0.8) {
        this.hasDrawnThisTurn = false;
        this.selectedHandIndex = -1;
        this.selectedCard = null;
        this.refreshTurnState();
        this.scheduleAiTurnIfNeeded(aiDelaySeconds);

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer && !currentPlayer.isAi) {
            this.showTurnBanner('轮到你了');
            Platform.showToast('轮到你了', 'success');
        } else {
            this.pulseNode(this.getPlayerAnchorNode(this.currentPlayerIndex));
        }
    }

    private findNextAlivePlayerIndex(fromIndex: number): number {
        if (this.players.length <= 0) {
            return -1;
        }

        for (let offset = 1; offset <= this.players.length; offset++) {
            const nextIndex = (fromIndex + offset * this.turnDirection + this.players.length) % this.players.length;
            if (this.players[nextIndex]?.isAlive) {
                return nextIndex;
            }
        }

        return -1;
    }

    private refreshTurnState() {
        this.refreshAfterCardChange();
    }

    private refreshAfterCardChange() {
        this.renderHandCards();
        this.renderOpponents();
        this.updateCardCounter();
        this.updateCardPileLabel();
        this.syncGameStateHandCards();
    }

    private animatePlayedCard(card: BattleCardInstance, sourceNode?: Node, playerIndex = 0) {
        const targetNode = this.findNodeByPaths([
            'BattleNode/PlayingCards/PlayingAreaSprite',
            'PlayingCards/PlayingAreaSprite'
        ]);
        if (!targetNode?.isValid) {
            this.showCardInPlayingArea(card);
            return;
        }

        const startNode = sourceNode?.isValid ? sourceNode : targetNode;
        const effectNode = this.createCardMoveEffect(
            this.cardSpriteFrames.get(card.id) ?? null,
            startNode,
            PLAY_EFFECT_CARD_WIDTH,
            PLAY_EFFECT_CARD_HEIGHT
        );
        if (!effectNode) {
            this.showCardInPlayingArea(card);
            return;
        }

        const rootNode = effectNode.parent;
        if (!rootNode) {
            effectNode.destroy();
            this.showCardInPlayingArea(card);
            return;
        }

        const targetPosition = this.getLocalPosition(rootNode, targetNode);
        const startPosition = new Vec3(effectNode.position.x, effectNode.position.y, 0);
        const midPosition = this.getMoveMidPosition(startPosition, targetPosition, 18);
        const startScale = playerIndex === 0 ? CURRENT_PLAY_START_SCALE : OPPONENT_PLAY_START_SCALE;
        const midScale = playerIndex === 0 ? 1.02 : 0.74;
        const targetScale = this.getPlayTargetScale(targetNode);
        effectNode.setScale(startScale, startScale, 1);
        effectNode.angle = playerIndex === 0 ? -3 : 3;

        tween(effectNode)
            .to(0.12, { position: midPosition, scale: new Vec3(midScale, midScale, 1), angle: playerIndex === 0 ? 2 : -2 }, { easing: 'quadOut' })
            .to(0.22, { position: targetPosition, scale: new Vec3(targetScale, targetScale, 1), angle: 0 }, { easing: 'quadInOut' })
            .call(() => {
                this.showCardInPlayingArea(card);
                this.pulseNode(targetNode, 1.08, 0.08);
                effectNode.destroy();
            })
            .start();
    }

    private animateDrawCard(playerIndex: number, card: BattleCardInstance, fromBottom: boolean): boolean {
        const pileNode = this.findNodeByPaths([
            'BattleNode/PlayingCards/CardPileSprite',
            'PlayingCards/CardPileSprite'
        ]);
        const targetNode = this.getDrawTargetNode(playerIndex);
        if (!pileNode?.isValid || !targetNode?.isValid) {
            this.pulseNode(targetNode ?? pileNode);
            return false;
        }

        this.pulseNode(pileNode, 1.05, 0.08);
        const pileSprite = pileNode.getComponent(Sprite);
        const effectNode = this.createCardMoveEffect(
            pileSprite?.spriteFrame ?? this.cardSpriteFrames.get(card.id) ?? null,
            pileNode,
            DRAW_EFFECT_CARD_WIDTH,
            DRAW_EFFECT_CARD_HEIGHT
        );
        if (!effectNode) {
            return false;
        }

        const rootNode = effectNode.parent;
        if (!rootNode) {
            effectNode.destroy();
            return false;
        }

        const startPosition = new Vec3(effectNode.position.x, effectNode.position.y, 0);
        const targetPosition = this.getLocalPosition(rootNode, targetNode);
        const pullOffset = fromBottom ? -16 : 18;
        const pullPosition = new Vec3(startPosition.x + 10, startPosition.y + pullOffset, 0);
        const midPosition = this.getMoveMidPosition(pullPosition, targetPosition, playerIndex === 0 ? 10 : 22);
        const targetScale = playerIndex === 0 ? CURRENT_DRAW_TARGET_SCALE : this.getOpponentDrawTargetScale(targetNode);
        effectNode.setScale(1.04, 1.04, 1);

        tween(effectNode)
            .to(0.08, { position: pullPosition, scale: new Vec3(1.0, 1.0, 1), angle: fromBottom ? -4 : 4 }, { easing: 'quadOut' })
            .to(0.12, { position: midPosition, scale: new Vec3(Math.max(targetScale + 0.12, 0.72), Math.max(targetScale + 0.12, 0.72), 1), angle: fromBottom ? 2 : -2 }, { easing: 'quadInOut' })
            .to(0.18, { position: targetPosition, scale: new Vec3(targetScale, targetScale, 1), angle: 0 }, { easing: 'quadInOut' })
            .call(() => {
                this.pulseNode(targetNode, playerIndex === 0 ? 1.03 : 1.1, 0.1);
                if (playerIndex === 0 && this.pendingCurrentDrawSerialNo === card.serialNo) {
                    this.pendingCurrentDrawSerialNo = null;
                    this.renderHandCards();
                } else {
                    this.renderOpponents();
                }
                effectNode.destroy();
            })
            .start();
        return true;
    }

    private showCardInPlayingArea(card: BattleCardInstance) {
        const playingAreaSprite = this.findComponentByPaths([
            'BattleNode/PlayingCards/PlayingAreaSprite',
            'PlayingCards/PlayingAreaSprite'
        ], Sprite);
        if (playingAreaSprite) {
            playingAreaSprite.spriteFrame = this.cardSpriteFrames.get(card.id) ?? playingAreaSprite.spriteFrame;
            this.pulseNode(playingAreaSprite.node, 1.06, 0.08);
        }
    }

    private createCardMoveEffect(spriteFrame: SpriteFrame | null, sourceNode: Node, width: number, height: number): Node | null {
        const rootNode = this.findNodeByPaths(['BattleNode']) ?? this.node;
        if (!rootNode?.isValid || !sourceNode?.isValid) {
            return null;
        }

        const effectNode = new Node('CardMoveEffect');
        effectNode.layer = rootNode.layer;
        effectNode.setParent(rootNode);
        effectNode.setPosition(this.getLocalPosition(rootNode, sourceNode));

        const transform = effectNode.addComponent(UITransform);
        transform.setContentSize(width, height);

        const sprite = effectNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = spriteFrame ?? sourceNode.getComponent(Sprite)?.spriteFrame ?? null;
        return effectNode;
    }

    private getMoveMidPosition(startPosition: Vec3, targetPosition: Vec3, yOffset: number): Vec3 {
        return new Vec3(
            (startPosition.x + targetPosition.x) / 2,
            (startPosition.y + targetPosition.y) / 2 + yOffset,
            0
        );
    }

    private getOpponentDrawTargetScale(targetNode: Node): number {
        const targetSize = targetNode.getComponent(UITransform)?.contentSize;
        if (!targetSize) {
            return 0.56;
        }

        const fitScale = Math.min(
            targetSize.width / DRAW_EFFECT_CARD_WIDTH,
            targetSize.height / DRAW_EFFECT_CARD_HEIGHT
        ) * 0.95;
        return Math.max(OPPONENT_DRAW_MIN_SCALE, Math.min(OPPONENT_DRAW_MAX_SCALE, fitScale));
    }

    private getPlayTargetScale(targetNode: Node): number {
        const targetSize = targetNode.getComponent(UITransform)?.contentSize;
        if (!targetSize) {
            return 1;
        }

        const fitScale = Math.min(
            targetSize.width / PLAY_EFFECT_CARD_WIDTH,
            targetSize.height / PLAY_EFFECT_CARD_HEIGHT
        ) * 0.92;
        return Math.max(0.88, Math.min(1.04, fitScale));
    }

    private getLocalPosition(rootNode: Node, targetNode: Node): Vec3 {
        const rootTransform = rootNode.getComponent(UITransform);
        const targetTransform = targetNode.getComponent(UITransform);
        if (!rootTransform || !targetTransform) {
            return new Vec3(targetNode.position.x, targetNode.position.y, 0);
        }

        const worldPosition = targetTransform.convertToWorldSpaceAR(new Vec3(0, 0, 0));
        return rootTransform.convertToNodeSpaceAR(worldPosition);
    }

    private getDrawTargetNode(playerIndex: number): Node | null {
        if (playerIndex === 0) {
            return this.findNodeByPaths([
                'BattleNode/HandAreaNode',
                'HandAreaNode'
            ]);
        }

        return this.getPlayerAnchorNode(playerIndex);
    }

    private getPlayerAnchorNode(playerIndex: number): Node | null {
        if (playerIndex === 0) {
            return this.findNodeByPaths([
                'BattleNode/CurrentUserNode/AvatarNode',
                'CurrentUserNode/AvatarNode',
                'BattleNode/CurrentUserNode',
                'CurrentUserNode'
            ]);
        }

        const nodeName = `OtherUser0${playerIndex}`;
        return this.findNodeByPaths([
            `BattleNode/${nodeName}/AvatarNode`,
            `${nodeName}/AvatarNode`,
            `BattleNode/${nodeName}`,
            nodeName
        ]);
    }

    private findHandCardNode(handIndex: number): Node | null {
        const handArea = this.findNodeByPaths([
            'BattleNode/HandAreaNode',
            'HandAreaNode'
        ]);
        if (!handArea) {
            return null;
        }

        const nodeNumber = handIndex + 1;
        const nodeName = `HandCard${nodeNumber < 10 ? `0${nodeNumber}` : nodeNumber}`;
        return handArea.getChildByName(nodeName) ?? handArea.children[handIndex] ?? null;
    }

    private pulseNode(node: Node | null | undefined, scale = 1.08, duration = 0.1) {
        if (!node?.isValid) {
            return;
        }

        const originalScale = new Vec3(node.scale.x, node.scale.y, node.scale.z);
        tween(node)
            .to(duration, {
                scale: new Vec3(originalScale.x * scale, originalScale.y * scale, originalScale.z)
            }, { easing: 'quadOut' })
            .to(duration, { scale: originalScale }, { easing: 'quadInOut' })
            .start();
    }

    private showTurnBanner(text: string) {
        const rootNode = this.findNodeByPaths(['BattleNode']) ?? this.node;
        if (!rootNode?.isValid) {
            return;
        }

        const bannerNode = new Node('TurnBannerEffect');
        bannerNode.layer = rootNode.layer;
        bannerNode.setParent(rootNode);
        bannerNode.setPosition(0, -35, 0);
        bannerNode.setScale(0.72, 0.72, 1);
        bannerNode.addComponent(UITransform).setContentSize(360, 86);
        const opacity = bannerNode.addComponent(UIOpacity);
        opacity.opacity = 0;

        const label = bannerNode.addComponent(Label);
        label.string = text;
        label.fontSize = 48;
        label.lineHeight = 58;
        label.color = new Color(255, 219, 88, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        tween(opacity)
            .to(0.08, { opacity: 255 }, { easing: 'quadOut' })
            .delay(0.58)
            .to(0.16, { opacity: 0 }, { easing: 'quadIn' })
            .call(() => bannerNode.destroy())
            .start();

        tween(bannerNode)
            .to(0.12, { scale: new Vec3(1.12, 1.12, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'quadInOut' })
            .delay(0.44)
            .to(0.16, { position: new Vec3(0, -15, 0) }, { easing: 'quadIn' })
            .start();
    }

    private scheduleAiTurnIfNeeded(delaySeconds = 0.8) {
        this.stopAiTurn();
        if (!this.turnsEnabled) {
            return;
        }

        const player = this.players[this.currentPlayerIndex];
        if (!player?.isAlive || !player.isAi) {
            return;
        }

        this.scheduleOnce(this.runAiTurn, delaySeconds);
    }

    private stopAiTurn() {
        this.unschedule(this.runAiTurn);
    }

    private runAiTurn = () => {
        if (!this.turnsEnabled) {
            return;
        }

        const player = this.players[this.currentPlayerIndex];
        if (!player?.isAlive || !player.isAi) {
            return;
        }

        const cardIndex = this.chooseAiCardIndex(player);
        if (cardIndex >= 0) {
            this.playCardForPlayer(player.playerIndex, cardIndex);
            return;
        }

        this.drawCardAndEndTurn(player.playerIndex);
    };

    private chooseAiCardIndex(player: BattlePlayerModel): number {
        const topDangerDistance = this.getTopDangerDistance();
        if (topDangerDistance === 1 && !this.hasUsableSafetyCard(player)) {
            const emergencyIndex = this.chooseAiEmergencyCardIndex(player);
            if (emergencyIndex >= 0) {
                return emergencyIndex;
            }
        }

        const dangerPercentage = this.getDangerPercentage();
        const preferredIds: BattleCardId[] = [];

        if (dangerPercentage >= 15) {
            preferredIds.push('PRETEND_STUPID', 'LOW_LEVEL_CHANNEL', 'REVERSE_TRANSMISSION');
        }
        if (dangerPercentage >= 12) {
            preferredIds.push('RESTART_WORKSHOP');
        }
        if (dangerPercentage >= 10) {
            preferredIds.push('DETECTION_RADAR', 'SURVEILLANCE_LENS');
        }

        for (const cardId of preferredIds) {
            const index = player.handCards.findIndex(card => card.id === cardId);
            if (index >= 0) {
                return index;
            }
        }

        return -1;
    }

    private chooseAiFollowUpCardIndex(player: BattlePlayerModel): number {
        if (this.getTopDangerDistance() !== 1 || this.hasUsableSafetyCard(player)) {
            return -1;
        }

        return this.chooseAiEmergencyCardIndex(player);
    }

    private chooseAiEmergencyCardIndex(player: BattlePlayerModel): number {
        const emergencyIds: BattleCardId[] = [
            'PRETEND_STUPID',
            'LOW_LEVEL_CHANNEL',
            'REVERSE_TRANSMISSION',
            'RESTART_WORKSHOP',
            'BLAME_SHIFTING',
            'BLAME_SHIFTING_X2'
        ];

        for (const cardId of emergencyIds) {
            const cardIndex = player.handCards.findIndex(card => card.id === cardId);
            if (cardIndex >= 0) {
                return cardIndex;
            }
        }

        return -1;
    }

    private getTopDangerDistance(): number {
        const dangerIndex = this.deck.findIndex(card => card.id === DANGER_CARD_ID);
        return dangerIndex >= 0 ? dangerIndex + 1 : Number.POSITIVE_INFINITY;
    }

    private hasUsableSafetyCard(player: BattlePlayerModel): boolean {
        return player.handCards.some(card => card.id === 'SAFETY_WRENCH');
    }

    private getDangerPercentage(): number {
        const dangerCount = this.deck.filter(card => card.id === DANGER_CARD_ID).length;
        return this.deck.length > 0 ? Math.round((dangerCount / this.deck.length) * 100) : 0;
    }

    private forceNextPlayerDraw(playerIndex: number, drawCount: number) {
        const targetIndex = this.findNextAlivePlayerIndex(playerIndex);
        if (targetIndex < 0) {
            return;
        }

        for (let index = 0; index < drawCount; index++) {
            if (!this.players[targetIndex]?.isAlive) {
                break;
            }
            this.drawCardForPlayer(targetIndex, false);
        }
    }

    private stealOneCardFromNextPlayer(playerIndex: number) {
        const player = this.players[playerIndex];
        const targetIndex = this.findNextAlivePlayerIndex(playerIndex);
        const target = targetIndex >= 0 ? this.players[targetIndex] : null;
        if (!player || !target || target.handCards.length <= 0) {
            return;
        }

        const cardIndex = Math.floor(Math.random() * target.handCards.length);
        const card = target.handCards.splice(cardIndex, 1)[0];
        if (card) {
            player.handCards.push(card);
            if (playerIndex === 0) {
                this.handCards = player.handCards;
            }
            if (targetIndex === 0) {
                this.handCards = target.handCards;
            }
            this.refreshChangedPlayerHandCounts(playerIndex, targetIndex);
        }
    }

    private swapHandsWithNextPlayer(playerIndex: number) {
        const player = this.players[playerIndex];
        const targetIndex = this.findNextAlivePlayerIndex(playerIndex);
        const target = targetIndex >= 0 ? this.players[targetIndex] : null;
        if (!player || !target) {
            return;
        }

        const playerHand = player.handCards;
        player.handCards = target.handCards;
        target.handCards = playerHand;
        if (playerIndex === 0) {
            this.handCards = player.handCards;
        } else if (targetIndex === 0) {
            this.handCards = target.handCards;
        }
        this.refreshChangedPlayerHandCounts(playerIndex, targetIndex);
    }

    private getNextDangerDistanceText(): string {
        const dangerIndex = this.deck.findIndex(card => card.id === DANGER_CARD_ID);
        if (dangerIndex < 0) {
            return '牌堆里暂时没有失控机关';
        }
        return `失控机关距离顶部${dangerIndex + 1}张`;
    }

    private getTopCardNames(count: number): string {
        const names = this.deck
            .slice(0, count)
            .map(card => CARD_DEFINITIONS[card.id].name);
        return names.length > 0 ? names.join('、') : '牌堆已空';
    }

    private hideBattlePopupLayers() {
        this.setBattlePopupLayerVisible('GetMechanismPopupLayer', false);
        this.setBattlePopupLayerVisible('TearDownMechanismPopupLayer', false);
        this.setBattlePopupLayerVisible('MonitorCardPopupLayer', false);
        this.setBattlePopupLayerVisible('RadarPopupLayer', false);
    }

    private setBattlePopupLayerVisible(layerName: string, visible: boolean) {
        const layer = this.findNodeByPaths([
            `BattlePopupLayerRoot/${layerName}`,
            layerName
        ]);
        if (layer) {
            layer.active = visible;
        }
    }

    private showGetMechanismPopupLayer(hasSafetyWrench: boolean) {
        this.hideBattlePopupLayers();
        this.setTearDownButtonSprite(hasSafetyWrench);
        this.setBattlePopupLayerVisible('GetMechanismPopupLayer', true);
        this.refreshActionButtons();
    }

    private showTearDownMechanismPopupLayer() {
        this.hideBattlePopupLayers();
        this.setBattlePopupLayerVisible('TearDownMechanismPopupLayer', true);
    }

    private setTearDownButtonSprite(hasSafetyWrench: boolean) {
        const buttonNode = this.findNodeByPaths([
            'BattlePopupLayerRoot/GetMechanismPopupLayer/TearDownButton',
            'GetMechanismPopupLayer/TearDownButton'
        ]);
        if (!buttonNode) {
            return;
        }

        const spriteFrame = hasSafetyWrench ? this.redButtonSpriteFrame : this.grayButtonSpriteFrame;
        const sprite = buttonNode.getComponent(Sprite);
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }

        const button = buttonNode.getComponent(Button);
        if (button) {
            button.normalSprite = spriteFrame;
            button.pressedSprite = spriteFrame;
            button.hoverSprite = spriteFrame;
            button.disabledSprite = this.grayButtonSpriteFrame ?? spriteFrame;
            button.interactable = true;
        }
    }

    private showMonitorCardPopupLayer() {
        this.hideBattlePopupLayers();
        const cards = this.deck.slice(0, 3);
        for (let index = 0; index < 3; index++) {
            const spriteNode = this.findNodeByPaths([
                `BattlePopupLayerRoot/MonitorCardPopupLayer/CardsNode/CardSprite${index + 1}`,
                `MonitorCardPopupLayer/CardsNode/CardSprite${index + 1}`
            ]);
            const sprite = spriteNode?.getComponent(Sprite);
            const card = cards[index];
            if (spriteNode) {
                spriteNode.active = !!card;
            }
            if (sprite && card) {
                sprite.spriteFrame = this.cardSpriteFrames.get(card.id) ?? null;
            }
        }

        this.setBattlePopupLayerVisible('MonitorCardPopupLayer', true);
    }

    private showRadarPopupLayer() {
        this.hideBattlePopupLayers();
        const dangerDistance = this.getTopDangerDistance();
        this.setLabelString([
            'BattlePopupLayerRoot/RadarPopupLayer/RadarSprite/LocationLabel',
            'RadarPopupLayer/RadarSprite/LocationLabel'
        ], Number.isFinite(dangerDistance) ? `第${dangerDistance}张` : '暂无');
        this.setBattlePopupLayerVisible('RadarPopupLayer', true);
    }

    private checkGameEnd(): boolean {
        const alivePlayers = this.players.filter(player => player.isAlive);
        if (alivePlayers.length > 1) {
            return false;
        }

        this.turnsEnabled = false;
        this.stopAiTurn();
        this.onGameEnd(alivePlayers[0]?.playerIndex === 0);
        return true;
    }

    private async preloadBattleSpriteFrames() {
        const entries = CARD_DEFINITION_LIST;
        const frames = await Promise.all(entries.map(definition => this.loadSpriteFrame(definition.spritePath)));
        entries.forEach((definition, index) => {
            const frame = frames[index];
            if (frame) {
                this.cardSpriteFrames.set(definition.id, frame);
            }
        });
        this.avatarSpriteFrame = await this.loadSpriteFrame('image/avatar/spriteFrame');
        this.redButtonSpriteFrame = await this.loadSpriteFrame('image/red_button/spriteFrame');
        this.grayButtonSpriteFrame = await this.loadSpriteFrame('image/gray_button/spriteFrame');
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
        return new Promise(resolve => {
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame) {
                    console.warn(`[BattleUI] load sprite frame failed: ${path}`, error);
                    resolve(null);
                    return;
                }
                resolve(spriteFrame);
            });
        });
    }

    private setAvatarSprite(paths: string[], avatarUrl?: string) {
        const sprite = this.findComponentByPaths(paths, Sprite);
        if (!sprite) {
            return;
        }

        if (this.avatarSpriteFrame) {
            sprite.spriteFrame = this.avatarSpriteFrame;
        }

        if (!avatarUrl || !/^https?:\/\//i.test(avatarUrl)) {
            return;
        }

        assetManager.loadRemote(avatarUrl, (error, remoteAsset) => {
            if (error || !remoteAsset || !sprite.node?.isValid) {
                return;
            }
            this.applyRemoteAvatarSprite(sprite, remoteAsset);
        });
    }

    private applyRemoteAvatarSprite(sprite: Sprite, remoteAsset: unknown) {
        const imageAsset = this.createImageAssetFromRemote(remoteAsset);
        if (!imageAsset || !sprite.node?.isValid) {
            return;
        }

        const texture = new Texture2D();
        texture.image = imageAsset;
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        sprite.spriteFrame = spriteFrame;
    }

    private createImageAssetFromRemote(remoteAsset: unknown): ImageAsset | null {
        if (!remoteAsset) {
            return null;
        }

        if (typeof (remoteAsset as { extractMipmaps?: unknown }).extractMipmaps === 'function') {
            return remoteAsset as ImageAsset;
        }

        try {
            const nativeAsset = (remoteAsset as { _nativeAsset?: unknown })._nativeAsset ?? remoteAsset;
            return new ImageAsset(nativeAsset as never);
        } catch (error) {
            console.warn('[BattleUI] create remote avatar image asset failed', error);
            return null;
        }
    }

    private createCardCounterLabel(): Label | null {
        const parent = this.findNodeByPaths([
            'BattleNode/PlayingCards/CardCounterSprite',
            'PlayingCards/CardCounterSprite'
        ]);
        if (!parent?.isValid) {
            return null;
        }

        const labelNode = new Node('Label');
        labelNode.setParent(parent);
        labelNode.setPosition(new Vec3(0, 0, 0));
        const transform = labelNode.addComponent(UITransform);
        transform.setContentSize(90, 36);
        const label = labelNode.addComponent(Label);
        label.string = '0%';
        label.fontSize = 26;
        label.lineHeight = 32;
        label.color = new Color(255, 255, 255, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private shuffle<T>(items: T[]): T[] {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = result[index];
            result[index] = result[swapIndex];
            result[swapIndex] = temp;
        }
        return result;
    }

    private setLabelString(paths: string[], value: string) {
        const label = this.findComponentByPaths(paths, Label);
        if (label) {
            label.string = value;
        }
    }

    private bindClick(node: Node | null, handler: () => void) {
        if (!node?.isValid) {
            return;
        }

        const button = node.getComponent(Button) ?? node.addComponent(Button);
        button.interactable = true;
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.94;
        button.duration = 0.08;
        node.targetOff(this);
        node.on(Button.EventType.CLICK, handler, this);
    }

    onSelectCard(cardIndex: number) {
        const card = this.handCards[cardIndex];
        if (card) {
            this.selectedCard = card.id;
            console.log('[BattleUI] Card selected:', CARD_DEFINITIONS[card.id].name);
        }
    }

    async onPlayCard() {
        this.playSelectedHandCard();
    }

    async onDrawCard() {
        this.onCardPileClick();
    }

    async onBackToLobby() {
        try {
            await gameManager.leaveGame();
        } catch (error) {
            console.error('[BattleUI] Leave game error:', error);
        }

        gameManager.reset();
        await SceneManager.goToLobby();
    }

    onGameEnd(isWinner: boolean) {
        Platform.showToast(isWinner ? '恭喜获胜！' : '很遗憾，你输了', isWinner ? 'success' : 'none');
        setTimeout(() => {
            void this.onBackToLobby();
        }, 2000);
    }
}
