package com.beiguo.controller;

import com.beiguo.entity.*;
import com.beiguo.repository.*;
import com.beiguo.service.PublishService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class PublicConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // 清理测试数据
        publishHistoryRepository.deleteAll();
        cardConfigRepository.deleteAll();
        activityRepository.deleteAll();
        systemConfigRepository.deleteAll();

        // 创建测试数据
        CardConfig card = new CardConfig();
        card.setName("Test Card");
        card.setType("ATTACK");
        card.setRarity("COMMON");
        card.setIsActive(true);
        card.setEffects("[{\"type\":\"DAMAGE\",\"amount\":5}]");
        card.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card);

        Activity activity = new Activity();
        activity.setTitle("Test Activity");
        activity.setActivityType("DAILY_LOGIN");
        activity.setStatus("ACTIVE");
        activity.setStartTime(LocalDateTime.now().minusDays(1));
        activity.setEndTime(LocalDateTime.now().plusDays(30));
        activity.setCreateTime(LocalDateTime.now());
        activityRepository.save(activity);

        SystemConfig config = new SystemConfig();
        config.setConfigKey("test.key");
        config.setConfigValue("test value");
        config.setDescription("Test config");
        config.setIsPublic(true);
        config.setCreateTime(LocalDateTime.now());
        systemConfigRepository.save(config);
    }

    @Test
    void testGetConfigWithoutPublish() throws Exception {
        // 测试没有发布记录时获取配置
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("获取配置失败: 暂无发布记录"));
    }

    @Test
    void testGetConfigWithPublish() throws Exception {
        // 发布配置
        publishService.publishConfig("测试管理员", 1L, "测试发布");

        // 获取配置
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cards").isArray())
                .andExpect(jsonPath("$.data.activities").isArray())
                .andExpect(jsonPath("$.data.systemConfigs").isArray())
                .andExpect(jsonPath("$.data.publishTime").exists());
    }

    @Test
    void testGetVersionWithoutPublish() throws Exception {
        // 测试没有发布记录时获取版本号
        mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").value("0"));
    }

    @Test
    void testGetVersionWithPublish() throws Exception {
        // 发布配置
        publishService.publishConfig("测试管理员", 1L, "测试版本");

        // 获取版本号
        mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").exists())
                .andExpect(jsonPath("$.data.version").isString());
    }

    @Test
    void testHealthCheck() throws Exception {
        // 测试健康检查端点
        mockMvc.perform(get("/api/public/config/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ok"))
                .andExpect(jsonPath("$.data.service").value("config-api"));
    }

    @Test
    void testConfigDataContent() throws Exception {
        // 发布配置
        publishService.publishConfig("测试管理员", 1L, "测试配置内容");

        // 获取配置并验证内容
        String response = mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        assertTrue((Boolean) responseMap.get("success"));

        Map<String, Object> data = (Map<String, Object>) responseMap.get("data");

        // 验证卡牌数据
        java.util.List<?> cards = (java.util.List<?>) data.get("cards");
        assertEquals(1, cards.size());

        Map<?, ?> card = (Map<?, ?>) cards.get(0);
        assertEquals("Test Card", card.get("name"));
        assertEquals("ATTACK", card.get("type"));
        assertEquals("COMMON", card.get("rarity"));

        // 验证活动数据
        java.util.List<?> activities = (java.util.List<?>) data.get("activities");
        assertEquals(1, activities.size());

        Map<?, ?> activity = (Map<?, ?>) activities.get(0);
        assertEquals("Test Activity", activity.get("title"));
        assertEquals("DAILY_LOGIN", activity.get("activityType"));

        // 验证系统配置数据
        java.util.List<?> systemConfigs = (java.util.List<?>) data.get("systemConfigs");
        assertEquals(1, systemConfigs.size());

        Map<?, ?> config = (Map<?, ?>) systemConfigs.get(0);
        assertEquals("test.key", config.get("configKey"));
        assertEquals("test value", config.get("configValue"));
    }

    @Test
    void testMultiplePublishesGetLatest() throws Exception {
        // 发布第一次
        publishService.publishConfig("管理员1", 1L, "第一次发布");

        // 等待一小段时间，确保版本号不同
        Thread.sleep(10);

        // 发布第二次
        publishService.publishConfig("管理员2", 2L, "第二次发布");

        // 获取配置，应该是最新的一次
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());

        // 获取版本号，应该是最新版本
        String response = mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        Map<String, String> data = (Map<String, String>) responseMap.get("data");
        String latestVersion = data.get("version");

        // 验证版本号是最新的
        assertNotNull(latestVersion);
        assertNotEquals("0", latestVersion);
    }

    @Test
    void testPublicApiNoAuthenticationRequired() throws Exception {
        // 测试公共API不需要认证
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk()); // 即使没有token也能访问

        mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/public/config/health"))
                .andExpect(status().isOk());
    }
}