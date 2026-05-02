/**
 * BattleUI - 对战界面控制器
 * 继承 BaseUI，统一场景生命周期管理
 */

import { _decorator, Component, Node, Sprite, Label, Button, Layout, EventHandler } from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { gameManager, GameState, PlayerInfo } from '../core/GameManager';
import { Platform } from '../utils/Platform';

const { ccclass, property } = _decorator;

@ccclass('BattleUI')
export class BattleUI extends BaseUI {
    static sceneName: string = SceneName.Battle;

    // 游戏状态
    gameState: GameState | null = null;

    // 选中的卡牌
    selectedCard: string | null = null;

    // 玩家信息标签
    @property(Label)
    playerNameLabel: Label | null = null;

    @property(Label)
    opponentNameLabel: Label | null = null;

    @property(Label)
    turnLabel: Label | null = null;

    // 卡牌容器
    @property(Node)
    cardContainer: Node | null = null;

    // 操作按钮
    @property(Button)
    playCardBtn: Button | null = null;

    @property(Button)
    drawCardBtn: Button | null = null;

    @property(Button)
    backBtn: Button | null = null;

    onInit() {
        super.onInit();
        this.gameState = gameManager.gameState;
    }

    onEnter(data?: SceneData) {
        console.log('[BattleUI] Battle entered');

        // 刷新游戏状态
        this.refreshGameState();

        // 绑定事件
        this.bindEvents();

        // 更新 UI
        this.updateUI();
    }

    onExit() {
        console.log('[BattleUI] Battle exited');
        this.unbindEvents();
    }

    // 刷新游戏状态
    private refreshGameState() {
        this.gameState = gameManager.gameState;

        if (!this.gameState) {
            console.warn('[BattleUI] No game state found');
        }
    }

    // 绑定事件
    private bindEvents() {
        if (this.playCardBtn) {
            this.playCardBtn.node.on(Button.EventType.CLICK, this.onPlayCard, this);
        }
        if (this.drawCardBtn) {
            this.drawCardBtn.node.on(Button.EventType.CLICK, this.onDrawCard, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackToLobby, this);
        }
    }

    // 解绑事件
    private unbindEvents() {
        if (this.playCardBtn) {
            this.playCardBtn.node.off(Button.EventType.CLICK, this.onPlayCard, this);
        }
        if (this.drawCardBtn) {
            this.drawCardBtn.node.off(Button.EventType.CLICK, this.onDrawCard, this);
        }
        if (this.backBtn) {
            this.backBtn.node.off(Button.EventType.CLICK, this.onBackToLobby, this);
        }
    }

    // 更新 UI
    private updateUI() {
        if (!this.gameState) return;

        // 更新回合状态
        if (this.turnLabel) {
            this.turnLabel.string = this.gameState.isYourTurn ? '你的回合' : '对手回合';
        }

        // 更新玩家信息
        if (this.playerNameLabel && this.gameState.players[this.gameState.yourPlayerIndex]) {
            const player = this.gameState.players[this.gameState.yourPlayerIndex];
            this.playerNameLabel.string = player.username;
        }

        if (this.opponentNameLabel) {
            const opponentIndex = 1 - this.gameState.yourPlayerIndex;
            if (this.gameState.players[opponentIndex]) {
                const opponent = this.gameState.players[opponentIndex];
                this.opponentNameLabel.string = opponent.username;
            }
        }
    }

    // 选择卡牌
    onSelectCard(cardIndex: number) {
        if (!this.gameState) return;

        const cards = this.gameState.handCards;
        if (cardIndex >= 0 && cardIndex < cards.length) {
            this.selectedCard = cards[cardIndex];
            console.log('[BattleUI] Card selected:', this.selectedCard);
        }
    }

    // 出牌
    async onPlayCard() {
        if (!this.selectedCard) {
            Platform.showToast('请先选择卡牌', 'none');
            return;
        }

        if (!gameManager.isMyTurn()) {
            Platform.showToast('不是你的回合', 'none');
            return;
        }

        try {
            await gameManager.playCard(this.selectedCard);
            this.selectedCard = null;
            Platform.showToast('出牌成功', 'success');
            this.updateUI();
        } catch (error: any) {
            Platform.showToast(error.message || '出牌失败', 'none');
        }
    }

    // 抽牌
    async onDrawCard() {
        if (!gameManager.isMyTurn()) {
            Platform.showToast('不是你的回合', 'none');
            return;
        }

        try {
            await gameManager.drawCard();
            Platform.showToast('抽牌成功', 'success');
            this.updateUI();
        } catch (error: any) {
            Platform.showToast(error.message || '抽牌失败', 'none');
        }
    }

    // 返回大厅
    async onBackToLobby() {
        try {
            await gameManager.leaveGame();
        } catch (error) {
            console.error('[BattleUI] Leave game error:', error);
        }

        gameManager.reset();
        await SceneManager.goToLobby();
    }

    // 游戏结束处理
    onGameEnd(isWinner: boolean) {
        if (isWinner) {
            Platform.showToast('恭喜获胜！', 'success');
        } else {
            Platform.showToast('很遗憾，你输了', 'none');
        }

        // 延迟返回大厅
        setTimeout(() => {
            this.onBackToLobby();
        }, 2000);
    }
}
