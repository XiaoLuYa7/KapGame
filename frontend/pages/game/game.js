// pages/game/game.js
Page({
  data: {
    gameId: null,
    gameState: null,
    selectedCard: null,
    pollTimer: null
  },

  onLoad(options) {
    const { gameId } = options;
    if (!gameId) {
      wx.redirectTo({
        url: '/pages/lobby/lobby'
      });
      return;
    }

    this.setData({ gameId });
    this.startPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  startPolling() {
    // 每2秒轮询一次游戏状态
    this.pollTimer = setInterval(() => {
      this.loadGameState();
    }, 2000);

    // 立即加载一次
    this.loadGameState();
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },

  async loadGameState() {
    const { gameId } = this.data;
    const app = getApp();

    try {
      const gameState = await app.request(`/game/${gameId}/state`, 'GET');
      this.setData({ gameState });

      // 如果游戏结束，停止轮询
      if (gameState.status === 'FINISHED') {
        this.stopPolling();
        setTimeout(() => {
          wx.showModal({
            title: '游戏结束',
            content: gameState.lastAction || '游戏已结束',
            showCancel: false,
            success: () => {
              wx.redirectTo({
                url: '/pages/lobby/lobby'
              });
            }
          });
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    }
  },

  selectCard(e) {
    const cardId = e.currentTarget.dataset.card;
    this.setData({
      selectedCard: cardId
    });
  },

  async playCard() {
    const { gameId, selectedCard, gameState } = this.data;
    if (!selectedCard) {
      wx.showToast({
        title: '请选择一张卡牌',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    wx.showLoading({
      title: '出牌中...',
    });

    try {
      // 如果有其他玩家，可以选择目标
      const otherPlayers = gameState.players.filter(p =>
        p.playerIndex !== gameState.yourPlayerIndex && p.isAlive
      );
      let targetPlayerIndex = null;

      if (otherPlayers.length > 0) {
        // 简单处理：选择第一个其他玩家
        targetPlayerIndex = otherPlayers[0].playerIndex;
      }

      const result = await app.request(`/game/${gameId}/play`, 'POST', {
        cardId: selectedCard,
        targetPlayerIndex
      });

      wx.hideLoading();
      this.setData({ selectedCard: null });
      this.loadGameState(); // 立即刷新状态
    } catch (err) {
      wx.hideLoading();
      console.error(err);
    }
  },

  async drawCard() {
    const { gameId } = this.data;
    const app = getApp();

    wx.showLoading({
      title: '抽牌中...',
    });

    try {
      const result = await app.request(`/game/${gameId}/draw`, 'POST');
      wx.hideLoading();
      this.loadGameState();
    } catch (err) {
      wx.hideLoading();
      console.error(err);
    }
  },

  backToLobby() {
    this.stopPolling();
    wx.redirectTo({
      url: '/pages/lobby/lobby'
    });
  }
});