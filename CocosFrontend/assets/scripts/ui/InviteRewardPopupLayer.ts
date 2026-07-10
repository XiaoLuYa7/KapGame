import { _decorator, Button, Node, ScrollView, UITransform, Widget } from 'cc';
import { BaseUI } from './BaseUI';

const { ccclass } = _decorator;

@ccclass('InviteRewardPopupLayer')
export class InviteRewardPopupLayer extends BaseUI {
    private scrollView: ScrollView | null = null;

    protected onInit() {
        super.onInit();
        this.node.active = false;
        this.bindCloseButtons();
        this.prepareScrollContentWidgets();
    }

    open() {
        this.node.active = true;
        this.node.setSiblingIndex(this.node.parent?.children.length ? this.node.parent.children.length - 1 : 0);
        this.configureScrollView();
    }

    close() {
        this.node.active = false;
    }

    private bindCloseButtons() {
        const closeNode = this.findNodeByPaths([
            'CloseButton',
            'BackButton',
            'PopupPanel/CloseButton',
            'PopupPanel/TitleNode/CloseButton'
        ]);

        if (!closeNode?.isValid) {
            return;
        }

        const button = closeNode.getComponent(Button) ?? closeNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.94;
        button.duration = 0.08;
        closeNode.targetOff(this);
        closeNode.on(Button.EventType.CLICK, this.close, this);
        closeNode.on(Node.EventType.TOUCH_END, this.close, this);
    }

    private configureScrollView() {
        const scrollView = this.findComponent('ScrollView', ScrollView);
        if (!scrollView) {
            return;
        }

        const view = scrollView.node.getChildByName('view');
        const contentRoot = view?.getChildByName('content') ?? scrollView.content ?? null;
        if (contentRoot?.isValid) {
            this.disableDirectWidget(contentRoot);
            this.disableDirectChildWidgets(contentRoot);
            this.syncContentSizeToChildren(contentRoot);
            scrollView.content = contentRoot;
            this.alignContentToTop(scrollView, contentRoot);
        }

        scrollView.stopAutoScroll();
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.elastic = false;
        scrollView.bounceDuration = 0;
        scrollView.inertia = true;
        scrollView.brake = 0.45;
        scrollView.cancelInnerEvents = true;
        scrollView.horizontalScrollBar = null;
        scrollView.verticalScrollBar = null;
        scrollView.enabled = true;
        this.scrollView = scrollView;
    }

    private alignContentToTop(scrollView: ScrollView, content: Node) {
        const viewTransform = scrollView.node.getChildByName('view')?.getComponent(UITransform)
            ?? scrollView.node.getComponent(UITransform);
        const contentTransform = content.getComponent(UITransform);
        if (!viewTransform || !contentTransform) {
            return;
        }

        const topY = viewTransform.height * 0.5 + contentTransform.height * contentTransform.anchorY - contentTransform.height;
        content.setPosition(content.position.x, topY, content.position.z);
        scrollView.stopAutoScroll();
    }

    private prepareScrollContentWidgets() {
        const scrollView = this.findComponent('ScrollView', ScrollView);
        const view = scrollView?.node.getChildByName('view');
        const contentRoot = view?.getChildByName('content') ?? scrollView?.content ?? null;
        if (!contentRoot?.isValid) {
            return;
        }

        this.disableDirectWidget(contentRoot);
        this.disableDirectChildWidgets(contentRoot);
    }

    private disableDirectWidget(node: Node) {
        const widget = node.getComponent(Widget);
        if (widget) {
            widget.enabled = false;
        }
    }

    private disableDirectChildWidgets(node: Node) {
        node.children.forEach(child => {
            const widget = child.getComponent(Widget);
            if (widget) {
                widget.enabled = false;
            }
        });
    }

    private syncContentSizeToChildren(content: Node) {
        const transform = content.getComponent(UITransform);
        if (!transform) {
            return;
        }

        let top = 0;
        let bottom = 0;
        content.children.forEach(child => {
            const childTransform = child.getComponent(UITransform);
            if (!child.active || !childTransform) {
                return;
            }
            const height = childTransform.height * Math.abs(child.scale.y);
            const anchorY = childTransform.anchorY;
            const y = child.position.y;
            top = Math.max(top, y + height * (1 - anchorY));
            bottom = Math.min(bottom, y - height * anchorY);
        });

        const neededHeight = Math.max(transform.height, top - bottom);
        if (neededHeight > transform.height) {
            transform.setContentSize(transform.width, neededHeight);
        }
    }

}
