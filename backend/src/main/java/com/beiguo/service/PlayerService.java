package com.beiguo.service;

import com.beiguo.entity.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface PlayerService {

    // CRUD方法
    Player create(Player player);
    Player update(Long id, Player player);
    void delete(Long id);
    Player getById(Long id);
    List<Player> getAll();
    Page<Player> getPage(Pageable pageable);

    // 业务特定方法
    Player joinGame(Long userId, Long gameId, Integer playerIndex);
    Player leaveGame(Long playerId);
    Player updateHealth(Long playerId, Integer newHp);
    Player updateHandCards(Long playerId, List<Integer> cardIds);
    Player addCardToHand(Long playerId, Integer cardId);
    Player removeCardFromHand(Long playerId, Integer cardId);
    Player revivePlayer(Long playerId);

    // 查询方法
    List<Player> getPlayersByGameId(Long gameId);
    List<Player> getPlayersByUserId(Long userId);
    Player getPlayerByGameAndUser(Long gameId, Long userId);
    List<Player> getAlivePlayersByGameId(Long gameId);
    List<Player> getAiPlayersByGameId(Long gameId);
    List<Player> getHumanPlayersByGameId(Long gameId);

    // 统计方法
    Integer countPlayersByGameId(Long gameId);
    Integer countAlivePlayersByGameId(Long gameId);
    Integer countHumanPlayersByGameId(Long gameId);
    Integer countAiPlayersByGameId(Long gameId);
}