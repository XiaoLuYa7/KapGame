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
    private static final int INITIAL_HAND_COUNT = 6;
    private static final Map<Integer, Integer> SOLO_COUNTS = Map.ofEntries(
            Map.entry(MischiefCardKeys.TRICK_TRAP, 4),
            Map.entry(MischiefCardKeys.SAFETY_KEY, 6),
            Map.entry(MischiefCardKeys.WARNING_BELL, 4),
            Map.entry(MischiefCardKeys.PEEK_MIRROR, 4),
            Map.entry(MischiefCardKeys.BORROW_TOOL, 4),
            Map.entry(MischiefCardKeys.SWAP_BACKPACK, 3),
            Map.entry(MischiefCardKeys.SHUFFLE_ALL, 4),
            Map.entry(MischiefCardKeys.NAP, 7),
            Map.entry(MischiefCardKeys.TURN_AROUND, 5),
            Map.entry(MischiefCardKeys.PUSH, 5),
            Map.entry(MischiefCardKeys.CHAIN_PUSH, 3),
            Map.entry(MischiefCardKeys.BACKDOOR, 4),
            Map.entry(MischiefCardKeys.ANTI_PRANK, 3),
            Map.entry(MischiefCardKeys.TOOLBOX, 2)
    );
    private static final Map<Integer, Integer> TEAM_COUNTS = Map.ofEntries(
            Map.entry(MischiefCardKeys.TRICK_TRAP, 5),
            Map.entry(MischiefCardKeys.SAFETY_KEY, 7),
            Map.entry(MischiefCardKeys.WARNING_BELL, 5),
            Map.entry(MischiefCardKeys.PEEK_MIRROR, 5),
            Map.entry(MischiefCardKeys.BORROW_TOOL, 4),
            Map.entry(MischiefCardKeys.SWAP_BACKPACK, 3),
            Map.entry(MischiefCardKeys.SHUFFLE_ALL, 5),
            Map.entry(MischiefCardKeys.NAP, 7),
            Map.entry(MischiefCardKeys.TURN_AROUND, 6),
            Map.entry(MischiefCardKeys.PUSH, 6),
            Map.entry(MischiefCardKeys.CHAIN_PUSH, 3),
            Map.entry(MischiefCardKeys.BACKDOOR, 4),
            Map.entry(MischiefCardKeys.ANTI_PRANK, 4),
            Map.entry(MischiefCardKeys.TOOLBOX, 3),
            Map.entry(MischiefCardKeys.REMOTE_RESCUE, 4),
            Map.entry(MischiefCardKeys.CONVEYOR, 3),
            Map.entry(MischiefCardKeys.SECRET_NOTE, 3)
    );

    // 初始化游戏
    public void initializeGame(Game game, List<Player> players) {
        try {
            String mode = normalizeMode(game);
            game.setGameMode(mode);
            game.setModeConfigKey(mode);
            game.setMaxPlayers(MischiefModeKeys.TEAM.equals(mode) ? 6 : 5);
            game.setTurnDirection(1);

            List<Integer> deck = createDeck(mode, false);
            Collections.shuffle(deck);
            game.setDiscardPile("[]");

            assignTeams(mode, players);
            int guaranteedSafetyKeys = dealGuaranteedSafetyKeys(mode, players);
            removeCards(deck, MischiefCardKeys.SAFETY_KEY, guaranteedSafetyKeys);
            for (Player player : players) {
                List<Integer> hand = objectMapper.readValue(player.getHandCards(),
                        new TypeReference<List<Integer>>() {});
                while (hand.size() < INITIAL_HAND_COUNT) {
                    if (!deck.isEmpty()) {
                        hand.add(deck.remove(0));
                    } else {
                        break;
                    }
                }
                player.setHandCards(objectMapper.writeValueAsString(hand));
            }

            deck.addAll(createDangerCards(mode));
            Collections.shuffle(deck);

            game.setDeckCards(objectMapper.writeValueAsString(deck));
            game.setStatus("PLAYING");
            game.setCurrentTurn(0);
        } catch (Exception e) {
            throw new RuntimeException("初始化游戏失败", e);
        }
    }

    // 创建牌堆
    private List<Integer> createDeck() {
        return createDeck(MischiefModeKeys.SOLO, true);
    }

    // 执行卡牌效果
    public GameContext playCard(Game game, Player player, Integer cardId, Integer targetPlayerIndex) {
        GameContext context = new GameContext();
        context.setGame(game);
        context.setCurrentPlayer(player);
        context.setTargetPlayerIndex(targetPlayerIndex);
        context.setCardId(cardId);

        return playCard(context);
    }

    public GameContext playCard(GameContext context) {
        Game game = context.getGame();
        Player player = context.getCurrentPlayer();
        Integer cardId = context.getCardId();

        try {
            if (cardId == null || player == null || game == null) {
                context.setMessage("卡牌上下文不完整");
                context.setSuccess(false);
                return context;
            }
            if (cardId == MischiefCardKeys.TRICK_TRAP || cardId == MischiefCardKeys.SAFETY_KEY
                    || cardId == MischiefCardKeys.ANTI_PRANK) {
                context.setMessage("该卡牌不能主动使用");
                context.setSuccess(false);
                return context;
            }

            if (!handContains(player, cardId)) {
                context.setMessage("你没有这张卡牌");
                context.setSuccess(false);
                return context;
            }

            Player target = findPlayer(context.getPlayers(), context.getTargetPlayerIndex());
            if (target != null && isCounterableTargetedCard(cardId) && consumeCardFromHand(target, MischiefCardKeys.ANTI_PRANK)) {
                consumeCardFromHand(player, cardId);
                addToDiscard(game, List.of(cardId, MischiefCardKeys.ANTI_PRANK));
                context.setCountered(true);
                context.setSuccess(true);
                context.setMessage("对方使用防捣蛋，效果被取消");
                return context;
            }

            consumeCardFromHand(player, cardId);
            addToDiscard(game, List.of(cardId));
            resolvePlayedCard(context, cardId, target);
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
        return drawCard(context);
    }

    public GameContext drawCard(GameContext context) {
        Game game = context.getGame();
        Player player = context.getCurrentPlayer();

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
                context.setDrawnCardId(drawnCard);

                if (drawnCard == MischiefCardKeys.TRICK_TRAP) {
                    game.setDeckCards(objectMapper.writeValueAsString(deck));
                    resolveDangerCard(context, deck);
                    return context;
                }

                handCards.add(drawnCard);
                player.setHandCards(objectMapper.writeValueAsString(handCards));
                game.setDeckCards(objectMapper.writeValueAsString(deck));

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
        int direction = game.getTurnDirection() == null ? 1 : game.getTurnDirection();
        int nextTurn = Math.floorMod(game.getCurrentTurn() + direction, players.size());
        for (int i = 0; i < players.size(); i++) {
            int candidateTurn = nextTurn;
            Player nextPlayer = players.stream()
                    .filter(player -> player.getPlayerIndex() == candidateTurn)
                    .findFirst()
                    .orElse(null);
            if (nextPlayer != null && Boolean.TRUE.equals(nextPlayer.getIsAlive())) {
                break;
            }
            nextTurn = Math.floorMod(nextTurn + direction, players.size());
        }
        game.setCurrentTurn(nextTurn);
    }

    // 检查游戏是否结束
    public Player checkGameOver(List<Player> players) {
        List<Player> alivePlayers = players.stream()
                .filter(Player::getIsAlive)
                .toList();

        boolean teamMode = alivePlayers.stream().anyMatch(player -> player.getTeamNo() != null);
        if (teamMode) {
            long aliveTeams = alivePlayers.stream()
                    .map(Player::getTeamNo)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
            if (aliveTeams == 1 && !alivePlayers.isEmpty()) {
                return alivePlayers.get(0);
            }
            return null;
        }

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
            case 1: // 恶作剧机关（兼容旧效果分发）
                effect.setType(EffectType.EXPLODE);
                break;
            case 2: // 保险钥匙（兼容旧效果分发）
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

    private String normalizeMode(Game game) {
        String mode = game.getModeConfigKey() != null ? game.getModeConfigKey() : game.getGameMode();
        if (MischiefModeKeys.TEAM.equalsIgnoreCase(mode)) {
            return MischiefModeKeys.TEAM;
        }
        return MischiefModeKeys.SOLO;
    }

    private List<Integer> createDeck(String mode, boolean includeDanger) {
        Map<Integer, Integer> counts = MischiefModeKeys.TEAM.equals(mode) ? TEAM_COUNTS : SOLO_COUNTS;
        List<Integer> deck = new ArrayList<>();
        for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
            if (!includeDanger && entry.getKey() == MischiefCardKeys.TRICK_TRAP) {
                continue;
            }
            for (int i = 0; i < entry.getValue(); i++) {
                deck.add(entry.getKey());
            }
        }
        return deck;
    }

    private List<Integer> createDangerCards(String mode) {
        int count = MischiefModeKeys.TEAM.equals(mode)
                ? TEAM_COUNTS.get(MischiefCardKeys.TRICK_TRAP)
                : SOLO_COUNTS.get(MischiefCardKeys.TRICK_TRAP);
        List<Integer> cards = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            cards.add(MischiefCardKeys.TRICK_TRAP);
        }
        return cards;
    }

    private void assignTeams(String mode, List<Player> players) {
        if (!MischiefModeKeys.TEAM.equals(mode)) {
            return;
        }
        int[] teams = {1, 2, 3, 1, 2, 3};
        for (int i = 0; i < players.size() && i < teams.length; i++) {
            players.get(i).setTeamNo(teams[i]);
        }
    }

    private int dealGuaranteedSafetyKeys(String mode, List<Player> players) throws Exception {
        int dealt = 0;
        if (MischiefModeKeys.TEAM.equals(mode)) {
            for (int team = 1; team <= 3; team++) {
                int currentTeam = team;
                List<Player> teammates = players.stream()
                        .filter(player -> Objects.equals(player.getTeamNo(), currentTeam))
                        .toList();
                for (int i = 0; i < 2 && !teammates.isEmpty(); i++) {
                    Player receiver = teammates.get(i % teammates.size());
                    List<Integer> hand = readCards(receiver.getHandCards());
                    hand.add(MischiefCardKeys.SAFETY_KEY);
                    receiver.setHandCards(objectMapper.writeValueAsString(hand));
                    dealt++;
                }
            }
            return dealt;
        }

        for (Player player : players) {
            List<Integer> hand = readCards(player.getHandCards());
            hand.add(MischiefCardKeys.SAFETY_KEY);
            player.setHandCards(objectMapper.writeValueAsString(hand));
            dealt++;
        }
        return dealt;
    }

    private void removeCards(List<Integer> deck, Integer cardId, int count) {
        for (int i = 0; i < count; i++) {
            deck.remove(cardId);
        }
    }

    private void resolveDangerCard(GameContext context, List<Integer> deck) throws Exception {
        Player player = context.getCurrentPlayer();
        Game game = context.getGame();
        if (consumeCardFromHand(player, MischiefCardKeys.SAFETY_KEY)) {
            addToDiscard(game, List.of(MischiefCardKeys.SAFETY_KEY));
            reinsertDangerCard(deck);
            game.setDeckCards(objectMapper.writeValueAsString(deck));
            context.setMessage("触发恶作剧机关，已使用保险钥匙解除危机");
            context.setSuccess(true);
            return;
        }

        if (tryTeammateRescue(context, deck)) {
            game.setDeckCards(objectMapper.writeValueAsString(deck));
            context.setMessage("触发恶作剧机关，队友使用远程救援解除危机");
            context.setSuccess(true);
            return;
        }

        eliminatePlayer(player, game);
        game.setDeckCards(objectMapper.writeValueAsString(deck));
        context.setMessage("触发恶作剧机关，你没有保险钥匙，已出局");
        context.setSuccess(true);
    }

    private boolean tryTeammateRescue(GameContext context, List<Integer> deck) throws Exception {
        Game game = context.getGame();
        Player player = context.getCurrentPlayer();
        if (!MischiefModeKeys.TEAM.equals(normalizeMode(game)) || player.getTeamNo() == null || context.getPlayers() == null) {
            return false;
        }
        for (Player teammate : context.getPlayers()) {
            if (Objects.equals(teammate.getTeamNo(), player.getTeamNo())
                    && !Objects.equals(teammate.getPlayerIndex(), player.getPlayerIndex())
                    && Boolean.TRUE.equals(teammate.getIsAlive())
                    && handContains(teammate, MischiefCardKeys.REMOTE_RESCUE)
                    && handContains(teammate, MischiefCardKeys.SAFETY_KEY)) {
                consumeCardFromHand(teammate, MischiefCardKeys.REMOTE_RESCUE);
                consumeCardFromHand(teammate, MischiefCardKeys.SAFETY_KEY);
                addToDiscard(game, List.of(MischiefCardKeys.REMOTE_RESCUE, MischiefCardKeys.SAFETY_KEY));
                reinsertDangerCard(deck);
                return true;
            }
        }
        return false;
    }

    private void reinsertDangerCard(List<Integer> deck) {
        deck.add(MischiefCardKeys.TRICK_TRAP);
    }

    private void eliminatePlayer(Player player, Game game) throws Exception {
        List<Integer> hand = readCards(player.getHandCards());
        addToDiscard(game, hand);
        player.setHandCards("[]");
        player.setIsAlive(false);
    }

    private void resolvePlayedCard(GameContext context, Integer cardId, Player target) throws Exception {
        Game game = context.getGame();
        switch (cardId) {
            case MischiefCardKeys.NAP -> {
                context.setTurnSkipped(true);
                context.setMessage("你跳过了本次摸牌");
                context.setSuccess(true);
            }
            case MischiefCardKeys.TURN_AROUND -> {
                game.setTurnDirection((game.getTurnDirection() == null ? 1 : game.getTurnDirection()) * -1);
                context.setTurnSkipped(true);
                context.setMessage("行动方向已反转");
                context.setSuccess(true);
            }
            case MischiefCardKeys.SHUFFLE_ALL -> {
                List<Integer> deck = readCards(game.getDeckCards());
                Collections.shuffle(deck);
                game.setDeckCards(objectMapper.writeValueAsString(deck));
                context.setMessage("牌堆已重新洗牌");
                context.setSuccess(true);
            }
            case MischiefCardKeys.PEEK_MIRROR -> {
                List<Integer> deck = readCards(game.getDeckCards());
                context.setMessage("监控镜查看顶部 " + Math.min(3, deck.size()) + " 张牌");
                context.setSuccess(true);
            }
            case MischiefCardKeys.WARNING_BELL -> {
                List<Integer> deck = readCards(game.getDeckCards());
                int index = deck.indexOf(MischiefCardKeys.TRICK_TRAP);
                context.setMessage(index >= 0 ? "下一张恶作剧机关在第 " + (index + 1) + " 张" : "牌堆中暂未发现恶作剧机关");
                context.setSuccess(true);
            }
            case MischiefCardKeys.PUSH -> drawTarget(context, target, 1);
            case MischiefCardKeys.CHAIN_PUSH -> drawTarget(context, target, 2);
            default -> {
                context.setMessage("卡牌效果已结算");
                context.setSuccess(true);
            }
        }
    }

    private void drawTarget(GameContext context, Player target, int count) throws Exception {
        if (target == null) {
            context.setMessage("请选择目标玩家");
            context.setSuccess(false);
            return;
        }
        for (int i = 0; i < count; i++) {
            GameContext drawContext = new GameContext();
            drawContext.setGame(context.getGame());
            drawContext.setPlayers(context.getPlayers());
            drawContext.setCurrentPlayer(target);
            drawCard(drawContext);
            if (!Boolean.TRUE.equals(target.getIsAlive())) {
                break;
            }
        }
        context.setTurnSkipped(true);
        context.setMessage(count > 1 ? "连环推已结算" : "推一把已结算");
        context.setSuccess(true);
    }

    private boolean isCounterableTargetedCard(Integer cardId) {
        return cardId == MischiefCardKeys.BORROW_TOOL
                || cardId == MischiefCardKeys.SWAP_BACKPACK
                || cardId == MischiefCardKeys.PUSH
                || cardId == MischiefCardKeys.CHAIN_PUSH;
    }

    private Player findPlayer(List<Player> players, Integer playerIndex) {
        if (players == null || playerIndex == null) {
            return null;
        }
        return players.stream()
                .filter(player -> Objects.equals(player.getPlayerIndex(), playerIndex))
                .findFirst()
                .orElse(null);
    }

    private boolean handContains(Player player, Integer cardId) throws Exception {
        return readCards(player.getHandCards()).contains(cardId);
    }

    private boolean consumeCardFromHand(Player player, Integer cardId) throws Exception {
        List<Integer> hand = readCards(player.getHandCards());
        boolean removed = hand.remove(cardId);
        if (removed) {
            player.setHandCards(objectMapper.writeValueAsString(hand));
        }
        return removed;
    }

    private void addToDiscard(Game game, List<Integer> cards) throws Exception {
        if (cards == null || cards.isEmpty()) {
            return;
        }
        List<Integer> discard = readCards(game.getDiscardPile());
        discard.addAll(cards);
        game.setDiscardPile(objectMapper.writeValueAsString(discard));
    }

    private List<Integer> readCards(String json) throws Exception {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        return objectMapper.readValue(json, new TypeReference<List<Integer>>() {});
    }
}
