package com.beiguo.repository;

import com.beiguo.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long>, JpaSpecificationExecutor<SystemConfig> {
    Optional<SystemConfig> findByConfigKey(String configKey);
    boolean existsByConfigKey(String configKey);
    List<SystemConfig> findByIsPublic(boolean isPublic);
    List<SystemConfig> findAllByOrderByConfigKeyAsc();
    List<SystemConfig> findByConfigKeyContaining(String keyPattern);
    List<SystemConfig> findByDescriptionContaining(String description);
    List<SystemConfig> findByConfigKeyContainingAndDescriptionContaining(String configKey, String description);
}