package com.beiguo.service;

import com.beiguo.entity.Permission;
import com.beiguo.dto.admin.PermissionTreeNode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface PermissionService {

    // CRUD方法
    Permission create(Permission permission);
    Permission update(Long id, Permission permission);
    void delete(Long id);
    Permission getById(Long id);
    List<Permission> getAll();
    Page<Permission> getPage(Pageable pageable);

    // 业务特定方法
    Permission activatePermission(Long id);
    Permission deactivatePermission(Long id);

    // 查询方法
    Permission getByCode(String code);
    List<Permission> getPermissionsByRoleId(Long roleId);
    List<Permission> getPermissionsByUserId(Long userId);

    // 检查方法
    boolean existsByCode(String code);
    boolean isActive(Long id);

    // 权限验证
    boolean userHasPermission(Long userId, String permissionCode);
    boolean userHasAnyPermission(Long userId, List<String> permissionCodes);
    boolean userHasAllPermissions(Long userId, List<String> permissionCodes);

    // 角色权限管理
    List<Permission> addPermissionsToRole(Long roleId, List<Long> permissionIds);
    List<Permission> removePermissionsFromRole(Long roleId, List<Long> permissionIds);

    // 统计方法
    Integer countRolesByPermissionId(Long permissionId);

    // 批量操作
    List<Permission> createBatch(List<Permission> permissions);
    List<Permission> updateBatch(List<Permission> permissions);
    void deleteBatch(List<Long> ids);

    // 树形结构方法
    List<PermissionTreeNode> buildPermissionTree();
    List<PermissionTreeNode> buildPermissionTreeWithRole(Long roleId);
    List<Long> extractCheckedPermissionIds(List<PermissionTreeNode> tree);
}