package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "admin_user")
@Data
public class AdminUser implements UserDetails {
    private static final Logger logger = LoggerFactory.getLogger(AdminUser.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 100)
    private String realName; // 真实姓名

    @Column(length = 100)
    private String email; // 邮箱

    @Column(length = 20)
    private String phone; // 手机号

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role; // 关联角色

    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    @Column(name = "login_count")
    private Integer loginCount = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        logger.debug("Getting authorities for admin user: {}, role: {}, role status: {}",
            username, role != null ? role.getName() : "null", role != null ? role.getStatus() : "null");
        Set<GrantedAuthority> authorities = new HashSet<>();

        // 添加角色权限（ROLE_前缀）
        logger.info("AdminUser.getAuthorities() - username: {}, role: {}, role status: {}",
            username, role != null ? role.getName() : "null", role != null ? role.getStatus() : "null");
        if (role != null) { // 暂时忽略状态检查，用于调试
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));

            // 添加角色的所有权限
            if (role.getPermissions() != null) {
                role.getPermissions().stream()
                    .filter(permission -> permission != null && permission.getCode() != null)
                    .map(permission -> new SimpleGrantedAuthority(permission.getCode()))
                    .forEach(authorities::add);
            }
        }

        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return "ACTIVE".equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equals(status);
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createTime = now;
        updateTime = now;
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        }
        if (loginCount == null) {
            loginCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}