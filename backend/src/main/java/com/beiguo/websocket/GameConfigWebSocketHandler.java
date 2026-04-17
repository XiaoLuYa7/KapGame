package com.beiguo.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class GameConfigWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(GameConfigWebSocketHandler.class);

    // 保存所有连接的客户端会话
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        logger.info("WebSocket 连接已建立: sessionId={}, 当前连接数={}",
                    session.getId(), sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        logger.info("WebSocket 连接已关闭: sessionId={}, 原因={}, 当前连接数={}",
                    session.getId(), status, sessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        logger.error("WebSocket 传输错误: sessionId={}", session.getId(), exception);
        sessions.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 可以处理客户端发送的消息（如心跳检测）
        String payload = message.getPayload();
        logger.debug("收到 WebSocket 消息: sessionId={}, content={}", session.getId(), payload);

        // 心跳响应
        if ("ping".equals(payload)) {
            try {
                session.sendMessage(new TextMessage("pong"));
            } catch (IOException e) {
                logger.error("发送心跳响应失败: sessionId={}", session.getId(), e);
            }
        }
    }

    /**
     * 广播消息给所有连接的客户端
     */
    public void broadcast(String message) {
        logger.info("广播 WebSocket 消息: content={}, 连接数={}", message, sessions.size());
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    logger.error("广播消息失败: sessionId={}", session.getId(), e);
                }
            }
        }
    }

    /**
     * 推送配置更新消息
     * @param configType 配置类型 (如 "activity", "card", "game")
     * @param action 操作类型 (如 "publish", "update", "delete")
     * @param data 配置数据
     */
    public void pushConfigUpdate(String configType, String action, Object data) {
        ConfigUpdateMessage message = new ConfigUpdateMessage(configType, action, data);
        broadcast(message.toJson());
    }

    /**
     * 获取当前连接数
     */
    public int getConnectionCount() {
        return sessions.size();
    }

    /**
     * 配置更新消息体
     */
    public static class ConfigUpdateMessage {
        private String type = "CONFIG_UPDATE";
        private String configType;
        private String action;
        private Object data;
        private long timestamp;

        public ConfigUpdateMessage(String configType, String action, Object data) {
            this.configType = configType;
            this.action = action;
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        public String toJson() {
            return String.format(
                "{\"type\":\"CONFIG_UPDATE\",\"configType\":\"%s\",\"action\":\"%s\",\"data\":%s,\"timestamp\":%d}",
                configType, action, data != null ? data.toString() : "null", timestamp
            );
        }
    }
}
