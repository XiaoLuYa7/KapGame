# 卡牌与皮肤系统设计规范

**日期**: 2026-04-10
**状态**: 已批准
**作者**: Claude Code
**项目**: KapGame 卡牌游戏

## 1. 概述

### 1.1 目标
重构现有卡牌系统，支持皮肤功能，实现：
- 所有用户自动拥有新增卡牌的默认皮肤
- 所有用户自动拥有所有基础皮肤的卡牌
- 用户购买新皮肤时，只给该用户拥有该皮肤
- 向后兼容现有系统

### 1.2 核心变更
1. 重命名 `user_card` 表为 `card` 表
2. 新建 `card_skin` 表存储皮肤信息
3. 实现自动化皮肤分配逻辑
4. 支持皮肤购买与装备功能

## 2. 数据库架构

### 2.1 表结构设计

#### 2.1.1 `card_config` (现有表 - 保持不变)
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(50) | 卡牌名称 |
| description | VARCHAR(200) | 描述 |
| type | VARCHAR(20) | 类型：ATTACK, DEFENSE, UTILITY |
| rarity | VARCHAR(20) | 稀有度：COMMON, RARE, EPIC, LEGENDARY |
| image_url | VARCHAR(500) | 默认图片URL |
| effects | JSON | 效果配置 |
| is_active | BOOLEAN | 是否激活 |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

#### 2.1.2 `card_skin` (新表)
| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| id | INT | 主键 | AUTO_INCREMENT |
| card_id | INT | 卡牌ID | FOREIGN KEY REFERENCES card_config(id) |
| skin_name | VARCHAR(50) | 皮肤名称 | NOT NULL |
| description | VARCHAR(200) | 皮肤描述 | |
| cover_url | VARCHAR(500) | 封面图片URL | NOT NULL |
| animation_url | VARCHAR(500) | 动画URL | |
| preview_url | VARCHAR(500) | 预览图URL | |
| is_default | BOOLEAN | 是否默认皮肤 | DEFAULT FALSE |
| is_active | BOOLEAN | 是否激活 | DEFAULT TRUE |
| price_diamond | INT | 钻石价格 | DEFAULT 0 |
| price_gold | INT | 金币价格 | DEFAULT 0 |
| display_order | INT | 显示顺序 | DEFAULT 0 |
| created_by | VARCHAR(100) | 创建者 | |
| create_time | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| update_time | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

**唯一约束**:
- `uk_card_skin_name` (`card_id`, `skin_name`) - 同一卡牌不能有重复皮肤名
- 每个`card_id`必须有且只有一个`is_default = TRUE`的记录

**索引**:
- `idx_card_active` (`card_id`, `is_active`, `display_order`) - 查询激活皮肤
- `idx_default_active` (`is_default`, `is_active`) - 查询默认皮肤

#### 2.1.3 `card` (从user_card重命名)
| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| id | BIGINT | 主键 | AUTO_INCREMENT |
| user_id | BIGINT | 用户ID | FOREIGN KEY REFERENCES user(id) |
| card_id | INT | 卡牌ID | FOREIGN KEY REFERENCES card_config(id) |
| skin_id | INT | 皮肤ID | FOREIGN KEY REFERENCES card_skin(id) |
| is_unlocked | BOOLEAN | 是否已解锁 | DEFAULT TRUE |
| is_equipped | BOOLEAN | 是否已装备 | DEFAULT TRUE |
| unlock_time | TIMESTAMP | 解锁时间 | DEFAULT CURRENT_TIMESTAMP |
| create_time | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| update_time | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

**唯一约束**:
- `uk_user_card_skin` (`user_id`, `card_id`, `skin_id`) - 每个用户每个卡牌每个皮肤最多一个实例

**索引**:
- `idx_user_card` (`user_id`, `card_id`, `is_equipped`) - 查询用户装备的卡牌
- `idx_user_unlocked` (`user_id`, `is_unlocked`) - 查询用户已解锁的卡牌

### 2.2 实体关系图
```
用户 (user)
    │
    ├─1:N─▶ 卡牌实例 (card)
    │         │
    │         ├─N:1─▶ 卡牌配置 (card_config)
    │         │
    │         └─N:1─▶ 卡牌皮肤 (card_skin)
    │                  │
    │                  └─N:1─▶ 卡牌配置 (card_config)
    │
    └─(通过card实例)─▶ 卡牌皮肤 (card_skin)
```

## 3. 业务逻辑

### 3.1 自动分配规则

#### 3.1.1 新卡牌创建时
```sql
-- 伪代码逻辑
1. 在card_config中插入新卡牌
2. 在card_skin中创建默认皮肤(is_default=true)
3. 为所有现有用户创建card记录:
   INSERT INTO card (user_id, card_id, skin_id, is_unlocked, is_equipped)
   SELECT u.id, new_card_id, default_skin_id, TRUE, TRUE
   FROM user u;
```

#### 3.1.2 新用户注册时
```sql
-- 伪代码逻辑
1. 创建新用户
2. 为所有默认皮肤创建card记录:
   INSERT INTO card (user_id, card_id, skin_id, is_unlocked, is_equipped)
   SELECT new_user_id, cc.id, cs.id, TRUE, TRUE
   FROM card_config cc
   JOIN card_skin cs ON cc.id = cs.card_id
   WHERE cs.is_default = TRUE AND cc.is_active = TRUE;
```

#### 3.1.3 新皮肤创建时
- 如果`is_default=true` → 为所有用户创建card记录
- 如果`is_default=false` → 不自动分配，需要用户购买

### 3.2 皮肤购买逻辑
1. 用户购买皮肤 → 创建新的`card`记录，`is_unlocked=true`
2. 非默认皮肤不自动分配给所有用户
3. 用户可以同时拥有同一个卡牌的多个皮肤实例，但只能装备一个(`is_equipped=true`)

### 3.3 数据一致性规则
1. 每个卡牌必须有且只有一个`is_default=true`的皮肤
2. 用户不能装备未解锁的皮肤(`is_unlocked=false`)
3. 删除卡牌时，级联删除相关皮肤和用户卡牌实例
4. 用户只能为每个卡牌装备一个皮肤

## 4. Java实体类设计

### 4.1 CardSkin.java (新实体)
```java
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
}
```

### 4.2 Card.java (重命名自UserCard)
```java
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
}
```

### 4.3 现有类修改
#### CardConfig.java
```java
// 添加一对多关系
@OneToMany(mappedBy = "cardConfig", cascade = CascadeType.ALL, orphanRemoval = true)
private List<CardSkin> skins = new ArrayList<>();
```

#### User.java
```java
// 更新关系映射
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Card> cards = new ArrayList<>();
```

## 5. 数据访问层设计

### 5.1 Repository接口

#### CardSkinRepository.java
```java
@Repository
public interface CardSkinRepository extends JpaRepository<CardSkin, Integer> {
    List<CardSkin> findByCardConfigId(Integer cardId);
    CardSkin findByCardConfigIdAndIsDefaultTrue(Integer cardId);
    List<CardSkin> findByCardConfigIdAndIsActiveTrue(Integer cardId);
    Optional<CardSkin> findByCardConfigIdAndSkinName(Integer cardId, String skinName);
    List<CardSkin> findByIsDefaultTrueAndIsActiveTrue();
}
```

#### CardRepository.java
```java
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

### 5.2 服务层设计

#### CardSkinService.java
```java
@Service
@RequiredArgsConstructor
public class CardSkinService {
    private final CardSkinRepository cardSkinRepository;

    public CardSkin createSkin(CreateSkinRequest request) {
        // 验证卡牌存在
        // 如果是默认皮肤，确保没有其他默认皮肤
        // 创建皮肤记录
        // 如果是默认皮肤，为所有用户分配
    }

    public CardSkin getDefaultSkin(Integer cardId) {
        return cardSkinRepository.findByCardConfigIdAndIsDefaultTrue(cardId);
    }

    public List<CardSkin> getAvailableSkins(Integer cardId, Long userId) {
        // 返回已解锁皮肤 + 可购买皮肤
    }
}
```

#### CardService.java
```java
@Service
@RequiredArgsConstructor
public class CardService {
    private final CardRepository cardRepository;
    private final CardSkinRepository cardSkinRepository;
    private final UserRepository userRepository;

    public void assignDefaultCardsToUser(Long userId) {
        // 为新用户分配所有默认卡牌皮肤
    }

    public void assignNewCardToAllUsers(Integer cardId) {
        // 新卡牌创建时分配给所有用户
    }

    public Card unlockSkin(Long userId, Integer cardId, Integer skinId) {
        // 用户购买/解锁皮肤
    }

    public void equipSkin(Long userId, Integer cardId, Integer skinId) {
        // 用户装备皮肤
        // 1. 取消当前装备的皮肤
        // 2. 装备新皮肤
    }

    public List<Card> getUserCards(Long userId) {
        return cardRepository.findByUserId(userId);
    }
}
```

## 6. API设计

### 6.1 新增端点

#### 获取卡牌皮肤列表
```
GET /api/cards/{cardId}/skins
响应: List<CardSkinResponse>
```

#### 获取用户卡牌列表（包含皮肤信息）
```
GET /api/user/cards
响应: List<UserCardResponse> (包含皮肤信息)
```

#### 购买皮肤
```
POST /api/cards/{cardId}/skins/{skinId}/purchase
请求: PurchaseSkinRequest
响应: CardResponse
```

#### 装备皮肤
```
PUT /api/cards/{cardId}/skins/{skinId}/equip
响应: SuccessResponse
```

#### 管理员创建皮肤
```
POST /admin/api/cards/{cardId}/skins
请求: CreateSkinRequest
响应: CardSkinResponse
```

### 6.2 数据模型

#### CardSkinResponse
```json
{
  "id": 1,
  "cardId": 101,
  "skinName": "火焰皮肤",
  "description": "火焰特效皮肤",
  "coverUrl": "https://example.com/cover.jpg",
  "animationUrl": "https://example.com/animation.mp4",
  "previewUrl": "https://example.com/preview.jpg",
  "isDefault": true,
  "isActive": true,
  "priceDiamond": 0,
  "priceGold": 100,
  "isUnlocked": true,
  "isEquipped": false
}
```

#### UserCardResponse
```json
{
  "id": 1001,
  "cardId": 101,
  "cardName": "火球术",
  "skinId": 1,
  "skinName": "火焰皮肤",
  "isUnlocked": true,
  "isEquipped": true,
  "coverUrl": "https://example.com/cover.jpg"
}
```

## 7. 迁移策略

### 7.1 数据库迁移步骤
1. **备份数据** - 备份user_card表和相关数据
2. **执行迁移脚本** - 更新schema02_card_skin_migration.sql:
   - 修改表名：`user_card_skin` → `card`
   - 确保每个卡牌有默认皮肤
   - 迁移user_card数据到card表
3. **验证数据完整性** - 检查迁移后数据一致性
4. **执行Java代码更新** - 更新实体类和服务层

### 7.2 迁移脚本关键修改
```sql
-- 修改表名
CREATE TABLE IF NOT EXISTS `card` (
    -- 原user_card_skin结构
);

-- 迁移数据时关联默认皮肤
INSERT INTO `card` (user_id, card_id, skin_id, is_unlocked, is_equipped)
SELECT uc.user_id, uc.card_id, cs.id, TRUE, TRUE
FROM `user_card` uc
INNER JOIN `card_skin` cs ON uc.card_id = cs.card_id AND cs.is_default = TRUE;
```

### 7.3 回滚方案
1. 备份迁移前的user_card表结构
2. 准备回滚脚本恢复原表结构
3. 验证回滚后数据完整性

## 8. 测试计划

### 8.1 单元测试
- CardSkinService单元测试
- CardService单元测试
- Repository层测试

### 8.2 集成测试
- 新用户注册自动分配卡牌测试
- 新卡牌创建自动分配测试
- 皮肤购买流程测试
- 皮肤装备功能测试

### 8.3 数据迁移测试
1. 在测试环境执行完整迁移
2. 验证数据完整性
3. 测试API兼容性
4. 性能测试

## 9. 风险评估与缓解

### 9.1 风险
1. **数据迁移失败** - 用户卡牌数据丢失
2. **性能影响** - 为所有用户分配卡牌可能影响性能
3. **API不兼容** - 前端需要适配新数据结构

### 9.2 缓解措施
1. **数据备份** - 迁移前完整备份，提供回滚方案
2. **分批处理** - 大数据量时分批分配卡牌
3. **版本兼容** - 保持旧API一段时间，逐步迁移

## 10. 成功标准

1. ✅ 所有用户自动拥有新增卡牌的默认皮肤
2. ✅ 所有用户自动拥有所有基础皮肤的卡牌
3. ✅ 用户购买新皮肤时，只给该用户拥有该皮肤
4. ✅ 向后兼容现有卡牌系统
5. ✅ 数据迁移无丢失
6. ✅ 系统性能无明显下降

---
**批准状态**: ✅ 已通过设计评审
**下一步**: 创建详细实施计划