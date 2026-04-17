package com.beiguo.service.impl;

import com.beiguo.entity.Game;
import com.beiguo.entity.Player;
import com.beiguo.entity.User;
import com.beiguo.repository.GameRepository;
import com.beiguo.repository.PlayerRepository;
import com.beiguo.service.GameService;
import com.beiguo.service.PlayerService;
import com.beiguo.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PlayerServiceImpl implements PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GameService gameService;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public Player create(Player player) {
        // 验证游戏存在
        if (player.getGame() == null || player.getGame().getId() == null) {
            throw new RuntimeException("游戏不能为空");
        }

        Game game = gameRepository.findById(player.getGame().getId())
                .orElseThrow(() -> new RuntimeException("游戏不存在"));

        // 验证用户存在（如果不是AI）
        if (!Boolean.TRUE.equals(player.getIsAi()) && player.getUser() != null) {
            User user = userService.getUserById(player.getUser().getId());
            player.setUser(user);
        } else if (Boolean.TRUE.equals(player.getIsAi())) {
            player.setUser(null); // AI玩家没有用户
        }

        // 检查玩家索引是否唯一
        if (playerRepository.findByGame_IdAndPlayerIndex(game.getId(), player.getPlayerIndex()).isPresent()) {
            throw new RuntimeException("该游戏已存在相同索引的玩家");
        }

        // 设置默认值
        if (player.getHp() == null) {
            player.setHp(3);
        }
        if (player.getIsAlive() == null) {
            player.setIsAlive(true);
        }
        if (player.getHandCards() == null) {
            player.setHandCards("[]");
        }

        player.setGame(game);
        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player update(Long id, Player player) {
        Player existing = getById(id);

        // 只能更新部分字段
        if (player.getHp() != null) {
            existing.setHp(player.getHp());
        }
        if (player.getIsAlive() != null) {
            existing.setIsAlive(player.getIsAlive());
        }
        if (player.getHandCards() != null) {
            existing.setHandCards(player.getHandCards());
        }
        if (player.getPlayerIndex() != null) {
            // 检查新索引是否唯一
            if (!existing.getPlayerIndex().equals(player.getPlayerIndex())) {
                if (playerRepository.findByGame_IdAndPlayerIndex(existing.getGame().getId(), player.getPlayerIndex()).isPresent()) {
                    throw new RuntimeException("该游戏已存在相同索引的玩家");
                }
                existing.setPlayerIndex(player.getPlayerIndex());
            }
        }

        return playerRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new RuntimeException("玩家不存在");
        }
        playerRepository.deleteById(id);
    }

    @Override
    public Player getById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("玩家不存在"));
    }

    @Override
    public List<Player> getAll() {
        return playerRepository.findAll();
    }

    @Override
    public Page<Player> getPage(Pageable pageable) {
        return playerRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public Player joinGame(Long userId, Long gameId, Integer playerIndex) {
        User user = userService.getUserById(userId);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("游戏不存在"));

        // 检查用户是否已在游戏中
        if (playerRepository.findByGame_IdAndUser_Id(gameId, userId).isPresent()) {
            throw new RuntimeException("用户已在该游戏中");
        }

        // 检查玩家索引是否可用
        if (playerRepository.findByGame_IdAndPlayerIndex(gameId, playerIndex).isPresent()) {
            throw new RuntimeException("该位置已有玩家");
        }

        Player player = new Player();
        player.setGame(game);
        player.setUser(user);
        player.setIsAi(false);
        player.setPlayerIndex(playerIndex);
        player.setHp(3);
        player.setIsAlive(true);
        player.setHandCards("[]");

        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player leaveGame(Long playerId) {
        Player player = getById(playerId);
        playerRepository.delete(player);
        return player;
    }

    @Override
    @Transactional
    public Player updateHealth(Long playerId, Integer newHp) {
        Player player = getById(playerId);
        player.setHp(newHp);

        if (newHp <= 0) {
            player.setIsAlive(false);
        }

        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player updateHandCards(Long playerId, List<Integer> cardIds) {
        Player player = getById(playerId);
        try {
            String handCardsJson = objectMapper.writeValueAsString(cardIds);
            player.setHandCards(handCardsJson);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("手牌序列化失败", e);
        }
        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player addCardToHand(Long playerId, Integer cardId) {
        Player player = getById(playerId);
        try {
            List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                    new TypeReference<List<Integer>>() {});
            handCards.add(cardId);
            player.setHandCards(objectMapper.writeValueAsString(handCards));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("手牌操作失败", e);
        }
        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player removeCardFromHand(Long playerId, Integer cardId) {
        Player player = getById(playerId);
        try {
            List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                    new TypeReference<List<Integer>>() {});
            handCards.remove(cardId);
            player.setHandCards(objectMapper.writeValueAsString(handCards));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("手牌操作失败", e);
        }
        return playerRepository.save(player);
    }

    @Override
    @Transactional
    public Player revivePlayer(Long playerId) {
        Player player = getById(playerId);
        player.setIsAlive(true);
        player.setHp(3); // 复活后恢复默认生命值
        return playerRepository.save(player);
    }

    @Override
    public List<Player> getPlayersByGameId(Long gameId) {
        return playerRepository.findByGame_Id(gameId);
    }

    @Override
    public List<Player> getPlayersByUserId(Long userId) {
        // 这个方法需要自定义查询，当前Repository不支持
        // 简化实现：获取所有玩家然后过滤
        List<Player> allPlayers = getAll();
        List<Player> result = new ArrayList<>();
        for (Player player : allPlayers) {
            if (player.getUser() != null && player.getUser().getId().equals(userId)) {
                result.add(player);
            }
        }
        return result;
    }

    @Override
    public Player getPlayerByGameAndUser(Long gameId, Long userId) {
        return playerRepository.findByGame_IdAndUser_Id(gameId, userId)
                .orElseThrow(() -> new RuntimeException("玩家不存在"));
    }

    @Override
    public List<Player> getAlivePlayersByGameId(Long gameId) {
        return playerRepository.findByGame_IdAndIsAliveTrue(gameId);
    }

    @Override
    public List<Player> getAiPlayersByGameId(Long gameId) {
        List<Player> players = playerRepository.findByGame_Id(gameId);
        List<Player> aiPlayers = new ArrayList<>();
        for (Player player : players) {
            if (Boolean.TRUE.equals(player.getIsAi())) {
                aiPlayers.add(player);
            }
        }
        return aiPlayers;
    }

    @Override
    public List<Player> getHumanPlayersByGameId(Long gameId) {
        List<Player> players = playerRepository.findByGame_Id(gameId);
        List<Player> humanPlayers = new ArrayList<>();
        for (Player player : players) {
            if (!Boolean.TRUE.equals(player.getIsAi())) {
                humanPlayers.add(player);
            }
        }
        return humanPlayers;
    }

    @Override
    public Integer countPlayersByGameId(Long gameId) {
        return playerRepository.findByGame_Id(gameId).size();
    }

    @Override
    public Integer countAlivePlayersByGameId(Long gameId) {
        return getAlivePlayersByGameId(gameId).size();
    }

    @Override
    public Integer countHumanPlayersByGameId(Long gameId) {
        return getHumanPlayersByGameId(gameId).size();
    }

    @Override
    public Integer countAiPlayersByGameId(Long gameId) {
        return getAiPlayersByGameId(gameId).size();
    }
}