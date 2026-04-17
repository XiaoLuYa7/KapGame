package com.beiguo.service.impl;

import com.beiguo.dto.admin.PermissionTreeNode;
import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.PermissionRepository;
import com.beiguo.repository.RoleRepository;
import com.beiguo.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    @Transactional
    public Permission create(Permission permission) {
        // 验证必要字段
        if (permission.getCode() == null || permission.getCode().trim().isEmpty()) {
            throw new RuntimeException("权限代码不能为空");
        }
        if (permission.getName() == null || permission.getName().trim().isEmpty()) {
            throw new RuntimeException("权限名称不能为空");
        }

        // 检查权限代码是否已存在
        if (permissionRepository.existsByCode(permission.getCode())) {
            throw new RuntimeException("权限代码已存在: " + permission.getCode());
        }

        // 保存权限
        return permissionRepository.save(permission);
    }

    @Override
    @Transactional
    public Permission update(Long id, Permission permission) {
        Permission existingPermission = getById(id);

        // 如果权限代码有变化，检查是否已存在
        if (permission.getCode() != null && !permission.getCode().equals(existingPermission.getCode())) {
            if (permissionRepository.existsByCode(permission.getCode())) {
                throw new RuntimeException("权限代码已存在: " + permission.getCode());
            }
            existingPermission.setCode(permission.getCode());
        }

        // 更新其他字段
        if (permission.getName() != null) {
            existingPermission.setName(permission.getName());
        }
        if (permission.getDescription() != null) {
            existingPermission.setDescription(permission.getDescription());
        }
        if (permission.getCreatedBy() != null) {
            existingPermission.setCreatedBy(permission.getCreatedBy());
        }
        if (permission.getUpdatedBy() != null) {
            existingPermission.setUpdatedBy(permission.getUpdatedBy());
        }
        // 更新新字段
        if (permission.getType() != null) {
            existingPermission.setType(permission.getType());
        }
        if (permission.getOrderNum() != null) {
            existingPermission.setOrderNum(permission.getOrderNum());
        }
        if (permission.getIcon() != null) {
            existingPermission.setIcon(permission.getIcon());
        }
        if (permission.getRoutePath() != null) {
            existingPermission.setRoutePath(permission.getRoutePath());
        }
        if (permission.getIsDeletable() != null) {
            existingPermission.setIsDeletable(permission.getIsDeletable());
        }

        return permissionRepository.save(existingPermission);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Permission permission = getById(id);

        // 检查是否可删除
        if (!permission.getIsDeletable()) {
            throw new RuntimeException("系统内置权限，无法删除");
        }

        // 检查是否有角色关联
        if (!permission.getRoles().isEmpty()) {
            throw new RuntimeException("权限有角色关联，无法删除");
        }

        permissionRepository.delete(permission);
    }

    @Override
    public Permission getById(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("权限不存在，ID: " + id));
    }

    @Override
    public List<Permission> getAll() {
        return permissionRepository.findAll();
    }

    @Override
    public Page<Permission> getPage(Pageable pageable) {
        return permissionRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public Permission activatePermission(Long id) {
        Permission permission = getById(id);
        // 权限没有状态字段，这里可以添加如果需要
        return permissionRepository.save(permission);
    }

    @Override
    @Transactional
    public Permission deactivatePermission(Long id) {
        Permission permission = getById(id);
        // 权限没有状态字段，这里可以添加如果需要
        return permissionRepository.save(permission);
    }

    @Override
    public Permission getByCode(String code) {
        return permissionRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("权限不存在，代码: " + code));
    }

    @Override
    public List<Permission> getPermissionsByRoleId(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + roleId));
        return new ArrayList<>(role.getPermissions());
    }

    @Override
    public List<Permission> getPermissionsByUserId(Long userId) {
        // 获取用户的所有角色，然后收集所有权限
        List<Role> roles = roleRepository.findByUsers_Id(userId);
        return roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByCode(String code) {
        return permissionRepository.existsByCode(code);
    }

    @Override
    public boolean isActive(Long id) {
        // 权限没有状态字段，默认返回true
        return true;
    }

    @Override
    public boolean userHasPermission(Long userId, String permissionCode) {
        List<Permission> userPermissions = getPermissionsByUserId(userId);
        return userPermissions.stream()
                .anyMatch(permission -> permissionCode.equals(permission.getCode()));
    }

    @Override
    public boolean userHasAnyPermission(Long userId, List<String> permissionCodes) {
        List<Permission> userPermissions = getPermissionsByUserId(userId);
        Set<String> userPermissionCodes = userPermissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return permissionCodes.stream()
                .anyMatch(userPermissionCodes::contains);
    }

    @Override
    public boolean userHasAllPermissions(Long userId, List<String> permissionCodes) {
        List<Permission> userPermissions = getPermissionsByUserId(userId);
        Set<String> userPermissionCodes = userPermissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return permissionCodes.stream()
                .allMatch(userPermissionCodes::contains);
    }

    @Override
    @Transactional
    public List<Permission> addPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + roleId));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            throw new RuntimeException("部分权限不存在");
        }

        // 添加权限到角色
        Set<Permission> rolePermissions = role.getPermissions();
        for (Permission permission : permissions) {
            if (!rolePermissions.contains(permission)) {
                rolePermissions.add(permission);
            }
        }

        roleRepository.save(role);
        return new ArrayList<>(rolePermissions);
    }

    @Override
    @Transactional
    public List<Permission> removePermissionsFromRole(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + roleId));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            throw new RuntimeException("部分权限不存在");
        }

        // 从角色移除权限
        Set<Permission> rolePermissions = role.getPermissions();
        for (Permission permission : permissions) {
            rolePermissions.remove(permission);
        }

        roleRepository.save(role);
        return new ArrayList<>(rolePermissions);
    }

    @Override
    public Integer countRolesByPermissionId(Long permissionId) {
        Permission permission = getById(permissionId);
        return permission.getRoles().size();
    }

    @Override
    @Transactional
    public List<Permission> createBatch(List<Permission> permissions) {
        // 验证所有权限代码唯一性
        for (Permission permission : permissions) {
            if (permissionRepository.existsByCode(permission.getCode())) {
                throw new RuntimeException("权限代码已存在: " + permission.getCode());
            }
        }
        return permissionRepository.saveAll(permissions);
    }

    @Override
    @Transactional
    public List<Permission> updateBatch(List<Permission> permissions) {
        // 验证所有权限存在性
        for (Permission permission : permissions) {
            if (permission.getId() == null) {
                throw new RuntimeException("批量更新时权限ID不能为空");
            }
            if (!permissionRepository.existsById(permission.getId())) {
                throw new RuntimeException("权限不存在，ID: " + permission.getId());
            }
        }
        return permissionRepository.saveAll(permissions);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids) {
        // 验证所有权限存在性且非系统权限
        for (Long id : ids) {
            Permission permission = getById(id);
            if (!permission.getRoles().isEmpty()) {
                throw new RuntimeException("权限有角色关联，无法删除，ID: " + id);
            }
        }
        permissionRepository.deleteAllById(ids);
    }

    @Override
    public List<PermissionTreeNode> buildPermissionTree() {
        List<Permission> roots = permissionRepository.findByParentIdIsNullOrderByOrderNumAsc();
        List<PermissionTreeNode> tree = new ArrayList<>();
        for (Permission p : roots) {
            tree.add(buildNode(p));
        }
        return tree;
    }

    @Override
    public List<PermissionTreeNode> buildPermissionTreeWithRole(Long roleId) {
        List<PermissionTreeNode> tree = buildPermissionTree();
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + roleId));
        Set<Long> rolePermissionIds = role.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
        markChecked(tree, rolePermissionIds);
        return tree;
    }

    private PermissionTreeNode buildNode(Permission p) {
        PermissionTreeNode node = new PermissionTreeNode();
        node.setId(p.getId());
        node.setCode(p.getCode());
        node.setName(p.getName());
        node.setParentId(p.getParentId());
        node.setType(p.getType());
        node.setOrderNum(p.getOrderNum());
        node.setIcon(p.getIcon());
        node.setRoutePath(p.getRoutePath());
        node.setIsDeletable(p.getIsDeletable());
        List<Permission> children = permissionRepository.findByParentIdOrderByOrderNumAsc(p.getId());
        for (Permission child : children) {
            node.getChildren().add(buildNode(child));
        }
        return node;
    }

    private void markChecked(List<PermissionTreeNode> nodes, Set<Long> checkedIds) {
        for (PermissionTreeNode node : nodes) {
            if (checkedIds.contains(node.getId())) {
                node.setChecked(true);
            }
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                markChecked(node.getChildren(), checkedIds);
            }
        }
    }

    @Override
    public List<Long> extractCheckedPermissionIds(List<PermissionTreeNode> tree) {
        List<Long> ids = new ArrayList<>();
        for (PermissionTreeNode node : tree) {
            if (node.isChecked()) {
                ids.add(node.getId());
            }
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                ids.addAll(extractCheckedPermissionIds(node.getChildren()));
            }
        }
        return ids;
    }
}