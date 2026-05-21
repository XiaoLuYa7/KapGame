package com.beiguo.engine;

import com.beiguo.entity.CardConfig;
import com.beiguo.entity.Game;
import com.beiguo.entity.GameModeConfig;
import com.beiguo.entity.Player;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MischiefGameEngineTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void cardConfigSupportsMischiefFields() {
        CardConfig config = new CardConfig();

        config.setCardKey("trick_trap");
        config.setModeScope("SOLO,TEAM");
        config.setCountSolo(4);
        config.setCountTeam(5);
        config.setTiming("DrawPhase");
        config.setTargetType("Self");
        config.setCanBeCountered(false);
        config.setIconPath("cards/trick_trap");

        GameModeConfig mode = new GameModeConfig();
        mode.setModeKey("SOLO");
        mode.setPlayerCount(5);
        mode.setDangerCardCount(4);

        assertThat(config.getCardKey()).isEqualTo("trick_trap");
        assertThat(config.getCountSolo()).isEqualTo(4);
        assertThat(config.getCanBeCountered()).isFalse();
        assertThat(mode.getModeKey()).isEqualTo("SOLO");
        assertThat(mode.getPlayerCount()).isEqualTo(5);
    }

    @Test
    void soloInitializationDealsSixCardsWithOneSafetyKeyEachAndFourTrapsInDeck() throws Exception {
        Game game = new Game();
        game.setModeConfigKey(MischiefModeKeys.SOLO);
        List<Player> players = createPlayers(5);

        new GameEngine().initializeGame(game, players);

        assertThat(game.getStatus()).isEqualTo("PLAYING");
        assertThat(game.getMaxPlayers()).isEqualTo(5);
        for (Player player : players) {
            List<Integer> hand = readCards(player.getHandCards());
            assertThat(hand).hasSize(6);
            assertThat(hand).contains(MischiefCardKeys.SAFETY_KEY);
        }

        List<Integer> deck = readCards(game.getDeckCards());
        assertThat(deck.stream().filter(card -> card.equals(MischiefCardKeys.TRICK_TRAP)).count()).isEqualTo(4);
        assertThat(deck).hasSize(28);
    }

    @Test
    void safetyKeyDefusesTrickTrapWithoutAddingTrapToHand() throws Exception {
        Game game = preparedGameWithDeck(List.of(MischiefCardKeys.TRICK_TRAP));
        Player player = createPlayer(0);
        player.setHandCards(writeCards(List.of(MischiefCardKeys.SAFETY_KEY, MischiefCardKeys.NAP)));

        GameContext context = new GameEngine().drawCard(game, player);

        assertThat(context.isSuccess()).isTrue();
        assertThat(context.getMessage()).contains("保险钥匙");
        assertThat(player.getIsAlive()).isTrue();
        assertThat(readCards(player.getHandCards())).containsExactly(MischiefCardKeys.NAP);
        assertThat(readCards(game.getDiscardPile())).contains(MischiefCardKeys.SAFETY_KEY);
        assertThat(readCards(game.getDeckCards())).contains(MischiefCardKeys.TRICK_TRAP);
    }

    @Test
    void playerIsEliminatedWhenTrapCannotBeDefused() throws Exception {
        Game game = preparedGameWithDeck(List.of(MischiefCardKeys.TRICK_TRAP));
        Player player = createPlayer(0);
        player.setHandCards(writeCards(List.of(MischiefCardKeys.NAP, MischiefCardKeys.PEEK_MIRROR)));

        GameContext context = new GameEngine().drawCard(game, player);

        assertThat(context.isSuccess()).isTrue();
        assertThat(context.getMessage()).contains("已出局");
        assertThat(player.getIsAlive()).isFalse();
        assertThat(readCards(player.getHandCards())).isEmpty();
        assertThat(readCards(game.getDiscardPile())).contains(MischiefCardKeys.NAP, MischiefCardKeys.PEEK_MIRROR);
    }

    @Test
    void teammateCanRescueTrapWithRemoteRescueAndSafetyKey() throws Exception {
        Game game = preparedGameWithDeck(List.of(MischiefCardKeys.TRICK_TRAP));
        game.setModeConfigKey(MischiefModeKeys.TEAM);
        Player trapped = createPlayer(0);
        trapped.setTeamNo(1);
        trapped.setHandCards(writeCards(List.of(MischiefCardKeys.NAP)));
        Player teammate = createPlayer(1);
        teammate.setTeamNo(1);
        teammate.setHandCards(writeCards(List.of(MischiefCardKeys.REMOTE_RESCUE, MischiefCardKeys.SAFETY_KEY)));
        GameContext context = new GameContext();
        context.setGame(game);
        context.setPlayers(List.of(trapped, teammate));
        context.setCurrentPlayer(trapped);

        GameContext result = new GameEngine().drawCard(context);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getMessage()).contains("远程救援");
        assertThat(trapped.getIsAlive()).isTrue();
        assertThat(readCards(teammate.getHandCards())).isEmpty();
        assertThat(readCards(game.getDiscardPile())).contains(MischiefCardKeys.REMOTE_RESCUE, MischiefCardKeys.SAFETY_KEY);
    }

    @Test
    void antiPrankCancelsOnlyTargetedNegativeCards() throws Exception {
        Game game = preparedGameWithDeck(List.of(MischiefCardKeys.NAP));
        Player attacker = createPlayer(0);
        attacker.setHandCards(writeCards(List.of(MischiefCardKeys.PUSH)));
        Player target = createPlayer(1);
        target.setHandCards(writeCards(List.of(MischiefCardKeys.ANTI_PRANK)));
        GameContext context = new GameContext();
        context.setGame(game);
        context.setPlayers(List.of(attacker, target));
        context.setCurrentPlayer(attacker);
        context.setTargetPlayerIndex(1);
        context.setCardId(MischiefCardKeys.PUSH);

        GameContext result = new GameEngine().playCard(context);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getMessage()).contains("防捣蛋");
        assertThat(readCards(attacker.getHandCards())).isEmpty();
        assertThat(readCards(target.getHandCards())).isEmpty();
        assertThat(readCards(game.getDiscardPile())).contains(MischiefCardKeys.PUSH, MischiefCardKeys.ANTI_PRANK);
        assertThat(readCards(game.getDeckCards())).containsExactly(MischiefCardKeys.NAP);
    }

    private static Game preparedGameWithDeck(List<Integer> deckCards) throws Exception {
        Game game = new Game();
        game.setModeConfigKey(MischiefModeKeys.SOLO);
        game.setDeckCards(writeCards(deckCards));
        game.setDiscardPile("[]");
        game.setTurnDirection(1);
        return game;
    }

    private static List<Player> createPlayers(int count) {
        List<Player> players = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            players.add(createPlayer(i));
        }
        return players;
    }

    private static Player createPlayer(int index) {
        Player player = new Player();
        player.setPlayerIndex(index);
        player.setIsAi(index != 0);
        player.setHp(3);
        player.setIsAlive(true);
        player.setHandCards("[]");
        return player;
    }

    private static List<Integer> readCards(String json) throws Exception {
        return objectMapper.readValue(json, new TypeReference<List<Integer>>() {});
    }

    private static String writeCards(List<Integer> cards) throws Exception {
        return objectMapper.writeValueAsString(cards);
    }
}
