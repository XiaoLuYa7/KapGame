-- 字典表（码表）
CREATE TABLE IF NOT EXISTS `sys_dict` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `category` VARCHAR(100) NOT NULL COMMENT '分类编码',
    `code` VARCHAR(50) NOT NULL COMMENT '码值',
    `value` VARCHAR(200) NOT NULL COMMENT '显示值',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`category`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典表';

-- 初始化数据
INSERT INTO `sys_dict` (`category`, `code`, `value`, `sort_order`) VALUES
-- 是/否
('yes_no', '0', '否', 0),
('yes_no', '1', '是', 1),
-- 活动状态
('activity_status', 'ACTIVE', '进行中', 0),
('activity_status', 'INACTIVE', '已结束', 1),
-- 活动类型
('activity_type', 'SIGNIN', '签到活动', 0),
('activity_type', 'RECHARGE', '充值活动', 1),
('activity_type', 'GIFT', '限时礼包', 2),
('activity_type', 'DOUBLE', '充值双倍', 3),
-- 奖励类型
('reward_type', 'DIAMOND', '钻石', 0),
('reward_type', 'GOLD', '金币', 1),
('reward_type', 'CARD_SKIN', '卡牌皮肤', 2),
('reward_type', 'GIFT_BOX', '礼包', 3),
-- 用户状态
('user_status', 'NORMAL', '正常', 0),
('user_status', 'BANNED', '封禁', 1),
-- 角色状态
('role_status', 'ACTIVE', '启用', 0),
('role_status', 'INACTIVE', '禁用', 1),
-- 充值类型
('recharge_type', 'WECHAT', '微信支付', 0),
('recharge_type', 'ALIPAY', '支付宝', 1),
-- 审核状态
('audit_status', 'PENDING', '待审核', 0),
('audit_status', 'APPROVED', '已通过', 1),
('audit_status', 'REJECTED', '已拒绝', 2),
-- 收益类型
('earning_type', 'SKIN_PURCHASE', '皮肤购买', 0),
('earning_type', 'AD_REVENUE', '广告收入', 1),
('earning_type', 'SPONSOR', '赞助收入', 2),
('earning_type', 'TRAFFIC', '流量收入', 3);
