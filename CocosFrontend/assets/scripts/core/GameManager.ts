/**
 * GameManager - 游戏状态管理
 */

import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';
import { dataManager } from './DataManager';

export interface GameState {
    status: 'WAITING' | 'PLAYING' | 'ENDED';
    players: PlayerInfo[];
    deckRemaining: number;
    currentTurn: number;
    yourPlayerIndex: number;
    handCards: string[];
    isYourTurn: boolean;
}

export interface PlayerInfo {
    playerIndex: number;
    username: string;
    hp: number;
    handCount: number;
    isAlive: boolean;
    isAi: boolean;
}

export class GameManager {
    private static instance: GameManager;

    // 当前游戏状态
    gameState: GameState | null = null;

    // 是否在游戏中
    isInGame: boolean = false;

    private constructor() {}

    static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    // 加入游戏
    async joinGame(mode: string = 'rank') {
        Platform.showLoading('正在加入游戏...');

        try {
            const result = await Http.post('/game/join', { mode });
            this.gameState = result;
            this.isInGame = true;
            Platform.hideLoading();
            return result;
        } catch (error: any) {
            Platform.hideLoading();
            Platform.showToast(error.message || '加入游戏失败', 'none');
            throw error;
        }
    }

    // 离开游戏
    async leaveGame() {
        try {
            await Http.post('/game/leave');
        } catch (error) {
            console.error('Leave game error:', error);
        }
        this.gameState = null;
        this.isInGame = false;
    }

    // 出牌
    async playCard(card: string) {
        if (!this.gameState || !this.gameState.isYourTurn) {
            Platform.showToast('不是你的回合', 'none');
            return;
        }

        try {
            const result = await Http.post('/game/play', { card });
            this.gameState = result;
            return result;
        } catch (error: any) {
            Platform.showToast(error.message || '出牌失败', 'none');
            throw error;
        }
    }

    // 抽牌
    async drawCard() {
        if (!this.gameState || !this.gameState.isYourTurn) {
            Platform.showToast('不是你的回合', 'none');
            return;
        }

        try {
            const result = await Http.post('/game/draw');
            this.gameState = result;
            return result;
        } catch (error: any) {
            Platform.showToast(error.message || '抽牌失败', 'none');
            throw error;
        }
    }

    // 更新游戏状态
    updateGameState(state: GameState) {
        this.gameState = state;
    }

    // 获取手牌
    getHandCards(): string[] {
        return this.gameState?.handCards || [];
    }

    // 是否轮到自己
    isMyTurn(): boolean {
        return this.gameState?.isYourTurn || false;
    }

    // 重置游戏
    reset() {
        this.gameState = null;
        this.isInGame = false;
    }
}

export const gameManager = GameManager.getInstance();
