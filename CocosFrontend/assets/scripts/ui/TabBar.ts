import { _decorator, Component, Button, Label, Color, director } from 'cc';

const { ccclass, property } = _decorator;

export interface TabBarItem {
    index: number;
    title: string;
}

@ccclass('TabBarComponent')
export class TabBarComponent extends Component {
    static sceneName: string = 'TabBar';

    @property({ type: [Button] })
    tabButtons: Button[] = [];

    @property({ type: [Label] })
    tabLabels: Label[] = [];

    @property
    currentIndex: number = 0;

    tabData: TabBarItem[] = [
        { index: 0, title: 'Game' },
        { index: 1, title: 'Chat' }
    ];

    private readonly labelColor = new Color(0, 0, 0);

    onLoad() {
        this.initTabs();
    }

    start() {
        this.setCurrentTab(this.currentIndex, false);
    }

    onDestroy() {
        this.tabButtons.forEach(button => button.node.targetOff(this));
    }

    setCurrentTab(index: number, notify: boolean = true) {
        this.resolvePrefabNodes();

        if (index < 0 || index >= this.tabButtons.length) {
            return;
        }

        this.currentIndex = index;

        this.updateAllTabAppearances();

        if (notify) {
            this.switchToContent(index);
        }
    }

    refreshCurrentTab() {
        this.setCurrentTab(this.currentIndex, false);
    }

    private initTabs() {
        this.resolvePrefabNodes();

        this.tabButtons.forEach((button, index) => {
            button.node.targetOff(this);
            button.node.on(Button.EventType.CLICK, () => this.onTabClick(index), this);
        });
    }

    private onTabClick(index: number) {
        if (index === this.currentIndex) {
            return;
        }

        this.setCurrentTab(index, true);
    }

    private switchToContent(index: number) {
        const homeUI = this.findHomeUI();
        if (!homeUI || typeof homeUI.setActiveTab !== 'function') {
            console.warn('[TabBar] HomeView not found, cannot switch tab content');
            return;
        }

        switch (index) {
            case 1:
                homeUI.setActiveTab('Chat', false);
                break;
            case 0:
            default:
                homeUI.setActiveTab('Game', false);
                break;
        }
    }

    private updateTabAppearance(index: number, isSelected: boolean) {
        if (index < 0) {
            return;
        }

        const button = this.tabButtons[index];
        if (button) {
            button.transition = Button.Transition.NONE;
            const targetColor = Color.WHITE;
            button.normalColor = targetColor.clone();
            button.hoverColor = targetColor.clone();
            button.pressedColor = targetColor.clone();
        }

        const label = this.tabLabels[index];
        if (label) {
            label.color = this.labelColor;
        }
    }

    private updateAllTabAppearances() {
        this.tabButtons.forEach((_, index) => this.updateTabAppearance(index, index === this.currentIndex));
    }

    private resolvePrefabNodes() {
        const shopButton = this.node.getChildByName('ShopBarButton');
        if (shopButton) {
            shopButton.active = false;
        }

        const buttonNames = ['GameBarButton', 'ChatBarButton'];

        const buttons = buttonNames
            .map(name => this.getTabButton(name))
            .filter((button): button is Button => !!button);
        const labels = buttonNames
            .map(name => this.getTabLabel(name))
            .filter((label): label is Label => !!label);

        if (buttons.length > 0) {
            this.tabButtons = buttons;
        }
        if (labels.length > 0) {
            this.tabLabels = labels;
        }
    }

    private getTabButton(nodeName: string): Button | null {
        const buttonNode = this.node.getChildByName(nodeName);
        return buttonNode?.getComponent(Button) ?? null;
    }

    private getTabLabel(nodeName: string): Label | null {
        const buttonNode = this.node.getChildByName(nodeName);
        const labelNode = buttonNode?.getChildByName('Label');
        return labelNode?.getComponent(Label) ?? null;
    }

    private findHomeUI(): any {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        return canvas?.getComponentsInChildren('HomeView')[0] ?? canvas?.getComponentsInChildren('HomeUI')[0] ?? null;
    }
}
