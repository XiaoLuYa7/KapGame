package com.beiguo.dto.admin;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class RoleDTO {
    private Long id;
    private String name;
    private String description;
    private String status;
    private Set<Long> permissionIds;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String createdBy;
    private String updatedBy;

    // 统计信息
    private Integer userCount;
}