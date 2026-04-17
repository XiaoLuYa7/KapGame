package com.beiguo.service;

import com.beiguo.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface RoleService {

    // CRUD方法
    Role create(Role role);
    Role update(Long id, Role role);
    void delete(Long id);
    Role getById(Long id);
    List<Role> getAll();
    Page<Role> getPage(Pageable pageable);

    // 业务特定方法
    Role activateRole(Long id);
    Role deactivateRole(Long id);
    Role addPermissionToRole(Long roleId, Long permissionId);
    Role removePermissionFromRole(Long roleId, Long permissionId);
    Role updatePermissions(Long roleId, List<Long> permissionIds);

    // 查询方法
    Role getByName(String name);
    List<Role> getActiveRoles();
    List<Role> getRolesByStatus(String status);
    List<Role> getRolesByUser(Long userId);

    // 检查方法
    boolean existsByName(String name);
    boolean isActive(Long id);
    boolean hasPermission(Long roleId, Long permissionId);

    // 权限管理
    boolean hasPermissionCode(Long roleId, String permissionCode);
    List<String> getPermissionCodesByRoleId(Long roleId);

    // 统计方法
    Integer countActiveRoles();
    Integer countUsersByRoleId(Long roleId);

    // 批量操作
    List<Role> createBatch(List<Role> roles);
    List<Role> updateBatch(List<Role> roles);
    void deleteBatch(List<Long> ids);
}