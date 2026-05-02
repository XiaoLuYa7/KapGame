import {
    _decorator,
    Node,
    Button,
    EditBox,
    ScrollView,
    UITransform,
    Layout,
    Sprite,
    Toggle,
    BlockInputEvents
} from 'cc';
import { BaseUI } from './BaseUI';
import { Platform } from '../utils/Platform';
import { Http } from '../network/Http';

const { ccclass, property } = _decorator;

@ccclass('SettingsPopupRoot')
export class SettingsPopupRoot extends BaseUI {
    @property(Node)
    settingsPopupLayer: Node | null = null;

    @property(Node)
    privacyPolicyDialog: Node | null = null;

    @property(Node)
    userAgreementDialog: Node | null = null;

    @property(Node)
    bindPhoneLayer: Node | null = null;

    @property(Node)
    realNameLayer: Node | null = null;

    @property(Sprite)
    settingsBackgroundSprite: Sprite | null = null;

    @property(Button)
    settingsCloseBtn: Button | null = null;

    @property(Button)
    privacyPolicyBtn: Button | null = null;

    @property(Button)
    userAgreementBtn: Button | null = null;

    @property(Button)
    bindPhoneCloseBtn: Button | null = null;

    @property(Button)
    realNameCloseBtn: Button | null = null;

    @property(EditBox)
    editPhoneBox: EditBox | null = null;

    @property(EditBox)
    editCodeBox: EditBox | null = null;

    @property(EditBox)
    realNameEditBox: EditBox | null = null;

    @property(EditBox)
    idCardEditBox: EditBox | null = null;

    @property(Toggle)
    soundEffectsToggle: Toggle | null = null;

    @property(Toggle)
    musicToggle: Toggle | null = null;

    @property(Toggle)
    vibrationToggle: Toggle | null = null;

    private settingsLayerInputSnapshot: Array<{ component: any; enabled?: boolean; interactable?: boolean }> = [];

    onInit() {
        super.onInit();
        this.log('onInit');
        this.resolveNodes();
        this.hideSettingsPopup();
        this.hidePrivacyPolicy();
        this.hideUserAgreement();
        this.hideBindPhoneLayer();
        this.hideRealNameLayer();
    }

    showSettingsPopup() {
        this.log('showSettingsPopup');
        this.resolveNodes();
        this.setSettingsBackgroundSpriteEnabled(true);
        this.setSettingsLayerInputEnabled(true);
        this.showLayer(this.settingsPopupLayer, 'SettingsPopupLayer', false);
    }

    hideSettingsPopup() {
        this.log('hideSettingsPopup');
        this.resolveNodes();
        this.setSettingsBackgroundSpriteEnabled(true);
        this.setSettingsLayerInputEnabled(true);
        this.setNodeVisible(this.settingsPopupLayer, false);
    }

    onSettingsCloseButtonClick(event?: any) {
        this.log('onSettingsCloseButtonClick');
        this.resolveNodes();
        const target = event?.target as Node | undefined;

        if (this.isNodeInside(target, this.privacyPolicyDialog)) {
            this.hidePrivacyPolicy();
            return;
        }

        if (this.isNodeInside(target, this.userAgreementDialog)) {
            this.hideUserAgreement();
            return;
        }

        if (this.isNodeInside(target, this.bindPhoneLayer)) {
            this.hideBindPhoneLayer();
            return;
        }

        if (this.isNodeInside(target, this.realNameLayer)) {
            this.hideRealNameLayer();
            return;
        }

        this.hideSettingsPopup();
    }

    onPrivacyPolicyClick() {
        this.log('onPrivacyPolicyClick');
        this.showPrivacyPolicy();
    }

    onUserAgreementClick() {
        this.log('onUserAgreementClick');
        this.showUserAgreement();
    }

    onPhoneNodeClick() {
        this.log('onPhoneNodeClick');
        this.showBindPhoneLayer();
    }

    onBindPhoneCloseButtonClick() {
        this.log('onBindPhoneCloseButtonClick');
        this.hideBindPhoneLayer();
    }

    onRealNameNodeClick() {
        this.log('onRealNameNodeClick');
        this.showRealNameLayer();
    }

    onRealNameCloseButtonClick() {
        this.log('onRealNameCloseButtonClick');
        this.hideRealNameLayer();
    }

    onPhoneInputChanged() {
        this.resolveNodes();
        this.sanitizeEditBox(this.editPhoneBox, /\D/g, 11);
    }

    onCodeInputChanged() {
        this.resolveNodes();
        this.sanitizeEditBox(this.editCodeBox, /\D/g, 6);
    }

    onRealNameInputChanged() {
        this.resolveNodes();
        if (!this.realNameEditBox) {
            return;
        }

        const value = this.realNameEditBox.string.replace(/[^\u4e00-\u9fa5·]/g, '').slice(0, 20);
        if (this.realNameEditBox.string !== value) {
            this.realNameEditBox.string = value;
        }
    }

    onIdCardInputChanged() {
        this.resolveNodes();
        if (!this.idCardEditBox) {
            return;
        }

        const value = this.idCardEditBox.string.replace(/[^0-9Xx]/g, '').slice(0, 18).toUpperCase();
        if (this.idCardEditBox.string !== value) {
            this.idCardEditBox.string = value;
        }
    }

    onSoundEffectsToggleChanged(toggle?: Toggle) {
        this.log('onSoundEffectsToggleChanged');
        this.resolveNodes();
        this.applyToggleEvent(this.soundEffectsToggle, toggle);
        void this.saveSettings();
    }

    onMusicToggleChanged(toggle?: Toggle) {
        this.log('onMusicToggleChanged');
        this.resolveNodes();
        this.applyToggleEvent(this.musicToggle, toggle);
        void this.saveSettings();
    }

    onVibrationToggleChanged(toggle?: Toggle) {
        this.log('onVibrationToggleChanged');
        this.resolveNodes();
        this.applyToggleEvent(this.vibrationToggle, toggle);
        void this.saveSettings();
    }

    onSendCodeButtonClick() {
        this.log('onSendCodeButtonClick');
        this.resolveNodes();
        this.onPhoneInputChanged();
        const phone = this.getEditBoxValue(this.editPhoneBox);
        this.log('SendCodeButton clicked', { phone });
        if (!this.isValidPhone(phone)) {
            this.clearEditBox(this.editPhoneBox);
            Platform.showToast('请输入正确的手机号', 'none');
            return;
        }

        this.log('DEV send phone sms code', phone);
        Platform.showToast('验证码已发送', 'success');
    }

    async onSavePhoneButtonClick() {
        this.log('onSavePhoneButtonClick');
        this.resolveNodes();
        this.onPhoneInputChanged();
        this.onCodeInputChanged();

        const phone = this.getEditBoxValue(this.editPhoneBox);
        const code = this.getEditBoxValue(this.editCodeBox);
        this.log('SavePhoneButton clicked', { phone, code });

        if (!this.isValidPhone(phone)) {
            this.clearEditBox(this.editPhoneBox);
            Platform.showToast('请输入正确的手机号', 'none');
            return;
        }

        if (!this.isValidPhoneCode(code)) {
            this.clearEditBox(this.editCodeBox);
            Platform.showToast('请输入6位验证码', 'none');
            return;
        }

        try {
            this.log('verify phone code with backend', { phone, code });
            await Http.post('/user/bind-phone', { phone, code });
            Platform.showToast('手机号保存成功', 'success');
            this.hideBindPhoneLayer();
        } catch (error) {
            console.error('[SettingsPopupRoot] Bind phone error:', error);
            Platform.showToast('手机号验证失败', 'none');
        }
    }

    async onSaveRealNameButtonClick() {
        this.log('onSaveRealNameButtonClick');
        this.resolveNodes();
        this.onRealNameInputChanged();
        this.onIdCardInputChanged();

        const realName = this.getEditBoxValue(this.realNameEditBox);
        const idCard = this.getEditBoxValue(this.idCardEditBox);
        this.log('SaveRealNameButton clicked', { realName, idCard });

        if (!this.isValidChineseName(realName)) {
            this.clearEditBox(this.realNameEditBox);
            Platform.showToast('请输入正确的中文姓名', 'none');
            return;
        }

        if (!this.isValidIdCard(idCard)) {
            this.clearEditBox(this.idCardEditBox);
            Platform.showToast('请输入正确的身份证号', 'none');
            return;
        }

        try {
            await Http.post('/user/real-name', { realName, idCard });
            Platform.showToast('实名认证成功', 'success');
            this.hideRealNameLayer();
        } catch (error) {
            console.error('[SettingsPopupRoot] Real name verify error:', error);
            Platform.showToast('实名认证失败', 'none');
        }
    }

    private showPrivacyPolicy() {
        this.resolveNodes();
        this.setNodeVisible(this.userAgreementDialog, false);
        this.showLayer(this.privacyPolicyDialog, 'PrivacyPolicy', true);
    }

    private hidePrivacyPolicy() {
        this.resolveNodes();
        this.setNodeVisible(this.privacyPolicyDialog, false);
    }

    private showUserAgreement() {
        this.resolveNodes();
        this.setNodeVisible(this.privacyPolicyDialog, false);
        this.showLayer(this.userAgreementDialog, 'UserAgreement', true);
    }

    private hideUserAgreement() {
        this.resolveNodes();
        this.setNodeVisible(this.userAgreementDialog, false);
    }

    private showBindPhoneLayer() {
        this.resolveNodes();
        this.setNodeVisible(this.privacyPolicyDialog, false);
        this.setNodeVisible(this.userAgreementDialog, false);
        this.setSettingsBackgroundSpriteEnabled(false);
        this.setSettingsLayerInputEnabled(false);
        this.showLayer(this.bindPhoneLayer, 'BindPhoneLayer', false);
    }

    private hideBindPhoneLayer() {
        this.resolveNodes();
        this.setNodeVisible(this.bindPhoneLayer, false);
        this.restoreSettingsBackgroundSpriteIfNeeded();
        this.restoreSettingsLayerInputIfNeeded();
    }

    private showRealNameLayer() {
        this.resolveNodes();
        this.setNodeVisible(this.privacyPolicyDialog, false);
        this.setNodeVisible(this.userAgreementDialog, false);
        this.setSettingsBackgroundSpriteEnabled(false);
        this.setSettingsLayerInputEnabled(false);
        this.showLayer(this.realNameLayer, 'RealNameLayer', false);
    }

    private hideRealNameLayer() {
        this.resolveNodes();
        this.setNodeVisible(this.realNameLayer, false);
        this.restoreSettingsBackgroundSpriteIfNeeded();
        this.restoreSettingsLayerInputIfNeeded();
    }

    private resolveNodes() {
        this.settingsPopupLayer ??= this.findNodeByPaths(['SettingsPopupLayer'], this.node);
        this.privacyPolicyDialog ??= this.findNodeByPaths(['PrivacyPolicy'], this.node);
        this.userAgreementDialog ??= this.findNodeByPaths(['UserAgreement'], this.node);
        this.bindPhoneLayer ??= this.findNodeByPaths(['BindPhoneLayer'], this.node);
        this.realNameLayer ??= this.findNodeByPaths(['RealNameLayer'], this.node);
        this.settingsBackgroundSprite ??= this.findComponentByPaths([
            'SettingsPopupLayer/Background'
        ], Sprite);

        this.settingsCloseBtn ??= this.findComponentByPaths(['SettingsPopupLayer/CloseButton'], Button);
        this.privacyPolicyBtn ??= this.findComponentByPaths([
            'SettingsPopupLayer/PopupPanel/PoliciesAgreementsPanel/PoliciesButton'
        ], Button);
        this.userAgreementBtn ??= this.findComponentByPaths([
            'SettingsPopupLayer/PopupPanel/PoliciesAgreementsPanel/AgreementsButton'
        ], Button);
        this.bindPhoneCloseBtn ??= this.findComponentByPaths(['BindPhoneLayer/CloseButton'], Button);
        this.realNameCloseBtn ??= this.findComponentByPaths(['RealNameLayer/CloseButton'], Button);
        this.editPhoneBox ??= this.findComponentByPaths([
            'BindPhoneLayer/PopupPanel/EditPhoneBox',
            'BindPhoneLayer/PopupPanel/ContentPanel/EditPhoneBox',
            'BindPhoneLayer/EditPhoneBox',
            'EditPhoneBox'
        ], EditBox);
        this.editCodeBox ??= this.findComponentByPaths([
            'BindPhoneLayer/PopupPanel/EditCodeBox',
            'BindPhoneLayer/PopupPanel/ContentPanel/EditCodeBox',
            'BindPhoneLayer/EditCodeBox',
            'EditCodeBox'
        ], EditBox);
        this.realNameEditBox ??= this.findComponentByPaths([
            'RealNameLayer/PopupPanel/ContentPanel/PhoneNode/EditINameBox',
            'RealNameLayer/PopupPanel/ContentPanel/EditINameBox',
            'RealNameLayer/PopupPanel/EditINameBox',
            'RealNameLayer/EditINameBox',
            'RealNameLayer/PopupPanel/ContentPanel/PhoneNode/EditPhoneBox',
            'RealNameLayer/PopupPanel/EditPhoneBox',
            'RealNameLayer/EditPhoneBox'
        ], EditBox);
        this.idCardEditBox ??= this.findComponentByPaths([
            'RealNameLayer/PopupPanel/ContentPanel/CodeNode/EditIdCardBox',
            'RealNameLayer/PopupPanel/ContentPanel/EditIdCardBox',
            'RealNameLayer/PopupPanel/EditIdCardBox',
            'RealNameLayer/EditIdCardBox',
            'RealNameLayer/PopupPanel/ContentPanel/CodeNode/EditCodeBox',
            'RealNameLayer/PopupPanel/EditCodeBox',
            'RealNameLayer/EditCodeBox'
        ], EditBox);
        this.soundEffectsToggle ??= this.findComponentByPaths([
            'SettingsPopupLayer/PopupPanel/SoundVibrationPanel/Radio-001/SoundEffectsRadio/SoundEffectsToggle'
        ], Toggle);
        this.musicToggle ??= this.findComponentByPaths([
            'SettingsPopupLayer/PopupPanel/SoundVibrationPanel/Radio-001/MusicRadio/MusicRadio'
        ], Toggle);
        this.vibrationToggle ??= this.findComponentByPaths([
            'SettingsPopupLayer/PopupPanel/SoundVibrationPanel/Radio-001/VibrationToggle/VibrationToggle'
        ], Toggle);
    }

    private showLayer(layer: Node | null, name: string, prepareScrollView: boolean) {
        if (!layer?.isValid) {
            console.warn(`[SettingsPopupRoot] ${name} node not found`);
            return;
        }

        layer.active = true;
        this.ensureBlockInputEvents(layer);
        const parent = layer.parent;
        if (parent) {
            layer.setSiblingIndex(parent.children.length - 1);
        }

        if (prepareScrollView) {
            this.scheduleOnce(() => this.prepareDialogScrollView(layer), 0);
        }
    }

    private prepareDialogScrollView(dialog: Node) {
        const scrollView = dialog.getComponentInChildren(ScrollView);
        const content = scrollView?.content;
        if (!scrollView || !content) {
            return;
        }

        const view = scrollView.node.getChildByName('view');
        const viewTransform = view?.getComponent(UITransform) ?? scrollView.node.getComponent(UITransform);
        const contentTransform = content.getComponent(UITransform);
        if (!viewTransform || !contentTransform) {
            return;
        }

        const viewHeight = viewTransform.height;
        this.normalizeDialogText(content);
        const realHeight = this.getScrollContentRealHeight(content, viewHeight);
        contentTransform.setContentSize(contentTransform.width, Math.max(realHeight, viewHeight));
        content.getComponent(Layout)?.updateLayout();
        scrollView.stopAutoScroll();
        scrollView.scrollToTop(0);
    }

    private normalizeDialogText(content: Node) {
        for (const child of content.children) {
            child.setScale(1, 1, 1);
        }
    }

    private getScrollContentRealHeight(content: Node, viewHeight: number): number {
        let realHeight = viewHeight;

        for (const child of content.children) {
            const transform = child.getComponent(UITransform);
            if (transform) {
                realHeight = Math.max(realHeight, transform.height);
            }
        }

        return realHeight;
    }

    private sanitizeEditBox(editBox: EditBox | null, pattern: RegExp, maxLength?: number) {
        if (!editBox) {
            return;
        }

        let value = (editBox.string || '').replace(pattern, '');
        if (maxLength && value.length > maxLength) {
            value = value.slice(0, maxLength);
        }

        if (editBox.string !== value) {
            editBox.string = value;
        }
    }

    private getEditBoxValue(editBox: EditBox | null): string {
        return (editBox?.string || '').trim();
    }

    private isValidPhone(phone: string): boolean {
        return /^1[3-9]\d{9}$/.test(phone);
    }

    private isValidPhoneCode(code: string): boolean {
        return /^\d{6}$/.test(code);
    }

    private isValidChineseName(realName: string): boolean {
        return /^[\u4e00-\u9fa5]{2,10}(?:·[\u4e00-\u9fa5]{2,10})?$/.test(realName);
    }

    private isValidIdCard(idCard: string): boolean {
        return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9X]$/.test(idCard);
    }

    private clearEditBox(editBox: EditBox | null) {
        if (editBox) {
            editBox.string = '';
            this.log('clear edit box', editBox.node.name);
        }
    }

    private applyToggleEvent(target: Toggle | null, eventToggle?: Toggle) {
        if (target && eventToggle && target !== eventToggle) {
            target.isChecked = eventToggle.isChecked;
        }
    }

    private async saveSettings() {
        this.resolveNodes();
        const payload = {
            soundEffectsEnabled: this.soundEffectsToggle?.isChecked ?? true,
            musicEnabled: this.musicToggle?.isChecked ?? true,
            vibrationEnabled: this.vibrationToggle?.isChecked ?? true
        };

        this.log('save settings', payload);
        try {
            await Http.request('/user/settings', 'PUT', payload);
            Platform.showToast('设置已保存', 'success');
        } catch (error) {
            console.error('[SettingsPopupRoot] Save settings error:', error);
            Platform.showToast('设置保存失败', 'none');
        }
    }

    private isNodeInside(node: Node | null | undefined, root: Node | null): boolean {
        if (!node || !root?.isValid) {
            return false;
        }

        let current: Node | null = node;
        while (current) {
            if (current === root) {
                return true;
            }
            current = current.parent;
        }

        return false;
    }

    private setNodeVisible(node: Node | null, visible: boolean) {
        if (node?.isValid) {
            node.active = visible;
        }
    }

    private setSettingsBackgroundSpriteEnabled(enabled: boolean) {
        this.resolveNodes();
        if (this.settingsBackgroundSprite?.isValid) {
            this.settingsBackgroundSprite.enabled = enabled;
        }
    }

    private restoreSettingsBackgroundSpriteIfNeeded() {
        const bindPhoneVisible = !!this.bindPhoneLayer?.isValid && this.bindPhoneLayer.active;
        const realNameVisible = !!this.realNameLayer?.isValid && this.realNameLayer.active;
        if (!bindPhoneVisible && !realNameVisible) {
            this.setSettingsBackgroundSpriteEnabled(true);
        }
    }

    private restoreSettingsLayerInputIfNeeded() {
        const bindPhoneVisible = !!this.bindPhoneLayer?.isValid && this.bindPhoneLayer.active;
        const realNameVisible = !!this.realNameLayer?.isValid && this.realNameLayer.active;
        if (!bindPhoneVisible && !realNameVisible) {
            this.setSettingsLayerInputEnabled(true);
        }
    }

    private setSettingsLayerInputEnabled(enabled: boolean) {
        if (!this.settingsPopupLayer?.isValid) {
            return;
        }

        if (!enabled && this.settingsLayerInputSnapshot.length === 0) {
            const components = [
                ...this.settingsPopupLayer.getComponentsInChildren(Button),
                ...this.settingsPopupLayer.getComponentsInChildren(Toggle),
                ...this.settingsPopupLayer.getComponentsInChildren(EditBox)
            ];

            this.settingsLayerInputSnapshot = components.map(component => ({
                component,
                enabled: component.enabled,
                interactable: (component as any).interactable
            }));

            for (const item of this.settingsLayerInputSnapshot) {
                item.component.enabled = false;
                if (typeof item.interactable === 'boolean') {
                    item.component.interactable = false;
                }
            }
            this.log('SettingsPopupLayer input disabled');
            return;
        }

        if (enabled && this.settingsLayerInputSnapshot.length > 0) {
            for (const item of this.settingsLayerInputSnapshot) {
                if (item.component?.isValid) {
                    item.component.enabled = item.enabled ?? true;
                    if (typeof item.interactable === 'boolean') {
                        item.component.interactable = item.interactable;
                    }
                }
            }
            this.settingsLayerInputSnapshot = [];
            this.log('SettingsPopupLayer input restored');
        }
    }

    private ensureBlockInputEvents(layer: Node) {
        if (!layer.getComponent(BlockInputEvents)) {
            layer.addComponent(BlockInputEvents);
        }

        const background = layer.getChildByName('Background');
        if (background && !background.getComponent(BlockInputEvents)) {
            background.addComponent(BlockInputEvents);
        }
    }

    private log(message: string, data?: any) {
        if (data !== undefined) {
            console.log(`[SettingsPopupRoot] ${message}`, data);
            console.warn(`[SettingsPopupRoot] ${message}`, data);
            return;
        }

        console.log(`[SettingsPopupRoot] ${message}`);
        console.warn(`[SettingsPopupRoot] ${message}`);
    }
}
