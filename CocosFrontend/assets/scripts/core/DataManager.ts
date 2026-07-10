/**
 * DataManager - 全局数据管理
 */

import { sys } from 'cc';
import { Http } from '../network/Http';
import { Platform } from '../utils/Platform';
import { MISCHIEF_GAME_MODES } from '../config/MischiefConfigs';

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

export interface DevelopmentDailyCheckInReward {
    dayIndex: number;
    rewardType: string;
    rewardCount: number;
    claimed: boolean;
    claimable: boolean;
}

export interface DevelopmentDailyCheckInData {
    weekStartDate: string;
    todayIndex: number;
    todayClaimed: boolean;
    userGold: number;
    userDiamond: number;
    rewards: DevelopmentDailyCheckInReward[];
}

export interface DevelopmentLevelRewardItem {
    id: number;
    level: number;
    rewardType: string;
    rewardCount: number;
    rewards?: DevelopmentLevelRewardPart[];
    canClaim: boolean;
    claimed: boolean;
}

export interface DevelopmentLevelRewardPart {
    rewardType: string;
    rewardCount: number;
}

export interface DevelopmentLevelRewardData {
    username: string;
    avatarUrl: string;
    level: number;
    exp: number;
    nextLevelExp: number;
    rewards: DevelopmentLevelRewardItem[];
}

type UserDataChangeListener = (userData: UserData) => void;

export class DataManager {
    private static instance: DataManager;
    private readonly developmentTokenStorageKey = 'kapgame_development_token';
    private readonly developmentUserInfoStorageKey = 'kapgame_development_user_info';
    private developmentDailyCheckInData: DevelopmentDailyCheckInData | null = null;
    private developmentLevelRewardData: DevelopmentLevelRewardData | null = null;
    private developmentLoginGeneratedThisSession = false;
    private userDataChangeListeners: UserDataChangeListener[] = [];

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
        { id: 1, title: MISCHIEF_GAME_MODES[0].name, desc: MISCHIEF_GAME_MODES[0].description, icon: 'trophy', route: 'solo' },
        { id: 2, title: MISCHIEF_GAME_MODES[1].name, desc: MISCHIEF_GAME_MODES[1].description, icon: 'users', route: 'team' }
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
        if (!this.isDevelopmentEnvironment()) {
            return;
        }
        if (this.developmentLoginGeneratedThisSession) {
            return;
        }

        const userInfo = this.createDevelopmentUserInfo();
        const token = 'local_dev_token';

        this.applyLoggedInState(token, userInfo);
        this.developmentDailyCheckInData = this.createDevelopmentDailyCheckInData();
        this.developmentLevelRewardData = this.createDevelopmentLevelRewardData();
        this.developmentLoginGeneratedThisSession = true;
        this.saveDevelopmentLogin(token, userInfo);
    }

    getDevelopmentDailyCheckInData(): DevelopmentDailyCheckInData | null {
        if (!this.userData.isDevelopmentUser) {
            return null;
        }
        if (!this.developmentDailyCheckInData) {
            this.developmentDailyCheckInData = this.createDevelopmentDailyCheckInData();
        }
        return this.cloneData(this.developmentDailyCheckInData);
    }

    claimDevelopmentDailyCheckIn(multiplier: number = 1, diamondCost: number = 0): DevelopmentDailyCheckInData | null {
        if (!this.userData.isDevelopmentUser) {
            return null;
        }
        if (!this.developmentDailyCheckInData) {
            this.developmentDailyCheckInData = this.createDevelopmentDailyCheckInData();
        }

        const data = this.developmentDailyCheckInData;
        if (!data.todayClaimed) {
            const reward = this.getDevelopmentDailyCheckInClaimReward(data);
            if (reward) {
                const cost = Math.max(0, Math.floor(diamondCost || 0));
                if (cost > 0 && this.userData.diamond < cost) {
                    return null;
                }

                const rewardMultiplier = Math.max(1, Math.floor(multiplier || 1));
                const amount = reward.rewardCount * rewardMultiplier;
                reward.claimed = true;
                reward.claimable = false;
                const nextDiamond = Math.max(0, this.userData.diamond - cost) + (reward.rewardType === 'DIAMOND' ? amount : 0);
                const nextGold = this.userData.gold + (reward.rewardType === 'DIAMOND' ? 0 : amount);
                this.updateUserData({ diamond: nextDiamond, gold: nextGold });
            }
            data.todayClaimed = true;
            data.rewards.forEach(item => item.claimable = false);
        }

        data.userGold = this.userData.gold;
        data.userDiamond = this.userData.diamond;
        this.persistDevelopmentUserInfo();
        return this.cloneData(data);
    }

    getDevelopmentLevelRewardData(): DevelopmentLevelRewardData | null {
        if (!this.userData.isDevelopmentUser) {
            return null;
        }
        if (!this.developmentLevelRewardData) {
            this.developmentLevelRewardData = this.createDevelopmentLevelRewardData();
        }
        return this.cloneData(this.developmentLevelRewardData);
    }

    claimDevelopmentLevelReward(
        rewardId: number,
        multiplier: number = 1,
        diamondCost: number = 0,
        rewardType?: string,
        rewardCount?: number,
        finishClaim: boolean = true
    ): DevelopmentLevelRewardData | null {
        if (!this.userData.isDevelopmentUser) {
            return null;
        }
        if (!this.developmentLevelRewardData) {
            this.developmentLevelRewardData = this.createDevelopmentLevelRewardData();
        }

        const reward = this.developmentLevelRewardData.rewards.find(item => item.id === rewardId);
        if (reward && reward.canClaim && !reward.claimed) {
            const rewardMultiplier = Math.max(1, Math.floor(multiplier || 1));
            const cost = Math.max(0, Math.floor(diamondCost || 0));
            if (cost > 0 && this.userData.diamond < cost) {
                return null;
            }

            if (finishClaim) {
                reward.claimed = true;
                reward.canClaim = false;
            }
            const appliedRewardType = String(rewardType || reward.rewardType || 'GOLD').toUpperCase();
            const appliedRewardCount = Math.max(0, Math.floor(rewardCount ?? reward.rewardCount ?? 0));
            const finalRewardCount = appliedRewardCount * rewardMultiplier;
            const nextDiamond = Math.max(0, this.userData.diamond - cost) + (appliedRewardType === 'DIAMOND' ? finalRewardCount : 0);
            const nextGold = this.userData.gold + (appliedRewardType === 'DIAMOND' ? 0 : finalRewardCount);
            this.updateUserData({ diamond: nextDiamond, gold: nextGold });
        }

        this.developmentLevelRewardData.username = this.userData.username;
        this.developmentLevelRewardData.avatarUrl = this.userData.avatarUrl;
        this.persistDevelopmentUserInfo();
        return this.cloneData(this.developmentLevelRewardData);
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
            this.developmentDailyCheckInData = null;
            this.developmentLevelRewardData = null;
            this.developmentLoginGeneratedThisSession = false;
        }
        this.notifyUserDataChanged();
    }

    // 更新用户数据
    updateUserData(data: Partial<UserData>) {
        this.userData = { ...this.userData, ...data };
        this.persistDevelopmentUserInfo();
        this.notifyUserDataChanged();
    }

    subscribeUserData(listener: UserDataChangeListener): () => void {
        this.userDataChangeListeners.push(listener);
        listener(this.userData);
        return () => {
            this.userDataChangeListeners = this.userDataChangeListeners.filter(item => item !== listener);
        };
    }

    private notifyUserDataChanged() {
        const userData = this.userData;
        this.userDataChangeListeners.forEach(listener => listener(userData));
    }

    // 设置活动列表
    setActivities(activities: Activity[]) {
        this.activities = activities;
    }

    private createDevelopmentUserInfo() {
        const rankCodes = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'STARSHINE', 'MASTER', 'KING'];
        const names = ['测试玩家', '捣蛋喵', '本地骑士', '星耀旅人', '金币猎手', '段位挑战者'];
        const rankCode = this.pickRandom(rankCodes);
        const rankName = this.getRankNameByCode(rankCode);
        const level = this.randomInt(30, 60);
        const nextLevelExp = this.getDevelopmentNextLevelExp(level);
        const exp = this.randomInt(0, nextLevelExp - 1);
        const userId = `local-dev-user-${Date.now()}-${this.randomInt(100, 999)}`;
        const nickName = `${this.pickRandom(names)}${this.randomInt(10, 99)}`;

        return {
            id: userId,
            userId,
            nickName,
            username: nickName,
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(userId)}`,
            rank: `${rankName} ${this.pickRandom(['I', 'II', 'III'])}`,
            rankCode,
            rankName,
            rankIcon: this.getRankIconByCode(rankCode),
            diamond: this.randomInt(20, 300),
            gold: this.randomInt(2000, 20000),
            level,
            exp,
            weeklyBattleGold: this.randomInt(1500, 18000),
            isDevelopmentUser: true
        };
    }

    private createDevelopmentDailyCheckInData(): DevelopmentDailyCheckInData {
        const todayIndex = this.randomInt(1, 7);
        const claimedDayCount = this.randomInt(0, todayIndex - 1);
        const claimedDays = Array.from({ length: claimedDayCount }, (_, index) => index + 1);
        const claimableDayIndex = this.getNextDevelopmentDailyCheckInClaimableDayIndex(claimedDays, todayIndex);
        const rewards = [1, 2, 3, 4, 5, 6, 7].map(dayIndex => {
            const rewardType = dayIndex % 3 === 0 ? 'DIAMOND' : 'GOLD';
            return {
                dayIndex,
                rewardType,
                rewardCount: rewardType === 'DIAMOND' ? this.randomInt(5, 25) : this.randomInt(80, 360),
                claimed: claimedDays.indexOf(dayIndex) >= 0,
                claimable: dayIndex === claimableDayIndex
            };
        });

        return {
            weekStartDate: this.getDevelopmentWeekStartDate(),
            todayIndex,
            todayClaimed: false,
            userGold: this.userData.gold,
            userDiamond: this.userData.diamond,
            rewards
        };
    }

    private getDevelopmentDailyCheckInClaimReward(data: DevelopmentDailyCheckInData): DevelopmentDailyCheckInReward | null {
        const claimedDays = data.rewards
            .filter(item => item.claimed)
            .map(item => item.dayIndex);
        const claimableDayIndex = this.getNextDevelopmentDailyCheckInClaimableDayIndex(claimedDays, data.todayIndex);
        return data.rewards.find(item => item.dayIndex === claimableDayIndex) ?? null;
    }

    private getNextDevelopmentDailyCheckInClaimableDayIndex(claimedDays: number[], todayIndex: number): number {
        for (let dayIndex = 1; dayIndex <= todayIndex; dayIndex++) {
            if (claimedDays.indexOf(dayIndex) < 0) {
                return dayIndex;
            }
        }
        return 0;
    }

    private createDevelopmentLevelRewardData(): DevelopmentLevelRewardData {
        const rewardLevels = Array.from({ length: 60 }, (_, index) => index + 1);
        let hasClaimableReward = false;
        const rewards = rewardLevels.map((level, index) => {
            const reached = this.userData.level >= level;
            const claimed = reached && Math.random() > 0.45;
            const canClaim = reached && !claimed;
            const rewardParts = this.getDevelopmentLevelRewardParts(level);
            const primaryReward = rewardParts[0];
            hasClaimableReward = hasClaimableReward || canClaim;
            return {
                id: 1000 + index + 1,
                level,
                rewardType: primaryReward.rewardType,
                rewardCount: primaryReward.rewardCount,
                rewards: rewardParts,
                canClaim,
                claimed
            };
        });

        if (!hasClaimableReward) {
            const reward = rewards.find(item => this.userData.level >= item.level);
            if (reward) {
                reward.claimed = false;
                reward.canClaim = true;
            }
        }

        return {
            username: this.userData.username,
            avatarUrl: this.userData.avatarUrl,
            level: this.userData.level,
            exp: this.userData.exp,
            nextLevelExp: this.getDevelopmentNextLevelExp(this.userData.level),
            rewards
        };
    }

    private getDevelopmentNextLevelExp(level: number) {
        return Math.max(100, level * 120);
    }

    private getDevelopmentLevelRewardParts(level: number): DevelopmentLevelRewardPart[] {
        if (level <= 30) {
            return [{
                rewardType: 'GOLD',
                rewardCount: this.interpolateRewardCount(level, 1, 30, 100, 500)
            }];
        }

        return [
            {
                rewardType: 'GOLD',
                rewardCount: this.interpolateRewardCount(level, 31, 60, 100, 500)
            },
            {
                rewardType: 'DIAMOND',
                rewardCount: this.interpolateRewardCount(level, 31, 60, 10, 100)
            }
        ];
    }

    private interpolateRewardCount(level: number, minLevel: number, maxLevel: number, minReward: number, maxReward: number) {
        if (maxLevel <= minLevel) {
            return maxReward;
        }

        const progress = Math.max(0, Math.min(1, (level - minLevel) / (maxLevel - minLevel)));
        return Math.round(minReward + (maxReward - minReward) * progress);
    }

    private getDevelopmentWeekStartDate() {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        const month = monday.getMonth() + 1;
        const date = monday.getDate();
        return `${monday.getFullYear()}-${month < 10 ? `0${month}` : month}-${date < 10 ? `0${date}` : date}`;
    }

    private randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private pickRandom<T>(items: T[]): T {
        return items[this.randomInt(0, items.length - 1)];
    }

    private cloneData<T>(data: T): T {
        return JSON.parse(JSON.stringify(data));
    }

    private persistDevelopmentUserInfo() {
        if (this.userData.isDevelopmentUser) {
            this.saveDevelopmentLogin('local_dev_token', this.userData);
        }
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
        this.notifyUserDataChanged();
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
            BRONZE: 'image/rank/bronze',
            SILVER: 'image/rank/silver',
            GOLD: 'image/rank/gold',
            PLATINUM: 'image/rank/platinum',
            DIAMOND: 'image/rank/diamond',
            STARSHINE: 'image/rank/starshine',
            MASTER: 'image/rank/master',
            KING: 'image/rank/king'
        };
        return rankIcons[rankCode] || 'image/rank/bronze';
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
