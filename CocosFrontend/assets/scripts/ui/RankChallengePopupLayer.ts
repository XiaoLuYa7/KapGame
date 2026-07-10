import { _decorator, Button, Node } from 'cc';
import { BaseUI } from './BaseUI';
import { BattleMatchPopupLayer, BattleMatchType, BattleRoomLevel } from './BattleMatchPopupLayer';
import { PopupStack } from './PopupStack';

const { ccclass } = _decorator;

@ccclass('RankChallengePopupLayer')
export class RankChallengePopupLayer extends BaseUI {
    private onBackHandler: (() => void) | null = null;
    private onRankInfoHandler: (() => void) | null = null;

    protected onInit() {
        super.onInit();
        this.bindRuntimeEvents();
    }

    open() {
        PopupStack.open(this.node);
        this.bindRuntimeEvents();
    }

    close() {
        PopupStack.close(this.node);
    }

    setHandlers(handlers: { onBack?: () => void; onRankInfo?: () => void }) {
        this.onBackHandler = handlers.onBack ?? null;
        this.onRankInfoHandler = handlers.onRankInfo ?? null;
        this.bindRuntimeEvents();
    }

    private bindRuntimeEvents() {
        this.bindClick(
            this.findNodeByPaths(['TopBarNode/BackButton', 'BackButton']),
            () => {
                if (this.onBackHandler) {
                    this.onBackHandler();
                    return;
                }
                this.close();
            }
        );

        this.bindClick(
            this.findNodeByPaths(['RankInfoNode']),
            () => this.onRankInfoHandler?.()
        );

        this.bindRoomButton('SoloSectionNode/ModeNode/PrimaryRoomButton', 'SOLO', 'PRIMARY');
        this.bindRoomButton('SoloSectionNode/ModeNode/MediumRoomButton', 'SOLO', 'MEDIUM');
        this.bindRoomButton('SoloSectionNode/ModeNode/HighRoomButton', 'SOLO', 'HIGH');
        this.bindRoomButton('DuoSectionNode/ModeNode/PrimaryRoomButton', 'DUO', 'PRIMARY');
        this.bindRoomButton('DuoSectionNode/ModeNode/MediumRoomButton', 'DUO', 'MEDIUM');
        this.bindRoomButton('DuoSectionNode/ModeNode/HighRoomButton', 'DUO', 'HIGH');
    }

    private bindRoomButton(path: string, matchType: BattleMatchType, roomLevel: BattleRoomLevel) {
        this.bindClick(
            this.findNodeByPaths([path]),
            () => this.openBattleMatch(matchType, roomLevel)
        );
    }

    private openBattleMatch(matchType: BattleMatchType, roomLevel: BattleRoomLevel) {
        const battleMatchNode = this.node.parent?.getChildByName('BattleMatchPopupLayer') ?? null;
        if (!battleMatchNode?.isValid) {
            console.warn('[RankChallengePopupLayer] BattleMatchPopupLayer node not found');
            return;
        }

        const battleMatchPopup = battleMatchNode.getComponent(BattleMatchPopupLayer)
            ?? battleMatchNode.addComponent(BattleMatchPopupLayer);
        battleMatchPopup.open({ matchType, roomLevel });
    }

    private bindClick(node: Node | null, handler: () => void) {
        if (!node?.isValid) {
            return;
        }

        const button = node.getComponent(Button) ?? node.addComponent(Button);
        button.interactable = true;
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.94;
        button.duration = 0.08;
        node.targetOff(this);
        node.on(Button.EventType.CLICK, handler, this);
    }
}
