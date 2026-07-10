import { _decorator, assetManager, Button, Color, ImageAsset, Label, Node, Sprite, SpriteFrame, sys, Texture2D, UITransform } from 'cc';
import { BaseUI } from './BaseUI';
import { dataManager } from '../core/DataManager';
import { gameManager, GameState, PlayerInfo } from '../core/GameManager';
import { SceneManager } from '../core/SceneManager';
import { Platform } from '../utils/Platform';
import { PopupStack } from './PopupStack';

const { ccclass } = _decorator;

export type BattleMatchType = 'SOLO' | 'DUO';
export type BattleRoomLevel = 'PRIMARY' | 'MEDIUM' | 'HIGH';

export interface BattleMatchOpenOptions {
    matchType: BattleMatchType;
    roomLevel: BattleRoomLevel;
}

const ROOM_LABELS: Record<BattleRoomLevel, string> = {
    PRIMARY: '初级场',
    MEDIUM: '中级场',
    HIGH: '高级场',
};

const ROOM_COSTS: Record<BattleRoomLevel, number> = {
    PRIMARY: 24,
    MEDIUM: 68,
    HIGH: 128,
};

const EXPECTED_MATCH_SECONDS: Record<BattleRoomLevel, number> = {
    PRIMARY: 5,
    MEDIUM: 8,
    HIGH: 10,
};

@ccclass('BattleMatchPopupLayer')
export class BattleMatchPopupLayer extends BaseUI {
    private readonly adLimitPerDay = 3;
    private readonly adStorageKey = 'kap_battle_match_card_counter_ad';
    private readonly mockMatchSuccessDelaySeconds = 3;
    private options: BattleMatchOpenOptions = {
        matchType: 'SOLO',
        roomLevel: 'PRIMARY',
    };
    private freeCardCounterCount = 0;
    private matchingTimer = 0;
    private matchTickTimer = 0;
    private matchElapsedSeconds = 0;
    private unsubscribeUserData: (() => void) | null = null;

    protected onInit() {
        super.onInit();
        this.unsubscribeUserData = dataManager.subscribeUserData(() => this.refreshUserData());
        this.bindRuntimeEvents();
    }

    protected onCleanup() {
        this.unsubscribeUserData?.();
        this.unsubscribeUserData = null;
        this.clearMatchingTimer();
    }

    open(options: BattleMatchOpenOptions) {
        this.options = options;
        PopupStack.open(this.node);
        this.bindRuntimeEvents();
        this.exitMatchingState();
        this.refreshAll();
    }

    close() {
        this.exitMatchingState();
        PopupStack.close(this.node);
    }

    private refreshAll() {
        this.refreshTitle();
        this.refreshUserData();
        this.refreshCardCounterState();
    }

    private refreshTitle() {
        const matchTitle = this.options.matchType === 'DUO' ? '捣蛋工坊双人赛' : '捣蛋工坊个人赛';
        this.setLabelString([
            'TopBarNode/TitleNode/TitleLabel',
            'TitleNode/TitleLabel',
            'TitleLabel',
        ], matchTitle);

        this.setLabelString([
            'TopBarNode/TitleNode/ModeLebel',
            'TopBarNode/TitleNode/ModeLabel',
            'TitleNode/ModeLebel',
            'TitleNode/ModeLabel',
        ], ROOM_LABELS[this.options.roomLevel]);

        this.setLabelString([
            'ButtonsAndTipsNode/MatchLabel',
            'MatchLabel',
        ], `匹配消耗${ROOM_COSTS[this.options.roomLevel]}金币`);
    }

    private refreshUserData() {
        this.setLabelString([
            'ResourcesPanel/DiamondPanel/DiamondLabel',
            'DiamondPanel/DiamondLabel',
            'DiamondLabel',
        ], String(dataManager.userData.diamond ?? 0));

        this.setLabelString([
            'ResourcesPanel/GoldPanel/GoldLabel',
            'GoldPanel/GoldLabel',
            'GoldLabel',
        ], String(dataManager.userData.gold ?? 0));

        this.setLabelString([
            'MatchNode/CurrentUserNode/UserNameSprite/Label',
            'MatchNode/CurrentUserNode/NameLabel',
            'CurrentUserNode/UserNameSprite/Label',
            'CurrentUserNode/NameLabel',
        ], dataManager.userData.nickName || dataManager.userData.username || '玩家');

        this.setAvatar(dataManager.userData.avatarUrl);
    }

    private refreshCardCounterState() {
        const watchedCount = this.getTodayAdCount();
        this.setLabelString([
            'ButtonsAndTipsNode/ButtonsNode/CardCounterButton/TipsLabel',
            'ButtonsNode/CardCounterButton/TipsLabel',
            'CardCounterButton/TipsLabel',
        ], `每日：${watchedCount}/${this.adLimitPerDay}`);

        this.setLabelString([
            'ButtonsAndTipsNode/ButtonsNode/CardCounterButton/Label',
            'ButtonsNode/CardCounterButton/Label',
            'CardCounterButton/Label',
        ], this.freeCardCounterCount > 0 ? `记牌器x${this.freeCardCounterCount}` : '看广告得记牌器');

        const cardCounterButton = this.findNodeByPaths([
            'ButtonsAndTipsNode/ButtonsNode/CardCounterButton',
            'ButtonsNode/CardCounterButton',
            'CardCounterButton',
        ]);
        const button = cardCounterButton?.getComponent(Button);
        if (button) {
            button.interactable = watchedCount < this.adLimitPerDay;
        }
    }

    private bindRuntimeEvents() {
        this.bindClick(this.findNodeByPaths([
            'TopBarNode/BackButton',
            'BackButton',
        ]), () => this.onBack());

        this.bindClick(this.findNodeByPaths([
            'SelectProps/AddPropsNode',
            'AddPropsNode',
        ]), () => this.onSelectProps());

        this.bindClick(this.findNodeByPaths([
            'ButtonsAndTipsNode/ButtonsNode/CardCounterButton',
            'ButtonsNode/CardCounterButton',
            'CardCounterButton',
        ]), () => this.onWatchCardCounterAd());

        this.bindClick(this.findNodeByPaths([
            'ButtonsAndTipsNode/ButtonsNode/StartGameButton',
            'ButtonsNode/StartGameButton',
            'StartGameButton',
        ]), () => this.onStartGame());
    }

    private onBack() {
        this.exitMatchingState();
        PopupStack.close(this.node, { resumePrevious: true });
    }

    private onSelectProps() {
        Platform.showToast('道具选择功能稍后开放', 'none');
    }

    private onWatchCardCounterAd() {
        if (this.getTodayAdCount() >= this.adLimitPerDay) {
            Platform.showToast('今日广告次数已用完', 'none');
            this.refreshCardCounterState();
            return;
        }

        Platform.showLoading('广告播放中...');
        setTimeout(() => {
            Platform.hideLoading();
            this.incrementTodayAdCount();
            this.freeCardCounterCount += 1;
            this.refreshCardCounterState();
            Platform.showToast('获得免费记牌器x1', 'success');
        }, 1200);
    }

    private onStartGame() {
        if (this.matchingTimer) {
            return;
        }

        this.enterMatchingState();
        this.matchingTimer = setTimeout(() => {
            this.matchingTimer = 0;
            this.stopMatchClock();
            this.createMockBattleState();
            void SceneManager.goToBattleWithData({
                matchType: this.options.matchType,
                roomLevel: this.options.roomLevel,
                cardCounterCount: this.freeCardCounterCount,
            }).catch((error) => {
                console.warn('[BattleMatchPopupLayer] enter battle scene failed:', error);
                this.exitMatchingState();
                Platform.showToast('进入对战失败，请重试', 'none');
            });
        }, this.mockMatchSuccessDelaySeconds * 1000);
    }

    private enterMatchingState() {
        this.clearMatchingTimer();
        this.matchElapsedSeconds = 0;
        this.setMatchingPanelActive(true);
        this.refreshMatchTimeLabels();
        this.startMatchClock();
    }

    private exitMatchingState() {
        this.clearMatchingTimer();
        this.matchElapsedSeconds = 0;
        this.setMatchingPanelActive(false);
        this.refreshMatchTimeLabels();
    }

    private setMatchingPanelActive(isMatching: boolean) {
        this.setNodeActive([
            'SelectProps',
        ], !isMatching);

        this.setNodeActive([
            'ButtonsAndTipsNode',
        ], !isMatching);

        const matchTimeNode = isMatching
            ? this.findOrCreateMatchTimeNode()
            : this.findNodeByPaths(['MatchTimeNode']);
        if (matchTimeNode) {
            matchTimeNode.active = isMatching;
        }
    }

    private startMatchClock() {
        this.stopMatchClock();
        this.matchTickTimer = setInterval(() => {
            if (!this.node?.isValid) {
                this.stopMatchClock();
                return;
            }
            this.matchElapsedSeconds += 1;
            this.refreshMatchTimeLabels();
        }, 1000);
    }

    private stopMatchClock() {
        if (!this.matchTickTimer) {
            return;
        }
        clearInterval(this.matchTickTimer);
        this.matchTickTimer = 0;
    }

    private refreshMatchTimeLabels() {
        this.setLabelString([
            'MatchTimeNode/MatchTimeLabel',
            'MatchTimeLabel',
        ], this.formatMatchTime(this.matchElapsedSeconds));

        this.setLabelString([
            'MatchTimeNode/ExpectedTimeNode/ExpectedTimeLabel',
            'ExpectedTimeNode/ExpectedTimeLabel',
            'ExpectedTimeLabel',
        ], this.formatMatchTime(EXPECTED_MATCH_SECONDS[this.options.roomLevel]));
    }

    private formatMatchTime(totalSeconds: number): string {
        const normalizedSeconds = Math.max(0, Math.floor(totalSeconds));
        const minutes = Math.floor(normalizedSeconds / 60);
        const seconds = normalizedSeconds % 60;
        const minuteText = minutes < 10 ? `0${minutes}` : String(minutes);
        const secondText = seconds < 10 ? `0${seconds}` : String(seconds);
        return `${minuteText}:${secondText}`;
    }

    private createMockBattleState() {
        const playerCount = 5;
        const players: PlayerInfo[] = [];
        for (let i = 0; i < playerCount; i++) {
            players.push({
                playerIndex: i,
                username: i === 0
                    ? (dataManager.userData.nickName || dataManager.userData.username || '玩家')
                    : `对手${i}`,
                avatarUrl: i === 0 ? dataManager.userData.avatarUrl : '',
                hp: 3,
                handCount: 5,
                isAlive: true,
                isAi: i !== 0,
            });
        }

        const state: GameState = {
            status: 'PLAYING',
            players,
            deckRemaining: this.options.matchType === 'DUO' ? 35 : 28,
            currentTurn: 0,
            yourPlayerIndex: 0,
            handCards: ['PRETEND_STUPID', 'REVERSE_TRANSMISSION', 'BLAME_SHIFTING', 'LOW_LEVEL_CHANNEL', 'DETECTION_RADAR'],
            isYourTurn: true,
            matchType: this.options.matchType,
            roomLevel: this.options.roomLevel,
        };
        gameManager.updateGameState(state);
        gameManager.isInGame = true;
    }

    private getTodayAdCount(): number {
        const state = this.readAdState();
        return state.count;
    }

    private incrementTodayAdCount() {
        const state = this.readAdState();
        state.count = Math.min(this.adLimitPerDay, state.count + 1);
        sys.localStorage.setItem(this.adStorageKey, JSON.stringify(state));
    }

    private readAdState(): { date: string; count: number } {
        const today = this.getTodayString();
        const raw = sys.localStorage.getItem(this.adStorageKey);
        if (!raw) {
            return { date: today, count: 0 };
        }

        try {
            const parsed = JSON.parse(raw) as { date?: string; count?: number };
            if (parsed.date !== today) {
                return { date: today, count: 0 };
            }
            return { date: today, count: Math.max(0, Math.min(this.adLimitPerDay, Number(parsed.count || 0))) };
        } catch (error) {
            console.warn('[BattleMatchPopupLayer] read ad state failed:', error);
            return { date: today, count: 0 };
        }
    }

    private getTodayString(): string {
        const now = new Date();
        const monthValue = now.getMonth() + 1;
        const dateValue = now.getDate();
        const month = monthValue < 10 ? `0${monthValue}` : String(monthValue);
        const day = dateValue < 10 ? `0${dateValue}` : String(dateValue);
        return `${now.getFullYear()}-${month}-${day}`;
    }

    private clearMatchingTimer() {
        if (this.matchingTimer) {
            clearTimeout(this.matchingTimer);
            this.matchingTimer = 0;
        }
        this.stopMatchClock();
    }

    private setNodeActive(paths: string[], active: boolean) {
        const target = this.findNodeByPaths(paths);
        if (target) {
            target.active = active;
        }
    }

    private setLabelString(paths: string[], value: string) {
        const label = this.findComponentByPaths(paths, Label);
        if (label) {
            label.string = value;
        }
    }

    private setAvatar(avatarUrl: string) {
        const avatarSprite = this.findComponentByPaths([
            'MatchNode/CurrentUserNode/AvatarNode/Mask/Avatar',
            'MatchNode/CurrentUserNode/AvatarNode/Avatar',
            'CurrentUserNode/AvatarNode/Mask/Avatar',
            'CurrentUserNode/AvatarNode/Avatar',
        ], Sprite);
        if (!avatarSprite || !avatarUrl || !/^https?:\/\//i.test(avatarUrl)) {
            return;
        }

        assetManager.loadRemote(avatarUrl, (error, remoteAsset) => {
            if (error || !remoteAsset || !avatarSprite.node?.isValid) {
                return;
            }
            this.applyRemoteAvatarSprite(avatarSprite, remoteAsset);
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
            console.warn('[BattleMatchPopupLayer] create remote avatar image asset failed', error);
            return null;
        }
    }

    private findOrCreateMatchTimeNode(): Node | null {
        const existingNode = this.findNodeByPaths(['MatchTimeNode']);
        if (existingNode) {
            return existingNode;
        }

        const buttonsNode = this.findNodeByPaths(['ButtonsAndTipsNode']);
        const parentNode = buttonsNode?.parent ?? this.node;
        if (!parentNode?.isValid) {
            return null;
        }

        const matchTimeNode = new Node('MatchTimeNode');
        matchTimeNode.layer = parentNode.layer;
        matchTimeNode.setParent(parentNode);
        matchTimeNode.setPosition(buttonsNode?.position.x ?? 0, buttonsNode?.position.y ?? -335, 0);
        matchTimeNode.active = false;

        const transform = matchTimeNode.addComponent(UITransform);
        transform.setContentSize(420, 120);

        this.createFallbackLabel(matchTimeNode, 'MatchingTitleLabel', '正在匹配对手', 26, 0, 36);
        this.createFallbackLabel(matchTimeNode, 'MatchTimeLabel', '00:00', 42, 0, -2);

        const expectedTimeNode = new Node('ExpectedTimeNode');
        expectedTimeNode.layer = matchTimeNode.layer;
        expectedTimeNode.setParent(matchTimeNode);
        expectedTimeNode.setPosition(0, -45, 0);
        expectedTimeNode.addComponent(UITransform).setContentSize(260, 34);
        this.createFallbackLabel(expectedTimeNode, 'ExpectedTimeLabel', '00:05', 22, 0, 0);

        return matchTimeNode;
    }

    private createFallbackLabel(parentNode: Node, name: string, text: string, fontSize: number, x: number, y: number) {
        const labelNode = new Node(name);
        labelNode.layer = parentNode.layer;
        labelNode.setParent(parentNode);
        labelNode.setPosition(x, y, 0);
        labelNode.addComponent(UITransform).setContentSize(260, fontSize + 12);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = new Color(255, 255, 255, 255);
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
}
