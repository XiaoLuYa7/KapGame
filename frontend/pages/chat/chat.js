// pages/chat/chat.js
Page({
  data: {
    currentTab: 'messages', // messages, friends
    messages: [
      { id: 1, type: 'system', avatar: 'https://ui-avatars.com/api/?name=系统公告&background=0D8ABC&color=fff&size=100', name: '系统公告', content: '新版本上线，新增段位挑战模式！', time: '10:30', unread: 0 },
      { id: 2, type: 'friend', avatar: 'https://ui-avatars.com/api/?name=小明&background=3498db&color=fff&size=100', name: '小明', content: '晚上一起开黑吗？', time: '昨天', unread: 3 },
      { id: 3, type: 'friend', avatar: 'https://ui-avatars.com/api/?name=小红&background=e74c3c&color=fff&size=100', name: '小红', content: '你的卡组真厉害！', time: '前天', unread: 1 },
      { id: 4, type: 'friend', avatar: 'https://ui-avatars.com/api/?name=战队队长&background=9b59b6&color=fff&size=100', name: '战队队长', content: '本周战队赛开始报名', time: '3天前', unread: 0 }
    ],
    friends: [
      { id: 1, avatar: 'https://ui-avatars.com/api/?name=小明&background=3498db&color=fff&size=100', name: '小明', rank: '黄金 II', status: 'online', lastOnline: '刚刚' },
      { id: 2, avatar: 'https://ui-avatars.com/api/?name=小红&background=e74c3c&color=fff&size=100', name: '小红', rank: '白银 I', status: 'online', lastOnline: '5分钟前' },
      { id: 3, avatar: 'https://ui-avatars.com/api/?name=战队队长&background=9b59b6&color=fff&size=100', name: '战队队长', rank: '钻石 III', status: 'offline', lastOnline: '2小时前' },
      { id: 4, avatar: 'https://ui-avatars.com/api/?name=大神玩家&background=f39c12&color=fff&size=100', name: '大神玩家', rank: '王者', status: 'offline', lastOnline: '1天前' },
      { id: 5, avatar: 'https://ui-avatars.com/api/?name=新手玩家&background=2ecc71&color=fff&size=100', name: '新手玩家', rank: '青铜 III', status: 'online', lastOnline: '刚刚' }
    ],
    searchKeyword: '',
    filteredFriends: []
  },

  onLoad() {
    this.setData({
      filteredFriends: this.data.friends
    });
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 搜索好友
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    if (!keyword.trim()) {
      this.setData({ filteredFriends: this.data.friends });
      return;
    }

    const filtered = this.data.friends.filter(friend =>
      friend.name.includes(keyword) || friend.rank.includes(keyword)
    );
    this.setData({ filteredFriends: filtered });
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      filteredFriends: this.data.friends
    });
  },

  // 点击消息项
  onMessageTap(e) {
    const { id } = e.currentTarget.dataset;
    const message = this.data.messages.find(m => m.id === id);
    if (!message) return;

    // 标记为已读
    const messages = this.data.messages.map(m =>
      m.id === id ? { ...m, unread: 0 } : m
    );
    this.setData({ messages });

    wx.showToast({
      title: `进入与${message.name}的聊天`,
      icon: 'none'
    });
  },

  // 点击好友项
  onFriendTap(e) {
    const { id } = e.currentTarget.dataset;
    const friend = this.data.friends.find(f => f.id === id);
    if (!friend) return;

    wx.showToast({
      title: `开始与${friend.name}聊天`,
      icon: 'none'
    });
  },

  // 添加好友
  onAddFriend() {
    wx.showToast({
      title: '添加好友功能开发中',
      icon: 'none'
    });
  },

  // 刷新列表
  onRefresh() {
    wx.showLoading({ title: '刷新中' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 1000);
  }
});