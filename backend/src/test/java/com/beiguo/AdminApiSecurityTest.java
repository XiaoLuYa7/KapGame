package com.beiguo;

import com.beiguo.dto.admin.AdminAuthRequest;
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
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminApiSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    private ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String superAdminToken;
    private String userToken; // 普通用户token，没有admin角色

    @BeforeEach
    void setUp() throws Exception {
        // 生成测试token
        adminToken = jwtUtil.generateToken("testadmin", 100L, "ADMIN");
        superAdminToken = jwtUtil.generateToken("superadmin", 101L, "SUPER_ADMIN");
        userToken = jwtUtil.generateToken("testuser", 200L); // 没有角色
    }

    @Test
    void testAdminAuthLoginUnauthenticated() throws Exception {
        // 测试未认证用户访问管理员登录端点应该成功
        AdminAuthRequest request = new AdminAuthRequest();
        request.setUsername("admin");
        request.setPassword("admin123");

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists());
    }

    @Test
    void testAdminApiAccessWithoutToken() throws Exception {
        // 测试未认证用户访问管理API应该被拒绝
        mockMvc.perform(get("/api/admin/cards"))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    void testAdminApiAccessWithUserToken() throws Exception {
        // 测试普通用户（无ADMIN角色）访问管理API应该被拒绝
        mockMvc.perform(get("/api/admin/cards")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    void testAdminApiAccessWithAdminToken() throws Exception {
        // 测试管理员（ADMIN角色）访问管理API应该成功
        mockMvc.perform(get("/api/admin/cards")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAdminApiAccessWithSuperAdminToken() throws Exception {
        // 测试超级管理员（SUPER_ADMIN角色）访问管理API应该成功
        mockMvc.perform(get("/api/admin/cards")
                .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testPublicApiAccessWithoutToken() throws Exception {
        // 测试未认证用户访问公共API应该成功
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testPublicApiAccessWithToken() throws Exception {
        // 测试带token用户访问公共API应该成功
        mockMvc.perform(get("/api/public/config")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAdminAuthEndpointPermissions() throws Exception {
        // 测试管理员认证端点的权限设置
        // 管理员登录端点应该对所有人开放
        mockMvc.perform(post("/api/admin/auth/login"))
                .andExpect(status().is4xxClientError()); // 缺少凭证，但端点可访问

        // 测试其他管理员端点需要认证
        mockMvc.perform(get("/api/admin/auth/me"))
                .andExpect(status().isForbidden()); // 403 Forbidden
    }

    @Test
    void testDifferentAdminEndpointsWithRoles() throws Exception {
        // 测试不同管理员角色对不同端点的访问权限
        // 测试管理员可以访问卡牌管理
        mockMvc.perform(get("/api/admin/cards")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 测试管理员可以访问活动管理
        mockMvc.perform(get("/api/admin/activities")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 测试管理员可以访问用户管理
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 测试管理员可以访问系统配置管理
        mockMvc.perform(get("/api/admin/system-configs")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 测试管理员可以访问发布管理
        mockMvc.perform(get("/api/admin/publish/history")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}