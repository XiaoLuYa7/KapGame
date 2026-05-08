/**
 * DataManager - 全局数据管理
 */

import { sys } from 'cc';
import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';

export interface UserData {
    userId: number | string;
    username: string;
    nickName: string;
    avatarUrl: string;
    rank: string;
    rankCode: string;
    rankName: string;
    rankIcon: string;
    diamond: number;
    gold: number;
    level: number;
    exp: number;
    weeklyBattleGold: number;
    isDevelopmentUser?: boolean;
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
    private readonly developmentTokenStorageKey = 'kapgame_development_token';
    private readonly developmentUserInfoStorageKey = 'kapgame_development_user_info';

    // 用户数据
    userData: UserData = {
        userId: '',
        username: '',
        nickName: '',
        avatarUrl: '',
        rank: '未登录',
        rankCode: '',
        rankName: '',
        rankIcon: '',
        diamond: 0,
        gold: 0,
        level: 0,
        exp: 0,
        weeklyBattleGold: 0
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
                this.applyLoggedInState(token, userInfo);
            }
            return;
        }

        if (this.isDevelopmentEnvironment()) {
            const storedLogin = this.getDevelopmentStoredLogin();
            if (storedLogin) {
                this.applyLoggedInState(storedLogin.token, storedLogin.userInfo);
            }
        }
    }

    // 保存到本地存储
    saveToStorage(userInfo?: any, token?: string) {
        if (Platform.isWeChatGame && userInfo) {
            wx.setStorageSync('userInfo', userInfo);
            return;
        }

        if (this.isDevelopmentEnvironment() && userInfo && token) {
            this.saveDevelopmentLogin(token, userInfo);
        }
    }

    // 设置登录状态
    setLoggedIn(token: string, userInfo: any) {
        Http.setToken(token);
        this.applyLoggedInState(token, userInfo);
        this.saveToStorage(userInfo, token);
    }

    // 开发环境自动创建本地用户，方便编辑器和浏览器测试保持登录态
    ensureDevelopmentLogin() {
        if (!this.isDevelopmentEnvironment() || this.isLoggedIn) {
            return;
        }

        const storedLogin = this.getDevelopmentStoredLogin();
        if (storedLogin) {
            this.applyLoggedInState(storedLogin.token, storedLogin.userInfo);
            return;
        }

        const userInfo = {
            id: 'local-dev-user',
            userId: 'local-dev-user',
            nickName: '测试用户',
            username: '测试用户',
            avatarUrl: '',
            rank: '青铜 III',
            rankCode: 'BRONZE',
            rankName: '青铜',
            rankIcon: 'rank/bronze',
            diamond: 120,
            gold: 8800,
            level: 8,
            exp: 260,
            weeklyBattleGold: 12800,
            isDevelopmentUser: true
        };
        const token = 'local_dev_token';

        this.applyLoggedInState(token, userInfo);
        this.saveDevelopmentLogin(token, userInfo);
    }

    // 登出
    logout() {
        this.isLoggedIn = false;
        this.loginSessionId = Date.now();
        Http.clearToken();
        this.userData = {
            userId: '',
            username: '',
            nickName: '',
            avatarUrl: '',
            rank: '未登录',
            rankCode: '',
            rankName: '',
            rankIcon: '',
            diamond: 0,
            gold: 0,
            level: 0,
            exp: 0,
            weeklyBattleGold: 0
        };
        if (Platform.isWeChatGame) {
            wx.removeStorageSync('userInfo');
        } else if (this.isDevelopmentEnvironment()) {
            this.clearDevelopmentLogin();
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

    private applyLoggedInState(token: string, userInfo: any) {
        const rankCode = String(userInfo.rankCode || userInfo.rank_code || 'BRONZE').toUpperCase();
        const rankName = userInfo.rankName || userInfo.rank_name || this.getRankNameByCode(rankCode);
        const nickName = userInfo.nickName || userInfo.nickname || userInfo.username || userInfo.userName || '微信用户';

        this.isLoggedIn = true;
        this.loginSessionId = Date.now();
        Http.token = token;
        this.userData = {
            userId: userInfo.userId ?? userInfo.id ?? '',
            username: nickName,
            nickName,
            avatarUrl: userInfo.avatarUrl || '',
            rank: userInfo.rank || `${rankName} III`,
            rankCode,
            rankName,
            rankIcon: userInfo.rankIcon || userInfo.rank_icon || this.getRankIconByCode(rankCode),
            diamond: Number(userInfo.diamond ?? userInfo.diamonds ?? 0),
            gold: Number(userInfo.gold ?? userInfo.coins ?? 0),
            level: Number(userInfo.level ?? 0),
            exp: Number(userInfo.exp ?? 0),
            weeklyBattleGold: Number(userInfo.weeklyBattleGold ?? userInfo.weekly_battle_gold ?? 0),
            isDevelopmentUser: !!userInfo.isDevelopmentUser
        };
    }

    private getRankNameByCode(rankCode: string): string {
        const rankNames: Record<string, string> = {
            BRONZE: '青铜',
            SILVER: '白银',
            GOLD: '黄金',
            PLATINUM: '铂金',
            DIAMOND: '钻石',
            STARSHINE: '星耀',
            MASTER: '大师',
            KING: '王者'
        };
        return rankNames[rankCode] || '青铜';
    }

    private getRankIconByCode(rankCode: string): string {
        const rankIcons: Record<string, string> = {
            BRONZE: 'rank/bronze',
            SILVER: 'rank/silver',
            GOLD: 'rank/gold',
            PLATINUM: 'rank/platinum',
            DIAMOND: 'rank/diamond',
            STARSHINE: 'rank/starshine',
            MASTER: 'rank/master',
            KING: 'rank/king'
        };
        return rankIcons[rankCode] || 'rank/bronze';
    }

    private isDevelopmentEnvironment(): boolean {
        const hasWechatApi = typeof window !== 'undefined' && !!(window as any).wx;
        return !Platform.isWeChatGame && !hasWechatApi;
    }

    private getDevelopmentStoredLogin(): { token: string; userInfo: any } | null {
        try {
            const token = sys.localStorage.getItem(this.developmentTokenStorageKey) || '';
            const rawUserInfo = sys.localStorage.getItem(this.developmentUserInfoStorageKey) || '';
            if (!token || !rawUserInfo) {
                return null;
            }

            return {
                token,
                userInfo: JSON.parse(rawUserInfo)
            };
        } catch (error) {
            console.warn('[DataManager] Failed to load development login:', error);
            return null;
        }
    }

    private saveDevelopmentLogin(token: string, userInfo: any) {
        try {
            sys.localStorage.setItem(this.developmentTokenStorageKey, token);
            sys.localStorage.setItem(this.developmentUserInfoStorageKey, JSON.stringify(userInfo));
        } catch (error) {
            console.warn('[DataManager] Failed to save development login:', error);
        }
    }

    private clearDevelopmentLogin() {
        try {
            sys.localStorage.removeItem(this.developmentTokenStorageKey);
            sys.localStorage.removeItem(this.developmentUserInfoStorageKey);
        } catch (error) {
            console.warn('[DataManager] Failed to clear development login:', error);
        }
    }
}

// 导出单例
export const dataManager = DataManager.getInstance();
