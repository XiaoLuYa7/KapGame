package com.beiguo.service;

import com.beiguo.entity.SystemConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface SystemConfigService {

    // CRUD方法
    SystemConfig create(SystemConfig systemConfig);
    SystemConfig update(Long id, SystemConfig systemConfig);
    void delete(Long id);
    SystemConfig getById(Long id);
    List<SystemConfig> getAll();
    Page<SystemConfig> getPage(Pageable pageable);

    // 业务特定方法
    SystemConfig updateConfigValue(Long id, String configValue, String modifiedBy, String reason);
    SystemConfig togglePublicStatus(Long id, String modifiedBy, String reason);

    // 查询方法
    SystemConfig getByConfigKey(String configKey);
    List<SystemConfig> getPublicConfigs();
    List<SystemConfig> getPrivateConfigs();
    List<SystemConfig> getConfigsByKeyPattern(String keyPattern);
    Page<SystemConfig> searchConfigs(String configKey, String description, Pageable pageable);

    // 检查方法
    boolean existsByConfigKey(String configKey);
    boolean isPublic(Long id);

    // 批量操作
    List<SystemConfig> createBatch(List<SystemConfig> configs);
    List<SystemConfig> updateBatch(List<SystemConfig> configs);
    void deleteBatch(List<Long> ids);

    // 工具方法
    String getConfigValue(String configKey, String defaultValue);
    Integer getConfigValueAsInt(String configKey, Integer defaultValue);
    Boolean getConfigValueAsBoolean(String configKey, Boolean defaultValue);
}