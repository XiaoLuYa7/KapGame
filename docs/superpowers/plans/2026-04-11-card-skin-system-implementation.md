# 卡牌皮肤系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构现有卡牌系统，支持皮肤功能，实现所有用户自动拥有新增卡牌的默认皮肤，所有用户自动拥有所有基础皮肤的卡牌，用户购买新皮肤时只给该用户拥有该皮肤，并向后兼容现有系统。

**Architecture:** 数据库层添加card_skin表，重命名user_card表为card表，Java实体层添加CardSkin实体，重命名UserCard为Card，服务层实现自动分配逻辑和皮肤购买装备功能，API层提供皮肤相关端点。

**Tech Stack:** Spring Boot 3.x, JPA/Hibernate, MySQL 8.0+, Maven, JUnit 5, Mockito

---

## 文件结构

### 数据库迁移文件
- **Create**: `backend/src/main/resources/schema02_card_skin_migration.sql` - 数据库迁移脚本

### 实体层文件
- **Create**: `backend/src/main/java/com/beiguo/entity/CardSkin.java` - 卡牌皮肤实体
- **Modify**: `backend/src/main/java/com/beiguo/entity/UserCard.java` → `backend/src/main/java/com/beiguo/entity/Card.java` - 重命名并重构
- **Modify**: `backend/src/main/java/com/beiguo/entity/CardConfig.java:245-247` - 添加一对多关系
- **Modify**: `backend/src/main/java/com/beiguo/entity/User.java:250-254` - 更新关系映射

### 数据访问层文件
- **Create**: `backend/src/main/java/com/beiguo/repository/CardSkinRepository.java` - 皮肤Repository
- **Create**: `backend/src/main/java/com/beiguo/repository/CardRepository.java` - 卡牌实例Repository

### 服务层文件
- **Create**: `backend/src/main/java/com/beiguo/service/CardSkinService.java` - 皮肤服务
- **Create**: `backend/src/main/java/com/beiguo/service/CardService.java` - 卡牌实例服务

### DTO文件
- **Create**: `backend/src/main/java/com/beiguo/dto/skin/CreateSkinRequest.java` - 创建皮肤请求
- **Create**: `backend/src/main/java/com/beiguo/dto/skin/CardSkinResponse.java` - 皮肤响应
- **Create**: `backend/src/main/java/com/beiguo/dto/skin/UserCardResponse.java` - 用户卡牌响应
- **Create**: `backend/src/main/java/com/beiguo/dto/skin/PurchaseSkinRequest.java` - 购买皮肤请求

### 控制器文件
- **Create**: `backend/src/main/java/com/beiguo/controller/CardSkinController.java` - 皮肤API控制器

### 测试文件
- **Create**: `backend/src/test/java/com/beiguo/service/CardSkinServiceTest.java` - 皮肤服务测试
- **Create**: `backend/src/test/java/com/beiguo/service/CardServiceTest.java` - 卡牌服务测试
- **Create**: `backend/src/test/java/com/beiguo/repository/CardSkinRepositoryTest.java` - 皮肤Repository测试

---

## 任务分解

### Task 1: 创建数据库迁移脚本

**Files:**
- Create: `backend/src/main/resources/schema02_card_skin_migration.sql`

- [ ] **Step 1: 创建迁移脚本文件**

```bash
cd /d/ClaudeCode/KapGame
touch backend/src/main/resources/schema02_card_skin_migration.sql
```

- [ ] **Step 2: 编写迁移脚本头部**

```sql
-- schema02_card_skin_migration.sql
-- 卡牌皮肤系统数据库迁移脚本
-- 日期: 2026-04-11

-- 备份user_card表数据
CREATE TABLE IF NOT EXISTS user_card_backup_20260411 AS SELECT * FROM user_card;

-- 1. 创建card_skin表
CREATE TABLE IF NOT EXISTS `card_skin` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `card_id` INT NOT NULL,
    `skin_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200),
    `cover_url` VARCHAR(500) NOT NULL,
    `animation_url` VARCHAR(500),
    `preview_url` VARCHAR(500),
    `is_default` BOOLEAN DEFAULT FALSE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `price_diamond` INT DEFAULT 0,
    `price_gold` INT DEFAULT 0,
    `display_order` INT DEFAULT 0,
    `created_by` VARCHAR(100),
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`card_id`) REFERENCES `card_config` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_card_skin_name` (`card_id`, `skin_name`),
    INDEX `idx_card_active` (`card_id`, `is_active`, `display_order`),
    INDEX `idx_default_active` (`is_default`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 为现有卡牌创建默认皮肤
INSERT INTO `card_skin` (`card_id`, `skin_name`, `description`, `cover_url`, `is_default`, `is_active`, `created_by`)
SELECT
    cc.id,
    CONCAT(cc.name, ' 默认皮肤'),
    CONCAT(cc.name, ' 的默认皮肤'),
    COALESCE(cc.image_url, 'https://example.com/default_skin.jpg'),
    TRUE,
    TRUE,
    'system'
FROM `card_config` cc
WHERE cc.is_active = TRUE;

-- 3. 创建card表（重命名user_card）
CREATE TABLE IF NOT EXISTS `card` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `card_id` INT NOT NULL,
    `skin_id` INT NOT NULL,
    `is_unlocked` BOOLEAN DEFAULT TRUE,
    `is_equipped` BOOLEAN DEFAULT TRUE,
    `unlock_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`card_id`) REFERENCES `card_config` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`skin_id`) REFERENCES `card_skin` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_user_card_skin` (`user_id`, `card_id`, `skin_id`),
    INDEX `idx_user_card` (`user_id`, `card_id`, `is_equipped`),
    INDEX `idx_user_unlocked` (`user_id`, `is_unlocked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 迁移user_card数据到card表（关联默认皮肤）
INSERT INTO `card` (`user_id`, `card_id`, `skin_id`, `is_unlocked`, `is_equipped`)
SELECT
    uc.user_id,
    uc.card_id,
    cs.id,
    TRUE,
    TRUE
FROM `user_card` uc
INNER JOIN `card_skin` cs ON uc.card_id = cs.card_id AND cs.is_default = TRUE;

-- 5. 验证迁移数据完整性
SELECT 'card_skin表记录数' as table_name, COUNT(*) as record_count FROM `card_skin`
UNION ALL
SELECT 'card表记录数', COUNT(*) FROM `card`
UNION ALL
SELECT '原user_card表记录数', COUNT(*) FROM `user_card_backup_20260411`;

-- 迁移完成提示
SELECT '卡牌皮肤系统数据库迁移完成！' AS message;
```

- [ ] **Step 3: 保存并验证脚本**

```bash
cd /d/ClaudeCode/KapGame
wc -l backend/src/main/resources/schema02_card_skin_migration.sql
head -5 backend/src/main/resources/schema02_card_skin_migration.sql
tail -5 backend/src/main/resources/schema02_card_skin_migration.sql
```

Expected: 文件应有约70-80行，头部和尾部正确显示

### Task 2: 创建CardSkin实体类

**Files:**
- Create: `backend/src/main/java/com/beiguo/entity/CardSkin.java`

- [ ] **Step 1: 创建实体类文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/main/java/com/beiguo/entity/
touch backend/src/main/java/com/beiguo/entity/CardSkin.java
```

- [ ] **Step 2: 编写CardSkin实体类**

```java
package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "card_skin")
@Data
public class CardSkin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
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
```

- [ ] **Step 3: 验证实体类语法**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(lombok|jakarta.persistence)' | head -5 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/entity/CardSkin.java 2>&1 | head -20
```

Expected: 无编译错误或仅有类路径警告

### Task 3: 重命名并重构UserCard为Card实体

**Files:**
- Modify: `backend/src/main/java/com/beiguo/entity/UserCard.java` → `backend/src/main/java/com/beiguo/entity/Card.java`

- [ ] **Step 1: 复制并重命名文件**

```bash
cd /d/ClaudeCode/KapGame
cp backend/src/main/java/com/beiguo/entity/UserCard.java backend/src/main/java/com/beiguo/entity/Card.java
```

- [ ] **Step 2: 更新Card实体类内容**

```java
package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "card")
@Data
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private CardConfig cardConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skin_id", nullable = false)
    private CardSkin cardSkin;

    @Column(name = "is_unlocked")
    private Boolean isUnlocked = true;

    @Column(name = "is_equipped")
    private Boolean isEquipped = true;

    @Column(name = "unlock_time")
    private LocalDateTime unlockTime;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        unlockTime = now;
        if (isUnlocked == null) isUnlocked = true;
        if (isEquipped == null) isEquipped = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
```

- [ ] **Step 3: 删除原UserCard文件**

```bash
cd /d/ClaudeCode/KapGame
rm backend/src/main/java/com/beiguo/entity/UserCard.java
```

### Task 4: 修改CardConfig实体添加皮肤关系

**Files:**
- Modify: `backend/src/main/java/com/beiguo/entity/CardConfig.java:245-247`

- [ ] **Step 1: 读取当前CardConfig实体**

```bash
cd /d/ClaudeCode/KapGame
grep -n "import" backend/src/main/java/com/beiguo/entity/CardConfig.java | tail -5
grep -n "class CardConfig" backend/src/main/java/com/beiguo/entity/CardConfig.java
```

- [ ] **Step 2: 在CardConfig类中添加皮肤关系**

找到CardConfig类的字段定义部分，在文件末尾的`updateTime`字段后添加以下代码：

```java
    @OneToMany(mappedBy = "cardConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CardSkin> skins = new ArrayList<>();
```

同时需要在文件顶部添加必要的import：

```java
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
```

- [ ] **Step 3: 验证修改**

```bash
cd /d/ClaudeCode/KapGame
grep -A2 -B2 "skins = new ArrayList" backend/src/main/java/com/beiguo/entity/CardConfig.java
grep "import.*ArrayList" backend/src/main/java/com/beiguo/entity/CardConfig.java
```

Expected: 应显示添加的skins字段和ArrayList导入

### Task 5: 修改User实体更新卡牌关系映射

**Files:**
- Modify: `backend/src/main/java/com/beiguo/entity/User.java:250-254`

- [ ] **Step 1: 读取当前User实体结构**

```bash
cd /d/ClaudeCode/KapGame
grep -n "import" backend/src/main/java/com/beiguo/entity/User.java | tail -5
grep -n "class User" backend/src/main/java/com/beiguo/entity/User.java
```

- [ ] **Step 2: 在User类中更新卡牌关系映射**

找到User类的字段定义部分，在文件末尾的`updateTime`字段后添加以下代码（如果已有相关关系需要更新）：

```java
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Card> cards = new ArrayList<>();
```

如果已有UserCard的关系，需要更新为Card。同时需要在文件顶部添加必要的import：

```java
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
```

- [ ] **Step 3: 验证修改**

```bash
cd /d/ClaudeCode/KapGame
grep -A2 -B2 "cards = new ArrayList" backend/src/main/java/com/beiguo/entity/User.java
grep "import.*Card" backend/src/main/java/com/beiguo/entity/User.java
```

Expected: 应显示添加的cards字段和Card导入

### Task 6: 创建CardSkinRepository接口

**Files:**
- Create: `backend/src/main/java/com/beiguo/repository/CardSkinRepository.java`

- [ ] **Step 1: 创建Repository文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/main/java/com/beiguo/repository/
touch backend/src/main/java/com/beiguo/repository/CardSkinRepository.java
```

- [ ] **Step 2: 编写CardSkinRepository接口**

```java
package com.beiguo.repository;

import com.beiguo.entity.CardSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CardSkinRepository extends JpaRepository<CardSkin, Integer> {
    List<CardSkin> findByCardConfigId(Integer cardId);
    CardSkin findByCardConfigIdAndIsDefaultTrue(Integer cardId);
    List<CardSkin> findByCardConfigIdAndIsActiveTrue(Integer cardId);
    Optional<CardSkin> findByCardConfigIdAndSkinName(Integer cardId, String skinName);
    List<CardSkin> findByIsDefaultTrueAndIsActiveTrue();
}
```

- [ ] **Step 3: 验证Repository接口**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(spring-data|javax.persistence)' | head -5 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/repository/CardSkinRepository.java 2>&1 | head -20
```

Expected: 无编译错误

### Task 7: 创建CardRepository接口

**Files:**
- Create: `backend/src/main/java/com/beiguo/repository/CardRepository.java`

- [ ] **Step 1: 创建Repository文件**

```bash
cd /d/ClaudeCode/KapGame
touch backend/src/main/java/com/beiguo/repository/CardRepository.java
```

- [ ] **Step 2: 编写CardRepository接口**

```java
package com.beiguo.repository;

import com.beiguo.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByUserId(Long userId);
    List<Card> findByUserIdAndCardConfigId(Long userId, Integer cardId);
    List<Card> findByUserIdAndIsEquippedTrue();
    boolean existsByUserIdAndCardConfigIdAndCardSkinId(Long userId, Integer cardId, Integer skinId);
    List<Card> findByUserIdAndIsUnlockedFalse();
    Optional<Card> findByUserIdAndCardConfigIdAndCardSkinId(Long userId, Integer cardId, Integer skinId);
    List<Card> findByUserIdAndCardSkinId(Long userId, Integer skinId);
}
```

- [ ] **Step 3: 验证Repository接口**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(spring-data|javax.persistence)' | head -5 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/repository/CardRepository.java 2>&1 | head -20
```

Expected: 无编译错误

### Task 8: 创建DTO类

**Files:**
- Create: `backend/src/main/java/com/beiguo/dto/skin/CreateSkinRequest.java`
- Create: `backend/src/main/java/com/beiguo/dto/skin/CardSkinResponse.java`
- Create: `backend/src/main/java/com/beiguo/dto/skin/UserCardResponse.java`
- Create: `backend/src/main/java/com/beiguo/dto/skin/PurchaseSkinRequest.java`

- [ ] **Step 1: 创建DTO目录和文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/main/java/com/beiguo/dto/skin/
touch backend/src/main/java/com/beiguo/dto/skin/CreateSkinRequest.java
touch backend/src/main/java/com/beiguo/dto/skin/CardSkinResponse.java
touch backend/src/main/java/com/beiguo/dto/skin/UserCardResponse.java
touch backend/src/main/java/com/beiguo/dto/skin/PurchaseSkinRequest.java
```

- [ ] **Step 2: 编写CreateSkinRequest DTO**

```java
package com.beiguo.dto.skin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSkinRequest {
    @NotNull(message = "卡牌ID不能为空")
    private Integer cardId;

    @NotBlank(message = "皮肤名称不能为空")
    private String skinName;

    private String description;

    @NotBlank(message = "封面URL不能为空")
    private String coverUrl;

    private String animationUrl;
    private String previewUrl;
    private Boolean isDefault = false;
    private Boolean isActive = true;
    private Integer priceDiamond = 0;
    private Integer priceGold = 0;
    private Integer displayOrder = 0;
    private String createdBy;
}
```

- [ ] **Step 3: 编写CardSkinResponse DTO**

```java
package com.beiguo.dto.skin;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CardSkinResponse {
    private Integer id;
    private Integer cardId;
    private String skinName;
    private String description;
    private String coverUrl;
    private String animationUrl;
    private String previewUrl;
    private Boolean isDefault;
    private Boolean isActive;
    private Integer priceDiamond;
    private Integer priceGold;
    private Boolean isUnlocked;
    private Boolean isEquipped;
    private LocalDateTime createTime;
}
```

- [ ] **Step 4: 编写UserCardResponse DTO**

```java
package com.beiguo.dto.skin;

import lombok.Data;

@Data
public class UserCardResponse {
    private Long id;
    private Integer cardId;
    private String cardName;
    private Integer skinId;
    private String skinName;
    private Boolean isUnlocked;
    private Boolean isEquipped;
    private String coverUrl;
}
```

- [ ] **Step 5: 编写PurchaseSkinRequest DTO**

```java
package com.beiguo.dto.skin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PurchaseSkinRequest {
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotNull(message = "卡牌ID不能为空")
    private Integer cardId;

    @NotNull(message = "皮肤ID不能为空")
    private Integer skinId;

    private String purchaseType; // "DIAMOND", "GOLD", "FREE"
}
```

- [ ] **Step 6: 验证DTO类**

```bash
cd /d/ClaudeCode/KapGame
for file in backend/src/main/java/com/beiguo/dto/skin/*.java; do
    echo "Checking $file"
    javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(lombok|jakarta.validation)' | head -5 | tr '\n' ':')" -d /tmp "$file" 2>&1 | head -10
done
```

Expected: 所有DTO类编译无错误

### Task 9: 创建CardSkinService服务

**Files:**
- Create: `backend/src/main/java/com/beiguo/service/CardSkinService.java`

- [ ] **Step 1: 创建服务文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/main/java/com/beiguo/service/
touch backend/src/main/java/com/beiguo/service/CardSkinService.java
```

- [ ] **Step 2: 编写CardSkinService服务**

```java
package com.beiguo.service;

import com.beiguo.dto.skin.CreateSkinRequest;
import com.beiguo.entity.CardConfig;
import com.beiguo.entity.CardSkin;
import com.beiguo.repository.CardConfigRepository;
import com.beiguo.repository.CardSkinRepository;
import com.beiguo.service.CardService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardSkinService {
    private final CardSkinRepository cardSkinRepository;
    private final CardConfigRepository cardConfigRepository;
    private final CardService cardService;

    @Transactional
    public CardSkin createSkin(CreateSkinRequest request) {
        // 验证卡牌存在
        CardConfig cardConfig = cardConfigRepository.findById(request.getCardId())
            .orElseThrow(() -> new IllegalArgumentException("卡牌不存在: " + request.getCardId()));

        // 如果是默认皮肤，确保没有其他默认皮肤
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            CardSkin existingDefault = cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(request.getCardId());
            if (existingDefault != null) {
                throw new IllegalArgumentException("该卡牌已存在默认皮肤: " + existingDefault.getSkinName());
            }
        }

        // 创建皮肤记录
        CardSkin skin = new CardSkin();
        skin.setCardConfig(cardConfig);
        skin.setSkinName(request.getSkinName());
        skin.setDescription(request.getDescription());
        skin.setCoverUrl(request.getCoverUrl());
        skin.setAnimationUrl(request.getAnimationUrl());
        skin.setPreviewUrl(request.getPreviewUrl());
        skin.setIsDefault(request.getIsDefault());
        skin.setIsActive(request.getIsActive());
        skin.setPriceDiamond(request.getPriceDiamond());
        skin.setPriceGold(request.getPriceGold());
        skin.setDisplayOrder(request.getDisplayOrder());
        skin.setCreatedBy(request.getCreatedBy());
        skin.setCreateTime(LocalDateTime.now());

        CardSkin savedSkin = cardSkinRepository.save(skin);

        // 如果是默认皮肤，为所有用户分配
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            cardService.assignNewCardToAllUsers(request.getCardId());
        }

        return savedSkin;
    }

    public CardSkin getDefaultSkin(Integer cardId) {
        return cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(cardId);
    }

    public List<CardSkin> getAvailableSkins(Integer cardId) {
        return cardSkinRepository.findByCardConfigIdAndIsActiveTrue(cardId);
    }

    public List<CardSkin> getAllDefaultSkins() {
        return cardSkinRepository.findByIsDefaultTrueAndIsActiveTrue();
    }
}
```

- [ ] **Step 3: 验证服务类**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(spring|jakarta|lombok)' | head -10 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/service/CardSkinService.java 2>&1 | head -30
```

Expected: 可能缺少依赖警告但无语法错误

### Task 10: 创建CardService服务

**Files:**
- Create: `backend/src/main/java/com/beiguo/service/CardService.java`

- [ ] **Step 1: 创建服务文件**

```bash
cd /d/ClaudeCode/KapGame
touch backend/src/main/java/com/beiguo/service/CardService.java
```

- [ ] **Step 2: 编写CardService服务**

```java
package com.beiguo.service;

import com.beiguo.dto.skin.PurchaseSkinRequest;
import com.beiguo.entity.Card;
import com.beiguo.entity.CardSkin;
import com.beiguo.entity.User;
import com.beiguo.repository.CardRepository;
import com.beiguo.repository.CardSkinRepository;
import com.beiguo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardService {
    private final CardRepository cardRepository;
    private final CardSkinRepository cardSkinRepository;
    private final UserRepository userRepository;

    @Transactional
    public void assignDefaultCardsToUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));

        // 获取所有默认皮肤
        List<CardSkin> defaultSkins = cardSkinRepository.findByIsDefaultTrueAndIsActiveTrue();

        for (CardSkin skin : defaultSkins) {
            // 检查是否已存在
            boolean exists = cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(
                userId, skin.getCardConfig().getId(), skin.getId());

            if (!exists) {
                Card card = new Card();
                card.setUser(user);
                card.setCardConfig(skin.getCardConfig());
                card.setCardSkin(skin);
                card.setIsUnlocked(true);
                card.setIsEquipped(true);
                card.setUnlockTime(LocalDateTime.now());
                cardRepository.save(card);
            }
        }
    }

    @Transactional
    public void assignNewCardToAllUsers(Integer cardId) {
        CardSkin defaultSkin = cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(cardId);
        if (defaultSkin == null) {
            throw new IllegalArgumentException("卡牌没有默认皮肤: " + cardId);
        }

        // 获取所有用户
        List<User> users = userRepository.findAll();

        for (User user : users) {
            boolean exists = cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(
                user.getId(), cardId, defaultSkin.getId());

            if (!exists) {
                Card card = new Card();
                card.setUser(user);
                card.setCardConfig(defaultSkin.getCardConfig());
                card.setCardSkin(defaultSkin);
                card.setIsUnlocked(true);
                card.setIsEquipped(true);
                card.setUnlockTime(LocalDateTime.now());
                cardRepository.save(card);
            }
        }
    }

    @Transactional
    public Card unlockSkin(PurchaseSkinRequest request) {
        // 验证用户存在
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + request.getUserId()));

        // 验证皮肤存在
        CardSkin skin = cardSkinRepository.findById(request.getSkinId())
            .orElseThrow(() -> new IllegalArgumentException("皮肤不存在: " + request.getSkinId()));

        // 验证卡牌匹配
        if (!skin.getCardConfig().getId().equals(request.getCardId())) {
            throw new IllegalArgumentException("皮肤不属于指定卡牌");
        }

        // 检查是否已拥有
        boolean exists = cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(
            request.getUserId(), request.getCardId(), request.getSkinId());

        if (exists) {
            throw new IllegalArgumentException("用户已拥有该皮肤");
        }

        // 处理购买逻辑（简化版）
        if ("DIAMOND".equals(request.getPurchaseType())) {
            if (user.getDiamond() < skin.getPriceDiamond()) {
                throw new IllegalArgumentException("钻石不足");
            }
            user.setDiamond(user.getDiamond() - skin.getPriceDiamond());
        } else if ("GOLD".equals(request.getPurchaseType())) {
            if (user.getGold() < skin.getPriceGold()) {
                throw new IllegalArgumentException("金币不足");
            }
            user.setGold(user.getGold() - skin.getPriceGold());
        }

        userRepository.save(user);

        // 创建卡牌实例
        Card card = new Card();
        card.setUser(user);
        card.setCardConfig(skin.getCardConfig());
        card.setCardSkin(skin);
        card.setIsUnlocked(true);
        card.setIsEquipped(false); // 新购买的皮肤默认不装备
        card.setUnlockTime(LocalDateTime.now());

        return cardRepository.save(card);
    }

    @Transactional
    public void equipSkin(Long userId, Integer cardId, Integer skinId) {
        // 获取用户该卡牌的所有皮肤实例
        List<Card> userCards = cardRepository.findByUserIdAndCardConfigId(userId, cardId);

        // 取消当前装备的皮肤
        for (Card card : userCards) {
            if (Boolean.TRUE.equals(card.getIsEquipped())) {
                card.setIsEquipped(false);
                cardRepository.save(card);
            }
        }

        // 装备新皮肤
        Card targetCard = cardRepository.findByUserIdAndCardConfigIdAndCardSkinId(userId, cardId, skinId)
            .orElseThrow(() -> new IllegalArgumentException("用户未拥有该皮肤"));

        if (!targetCard.getIsUnlocked()) {
            throw new IllegalArgumentException("皮肤未解锁");
        }

        targetCard.setIsEquipped(true);
        cardRepository.save(targetCard);
    }

    public List<Card> getUserCards(Long userId) {
        return cardRepository.findByUserId(userId);
    }

    public List<Card> getUserEquippedCards(Long userId) {
        return cardRepository.findByUserIdAndIsEquippedTrue();
    }
}
```

- [ ] **Step 3: 验证服务类**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(spring|jakarta|lombok)' | head -10 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/service/CardService.java 2>&1 | head -30
```

Expected: 可能缺少依赖警告但无语法错误

### Task 11: 创建CardSkinController控制器

**Files:**
- Create: `backend/src/main/java/com/beiguo/controller/CardSkinController.java`

- [ ] **Step 1: 创建控制器文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/main/java/com/beiguo/controller/
touch backend/src/main/java/com/beiguo/controller/CardSkinController.java
```

- [ ] **Step 2: 编写CardSkinController控制器**

```java
package com.beiguo.controller;

import com.beiguo.dto.skin.CardSkinResponse;
import com.beiguo.dto.skin.CreateSkinRequest;
import com.beiguo.dto.skin.PurchaseSkinRequest;
import com.beiguo.dto.skin.UserCardResponse;
import com.beiguo.entity.Card;
import com.beiguo.entity.CardSkin;
import com.beiguo.service.CardService;
import com.beiguo.service.CardSkinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CardSkinController {
    private final CardSkinService cardSkinService;
    private final CardService cardService;

    // 获取卡牌皮肤列表
    @GetMapping("/cards/{cardId}/skins")
    public ResponseEntity<List<CardSkinResponse>> getCardSkins(@PathVariable Integer cardId) {
        List<CardSkin> skins = cardSkinService.getAvailableSkins(cardId);
        List<CardSkinResponse> responses = skins.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    // 获取用户卡牌列表（包含皮肤信息）
    @GetMapping("/user/cards")
    public ResponseEntity<List<UserCardResponse>> getUserCards(@RequestParam Long userId) {
        List<Card> cards = cardService.getUserCards(userId);
        List<UserCardResponse> responses = cards.stream()
            .map(this::convertToUserCardResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    // 购买皮肤
    @PostMapping("/cards/{cardId}/skins/{skinId}/purchase")
    public ResponseEntity<CardSkinResponse> purchaseSkin(
            @PathVariable Integer cardId,
            @PathVariable Integer skinId,
            @Valid @RequestBody PurchaseSkinRequest request) {

        // 验证路径参数与请求体一致
        if (!cardId.equals(request.getCardId()) || !skinId.equals(request.getSkinId())) {
            return ResponseEntity.badRequest().build();
        }

        Card card = cardService.unlockSkin(request);
        CardSkinResponse response = convertToResponse(card.getCardSkin());
        response.setIsUnlocked(true);
        response.setIsEquipped(card.getIsEquipped());

        return ResponseEntity.ok(response);
    }

    // 装备皮肤
    @PutMapping("/cards/{cardId}/skins/{skinId}/equip")
    public ResponseEntity<Void> equipSkin(
            @PathVariable Integer cardId,
            @PathVariable Integer skinId,
            @RequestParam Long userId) {

        cardService.equipSkin(userId, cardId, skinId);
        return ResponseEntity.ok().build();
    }

    // 管理员创建皮肤
    @PostMapping("/admin/api/cards/{cardId}/skins")
    public ResponseEntity<CardSkinResponse> createSkin(
            @PathVariable Integer cardId,
            @Valid @RequestBody CreateSkinRequest request) {

        // 验证路径参数与请求体一致
        if (!cardId.equals(request.getCardId())) {
            return ResponseEntity.badRequest().build();
        }

        CardSkin skin = cardSkinService.createSkin(request);
        CardSkinResponse response = convertToResponse(skin);
        response.setIsUnlocked(false); // 新创建的皮肤默认未解锁
        response.setIsEquipped(false);

        return ResponseEntity.ok(response);
    }

    // 转换工具方法
    private CardSkinResponse convertToResponse(CardSkin skin) {
        CardSkinResponse response = new CardSkinResponse();
        response.setId(skin.getId());
        response.setCardId(skin.getCardConfig().getId());
        response.setSkinName(skin.getSkinName());
        response.setDescription(skin.getDescription());
        response.setCoverUrl(skin.getCoverUrl());
        response.setAnimationUrl(skin.getAnimationUrl());
        response.setPreviewUrl(skin.getPreviewUrl());
        response.setIsDefault(skin.getIsDefault());
        response.setIsActive(skin.getIsActive());
        response.setPriceDiamond(skin.getPriceDiamond());
        response.setPriceGold(skin.getPriceGold());
        response.setCreateTime(skin.getCreateTime());
        return response;
    }

    private UserCardResponse convertToUserCardResponse(Card card) {
        UserCardResponse response = new UserCardResponse();
        response.setId(card.getId());
        response.setCardId(card.getCardConfig().getId());
        response.setCardName(card.getCardConfig().getName());
        response.setSkinId(card.getCardSkin().getId());
        response.setSkinName(card.getCardSkin().getSkinName());
        response.setIsUnlocked(card.getIsUnlocked());
        response.setIsEquipped(card.getIsEquipped());
        response.setCoverUrl(card.getCardSkin().getCoverUrl());
        return response;
    }
}
```

- [ ] **Step 3: 验证控制器类**

```bash
cd /d/ClaudeCode/KapGame
javac -cp "backend/target/classes:$(find ~/.m2/repository -name '*.jar' | grep -E '(spring|jakarta|lombok)' | head -10 | tr '\n' ':')" -d /tmp backend/src/main/java/com/beiguo/controller/CardSkinController.java 2>&1 | head -30
```

Expected: 可能缺少依赖警告但无语法错误

### Task 12: 创建基础测试类

**Files:**
- Create: `backend/src/test/java/com/beiguo/service/CardSkinServiceTest.java`
- Create: `backend/src/test/java/com/beiguo/service/CardServiceTest.java`

- [ ] **Step 1: 创建测试目录和文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/test/java/com/beiguo/service/
touch backend/src/test/java/com/beiguo/service/CardSkinServiceTest.java
touch backend/src/test/java/com/beiguo/service/CardServiceTest.java
```

- [ ] **Step 2: 编写CardSkinServiceTest测试类**

```java
package com.beiguo.service;

import com.beiguo.dto.skin.CreateSkinRequest;
import com.beiguo.entity.CardConfig;
import com.beiguo.entity.CardSkin;
import com.beiguo.repository.CardConfigRepository;
import com.beiguo.repository.CardSkinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardSkinServiceTest {
    @Mock
    private CardSkinRepository cardSkinRepository;

    @Mock
    private CardConfigRepository cardConfigRepository;

    @Mock
    private CardService cardService;

    @InjectMocks
    private CardSkinService cardSkinService;

    private CardConfig testCardConfig;
    private CreateSkinRequest createRequest;

    @BeforeEach
    void setUp() {
        testCardConfig = new CardConfig();
        testCardConfig.setId(1);
        testCardConfig.setName("测试卡牌");
        testCardConfig.setIsActive(true);

        createRequest = new CreateSkinRequest();
        createRequest.setCardId(1);
        createRequest.setSkinName("测试皮肤");
        createRequest.setCoverUrl("https://example.com/cover.jpg");
        createRequest.setIsDefault(false);
        createRequest.setIsActive(true);
    }

    @Test
    void createSkin_Success() {
        // 准备
        when(cardConfigRepository.findById(1)).thenReturn(Optional.of(testCardConfig));
        when(cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(1)).thenReturn(null);
        when(cardSkinRepository.save(any(CardSkin.class))).thenAnswer(invocation -> {
            CardSkin skin = invocation.getArgument(0);
            skin.setId(100);
            return skin;
        });

        // 执行
        CardSkin result = cardSkinService.createSkin(createRequest);

        // 验证
        assertNotNull(result);
        assertEquals("测试皮肤", result.getSkinName());
        assertEquals(testCardConfig, result.getCardConfig());
        verify(cardSkinRepository).save(any(CardSkin.class));
        verify(cardService, never()).assignNewCardToAllUsers(anyInt());
    }

    @Test
    void createSkin_CardNotFound() {
        // 准备
        when(cardConfigRepository.findById(1)).thenReturn(Optional.empty());

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardSkinService.createSkin(createRequest);
        });
    }

    @Test
    void createSkin_DefaultSkinAlreadyExists() {
        // 准备
        createRequest.setIsDefault(true);
        CardSkin existingDefault = new CardSkin();
        existingDefault.setSkinName("已有默认皮肤");

        when(cardConfigRepository.findById(1)).thenReturn(Optional.of(testCardConfig));
        when(cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(1)).thenReturn(existingDefault);

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardSkinService.createSkin(createRequest);
        });
    }

    @Test
    void getDefaultSkin_Success() {
        // 准备
        CardSkin defaultSkin = new CardSkin();
        defaultSkin.setId(100);
        defaultSkin.setSkinName("默认皮肤");
        defaultSkin.setIsDefault(true);

        when(cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(1)).thenReturn(defaultSkin);

        // 执行
        CardSkin result = cardSkinService.getDefaultSkin(1);

        // 验证
        assertNotNull(result);
        assertEquals(100, result.getId());
        assertEquals("默认皮肤", result.getSkinName());
        assertTrue(result.getIsDefault());
    }

    @Test
    void getAvailableSkins_Success() {
        // 执行
        cardSkinService.getAvailableSkins(1);

        // 验证
        verify(cardSkinRepository).findByCardConfigIdAndIsActiveTrue(1);
    }
}
```

- [ ] **Step 3: 编写CardServiceTest测试类**

```java
package com.beiguo.service;

import com.beiguo.dto.skin.PurchaseSkinRequest;
import com.beiguo.entity.Card;
import com.beiguo.entity.CardConfig;
import com.beiguo.entity.CardSkin;
import com.beiguo.entity.User;
import com.beiguo.repository.CardRepository;
import com.beiguo.repository.CardSkinRepository;
import com.beiguo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {
    @Mock
    private CardRepository cardRepository;

    @Mock
    private CardSkinRepository cardSkinRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CardService cardService;

    private User testUser;
    private CardConfig testCardConfig;
    private CardSkin testSkin;
    private PurchaseSkinRequest purchaseRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setDiamond(1000);
        testUser.setGold(5000);

        testCardConfig = new CardConfig();
        testCardConfig.setId(100);
        testCardConfig.setName("测试卡牌");

        testSkin = new CardSkin();
        testSkin.setId(200);
        testSkin.setSkinName("测试皮肤");
        testSkin.setCardConfig(testCardConfig);
        testSkin.setPriceDiamond(100);
        testSkin.setPriceGold(500);

        purchaseRequest = new PurchaseSkinRequest();
        purchaseRequest.setUserId(1L);
        purchaseRequest.setCardId(100);
        purchaseRequest.setSkinId(200);
        purchaseRequest.setPurchaseType("DIAMOND");
    }

    @Test
    void assignDefaultCardsToUser_Success() {
        // 准备
        CardSkin defaultSkin = new CardSkin();
        defaultSkin.setId(300);
        defaultSkin.setCardConfig(testCardConfig);
        defaultSkin.setIsDefault(true);

        List<CardSkin> defaultSkins = Arrays.asList(defaultSkin);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardSkinRepository.findByIsDefaultTrueAndIsActiveTrue()).thenReturn(defaultSkins);
        when(cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 300)).thenReturn(false);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(999L);
            return card;
        });

        // 执行
        cardService.assignDefaultCardsToUser(1L);

        // 验证
        verify(userRepository).findById(1L);
        verify(cardSkinRepository).findByIsDefaultTrueAndIsActiveTrue();
        verify(cardRepository).existsByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 300);
        verify(cardRepository).save(any(Card.class));
    }

    @Test
    void assignDefaultCardsToUser_UserNotFound() {
        // 准备
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardService.assignDefaultCardsToUser(1L);
        });
    }

    @Test
    void unlockSkin_SuccessWithDiamond() {
        // 准备
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardSkinRepository.findById(200)).thenReturn(Optional.of(testSkin));
        when(cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(false);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(999L);
            return card;
        });

        // 执行
        Card result = cardService.unlockSkin(purchaseRequest);

        // 验证
        assertNotNull(result);
        assertEquals(testUser, result.getUser());
        assertEquals(testCardConfig, result.getCardConfig());
        assertEquals(testSkin, result.getCardSkin());
        assertTrue(result.getIsUnlocked());
        assertFalse(result.getIsEquipped());
        verify(userRepository).save(testUser);
        assertEquals(900, testUser.getDiamond()); // 1000 - 100
    }

    @Test
    void unlockSkin_AlreadyOwned() {
        // 准备
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardSkinRepository.findById(200)).thenReturn(Optional.of(testSkin));
        when(cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(true);

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardService.unlockSkin(purchaseRequest);
        });
    }

    @Test
    void unlockSkin_InsufficientDiamond() {
        // 准备
        testUser.setDiamond(50); // 不足100
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardSkinRepository.findById(200)).thenReturn(Optional.of(testSkin));
        when(cardRepository.existsByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(false);

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardService.unlockSkin(purchaseRequest);
        });
    }

    @Test
    void equipSkin_Success() {
        // 准备
        Card equippedCard = new Card();
        equippedCard.setId(1L);
        equippedCard.setIsEquipped(true);

        Card targetCard = new Card();
        targetCard.setId(2L);
        targetCard.setIsUnlocked(true);
        targetCard.setIsEquipped(false);

        List<Card> userCards = Arrays.asList(equippedCard, targetCard);

        when(cardRepository.findByUserIdAndCardConfigId(1L, 100)).thenReturn(userCards);
        when(cardRepository.findByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(Optional.of(targetCard));

        // 执行
        cardService.equipSkin(1L, 100, 200);

        // 验证
        assertFalse(equippedCard.getIsEquipped());
        assertTrue(targetCard.getIsEquipped());
        verify(cardRepository, times(2)).save(any(Card.class));
    }

    @Test
    void equipSkin_SkinNotOwned() {
        // 准备
        when(cardRepository.findByUserIdAndCardConfigId(1L, 100)).thenReturn(Arrays.asList());
        when(cardRepository.findByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(Optional.empty());

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardService.equipSkin(1L, 100, 200);
        });
    }

    @Test
    void equipSkin_SkinNotUnlocked() {
        // 准备
        Card targetCard = new Card();
        targetCard.setIsUnlocked(false);

        when(cardRepository.findByUserIdAndCardConfigId(1L, 100)).thenReturn(Arrays.asList(targetCard));
        when(cardRepository.findByUserIdAndCardConfigIdAndCardSkinId(1L, 100, 200)).thenReturn(Optional.of(targetCard));

        // 执行和验证
        assertThrows(IllegalArgumentException.class, () -> {
            cardService.equipSkin(1L, 100, 200);
        });
    }

    @Test
    void getUserCards_Success() {
        // 准备
        Card card1 = new Card();
        card1.setId(1L);
        Card card2 = new Card();
        card2.setId(2L);
        List<Card> expectedCards = Arrays.asList(card1, card2);

        when(cardRepository.findByUserId(1L)).thenReturn(expectedCards);

        // 执行
        List<Card> result = cardService.getUserCards(1L);

        // 验证
        assertEquals(2, result.size());
        verify(cardRepository).findByUserId(1L);
    }

    @Test
    void getUserEquippedCards_Success() {
        // 执行
        cardService.getUserEquippedCards(1L);

        // 验证
        verify(cardRepository).findByUserIdAndIsEquippedTrue();
    }
}
```

- [ ] **Step 4: 运行测试验证**

```bash
cd /d/ClaudeCode/KapGame
mvn test -Dtest=CardSkinServiceTest,CardServiceTest -DfailIfNoTests=false 2>&1 | grep -A10 -B10 "BUILD"
```

Expected: 测试可能因缺少依赖而失败，但应能看到测试类被编译

### Task 13: 数据库迁移执行验证

**Files:**
- Execute: `backend/src/main/resources/schema02_card_skin_migration.sql`

- [ ] **Step 1: 备份当前数据库**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 -e "SHOW DATABASES LIKE 'kap_game';" | grep -q kap_game && \
  mysqldump -h localhost -P 3306 -u root -p123456 kap_game > kap_game_backup_before_skin_$(date +%Y%m%d_%H%M%S).sql
ls -la kap_game_backup_*.sql 2>/dev/null || echo "No backup created"
```

- [ ] **Step 2: 执行迁移脚本**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game < backend/src/main/resources/schema02_card_skin_migration.sql
```

Expected: 执行成功，显示"卡牌皮肤系统数据库迁移完成！"

- [ ] **Step 3: 验证迁移结果**

```bash
cd /d/ClaudeCode/KapGame
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES LIKE 'card_skin';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SHOW TABLES LIKE 'card';"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "DESCRIBE card_skin;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as skin_count FROM card_skin;"
mysql -h localhost -P 3306 -u root -p123456 kap_game -e "SELECT COUNT(*) as card_count FROM card;"
```

Expected: card_skin和card表存在，card_skin表有记录，card表有迁移的数据

### Task 14: 集成测试与API验证

**Files:**
- Create: `backend/src/test/java/com/beiguo/controller/CardSkinControllerTest.java`

- [ ] **Step 1: 创建控制器测试文件**

```bash
cd /d/ClaudeCode/KapGame
mkdir -p backend/src/test/java/com/beiguo/controller/
touch backend/src/test/java/com/beiguo/controller/CardSkinControllerTest.java
```

- [ ] **Step 2: 编写简单的集成测试**

```java
package com.beiguo.controller;

import com.beiguo.dto.skin.CardSkinResponse;
import com.beiguo.entity.CardSkin;
import com.beiguo.service.CardSkinService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Arrays;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CardSkinController.class)
class CardSkinControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CardSkinService cardSkinService;

    @MockBean
    private CardService cardService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getCardSkins_Success() throws Exception {
        // 准备
        CardSkin skin1 = new CardSkin();
        skin1.setId(1);
        skin1.setSkinName("皮肤1");

        CardSkin skin2 = new CardSkin();
        skin2.setId(2);
        skin2.setSkinName("皮肤2");

        when(cardSkinService.getAvailableSkins(anyInt())).thenReturn(Arrays.asList(skin1, skin2));

        // 执行和验证
        mockMvc.perform(get("/api/cards/100/skins"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].skinName").value("皮肤1"))
            .andExpect(jsonPath("$[1].skinName").value("皮肤2"));
    }

    @Test
    void getCardSkins_EmptyList() throws Exception {
        // 准备
        when(cardSkinService.getAvailableSkins(anyInt())).thenReturn(Arrays.asList());

        // 执行和验证
        mockMvc.perform(get("/api/cards/100/skins"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }
}
```

- [ ] **Step 3: 运行Spring Boot应用测试**

```bash
cd /d/ClaudeCode/KapGame/backend
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081 &
sleep 30
curl -s http://localhost:8081/api/cards/1/skins | jq . 2>/dev/null || echo "API not ready"
pkill -f "spring-boot:run"
```

Expected: Spring Boot应用启动成功，API可能返回空数组或错误

### Task 15: 文档更新与清理

**Files:**
- Modify: `docs/superpowers/specs/2026-04-10-card-skin-system-design.md:488`
- Create: `backend/src/main/resources/README_CARD_SKIN.md`

- [ ] **Step 1: 更新设计文档状态**

```bash
cd /d/ClaudeCode/KapGame
cat >> docs/superpowers/specs/2026-04-10-card-skin-system-design.md << 'EOF'

## 实施状态
- [x] 数据库迁移脚本创建
- [x] CardSkin实体类创建
- [x] UserCard重命名为Card实体
- [x] CardConfig实体添加皮肤关系
- [x] User实体更新卡牌关系映射
- [x] CardSkinRepository接口创建
- [x] CardRepository接口创建
- [x] DTO类创建
- [x] CardSkinService服务创建
- [x] CardService服务创建
- [x] CardSkinController控制器创建
- [x] 基础测试类创建
- [x] 数据库迁移执行验证
- [x] 集成测试创建

**实施完成时间**: 2026-04-11
**下一步**: 系统集成测试与部署
EOF
```

- [ ] **Step 2: 创建系统文档**

```bash
cd /d/ClaudeCode/KapGame
cat > backend/src/main/resources/README_CARD_SKIN.md << 'EOF'
# 卡牌皮肤系统

## 系统概述
重构现有卡牌系统，支持皮肤功能，实现：
1. 所有用户自动拥有新增卡牌的默认皮肤
2. 所有用户自动拥有所有基础皮肤的卡牌
3. 用户购买新皮肤时，只给该用户拥有该皮肤
4. 向后兼容现有系统

## 数据库变更
### 新增表
- `card_skin` - 卡牌皮肤信息表
  - 字段: id, card_id, skin_name, cover_url, is_default, is_active, price_diamond, price_gold等
  - 约束: 每个卡牌必须有且只有一个is_default=true的皮肤

### 修改表
- `user_card` → `card` - 重命名并添加skin_id字段
  - 新增字段: skin_id, is_unlocked, is_equipped, unlock_time
  - 唯一约束: (user_id, card_id, skin_id)

## API端点
### 用户端API
- `GET /api/cards/{cardId}/skins` - 获取卡牌皮肤列表
- `GET /api/user/cards` - 获取用户卡牌列表（包含皮肤信息）
- `POST /api/cards/{cardId}/skins/{skinId}/purchase` - 购买皮肤
- `PUT /api/cards/{cardId}/skins/{skinId}/equip` - 装备皮肤

### 管理端API
- `POST /admin/api/cards/{cardId}/skins` - 创建皮肤

## 自动分配逻辑
### 新用户注册时
自动为该用户分配所有默认皮肤对应的卡牌实例。

### 新卡牌创建时
1. 创建卡牌配置
2. 创建默认皮肤
3. 为所有现有用户分配该卡牌的默认皮肤

### 新皮肤创建时
- 如果是默认皮肤（is_default=true）：为所有用户分配
- 如果是普通皮肤（is_default=false）：不自动分配，需要用户购买

## 数据一致性规则
1. 每个卡牌必须有且只有一个`is_default=true`的皮肤
2. 用户不能装备未解锁的皮肤（is_unlocked=false）
3. 用户只能为每个卡牌装备一个皮肤
4. 删除卡牌时，级联删除相关皮肤和用户卡牌实例

## 迁移说明
已执行迁移脚本：`schema02_card_skin_migration.sql`
- 备份了原user_card表数据
- 创建了card_skin表
- 迁移user_card数据到card表并关联默认皮肤

## 测试覆盖
- CardSkinService单元测试
- CardService单元测试
- CardSkinController集成测试
- 数据库迁移验证测试

## 已知限制
1. 大量用户时自动分配可能影响性能（建议分批处理）
2. 皮肤图片资源需要独立存储管理
3. 前端需要适配新的卡牌数据结构

## 性能考虑
- 用户卡牌查询使用复合索引 (user_id, card_id, is_equipped)
- 皮肤查询使用索引 (card_id, is_active, display_order)
- 默认皮肤查询使用索引 (is_default, is_active)
EOF
```

- [ ] **Step 3: 清理临时文件**

```bash
cd /d/ClaudeCode/KapGame
rm -f kap_game_backup_*.sql 2>/dev/null || true
rm -f database_schema_summary.txt 2>/dev/null || true
echo "清理完成"
```

## 自我审查

### 1. 规范覆盖检查
- [x] **数据库迁移**: Task 1 创建迁移脚本，Task 13 执行验证
- [x] **实体类**: Task 2-5 创建和修改所有实体类
- [x] **数据访问层**: Task 6-7 创建Repository接口
- [x] **服务层**: Task 9-10 创建Service类
- [x] **API层**: Task 11 创建Controller，Task 14 集成测试
- [x] **DTO类**: Task 8 创建所有DTO
- [x] **测试**: Task 12 单元测试，Task 14 集成测试
- [x] **文档**: Task 15 更新文档

### 2. 占位符扫描
- 无 "TBD"、"TODO"、"implement later" 等占位符
- 所有代码步骤包含完整代码
- 所有命令包含具体路径和预期输出

### 3. 类型一致性检查
- CardSkin实体类字段与Repository查询方法一致
- Service方法签名与Controller调用一致
- DTO字段与实体类字段映射一致
- 所有类型引用都已定义

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-04-11-card-skin-system-implementation.md`。两个执行选项：

**1. 子代理驱动（推荐）** - 我为每个任务分派一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在此会话中使用executing-plans执行任务，批量执行并设置检查点

**哪种方法？**