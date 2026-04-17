package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.GameStartResponse;
import com.beiguo.dto.GameStateResponse;
import com.beiguo.dto.PlayCardRequest;
import com.beiguo.engine.GameContext;
import com.beiguo.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
public class GameController {
    @Autowired
    private GameService gameService;

    @PostMapping("/start")
    public ApiResponse<GameStartResponse> startGame() {
        try {
            GameStartResponse response = gameService.startGame();
            return ApiResponse.success("游戏开始", response);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{gameId}/state")
    public ApiResponse<GameStateResponse> getGameState(@PathVariable Long gameId) {
        try {
            GameStateResponse response = gameService.getGameState(gameId);
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{gameId}/play")
    public ApiResponse<GameContext> playCard(@PathVariable Long gameId,
                                             @RequestBody PlayCardRequest request) {
        try {
            GameContext context = gameService.playCard(gameId, request.getCardId(), request.getTargetPlayerIndex());
            return ApiResponse.success(context.getMessage(), context);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{gameId}/draw")
    public ApiResponse<GameContext> drawCard(@PathVariable Long gameId) {
        try {
            GameContext context = gameService.drawCard(gameId);
            return ApiResponse.success(context.getMessage(), context);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}