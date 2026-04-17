-- ==================== 数据库schema重构版本 ====================
-- 此脚本会删除所有现有表（如果存在），然后按重构结构重建数据库
-- 重构要点：
-- 1. 卡牌表(card_config)不与用户直接关联，只与皮肤表关联
-- 2. 用户通过皮肤用户关联表(user_skin)与皮肤关联
-- 3. 移除user_card表，用户卡牌收集通过皮肤实现
-- 4. 皮肤表(card_skin)只存储皮肤定义，用户特定数据在user_skin表中
-- 警告：执行此脚本将清除所有现有数据！

-- ==================== 第一部分：删除所有现有表 ====================
-- 按照外键依赖关系的相反顺序删除表

-- 先删除有外键依赖的表
DROP TABLE IF EXISTS `admin_role_permission`;
DROP TABLE IF EXISTS `admin_user`;
DROP TABLE IF EXISTS `user_checkin`;
DROP TABLE IF EXISTS `chat_message`;
DROP TABLE IF EXISTS `user_skin`;
DROP TABLE IF EXISTS `friend_relation`;
DROP TABLE IF EXISTS `player`;
DROP TABLE IF EXISTS `team_member`;
DROP TABLE IF EXISTS `team`;

-- 删除其他表
DROP TABLE IF EXISTS `activity`;
DROP TABLE IF EXISTS `publish_history`;
DROP TABLE IF EXISTS `system_config`;
DROP TABLE IF EXISTS `admin_permission`;
DROP TABLE IF EXISTS `admin_role`;
DROP TABLE IF EXISTS `card_skin`;
DROP TABLE IF EXISTS `card_config`;
DROP TABLE IF EXISTS `game`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `rank_config`;

-- ==================== 第二部分：创建所有表 ====================

-- 用户表（增加rank_level字段关联rank_config）
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `open_id` varchar(100) UNIQUE,
  `nick_name` varchar(100),
  `avatar_url` varchar(500),
  `rank` varchar(50) DEFAULT '青铜 III',
  `rank_level` int DEFAULT 1, -- 关联rank_config.level
  `diamond` int DEFAULT 0,
  `gold` int DEFAULT 0,
  `level` int DEFAULT 1,
  `exp` int DEFAULT 0,
  `total_games` INT DEFAULT 0,
  `win_games` INT DEFAULT 0,
  `friend_count` INT DEFAULT 0,
  `last_login_time` TIMESTAMP NULL,
  `total_online_time` INT DEFAULT 0, -- 单位：分钟
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 等级配置表
CREATE TABLE `rank_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rank_code` varchar(50) NOT NULL UNIQUE,
  `rank_name` varchar(50) NOT NULL,
  `level` int NOT NULL,
  `min_exp` int NOT NULL DEFAULT 0,
  `max_exp` int NOT NULL,
  `icon_url` varchar(500),
  `reward_diamond` int DEFAULT 0,
  `reward_gold` int DEFAULT 0,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 游戏表
CREATE TABLE `game` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL DEFAULT 'WAITING', -- WAITING, PLAYING, FINISHED
  `current_turn` int DEFAULT 0,
  `deck_cards` json DEFAULT ('[]'),
  `discard_pile` json DEFAULT ('[]'),
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 玩家表
CREATE TABLE `player` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `game_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `is_ai` tinyint(1) NOT NULL DEFAULT 0,
  `player_index` int NOT NULL,
  `hp` int NOT NULL DEFAULT 3,
  `hand_cards` json DEFAULT ('[]'),
  `is_alive` tinyint(1) NOT NULL DEFAULT 1,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 卡牌配置表（预定义卡牌）
CREATE TABLE `card_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` VARCHAR(200) DEFAULT '',
  `type` varchar(20) NOT NULL, -- ATTACK, DEFENSE, UTILITY
  `rarity` VARCHAR(20) DEFAULT 'COMMON', -- COMMON, RARE, EPIC, LEGENDARY
  `image_url` VARCHAR(500),
  `mana_cost` INT DEFAULT 0,
  `power` INT DEFAULT 0,
  `health` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` VARCHAR(100) DEFAULT NULL,
  `last_modified_reason` VARCHAR(500) DEFAULT NULL,
  `effects` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 卡牌皮肤表（皮肤定义）
CREATE TABLE `card_skin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `card_id` INT NOT NULL COMMENT '关联card_config.id',
  `skin_name` VARCHAR(50) NOT NULL COMMENT '皮肤名称',
  `description` VARCHAR(200) COMMENT '皮肤描述',
  `cover_url` VARCHAR(500) NOT NULL COMMENT '封面图片URL',
  `animation_url` VARCHAR(500) COMMENT '动画URL',
  `preview_url` VARCHAR(500) COMMENT '预览图URL',
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否默认皮肤',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否激活',
  `price_diamond` INT NOT NULL DEFAULT 0 COMMENT '钻石价格',
  `price_gold` INT NOT NULL DEFAULT 0 COMMENT '金币价格',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  `created_by` VARCHAR(100) COMMENT '创建者',
  `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_skin_name` (`card_id`, `skin_name`),
  CONSTRAINT `fk_card_skin_card_config` FOREIGN KEY (`card_id`) REFERENCES `card_config` (`id`) ON DELETE CASCADE,
  INDEX `idx_card_active` (`card_id`, `is_active`, `display_order`),
  INDEX `idx_default_active` (`is_default`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡牌皮肤配置表';

-- 用户皮肤关联表（用户拥有的皮肤）
CREATE TABLE `user_skin` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '关联user.id',
  `skin_id` INT NOT NULL COMMENT '关联card_skin.id',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '拥有数量',
  `is_equipped` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已装备',
  `purchase_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
  `purchase_type` VARCHAR(20) COMMENT '购买方式：DIAMOND, GOLD, FREE, GIFT',
  `purchase_price` INT DEFAULT 0 COMMENT '实际购买价格',
  `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_skin` (`user_id`, `skin_id`),
  CONSTRAINT `fk_user_skin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_skin_card_skin` FOREIGN KEY (`skin_id`) REFERENCES `card_skin` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_equipped` (`user_id`, `is_equipped`),
  INDEX `idx_skin_users` (`skin_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户拥有的皮肤表';

-- 活动表
CREATE TABLE `activity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` varchar(500),
  `image_url` varchar(500),
  `activity_type` varchar(50) NOT NULL, -- DAILY_LOGIN, WEEKLY_GIFT, EVENT
  `reward_type` varchar(50) NOT NULL, -- DIAMOND, GOLD, CARD, ITEM
  `reward_value` varchar(500), -- JSON格式奖励值
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED
  `sort_order` int DEFAULT 0,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` VARCHAR(100) DEFAULT NULL,
  `last_modified_reason` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 好友关系表
CREATE TABLE `friend_relation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `friend_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, BLOCKED
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY uk_friend_relation (`user_id`, `friend_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统配置表
CREATE TABLE `system_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL UNIQUE,
  `config_value` text,
  `description` varchar(500),
  `is_public` boolean DEFAULT FALSE,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` VARCHAR(100) DEFAULT NULL,
  `last_modified_reason` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 后台管理角色表
CREATE TABLE `admin_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL UNIQUE,
  `description` varchar(100),
  `status` varchar(20) DEFAULT 'ACTIVE',
  `is_system` boolean NOT NULL DEFAULT FALSE,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 后台管理权限表
CREATE TABLE `admin_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `description` varchar(200),
  `category` varchar(20) DEFAULT 'SYSTEM',
  `is_system` boolean NOT NULL DEFAULT FALSE,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `is_page` tinyint(1) DEFAULT 0,
  `type` varchar(20) DEFAULT 'PAGE' COMMENT 'ROOT/MENU/PAGE/FUNCTION',
  `order_num` int DEFAULT 0 COMMENT '排序号',
  `icon` varchar(50) DEFAULT NULL COMMENT '菜单图标',
  `route_path` varchar(100) DEFAULT NULL COMMENT '路由路径',
  `is_deletable` tinyint(1) DEFAULT 1 COMMENT '是否可删除',
  PRIMARY KEY (`id`),
  KEY `idx_permission_parent` (`parent_id`),
  KEY `idx_permission_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 后台角色权限关联表
CREATE TABLE `admin_role_permission` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `admin_role`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `admin_permission`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员表
CREATE TABLE `admin_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role_id` bigint,
  `real_name` varchar(100),
  `email` varchar(100),
  `phone` varchar(20),
  `last_login_time` timestamp NULL,
  `login_count` int DEFAULT 0,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(50),
  `updated_by` varchar(50),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息表（用于聊天功能）
CREATE TABLE `chat_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `message_type` varchar(20) DEFAULT 'TEXT', -- TEXT, IMAGE, SYSTEM
  `content` text NOT NULL,
  `is_read` boolean DEFAULT FALSE,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户签到表
CREATE TABLE `user_checkin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `checkin_date` date NOT NULL,
  `continuous_days` int DEFAULT 1,
  `reward_received` boolean DEFAULT FALSE,
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY uk_user_checkin (`user_id`, `checkin_date`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 发布历史表
CREATE TABLE `publish_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `publish_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `published_by` varchar(100) DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  `config_data` json NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `card_count` int DEFAULT 0,
  `activity_count` int DEFAULT 0,
  `config_count` int DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 战队表
CREATE TABLE `team` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `description` varchar(500),
  `leader_id` bigint NOT NULL,
  `member_count` int DEFAULT 1,
  `total_score` int DEFAULT 0,
  `team_level` int DEFAULT 1,
  `logo_url` varchar(500),
  `max_members` int DEFAULT 50,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `create_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`leader_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 战队成员表
CREATE TABLE `team_member` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `team_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` varchar(20) DEFAULT 'MEMBER',
  `status` varchar(20) DEFAULT 'ACTIVE',
  `join_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `contribution` int DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY uk_team_member (`team_id`, `user_id`),
  FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 第三部分：添加外键约束 ====================

-- 为admin_user表添加role_id外键约束
ALTER TABLE `admin_user`
ADD FOREIGN KEY (`role_id`) REFERENCES `admin_role`(`id`) ON DELETE RESTRICT;

-- 为user表添加rank_level外键约束（可选，关联rank_config.level）
-- ALTER TABLE `user` ADD FOREIGN KEY (`rank_level`) REFERENCES `rank_config`(`level`);

-- ==================== 第四部分：插入初始化数据 ====================

-- 初始化等级配置（15个等级：青铜III到王者）
INSERT INTO `rank_config` (`rank_code`, `rank_name`, `level`, `min_exp`, `max_exp`, `icon_url`, `reward_diamond`, `reward_gold`) VALUES
('BRONZE_III', '青铜III', 1, 0, 100, NULL, 10, 100),
('BRONZE_II', '青铜II', 2, 100, 300, NULL, 20, 200),
('BRONZE_I', '青铜I', 3, 300, 600, NULL, 30, 300),
('SILVER_III', '白银III', 4, 600, 1000, NULL, 40, 400),
('SILVER_II', '白银II', 5, 1000, 1500, NULL, 50, 500),
('SILVER_I', '白银I', 6, 1500, 2100, NULL, 60, 600),
('GOLD_III', '黄金III', 7, 2100, 2800, NULL, 70, 700),
('GOLD_II', '黄金II', 8, 2800, 3600, NULL, 80, 800),
('GOLD_I', '黄金I', 9, 3600, 4500, NULL, 90, 900),
('PLATINUM_III', '铂金III', 10, 4500, 5500, NULL, 100, 1000),
('PLATINUM_II', '铂金II', 11, 5500, 6600, NULL, 110, 1100),
('PLATINUM_I', '铂金I', 12, 6600, 7800, NULL, 120, 1200),
('DIAMOND_III', '钻石III', 13, 7800, 9100, NULL, 130, 1300),
('DIAMOND_II', '钻石II', 14, 9100, 10500, NULL, 140, 1400),
('DIAMOND_I', '钻石I', 15, 10500, 12000, NULL, 150, 1500),
('MASTER', '王者', 16, 12000, 999999, NULL, 200, 2000);

-- 初始化卡牌配置（基础卡牌）
INSERT INTO `card_config` (`name`, `description`, `type`, `rarity`, `mana_cost`, `effects`) VALUES
('Bomb', '爆炸卡牌，触发后造成伤害', 'ATTACK', 'RARE', 2, '[{"type": "EXPLODE"}]'),
('Defuse', '拆除炸弹，保护自己', 'DEFENSE', 'RARE', 2, '[{"type": "DEFUSE_BOMB"}]'),
('Transfer', '转移卡牌给随机对手', 'DEFENSE', 'COMMON', 1, '[{"type": "TRANSFER_CARD", "target": "RANDOM_OPPONENT"}]'),
('DrawTwo', '从牌堆抽取两张卡牌', 'UTILITY', 'COMMON', 0, '[{"type": "DRAW_CARD", "count": 2}]'),
('Skip', '跳过对手的回合', 'UTILITY', 'COMMON', 0, '[{"type": "SKIP_TURN"}]'),
('Peek', '偷看牌堆顶部三张牌', 'UTILITY', 'COMMON', 0, '[{"type": "PEEK_DECK", "count": 3}]'),
('Shuffle', '重新洗牌', 'UTILITY', 'COMMON', 0, '[{"type": "SHUFFLE_DECK"}]'),
('Block', '阻挡一次攻击', 'DEFENSE', 'COMMON', 0, '[{"type": "BLOCK_ATTACK"}]'),
('Reverse', '反转游戏顺序', 'UTILITY', 'COMMON', 0, '[{"type": "REVERSE_ORDER"}]'),
('Steal', '偷取对手一张卡牌', 'ATTACK', 'COMMON', 1, '[{"type": "STEAL_CARD", "target": "RANDOM_OPPONENT"}]');

-- 添加更多休闲卡通风格的卡牌
INSERT INTO `card_config` (`name`, `description`, `type`, `rarity`, `effects`) VALUES
('Rainbow', '彩虹卡，带来好运和随机效果', 'UTILITY', 'EPIC', '[{"type": "RANDOM_EFFECT"}]'),
('Swap', '交换手牌与对手', 'UTILITY', 'RARE', '[{"type": "SWAP_HAND", "target": "RANDOM_OPPONENT"}]'),
('Mirror', '镜像卡，复制对手最后一张卡牌', 'UTILITY', 'RARE', '[{"type": "COPY_CARD", "target": "LAST_PLAYED"}]'),
('Shield', '护盾，抵挡下一次攻击', 'DEFENSE', 'COMMON', '[{"type": "ADD_SHIELD", "count": 1}]'),
('Heal', '治疗卡，恢复1点生命值', 'DEFENSE', 'COMMON', '[{"type": "HEAL", "amount": 1}]'),
('DoubleDraw', '双倍抽卡，抽卡数量翻倍', 'UTILITY', 'COMMON', '[{"type": "DOUBLE_DRAW"}]'),
('TimeWarp', '时间扭曲，再来一个回合', 'UTILITY', 'EPIC', '[{"type": "EXTRA_TURN"}]'),
('Jester', '小丑卡，随机效果娱乐大家', 'UTILITY', 'LEGENDARY', '[{"type": "RANDOM_JESTER"}]'),
('Friendship', '友谊卡，双方各抽一张牌', 'UTILITY', 'COMMON', '[{"type": "DRAW_CARD", "count": 1}, {"type": "OPPONENT_DRAW", "count": 1}]'),
('LuckyCoin', '幸运硬币，50%几率抽卡或造成伤害', 'UTILITY', 'RARE', '[{"type": "LUCKY_COIN"}]');

-- 初始化卡牌皮肤数据（为部分卡牌添加默认皮肤）
INSERT INTO `card_skin` (`card_id`, `skin_name`, `description`, `cover_url`, `is_default`, `price_diamond`, `price_gold`, `display_order`) VALUES
-- Bomb卡牌的默认皮肤
(1, '经典炸弹', '经典的炸弹皮肤', 'https://example.com/skins/bomb_classic.jpg', TRUE, 0, 0, 1),
(1, '黄金炸弹', '闪亮的黄金炸弹皮肤', 'https://example.com/skins/bomb_gold.jpg', FALSE, 100, 1000, 2),
-- Defuse卡牌的默认皮肤
(2, '经典拆除', '经典的拆除工具皮肤', 'https://example.com/skins/defuse_classic.jpg', TRUE, 0, 0, 1),
(2, '钻石拆除', '华丽的钻石拆除工具', 'https://example.com/skins/defuse_diamond.jpg', FALSE, 200, 2000, 2),
-- 其他卡牌的默认皮肤（简化示例）
(3, '经典转移', '转移卡牌经典皮肤', 'https://example.com/skins/transfer_classic.jpg', TRUE, 0, 0, 1),
(4, '经典抽卡', '抽卡经典皮肤', 'https://example.com/skins/drawtwo_classic.jpg', TRUE, 0, 0, 1),
(5, '经典跳过', '跳过经典皮肤', 'https://example.com/skins/skip_classic.jpg', TRUE, 0, 0, 1);

-- 初始化活动数据（使用固定日期）
INSERT INTO `activity` (`title`, `description`, `activity_type`, `reward_type`, `reward_value`, `start_time`, `end_time`) VALUES
('每日登录奖励', '连续登录领取丰厚奖励', 'DAILY_LOGIN', 'DIAMOND', '{"amount": 10}', '2026-04-01 00:00:00', '2026-05-01 00:00:00'),
('每周礼包', '免费卡牌包等你来拿', 'WEEKLY_GIFT', 'CARD', '{"card_id": 1, "count": 1}', '2026-04-01 00:00:00', '2026-04-08 00:00:00'),
('新手福利', '新手专属福利活动', 'EVENT', 'GOLD', '{"amount": 1000}', '2026-04-01 00:00:00', '2026-04-15 00:00:00');

-- 初始化系统配置
INSERT INTO `system_config` (`config_key`, `config_value`, `description`, `is_public`) VALUES
('game_version', '1.0.0', '游戏版本号', TRUE),
('maintenance_mode', 'false', '维护模式开关', TRUE),
('daily_login_reward', '{"diamond": 10, "gold": 100}', '每日登录奖励配置', FALSE),
('rank_thresholds', '{"bronze": 0, "silver": 100, "gold": 500, "platinum": 1000, "diamond": 2000, "master": 5000}', '段位阈值配置', FALSE),
('team_max_members', '50', '战队最大成员数', TRUE),
('team_create_requirement', '{"min_level": 5, "min_diamond": 100}', '创建战队要求', TRUE);

-- 插入后台权限（7个类别，21个权限）
INSERT INTO `admin_permission` (`code`, `name`, `description`, `category`, `is_system`) VALUES
-- 用户管理
('user:view', '查看用户', '查看用户列表和详情', 'USER_MANAGEMENT', TRUE),
('user:edit', '编辑用户', '编辑用户信息', 'USER_MANAGEMENT', TRUE),
('user:delete', '删除用户', '删除用户账号', 'USER_MANAGEMENT', TRUE),

-- 卡牌管理
('card:view', '查看卡牌', '查看卡牌配置列表', 'CARD_MANAGEMENT', TRUE),
('card:edit', '编辑卡牌', '编辑卡牌配置', 'CARD_MANAGEMENT', TRUE),
('card:delete', '删除卡牌', '删除卡牌配置', 'CARD_MANAGEMENT', TRUE),

-- 皮肤管理
('skin:view', '查看皮肤', '查看皮肤配置列表', 'SKIN_MANAGEMENT', TRUE),
('skin:edit', '编辑皮肤', '编辑皮肤配置', 'SKIN_MANAGEMENT', TRUE),
('skin:delete', '删除皮肤', '删除皮肤配置', 'SKIN_MANAGEMENT', TRUE),

-- 活动管理
('activity:view', '查看活动', '查看活动列表', 'ACTIVITY_MANAGEMENT', TRUE),
('activity:edit', '编辑活动', '创建和编辑活动', 'ACTIVITY_MANAGEMENT', TRUE),
('activity:delete', '删除活动', '删除活动', 'ACTIVITY_MANAGEMENT', TRUE),

-- 系统配置
('config:view', '查看配置', '查看系统配置', 'SYSTEM_CONFIG', TRUE),
('config:edit', '编辑配置', '编辑系统配置', 'SYSTEM_CONFIG', TRUE),

-- 战队管理
('team:view', '查看战队', '查看战队列表', 'TEAM_MANAGEMENT', TRUE),
('team:edit', '编辑战队', '编辑战队信息', 'TEAM_MANAGEMENT', TRUE),
('team:delete', '删除战队', '删除/解散战队', 'TEAM_MANAGEMENT', TRUE),

-- 游戏管理
('game:view', '查看游戏', '查看游戏对局', 'GAME_MANAGEMENT', TRUE),
('game:manage', '管理游戏', '管理游戏对局', 'GAME_MANAGEMENT', TRUE),

-- 数据统计
('stats:view', '查看统计', '查看数据统计报表', 'DATA_STATISTICS', TRUE);

-- 插入默认角色（SUPER_ADMIN 和 ADMIN）
INSERT INTO `admin_role` (`name`, `description`, `is_system`, `status`) VALUES
('SUPER_ADMIN', '超级管理员，拥有所有权限', TRUE, 'ACTIVE'),
('ADMIN', '普通管理员，拥有部分权限', TRUE, 'ACTIVE');

-- 为超级管理员角色分配所有权限
INSERT INTO `admin_role_permission` (`role_id`, `permission_id`)
SELECT r.`id`, p.`id`
FROM `admin_role` r
CROSS JOIN `admin_permission` p
WHERE r.`name` = 'SUPER_ADMIN';

-- 为普通管理员角色分配权限（除删除和配置编辑外的所有权限）
INSERT INTO `admin_role_permission` (`role_id`, `permission_id`)
SELECT r.`id`, p.`id`
FROM `admin_role` r
CROSS JOIN `admin_permission` p
WHERE r.`name` = 'ADMIN'
AND p.`code` NOT IN ('user:delete', 'card:delete', 'skin:delete', 'team:delete', 'config:edit');

-- 默认管理员账户 (密码: admin123)
INSERT INTO `admin_user` (`username`, `password`, `role_id`)
SELECT 'admin', '$2a$10$Bpi9JdOeHaH0lnmHrQZ2..Fgvt0aw76Mw0RtMBA1tXKsy9//rGWnq', `id`
FROM `admin_role`
WHERE `name` = 'SUPER_ADMIN';

-- 普通管理员账户 (密码: operator123)
INSERT INTO `admin_user` (`username`, `password`, `role_id`)
SELECT 'operator', '$2a$10$ABCDEFGHIJKLMNOPQRSTUV.abcdefghijklmnopqrstuvwxyz0123456789./', `id`
FROM `admin_role`
WHERE `name` = 'ADMIN';

-- 插入测试用户数据（5个用户）
INSERT INTO `user` (`username`, `password`, `nick_name`, `avatar_url`, `rank`, `rank_level`, `diamond`, `gold`, `level`, `exp`, `total_games`, `win_games`, `friend_count`) VALUES
('player1', 'password1', '游戏高手', 'https://example.com/avatar1.jpg', '黄金II', 8, 1500, 50000, 15, 3200, 120, 85, 45),
('player2', 'password2', '新手玩家', 'https://example.com/avatar2.jpg', '白银I', 6, 300, 15000, 8, 1600, 50, 25, 12),
('player3', 'password3', '卡牌大师', 'https://example.com/avatar3.jpg', '铂金III', 10, 2500, 80000, 22, 4800, 200, 130, 68),
('player4', 'password4', '休闲玩家', 'https://example.com/avatar4.jpg', '青铜I', 3, 100, 5000, 5, 400, 30, 15, 8),
('player5', 'password5', '战队队长', 'https://example.com/avatar5.jpg', '钻石I', 15, 5000, 150000, 30, 11000, 350, 240, 120);

-- 为用户分配默认皮肤（所有用户默认拥有所有默认皮肤）
INSERT INTO `user_skin` (`user_id`, `skin_id`, `quantity`, `is_equipped`, `purchase_type`, `purchase_price`)
SELECT u.`id`, s.`id`, 1, TRUE, 'FREE', 0
FROM `user` u
CROSS JOIN `card_skin` s
WHERE s.`is_default` = TRUE;

-- 插入测试战队数据
INSERT INTO `team` (`name`, `description`, `leader_id`, `member_count`, `total_score`, `team_level`, `logo_url`, `max_members`) VALUES
('精英战士', '高水平的竞技战队，追求胜利和荣誉', 5, 3, 15000, 5, 'https://example.com/team1.jpg', 50),
('休闲玩家', '以娱乐和社交为主的休闲战队', 3, 2, 8000, 3, 'https://example.com/team2.jpg', 30);

-- 插入战队成员数据
INSERT INTO `team_member` (`team_id`, `user_id`, `role`, `contribution`) VALUES
-- 精英战士战队成员
(1, 5, 'LEADER', 5000),  -- 队长
(1, 1, 'DEPUTY', 3000),  -- 副队长
(1, 3, 'MEMBER', 2000),  -- 成员

-- 休闲玩家战队成员
(2, 3, 'LEADER', 3000),  -- 队长
(2, 2, 'MEMBER', 1500);  -- 成员

-- ==================== 第五部分：创建索引 ====================

-- user表索引
CREATE INDEX idx_user_level ON `user` (`level`);
CREATE INDEX idx_user_rank ON `user` (`rank`);
CREATE INDEX idx_user_rank_level ON `user` (`rank_level`);
CREATE INDEX idx_user_total_games ON `user` (`total_games`);
CREATE INDEX idx_user_win_games ON `user` (`win_games`);
CREATE INDEX idx_user_exp ON `user` (`exp`);

-- rank_config表索引
CREATE INDEX idx_rank_config_level ON `rank_config` (`level`);
CREATE INDEX idx_rank_config_exp_range ON `rank_config` (`min_exp`, `max_exp`);

-- card_config表索引
CREATE INDEX idx_card_config_type_rarity_active ON `card_config` (`type`, `rarity`, `is_active`);

-- card_skin表索引
CREATE INDEX idx_card_skin_card_id ON `card_skin` (`card_id`);
CREATE INDEX idx_card_skin_active ON `card_skin` (`is_active`);
CREATE INDEX idx_card_skin_default ON `card_skin` (`is_default`);

-- user_skin表索引
CREATE INDEX idx_user_skin_user_id ON `user_skin` (`user_id`);
CREATE INDEX idx_user_skin_skin_id ON `user_skin` (`skin_id`);
CREATE INDEX idx_user_skin_equipped ON `user_skin` (`is_equipped`);

-- activity表索引
CREATE INDEX idx_activity_status ON `activity` (`status`);
CREATE INDEX idx_activity_time ON `activity` (`start_time`, `end_time`);
CREATE INDEX idx_activity_type ON `activity` (`activity_type`);

-- friend_relation表索引
CREATE INDEX idx_friend_status ON `friend_relation` (`status`);

-- system_config表索引
CREATE INDEX idx_config_key ON `system_config` (`config_key`);

-- admin_user表索引
CREATE INDEX idx_admin_status ON `admin_user` (`status`);
CREATE INDEX idx_admin_user_role_id ON `admin_user` (`role_id`);

-- admin_role表索引
CREATE INDEX idx_admin_role_status ON `admin_role` (`status`);
CREATE INDEX idx_admin_role_system ON `admin_role` (`is_system`);

-- admin_permission表索引
CREATE INDEX idx_admin_permission_category ON `admin_permission` (`category`);
CREATE INDEX idx_admin_permission_system ON `admin_permission` (`is_system`);

-- chat_message表索引
CREATE INDEX idx_chat_conversation ON `chat_message` (`sender_id`, `receiver_id`, `create_time`);
CREATE INDEX idx_chat_unread ON `chat_message` (`receiver_id`, `is_read`, `create_time`);

-- user_checkin表索引
CREATE INDEX idx_checkin_date ON `user_checkin` (`checkin_date`);

-- publish_history表索引
CREATE INDEX idx_publish_version ON `publish_history` (`version`);
CREATE INDEX idx_publish_time ON `publish_history` (`publish_time`);
CREATE INDEX idx_publish_admin ON `publish_history` (`admin_id`);

-- admin_role_permission表索引
CREATE INDEX idx_admin_role_permission_role ON `admin_role_permission` (`role_id`);
CREATE INDEX idx_admin_role_permission_permission ON `admin_role_permission` (`permission_id`);

-- team表索引
CREATE INDEX idx_team_status ON `team` (`status`);
CREATE INDEX idx_team_score ON `team` (`total_score`);
CREATE INDEX idx_team_level ON `team` (`team_level`);
CREATE INDEX idx_team_leader ON `team` (`leader_id`);

-- team_member表索引
CREATE INDEX idx_team_member_role ON `team_member` (`role`);
CREATE INDEX idx_team_member_status ON `team_member` (`status`);
CREATE INDEX idx_team_member_contribution ON `team_member` (`contribution`);

-- ==================== 邮件管理表 ====================
DROP TABLE IF EXISTS `mail_attachment`;
DROP TABLE IF EXISTS `mail_config`;

CREATE TABLE `mail_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `content` text,
  `status` varchar(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/SENT/EXPIRED',
  `target_conditions` json COMMENT 'JSON格式的收件人筛选条件',
  `send_time` datetime DEFAULT NULL,
  `expire_time` datetime DEFAULT NULL,
  `total_recipients` int DEFAULT 0,
  `sent_count` int DEFAULT 0,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `mail_attachment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mail_id` bigint NOT NULL,
  `item_type` varchar(20) NOT NULL COMMENT 'DIAMOND/COIN/SKIN/ITEM',
  `item_code` varchar(50) NOT NULL COMMENT '物品编码或ID',
  `item_name` varchar(100) COMMENT '物品名称',
  `quantity` int NOT NULL DEFAULT 1,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mail_attachment_mail_id` (`mail_id`),
  CONSTRAINT `fk_mail_attachment_mail` FOREIGN KEY (`mail_id`) REFERENCES `mail_config` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 完成提示 ====================
SELECT '数据库重构完成！卡牌表与用户解耦，通过皮肤关联。' AS message;
SELECT '关键设计说明:' AS design_notes;
SELECT '1. card_config表：卡牌定义，不与用户直接关联' AS note_1;
SELECT '2. card_skin表：皮肤定义，关联card_config' AS note_2;
SELECT '3. user_skin表：用户拥有的皮肤，关联user和card_skin' AS note_3;
SELECT '4. 移除user_card表，用户卡牌收集通过皮肤实现' AS note_4;
SELECT '5. 所有用户默认拥有所有卡牌的默认皮肤' AS note_5;
SELECT '6. 用户可以为每个卡牌装备一个皮肤' AS note_6;
SELECT '下一步：1. 更新Java实体类 2. 更新业务逻辑 3. 测试API功能' AS next_steps;


CREATE TABLE earning_record (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL COMMENT 'SKIN_PURCHASE/AD_REVENUE/SPONSOR/TRAFFIC',
      amount DECIMAL(10,2) NOT NULL,
      order_no VARCHAR(64),
      user_id BIGINT,
      username VARCHAR(50),
      description VARCHAR(255),
      earning_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );