-- 活动系统表结构
-- 引擎：InnoDB，字符集：utf8mb4

-- 1. activity 表 - 活动基础信息表
CREATE TABLE IF NOT EXISTS activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    title VARCHAR(100) NOT NULL COMMENT '活动标题',
    description VARCHAR(500) COMMENT '活动描述',
    image_url VARCHAR(500) COMMENT '活动图片URL',
    activity_type VARCHAR(50) NOT NULL COMMENT '活动类型：SIGNIN/RECHARGE/GIFT/DOUBLE',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE/INACTIVE/EXPIRED',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME COMMENT '创建时间',
    update_time DATETIME COMMENT '更新时间',
    last_modified_by VARCHAR(100) COMMENT '修改人',
    last_modified_reason VARCHAR(500) COMMENT '修改原因',
    INDEX idx_type_status (activity_type, status),
    INDEX idx_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动基础信息表';

-- 2. activity_reward 表 - 活动奖励配置表
CREATE TABLE IF NOT EXISTS activity_reward (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    activity_id BIGINT NOT NULL COMMENT '关联活动ID',
    reward_type VARCHAR(50) NOT NULL COMMENT '奖励类型：DIAMOND/GOLD/CARD_SKIN/GIFT_BOX',
    reward_value INT NOT NULL DEFAULT 0 COMMENT '奖励值（数量或物品ID）',
    reward_desc VARCHAR(200) COMMENT '奖励描述（用于显示）',
    condition_type VARCHAR(50) NOT NULL COMMENT '条件类型：DAY/AMOUNT/PRICE',
    condition_value INT NOT NULL DEFAULT 0 COMMENT '条件值（天数/金额）',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME COMMENT '创建时间',
    INDEX idx_activity (activity_id),
    CONSTRAINT fk_reward_activity FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动奖励配置表';

-- 3. user_activity 表 - 用户活动参与记录表
CREATE TABLE IF NOT EXISTS user_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    activity_id BIGINT NOT NULL COMMENT '关联活动ID',
    progress INT NOT NULL DEFAULT 0 COMMENT '当前进度（签到天数/累计充值金额）',
    status VARCHAR(20) DEFAULT 'DOING' COMMENT '状态：DOING/COMPLETED',
    start_time DATETIME COMMENT '参与时间',
    update_time DATETIME COMMENT '更新时间',
    UNIQUE KEY uk_user_activity (user_id, activity_id),
    INDEX idx_user (user_id),
    INDEX idx_activity (activity_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_activity FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户活动参与记录表';

-- 4. user_reward 表 - 用户已领取奖励记录表
CREATE TABLE IF NOT EXISTS user_reward (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    activity_id BIGINT NOT NULL COMMENT '关联活动ID',
    reward_id BIGINT NOT NULL COMMENT '关联奖励ID',
    claim_time DATETIME COMMENT '领取时间',
    UNIQUE KEY uk_user_reward (user_id, reward_id),
    INDEX idx_user (user_id),
    INDEX idx_activity (activity_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_activity FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_reward FOREIGN KEY (reward_id) REFERENCES activity_reward(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已领取奖励记录表';

SELECT '活动系统表结构创建完成！' AS message;
