/**
 * LobbyUI - 游戏大厅界面控制器
 * 继承 BaseUI，统一场景生命周期管理
 */

import { _decorator, Component, Node, Sprite, Label, Button, EventHandler } from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { dataManager } from '../core/DataManager';
import { gameManager } from '../core/GameManager';
import { Platform } from '../utils/Platform';

const { ccclass, property } = _decorator;

@ccclass('LobbyUI')
export class LobbyUI extends BaseUI {
    static sceneName: string = SceneName.Lobby;

    // 用户名标签
    @property(Label)
    usernameLabel: Label | null = null;

    // 段位标签
    @property(Label)
    rankLabel: Label | null = null;

    // 排位赛按钮
    @property(Button)
    rankMatchBtn: Button | null = null;

    // 休闲模式按钮
    @property(Button)
    casualBtn: Button | null = null;

    // 返回按钮
    @property(Button)
    backBtn: Button | null = null;

    onInit() {
        super.onInit();
    }

    onEnter(data?: SceneData) {
        console.log('[LobbyUI] Lobby entered');

        // 更新用户名显示
        if (this.usernameLabel) {
            this.usernameLabel.string = dataManager.userData.username || '玩家';
        }

        if (this.rankLabel) {
            this.rankLabel.string = dataManager.userData.rank;
        }

        this.bindEvents();
    }

    onExit() {
        console.log('[LobbyUI] Lobby exited');
        this.unbindEvents();
    }

    onCleanup() {
        this.unbindEvents();
    }

    // 绑定事件
    private bindEvents() {
        if (this.rankMatchBtn) {
            this.rankMatchBtn.node.on(Button.EventType.CLICK, this.onStartMatch, this);
        }
        if (this.casualBtn) {
            this.casualBtn.node.on(Button.EventType.CLICK, this.onCasualMode, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBack, this);
        }
    }

    // 解绑事件
    private unbindEvents() {
        if (this.rankMatchBtn) {
            this.rankMatchBtn.node.off(Button.EventType.CLICK, this.onStartMatch, this);
        }
        if (this.casualBtn) {
            this.casualBtn.node.off(Button.EventType.CLICK, this.onCasualMode, this);
        }
        if (this.backBtn) {
            this.backBtn.node.off(Button.EventType.CLICK, this.onBack, this);
        }
    }

    // 开始匹配（排位赛）
    async onStartMatch() {
        Platform.showLoading('正在匹配...');

        try {
            await gameManager.joinGame('rank');
            Platform.hideLoading();
            Platform.showToast('匹配成功！', 'success');

            // 跳转到游戏页面
            setTimeout(() => {
                SceneManager.goToBattle();
            }, 1000);
        } catch (error: any) {
            Platform.hideLoading();
            Platform.showToast(error.message || '匹配失败', 'none');
        }
    }

    // 休闲模式
    async onCasualMode() {
        Platform.showLoading('正在匹配...');

        try {
            await gameManager.joinGame('casual');
            Platform.hideLoading();
            Platform.showToast('匹配成功！', 'success');

            setTimeout(() => {
                SceneManager.goToBattle();
            }, 1000);
        } catch (error: any) {
            Platform.hideLoading();
            Platform.showToast(error.message || '匹配失败', 'none');
        }
    }

    // 返回主页
    onBack() {
        SceneManager.goToHome();
    }
}
