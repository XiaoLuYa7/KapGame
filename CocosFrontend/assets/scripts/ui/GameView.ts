import { _decorator, director, Node } from 'cc';
import { BaseUI } from './BaseUI';
import { Platform } from '../utils/Platform';
import { Http } from '../network/Http';
import { Activity, dataManager, FunctionItem, GameMode } from '../core/DataManager';
import { SettingsPopupRoot } from './SettingsPopupRoot';
import { ActivityPopupRoot } from './ActivityPopupRoot';

const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends BaseUI {
    @property(Node)
    settingsPopupRootNode: Node | null = null;

    @property(Node)
    activityPopupRootNode: Node | null = null;

    onEnter() {
        this.resolveNodes();
        this.loadActivities();
    }

    start() {
        this.onEnter();
    }

    onSettingButtonClick() {
        console.log('[GameView] onSettingButtonClick');
        const settingsPopupRoot = this.getSettingsPopupRoot();
        if (settingsPopupRoot) {
            settingsPopupRoot.showSettingsPopup();
            return;
        }

        this.showSettingsPopupLayerFallback();
    }

    async loadActivities() {
        if (!dataManager.isLoggedIn) {
            return;
        }

        try {
            const activities = await Http.get('/activities') as any[];
            if (activities?.length > 0) {
                dataManager.setActivities(activities);
                this.updateActivitiesUI(activities);
            }
        } catch (error) {
            console.error('[GameView] Load activities error:', error);
            dataManager.setActivities([
                { id: 1, title: 'Daily Checkin', activityType: 'SIGNIN', imageUrl: '', showCountdown: false },
                { id: 2, title: 'Recharge Bonus', activityType: 'RECHARGE', imageUrl: '', showCountdown: false },
                { id: 3, title: 'New Player Gift', activityType: 'GIFT', imageUrl: '', showCountdown: false }
            ]);
            this.updateActivitiesUI(dataManager.activities);
        }
    }

    onActivityClick(activity: Activity) {
        console.log('[GameView] Activity clicked:', activity);
        Platform.showToast('Activity detail is in development', 'none');
    }

    onGameModeClick(mode: GameMode) {
        console.log('[GameView] Game mode clicked:', mode);
        Platform.showToast(`${mode.title} is in development`, 'none');
    }

    onFunctionClick(func: FunctionItem) {
        console.log('[GameView] Function clicked:', func);
        Platform.showToast(`${func.title} is in development`, 'none');
    }

    onLevelRewardButtonClick() {
        console.log('[GameView] onLevelRewardButtonClick');
        void this.getActivityPopupRoot()?.showLevelRewardPopup();
    }

    private updateActivitiesUI(activities: Activity[]) {
        console.log('[GameView] Activities:', activities);
    }

    private resolveNodes() {
        const canvas = this.getCanvasNode();
        this.settingsPopupRootNode ??= this.findNodeByPaths([
            'SettingsPopupRoot',
            'SettinsPopupRoot'
        ], canvas);
        this.activityPopupRootNode ??= this.findNodeByPaths([
            'ActivityPopupRoot'
        ], canvas);
    }

    private getSettingsPopupRoot(): SettingsPopupRoot | null {
        this.resolveNodes();
        const root = this.settingsPopupRootNode?.getComponent(SettingsPopupRoot) ?? null;
        if (!root) {
            console.warn('[GameView] SettingsPopupRoot component not found');
        }
        return root;
    }

    private getActivityPopupRoot(): ActivityPopupRoot | null {
        this.resolveNodes();
        const root = this.activityPopupRootNode?.getComponent(ActivityPopupRoot) ?? null;
        if (!root) {
            console.warn('[GameView] ActivityPopupRoot component not found');
        }
        return root;
    }

    private showSettingsPopupLayerFallback() {
        this.resolveNodes();
        const layer = this.settingsPopupRootNode?.getChildByName('SettingsPopupLayer') ?? null;
        if (!layer?.isValid) {
            console.warn('[GameView] SettingsPopupLayer fallback node not found');
            return;
        }

        this.settingsPopupRootNode!.active = true;
        layer.active = true;
        layer.setSiblingIndex(this.settingsPopupRootNode!.children.length - 1);
        console.log('[GameView] SettingsPopupLayer fallback active:', layer.active);
    }

    private getCanvasNode(): Node | null {
        let current: Node | null = this.node;
        while (current?.parent) {
            if (current.parent.name === 'Canvas') {
                return current.parent;
            }
            current = current.parent;
        }

        return director.getScene()?.getChildByName('Canvas') ?? null;
    }
}
