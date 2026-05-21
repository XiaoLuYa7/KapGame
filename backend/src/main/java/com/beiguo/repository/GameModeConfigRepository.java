package com.beiguo.repository;

import com.beiguo.entity.GameModeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameModeConfigRepository extends JpaRepository<GameModeConfig, Long> {
    Optional<GameModeConfig> findByModeKey(String modeKey);
}
