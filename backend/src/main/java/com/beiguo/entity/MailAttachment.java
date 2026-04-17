package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "mail_attachment")
@Data
public class MailAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mail_id", nullable = false)
    private MailConfig mailConfig;

    @Column(nullable = false, length = 20)
    private String itemType; // DIAMOND, COIN, SKIN, ITEM

    @Column(nullable = false, length = 50)
    private String itemCode; // 物品编码或ID

    @Column(length = 100)
    private String itemName; // 物品名称

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (quantity == null) quantity = 1;
    }
}
