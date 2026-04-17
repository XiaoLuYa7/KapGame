package com.beiguo;

import com.beiguo.dto.admin.AdminAuthRequest;
import com.beiguo.entity.*;
import com.beiguo.repository.*;
import com.beiguo.utils.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 端到端的发布流程集成测试
 * 模拟完整的管理员发布配置和小程序获取配置的流程
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class PublishFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CardConfigRepository cardConfigRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PublishHistoryRepository publishHistoryRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // 清理测试数据
        publishHistoryRepository.deleteAll();
        cardConfigRepository.deleteAll();
        activityRepository.deleteAll();
        systemConfigRepository.deleteAll();

        // 创建测试卡牌数据
        CardConfig card1 = new CardConfig();
        card1.setName("Fireball");
        card1.setType("ATTACK");
        card1.setRarity("RARE");
        card1.setIsActive(true);
        card1.setEffects("[{\"type\":\"FIRE_DAMAGE\",\"amount\":10}]");
        card1.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card1);

        CardConfig card2 = new CardConfig();
        card2.setName("Ice Shield");
        card2.setType("DEFENSE");
        card2.setRarity("EPIC");
        card2.setIsActive(true);
        card2.setEffects("[{\"type\":\"ICE_BARRIER\",\"duration\":3}]");
        card2.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(card2);

        // 创建测试活动数据
        Activity activity = new Activity();
        activity.setTitle("Spring Festival Event");
        activity.setActivityType("SEASONAL_EVENT");
        activity.setStatus("ACTIVE");
        activity.setStartTime(LocalDateTime.now().minusDays(1));
        activity.setEndTime(LocalDateTime.now().plusDays(14));
        activity.setCreateTime(LocalDateTime.now());
        activityRepository.save(activity);

        // 创建测试系统配置数据
        SystemConfig config = new SystemConfig();
        config.setConfigKey("game.version");
        config.setConfigValue("1.2.0");
        config.setDescription("Current game version");
        config.setIsPublic(true);
        config.setCreateTime(LocalDateTime.now());
        systemConfigRepository.save(config);

        // 生成管理员token
        adminToken = jwtUtil.generateToken("testadmin", 100L, "ADMIN");
    }

    @Test
    void testCompletePublishFlow() throws Exception {
        // 步骤1: 管理员登录（模拟）
        // 由于我们直接生成token，跳过实际登录测试

        // 步骤2: 管理员发布配置
        String publishRequest = "{\"description\":\"Spring update with new cards\"}";

        MvcResult publishResult = mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(publishRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").exists())
                .andExpect(jsonPath("$.data.description").value("Spring update with new cards"))
                .andReturn();

        String publishResponse = publishResult.getResponse().getContentAsString();
        Map<String, Object> publishData = objectMapper.readValue(publishResponse, Map.class);
        Map<String, Object> publishResultData = (Map<String, Object>) publishData.get("data");
        String publishedVersion = (String) publishResultData.get("version");

        // 验证发布历史记录
        assertEquals(1, publishHistoryRepository.count());

        // 步骤3: 小程序获取配置版本
        MvcResult versionResult = mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").exists())
                .andReturn();

        String versionResponse = versionResult.getResponse().getContentAsString();
        Map<String, Object> versionData = objectMapper.readValue(versionResponse, Map.class);
        Map<String, String> versionResultData = (Map<String, String>) versionData.get("data");
        String retrievedVersion = versionResultData.get("version");

        // 验证版本号匹配
        assertEquals(publishedVersion, retrievedVersion);

        // 步骤4: 小程序获取完整配置
        MvcResult configResult = mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cards").isArray())
                .andExpect(jsonPath("$.data.activities").isArray())
                .andExpect(jsonPath("$.data.systemConfigs").isArray())
                .andExpect(jsonPath("$.data.publishTime").exists())
                .andReturn();

        String configResponse = configResult.getResponse().getContentAsString();
        Map<String, Object> configData = objectMapper.readValue(configResponse, Map.class);
        Map<String, Object> configResultData = (Map<String, Object>) configData.get("data");

        // 验证配置数据内容
        assertTrue(configResultData.containsKey("cards"));
        assertTrue(configResultData.containsKey("activities"));
        assertTrue(configResultData.containsKey("systemConfigs"));
        assertTrue(configResultData.containsKey("publishTime"));

        // 验证卡牌数量
        java.util.List<?> cards = (java.util.List<?>) configResultData.get("cards");
        assertEquals(2, cards.size()); // 2张激活的卡牌

        // 验证活动数量
        java.util.List<?> activities = (java.util.List<?>) configResultData.get("activities");
        assertEquals(1, activities.size()); // 1个激活的活动

        // 验证系统配置数量
        java.util.List<?> systemConfigs = (java.util.List<?>) configResultData.get("systemConfigs");
        assertEquals(1, systemConfigs.size()); // 1个公开的系统配置

        // 步骤5: 验证配置数据正确性
        Map<?, ?> firstCard = (Map<?, ?>) cards.get(0);
        assertEquals("Fireball", firstCard.get("name"));
        assertEquals("ATTACK", firstCard.get("type"));
        assertEquals("RARE", firstCard.get("rarity"));

        Map<?, ?> firstActivity = (Map<?, ?>) activities.get(0);
        assertEquals("Spring Festival Event", firstActivity.get("title"));
        assertEquals("SEASONAL_EVENT", firstActivity.get("activityType"));

        Map<?, ?> firstConfig = (Map<?, ?>) systemConfigs.get(0);
        assertEquals("game.version", firstConfig.get("configKey"));
        assertEquals("1.2.0", firstConfig.get("configValue"));
    }

    @Test
    void testMultiplePublishAndVersionUpdate() throws Exception {
        // 第一次发布
        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"First publish\"}"))
                .andExpect(status().isOk());

        // 获取第一次发布的版本
        MvcResult version1Result = mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andReturn();

        String version1Response = version1Result.getResponse().getContentAsString();
        Map<String, Object> version1Data = objectMapper.readValue(version1Response, Map.class);
        Map<String, String> version1ResultData = (Map<String, String>) version1Data.get("data");
        String version1 = version1ResultData.get("version");

        // 等待一小段时间，确保版本号不同
        Thread.sleep(10);

        // 第二次发布（更新配置）
        // 先添加一张新卡牌
        CardConfig newCard = new CardConfig();
        newCard.setName("Thunder Strike");
        newCard.setType("ATTACK");
        newCard.setRarity("LEGENDARY");
        newCard.setIsActive(true);
        newCard.setEffects("[{\"type\":\"LIGHTNING_DAMAGE\",\"amount\":20}]");
        newCard.setCreateTime(LocalDateTime.now());
        cardConfigRepository.save(newCard);

        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"Second publish with new card\"}"))
                .andExpect(status().isOk());

        // 获取第二次发布的版本
        MvcResult version2Result = mockMvc.perform(get("/api/public/config/version"))
                .andExpect(status().isOk())
                .andReturn();

        String version2Response = version2Result.getResponse().getContentAsString();
        Map<String, Object> version2Data = objectMapper.readValue(version2Response, Map.class);
        Map<String, String> version2ResultData = (Map<String, String>) version2Data.get("data");
        String version2 = version2ResultData.get("version");

        // 验证版本号已更新
        assertNotEquals(version1, version2);
        assertNotEquals("0", version2);

        // 验证配置数据已更新（现在应该有3张卡牌）
        MvcResult configResult = mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andReturn();

        String configResponse = configResult.getResponse().getContentAsString();
        Map<String, Object> configData = objectMapper.readValue(configResponse, Map.class);
        Map<String, Object> configResultData = (Map<String, Object>) configData.get("data");

        java.util.List<?> cards = (java.util.List<?>) configResultData.get("cards");
        assertEquals(3, cards.size()); // 现在有3张激活的卡牌
    }

    @Test
    void testPublishWithoutPermission() throws Exception {
        // 生成普通用户token（没有ADMIN角色）
        String userToken = jwtUtil.generateToken("regularuser", 200L);

        // 尝试以普通用户身份发布配置
        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"Unauthorized publish attempt\"}"))
                .andExpect(status().isForbidden()); // 403 Forbidden

        // 验证没有发布记录
        assertEquals(0, publishHistoryRepository.count());
    }

    @Test
    void testPublicConfigAlwaysAccessible() throws Exception {
        // 发布配置
        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"Test publish\"}"))
                .andExpect(status().isOk());

        // 测试无需token访问公共配置
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk());

        // 测试带token访问公共配置（也应该可以）
        mockMvc.perform(get("/api/public/config")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 测试带用户token访问公共配置
        String userToken = jwtUtil.generateToken("user", 300L);
        mockMvc.perform(get("/api/public/config")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());
    }

    @Test
    void testPublishHistoryEndpoint() throws Exception {
        // 发布几次配置
        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"First\"}"))
                .andExpect(status().isOk());

        Thread.sleep(10);

        mockMvc.perform(post("/api/admin/publish")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"Second\"}"))
                .andExpect(status().isOk());

        // 获取发布历史
        mockMvc.perform(get("/api/admin/publish/history")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].description").value("Second")) // 最新在前
                .andExpect(jsonPath("$.data[1].description").value("First"));
    }
}