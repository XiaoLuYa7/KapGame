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
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}