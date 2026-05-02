import { _decorator } from 'cc';
import { ChatUI } from './ChatUI';

const { ccclass } = _decorator;

@ccclass('ChatView')
export class ChatView extends ChatUI {
    static sceneName: string = 'Chat';
}
