package com.beiguo.config;

import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.PermissionRepository;
import com.beiguo.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Configuration
public class DataInitializer {

    @Bean
    @Transactional
    public CommandLineRunner initData(PermissionRepository permissionRepository,
                                      RoleRepository roleRepository) {
        return args -> {
            // 检查是否已经有数据
            if (permissionRepository.count() == 0 && roleRepository.count() == 0) {
                initPermissionsAndRoles(permissionRepository, roleRepository);
            }
        };
    }

    private void initPermissionsAndRoles(PermissionRepository permissionRepository,
                                         RoleRepository roleRepository) {
        // 第一批：创建所有权限节点（parentId 暂不设置）
        // ROOT
        Permission rootPermission = createPermission("ROOT", "后台管理", "系统根节点");
        // 模块父节点
        Permission userModule = createPermission("MODULE:USER", "用户管理", "用户管理模块");
        Permission gameModule = createPermission("MODULE:GAME", "游戏管理", "游戏管理模块");
        Permission cardModule = createPermission("MODULE:CARD", "卡牌管理", "卡牌管理模块");
        Permission activityModule = createPermission("MODULE:ACTIVITY", "活动管理", "活动管理模块");
        Permission systemModule = createPermission("MODULE:SYSTEM", "系统管理", "系统管理模块");
        Permission configModule = createPermission("MODULE:CONFIG", "配置管理", "配置管理模块");
        Permission publishModule = createPermission("MODULE:PUBLISH", "发布管理", "发布管理模块");
        Permission mailModule = createPermission("MODULE:MAIL", "邮件管理", "邮件管理模块");

        // 先保存 ROOT，获取其 ID
        rootPermission = permissionRepository.save(rootPermission);
        // 再保存所有模块父节点（设置 parentId = rootPermission.getId()）
        List<Permission> modulePermissions = Arrays.asList(userModule, gameModule, cardModule, activityModule, systemModule, configModule, publishModule, mailModule);
        for (Permission m : modulePermissions) {
            m.setParentId(rootPermission.getId());
        }
        permissionRepository.saveAll(modulePermissions);

        // 第二批：创建所有叶子权限
        List<Permission> allLeafPermissions = Arrays.asList(
            createPermission("USER:VIEW", "查看用户", "查看用户列表和详情"),
            createPermission("USER:CREATE", "创建用户", "创建新用户"),
            createPermission("USER:EDIT", "编辑用户", "编辑用户信息"),
            createPermission("USER:DELETE", "删除用户", "删除用户"),
            createPermission("USER:STATUS", "用户状态管理", "启用/禁用用户"),
            createPermission("GAME:VIEW", "查看游戏", "查看游戏列表和详情"),
            createPermission("GAME:MANAGE", "管理游戏", "管理游戏配置"),
            createPermission("GAME:STATS", "游戏统计", "查看游戏统计数据"),
            createPermission("CARD:VIEW", "查看卡牌", "查看卡牌列表和详情"),
            createPermission("CARD:CREATE", "创建卡牌", "创建新卡牌"),
            createPermission("CARD:EDIT", "编辑卡牌", "编辑卡牌信息"),
            createPermission("CARD:DELETE", "删除卡牌", "删除卡牌"),
            createPermission("ACTIVITY:VIEW", "查看活动", "查看活动列表和详情"),
            createPermission("ACTIVITY:CREATE", "创建活动", "创建新活动"),
            createPermission("ACTIVITY:EDIT", "编辑活动", "编辑活动信息"),
            createPermission("ACTIVITY:DELETE", "删除活动", "删除活动"),
            createPermission("SYSTEM:DASHBOARD", "仪表板", "访问系统仪表板"),
            createPermission("SYSTEM:SETTINGS", "系统设置", "管理系统设置"),
            createPermission("SYSTEM:LOGS", "日志管理", "查看系统日志"),
            createPermission("CONFIG:VIEW", "查看配置", "查看系统配置"),
            createPermission("CONFIG:EDIT", "编辑配置", "编辑系统配置"),
            createPermission("PUBLISH:VIEW", "查看发布", "查看发布记录"),
            createPermission("PUBLISH:CREATE", "创建发布", "创建新发布"),
            createPermission("PUBLISH:MANAGE", "发布管理", "管理发布流程"),
            createPermission("MAIL:VIEW", "查看邮件", "查看邮件列表和详情"),
            createPermission("MAIL:CREATE", "创建邮件", "创建新邮件"),
            createPermission("MAIL:EDIT", "编辑邮件", "编辑邮件信息"),
            createPermission("MAIL:DELETE", "删除邮件", "删除邮件")
        );

        // 建立父子关系
        Map<String, Permission> moduleMap = new HashMap<>();
        moduleMap.put("USER", userModule);
        moduleMap.put("GAME", gameModule);
        moduleMap.put("CARD", cardModule);
        moduleMap.put("ACTIVITY", activityModule);
        moduleMap.put("SYSTEM", systemModule);
        moduleMap.put("CONFIG", configModule);
        moduleMap.put("PUBLISH", publishModule);

        for (Permission p : allLeafPermissions) {
            String module = p.getCode().split(":")[0];
            Permission parent = moduleMap.get(module);
            if (parent != null) {
                p.setParentId(parent.getId());
            }
        }

        // 保存所有叶子权限
        permissionRepository.saveAll(allLeafPermissions);

        // 收集所有权限（ROOT + 模块父节点 + 叶子节点）
        List<Permission> allPermissions = new ArrayList<>();
        allPermissions.add(rootPermission);
        allPermissions.addAll(modulePermissions);
        allPermissions.addAll(allLeafPermissions);

        // 创建角色并分配权限
        Role superAdminRole = createRole("SUPER_ADMIN", "超级管理员", "拥有所有系统权限");
        Role adminRole = createRole("ADMIN", "管理员", "拥有大部分管理权限");
        Role editorRole = createRole("EDITOR", "编辑", "可以管理内容和配置");
        Role viewerRole = createRole("VIEWER", "查看者", "只能查看内容，不能修改");

        // 超级管理员拥有所有权限
        superAdminRole.setPermissions(new HashSet<>(allPermissions));

        // 管理员（移除 SYSTEM:LOGS）
        Set<Permission> adminPermissions = new HashSet<>(allPermissions);
        adminPermissions.removeIf(p -> p.getCode().equals("SYSTEM:LOGS"));
        adminRole.setPermissions(adminPermissions);

        // 编辑角色：内容管理权限
        Set<Permission> editorPermissions = new HashSet<>();
        editorPermissions.add(permissionRepository.findByCode("MODULE:USER").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("USER:VIEW").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MODULE:GAME").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("GAME:VIEW").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("GAME:MANAGE").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MODULE:CARD").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("CARD:VIEW").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("CARD:CREATE").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("CARD:EDIT").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MODULE:ACTIVITY").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("ACTIVITY:VIEW").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("ACTIVITY:CREATE").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("ACTIVITY:EDIT").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MODULE:MAIL").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MAIL:VIEW").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MAIL:CREATE").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MAIL:EDIT").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("MAIL:DELETE").orElseThrow());
        editorPermissions.add(permissionRepository.findByCode("SYSTEM:DASHBOARD").orElseThrow());
        editorRole.setPermissions(editorPermissions);

        // 查看者角色：只读权限
        Set<Permission> viewerPermissions = new HashSet<>();
        viewerPermissions.add(permissionRepository.findByCode("SYSTEM:DASHBOARD").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("USER:VIEW").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("GAME:VIEW").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("CARD:VIEW").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("ACTIVITY:VIEW").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("CONFIG:VIEW").orElseThrow());
        viewerPermissions.add(permissionRepository.findByCode("PUBLISH:VIEW").orElseThrow());
        viewerRole.setPermissions(viewerPermissions);

        // 保存角色
        roleRepository.saveAll(Arrays.asList(superAdminRole, adminRole, editorRole, viewerRole));
    }

    private Permission createPermission(String code, String name, String description) {
        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName(name);
        permission.setDescription(description);
        permission.setCreatedBy("SYSTEM");
        permission.setUpdatedBy("SYSTEM");
        return permission;
    }

    private Role createRole(String name, String description, String status) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        role.setStatus(status);
        role.setCreatedBy("SYSTEM");
        role.setUpdatedBy("SYSTEM");
        return role;
    }
}