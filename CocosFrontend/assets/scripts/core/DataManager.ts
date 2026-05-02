/**
 * DataManager - 全局数据管理
 */

import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';

export interface UserData {
    username: string;
    avatarUrl: string;
    rank: string;
    diamond: number;
    gold: number;
    level: number;
    exp: number;
}

export interface Activity {
    id: number;
    title: string;
    activityType: string;
    imageUrl: string;
    showCountdown: boolean;
    countdownText?: string;
}

export interface GameMode {
    id: number;
    title: string;
    desc: string;
    icon: string;
    route: string;
}

export interface FunctionItem {
    id: number;
    title: string;
    icon: string;
    route: string;
}

export class DataManager {
    private static instance: DataManager;

    // 用户数据
    userData: UserData = {
        username: '',
        avatarUrl: '',
        rank: '未登录',
        diamond: 0,
        gold: 0,
        level: 0,
        exp: 0
    };

    // 是否已登录
    isLoggedIn: boolean = false;
    loginSessionId: number = Date.now();

    // 活动列表
    activities: Activity[] = [];

    // 玩法模式
    gameModes: GameMode[] = [
        { id: 1, title: '段位挑战', desc: '排位对战，提升段位', icon: 'trophy', route: 'rank' },
        { id: 2, title: '休闲模式', desc: '轻松对战，无压力', icon: 'smile', route: 'casual' },
        { id: 3, title: '好友同玩', desc: '邀请好友一起玩', icon: 'users', route: 'friend' }
    ];

    // 功能列表
    functions: FunctionItem[] = [
        { id: 1, title: '排行榜', icon: 'bar-chart', route: 'rankings' },
        { id: 2, title: '战队', icon: 'flag', route: 'team' },
        { id: 3, title: '背包', icon: 'gift', route: 'backpack' },
        { id: 4, title: '商店', icon: 'diamond', route: 'shop' },
        { id: 5, title: '任务', icon: 'smile', route: 'task' },
        { id: 6, title: '邮件', icon: 'bar-chart', route: 'mail' }
    ];

    private constructor() {
        this.loadFromStorage();
    }

    static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    // 从本地存储加载
    loadFromStorage() {
        if (Platform.isWeChatGame) {
            const token = wx.getStorageSync('token');
            const userInfo = wx.getStorageSync('userInfo');

            if (token && userInfo) {
                this.isLoggedIn = true;
                this.loginSessionId = Date.now();
                Http.token = token;
                this.userData = {
                    username: userInfo.nickName || '微信用户',
                    avatarUrl: userInfo.avatarUrl || '',
                    rank: '青铜 III',
                    diamond: 0,
                    gold: 0,
                    level: 0,
                    exp: 0
                };
            }
        }
    }

    // 保存到本地存储
    saveToStorage(userInfo?: any) {
        if (Platform.isWeChatGame && userInfo) {
            wx.setStorageSync('userInfo', userInfo);
        }
    }

    // 设置登录状态
    setLoggedIn(token: string, userInfo: any) {
        this.isLoggedIn = true;
        this.loginSessionId = Date.now();
        Http.setToken(token);
        this.userData = {
            username: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || '',
            rank: '青铜 III',
            diamond: 0,
            gold: 0,
            level: 0,
            exp: 0
        };
        this.saveToStorage(userInfo);
    }

    // 登出
    logout() {
        this.isLoggedIn = false;
        this.loginSessionId = Date.now();
        Http.clearToken();
        this.userData = {
            username: '',
            avatarUrl: '',
            rank: '未登录',
            diamond: 0,
            gold: 0,
            level: 0,
            exp: 0
        };
        if (Platform.isWeChatGame) {
            wx.removeStorageSync('userInfo');
        }
    }

    // 更新用户数据
    updateUserData(data: Partial<UserData>) {
        this.userData = { ...this.userData, ...data };
    }

    // 设置活动列表
    setActivities(activities: Activity[]) {
        this.activities = activities;
    }
}

// 导出单例
export const dataManager = DataManager.getInstance();
