package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

// TODO: 此实体对应的表已不存在于新schema中，暂时禁用
// @Entity
// @Table(name = "card")
@Data
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private CardConfig cardConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skin_id", nullable = false)
    private CardSkin cardSkin;

    @Column(name = "is_unlocked")
    private Boolean isUnlocked = true;

    @Column(name = "is_equipped")
    private Boolean isEquipped = true;

    @Column(name = "unlock_time")
    private LocalDateTime unlockTime;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        unlockTime = now;
        if (isUnlocked == null) isUnlocked = true;
        if (isEquipped == null) isEquipped = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}