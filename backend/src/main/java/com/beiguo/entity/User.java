package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(length = 20)
    private String role = "USER";

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "open_id", unique = true, length = 100)
    private String openId;

    @Column(name = "nick_name", length = 100)
    private String nickName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "`rank`", length = 50)
    private String rank = "青铜 III";

    @Column(name = "rank_level")
    private Integer rankLevel = 1;

    @Column(name = "diamond")
    private Integer diamond = 0;

    @Column(name = "gold")
    private Integer gold = 0;

    @Column(name = "level")
    private Integer level = 1;

    @Column(name = "exp")
    private Integer exp = 0;

    @Column(name = "total_games")
    private Integer totalGames = 0;

    @Column(name = "win_games")
    private Integer winGames = 0;

    @Column(name = "friend_count")
    private Integer friendCount = 0;

    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    @Column(name = "total_online_time")
    private Integer totalOnlineTime = 0; // 单位：分钟

    // ===== 新增字段：设置相关 =====
    @Column(name = "sound_effects_enabled")
    private Boolean soundEffectsEnabled = true; // 音效开关

    @Column(name = "music_enabled")
    private Boolean musicEnabled = true; // 音乐开关

    @Column(name = "vibration_enabled")
    private Boolean vibrationEnabled = true; // 震动开关

    @Column(name = "show_online_status")
    private Boolean showOnlineStatus = true; // 在好友列表显示在线状态

    @Column(name = "show_last_active_time")
    private Boolean showLastActiveTime = true; // 显示最后活跃时间

    @Column(name = "real_name", length = 50)
    private String realName; // 实名认证的真实姓名

    @Column(name = "id_card", length = 20)
    private String idCard; // 身份证号

    @Column(name = "is_verified")
    private Boolean isVerified = false; // 是否已实名认证

    @Column(name = "last_active_time")
    private LocalDateTime lastActiveTime; // 最后活跃时间

    @Column(name = "online_status", length = 20)
    private String onlineStatus = "OFFLINE"; // ONLINE, OFFLINE

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"user", "hibernateLazyInitializer", "handler"})
    private List<UserSkin> userSkins = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        if (diamond == null) diamond = 0;
        if (gold == null) gold = 0;
        if (level == null) level = 1;
        if (exp == null) exp = 0;
        if (rank == null) rank = "青铜 III";
        if (rankLevel == null) rankLevel = 1;
        if (totalGames == null) totalGames = 0;
        if (winGames == null) winGames = 0;
        if (friendCount == null) friendCount = 0;
        if (totalOnlineTime == null) totalOnlineTime = 0;
        if (soundEffectsEnabled == null) soundEffectsEnabled = true;
        if (musicEnabled == null) musicEnabled = true;
        if (vibrationEnabled == null) vibrationEnabled = true;
        if (showOnlineStatus == null) showOnlineStatus = true;
        if (showLastActiveTime == null) showLastActiveTime = true;
        if (isVerified == null) isVerified = false;
        if (onlineStatus == null) onlineStatus = "OFFLINE";
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}