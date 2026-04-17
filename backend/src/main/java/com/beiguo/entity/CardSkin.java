package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "card_skin", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"card_id", "skin_name"})
})
@Data
public class CardSkin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    @JsonIgnoreProperties({"skins", "effects", "hibernateLazyInitializer", "handler"})
    private CardConfig cardConfig;

    @Column(name = "skin_name", nullable = false, length = 50)
    private String skinName;

    @Column(length = 200)
    private String description;

    @Column(name = "cover_url", nullable = false, length = 500)
    private String coverUrl;

    @Column(name = "animation_url", length = 500)
    private String animationUrl;

    @Column(name = "preview_url", length = 500)
    private String previewUrl;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "price_diamond")
    private Integer priceDiamond = 0;

    @Column(name = "price_gold")
    private Integer priceGold = 0;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "cardSkin", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"cardSkin", "hibernateLazyInitializer", "handler"})
    private List<UserSkin> userSkins = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        if (isDefault == null) isDefault = false;
        if (isActive == null) isActive = true;
        if (priceDiamond == null) priceDiamond = 0;
        if (priceGold == null) priceGold = 0;
        if (displayOrder == null) displayOrder = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}