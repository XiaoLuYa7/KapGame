package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.admin.AdminAuthRequest;
import com.beiguo.dto.admin.AdminAuthResponse;
import com.beiguo.entity.AdminUser;
import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.PermissionRepository;
import com.beiguo.service.AdminAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {
    private static final Logger logger = LoggerFactory.getLogger(AdminAuthController.class);

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private PermissionRepository permissionRepository;

    @PostMapping("/login")
    public ApiResponse<AdminAuthResponse> login(@Valid @RequestBody AdminAuthRequest request, HttpServletResponse httpResponse) {
        try {
            logger.info("Received admin login request for username: {}", request.getUsername());
            AdminAuthResponse response = adminAuthService.login(request);
            // 设置Cookie
            Cookie cookie = new Cookie("admin_jwt_token", response.getToken());
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // 开发环境可用false，生产环境应设置为true
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60); // 7天
            httpResponse.addCookie(cookie);
            logger.info("Admin login successful for username: {}, token set in cookie", request.getUsername());
            return ApiResponse.success("管理员登录成功", response);
        } catch (RuntimeException e) {
            logger.error("Admin login failed for username: {} - {}", request.getUsername(), e.getMessage());
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ApiResponse<Object> getCurrentAdmin() {
        try {
            // 可以通过SecurityContextHolder获取当前认证的管理员信息
            // 这里返回简单的认证信息，实际可以从token中解析
            return ApiResponse.success("获取当前管理员信息成功");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse httpResponse) {
        // 清除Cookie
        Cookie cookie = new Cookie("admin_jwt_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0); // 立即过期
        httpResponse.addCookie(cookie);
        return ApiResponse.successMessage("退出登录成功");
    }

    @GetMapping("/menus")
    public ApiResponse<Map<String, Object>> getMenus() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof AdminUser)) {
                return ApiResponse.error("未登录");
            }
            AdminUser adminUser = (AdminUser) auth.getPrincipal();
            Role role = adminUser.getRole();

            Map<String, Object> result = new HashMap<>();
            List<Map<String, Object>> mainMenus = new ArrayList<>();
            List<Map<String, Object>> systemMenus = new ArrayList<>();

            if (role != null && role.getPermissions() != null) {
                // 获取用户拥有的所有权限
                Set<Permission> userPermissions = role.getPermissions();

                // 查找ROOT菜单
                Permission rootPermission = permissionRepository.findByCode("ROOT").orElse(null);
                if (rootPermission == null) {
                    return ApiResponse.error("ROOT权限未找到");
                }
                final Long rootId = rootPermission.getId();

                // 查询所有MENU类型的菜单（ROOT的直接子节点）
                List<Permission> menuPermissions = permissionRepository.findByParentIdAndType(rootId, "MENU");
                // 按orderNum排序
                menuPermissions.sort(Comparator.comparing(p -> p.getOrderNum() != null ? p.getOrderNum() : 0));

                for (Permission menu : menuPermissions) {
                    // 查询该菜单下的所有子页面（用户有权限的）
                    List<Permission> childPages = userPermissions.stream()
                            .filter(p -> menu.getId().equals(p.getParentId()))
                            .sorted(Comparator.comparing(p -> p.getOrderNum() != null ? p.getOrderNum() : 0))
                            .toList();

                    if (childPages.isEmpty()) continue;

                    // 根据菜单code判断分组
                    List<Map<String, Object>> targetMenus = "MENU_MAIN".equals(menu.getCode()) ? mainMenus : systemMenus;

                    for (Permission page : childPages) {
                        Map<String, Object> menuItem = new HashMap<>();
                        menuItem.put("path", page.getRoutePath());
                        menuItem.put("name", page.getName());
                        menuItem.put("icon", page.getIcon() != null ? page.getIcon() : "Setting");
                        menuItem.put("code", page.getCode());
                        targetMenus.add(menuItem);
                    }
                }
            }

            result.put("mainMenus", mainMenus);
            result.put("systemMenus", systemMenus);
            return ApiResponse.success(result);
        } catch (Exception e) {
            logger.error("获取菜单失败", e);
            return ApiResponse.error("获取菜单失败: " + e.getMessage());
        }
    }
}