import { _decorator, Component, Button, Label, Color, director, Node, Sprite } from 'cc';

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
        this.resolvePrefabNodes();
    }

    start() {
        this.setCurrentTab(this.currentIndex, false);
    }

    setCurrentTab(index: number, notify: boolean = true) {
        this.resolvePrefabNodes();

        if (index < 0 || index >= this.tabButtons.length) {
            console.warn(`[TabBar] setCurrentTab ignored index=${index}, buttonCount=${this.tabButtons.length}`);
            return;
        }

        this.currentIndex = index;
        console.log(`[TabBar] setCurrentTab index=${index} notify=${notify}`);

        this.updateAllTabAppearances();

        if (notify) {
            this.switchToContent(index);
        }
    }

    refreshCurrentTab() {
        this.setCurrentTab(this.currentIndex, false);
    }

    onGameBarButtonClick() {
        console.log('[TabBar] onGameBarButtonClick');
        this.setCurrentTab(0, true);
    }

    onChatBarButtonClick() {
        console.log('[TabBar] onChatBarButtonClick');
        this.setCurrentTab(1, true);
    }

    private switchToContent(index: number) {
        const homeView = this.findHomeView();
        if (!homeView || typeof homeView.setActiveTab !== 'function') {
            console.warn('[TabBar] HomeView not found, cannot switch tab content');
            return;
        }

        const tabName = index === 1 ? 'Chat' : 'Game';
        const homeNodeName = homeView.node?.name ?? 'unknown';
        console.log(`[TabBar] switchToContent index=${index} tab=${tabName} homeNode=${homeNodeName}`);
        switch (index) {
            case 1:
                void homeView.setActiveTab('Chat', false);
                break;
            case 0:
            default:
                void homeView.setActiveTab('Game', false);
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
            this.applySelectedBackground(button, index, isSelected);
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

        const barButtons = this.findChildDeep('BarButtons') ?? this.node;
        const buttonNames = ['GameBarButton', 'ChatBarButton'];

        const buttons = buttonNames
            .map(name => this.getTabButton(name, barButtons))
            .filter((button): button is Button => !!button);
        const labels = buttonNames
            .map(name => this.getTabLabel(name, barButtons))
            .filter((label): label is Label => !!label);

        if (buttons.length > 0) {
            this.tabButtons = buttons;
        }
        if (labels.length > 0) {
            this.tabLabels = labels;
        }
    }

    private getTabButton(nodeName: string, root: Node = this.node): Button | null {
        const buttonNode = this.findChildDeep(nodeName, root);
        return buttonNode?.getComponent(Button) ?? null;
    }

    private getTabLabel(nodeName: string, root: Node = this.node): Label | null {
        const buttonNode = this.findChildDeep(nodeName, root);
        const labelNode = buttonNode?.getChildByName('Label');
        return labelNode?.getComponent(Label) ?? null;
    }

    private applySelectedBackground(button: Button, index: number, isSelected: boolean) {
        const sprite = button.node.getComponent(Sprite);
        if (!sprite) {
            return;
        }

        sprite.enabled = isSelected;
    }

    private findChildDeep(name: string, root: Node = this.node): Node | null {
        const direct = root.getChildByName(name);
        if (direct) {
            return direct;
        }

        for (const child of root.children) {
            const result = this.findChildDeep(name, child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private findHomeView(): any {
        const scene = director.getScene();
        const canvas = scene?.getChildByName('Canvas');
        let current: Node | null = this.node;
        while (current) {
            const component = current.getComponent('HomeView');
            if (component) {
                return component;
            }
            current = current.parent;
        }

        const canvasComponent = canvas?.getComponent('HomeView');
        if (canvasComponent) {
            return canvasComponent;
        }

        return canvas?.getComponentsInChildren('HomeView')[0] ?? null;
    }
}
