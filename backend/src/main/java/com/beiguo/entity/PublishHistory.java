package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "publish_history")
@Data
public class PublishHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version", nullable = false, length = 50)
    private String version; // 版本号，格式如: 1.0.0 或时间戳

    @Column(name = "publish_time", nullable = false)
    private LocalDateTime publishTime;

    @Column(name = "published_by", length = 100)
    private String publishedBy; // 发布者用户名

    @Column(name = "admin_id")
    private Long adminId; // 发布者ID

    @Column(name = "config_data", columnDefinition = "json", nullable = false)
    private String configData; // JSON格式的配置数据

    @Column(length = 500)
    private String description; // 发布描述

    @Column(name = "card_count")
    private Integer cardCount = 0;

    @Column(name = "activity_count")
    private Integer activityCount = 0;

    @Column(name = "config_count")
    private Integer configCount = 0;

    @PrePersist
    protected void onCreate() {
        if (publishTime == null) {
            publishTime = LocalDateTime.now();
        }
    }
}