package com.beiguo.dto;

import lombok.Data;

@Data
public class GameStartResponse {
    private Long gameId;
    private Integer playerCount;
    private Integer yourPlayerIndex;
    private String mode;
    private Integer teamNo;

    public GameStartResponse(Long gameId, Integer playerCount, Integer yourPlayerIndex) {
        this.gameId = gameId;
        this.playerCount = playerCount;
        this.yourPlayerIndex = yourPlayerIndex;
    }

    public GameStartResponse(Long gameId, Integer playerCount, Integer yourPlayerIndex, String mode, Integer teamNo) {
        this.gameId = gameId;
        this.playerCount = playerCount;
        this.yourPlayerIndex = yourPlayerIndex;
        this.mode = mode;
        this.teamNo = teamNo;
    }
}
