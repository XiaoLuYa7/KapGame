package com.beiguo.engine.effect.impl;

import com.beiguo.engine.GameContext;
import com.beiguo.engine.effect.Effect;
import com.beiguo.engine.effect.EffectHandler;
import com.beiguo.entity.Game;
import com.beiguo.entity.Player;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class DrawCardEffectHandler implements EffectHandler {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(GameContext context, Effect effect) {
        try {
            Game game = context.getGame();
            Player player = context.getCurrentPlayer();
            Integer count = (Integer) effect.getParams().getOrDefault("count", 1);

            List<Integer> deck = objectMapper.readValue(game.getDeckCards(),
                    new TypeReference<List<Integer>>() {});
            List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                    new TypeReference<List<Integer>>() {});

            // 如果牌堆不足，重洗弃牌堆
            if (deck.size() < count) {
                List<Integer> discardPile = objectMapper.readValue(game.getDiscardPile(),
                        new TypeReference<List<Integer>>() {});
                deck.addAll(discardPile);
                Collections.shuffle(deck);
                discardPile.clear();
                game.setDiscardPile(objectMapper.writeValueAsString(discardPile));
            }

            // 抽牌
            List<Integer> drawnCards = new ArrayList<>();
            for (int i = 0; i < count && !deck.isEmpty(); i++) {
                drawnCards.add(deck.remove(0));
            }

            handCards.addAll(drawnCards);
            player.setHandCards(objectMapper.writeValueAsString(handCards));
            game.setDeckCards(objectMapper.writeValueAsString(deck));

            context.setMessage("抽取了 " + drawnCards.size() + " 张卡牌");
            context.setSuccess(true);
        } catch (Exception e) {
            context.setMessage("抽牌效果处理失败: " + e.getMessage());
            context.setSuccess(false);
        }
    }
}