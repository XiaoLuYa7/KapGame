package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.SystemConfig;
import com.beiguo.service.SystemConfigService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/admin/system-configs")
public class SystemConfigAdminController {
    @Autowired
    private SystemConfigService systemConfigService;

    @GetMapping
    public ApiResponse<Page<SystemConfig>> getConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String configKey,
            @RequestParam(required = false) String description) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "configKey"));
        Page<SystemConfig> configs = systemConfigService.searchConfigs(configKey, description, pageable);
        return ApiResponse.success(configs);
    }

    @GetMapping("/{id}")
    public ApiResponse<SystemConfig> getConfig(@PathVariable Long id) {
        SystemConfig config = systemConfigService.getById(id);
        return ApiResponse.success(config);
    }

    @GetMapping("/key/{key}")
    public ApiResponse<SystemConfig> getConfigByKey(@PathVariable String key) {
        SystemConfig config = systemConfigService.getByConfigKey(key);
        return ApiResponse.success(config);
    }

    @PostMapping
    public ApiResponse<SystemConfig> createConfig(@Valid @RequestBody SystemConfig config) {
        if (systemConfigService.existsByConfigKey(config.getConfigKey())) {
            return ApiResponse.error("配置键已存在");
        }

        config.setCreateTime(LocalDateTime.now());
        config.setUpdateTime(LocalDateTime.now());
        if (config.getIsPublic() == null) {
            config.setIsPublic(false);
        }

        SystemConfig saved = systemConfigService.create(config);
        return ApiResponse.success("创建成功", saved);
    }

    @PutMapping("/{id}")
    public ApiResponse<SystemConfig> updateConfig(@PathVariable Long id, @Valid @RequestBody SystemConfig config) {
        SystemConfig existing = systemConfigService.getById(id);
        // 不允许修改configKey（作为唯一标识）
        if (config.getConfigValue() != null) existing.setConfigValue(config.getConfigValue());
        if (config.getDescription() != null) existing.setDescription(config.getDescription());
        if (config.getIsPublic() != null) existing.setIsPublic(config.getIsPublic());

        existing.setUpdateTime(LocalDateTime.now());
        SystemConfig updated = systemConfigService.update(id, existing);
        return ApiResponse.success("更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteConfig(@PathVariable Long id) {
        systemConfigService.delete(id);
        return ApiResponse.success("删除成功");
    }
}