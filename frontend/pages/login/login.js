// pages/login/login.js
Page({
  data: {
    isLogin: true, // true:登录, false:注册
    username: '',
    password: ''
  },

  onLoad() {
    // 检查是否已登录
    const app = getApp();
    if (app.globalData.token) {
      wx.redirectTo({
        url: '/pages/lobby/lobby'
      });
    }
  },

  toggleMode() {
    this.setData({
      isLogin: !this.data.isLogin
    });
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  async submit() {
    console.log('Login submit called', this.data);
    const { username, password, isLogin } = this.data;
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    console.log('Sending request to', endpoint, { username, password });

    try {
      const result = await app.request(endpoint, 'POST', {
        username,
        password
      });

      // 保存token
      app.setToken(result.token);

      wx.showToast({
        title: isLogin ? '登录成功' : '注册成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/lobby/lobby'
            });
          }, 1500);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
});