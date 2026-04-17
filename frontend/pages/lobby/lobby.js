// pages/lobby/lobby.js
Page({
  data: {
    username: '',
    gameId: null
  },

  onLoad() {
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

    this.loadUserInfo();
  },

  async loadUserInfo() {
    const app = getApp();
    try {
      const userInfo = await app.request('/auth/me', 'GET');
      this.setData({
        username: userInfo.username
      });
    } catch (err) {
      console.error(err);
    }
  },

  async startGame() {
    const app = getApp();
    wx.showLoading({
      title: '匹配中...',
    });

    try {
      const result = await app.request('/game/start', 'POST');

      this.setData({
        gameId: result.gameId
      });

      wx.hideLoading();
      wx.showToast({
        title: '匹配成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/game/game?gameId=${result.gameId}`
            });
          }, 1500);
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error(err);
    }
  },

  logout() {
    const app = getApp();
    app.clearToken();
    wx.redirectTo({
      url: '/pages/login/login'
    });
  }
});