package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.admin.AdminUserDTO;
import com.beiguo.dto.admin.RoleDTO;
import com.beiguo.entity.AdminUser;
import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.AdminUserRepository;
import com.beiguo.service.AdminUserService;
import com.beiguo.service.RoleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/admin-users")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('USER:MANAGE')")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @GetMapping
    public ApiResponse<Page<AdminUserDTO>> getAdminUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long roleId) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<AdminUser> adminUsers;

        if (keyword != null && !keyword.trim().isEmpty()) {
            List<AdminUser> filtered = adminUserService.search(keyword.trim());

            // 按状态过滤
            if (status != null && !status.trim().isEmpty()) {
                filtered = filtered.stream()
                        .filter(u -> status.equals(u.getStatus()))
                        .collect(Collectors.toList());
            }

            // 按角色过滤
            if (roleId != null) {
                Role role = roleService.getById(roleId);
                filtered = filtered.stream()
                        .filter(u -> role.equals(u.getRole()))
                        .collect(Collectors.toList());
            }

            adminUsers = new org.springframework.data.domain.PageImpl<>(
                filtered, pageable, filtered.size()
            );
        } else {
            // 如果没有关键字，使用简单的查询
            // 这里可以优化为使用数据库查询，但为了简单起见，我们使用内存过滤
            List<AdminUser> allUsers = adminUserService.getAll();
            if (status != null && !status.trim().isEmpty()) {
                allUsers = allUsers.stream()
                        .filter(u -> status.equals(u.getStatus()))
                        .collect(Collectors.toList());
            }
            if (roleId != null) {
                Role role = roleService.getById(roleId);
                if (role != null) {
                    allUsers = allUsers.stream()
                            .filter(u -> role.equals(u.getRole()))
                            .collect(Collectors.toList());
                }
            }
            adminUsers = new org.springframework.data.domain.PageImpl<>(
                allUsers, pageable, allUsers.size()
            );
        }

        Page<AdminUserDTO> adminUserDTOs = adminUsers.map(this::convertToDTO);
        return ApiResponse.success(adminUserDTOs);
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminUserDTO> getAdminUser(@PathVariable Long id) {
        AdminUser adminUser = adminUserService.getById(id);
        return ApiResponse.success(convertToDTO(adminUser));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<AdminUserDTO> createAdminUser(@Valid @RequestBody CreateAdminUserRequest request) {
        if (adminUserService.existsByUsername(request.getUsername())) {
            return ApiResponse.error("用户名已存在");
        }

        Role role = roleService.getById(request.getRoleId());

        AdminUser adminUser = new AdminUser();
        adminUser.setUsername(request.getUsername());
        adminUser.setPassword(request.getPassword());
        adminUser.setRealName(request.getRealName());
        adminUser.setEmail(request.getEmail());
        adminUser.setPhone(request.getPhone());
        adminUser.setRole(role);
        adminUser.setStatus(request.getStatus());
        adminUser.setCreatedBy(getCurrentAdminUsername());
        adminUser.setUpdatedBy(getCurrentAdminUsername());

        adminUser = adminUserService.create(adminUser);
        return ApiResponse.success("管理员用户创建成功", convertToDTO(adminUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<AdminUserDTO> updateAdminUser(@PathVariable Long id, @Valid @RequestBody UpdateAdminUserRequest request) {
        AdminUser adminUser = adminUserService.getById(id);

        // 检查用户名是否重复
        if (!adminUser.getUsername().equals(request.getUsername()) && adminUserService.existsByUsername(request.getUsername())) {
            return ApiResponse.error("用户名已存在");
        }

        Role role = roleService.getById(request.getRoleId());

        adminUser.setUsername(request.getUsername());
        adminUser.setRealName(request.getRealName());
        adminUser.setEmail(request.getEmail());
        adminUser.setPhone(request.getPhone());
        adminUser.setRole(role);
        adminUser.setStatus(request.getStatus());
        adminUser.setUpdatedBy(getCurrentAdminUsername());

        // 如果提供了新密码，则更新密码
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            adminUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        adminUser = adminUserService.update(id, adminUser);
        return ApiResponse.success("管理员用户更新成功", convertToDTO(adminUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> deleteAdminUser(@PathVariable Long id) {
        AdminUser adminUser = adminUserService.getById(id);

        // 不能删除自己
        String currentUsername = getCurrentAdminUsername();
        if (adminUser.getUsername().equals(currentUsername)) {
            return ApiResponse.error("不能删除自己的账户");
        }

        adminUserService.delete(id);
        return ApiResponse.success("管理员用户删除成功");
    }

    @GetMapping("/roles")
    public ApiResponse<List<RoleDTO>> getAllRoles() {
        List<Role> roles = roleService.getAll();
        List<RoleDTO> roleDTOs = roles.stream()
                .map(this::convertRoleToDTO)
                .collect(Collectors.toList());
        return ApiResponse.success(roleDTOs);
    }

    @GetMapping("/me/permissions")
    public ApiResponse<Map<String, Object>> getMyPermissions() {
        // 从SecurityContext获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ApiResponse.error("未登录");
        }

        String username = authentication.getName();
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Map<String, Object> result = new HashMap<>();
        result.put("adminId", adminUser.getId());
        result.put("username", adminUser.getUsername());
        result.put("role", adminUser.getRole() != null ? adminUser.getRole().getName() : null);

        Map<String, List<String>> functions = new HashMap<>();
        List<String> pages = new ArrayList<>();

        Role role = adminUser.getRole();
        if (role != null && role.getPermissions() != null) {
            Set<Permission> permissions = role.getPermissions();

            for (Permission p : permissions) {
                String code = p.getCode();
                if (code == null) continue;

                // ROOT 和页面权限
                if (code.equals("ROOT") || code.startsWith("MODULE:") ||
                    (p.getIsPage() != null && p.getIsPage())) {
                    if (!pages.contains(code)) {
                        pages.add(code);
                    }
                    functions.computeIfAbsent(code, k -> new ArrayList<>());
                } else if (code.contains(":")) {
                    String[] parts = code.split(":");
                    if (parts.length == 2) {
                        String pageCode = parts[0];
                        String action = parts[1];
                        functions.computeIfAbsent(pageCode, k -> new ArrayList<>()).add(action);
                    }
                }
            }
        }

        result.put("pages", pages);
        result.put("functions", functions);
        return ApiResponse.success(result);
    }

    private AdminUserDTO convertToDTO(AdminUser adminUser) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(adminUser.getId());
        dto.setUsername(adminUser.getUsername());
        dto.setRealName(adminUser.getRealName());
        dto.setEmail(adminUser.getEmail());
        dto.setPhone(adminUser.getPhone());
        dto.setStatus(adminUser.getStatus());
        dto.setLastLoginTime(adminUser.getLastLoginTime());
        dto.setLoginCount(adminUser.getLoginCount());
        dto.setCreateTime(adminUser.getCreateTime());
        dto.setUpdateTime(adminUser.getUpdateTime());
        dto.setCreatedBy(adminUser.getCreatedBy());
        dto.setUpdatedBy(adminUser.getUpdatedBy());

        if (adminUser.getRole() != null) {
            dto.setRole(convertRoleToDTO(adminUser.getRole()));
        }

        return dto;
    }

    private RoleDTO convertRoleToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setStatus(role.getStatus());
        dto.setCreateTime(role.getCreateTime());
        dto.setUpdateTime(role.getUpdateTime());
        dto.setCreatedBy(role.getCreatedBy());
        dto.setUpdatedBy(role.getUpdatedBy());

        if (role.getPermissions() != null) {
            Set<Long> permissionIds = role.getPermissions().stream()
                    .map(p -> p.getId())
                    .collect(Collectors.toSet());
            dto.setPermissionIds(permissionIds);
        }

        return dto;
    }

    private String getCurrentAdminUsername() {
        // 这里可以从SecurityContext获取当前登录的管理员用户名
        // 暂时返回"SYSTEM"，实际项目中需要实现
        return "SYSTEM";
    }

    @Data
    public static class CreateAdminUserRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;

        @NotBlank(message = "密码不能为空")
        private String password;

        private String realName;
        private String email;
        private String phone;

        @NotNull(message = "角色不能为空")
        private Long roleId;

        private String status = "ACTIVE";
    }

    @Data
    public static class UpdateAdminUserRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;

        private String password; // 可选，不填则不更新密码

        private String realName;
        private String email;
        private String phone;

        @NotNull(message = "角色不能为空")
        private Long roleId;

        private String status = "ACTIVE";
    }
}