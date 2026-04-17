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
                Set<Permission> permissions = role.getPermissions();

                // 获取 MENU 类型的权限
                Long menuMainId = null;
                Long menuSystemId = null;
                for (Permission p : permissions) {
                    if ("MENU_MAIN".equals(p.getCode())) {
                        menuMainId = p.getId();
                    } else if ("MENU_SYSTEM".equals(p.getCode())) {
                        menuSystemId = p.getId();
                    }
                }

                // 获取主菜单下的页面（按orderNum排序）
                if (menuMainId != null) {
                    final Long mainId = menuMainId;
                    List<Permission> mainPages = permissions.stream()
                            .filter(p -> "PAGE".equals(p.getType()) && mainId.equals(p.getParentId()))
                            .sorted(Comparator.comparing(Permission::getOrderNum, Comparator.nullsLast(Comparator.naturalOrder())))
                            .collect(Collectors.toList());

                    for (Permission p : mainPages) {
                        Map<String, Object> menu = new HashMap<>();
                        menu.put("path", p.getRoutePath());
                        menu.put("name", p.getName());
                        menu.put("icon", p.getIcon());
                        menu.put("code", p.getCode());
                        mainMenus.add(menu);
                    }
                }

                // 获取系统菜单下的页面（按orderNum排序）
                if (menuSystemId != null) {
                    final Long sysId = menuSystemId;
                    List<Permission> systemPages = permissions.stream()
                            .filter(p -> "PAGE".equals(p.getType()) && sysId.equals(p.getParentId()))
                            .sorted(Comparator.comparing(Permission::getOrderNum, Comparator.nullsLast(Comparator.naturalOrder())))
                            .collect(Collectors.toList());

                    for (Permission p : systemPages) {
                        Map<String, Object> menu = new HashMap<>();
                        menu.put("path", p.getRoutePath());
                        menu.put("name", p.getName());
                        menu.put("icon", p.getIcon());
                        menu.put("code", p.getCode());
                        systemMenus.add(menu);
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