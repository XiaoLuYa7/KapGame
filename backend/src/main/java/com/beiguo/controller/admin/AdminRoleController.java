package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.admin.PermissionTreeNode;
import com.beiguo.dto.admin.RoleDTO;
import com.beiguo.entity.Role;
import com.beiguo.entity.Permission;
import com.beiguo.repository.RoleRepository;
import com.beiguo.repository.PermissionRepository;
import com.beiguo.repository.AdminUserRepository;
import com.beiguo.service.PermissionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/roles")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('USER:MANAGE')")
public class AdminRoleController {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public ApiResponse<Page<RoleDTO>> getRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Role> roles;

        if (keyword != null && !keyword.trim().isEmpty()) {
            roles = roleRepository.searchByKeyword(keyword.trim()).stream()
                    .collect(Collectors.collectingAndThen(
                            Collectors.toList(),
                            list -> new org.springframework.data.domain.PageImpl<>(
                                    list, pageable, list.size()
                            )
                    ));
        } else {
            roles = roleRepository.findAll(pageable);
        }

        Page<RoleDTO> roleDTOs = roles.map(this::convertToDTO);
        return ApiResponse.success(roleDTOs);
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleDTO> getRole(@PathVariable Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        return ApiResponse.success(convertToDTO(role));
    }

    @PostMapping
    public ApiResponse<RoleDTO> createRole(@Valid @RequestBody CreateRoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            return ApiResponse.error("角色名称已存在");
        }

        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setStatus(request.getStatus());
        role.setCreatedBy(getCurrentAdminUsername());
        role.setUpdatedBy(getCurrentAdminUsername());

        // 设置权限
        if (request.getPermissionTree() != null && !request.getPermissionTree().isEmpty()) {
            List<Long> checkedIds = permissionService.extractCheckedPermissionIds(request.getPermissionTree());
            if (!checkedIds.isEmpty()) {
                Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(checkedIds));
                role.setPermissions(permissions);
            }
        }

        role = roleRepository.save(role);
        return ApiResponse.success("角色创建成功", convertToDTO(role));
    }

    @PutMapping("/{id}")
    public ApiResponse<RoleDTO> updateRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        // 检查角色名称是否重复
        if (!role.getName().equals(request.getName()) && roleRepository.existsByName(request.getName())) {
            return ApiResponse.error("角色名称已存在");
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setStatus(request.getStatus());
        role.setUpdatedBy(getCurrentAdminUsername());

        // 更新权限
        if (request.getPermissionTree() != null && !request.getPermissionTree().isEmpty()) {
            List<Long> checkedIds = permissionService.extractCheckedPermissionIds(request.getPermissionTree());
            if (!checkedIds.isEmpty()) {
                Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(checkedIds));
                role.setPermissions(permissions);
            }
        }

        role = roleRepository.save(role);
        return ApiResponse.success("角色更新成功", convertToDTO(role));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteRole(@PathVariable Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        // 检查是否有用户使用该角色
        long userCount = adminUserRepository.countByRole(role);
        if (userCount > 0) {
            return ApiResponse.error("该角色下还有" + userCount + "个用户，不能删除");
        }

        roleRepository.delete(role);
        return ApiResponse.success("角色删除成功");
    }

    @GetMapping("/permissions")
    public ApiResponse<List<Permission>> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAll();
        return ApiResponse.success(permissions);
    }

    @GetMapping("/{id}/permissions/tree")
    public ApiResponse<List<PermissionTreeNode>> getRolePermissionTree(@PathVariable Long id) {
        return ApiResponse.success(permissionService.buildPermissionTreeWithRole(id));
    }

    private RoleDTO convertToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setStatus(role.getStatus());
        dto.setCreateTime(role.getCreateTime());
        dto.setUpdateTime(role.getUpdateTime());
        dto.setCreatedBy(role.getCreatedBy());
        dto.setUpdatedBy(role.getUpdatedBy());

        // 设置权限ID列表
        if (role.getPermissions() != null) {
            Set<Long> permissionIds = role.getPermissions().stream()
                    .map(Permission::getId)
                    .collect(Collectors.toSet());
            dto.setPermissionIds(permissionIds);
        }

        // 统计用户数
        long userCount = adminUserRepository.countByRole(role);
        dto.setUserCount((int) userCount);

        return dto;
    }

    private String getCurrentAdminUsername() {
        // 这里可以从SecurityContext获取当前登录的管理员用户名
        // 暂时返回"SYSTEM"，实际项目中需要实现
        return "SYSTEM";
    }

    @Data
    public static class CreateRoleRequest {
        @NotBlank(message = "角色名称不能为空")
        private String name;
        private String description;
        private String status = "ACTIVE";
        private List<PermissionTreeNode> permissionTree;
    }

    @Data
    public static class UpdateRoleRequest {
        @NotBlank(message = "角色名称不能为空")
        private String name;
        private String description;
        private String status = "ACTIVE";
        private List<PermissionTreeNode> permissionTree;
    }
}