/**
 * Http - 网络请求封装
 */

import { Platform } from '../utils/Platform';

export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

export class Http {
    // 后端 API 地址
    static baseUrl = 'http://localhost:8080/api';

    // Token
    static token: string = '';

    // 设置 Token
    static setToken(token: string) {
        this.token = token;
        if (Platform.isWeChatGame) {
            wx.setStorageSync('token', token);
        }
    }

    // 获取存储的 Token
    static getToken(): string {
        if (this.token) return this.token;
        if (Platform.isWeChatGame) {
            return wx.getStorageSync('token') || '';
        }
        return '';
    }

    // 清除 Token
    static clearToken() {
        this.token = '';
        if (Platform.isWeChatGame) {
            wx.removeStorageSync('token');
        }
    }

    // 通用请求
    static async request<T = any>(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        data?: any
    ): Promise<T> {
        const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;
        const token = this.getToken();

        const header: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            header['Authorization'] = `Bearer ${token}`;
        }

        if (Platform.isWeChatGame) {
            return new Promise((resolve, reject) => {
                wx.request({
                    url: fullUrl,
                    method,
                    data,
                    header,
                    success: (res: any) => {
                        if (res.statusCode === 200) {
                            if (res.data.success || res.data.code === 0) {
                                resolve(res.data.data);
                            } else {
                                reject(new Error(res.data.message || '请求失败'));
                            }
                        } else if (res.statusCode === 401) {
                            // Token 过期，清除并跳转登录
                            this.clearToken();
                            reject(new Error('请先登录'));
                        } else {
                            reject(new Error(`请求失败: ${res.statusCode}`));
                        }
                    },
                    fail: (err: any) => {
                        reject(err);
                    }
                });
            });
        }

        // 开发环境模拟
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (url.includes('login') || url.includes('register')) {
                    resolve({
                        token: 'mock_token_' + Date.now(),
                        nickName: '微信用户',
                        avatarUrl: ''
                    } as any);
                } else {
                    resolve({} as T);
                }
            }, 500);
        });
    }

    // GET 请求
    static async get<T = any>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, 'GET', data);
    }

    // POST 请求
    static async post<T = any>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, 'POST', data);
    }
}
