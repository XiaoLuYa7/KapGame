package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "admin_permission")
@Data
@EqualsAndHashCode(exclude = {"roles"})
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String code; // 权限代码，如：USER:VIEW, USER:EDIT, GAME:MANAGE

    @Column(nullable = false, length = 100)
    private String name; // 权限名称，如：查看用户、编辑用户、管理游戏

    @Column(length = 200)
    private String description; // 权限描述

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "is_page")
    private Boolean isPage = false; // 是否为页面权限（旧字段，保留兼容）

    // 新增字段
    @Column(length = 20)
    private String type = "PAGE"; // ROOT/MENU/PAGE/FUNCTION

    @Column(name = "order_num")
    private Integer orderNum = 0; // 排序号

    @Column(length = 50)
    private String icon; // 菜单图标

    @Column(name = "route_path", length = 100)
    private String routePath; // 路由路径

    @Column(name = "is_deletable")
    private Boolean isDeletable = true; // 是否可删除

    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    private Set<Role> roles = new HashSet<>();

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}