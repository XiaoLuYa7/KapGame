package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_skin", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "skin_id"})
})
@Data
public class UserSkin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"userSkins", "password", "hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skin_id", nullable = false)
    @JsonIgnoreProperties({"userSkins", "cardConfig", "hibernateLazyInitializer", "handler"})
    private CardSkin cardSkin;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "is_equipped", nullable = false)
    private Boolean isEquipped = false;

    @Column(name = "purchase_time", nullable = false)
    private LocalDateTime purchaseTime;

    @Column(name = "purchase_type", length = 20)
    private String purchaseType; // DIAMOND, GOLD, FREE, GIFT

    @Column(name = "purchase_price")
    private Integer purchasePrice = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        if (purchaseTime == null) purchaseTime = now;
        if (quantity == null) quantity = 1;
        if (isEquipped == null) isEquipped = false;
        if (purchasePrice == null) purchasePrice = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}