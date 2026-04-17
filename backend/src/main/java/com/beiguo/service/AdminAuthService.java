package com.beiguo.service;

import com.beiguo.dto.admin.AdminAuthRequest;
import com.beiguo.dto.admin.AdminAuthResponse;
import com.beiguo.entity.AdminUser;
import com.beiguo.entity.Permission;
import com.beiguo.entity.Role;
import com.beiguo.repository.AdminUserRepository;
import com.beiguo.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAuthService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(AdminAuthService.class);

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("管理员用户不存在: " + username));
        return adminUser;
    }

    @Transactional
    public AdminAuthResponse login(AdminAuthRequest request) {
        logger.info("Admin login attempt for username: {}", request.getUsername());
        AdminUser adminUser = adminUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("管理员用户不存在"));

        if (!"ACTIVE".equals(adminUser.getStatus())) {
            throw new RuntimeException("管理员账户已禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), adminUser.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        logger.info("Password verified successfully for admin: {}", request.getUsername());

        // 更新登录时间和次数
        adminUser.setLastLoginTime(java.time.LocalDateTime.now());
        adminUser.setLoginCount(adminUser.getLoginCount() != null ? adminUser.getLoginCount() + 1 : 1);
        adminUserRepository.save(adminUser);

        String roleName = adminUser.getRole() != null ? adminUser.getRole().getName() : "ADMIN";

        // 生成包含角色的JWT token
        String token = jwtUtil.generateToken(adminUser.getUsername(), adminUser.getId(), roleName);
        logger.info("JWT token generated for admin: {}, role: {}", adminUser.getUsername(), roleName);

        // 构建权限数据
        Map<String, List<String>> functions = new HashMap<>();
        List<String> pages = new ArrayList<>();

        Role role = adminUser.getRole();
        if (role != null && role.getPermissions() != null) {
            Set<Permission> permissions = role.getPermissions();

            // 第一遍：收集所有页面权限（根据type判断）
            for (Permission p : permissions) {
                String code = p.getCode();
                if (code == null) continue;

                // PAGE 类型的权限是页面权限
                if ("PAGE".equals(p.getType())) {
                    if (!pages.contains(code)) {
                        pages.add(code);
                    }
                }
            }

            // 第二遍：收集功能权限
            for (Permission p : permissions) {
                String code = p.getCode();
                if (code == null || !code.contains(":")) continue;

                // FUNCTION 类型的权限是功能权限
                if (!"FUNCTION".equals(p.getType())) continue;

                String[] parts = code.split(":");
                if (parts.length != 2) continue;

                String pageCode = "MODULE:" + parts[0]; // USER:VIEW -> MODULE:USER

                // 确保页面权限存在
                if (!pages.contains(pageCode)) {
                    // 如果没有对应的页面权限，跳过
                    continue;
                }

                String action = parts[1];
                functions.computeIfAbsent(pageCode, k -> new ArrayList<>()).add(action);
            }
        }

        logger.info("Permission data built - pages: {}, functions: {}", pages, functions);
        return new AdminAuthResponse(token, adminUser.getUsername(), adminUser.getId(), roleName, pages, functions);
    }

    public AdminUser getCurrentAdmin() {
        throw new UnsupportedOperationException("请通过SecurityContextHolder获取当前认证用户");
    }
}