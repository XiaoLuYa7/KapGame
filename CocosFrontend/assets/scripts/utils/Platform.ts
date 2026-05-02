/**
 * Platform - 平台适配工具
 * 用于检测当前运行环境，适配不同的 API
 */

export const Platform = {
    // 微信小游戏环境
    isWeChatGame: false,

    // 初始化平台检测
    init() {
        // 检测微信小游戏
        if (typeof window !== 'undefined' && (window as any).wx) {
            this.isWeChatGame = true;
        }
        // 检测其他平台...
    },

    // 获取微信 API
    get wx() {
        if (typeof window !== 'undefined') {
            return (window as any).wx;
        }
        return null;
    },

    // 获取系统信息
    async getSystemInfo() {
        if (this.isWeChatGame) {
            return new Promise((resolve, reject) => {
                this.wx?.getSystemInfo({
                    success: resolve,
                    fail: reject
                });
            });
        }
        return {
            pixelRatio: 1,
            windowWidth: 375,
            windowHeight: 812,
            statusBarHeight: 20
        };
    },

    // 微信登录
    async login() {
        if (this.isWeChatGame) {
            return new Promise((resolve, reject) => {
                this.wx?.login({
                    success: resolve,
                    fail: reject
                });
            });
        }
        return { code: 'mock_code' };
    },

    // 获取用户信息
    async getUserInfo() {
        if (this.isWeChatGame) {
            return new Promise((resolve, reject) => {
                this.wx?.getUserProfile({
                    desc: '用于完善用户资料',
                    success: resolve,
                    fail: reject
                });
            });
        }
        return {
            userInfo: {
                nickName: '测试用户',
                avatarUrl: ''
            }
        };
    },

    // 显示提示
    showToast(title: string, icon: 'success' | 'none' | 'loading' = 'none') {
        if (this.isWeChatGame) {
            this.wx?.showToast({ title, icon });
        } else {
            console.log(title);
        }
    },

    // 隐藏提示
    hideToast() {
        if (this.isWeChatGame) {
            this.wx?.hideToast();
        }
    },

    // 显示加载中
    showLoading(title: string = '加载中...') {
        if (this.isWeChatGame) {
            this.wx?.showLoading({ title });
        }
    },

    // 隐藏加载中
    hideLoading() {
        if (this.isWeChatGame) {
            this.wx?.hideLoading();
        }
    },

    async hasNotificationPermission(): Promise<boolean> {
        if (!this.isWeChatGame || !this.wx?.getSetting) {
            return false;
        }

        return new Promise(resolve => {
            this.wx.getSetting({
                withSubscriptions: true,
                success: (result: any) => {
                    const setting = result?.subscriptionsSetting;
                    if (!setting?.mainSwitch) {
                        resolve(false);
                        return;
                    }

                    const itemSettings = setting.itemSettings;
                    if (!itemSettings || Object.keys(itemSettings).length === 0) {
                        resolve(true);
                        return;
                    }

                    resolve(Object.keys(itemSettings).some(key => itemSettings[key] === 'accept'));
                },
                fail: () => resolve(false)
            });
        });
    },

    async openNotificationSettings(): Promise<boolean> {
        if (!this.isWeChatGame || !this.wx?.openSetting) {
            this.showToast('请在微信中开启通知权限', 'none');
            return false;
        }

        return new Promise(resolve => {
            this.wx.openSetting({
                withSubscriptions: true,
                success: async () => resolve(await this.hasNotificationPermission()),
                fail: () => resolve(false)
            });
        });
    }
};

// 初始化
Platform.init();
