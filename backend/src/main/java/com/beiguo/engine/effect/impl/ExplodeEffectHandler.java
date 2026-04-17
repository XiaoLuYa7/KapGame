package com.beiguo.engine.effect.impl;

import com.beiguo.engine.GameContext;
import com.beiguo.engine.effect.Effect;
import com.beiguo.engine.effect.EffectHandler;
import com.beiguo.entity.Player;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExplodeEffectHandler implements EffectHandler {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(GameContext context, Effect effect) {
        Player currentPlayer = context.getCurrentPlayer();

        // 检查是否有拆除卡
        try {
            List<Integer> handCards = objectMapper.readValue(currentPlayer.getHandCards(),
                    new TypeReference<List<Integer>>() {});

            // 这里需要检查手牌中是否有拆除卡（card_id对应Defuse卡）
            // 简化处理：如果有防御卡就抵消
            boolean hasDefuse = handCards.stream().anyMatch(cardId -> {
                // 这里应该根据cardId查询卡牌类型，判断是否是防御卡
                // 暂时简单处理
                return cardId == 2; // 假设卡牌ID 2是拆除卡
            });

            if (hasDefuse) {
                // 移除一张拆除卡
                handCards.remove(Integer.valueOf(2));
                currentPlayer.setHandCards(objectMapper.writeValueAsString(handCards));
                context.setMessage(currentPlayer.getUser() != null ?
                    currentPlayer.getUser().getUsername() : "AI玩家" + "使用拆除卡抵消了爆炸");
                context.setSuccess(true);
            } else {
                // 没有拆除卡，玩家死亡
                currentPlayer.setIsAlive(false);
                currentPlayer.setHp(0);
                context.setMessage(currentPlayer.getUser() != null ?
                    currentPlayer.getUser().getUsername() : "AI玩家" + "被炸死了");
                context.setSuccess(true);
            }
        } catch (Exception e) {
            context.setMessage("处理爆炸效果时出错");
            context.setSuccess(false);
        }
    }
}