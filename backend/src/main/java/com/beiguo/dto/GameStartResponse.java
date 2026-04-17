package com.beiguo.dto;

import lombok.Data;

@Data
public class GameStartResponse {
    private Long gameId;
    private Integer playerCount;
    private Integer yourPlayerIndex;

    public GameStartResponse(Long gameId, Integer playerCount, Integer yourPlayerIndex) {
        this.gameId = gameId;
        this.playerCount = playerCount;
        this.yourPlayerIndex = yourPlayerIndex;
    }
}