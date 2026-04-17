package com.beiguo.service;

import com.beiguo.dto.GameStartResponse;
import com.beiguo.dto.GameStateResponse;
import com.beiguo.engine.GameContext;
import com.beiguo.entity.Game;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface GameService {
    GameStartResponse startGame();
    GameStateResponse getGameState(Long gameId);
    GameContext playCard(Long gameId, Integer cardId, Integer targetPlayerIndex);
    GameContext drawCard(Long gameId);
    void aiPlayTurn(Long gameId);

    // CRUD方法
    Game create(Game game);
    Game update(Long id, Game game);
    void delete(Long id);
    Game getById(Long id);
    List<Game> getAll();
    Page<Game> getPage(Pageable pageable);

    // 业务特定方法
    Game startNewGame(Long userId, String gameMode);
    Game endGame(Long gameId, String winner);
    Game pauseGame(Long gameId);
    Game resumeGame(Long gameId);
    Game addPlayerToGame(Long gameId, Long userId, boolean isAi);
    Game removePlayerFromGame(Long gameId, Long playerId);

    // 查询方法
    List<Game> getGamesByUserId(Long userId);
    List<Game> getActiveGames();
    List<Game> getCompletedGames();
    List<Game> getGamesByStatus(String status);
    List<Game> getGamesByMode(String gameMode);

    // 检查方法
    boolean isGameActive(Long gameId);
    boolean isGameCompleted(Long gameId);
    boolean isPlayerInGame(Long gameId, Long userId);

    // 统计方法
    Integer countGamesByUserId(Long userId);
    Integer countActiveGames();
    Integer countCompletedGames();
    Integer countGamesByMode(String gameMode);
}