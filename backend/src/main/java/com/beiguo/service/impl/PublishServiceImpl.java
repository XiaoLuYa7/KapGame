package com.beiguo.service.impl;

import com.beiguo.entity.*;
import com.beiguo.repository.*;
import com.beiguo.service.PublishService;
import com.beiguo.websocket.GameConfigWebSocketHandler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PublishServiceImpl implements PublishService {
    @Autowired
    private CardConfigRepository cardConfigRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private PublishHistoryRepository publishHistoryRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private GameConfigWebSocketHandler gameConfigWebSocketHandler;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 发布当前配置
     */
    @Override
    @Transactional
    public PublishHistory publishConfig(String publishedBy, Long adminId, String description) {
        // 收集激活的卡牌
        List<CardConfig> activeCards = cardConfigRepository.findAll().stream()
                .filter(card -> Boolean.TRUE.equals(card.getIsActive()))
                .collect(Collectors.toList());

        // 收集激活的活动
        List<Activity> activeActivities = activityRepository.findAll().stream()
                .filter(activity -> "ACTIVE".equals(activity.getStatus()))
                .collect(Collectors.toList());

        // 收集公开的系统配置
        List<SystemConfig> publicConfigs = systemConfigRepository.findByIsPublic(true);

        // 构建配置数据
        Map<String, Object> configData = new HashMap<>();
        configData.put("cards", activeCards);
        configData.put("activities", activeActivities);
        configData.put("systemConfigs", publicConfigs);
        configData.put("publishTime", LocalDateTime.now().toString());

        // 生成版本号（使用时间戳）
        String version = generateVersion();

        // 转换为JSON
        String configJson;
        try {
            configJson = objectMapper.writeValueAsString(configData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("配置JSON序列化失败", e);
        }

        // 保存发布历史
        PublishHistory history = new PublishHistory();
        history.setVersion(version);
        history.setPublishTime(LocalDateTime.now());
        history.setPublishedBy(publishedBy);
        history.setAdminId(adminId);
        history.setDescription(description);
        history.setConfigData(configJson);
        history.setCardCount(activeCards.size());
        history.setActivityCount(activeActivities.size());
        history.setConfigCount(publicConfigs.size());

        PublishHistory savedHistory = publishHistoryRepository.save(history);

        // 通过WebSocket广播配置更新
        gameConfigWebSocketHandler.pushConfigUpdate("config", "publish", Map.of(
            "version", version,
            "cardCount", activeCards.size(),
            "activityCount", activeActivities.size(),
            "configCount", publicConfigs.size()
        ));

        return savedHistory;
    }

    /**
     * 获取最新发布的配置
     */
    @Override
    public PublishHistory getLatestPublishedConfig() {
        return publishHistoryRepository.findTopByOrderByPublishTimeDesc()
                .orElseThrow(() -> new RuntimeException("暂无发布记录"));
    }

    /**
     * 获取所有发布历史
     */
    @Override
    public List<PublishHistory> getPublishHistory() {
        return publishHistoryRepository.findAllByOrderByPublishTimeDesc();
    }

    /**
     * 生成版本号：yyyyMMddHHmmss
     */
    private String generateVersion() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    /**
     * 获取最新配置数据（供小程序使用）
     */
    @Override
    public Map<String, Object> getPublishedConfigData() {
        PublishHistory latest = getLatestPublishedConfig();
        try {
            return objectMapper.readValue(latest.getConfigData(), Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("配置JSON解析失败", e);
        }
    }

    /**
     * 获取当前版本号
     */
    @Override
    public String getCurrentVersion() {
        try {
            PublishHistory latest = publishHistoryRepository.findTopByOrderByPublishTimeDesc()
                    .orElse(null);
            return latest != null ? latest.getVersion() : "0";
        } catch (Exception e) {
            return "0";
        }
    }

    // ========== 新增 CRUD 方法 ==========

    @Override
    @Transactional
    public PublishHistory create(PublishHistory publishHistory) {
        // 验证必要字段
        if (publishHistory.getVersion() == null || publishHistory.getVersion().trim().isEmpty()) {
            publishHistory.setVersion(generateVersion());
        }
        if (publishHistory.getPublishTime() == null) {
            publishHistory.setPublishTime(LocalDateTime.now());
        }
        // 保存
        return publishHistoryRepository.save(publishHistory);
    }

    @Override
    @Transactional
    public PublishHistory update(Long id, PublishHistory publishHistory) {
        PublishHistory existing = getById(id);
        // 更新允许修改的字段
        if (publishHistory.getVersion() != null) {
            existing.setVersion(publishHistory.getVersion());
        }
        if (publishHistory.getPublishedBy() != null) {
            existing.setPublishedBy(publishHistory.getPublishedBy());
        }
        if (publishHistory.getAdminId() != null) {
            existing.setAdminId(publishHistory.getAdminId());
        }
        if (publishHistory.getDescription() != null) {
            existing.setDescription(publishHistory.getDescription());
        }
        if (publishHistory.getConfigData() != null) {
            existing.setConfigData(publishHistory.getConfigData());
        }
        if (publishHistory.getCardCount() != null) {
            existing.setCardCount(publishHistory.getCardCount());
        }
        if (publishHistory.getActivityCount() != null) {
            existing.setActivityCount(publishHistory.getActivityCount());
        }
        if (publishHistory.getConfigCount() != null) {
            existing.setConfigCount(publishHistory.getConfigCount());
        }
        // 更新时间可以自动更新，这里保持不变
        return publishHistoryRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PublishHistory history = getById(id);
        publishHistoryRepository.delete(history);
    }

    @Override
    public PublishHistory getById(Long id) {
        return publishHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("发布历史不存在"));
    }

    @Override
    public List<PublishHistory> getAll() {
        return publishHistoryRepository.findAll();
    }

    @Override
    public Page<PublishHistory> getPage(Pageable pageable) {
        return publishHistoryRepository.findAll(pageable);
    }

    @Override
    public List<PublishHistory> getByAdminId(Long adminId) {
        return publishHistoryRepository.findByAdminId(adminId);
    }

    @Override
    public List<PublishHistory> getByVersion(String version) {
        return publishHistoryRepository.findByVersion(version);
    }

    @Override
    public List<PublishHistory> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return publishHistoryRepository.findByPublishTimeBetween(start, end);
    }

    @Override
    public Integer countAll() {
        return (int) publishHistoryRepository.count();
    }

    @Override
    public Integer countByAdminId(Long adminId) {
        return publishHistoryRepository.countByAdminId(adminId);
    }

    @Override
    public Map<String, Integer> getPublishStatsByMonth() {
        // 简单实现：按月份统计发布数量
        List<PublishHistory> all = publishHistoryRepository.findAll();
        Map<String, Integer> stats = new HashMap<>();
        for (PublishHistory history : all) {
            String month = history.getPublishTime().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            stats.put(month, stats.getOrDefault(month, 0) + 1);
        }
        return stats;
    }
}
