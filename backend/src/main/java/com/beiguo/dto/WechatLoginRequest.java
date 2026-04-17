package com.beiguo.dto;

import lombok.Data;

@Data
public class WechatLoginRequest {
    private String code;
    private String nickName;
    private String avatarUrl;
    // 可以添加其他微信返回的信息，如 openId, unionId 等
}