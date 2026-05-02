/**
 * GameEntry - 游戏入口脚本
 * 挂载在初始场景的 Canvas 节点上
 */

import { _decorator, Component } from 'cc';
import { SceneManager } from './core/SceneManager';
import { dataManager } from './core/DataManager';
import { Platform } from './utils/Platform';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
    start() {
        console.log('[GameEntry] Game starting...');

        // 初始化平台
        Platform.init();

        // 初始化场景管理器
        SceneManager.init();

        // 加载存储的数据
        dataManager.loadFromStorage();

        // 当前项目入口统一走 Loading，再进入 Home
        this.navigateToEntry();
    }

    navigateToEntry() {
        console.log('[GameEntry] Entering Loading scene');
        SceneManager.goToLoading();
    }

    update(deltaTime: number) {
        // 游戏循环更新
    }
}
