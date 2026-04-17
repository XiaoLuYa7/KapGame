package com.beiguo.engine;

import com.beiguo.entity.Game;
import com.beiguo.entity.Player;
import lombok.Data;
import java.util.List;

@Data
public class GameContext {
    private Game game;
    private List<Player> players;
    private Player currentPlayer;
    private Integer targetPlayerIndex;
    private Integer cardId;

    // 临时存储处理结果
    private String message;
    private boolean success;
}