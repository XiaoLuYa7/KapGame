package com.beiguo.entity;

/**
 * 收益类型枚举
 */
public enum EarningType {
    SKIN_PURCHASE("皮肤购买"),
    AD_REVENUE("广告收入"),
    SPONSOR("赞助收入"),
    TRAFFIC("流量收入");

    private final String description;

    EarningType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
