package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.service.PublishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/config")
public class PublicConfigController {
    @Autowired
    private PublishService publishService;

    @GetMapping
    public ApiResponse<Map<String, Object>> getConfig() {
        try {
            Map<String, Object> configData = publishService.getPublishedConfigData();
            return ApiResponse.success(configData);
        } catch (RuntimeException e) {
            return ApiResponse.error("获取配置失败: " + e.getMessage());
        }
    }

    @GetMapping("/version")
    public ApiResponse<Map<String, String>> getVersion() {
        try {
            String version = publishService.getCurrentVersion();
            return ApiResponse.success(Map.of("version", version));
        } catch (RuntimeException e) {
            return ApiResponse.error("获取版本失败: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> healthCheck() {
        return ApiResponse.success(Map.of("status", "ok", "service", "config-api"));
    }
}