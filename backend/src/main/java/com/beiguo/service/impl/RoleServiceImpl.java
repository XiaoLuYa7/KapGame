package com.beiguo.service.impl;

import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.PermissionRepository;
import com.beiguo.repository.RoleRepository;
import com.beiguo.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    @Transactional
    public Role create(Role role) {
        // 验证必要字段
        if (role.getName() == null || role.getName().trim().isEmpty()) {
            throw new RuntimeException("角色名称不能为空");
        }

        // 检查角色名称是否已存在
        if (roleRepository.existsByName(role.getName())) {
            throw new RuntimeException("角色名称已存在: " + role.getName());
        }

        // 设置默认值
        if (role.getStatus() == null || role.getStatus().trim().isEmpty()) {
            role.setStatus("ACTIVE");
        }

        // 保存角色
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role update(Long id, Role role) {
        Role existingRole = getById(id);

        // 如果角色名称有变化，检查是否已存在
        if (role.getName() != null && !role.getName().equals(existingRole.getName())) {
            if (roleRepository.existsByName(role.getName())) {
                throw new RuntimeException("角色名称已存在: " + role.getName());
            }
            existingRole.setName(role.getName());
        }

        // 更新其他字段
        if (role.getDescription() != null) {
            existingRole.setDescription(role.getDescription());
        }
        if (role.getStatus() != null && !role.getStatus().trim().isEmpty()) {
            existingRole.setStatus(role.getStatus());
        }
        if (role.getCreatedBy() != null) {
            existingRole.setCreatedBy(role.getCreatedBy());
        }
        if (role.getUpdatedBy() != null) {
            existingRole.setUpdatedBy(role.getUpdatedBy());
        }

        // 更新权限（如果有提供）
        if (role.getPermissions() != null && !role.getPermissions().isEmpty()) {
            existingRole.setPermissions(role.getPermissions());
        }

        return roleRepository.save(existingRole);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Role role = getById(id);

        // 检查是否有用户关联
        if (!role.getUsers().isEmpty()) {
            throw new RuntimeException("角色下有关联用户，无法删除");
        }

        roleRepository.delete(role);
    }

    @Override
    public Role getById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在，ID: " + id));
    }

    @Override
    public List<Role> getAll() {
        return roleRepository.findAllByOrderByNameAsc();
    }

    @Override
    public Page<Role> getPage(Pageable pageable) {
        return roleRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public Role activateRole(Long id) {
        Role role = getById(id);
        role.setStatus("ACTIVE");
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role deactivateRole(Long id) {
        Role role = getById(id);
        role.setStatus("INACTIVE");
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role addPermissionToRole(Long roleId, Long permissionId) {
        Role role = getById(roleId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("权限不存在，ID: " + permissionId));

        // 检查是否已经拥有该权限
        if (role.getPermissions().contains(permission)) {
            throw new RuntimeException("角色已拥有该权限");
        }

        role.getPermissions().add(permission);
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role removePermissionFromRole(Long roleId, Long permissionId) {
        Role role = getById(roleId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("权限不存在，ID: " + permissionId));

        // 检查是否拥有该权限
        if (!role.getPermissions().contains(permission)) {
            throw new RuntimeException("角色未拥有该权限");
        }

        role.getPermissions().remove(permission);
        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role updatePermissions(Long roleId, List<Long> permissionIds) {
        Role role = getById(roleId);

        // 获取所有权限
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            throw new RuntimeException("部分权限不存在");
        }

        // 更新权限集合
        role.setPermissions(permissions.stream().collect(Collectors.toSet()));
        return roleRepository.save(role);
    }

    @Override
    public Role getByName(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("角色不存在，名称: " + name));
    }

    @Override
    public List<Role> getActiveRoles() {
        return roleRepository.findByStatus("ACTIVE");
    }

    @Override
    public List<Role> getRolesByStatus(String status) {
        return roleRepository.findByStatus(status);
    }

    @Override
    public List<Role> getRolesByUser(Long userId) {
        return roleRepository.findByUsers_Id(userId);
    }

    @Override
    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }

    @Override
    public boolean isActive(Long id) {
        Role role = getById(id);
        return "ACTIVE".equals(role.getStatus());
    }

    @Override
    public boolean hasPermission(Long roleId, Long permissionId) {
        Role role = getById(roleId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("权限不存在，ID: " + permissionId));
        return role.getPermissions().contains(permission);
    }

    @Override
    public boolean hasPermissionCode(Long roleId, String permissionCode) {
        Role role = getById(roleId);
        return role.getPermissions().stream()
                .anyMatch(permission -> permissionCode.equals(permission.getCode()));
    }

    @Override
    public List<String> getPermissionCodesByRoleId(Long roleId) {
        Role role = getById(roleId);
        return role.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toList());
    }

    @Override
    public Integer countActiveRoles() {
        return roleRepository.countByStatus("ACTIVE");
    }

    @Override
    public Integer countUsersByRoleId(Long roleId) {
        Role role = getById(roleId);
        return role.getUsers().size();
    }

    @Override
    @Transactional
    public List<Role> createBatch(List<Role> roles) {
        // 验证所有角色名称唯一性
        for (Role role : roles) {
            if (roleRepository.existsByName(role.getName())) {
                throw new RuntimeException("角色名称已存在: " + role.getName());
            }
        }
        return roleRepository.saveAll(roles);
    }

    @Override
    @Transactional
    public List<Role> updateBatch(List<Role> roles) {
        // 验证所有角色存在性
        for (Role role : roles) {
            if (role.getId() == null) {
                throw new RuntimeException("批量更新时角色ID不能为空");
            }
            if (!roleRepository.existsById(role.getId())) {
                throw new RuntimeException("角色不存在，ID: " + role.getId());
            }
        }
        return roleRepository.saveAll(roles);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids) {
        // 验证所有角色存在性且有关联用户
        for (Long id : ids) {
            Role role = getById(id);
            if (!role.getUsers().isEmpty()) {
                throw new RuntimeException("角色下有关联用户，无法删除，ID: " + id);
            }
        }
        roleRepository.deleteAllById(ids);
    }
}