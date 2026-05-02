/**
 * Scripts 入口
 * 统一导出所有模块
 */

// 工具类
export * from './utils/Platform';

// 网络
export * from './network/Http';

// 核心
export * from './core/DataManager';
export * from './core/SceneManager';
export * from './core/GameManager';

// UI 基类
export * from './ui/BaseUI';

// UI 控制器
export * from './ui/HomeView';
export * from './ui/GameView';
export * from './ui/ChatView';
export * from './ui/SettingsPopupRoot';
export * from './ui/ActivityPopupRoot';
export * from './ui/ShopUI';
export * from './ui/ChatUI';
export * from './ui/LobbyUI';
export * from './ui/BattleUI';
export * from './ui/TabBar';
