package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 收益记录实体
 */
@Data
@Entity
@Table(name = "earning_record")
public class EarningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 收益类型：SKIN_PURCHASE-皮肤购买, AD_REVENUE-广告收入, SPONSOR-赞助收入
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EarningType type;

    /**
     * 收益金额
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /**
     * 订单号（可选，用于关联具体交易）
     */
    @Column(length = 64)
    private String orderNo;

    /**
     * 关联用户ID（可选，皮肤购买时记录）
     */
    private Long userId;

    /**
     * 关联用户名（可选）
     */
    @Column(length = 50)
    private String username;

    /**
     * 收益描述/备注
     */
    @Column(length = 255)
    private String description;

    /**
     * 收益日期（用于按日期统计）
     */
    @Column(nullable = false)
    private LocalDateTime earningDate;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
