import { _decorator, director, Node } from 'cc';
import { HomeView } from './HomeView';
import { GameView } from './GameView';
import { SettingsPopupRoot } from './SettingsPopupRoot';

const { ccclass } = _decorator;

@ccclass('HomeUI')
export class HomeUI extends HomeView {
    onSettingButtonClick() {
        console.log('[HomeUI] onSettingButtonClick');
        this.findGameView()?.onSettingButtonClick();
    }

    onLevelRewardButtonClick() {
        this.findGameView()?.onLevelRewardButtonClick();
    }

    onSettingsCloseButtonClick(event?: any) {
        this.findSettingsPopupRoot()?.onSettingsCloseButtonClick(event);
    }

    onPrivacyPolicyClick() {
        this.findSettingsPopupRoot()?.onPrivacyPolicyClick();
    }

    onUserAgreementClick() {
        this.findSettingsPopupRoot()?.onUserAgreementClick();
    }

    onPhoneNodeClick() {
        this.findSettingsPopupRoot()?.onPhoneNodeClick();
    }

    onBindPhoneCloseButtonClick() {
        this.findSettingsPopupRoot()?.onBindPhoneCloseButtonClick();
    }

    onRealNameNodeClick() {
        this.findSettingsPopupRoot()?.onRealNameNodeClick();
    }

    onRealNameCloseButtonClick() {
        this.findSettingsPopupRoot()?.onRealNameCloseButtonClick();
    }

    onPhoneInputChanged() {
        this.findSettingsPopupRoot()?.onPhoneInputChanged();
    }

    onCodeInputChanged() {
        this.findSettingsPopupRoot()?.onCodeInputChanged();
    }

    onSendCodeButtonClick() {
        this.findSettingsPopupRoot()?.onSendCodeButtonClick();
    }

    onSavePhoneButtonClick() {
        void this.findSettingsPopupRoot()?.onSavePhoneButtonClick();
    }

    onRealNameInputChanged() {
        this.findSettingsPopupRoot()?.onRealNameInputChanged();
    }

    onIdCardInputChanged() {
        this.findSettingsPopupRoot()?.onIdCardInputChanged();
    }

    onSaveRealNameButtonClick() {
        void this.findSettingsPopupRoot()?.onSaveRealNameButtonClick();
    }

    onSoundEffectsToggleChanged() {
        this.findSettingsPopupRoot()?.onSoundEffectsToggleChanged();
    }

    onMusicToggleChanged() {
        this.findSettingsPopupRoot()?.onMusicToggleChanged();
    }

    onVibrationToggleChanged() {
        this.findSettingsPopupRoot()?.onVibrationToggleChanged();
    }

    private findGameView(): GameView | null {
        const view = this.node.getComponentInChildren(GameView);
        if (!view) {
            console.warn('[HomeUI] GameView not found');
        }
        return view;
    }

    private findSettingsPopupRoot(): SettingsPopupRoot | null {
        const canvas = this.getCanvasNode();
        const rootNode = canvas?.getChildByName('SettingsPopupRoot') ?? canvas?.getChildByName('SettinsPopupRoot') ?? null;
        const view = rootNode?.getComponent(SettingsPopupRoot) ?? null;
        if (!view) {
            console.warn('[HomeUI] SettingsPopupRoot not found');
        }
        return view;
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
