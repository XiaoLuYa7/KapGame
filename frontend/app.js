// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:8080/api'
  },

  onLaunch() {
    // 从本地存储获取token
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  },

  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  clearToken() {
    this.globalData.token = null;
    wx.removeStorageSync('token');
  },

  request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const header = {
        'Content-Type': 'application/json'
      };

      if (app.globalData.token) {
        header['Authorization'] = 'Bearer ' + app.globalData.token;
      }

      wx.request({
        url: app.globalData.baseUrl + url,
        method: method,
        data: data,
        header: header,
        success: (res) => {
          if (res.statusCode === 200) {
            if (res.data.success) {
              resolve(res.data.data);
            } else {
              // 显示错误信息
              wx.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              });
              reject(new Error(res.data.message));
            }
          } else if (res.statusCode === 401) {
            // 未授权，token可能过期或无效
            this.clearToken();

            // 显示登录提示
            wx.showModal({
              title: '登录提示',
              content: '请先登录后继续操作',
              confirmText: '去登录',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 获取当前页面，如果是首页则不跳转
                  const pages = getCurrentPages();
                  const currentPage = pages[pages.length - 1];
                  const isHomePage = currentPage && currentPage.route === 'pages/home/home';

                  if (!isHomePage) {
                    // 跳转到首页（首页有登录按钮）
                    wx.switchTab({
                      url: '/pages/home/home'
                    });
                  }
                }
              }
            });

            reject(new Error('未授权，请先登录'));
          } else {
            wx.showToast({
              title: `请求失败: ${res.statusCode}`,
              icon: 'none'
            });
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('Request failed:', err);
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }
});