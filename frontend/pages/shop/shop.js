// 商城页
Page({
  data: {
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    userData: {
      username: '',
      avatarUrl: '',
      rank: '青铜 III',
      diamond: 0,
      gold: 0,
      level: 0,
      exp: 0
    },
    showSettings: false,
    settings: {
      soundEffectsEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      showOnlineStatus: true,
      showLastActiveTime: true
    },
    version: '1.0.0'
  },

  onLoad() {
    console.log('商城页加载');
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.isLoggedIn) {
      this.loadUserData();
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
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null,
        'userData.username': '',
        'userData.avatarUrl': '',
        'userData.rank': '青铜 III',
        'userData.diamond': 0,
        'userData.gold': 0,
        'userData.level': 0
      });
    }
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

  // 点击模块
  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    const names = ['', '商城', '寻宝', '荣耀大明星', '邀请有奖', '赏金任务', '翻牌有奖', '每日签到', '等级奖励'];
    wx.showToast({ title: names[id] || '', icon: 'none' });
  },

  // 打开设置弹窗
  onSettingsTap() {
    this.setData({ showSettings: true });
  },

  // 关闭设置弹窗
  onCloseSettings() {
    this.setData({ showSettings: false });
  },

  // 绑定手机号
  onBindPhone() {
    wx.showToast({ title: '绑定手机号', icon: 'none' });
  },

  // 实名认证
  onVerify() {
    wx.showToast({ title: '实名认证', icon: 'none' });
  },

  // 切换音效
  onSoundEffectsChange(e) {
    this.updateSetting('soundEffectsEnabled', e.detail.value);
  },

  // 切换音乐
  onMusicChange(e) {
    this.updateSetting('musicEnabled', e.detail.value);
  },

  // 切换震动
  onVibrationChange(e) {
    this.updateSetting('vibrationEnabled', e.detail.value);
  },

  // 切换显示在线状态
  onShowOnlineStatusChange(e) {
    this.updateSetting('showOnlineStatus', e.detail.value);
  },

  // 切换显示最后活跃
  onShowLastActiveTimeChange(e) {
    this.updateSetting('showLastActiveTime', e.detail.value);
  },

  // 更新设置
  updateSetting(key, value) {
    const settings = { ...this.data.settings, [key]: value };
    this.setData({ settings });
    const app = getApp();
    if (app.globalData.userInfo) {
      app.globalData.userInfo[key] = value;
    }
  },

  // 隐私政策
  onPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '隐私政策内容...',
      showCancel: false
    });
  },

  // 用户协议
  onUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '用户协议内容...',
      showCancel: false
    });
  },

  // 阻止滑动穿透
  preventTouchMove() {
    return false;
  }
});
