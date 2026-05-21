package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_mode_config")
@Data
public class GameModeConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mode_key", nullable = false, unique = true, length = 20)
    private String modeKey;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(name = "player_count", nullable = false)
    private Integer playerCount;

    @Column(name = "team_count")
    private Integer teamCount = 0;

    @Column(name = "team_size")
    private Integer teamSize = 0;

    @Column(name = "danger_card_count", nullable = false)
    private Integer dangerCardCount;

    @Column(name = "initial_hand_count", nullable = false)
    private Integer initialHandCount = 6;

    @Column(name = "initial_safety_keys_per_player")
    private Integer initialSafetyKeysPerPlayer = 0;

    @Column(name = "initial_safety_keys_per_team")
    private Integer initialSafetyKeysPerTeam = 0;

    @Column(name = "reward_config", columnDefinition = "json")
    private String rewardConfig;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (initialHandCount == null) initialHandCount = 6;
        if (initialSafetyKeysPerPlayer == null) initialSafetyKeysPerPlayer = 0;
        if (initialSafetyKeysPerTeam == null) initialSafetyKeysPerTeam = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
