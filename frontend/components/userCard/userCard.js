// 用户卡片组件
Component({
  properties: {
    userData: {
      type: Object,
      value: {
        username: '',
        avatarUrl: '',
        rank: '未登录',
        diamond: 0,
        gold: 0,
        level: 0,
        exp: 0
      }
    },
    isLoggedIn: {
      type: Boolean,
      value: false
    }
  },

  data: {},

  methods: {
    // 点击登录
    onTap() {
      if (!this.data.isLoggedIn) {
        wx.navigateTo({ url: '/pages/login/login' });
      }
    }
  }
});
