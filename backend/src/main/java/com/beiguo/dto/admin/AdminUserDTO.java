package com.beiguo.dto.admin;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserDTO {
    private Long id;
    private String username;
    private String realName;
    private String email;
    private String phone;
    private RoleDTO role;
    private String status;
    private LocalDateTime lastLoginTime;
    private Integer loginCount;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String createdBy;
    private String updatedBy;
}