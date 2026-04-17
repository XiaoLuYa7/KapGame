package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_reward")
@Data
public class ActivityReward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Activity activity;

    @Column(name = "reward_type", nullable = false, length = 50)
    private String rewardType; // DIAMOND, GOLD, CARD_SKIN, GIFT_BOX

    @Column(name = "reward_value", nullable = false)
    private Integer rewardValue = 0;

    @Column(name = "reward_desc", length = 200)
    private String rewardDesc;

    @Column(name = "condition_type", nullable = false, length = 50)
    private String conditionType; // DAY, AMOUNT, PRICE

    @Column(name = "condition_value", nullable = false)
    private Integer conditionValue = 0;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (sortOrder == null) sortOrder = 0;
    }
}
