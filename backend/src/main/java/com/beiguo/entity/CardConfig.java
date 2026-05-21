package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "card_config")
@Data
public class CardConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "card_key", length = 50, unique = true)
    private String cardKey;

    @Column(length = 200)
    private String description;

    @Column(nullable = false, length = 20)
    private String type; // ATTACK, DEFENSE, UTILITY

    @Column(length = 20)
    private String rarity = "COMMON"; // COMMON, RARE, EPIC, LEGENDARY

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "mana_cost")
    private Integer manaCost = 0;

    @Column(name = "power")
    private Integer power = 0;

    @Column(name = "health")
    private Integer health = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "mode_scope", length = 30)
    private String modeScope = "SOLO,TEAM";

    @Column(name = "count_solo")
    private Integer countSolo = 0;

    @Column(name = "count_team")
    private Integer countTeam = 0;

    @Column(length = 30)
    private String timing;

    @Column(name = "target_type", length = 30)
    private String targetType;

    @Column(name = "can_be_countered")
    private Boolean canBeCountered = false;

    @Column(name = "icon_path", length = 200)
    private String iconPath;

    @Column(columnDefinition = "json", nullable = false)
    private String effects; // JSON array of effect objects

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "last_modified_by", length = 100)
    private String lastModifiedBy;

    @Column(name = "last_modified_reason", length = 500)
    private String lastModifiedReason;

    @OneToMany(mappedBy = "cardConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"cardConfig", "userSkins", "hibernateLazyInitializer", "handler"})
    private List<CardSkin> skins = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (rarity == null) rarity = "COMMON";
        if (manaCost == null) manaCost = 0;
        if (power == null) power = 0;
        if (health == null) health = 0;
        if (isActive == null) isActive = true;
        if (modeScope == null) modeScope = "SOLO,TEAM";
        if (countSolo == null) countSolo = 0;
        if (countTeam == null) countTeam = 0;
        if (canBeCountered == null) canBeCountered = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
