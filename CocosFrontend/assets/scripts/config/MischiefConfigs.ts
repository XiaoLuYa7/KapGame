export enum CardType {
    Danger = 'DANGER',
    Defense = 'DEFENSE',
    Detect = 'DETECT',
    Interfere = 'INTERFERE',
    Control = 'CONTROL',
    Survival = 'SURVIVAL',
    Transfer = 'TRANSFER',
    Draw = 'DRAW',
    Counter = 'COUNTER',
    Teamwork = 'TEAMWORK',
}

export enum CardTiming {
    BeforeDraw = 'BeforeDraw',
    DrawPhase = 'DrawPhase',
    OnDanger = 'OnDanger',
    OnTargeted = 'OnTargeted',
    OnTeammateDanger = 'OnTeammateDanger',
}

export enum TargetType {
    None = 'None',
    Self = 'Self',
    OtherPlayer = 'OtherPlayer',
    AnyPlayer = 'AnyPlayer',
    Teammate = 'Teammate',
    Deck = 'Deck',
}

export interface MischiefCardConfig {
    id: number;
    key: string;
    name: string;
    type: CardType;
    mode: string[];
    countSolo: number;
    countTeam: number;
    timing: CardTiming;
    targetType: TargetType;
    canBeCountered: boolean;
    description: string;
    iconPath: string;
}

export interface MischiefGameModeConfig {
    key: 'SOLO' | 'TEAM';
    name: string;
    playerCount: number;
    teamCount: number;
    teamSize: number;
    dangerCardCount: number;
    initialHandCount: number;
    description: string;
}

export const MISCHIEF_GAME_MODES: MischiefGameModeConfig[] = [
    {
        key: 'SOLO',
        name: '单人局',
        playerCount: 5,
        teamCount: 0,
        teamSize: 0,
        dangerCardCount: 4,
        initialHandCount: 6,
        description: '5人混战，坚持到最后即可获胜',
    },
    {
        key: 'TEAM',
        name: '双人局',
        playerCount: 6,
        teamCount: 3,
        teamSize: 2,
        dangerCardCount: 5,
        initialHandCount: 6,
        description: '6人组队，坚持到最后的一队获胜',
    },
];

export const MISCHIEF_CARD_CONFIGS: MischiefCardConfig[] = [
    { id: 1, key: 'trick_trap', name: '恶作剧机关', type: CardType.Danger, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 5, timing: CardTiming.DrawPhase, targetType: TargetType.Self, canBeCountered: false, description: '摸到后立即触发。若没有保险钥匙，则玩家出局。', iconPath: 'cards/trick_trap' },
    { id: 2, key: 'safety_key', name: '保险钥匙', type: CardType.Defense, mode: ['SOLO', 'TEAM'], countSolo: 6, countTeam: 7, timing: CardTiming.OnDanger, targetType: TargetType.Self, canBeCountered: false, description: '摸到恶作剧机关时使用，解除危机并将机关重新放回牌堆。', iconPath: 'cards/safety_key' },
    { id: 3, key: 'warning_bell', name: '预警铃', type: CardType.Detect, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 5, timing: CardTiming.BeforeDraw, targetType: TargetType.Deck, canBeCountered: false, description: '查看下一张恶作剧机关距离牌堆顶部第几张。', iconPath: 'cards/warning_bell' },
    { id: 4, key: 'peek_mirror', name: '监控镜', type: CardType.Detect, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 5, timing: CardTiming.BeforeDraw, targetType: TargetType.Deck, canBeCountered: false, description: '查看牌堆顶部 3 张牌。', iconPath: 'cards/peek_mirror' },
    { id: 5, key: 'borrow_tool', name: '借道具', type: CardType.Interfere, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 4, timing: CardTiming.BeforeDraw, targetType: TargetType.OtherPlayer, canBeCountered: true, description: '指定一名玩家，对方选择 1 张手牌交给你。', iconPath: 'cards/borrow_tool' },
    { id: 6, key: 'swap_backpack', name: '换背包', type: CardType.Interfere, mode: ['SOLO', 'TEAM'], countSolo: 3, countTeam: 3, timing: CardTiming.BeforeDraw, targetType: TargetType.OtherPlayer, canBeCountered: true, description: '指定一名玩家，交换双方全部手牌。', iconPath: 'cards/swap_backpack' },
    { id: 7, key: 'shuffle_all', name: '大洗牌', type: CardType.Control, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 5, timing: CardTiming.BeforeDraw, targetType: TargetType.Deck, canBeCountered: false, description: '打乱整个牌堆顺序。', iconPath: 'cards/shuffle_all' },
    { id: 8, key: 'nap', name: '装睡', type: CardType.Survival, mode: ['SOLO', 'TEAM'], countSolo: 7, countTeam: 7, timing: CardTiming.BeforeDraw, targetType: TargetType.Self, canBeCountered: false, description: '跳过本次摸牌，直接结束回合。', iconPath: 'cards/nap' },
    { id: 9, key: 'turn_around', name: '掉头跑', type: CardType.Control, mode: ['SOLO', 'TEAM'], countSolo: 5, countTeam: 6, timing: CardTiming.BeforeDraw, targetType: TargetType.Self, canBeCountered: false, description: '跳过本次摸牌，并反转行动顺序。', iconPath: 'cards/turn_around' },
    { id: 10, key: 'push', name: '推一把', type: CardType.Transfer, mode: ['SOLO', 'TEAM'], countSolo: 5, countTeam: 6, timing: CardTiming.BeforeDraw, targetType: TargetType.OtherPlayer, canBeCountered: true, description: '跳过自己的摸牌，指定一名玩家立即进入摸牌阶段。', iconPath: 'cards/push' },
    { id: 11, key: 'chain_push', name: '连环推', type: CardType.Transfer, mode: ['SOLO', 'TEAM'], countSolo: 3, countTeam: 3, timing: CardTiming.BeforeDraw, targetType: TargetType.OtherPlayer, canBeCountered: true, description: '跳过自己的摸牌，指定一名玩家连续摸 2 次。', iconPath: 'cards/chain_push' },
    { id: 12, key: 'backdoor', name: '抄后路', type: CardType.Survival, mode: ['SOLO', 'TEAM'], countSolo: 4, countTeam: 4, timing: CardTiming.DrawPhase, targetType: TargetType.Self, canBeCountered: false, description: '不摸顶部，改为摸牌堆底部 1 张。', iconPath: 'cards/backdoor' },
    { id: 13, key: 'anti_prank', name: '防捣蛋', type: CardType.Counter, mode: ['SOLO', 'TEAM'], countSolo: 3, countTeam: 4, timing: CardTiming.OnTargeted, targetType: TargetType.Self, canBeCountered: false, description: '被借道具、换背包、推一把、连环推指定时，可以取消该效果。', iconPath: 'cards/anti_prank' },
    { id: 14, key: 'toolbox', name: '工具箱', type: CardType.Draw, mode: ['SOLO', 'TEAM'], countSolo: 2, countTeam: 3, timing: CardTiming.BeforeDraw, targetType: TargetType.Self, canBeCountered: false, description: '从牌堆顶部摸 2 张牌加入手牌，本回合仍需正常摸牌。', iconPath: 'cards/toolbox' },
    { id: 15, key: 'remote_rescue', name: '远程救援', type: CardType.Teamwork, mode: ['TEAM'], countSolo: 0, countTeam: 4, timing: CardTiming.OnTeammateDanger, targetType: TargetType.Teammate, canBeCountered: false, description: '队友摸到恶作剧机关时，可以替队友使用 1 张保险钥匙。', iconPath: 'cards/remote_rescue' },
    { id: 16, key: 'conveyor', name: '传送带', type: CardType.Teamwork, mode: ['TEAM'], countSolo: 0, countTeam: 3, timing: CardTiming.BeforeDraw, targetType: TargetType.Teammate, canBeCountered: false, description: '将自己 1 张手牌交给队友。', iconPath: 'cards/conveyor' },
    { id: 17, key: 'secret_note', name: '暗号纸条', type: CardType.Teamwork, mode: ['TEAM'], countSolo: 0, countTeam: 3, timing: CardTiming.BeforeDraw, targetType: TargetType.Teammate, canBeCountered: false, description: '查看队友全部手牌，并可与队友交换各 1 张牌。', iconPath: 'cards/secret_note' },
];
