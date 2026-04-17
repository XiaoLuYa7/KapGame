package com.beiguo.service.impl;

import com.beiguo.dto.GameStartResponse;
import com.beiguo.dto.GameStateResponse;
import com.beiguo.engine.GameContext;
import com.beiguo.engine.GameEngine;
import com.beiguo.entity.Game;
import com.beiguo.entity.Player;
import com.beiguo.entity.User;
import com.beiguo.repository.GameRepository;
import com.beiguo.repository.PlayerRepository;
import com.beiguo.service.GameService;
import com.beiguo.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class GameServiceImpl implements GameService {
    private static final Logger logger = LoggerFactory.getLogger(GameServiceImpl.class);

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GameEngine gameEngine;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public GameStartResponse startGame() {
        User currentUser = userService.getCurrentUser();
        logger.info("开始创建新游戏，当前用户ID: {}, 用户名: {}", currentUser.getId(), currentUser.getUsername());

        // 创建游戏
        Game game = new Game();
        game.setStatus("WAITING");
        game = gameRepository.save(game);
        logger.info("游戏创建成功，游戏ID: {}, 状态: {}", game.getId(), game.getStatus());

        // 创建玩家（当前用户）
        Player humanPlayer = new Player();
        humanPlayer.setGame(game);
        humanPlayer.setUser(currentUser);
        humanPlayer.setIsAi(false);
        humanPlayer.setPlayerIndex(0);
        humanPlayer.setHp(3);
        humanPlayer.setIsAlive(true);
        humanPlayer.setHandCards("[]");
        playerRepository.save(humanPlayer);
        logger.debug("人类玩家创建成功，玩家ID: {}, 用户ID: {}, 玩家索引: {}",
            humanPlayer.getId(), currentUser.getId(), humanPlayer.getPlayerIndex());

        // 创建AI玩家（2-3个）
        int aiCount = new Random().nextInt(2) + 2; // 2-3个AI
        List<Player> aiPlayers = new ArrayList<>();
        for (int i = 1; i <= aiCount; i++) {
            Player aiPlayer = new Player();
            aiPlayer.setGame(game);
            aiPlayer.setUser(null);
            aiPlayer.setIsAi(true);
            aiPlayer.setPlayerIndex(i);
            aiPlayer.setHp(3);
            aiPlayer.setIsAlive(true);
            aiPlayer.setHandCards("[]");
            playerRepository.save(aiPlayer);
            aiPlayers.add(aiPlayer);
        }
        logger.info("创建了 {} 个AI玩家", aiCount);

        // 添加人类玩家到列表
        List<Player> allPlayers = new ArrayList<>();
        allPlayers.add(humanPlayer);
        allPlayers.addAll(aiPlayers);

        // 初始化游戏
        gameEngine.initializeGame(game, allPlayers);
        logger.debug("游戏初始化完成，总玩家数: {}", allPlayers.size());

        // 更新玩家手牌
        for (Player player : allPlayers) {
            playerRepository.save(player);
        }

        game.setStatus("PLAYING");
        gameRepository.save(game);

        logger.info("游戏启动完成，游戏ID: {}, 总玩家数: {}", game.getId(), allPlayers.size());
        return new GameStartResponse(game.getId(), allPlayers.size(), 0);
    }

    @Override
    public GameStateResponse getGameState(Long gameId) {
        logger.debug("获取游戏状态，游戏ID: {}", gameId);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    logger.error("游戏不存在，游戏ID: {}", gameId);
                    return new RuntimeException("游戏不存在");
                });

        List<Player> players = playerRepository.findByGame_Id(gameId);
        logger.debug("查询到 {} 个玩家参与游戏", players.size());
        User currentUser = userService.getCurrentUser();
        Player currentPlayer = playerRepository.findByGame_IdAndUser_Id(gameId, currentUser.getId())
                .orElseThrow(() -> {
                    logger.error("用户不是该游戏的玩家，游戏ID: {}, 用户ID: {}", gameId, currentUser.getId());
                    return new RuntimeException("你不是该游戏的玩家");
                });
        logger.debug("当前玩家信息: 玩家ID: {}, 玩家索引: {}, 是否AI: {}",
            currentPlayer.getId(), currentPlayer.getPlayerIndex(), currentPlayer.getIsAi());

        GameStateResponse response = new GameStateResponse();
        response.setGameId(gameId);
        response.setStatus(game.getStatus());
        response.setCurrentTurn(game.getCurrentTurn());
        response.setYourPlayerIndex(currentPlayer.getPlayerIndex());

        // 构建玩家信息
        List<GameStateResponse.PlayerInfo> playerInfos = new ArrayList<>();
        for (Player player : players) {
            GameStateResponse.PlayerInfo info = new GameStateResponse.PlayerInfo();
            info.setPlayerIndex(player.getPlayerIndex());
            info.setIsAi(player.getIsAi());
            info.setHp(player.getHp());
            info.setIsAlive(player.getIsAlive());

            if (player.getUser() != null) {
                info.setUsername(player.getUser().getUsername());
            } else {
                info.setUsername("AI玩家" + player.getPlayerIndex());
            }

            try {
                List<Integer> handCards = objectMapper.readValue(player.getHandCards(),
                        new TypeReference<List<Integer>>() {});
                info.setHandCount(handCards.size());
            } catch (Exception e) {
                info.setHandCount(0);
            }

            playerInfos.add(info);
        }
        response.setPlayers(playerInfos);

        // 设置当前玩家手牌
        try {
            List<Integer> handCards = objectMapper.readValue(currentPlayer.getHandCards(),
                    new TypeReference<List<Integer>>() {});
            response.setHandCards(handCards);
        } catch (Exception e) {
            response.setHandCards(new ArrayList<>());
        }

        // 牌堆剩余数量
        try {
            List<Integer> deck = objectMapper.readValue(game.getDeckCards(),
                    new TypeReference<List<Integer>>() {});
            response.setDeckRemaining(deck.size());
        } catch (Exception e) {
            response.setDeckRemaining(0);
        }

        // 弃牌堆
        try {
            List<Integer> discardPile = objectMapper.readValue(game.getDiscardPile(),
                    new TypeReference<List<Integer>>() {});
            response.setDiscardPile(discardPile);
        } catch (Exception e) {
            response.setDiscardPile(new ArrayList<>());
        }

        // 是否轮到当前玩家
        response.setIsYourTurn(game.getCurrentTurn() == currentPlayer.getPlayerIndex());

        logger.debug("游戏状态查询完成，游戏ID: {}, 状态: {}, 当前回合: {}",
            gameId, game.getStatus(), game.getCurrentTurn());
        return response;
    }

    @Override
    @Transactional
    public GameContext playCard(Long gameId, Integer cardId, Integer targetPlayerIndex) {
        logger.info("玩家出牌，游戏ID: {}, 卡牌ID: {}, 目标玩家索引: {}",
            gameId, cardId, targetPlayerIndex);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    logger.error("游戏不存在，游戏ID: {}", gameId);
                    return new RuntimeException("游戏不存在");
                });

        User currentUser = userService.getCurrentUser();
        Player currentPlayer = playerRepository.findByGame_IdAndUser_Id(gameId, currentUser.getId())
                .orElseThrow(() -> {
                    logger.error("用户不是该游戏的玩家，游戏ID: {}, 用户ID: {}", gameId, currentUser.getId());
                    return new RuntimeException("你不是该游戏的玩家");
                });
        logger.debug("当前玩家出牌，玩家ID: {}, 玩家索引: {}", currentPlayer.getId(), currentPlayer.getPlayerIndex());

        // 检查是否轮到当前玩家
        if (game.getCurrentTurn() != currentPlayer.getPlayerIndex()) {
            throw new RuntimeException("还没轮到你的回合");
        }

        // 检查手牌是否有这张卡
        try {
            List<Integer> handCards = objectMapper.readValue(currentPlayer.getHandCards(),
                    new TypeReference<List<Integer>>() {});
            logger.debug("玩家手牌数量: {}, 检查是否包含卡牌ID: {}", handCards.size(), cardId);
            if (!handCards.contains(cardId)) {
                logger.warn("玩家没有卡牌ID: {}，手牌内容: {}", cardId, handCards);
                throw new RuntimeException("你没有这张卡牌");
            }
            logger.debug("手牌检查通过，玩家拥有卡牌ID: {}", cardId);
        } catch (Exception e) {
            logger.error("读取手牌失败，玩家ID: {}, 手牌数据: {}", currentPlayer.getId(), currentPlayer.getHandCards(), e);
            throw new RuntimeException("读取手牌失败");
        }

        // 执行卡牌效果
        logger.debug("开始执行卡牌效果，卡牌ID: {}, 目标玩家索引: {}", cardId, targetPlayerIndex);
        GameContext context = gameEngine.playCard(game, currentPlayer, cardId, targetPlayerIndex);
        logger.info("卡牌效果执行{}，消息: {}", context.isSuccess() ? "成功" : "失败", context.getMessage());

        if (context.isSuccess()) {
            // 保存更新
            playerRepository.save(currentPlayer);
            gameRepository.save(game);
            logger.debug("玩家和游戏状态已保存，玩家ID: {}, 游戏ID: {}", currentPlayer.getId(), game.getId());

            // 检查游戏是否结束
            List<Player> players = playerRepository.findByGame_Id(gameId);
            Player winner = gameEngine.checkGameOver(players);
            if (winner != null) {
                logger.info("游戏结束，赢家: {} (玩家ID: {}, 是否AI: {})",
                    winner.getUser() != null ? winner.getUser().getUsername() : "AI玩家",
                    winner.getId(), winner.getIsAi());
                game.setStatus("FINISHED");
                gameRepository.save(game);
                context.setMessage("游戏结束! " +
                    (winner.getUser() != null ? winner.getUser().getUsername() : "AI玩家") + "获胜!");
            } else {
                // 结束回合
                gameEngine.endTurn(game, players);
                gameRepository.save(game);

                // AI回合
                aiPlayTurn(gameId);
            }
        }

        return context;
    }

    @Override
    @Transactional
    public GameContext drawCard(Long gameId) {
        logger.info("玩家抽牌，游戏ID: {}", gameId);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    logger.error("游戏不存在，游戏ID: {}", gameId);
                    return new RuntimeException("游戏不存在");
                });

        User currentUser = userService.getCurrentUser();
        Player currentPlayer = playerRepository.findByGame_IdAndUser_Id(gameId, currentUser.getId())
                .orElseThrow(() -> {
                    logger.error("用户不是该游戏的玩家，游戏ID: {}, 用户ID: {}", gameId, currentUser.getId());
                    return new RuntimeException("你不是该游戏的玩家");
                });
        logger.debug("当前玩家抽牌，玩家ID: {}, 玩家索引: {}", currentPlayer.getId(), currentPlayer.getPlayerIndex());

        // 检查是否轮到当前玩家
        if (game.getCurrentTurn() != currentPlayer.getPlayerIndex()) {
            logger.warn("还没轮到玩家回合，当前回合: {}, 玩家索引: {}",
                game.getCurrentTurn(), currentPlayer.getPlayerIndex());
            throw new RuntimeException("还没轮到你的回合");
        }

        // 抽牌
        logger.debug("开始执行抽牌操作");
        GameContext context = gameEngine.drawCard(game, currentPlayer);
        logger.info("抽牌操作{}，消息: {}", context.isSuccess() ? "成功" : "失败", context.getMessage());

        if (context.isSuccess()) {
            // 保存更新
            playerRepository.save(currentPlayer);
            gameRepository.save(game);
            logger.debug("抽牌后状态已保存，玩家ID: {}, 游戏ID: {}", currentPlayer.getId(), game.getId());

            // 检查游戏是否结束
            List<Player> players = playerRepository.findByGame_Id(gameId);
            Player winner = gameEngine.checkGameOver(players);
            if (winner != null) {
                logger.info("游戏结束，赢家: {} (玩家ID: {}, 是否AI: {})",
                    winner.getUser() != null ? winner.getUser().getUsername() : "AI玩家",
                    winner.getId(), winner.getIsAi());
                game.setStatus("FINISHED");
                gameRepository.save(game);
                context.setMessage("游戏结束! " +
                    (winner.getUser() != null ? winner.getUser().getUsername() : "AI玩家") + "获胜!");
            } else {
                // 结束回合
                gameEngine.endTurn(game, players);
                gameRepository.save(game);

                // AI回合
                aiPlayTurn(gameId);
            }
        }

        return context;
    }

    @Override
    @Transactional
    public void aiPlayTurn(Long gameId) {
        logger.debug("开始AI回合，游戏ID: {}", gameId);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> {
                    logger.error("游戏不存在，游戏ID: {}", gameId);
                    return new RuntimeException("游戏不存在");
                });

        List<Player> players = playerRepository.findByGame_Id(gameId);
        logger.debug("查询到 {} 个玩家，当前回合: {}", players.size(), game.getCurrentTurn());
        Player currentPlayer = players.stream()
                .filter(p -> p.getPlayerIndex() == game.getCurrentTurn())
                .findFirst()
                .orElseThrow(() -> {
                    logger.error("找不到当前玩家，游戏ID: {}, 当前回合: {}", gameId, game.getCurrentTurn());
                    return new RuntimeException("找不到当前玩家");
                });

        // 如果不是AI玩家，直接返回
        logger.debug("当前玩家是否是AI: {}", currentPlayer.getIsAi());
        if (!currentPlayer.getIsAi()) {
            logger.debug("当前玩家不是AI，跳过AI回合");
            return;
        }

        // 模拟AI思考延迟
        try {
            Thread.sleep(1000 + new Random().nextInt(1000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // AI策略：随机出牌或抽牌
        try {
            List<Integer> handCards = objectMapper.readValue(currentPlayer.getHandCards(),
                    new TypeReference<List<Integer>>() {});
            logger.debug("AI玩家手牌数量: {}", handCards.size());

            if (!handCards.isEmpty() && new Random().nextBoolean()) {
                logger.debug("AI选择出牌，手牌数量: {}", handCards.size());
                // 随机出一张牌
                Integer cardId = handCards.get(new Random().nextInt(handCards.size()));
                // 随机选择一个目标玩家（除了自己）
                List<Player> otherPlayers = players.stream()
                        .filter(p -> p.getPlayerIndex() != currentPlayer.getPlayerIndex() && p.getIsAlive())
                        .toList();
                Integer targetPlayerIndex = otherPlayers.isEmpty() ? null :
                        otherPlayers.get(new Random().nextInt(otherPlayers.size())).getPlayerIndex();

                GameContext context = gameEngine.playCard(game, currentPlayer, cardId, targetPlayerIndex);
                if (context.isSuccess()) {
                    playerRepository.save(currentPlayer);
                    gameRepository.save(game);

                    // 检查游戏是否结束
                    Player winner = gameEngine.checkGameOver(players);
                    if (winner != null) {
                        game.setStatus("FINISHED");
                        gameRepository.save(game);
                    } else {
                        gameEngine.endTurn(game, players);
                        gameRepository.save(game);

                        // 递归处理下一个AI回合
                        aiPlayTurn(gameId);
                    }
                } else {
                    // 如果出牌失败，改为抽牌
                    GameContext drawContext = gameEngine.drawCard(game, currentPlayer);
                    if (drawContext.isSuccess()) {
                        playerRepository.save(currentPlayer);
                        gameRepository.save(game);

                        Player winner = gameEngine.checkGameOver(players);
                        if (winner != null) {
                            game.setStatus("FINISHED");
                            gameRepository.save(game);
                        } else {
                            gameEngine.endTurn(game, players);
                            gameRepository.save(game);
                            aiPlayTurn(gameId);
                        }
                    }
                }
            } else {
                logger.debug("AI选择抽牌");
                // 抽牌
                GameContext context = gameEngine.drawCard(game, currentPlayer);
                if (context.isSuccess()) {
                    playerRepository.save(currentPlayer);
                    gameRepository.save(game);

                    Player winner = gameEngine.checkGameOver(players);
                    if (winner != null) {
                        game.setStatus("FINISHED");
                        gameRepository.save(game);
                    } else {
                        gameEngine.endTurn(game, players);
                        gameRepository.save(game);
                        aiPlayTurn(gameId);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("AI回合执行异常，游戏ID: {}, 玩家ID: {}", gameId, currentPlayer.getId(), e);
            // AI出错，直接结束回合
            gameEngine.endTurn(game, players);
            gameRepository.save(game);
            aiPlayTurn(gameId);
        }
        logger.debug("AI回合执行完成，游戏ID: {}", gameId);
    }

    // ========== CRUD方法实现 ==========

    @Override
    @Transactional
    public Game create(Game game) {
        // 验证必要字段
        if (game.getStatus() == null || game.getStatus().trim().isEmpty()) {
            game.setStatus("WAITING");
        }
        if (game.getGameMode() == null || game.getGameMode().trim().isEmpty()) {
            game.setGameMode("STANDARD");
        }

        // 设置创建时间
        game.setCreateTime(LocalDateTime.now());

        // 保存游戏
        return gameRepository.save(game);
    }

    @Override
    @Transactional
    public Game update(Long id, Game game) {
        Game existingGame = getById(id);

        // 更新字段
        if (game.getStatus() != null && !game.getStatus().trim().isEmpty()) {
            existingGame.setStatus(game.getStatus());
        }
        if (game.getGameMode() != null && !game.getGameMode().trim().isEmpty()) {
            existingGame.setGameMode(game.getGameMode());
        }
        if (game.getWinner() != null) {
            existingGame.setWinner(game.getWinner());
        }
        if (game.getCurrentPlayerIndex() != null) {
            existingGame.setCurrentPlayerIndex(game.getCurrentPlayerIndex());
        }
        if (game.getRoundCount() != null) {
            existingGame.setRoundCount(game.getRoundCount());
        }
        if (game.getMaxPlayers() != null) {
            existingGame.setMaxPlayers(game.getMaxPlayers());
        }

        // 更新修改时间
        existingGame.setUpdateTime(LocalDateTime.now());

        return gameRepository.save(existingGame);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Game game = getById(id);
        gameRepository.delete(game);
    }

    @Override
    public Game getById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("游戏不存在，ID: " + id));
    }

    @Override
    public List<Game> getAll() {
        return gameRepository.findAllByOrderByCreateTimeDesc();
    }

    @Override
    public Page<Game> getPage(Pageable pageable) {
        return gameRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public Game startNewGame(Long userId, String gameMode) {
        User user = userService.getUserById(userId);
        Game game = new Game();
        game.setStatus("WAITING");
        game.setGameMode(gameMode != null ? gameMode : "STANDARD");
        game.setCreateTime(LocalDateTime.now());

        Game savedGame = gameRepository.save(game);

        // 添加用户作为玩家
        Player player = new Player();
        player.setGame(savedGame);
        player.setUser(user);
        player.setPlayerIndex(0);
        player.setIsAi(false);
        player.setHp(20);
        player.setHandCards("[]");
        playerRepository.save(player);

        return savedGame;
    }

    @Override
    @Transactional
    public Game endGame(Long gameId, String winner) {
        Game game = getById(gameId);
        game.setStatus("FINISHED");
        game.setWinner(winner);
        game.setUpdateTime(LocalDateTime.now());
        return gameRepository.save(game);
    }

    @Override
    @Transactional
    public Game pauseGame(Long gameId) {
        Game game = getById(gameId);
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new RuntimeException("只有活跃游戏可以暂停");
        }
        game.setStatus("PAUSED");
        game.setUpdateTime(LocalDateTime.now());
        return gameRepository.save(game);
    }

    @Override
    @Transactional
    public Game resumeGame(Long gameId) {
        Game game = getById(gameId);
        if (!"PAUSED".equals(game.getStatus())) {
            throw new RuntimeException("只有暂停游戏可以恢复");
        }
        game.setStatus("ACTIVE");
        game.setUpdateTime(LocalDateTime.now());
        return gameRepository.save(game);
    }

    @Override
    @Transactional
    public Game addPlayerToGame(Long gameId, Long userId, boolean isAi) {
        Game game = getById(gameId);
        if (!"WAITING".equals(game.getStatus()) && !"ACTIVE".equals(game.getStatus())) {
            throw new RuntimeException("游戏不在等待或活跃状态，无法添加玩家");
        }

        // 检查是否已满
        List<Player> players = playerRepository.findByGame_Id(gameId);
        if (players.size() >= game.getMaxPlayers()) {
            throw new RuntimeException("游戏玩家已满");
        }

        // 检查用户是否已在游戏中
        boolean userAlreadyInGame = players.stream()
                .anyMatch(p -> p.getUser() != null && userId.equals(p.getUser().getId()));
        if (userAlreadyInGame) {
            throw new RuntimeException("用户已在游戏中");
        }

        User user = isAi ? null : userService.getUserById(userId);
        Player player = new Player();
        player.setGame(game);
        player.setUser(user);
        player.setPlayerIndex(players.size());
        player.setIsAi(isAi);
        player.setHp(20);
        player.setHandCards("[]");
        playerRepository.save(player);

        // 如果游戏在等待状态且有足够玩家，开始游戏
        if ("WAITING".equals(game.getStatus()) && players.size() + 1 >= 2) {
            game.setStatus("ACTIVE");
            gameRepository.save(game);
        }

        return game;
    }

    @Override
    @Transactional
    public Game removePlayerFromGame(Long gameId, Long playerId) {
        Game game = getById(gameId);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("玩家不存在，ID: " + playerId));

        if (!player.getGame().getId().equals(gameId)) {
            throw new RuntimeException("玩家不属于该游戏");
        }

        playerRepository.delete(player);

        // 检查是否还有玩家
        List<Player> remainingPlayers = playerRepository.findByGame_Id(gameId);
        if (remainingPlayers.isEmpty()) {
            // 没有玩家了，结束游戏
            game.setStatus("CANCELLED");
            gameRepository.save(game);
        }

        return game;
    }

    @Override
    public List<Game> getGamesByUserId(Long userId) {
        return gameRepository.findGamesByUserId(userId);
    }

    @Override
    public List<Game> getActiveGames() {
        return gameRepository.findByStatus("ACTIVE");
    }

    @Override
    public List<Game> getCompletedGames() {
        return gameRepository.findByStatus("FINISHED");
    }

    @Override
    public List<Game> getGamesByStatus(String status) {
        return gameRepository.findByStatus(status);
    }

    @Override
    public List<Game> getGamesByMode(String gameMode) {
        return gameRepository.findByGameMode(gameMode);
    }

    @Override
    public boolean isGameActive(Long gameId) {
        Game game = getById(gameId);
        return "ACTIVE".equals(game.getStatus());
    }

    @Override
    public boolean isGameCompleted(Long gameId) {
        Game game = getById(gameId);
        return "FINISHED".equals(game.getStatus());
    }

    @Override
    public boolean isPlayerInGame(Long gameId, Long userId) {
        List<Player> players = playerRepository.findByGame_Id(gameId);
        return players.stream()
                .anyMatch(p -> p.getUser() != null && userId.equals(p.getUser().getId()));
    }

    @Override
    public Integer countGamesByUserId(Long userId) {
        return gameRepository.countGamesByUserId(userId);
    }

    @Override
    public Integer countActiveGames() {
        return gameRepository.countByStatus("ACTIVE");
    }

    @Override
    public Integer countCompletedGames() {
        return gameRepository.countByStatus("FINISHED");
    }

    @Override
    public Integer countGamesByMode(String gameMode) {
        return gameRepository.countByGameMode(gameMode);
    }
}