package com.beiguo.dto;

import lombok.Data;

@Data
public class PlayCardRequest {
    private Integer cardId;
    private Integer targetPlayerIndex; // optional
}