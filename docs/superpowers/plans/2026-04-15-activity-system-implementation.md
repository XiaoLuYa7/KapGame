# 活动系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 实现一套通用的活动系统，支持签到活动、充值活动、限时礼包、充值双倍四种活动类型

**架构：** 采用统一的活动+奖励配置表结构，通过 activity_type 区分活动类型，奖励配置关联活动，支持灵活的多档位设置

**技术栈：** Java Spring Boot, MySQL, Vue 3, Element Plus, REST API

---

## 第一阶段：数据库表结构

### 任务 1: 创建增量 SQL 文件

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\resources\activity_schema.sql`

```sql
-- ==================== 活动系统DDL脚本 ====================

-- 1. 活动基础信息表
CREATE TABLE IF NOT EXISTS `activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
  `description` VARCHAR(500) COMMENT '活动描述',
  `image_url` VARCHAR(500) COMMENT '活动图片URL',
  `activity_type` VARCHAR(50) NOT NULL COMMENT '活动类型：SIGNIN/RECHARGE/GIFT/DOUBLE',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE/INACTIVE/EXPIRED',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` VARCHAR(100) COMMENT '修改人',
  `last_modified_reason` VARCHAR(500) COMMENT '修改原因',
  PRIMARY KEY (`id`),
  INDEX `idx_type_status` (`activity_type`, `status`),
  INDEX `idx_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 2. 活动奖励配置表
CREATE TABLE IF NOT EXISTS `activity_reward` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `activity_id` BIGINT NOT NULL COMMENT '关联activity.id',
  `reward_type` VARCHAR(50) NOT NULL COMMENT '奖励类型：DIAMOND/GOLD/CARD_SKIN/GIFT_BOX',
  `reward_value` INT NOT NULL DEFAULT 0 COMMENT '奖励值（数量或物品ID）',
  `reward_desc` VARCHAR(200) COMMENT '奖励描述（用于显示）',
  `condition_type` VARCHAR(50) NOT NULL COMMENT '条件类型：DAY/AMOUNT/PRICE',
  `condition_value` INT NOT NULL DEFAULT 0 COMMENT '条件值（天数/金额）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_activity` (`activity_id`),
  CONSTRAINT `fk_reward_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动奖励配置表';

-- 3. 用户活动参与记录表
CREATE TABLE IF NOT EXISTS `user_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '关联user.id',
  `activity_id` BIGINT NOT NULL COMMENT '关联activity.id',
  `progress` INT NOT NULL DEFAULT 0 COMMENT '当前进度（签到天数/累计充值金额）',
  `status` VARCHAR(20) NOT NULL DEFAULT 'DOING' COMMENT '状态：DOING/COMPLETED',
  `start_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '参与时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_activity` (`user_id`, `activity_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_activity` (`activity_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户活动参与记录表';

-- 4. 用户已领取奖励记录表
CREATE TABLE IF NOT EXISTS `user_reward` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '关联user.id',
  `activity_id` BIGINT NOT NULL COMMENT '关联activity.id',
  `reward_id` BIGINT NOT NULL COMMENT '关联activity_reward.id',
  `claim_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_reward` (`user_id`, `reward_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_activity` (`activity_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_reward` FOREIGN KEY (`reward_id`) REFERENCES `activity_reward` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已领取奖励记录表';

SELECT '活动系统表结构创建完成！' AS message;
```

- [ ] **Step 1: 创建 activity_schema.sql 文件**

- [ ] **Step 2: 执行 SQL 创建表结构**

---

## 第二阶段：后端实体类

### 任务 2: 创建 Activity 实体

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\entity\Activity.java`

```java
package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "activity")
@Data
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType; // SIGNIN, RECHARGE, GIFT, DOUBLE

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, EXPIRED

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "last_modified_by", length = 100)
    private String lastModifiedBy;

    @Column(name = "last_modified_reason", length = 500)
    private String lastModifiedReason;

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"activity", "hibernateLazyInitializer", "handler"})
    private List<ActivityReward> rewards = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        if (status == null) status = "ACTIVE";
        if (sortOrder == null) sortOrder = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
```

- [ ] **Step 1: 创建 Activity.java 实体类**

### 任务 3: 创建 ActivityReward 实体

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\entity\ActivityReward.java`

```java
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
```

- [ ] **Step 1: 创建 ActivityReward.java 实体类**

### 任务 4: 创建 UserActivity 实体

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\entity\UserActivity.java`

```java
package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_activity", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "activity_id"})
})
@Data
public class UserActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Activity activity;

    @Column(nullable = false)
    private Integer progress = 0;

    @Column(length = 20)
    private String status = "DOING"; // DOING, COMPLETED

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        startTime = now;
        updateTime = now;
        if (status == null) status = "DOING";
        if (progress == null) progress = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
```

- [ ] **Step 1: 创建 UserActivity.java 实体类**

### 任务 5: 创建 UserReward 实体

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\entity\UserReward.java`

```java
package com.beiguo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_reward", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "reward_id"})
})
@Data
public class UserReward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ActivityReward reward;

    @Column(name = "claim_time")
    private LocalDateTime claimTime;

    @PrePersist
    protected void onCreate() {
        claimTime = LocalDateTime.now();
    }
}
```

- [ ] **Step 1: 创建 UserReward.java 实体类**

---

## 第三阶段：Repository 层

### 任务 6: 创建 Repository 接口

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\repository\ActivityRepository.java`
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\repository\ActivityRewardRepository.java`
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\repository\UserActivityRepository.java`
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\repository\UserRewardRepository.java`

```java
// ActivityRepository.java
package com.beiguo.repository;

import com.beiguo.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByActivityTypeAndStatusOrderBySortOrderDesc(String activityType, String status);

    @Query("SELECT a FROM Activity a WHERE a.status = 'ACTIVE' AND a.startTime <= :now AND a.endTime >= :now ORDER BY a.sortOrder DESC")
    List<Activity> findActiveActivities(@Param("now") java.time.LocalDateTime now);

    @Query("SELECT a FROM Activity a WHERE a.status = 'ACTIVE' AND a.startTime <= :now AND a.endTime >= :now AND a.activityType = :type ORDER BY a.sortOrder DESC")
    List<Activity> findActiveActivitiesByType(@Param("now") java.time.LocalDateTime now, @Param("type") String type);
}
```

```java
// ActivityRewardRepository.java
package com.beiguo.repository;

import com.beiguo.entity.ActivityReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRewardRepository extends JpaRepository<ActivityReward, Long> {
    List<ActivityReward> findByActivityIdOrderBySortOrderAsc(Long activityId);
}
```

```java
// UserActivityRepository.java
package com.beiguo.repository;

import com.beiguo.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    Optional<UserActivity> findByUserIdAndActivityId(@Param("userId") Long userId, @Param("activityId") Long activityId);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.id = :userId AND ua.activity.id = :activityId")
    Optional<UserActivity> findByUserAndActivity(@Param("userId") Long userId, @Param("activityId") Long activityId);
}
```

```java
// UserRewardRepository.java
package com.beiguo.repository;

import com.beiguo.entity.UserReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRewardRepository extends JpaRepository<UserReward, Long> {
    List<UserReward> findByUserIdAndActivityId(Long userId, Long activityId);

    Optional<UserReward> findByUserIdAndRewardId(Long userId, Long rewardId);

    boolean existsByUserIdAndRewardId(Long userId, Long rewardId);
}
```

- [ ] **Step 1: 创建 ActivityRepository.java**
- [ ] **Step 2: 创建 ActivityRewardRepository.java**
- [ ] **Step 3: 创建 UserActivityRepository.java**
- [ ] **Step 4: 创建 UserRewardRepository.java**

---

## 第四阶段：Service 层

### 任务 7: 创建活动管理 Service

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\service\ActivityService.java`

```java
package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.repository.ActivityRepository;
import com.beiguo.repository.ActivityRewardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityRewardRepository activityRewardRepository;

    public ApiResponse<Page<Activity>> getActivities(int page, int size, String type, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Activity> activities;
        if (type != null && !type.isEmpty()) {
            activities = activityRepository.findAll(pageable);
        } else {
            activities = activityRepository.findAll(pageable);
        }
        return ApiResponse.success(activities);
    }

    public ApiResponse<Activity> getActivity(Long id) {
        Optional<Activity> activity = activityRepository.findById(id);
        if (activity.isEmpty()) {
            return ApiResponse.error("活动不存在");
        }
        return ApiResponse.success(activity.get());
    }

    @Transactional
    public ApiResponse<Activity> createActivity(Activity activity) {
        activity.setCreateTime(LocalDateTime.now());
        activity.setUpdateTime(LocalDateTime.now());
        if (activity.getStatus() == null) {
            activity.setStatus("ACTIVE");
        }
        Activity saved = activityRepository.save(activity);
        return ApiResponse.success("创建成功", saved);
    }

    @Transactional
    public ApiResponse<Activity> updateActivity(Long id, Activity activityData) {
        Optional<Activity> existingOpt = activityRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("活动不存在");
        }
        Activity existing = existingOpt.get();
        if (activityData.getTitle() != null) existing.setTitle(activityData.getTitle());
        if (activityData.getDescription() != null) existing.setDescription(activityData.getDescription());
        if (activityData.getImageUrl() != null) existing.setImageUrl(activityData.getImageUrl());
        if (activityData.getActivityType() != null) existing.setActivityType(activityData.getActivityType());
        if (activityData.getStartTime() != null) existing.setStartTime(activityData.getStartTime());
        if (activityData.getEndTime() != null) existing.setEndTime(activityData.getEndTime());
        if (activityData.getStatus() != null) existing.setStatus(activityData.getStatus());
        if (activityData.getSortOrder() != null) existing.setSortOrder(activityData.getSortOrder());
        existing.setUpdateTime(LocalDateTime.now());
        Activity updated = activityRepository.save(existing);
        return ApiResponse.success("更新成功", updated);
    }

    @Transactional
    public ApiResponse<Void> deleteActivity(Long id) {
        Optional<Activity> existingOpt = activityRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.<Void>error("活动不存在");
        }
        activityRepository.delete(existingOpt.get());
        return ApiResponse.<Void>successMessage("删除成功");
    }

    @Transactional
    public ApiResponse<ActivityReward> addReward(Long activityId, ActivityReward reward) {
        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (activityOpt.isEmpty()) {
            return ApiResponse.<ActivityReward>error("活动不存在");
        }
        reward.setActivity(activityOpt.get());
        reward.setCreateTime(LocalDateTime.now());
        ActivityReward saved = activityRewardRepository.save(reward);
        return ApiResponse.success("奖励添加成功", saved);
    }

    @Transactional
    public ApiResponse<Void> deleteReward(Long rewardId) {
        Optional<ActivityReward> existingOpt = activityRewardRepository.findById(rewardId);
        if (existingOpt.isEmpty()) {
            return ApiResponse.<Void>error("奖励不存在");
        }
        activityRewardRepository.delete(existingOpt.get());
        return ApiResponse.<Void>successMessage("删除成功");
    }

    public ApiResponse<List<ActivityReward>> getRewards(Long activityId) {
        List<ActivityReward> rewards = activityRewardRepository.findByActivityIdOrderBySortOrderAsc(activityId);
        return ApiResponse.success(rewards);
    }

    public ApiResponse<List<Activity>> getActiveActivities() {
        List<Activity> activities = activityRepository.findActiveActivities(LocalDateTime.now());
        return ApiResponse.success(activities);
    }

    public ApiResponse<List<Activity>> getActiveActivitiesByType(String type) {
        List<Activity> activities = activityRepository.findActiveActivitiesByType(LocalDateTime.now(), type);
        return ApiResponse.success(activities);
    }
}
```

- [ ] **Step 1: 创建 ActivityService.java**

### 任务 8: 创建用户活动 Service

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\service\UserActivityService.java`

```java
package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.*;
import com.beiguo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserActivityService {

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private UserRewardRepository userRewardRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityRewardRepository activityRewardRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ApiResponse<Void> signIn(Long userId, Long activityId) {
        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (activityOpt.isEmpty()) {
            return ApiResponse.<Void>error("活动不存在");
        }
        Activity activity = activityOpt.get();
        if (!"SIGNIN".equals(activity.getActivityType())) {
            return ApiResponse.<Void>error("该活动不是签到活动");
        }
        if (activity.getStatus().equals("INACTIVE")) {
            return ApiResponse.<Void>error("活动未开始");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(activity.getStartTime()) || now.isAfter(activity.getEndTime())) {
            return ApiResponse.<Void>error("活动已结束");
        }

        Optional<UserActivity> uaOpt = userActivityRepository.findByUserIdAndActivityId(userId, activityId);
        UserActivity userActivity;
        if (uaOpt.isPresent()) {
            userActivity = uaOpt.get();
            userActivity.setProgress(userActivity.getProgress() + 1);
        } else {
            userActivity = new UserActivity();
            userActivity.setUser(userRepository.findById(userId).orElse(null));
            userActivity.setActivity(activity);
            userActivity.setProgress(1);
            userActivity.setStatus("DOING");
        }
        userActivityRepository.save(userActivity);
        return ApiResponse.<Void>successMessage("签到成功");
    }

    @Transactional
    public ApiResponse<Void> claimReward(Long userId, Long activityId, Long rewardId) {
        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (activityOpt.isEmpty()) {
            return ApiResponse.<Void>error("活动不存在");
        }

        Optional<ActivityReward> rewardOpt = activityRewardRepository.findById(rewardId);
        if (rewardOpt.isEmpty()) {
            return ApiResponse.<Void>error("奖励不存在");
        }

        if (userRewardRepository.existsByUserIdAndRewardId(userId, rewardId)) {
            return ApiResponse.<Void>error("奖励已领取");
        }

        Activity activity = activityOpt.get();
        ActivityReward reward = rewardOpt.get();

        // 检查进度是否满足
        Optional<UserActivity> uaOpt = userActivityRepository.findByUserIdAndActivityId(userId, activityId);
        if (uaOpt.isEmpty()) {
            return ApiResponse.<Void>error("未参与该活动");
        }
        UserActivity userActivity = uaOpt.get();
        if (userActivity.getProgress() < reward.getConditionValue()) {
            return ApiResponse.<Void>error("进度不足，无法领取");
        }

        // 发放奖励
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.<Void>error("用户不存在");
        }

        switch (reward.getRewardType()) {
            case "DIAMOND":
                user.setDiamond(user.getDiamond() + reward.getRewardValue());
                break;
            case "GOLD":
                user.setGold(user.getGold() + reward.getRewardValue());
                break;
            case "CARD_SKIN":
                // TODO: 发放皮肤逻辑
                break;
            case "GIFT_BOX":
                // TODO: 发放礼盒逻辑
                break;
        }
        userRepository.save(user);

        // 记录领取
        UserReward userReward = new UserReward();
        userReward.setUser(user);
        userReward.setActivity(activity);
        userReward.setReward(reward);
        userRewardRepository.save(userReward);

        return ApiResponse.<Void>successMessage("领取成功");
    }

    public ApiResponse<Map<String, Object>> getUserActivityProgress(Long userId, Long activityId) {
        Optional<UserActivity> uaOpt = userActivityRepository.findByUserIdAndActivityId(userId, activityId);
        List<UserReward> claimedRewards = userRewardRepository.findByUserIdAndActivityId(userId, activityId);

        Map<String, Object> result = new HashMap<>();
        result.put("progress", uaOpt.map(UserActivity::getProgress).orElse(0));
        result.put("status", uaOpt.map(UserActivity::getStatus).orElse("NOT_JOINED"));
        result.put("claimedRewardIds", claimedRewards.stream().map(ur -> ur.getReward().getId()).toList());

        return ApiResponse.success(result);
    }
}
```

- [ ] **Step 1: 创建 UserActivityService.java**

---

## 第五阶段：Controller 层

### 任务 9: 创建管理后台 Controller

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\controller\admin\ActivityAdminController.java`

```java
package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/activities")
public class ActivityAdminController {

    @Autowired
    private ActivityService activityService;

    @GetMapping
    public ApiResponse<Page<Activity>> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return activityService.getActivities(page, size, type, status);
    }

    @GetMapping("/{id}")
    public ApiResponse<Activity> getActivity(@PathVariable Long id) {
        return activityService.getActivity(id);
    }

    @PostMapping
    public ApiResponse<Activity> createActivity(@RequestBody Activity activity) {
        return activityService.createActivity(activity);
    }

    @PutMapping("/{id}")
    public ApiResponse<Activity> updateActivity(@PathVariable Long id, @RequestBody Activity activity) {
        return activityService.updateActivity(id, activity);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteActivity(@PathVariable Long id) {
        return activityService.deleteActivity(id);
    }

    @GetMapping("/{id}/rewards")
    public ApiResponse<List<ActivityReward>> getRewards(@PathVariable Long id) {
        return activityService.getRewards(id);
    }

    @PostMapping("/{id}/rewards")
    public ApiResponse<ActivityReward> addReward(@PathVariable Long id, @RequestBody ActivityReward reward) {
        return activityService.addReward(id, reward);
    }

    @DeleteMapping("/{id}/rewards/{rewardId}")
    public ApiResponse<Void> deleteReward(@PathVariable Long id, @PathVariable Long rewardId) {
        return activityService.deleteReward(rewardId);
    }
}
```

- [ ] **Step 1: 创建 ActivityAdminController.java**

### 任务 10: 创建小程序端 Controller

**文件:**
- 创建: `D:\ClaudeCode\KapGame\backend\src\main\java\com\beiguo\controller\MiniActivityController.java`

```java
package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.service.ActivityService;
import com.beiguo.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
public class MiniActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserActivityService userActivityService;

    @GetMapping
    public ApiResponse<List<Activity>> getActiveActivities(
            @RequestParam(required = false) String type) {
        if (type != null && !type.isEmpty()) {
            return activityService.getActiveActivitiesByType(type);
        }
        return activityService.getActiveActivities();
    }

    @GetMapping("/{id}")
    public ApiResponse<Activity> getActivity(@PathVariable Long id) {
        return activityService.getActivity(id);
    }

    @GetMapping("/{id}/rewards")
    public ApiResponse<List<ActivityReward>> getRewards(@PathVariable Long id) {
        return activityService.getRewards(id);
    }

    @PostMapping("/{id}/signin")
    public ApiResponse<Void> signIn(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.signIn(userId, id);
    }

    @PostMapping("/{id}/claim")
    public ApiResponse<Void> claimReward(
            @PathVariable Long id,
            @RequestParam Long rewardId,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.claimReward(userId, id, rewardId);
    }

    @GetMapping("/{id}/progress")
    public ApiResponse<Map<String, Object>> getProgress(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.getUserActivityProgress(userId, id);
    }
}
```

- [ ] **Step 1: 创建 MiniActivityController.java**

---

## 第六阶段：前端管理后台

### 任务 11: 创建活动管理页面

**文件:**
- 创建: `D:\ClaudeCode\KapGame\admin-frontend\views\activities\ActivityManage.vue`
- 创建: `D:\ClaudeCode\KapGame\admin-frontend\views\activities\ActivityEdit.vue`
- 创建: `D:\ClaudeCode\KapGame\admin-frontend\apis\activityAdmin.js`

- [ ] **Step 1: 创建 activityAdmin.js API 模块**
- [ ] **Step 2: 创建 ActivityManage.vue 活动列表页**
- [ ] **Step 3: 创建 ActivityEdit.vue 活动编辑页**

---

## 实施检查清单

- [ ] 数据库表创建完成
- [ ] 所有实体类创建完成
- [ ] 所有 Repository 接口创建完成
- [ ] ActivityService 创建完成
- [ ] UserActivityService 创建完成
- [ ] ActivityAdminController 创建完成
- [ ] MiniActivityController 创建完成
- [ ] 前端 API 模块创建完成
- [ ] 前端活动管理页面创建完成
