package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.admin.PermissionDTO;
import com.beiguo.dto.admin.PermissionTreeNode;
import com.beiguo.entity.Permission;
import com.beiguo.repository.PermissionRepository;
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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/permissions")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('USER:MANAGE')")
public class AdminPermissionController {

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public ApiResponse<Page<PermissionDTO>> getPermissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long parentId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id"));
        Page<Permission> permissions;

        List<Permission> filtered = permissionRepository.findAll();
        // 按类型过滤
        if (type != null && !type.trim().isEmpty()) {
            filtered = filtered.stream().filter(p -> type.equals(p.getType())).collect(Collectors.toList());
        }
        // 按父权限过滤
        if (parentId != null) {
            final Long pid = parentId;
            filtered = filtered.stream().filter(p -> pid.equals(p.getParentId())).collect(Collectors.toList());
        }
        // 按代码或名称过滤
        if ((code != null && !code.trim().isEmpty()) || (name != null && !name.trim().isEmpty())) {
            final String codeKeyword = code != null ? code.trim() : null;
            final String nameKeyword = name != null ? name.trim() : null;
            filtered = filtered.stream()
                    .filter(p -> (codeKeyword == null || p.getCode().contains(codeKeyword))
                            && (nameKeyword == null || p.getName().contains(nameKeyword)))
                    .collect(Collectors.toList());
        }

        int start = (int) pageable.getOffset();
        int end = Math.min(start + size, filtered.size());
        List<Permission> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        permissions = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, filtered.size());

        Page<PermissionDTO> permissionDTOs = permissions.map(this::convertToDTO);
        return ApiResponse.success(permissionDTOs);
    }

    @GetMapping("/all")
    public ApiResponse<List<PermissionDTO>> getAllPermissions() {
        List<Permission> all = permissionRepository.findAll();
        List<PermissionDTO> dtos = all.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @GetMapping("/{id}")
    public ApiResponse<PermissionDTO> getPermission(@PathVariable Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("权限不存在"));
        return ApiResponse.success(convertToDTO(permission));
    }

    @GetMapping("/tree")
    public ApiResponse<List<PermissionTreeNode>> getPermissionTree() {
        return ApiResponse.success(permissionService.buildPermissionTree());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<PermissionDTO> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        if (permissionRepository.existsByCode(request.getCode())) {
            return ApiResponse.error("权限代码已存在");
        }

        Permission permission = new Permission();
        permission.setCode(request.getCode());
        permission.setName(request.getName());
        permission.setDescription(request.getDescription());
        permission.setParentId(request.getParentId());
        permission.setType(request.getType() != null ? request.getType() : "FUNCTION");
        permission.setOrderNum(request.getOrderNum() != null ? request.getOrderNum() : 0);
        permission.setIcon(request.getIcon());
        permission.setRoutePath(request.getRoutePath());
        permission.setIsDeletable(request.getIsDeletable() != null ? request.getIsDeletable() : true);
        permission.setCreatedBy(getCurrentAdminUsername());
        permission.setUpdatedBy(getCurrentAdminUsername());

        permission = permissionRepository.save(permission);
        return ApiResponse.success("权限创建成功", convertToDTO(permission));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<PermissionDTO> updatePermission(@PathVariable Long id, @Valid @RequestBody UpdatePermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("权限不存在"));

        // 检查权限代码是否重复
        if (!permission.getCode().equals(request.getCode()) && permissionRepository.existsByCode(request.getCode())) {
            return ApiResponse.error("权限代码已存在");
        }

        permission.setCode(request.getCode());
        permission.setName(request.getName());
        permission.setDescription(request.getDescription());
        permission.setParentId(request.getParentId());
        if (request.getType() != null) permission.setType(request.getType());
        if (request.getOrderNum() != null) permission.setOrderNum(request.getOrderNum());
        if (request.getIcon() != null) permission.setIcon(request.getIcon());
        if (request.getRoutePath() != null) permission.setRoutePath(request.getRoutePath());
        if (request.getIsDeletable() != null) permission.setIsDeletable(request.getIsDeletable());
        permission.setUpdatedBy(getCurrentAdminUsername());

        permission = permissionRepository.save(permission);
        return ApiResponse.success("权限更新成功", convertToDTO(permission));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> deletePermission(@PathVariable Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("权限不存在"));

        // 检查是否有角色使用该权限
        if (!permission.getRoles().isEmpty()) {
            return ApiResponse.error("该权限已被角色使用，不能删除");
        }

        permissionRepository.delete(permission);
        return ApiResponse.success("权限删除成功");
    }

    private PermissionDTO convertToDTO(Permission permission) {
        PermissionDTO dto = new PermissionDTO();
        dto.setId(permission.getId());
        dto.setCode(permission.getCode());
        dto.setName(permission.getName());
        dto.setDescription(permission.getDescription());
        dto.setParentId(permission.getParentId());
        dto.setType(permission.getType());
        dto.setOrderNum(permission.getOrderNum());
        dto.setIcon(permission.getIcon());
        dto.setRoutePath(permission.getRoutePath());
        dto.setIsDeletable(permission.getIsDeletable());
        if (permission.getParentId() != null) {
            permissionRepository.findById(permission.getParentId()).ifPresent(parent -> {
                dto.setParentCode(parent.getCode());
                dto.setParentName(parent.getName());
            });
        }
        dto.setCreateTime(permission.getCreateTime());
        dto.setUpdateTime(permission.getUpdateTime());
        dto.setCreatedBy(permission.getCreatedBy());
        dto.setUpdatedBy(permission.getUpdatedBy());
        return dto;
    }

    private String getCurrentAdminUsername() {
        // 这里可以从SecurityContext获取当前登录的管理员用户名
        // 暂时返回"SYSTEM"，实际项目中需要实现
        return "SYSTEM";
    }

    @Data
    public static class CreatePermissionRequest {
        @NotBlank(message = "权限代码不能为空")
        private String code;
        @NotBlank(message = "权限名称不能为空")
        private String name;
        private String description;
        private Long parentId;
        private String type;
        private Integer orderNum;
        private String icon;
        private String routePath;
        private Boolean isDeletable;
    }

    @Data
    public static class UpdatePermissionRequest {
        @NotBlank(message = "权限代码不能为空")
        private String code;
        @NotBlank(message = "权限名称不能为空")
        private String name;
        private String description;
        private Long parentId;
        private String type;
        private Integer orderNum;
        private String icon;
        private String routePath;
        private Boolean isDeletable;
    }
}