// pages/home/home.js
Page({
  data: {
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    userData: {
      username: '',
      avatarUrl: '',
      rank: '未登录',
      diamond: 0,
      gold: 0,
      level: 0,
      exp: 0
    },

    // 活动信息
    activities: [],

    // 玩法模式
    gameModes: [
      { id: 1, title: '段位挑战', desc: '排位对战，提升段位', icon: 'trophy', color: '#f39c12', bgColor: '#fef9e7', route: 'rank' },
      { id: 2, title: '休闲模式', desc: '轻松对战，无压力', icon: 'smile', color: '#2ecc71', bgColor: '#e8f8f5', route: 'casual' },
      { id: 3, title: '好友同玩', desc: '邀请好友一起玩', icon: 'users', color: '#3498db', bgColor: '#ebf5fb', route: 'friend' }
    ],

    // 功能按钮
    functions: [
      { id: 1, title: '排行榜', icon: 'bar-chart', color: '#e74c3c', route: 'rankings' },
      { id: 2, title: '战队信息', icon: 'flag', color: '#9b59b6', route: 'team' },
      { id: 3, title: '背包', icon: 'shopping-bag', color: '#1abc9c', route: 'backpack' },
      { id: 4, title: '商店', icon: 'shopping-cart', color: '#f39c12', route: 'shop' }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadUserData();
  },

  onShow() {
    this.checkLoginStatus();
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        'userData.username': userInfo.nickName || '微信用户',
        'userData.avatarUrl': userInfo.avatarUrl || ''
      });
      // 已登录，加载活动
      this.loadActivities();
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null,
        'userData.username': '',
        'userData.avatarUrl': '',
        'userData.rank': '未登录'
      });
    }
  },

  // 加载活动列表
  async loadActivities() {
    const app = getApp();
    try {
      // 调用后端获取进行中的活动
      const activities = await app.request('/activities', 'GET');
      if (Array.isArray(activities)) {
        // 处理每个活动的倒计时信息
        const processedActivities = activities.map(activity => {
          const endTime = new Date(activity.endTime).getTime();
          const now = Date.now();
          const remaining = endTime - now;

          // 剩余时间小于等于1小时（3600000ms）时显示倒计时
          const showCountdown = remaining > 0 && remaining <= 3600000;

          // 计算距离结束的总秒数
          const totalSeconds = Math.max(0, Math.floor(remaining / 1000));

          return {
            ...activity,
            showCountdown,
            remainingSeconds: totalSeconds,
            countdownText: this.formatCountdown(totalSeconds)
          };
        });
        this.setData({ activities: processedActivities });

        // 启动倒计时定时器
        this.startCountdownTimer();
      }
    } catch (err) {
      console.error('加载活动失败:', err);
    }
  },

  // 启动倒计时定时器
  startCountdownTimer() {
    // 先清除已有的定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    // 每秒更新一次倒计时
    this.countdownTimer = setInterval(() => {
      const activities = this.data.activities;
      let hasActiveCountdown = false;

      activities.forEach((activity, index) => {
        if (activity.showCountdown && activity.remainingSeconds > 0) {
          const newRemaining = activity.remainingSeconds - 1;
          activities[index] = {
            ...activity,
            remainingSeconds: newRemaining,
            countdownText: this.formatCountdown(newRemaining)
          };
          hasActiveCountdown = true;
        }
      });

      this.setData({ activities });

      // 如果没有活跃的倒计时，清除定时器
      if (!hasActiveCountdown && this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }, 1000);
  },

  // 格式化倒计时为 HH:MM:SS
  formatCountdown(totalSeconds) {
    if (totalSeconds <= 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },

  // 加载用户数据
  async loadUserData() {
    if (!this.data.isLoggedIn) return;

    const app = getApp();
    try {
      const userData = await app.request('/user/info');
      if (userData) {
        this.setData({
          'userData.rank': userData.rank || '青铜 III',
          'userData.diamond': userData.diamond || 0,
          'userData.gold': userData.gold || 0,
          'userData.level': userData.level || 0,
          'userData.exp': userData.exp || 0
        });
      }
    } catch (err) {
      console.error('加载用户数据失败:', err);
    }
  },

  // 微信登录
  async handleLogin() {
    if (this.data.isLoggedIn) return;

    wx.showLoading({ title: '登录中...' });

    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: (res) => resolve(res), fail: reject });
      });

      const { userInfo } = await new Promise((resolve, reject) => {
        wx.getUserProfile({ desc: '用于完善用户资料', success: resolve, fail: reject });
      });

      const app = getApp();
      const result = await app.request('/auth/wechat-login', 'POST', {
        code,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      });

      app.setToken(result.token);
      wx.setStorageSync('userInfo', userInfo);

      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        'userData.username': userInfo.nickName,
        'userData.avatarUrl': userInfo.avatarUrl
      });

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });

      this.loadUserData();
      this.loadActivities();

    } catch (err) {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败', icon: 'error' });
    }
  },

  // 跳转到游戏大厅
  goToLobby() {
    if (!this.data.isLoggedIn) {
      wx.showModal({ title: '提示', content: '请先登录', showCancel: false });
      return;
    }
    wx.switchTab({ url: '/pages/lobby/lobby' });
  },

  // 处理玩法模式点击
  handleGameModeTap(e) {
    const { route } = e.currentTarget.dataset;
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    switch (route) {
      case 'rank':
        wx.navigateTo({ url: '/pages/lobby/lobby?mode=rank' });
        break;
      case 'casual':
        wx.navigateTo({ url: '/pages/lobby/lobby?mode=casual' });
        break;
      case 'friend':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
    }
  },

  // 处理功能按钮点击
  handleFunctionTap(e) {
    const { route } = e.currentTarget.dataset;
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    wx.showToast({ title: `${route}功能开发中`, icon: 'none' });
  },

  // 处理活动点击
  handleActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({ title: `活动${id}详情`, icon: 'none' });
  }
});
