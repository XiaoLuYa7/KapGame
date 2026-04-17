package com.beiguo.dto.admin;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PermissionDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long parentId;
    private String parentCode;
    private String parentName;
    private Boolean isPage;
    private String type;
    private Integer orderNum;
    private String icon;
    private String routePath;
    private Boolean isDeletable;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String createdBy;
    private String updatedBy;
}