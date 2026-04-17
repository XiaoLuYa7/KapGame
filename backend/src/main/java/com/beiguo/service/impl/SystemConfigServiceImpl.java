package com.beiguo.service.impl;

import com.beiguo.entity.SystemConfig;
import com.beiguo.repository.SystemConfigRepository;
import com.beiguo.service.SystemConfigService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SystemConfigServiceImpl implements SystemConfigService {

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Override
    @Transactional
    public SystemConfig create(SystemConfig systemConfig) {
        // 验证必要字段
        if (systemConfig.getConfigKey() == null || systemConfig.getConfigKey().trim().isEmpty()) {
            throw new RuntimeException("配置键不能为空");
        }

        // 检查配置键是否已存在
        if (systemConfigRepository.existsByConfigKey(systemConfig.getConfigKey())) {
            throw new RuntimeException("配置键已存在: " + systemConfig.getConfigKey());
        }

        // 设置默认值
        if (systemConfig.getIsPublic() == null) {
            systemConfig.setIsPublic(false);
        }

        // 保存配置
        return systemConfigRepository.save(systemConfig);
    }

    @Override
    @Transactional
    public SystemConfig update(Long id, SystemConfig systemConfig) {
        SystemConfig existingConfig = getById(id);

        // 如果配置键有变化，检查是否已存在
        if (systemConfig.getConfigKey() != null && !systemConfig.getConfigKey().equals(existingConfig.getConfigKey())) {
            if (systemConfigRepository.existsByConfigKey(systemConfig.getConfigKey())) {
                throw new RuntimeException("配置键已存在: " + systemConfig.getConfigKey());
            }
            existingConfig.setConfigKey(systemConfig.getConfigKey());
        }

        // 更新其他字段
        if (systemConfig.getConfigValue() != null) {
            existingConfig.setConfigValue(systemConfig.getConfigValue());
        }
        if (systemConfig.getDescription() != null) {
            existingConfig.setDescription(systemConfig.getDescription());
        }
        if (systemConfig.getIsPublic() != null) {
            existingConfig.setIsPublic(systemConfig.getIsPublic());
        }
        if (systemConfig.getLastModifiedBy() != null) {
            existingConfig.setLastModifiedBy(systemConfig.getLastModifiedBy());
        }
        if (systemConfig.getLastModifiedReason() != null) {
            existingConfig.setLastModifiedReason(systemConfig.getLastModifiedReason());
        }

        // 更新时间和审计信息会自动处理（@PreUpdate）
        return systemConfigRepository.save(existingConfig);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        SystemConfig config = getById(id);
        systemConfigRepository.delete(config);
    }

    @Override
    public SystemConfig getById(Long id) {
        return systemConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("系统配置不存在，ID: " + id));
    }

    @Override
    public List<SystemConfig> getAll() {
        return systemConfigRepository.findAllByOrderByConfigKeyAsc();
    }

    @Override
    public Page<SystemConfig> getPage(Pageable pageable) {
        return systemConfigRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public SystemConfig updateConfigValue(Long id, String configValue, String modifiedBy, String reason) {
        SystemConfig config = getById(id);
        config.setConfigValue(configValue);
        config.setLastModifiedBy(modifiedBy);
        config.setLastModifiedReason(reason);
        return systemConfigRepository.save(config);
    }

    @Override
    @Transactional
    public SystemConfig togglePublicStatus(Long id, String modifiedBy, String reason) {
        SystemConfig config = getById(id);
        config.setIsPublic(!config.getIsPublic());
        config.setLastModifiedBy(modifiedBy);
        config.setLastModifiedReason(reason);
        return systemConfigRepository.save(config);
    }

    @Override
    public SystemConfig getByConfigKey(String configKey) {
        return systemConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new RuntimeException("系统配置不存在，配置键: " + configKey));
    }

    @Override
    public List<SystemConfig> getPublicConfigs() {
        return systemConfigRepository.findByIsPublic(true);
    }

    @Override
    public List<SystemConfig> getPrivateConfigs() {
        return systemConfigRepository.findByIsPublic(false);
    }

    @Override
    public List<SystemConfig> getConfigsByKeyPattern(String keyPattern) {
        return systemConfigRepository.findByConfigKeyContaining(keyPattern);
    }

    @Override
    public Page<SystemConfig> searchConfigs(String configKey, String description, Pageable pageable) {
        Specification<SystemConfig> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (configKey != null && !configKey.isEmpty()) {
                predicates.add(cb.like(root.get("configKey"), "%" + configKey + "%"));
            }
            if (description != null && !description.isEmpty()) {
                predicates.add(cb.like(root.get("description"), "%" + description + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return systemConfigRepository.findAll(spec, pageable);
    }

    @Override
    public boolean existsByConfigKey(String configKey) {
        return systemConfigRepository.existsByConfigKey(configKey);
    }

    @Override
    public boolean isPublic(Long id) {
        SystemConfig config = getById(id);
        return Boolean.TRUE.equals(config.getIsPublic());
    }

    @Override
    @Transactional
    public List<SystemConfig> createBatch(List<SystemConfig> configs) {
        // 验证所有配置键唯一性
        for (SystemConfig config : configs) {
            if (systemConfigRepository.existsByConfigKey(config.getConfigKey())) {
                throw new RuntimeException("配置键已存在: " + config.getConfigKey());
            }
        }
        return systemConfigRepository.saveAll(configs);
    }

    @Override
    @Transactional
    public List<SystemConfig> updateBatch(List<SystemConfig> configs) {
        // 这里假设传入的配置都是已存在的，需要先验证
        for (SystemConfig config : configs) {
            if (config.getId() == null) {
                throw new RuntimeException("批量更新时配置ID不能为空");
            }
            // 验证存在性
            if (!systemConfigRepository.existsById(config.getId())) {
                throw new RuntimeException("配置不存在，ID: " + config.getId());
            }
        }
        return systemConfigRepository.saveAll(configs);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids) {
        for (Long id : ids) {
            if (!systemConfigRepository.existsById(id)) {
                throw new RuntimeException("配置不存在，ID: " + id);
            }
        }
        systemConfigRepository.deleteAllById(ids);
    }

    @Override
    public String getConfigValue(String configKey, String defaultValue) {
        Optional<SystemConfig> config = systemConfigRepository.findByConfigKey(configKey);
        return config.map(SystemConfig::getConfigValue).orElse(defaultValue);
    }

    @Override
    public Integer getConfigValueAsInt(String configKey, Integer defaultValue) {
        String value = getConfigValue(configKey, null);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Override
    public Boolean getConfigValueAsBoolean(String configKey, Boolean defaultValue) {
        String value = getConfigValue(configKey, null);
        if (value == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }
}