package com.beiguo.service;

import com.beiguo.entity.*;
import com.beiguo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PublishServiceTest {

    @Autowired
    private PublishService publishService;

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

    @BeforeEach
    void setUp() {
        // 清理测试数据
        publishHistoryRepository.deleteAll();
        cardConfigRepository.deleteAll();
        activityRepository.deleteAll();
        systemConfigRepository.deleteAll();

        // 创建测试卡牌数据
        CardConfig card1 = new CardConfig();
        card1.setName("Test Card 1");
        card1.setType("ATTACK");
        card1.setRarity("COMMON");
        card1.setIsActive(true);
        card1.setEffects("[{\"type\":\"DAMAGE\",\"amount\":5}]");
        card1.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card1);

        CardConfig card2 = new CardConfig();
        card2.setName("Test Card 2");
        card2.setType("DEFENSE");
        card2.setRarity("RARE");
        card2.setIsActive(false); // 非激活状态
        card2.setEffects("[{\"type\":\"HEAL\",\"amount\":3}]");
        card2.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card2);

        CardConfig card3 = new CardConfig();
        card3.setName("Test Card 3");
        card3.setType("UTILITY");
        card3.setRarity("EPIC");
        card3.setIsActive(true);
        card3.setEffects("[{\"type\":\"DRAW\",\"count\":2}]");
        card3.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card3);

        // 创建测试活动数据
        Activity activity1 = new Activity();
        activity1.setTitle("Test Activity 1");
        activity1.setActivityType("DAILY_LOGIN");
        activity1.setStatus("ACTIVE");
        activity1.setStartTime(LocalDateTime.now().minusDays(1));
        activity1.setEndTime(LocalDateTime.now().plusDays(30));
        activity1.setCreateTime(LocalDateTime.now());
        activityRepository.save(activity1);

        Activity activity2 = new Activity();
        activity2.setTitle("Test Activity 2");
        activity2.setActivityType("EVENT");
        activity2.setStatus("INACTIVE"); // 非激活状态
        activity2.setStartTime(LocalDateTime.now().minusDays(1));
        activity2.setEndTime(LocalDateTime.now().plusDays(10));
        activity2.setCreateTime(LocalDateTime.now());
        activityRepository.save(activity2);

        // 创建测试系统配置数据
        SystemConfig config1 = new SystemConfig();
        config1.setConfigKey("public.key1");
        config1.setConfigValue("public value 1");
        config1.setDescription("Public config 1");
        config1.setIsPublic(true);
        config1.setCreateTime(LocalDateTime.now());
        systemConfigRepository.save(config1);

        SystemConfig config2 = new SystemConfig();
        config2.setConfigKey("private.key2");
        config2.setConfigValue("private value 2");
        config2.setDescription("Private config 2");
        config2.setIsPublic(false); // 非公开配置
        config2.setCreateTime(LocalDateTime.now());
        systemConfigRepository.save(config2);
    }

    @Test
    void testPublishConfig() {
        // 执行发布
        PublishHistory history = publishService.publishConfig("测试管理员", 1L, "测试发布");

        // 验证发布历史记录
        assertNotNull(history);
        assertNotNull(history.getId());
        assertNotNull(history.getVersion());
        assertNotNull(history.getPublishTime());
        assertEquals("测试管理员", history.getPublishedBy());
        assertEquals(1L, history.getAdminId());
        assertEquals("测试发布", history.getDescription());

        // 验证计数
        assertEquals(2, history.getCardCount()); // 2张激活的卡牌
        assertEquals(1, history.getActivityCount()); // 1个激活的活动
        assertEquals(1, history.getConfigCount()); // 1个公开的系统配置

        // 验证配置数据JSON
        assertNotNull(history.getConfigData());
        assertFalse(history.getConfigData().isEmpty());

        // 验证数据库中的记录
        List<PublishHistory> allHistory = publishHistoryRepository.findAll();
        assertEquals(1, allHistory.size());
        assertEquals(history.getId(), allHistory.get(0).getId());
    }

    @Test
    void testGetLatestPublishedConfig() {
        // 先发布一次
        PublishHistory history1 = publishService.publishConfig("管理员1", 1L, "第一次发布");

        // 等待一小段时间，确保时间戳不同
        try { Thread.sleep(10); } catch (InterruptedException e) {}

        // 再发布一次
        PublishHistory history2 = publishService.publishConfig("管理员2", 2L, "第二次发布");

        // 获取最新发布
        PublishHistory latest = publishService.getLatestPublishedConfig();

        // 验证获取的是第二次发布
        assertNotNull(latest);
        assertEquals(history2.getId(), latest.getId());
        assertEquals("第二次发布", latest.getDescription());
    }

    @Test
    void testGetPublishedConfigData() {
        // 先发布配置
        publishService.publishConfig("测试管理员", 1L, "测试获取配置数据");

        // 获取配置数据
        Map<String, Object> configData = publishService.getPublishedConfigData();

        // 验证配置数据结构
        assertNotNull(configData);
        assertTrue(configData.containsKey("cards"));
        assertTrue(configData.containsKey("activities"));
        assertTrue(configData.containsKey("systemConfigs"));
        assertTrue(configData.containsKey("publishTime"));

        // 验证卡牌数量
        List<?> cards = (List<?>) configData.get("cards");
        assertEquals(2, cards.size()); // 2张激活的卡牌

        // 验证活动数量
        List<?> activities = (List<?>) configData.get("activities");
        assertEquals(1, activities.size()); // 1个激活的活动

        // 验证系统配置数量
        List<?> systemConfigs = (List<?>) configData.get("systemConfigs");
        assertEquals(1, systemConfigs.size()); // 1个公开的系统配置
    }

    @Test
    void testGetCurrentVersion() {
        // 初始版本应该为0（没有发布记录）
        String initialVersion = publishService.getCurrentVersion();
        assertEquals("0", initialVersion);

        // 发布配置
        PublishHistory history = publishService.publishConfig("测试管理员", 1L, "测试版本");

        // 获取当前版本
        String currentVersion = publishService.getCurrentVersion();
        assertNotNull(currentVersion);
        assertEquals(history.getVersion(), currentVersion);
        assertNotEquals("0", currentVersion);
    }

    @Test
    void testGetPublishHistory() {
        // 发布多次配置
        publishService.publishConfig("管理员1", 1L, "第一次发布");
        publishService.publishConfig("管理员2", 2L, "第二次发布");
        publishService.publishConfig("管理员3", 3L, "第三次发布");

        // 获取所有发布历史
        List<PublishHistory> history = publishService.getPublishHistory();

        // 验证历史记录数量和顺序（按时间倒序）
        assertEquals(3, history.size());
        assertEquals("第三次发布", history.get(0).getDescription());
        assertEquals("第二次发布", history.get(1).getDescription());
        assertEquals("第一次发布", history.get(2).getDescription());
    }

    @Test
    void testVersionGeneration() {
        // 发布配置
        PublishHistory history = publishService.publishConfig("测试管理员", 1L, "测试版本生成");

        // 验证版本号格式：yyyyMMddHHmmss
        String version = history.getVersion();
        assertNotNull(version);
        assertEquals(14, version.length()); // 年月日时分秒共14位

        // 验证版本号只包含数字
        assertTrue(version.matches("\\d{14}"));
    }

    @Test
    void testNoPublishedConfig() {
        // 测试没有发布记录时获取最新配置的异常
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            publishService.getLatestPublishedConfig();
        });
        assertEquals("暂无发布记录", exception.getMessage());

        // 测试没有发布记录时获取配置数据的异常
        exception = assertThrows(RuntimeException.class, () -> {
            publishService.getPublishedConfigData();
        });
        assertEquals("暂无发布记录", exception.getMessage());
    }
}