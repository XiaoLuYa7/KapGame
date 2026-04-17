package com.beiguo.engine;

import com.beiguo.entity.Game;
import com.beiguo.entity.Player;
import com.beiguo.engine.effect.Effect;
import com.beiguo.engine.effect.EffectDispatcher;
import com.beiguo.engine.effect.EffectType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameEngine {
    @Autowired
    private EffectDispatcher effectDispatcher;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    // 初始化游戏
    public void initializeGame(Game game, List<Player> players) {
        try {
            // 初始化牌堆
            List<Integer> deck = createDeck();
            Collections.shuffle(deck);
            game.setDeckCards(objectMapper.writeValueAsString(deck));
            game.setDiscardPile("[]");

            // 给每个玩家发5张牌
            for (Player player : players) {
                List<Integer> hand = new ArrayList<>();
                for (int i = 0; i < 5; i++) {
                    if (!deck.isEmpty()) {
                        hand.add(deck.remove(0));
                    }
                }
                player.setHandCards(objectMapper.writeValueAsString(hand));
            }

            // 更新牌堆
            game.setDeckCards(objectMapper.writeValueAsString(deck));
            game.setStatus("PLAYING");
            game.setCurrentTurn(0); // 第一个玩家开始
        } catch (Exception e) {
            throw new RuntimeException("初始化游戏失败", e);
        }
    }

    // 创建牌堆
    private List<Integer> createDeck() {
        List<Integer> deck = new ArrayList<>();
        // 这里应该从数据库读取卡牌配置
        // 简化处理：添加一些测试卡牌ID
        for (int i = 1; i <= 10; i++) {
            for (int j = 0; j < 4; j++) { // 每种卡牌4张
                deck.add(i);
            }
        }
        return deck;
    }

    // 执行卡牌效果
    public GameContext playCard(Game game, Player player, Integer cardId, Integer targetPlayerIndex) {
        GameContext context = new GameContext();
        context.setGame(game);
        // 需要设置players和currentPlayer
        context.setCurrentPlayer(player);
        context.setTargetPlayerIndex(targetPlayerIndex);
        context.setCardId(cardId);

        try {
            // 这里应该根据cardId从数据库获取卡牌效果
            // 简化处理：根据cardId映射效果
            List<Effect> effects = getCardEffects(cardId);
            effectDispatcher.dispatchAll(context, effects);

            if (context.isSuccess()) {
                // 从玩家手牌移除卡牌
                List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                        new TypeReference<List<Integer>>() {});
                handCards.remove(cardId);
                player.setHandCards(objectMapper.writeValueAsString(handCards));

                // 添加到弃牌堆
                List<Integer> discardPile = objectMapper.readValue(game.getDiscardPile(),
                        new TypeReference<List<Integer>>() {});
                discardPile.add(cardId);
                game.setDiscardPile(objectMapper.writeValueAsString(discardPile));
            }
        } catch (Exception e) {
            context.setMessage("执行卡牌效果时出错: " + e.getMessage());
            context.setSuccess(false);
        }

        return context;
    }

    // 抽牌
    public GameContext drawCard(Game game, Player player) {
        GameContext context = new GameContext();
        context.setGame(game);
        context.setCurrentPlayer(player);

        try {
            List<Integer> deck = objectMapper.readValue(game.getDeckCards(),
                    new TypeReference<List<Integer>>() {});
            List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                    new TypeReference<List<Integer>>() {});

            if (deck.isEmpty()) {
                // 牌堆为空，重洗弃牌堆
                List<Integer> discardPile = objectMapper.readValue(game.getDiscardPile(),
                        new TypeReference<List<Integer>>() {});
                deck.addAll(discardPile);
                Collections.shuffle(deck);
                discardPile.clear();
                game.setDiscardPile(objectMapper.writeValueAsString(discardPile));
                context.setMessage("牌堆已重洗");
            }

            if (!deck.isEmpty()) {
                Integer drawnCard = deck.remove(0);
                handCards.add(drawnCard);
                player.setHandCards(objectMapper.writeValueAsString(handCards));
                game.setDeckCards(objectMapper.writeValueAsString(deck));

                // 检查抽到的卡牌是否是爆炸卡
                if (drawnCard == 1) { // 假设卡牌ID 1是爆炸卡
                    Effect explodeEffect = new Effect();
                    explodeEffect.setType(EffectType.EXPLODE);
                    effectDispatcher.dispatch(context, explodeEffect);
                }

                context.setMessage("抽到一张卡牌");
                context.setSuccess(true);
            } else {
                context.setMessage("牌堆已空");
                context.setSuccess(false);
            }
        } catch (Exception e) {
            context.setMessage("抽牌时出错: " + e.getMessage());
            context.setSuccess(false);
        }

        return context;
    }

    // 结束回合
    public void endTurn(Game game, List<Player> players) {
        int nextTurn = (game.getCurrentTurn() + 1) % players.size();
        game.setCurrentTurn(nextTurn);
    }

    // 检查游戏是否结束
    public Player checkGameOver(List<Player> players) {
        List<Player> alivePlayers = players.stream()
                .filter(Player::getIsAlive)
                .toList();

        if (alivePlayers.size() == 1) {
            return alivePlayers.get(0);
        }
        return null;
    }

    // 获取卡牌效果（简化）
    private List<Effect> getCardEffects(Integer cardId) {
        // 这里应该从数据库查询卡牌效果
        // 简化处理：硬编码一些效果
        List<Effect> effects = new ArrayList<>();
        Effect effect = new Effect();

        switch (cardId) {
            case 1: // Bomb
                effect.setType(EffectType.EXPLODE);
                break;
            case 2: // Defuse
                effect.setType(EffectType.DEFUSE_BOMB);
                break;
            case 3: // Transfer
                effect.setType(EffectType.TRANSFER_CARD);
                break;
            case 4: // DrawTwo
                effect.setType(EffectType.DRAW_CARD);
                effect.setParams(Map.of("count", 2));
                break;
            case 5: // Skip
                effect.setType(EffectType.SKIP_TURN);
                break;
            case 6: // Peek
                effect.setType(EffectType.PEEK_DECK);
                effect.setParams(Map.of("count", 3));
                break;
            case 7: // Shuffle
                effect.setType(EffectType.SHUFFLE_DECK);
                break;
            case 8: // Block
                effect.setType(EffectType.BLOCK_ATTACK);
                break;
            case 9: // Reverse
                effect.setType(EffectType.REVERSE_ORDER);
                break;
            case 10: // Steal
                effect.setType(EffectType.STEAL_CARD);
                break;
            default:
                effect.setType(EffectType.DRAW_CARD);
                effect.setParams(Map.of("count", 1));
        }

        effects.add(effect);
        return effects;
    }
}