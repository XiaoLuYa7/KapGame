/**
 * ShopUI - 商城界面控制器
 * 继承 BaseUI，统一场景生命周期管理
 */

import { _decorator, Button } from 'cc';
import { BaseUI, SceneData } from './BaseUI';
import { SceneManager, SceneName } from '../core/SceneManager';
import { Platform } from '../utils/Platform';

const { ccclass, property } = _decorator;

interface ShopItem {
    id: number;
    name: string;
    desc: string;
    price: number;
    icon: string;
}

@ccclass('ShopUI')
export class ShopUI extends BaseUI {
    static sceneName: string = SceneName.Shop;

    // 商城模块数据
    modules: ShopItem[] = [
        { id: 1, name: '商城', desc: '购买卡包', price: 0, icon: 'shop' },
        { id: 2, name: '寻宝', desc: '神秘奖励', price: 0, icon: 'treasure' },
        { id: 3, name: '荣耀大明星', desc: '荣耀排行', price: 0, icon: 'star' },
        { id: 4, name: '邀请有奖', desc: '邀请好友', price: 0, icon: 'invite' },
        { id: 5, name: '赏金任务', desc: '完成任务', price: 0, icon: 'task' },
        { id: 6, name: '翻牌有奖', desc: '翻牌抽奖', price: 0, icon: 'card' },
        { id: 7, name: '每日签到', desc: '连续奖励', price: 0, icon: 'sign' },
        { id: 8, name: '等级奖励', desc: '等级礼包', price: 0, icon: 'gift' }
    ];

    @property({ type: [Button] })
    moduleButtons: Button[] = [];

    @property(Button)
    settingsBtn: Button | null = null;

    onInit() {
        super.onInit();
        this.resolvePrefabNodes();
    }

    onEnter(data?: SceneData) {
        console.log('[ShopUI] Shop entered');
        this.refresh();
    }

    onExit() {
        console.log('[ShopUI] Shop exited');
    }

    onCleanup() {
        this.unbindEvents();
    }

    // 绑定事件
    private bindEvents() {
        this.unbindEvents();

        this.moduleButtons.forEach((button, index) => {
            button.node.on(Button.EventType.CLICK, () => {
                const module = this.modules[index];
                if (module) {
                    this.onModuleClick(module.id);
                }
            }, this);
        });

        if (this.settingsBtn) {
            this.settingsBtn.node.on(Button.EventType.CLICK, this.onBack, this);
        }
    }

    // 解绑事件
    private unbindEvents() {
        this.moduleButtons.forEach(button => button.node.targetOff(this));
        this.settingsBtn?.node.off(Button.EventType.CLICK, this.onBack, this);
    }

    // 处理模块点击
    onModuleClick(moduleId: number) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        console.log('[ShopUI] Module clicked:', module.name);
        Platform.showToast(`${module.name}功能开发中`, 'none');
    }

    // 返回主页
    onBack() {
        SceneManager.goToHome();
    }

    // 刷新数据
    refresh() {
        console.log('[ShopUI] Refreshing shop data...');
        this.resolvePrefabNodes();
        this.bindEvents();
    }

    private resolvePrefabNodes() {
        if (this.moduleButtons.length > 0) {
            return;
        }

        const buttonNames = [
            'ShopContainer/ShopItemLayout1/DressUpButton',
            'ShopContainer/ShopItemLayout1/TeasureButton',
            'ShopContainer/ShopItemLayout2/EveryDayButton',
            'ShopContainer/ShopItemLayout3/LevelButton',
            'ShopContainer/ShopItemLayout4/InvitationButton',
            'ShopContainer/ShopItemLayout4/FlipCardButton'
        ];

        this.moduleButtons = buttonNames
            .map(path => this.findComponent(path, Button))
            .filter((button): button is Button => Boolean(button));

        this.settingsBtn ??= this.findComponentByPaths(
            ['ShopContainer/SettingsPanel/Button', 'SettingsPanel/Button'],
            Button
        );
    }
}
