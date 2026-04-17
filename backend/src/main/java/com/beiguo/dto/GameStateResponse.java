package com.beiguo.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GameStateResponse {
    private Long gameId;
    private String status;
    private Integer currentTurn;
    private Integer yourPlayerIndex;
    private List<PlayerInfo> players;
    private List<Integer> handCards; // card IDs
    private Integer deckRemaining;
    private List<Integer> discardPile;
    private Boolean isYourTurn;
    private String lastAction;

    @Data
    public static class PlayerInfo {
        private Integer playerIndex;
        private String username;
        private Boolean isAi;
        private Integer hp;
        private Boolean isAlive;
        private Integer handCount;
    }
}