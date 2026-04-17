package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mail_config")
@Data
public class MailConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    @Column(length = 20)
    private String status = "DRAFT"; // DRAFT, SENT, EXPIRED

    @Column(name = "target_conditions", columnDefinition = "json")
    private String targetConditions; // JSON: 筛选条件

    @Column(name = "send_time")
    private LocalDateTime sendTime;

    @Column(name = "expire_time")
    private LocalDateTime expireTime;

    @Column(name = "total_recipients")
    private Integer totalRecipients = 0;

    @Column(name = "sent_count")
    private Integer sentCount = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @OneToMany(mappedBy = "mailConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"mailConfig", "hibernateLazyInitializer", "handler"})
    private List<MailAttachment> attachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) status = "DRAFT";
        if (totalRecipients == null) totalRecipients = 0;
        if (sentCount == null) sentCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
