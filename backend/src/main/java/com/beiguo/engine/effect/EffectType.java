package com.beiguo.engine.effect;

public enum EffectType {
    EXPLODE,           // 爆炸
    DEFUSE_BOMB,       // 拆除炸弹
    TRANSFER_CARD,     // 转移卡牌
    DRAW_CARD,         // 抽牌
    SKIP_TURN,         // 跳过回合
    PEEK_DECK,         // 查看牌堆
    SHUFFLE_DECK,      // 洗牌
    BLOCK_ATTACK,      // 阻挡攻击
    REVERSE_ORDER,     // 反转顺序
    STEAL_CARD         // 偷牌
}