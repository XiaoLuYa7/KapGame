package com.beiguo.service.impl;

import com.beiguo.entity.AdminUser;
import com.beiguo.entity.Role;
import com.beiguo.repository.AdminUserRepository;
import com.beiguo.repository.RoleRepository;
import com.beiguo.service.AdminUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserServiceImpl implements AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserServiceImpl.class);

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ========== CRUD方法实现 ==========

    @Override
    @Transactional
    public AdminUser create(AdminUser adminUser) {
        logger.debug("创建管理员用户，用户名: {}", adminUser.getUsername());

        // 验证必要字段
        if (adminUser.getUsername() == null || adminUser.getUsername().trim().isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (adminUser.getPassword() == null || adminUser.getPassword().trim().isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }

        // 检查用户名是否已存在
        if (adminUserRepository.existsByUsername(adminUser.getUsername())) {
            throw new RuntimeException("用户名已存在: " + adminUser.getUsername());
        }

        // 检查邮箱是否已存在（如果提供）
        if (adminUser.getEmail() != null && !adminUser.getEmail().trim().isEmpty()) {
            // 注意：AdminUserRepository 目前没有 existsByEmail 方法，需要添加或跳过
            // 暂时跳过邮箱重复检查
        }

        // 加密密码
        adminUser.setPassword(passwordEncoder.encode(adminUser.getPassword()));

        // 设置默认值
        if (adminUser.getStatus() == null || adminUser.getStatus().trim().isEmpty()) {
            adminUser.setStatus("ACTIVE");
        }
        if (adminUser.getCreateTime() == null) {
            adminUser.setCreateTime(LocalDateTime.now());
        }
        if (adminUser.getUpdateTime() == null) {
            adminUser.setUpdateTime(LocalDateTime.now());
        }
        if (adminUser.getLoginCount() == null) {
            adminUser.setLoginCount(0);
        }

        // 保存管理员用户
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional
    public AdminUser update(Long id, AdminUser adminUser) {
        logger.debug("更新管理员用户，ID: {}", id);
        AdminUser existingAdminUser = getById(id);

        // 如果用户名有变化，检查是否已存在
        if (adminUser.getUsername() != null && !adminUser.getUsername().equals(existingAdminUser.getUsername())) {
            if (adminUserRepository.existsByUsername(adminUser.getUsername())) {
                throw new RuntimeException("用户名已存在: " + adminUser.getUsername());
            }
            existingAdminUser.setUsername(adminUser.getUsername());
        }

        // 更新其他字段
        if (adminUser.getRealName() != null) {
            existingAdminUser.setRealName(adminUser.getRealName());
        }
        if (adminUser.getEmail() != null) {
            existingAdminUser.setEmail(adminUser.getEmail());
        }
        if (adminUser.getPhone() != null) {
            existingAdminUser.setPhone(adminUser.getPhone());
        }
        if (adminUser.getStatus() != null && !adminUser.getStatus().trim().isEmpty()) {
            existingAdminUser.setStatus(adminUser.getStatus());
        }
        if (adminUser.getRole() != null) {
            existingAdminUser.setRole(adminUser.getRole());
        }

        // 更新修改时间和修改人
        existingAdminUser.setUpdateTime(LocalDateTime.now());
        // 修改人可以从 SecurityContext 获取，暂时留空

        return adminUserRepository.save(existingAdminUser);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        logger.debug("删除管理员用户，ID: {}", id);
        AdminUser adminUser = getById(id);
        adminUserRepository.delete(adminUser);
    }

    @Override
    public AdminUser getById(Long id) {
        logger.debug("根据ID查询管理员用户，ID: {}", id);
        return adminUserRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("管理员用户不存在，ID: {}", id);
                    return new RuntimeException("管理员用户不存在");
                });
    }

    @Override
    public List<AdminUser> getAll() {
        logger.debug("查询所有管理员用户");
        return adminUserRepository.findAll();
    }

    @Override
    public Page<AdminUser> getPage(Pageable pageable) {
        logger.debug("分页查询管理员用户，页码: {}，大小: {}", pageable.getPageNumber(), pageable.getPageSize());
        return adminUserRepository.findAll(pageable);
    }

    // ========== 业务方法实现 ==========

    @Override
    @Transactional
    public AdminUser updateProfile(Long id, String realName, String email, String phone) {
        logger.debug("更新管理员用户资料，ID: {}，真实姓名: {}，邮箱: {}，手机: {}", id, realName, email, phone);
        AdminUser adminUser = getById(id);
        if (realName != null) {
            adminUser.setRealName(realName);
        }
        if (email != null) {
            adminUser.setEmail(email);
        }
        if (phone != null) {
            adminUser.setPhone(phone);
        }
        adminUser.setUpdateTime(LocalDateTime.now());
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional
    public AdminUser updatePassword(Long id, String oldPassword, String newPassword) {
        logger.debug("更新管理员用户密码，ID: {}", id);
        AdminUser adminUser = getById(id);
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, adminUser.getPassword())) {
            throw new RuntimeException("旧密码错误");
        }
        // 更新为新密码
        adminUser.setPassword(passwordEncoder.encode(newPassword));
        adminUser.setUpdateTime(LocalDateTime.now());
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional
    public AdminUser resetPassword(Long id, String newPassword) {
        logger.debug("重置管理员用户密码，ID: {}", id);
        AdminUser adminUser = getById(id);
        adminUser.setPassword(passwordEncoder.encode(newPassword));
        adminUser.setUpdateTime(LocalDateTime.now());
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional
    public AdminUser updateStatus(Long id, String status) {
        logger.debug("更新管理员用户状态，ID: {}，状态: {}", id, status);
        AdminUser adminUser = getById(id);
        adminUser.setStatus(status);
        adminUser.setUpdateTime(LocalDateTime.now());
        return adminUserRepository.save(adminUser);
    }

    @Override
    @Transactional
    public AdminUser assignRole(Long id, Long roleId) {
        logger.debug("分配角色给管理员用户，用户ID: {}，角色ID: {}", id, roleId);
        AdminUser adminUser = getById(id);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        adminUser.setRole(role);
        adminUser.setUpdateTime(LocalDateTime.now());
        return adminUserRepository.save(adminUser);
    }

    // ========== 查询方法实现 ==========

    @Override
    public AdminUser getByUsername(String username) {
        logger.debug("根据用户名查询管理员用户，用户名: {}", username);
        return adminUserRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.error("管理员用户不存在，用户名: {}", username);
                    return new RuntimeException("管理员用户不存在");
                });
    }

    @Override
    public List<AdminUser> getByRole(Long roleId) {
        logger.debug("根据角色ID查询管理员用户，角色ID: {}", roleId);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        return adminUserRepository.findByRole(role);
    }

    @Override
    public List<AdminUser> getByStatus(String status) {
        logger.debug("根据状态查询管理员用户，状态: {}", status);
        return adminUserRepository.findByStatus(status);
    }

    @Override
    public List<AdminUser> search(String keyword) {
        logger.debug("搜索管理员用户，关键字: {}", keyword);
        return adminUserRepository.searchByKeyword(keyword);
    }

    // ========== 检查方法实现 ==========

    @Override
    public boolean existsByUsername(String username) {
        return adminUserRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        // 注意：AdminUserRepository 目前没有 existsByEmail 方法，暂时返回 false
        // 可以添加该方法或使用其他方式检查
        return false;
    }

    @Override
    public boolean isActive(Long id) {
        AdminUser adminUser = getById(id);
        return "ACTIVE".equals(adminUser.getStatus());
    }

    // ========== 统计方法实现 ==========

    @Override
    public Integer countAll() {
        return (int) adminUserRepository.count();
    }

    @Override
    public Integer countByRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        return (int) adminUserRepository.countByRole(role);
    }

    @Override
    public Integer countByStatus(String status) {
        return adminUserRepository.findByStatus(status).size();
    }

    // ========== 批量操作实现 ==========

    @Override
    @Transactional
    public List<AdminUser> createBatch(List<AdminUser> adminUsers) {
        logger.debug("批量创建管理员用户，数量: {}", adminUsers.size());
        return adminUsers.stream()
                .map(this::create)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<AdminUser> updateBatch(List<AdminUser> adminUsers) {
        logger.debug("批量更新管理员用户，数量: {}", adminUsers.size());
        return adminUsers.stream()
                .map(adminUser -> update(adminUser.getId(), adminUser))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids) {
        logger.debug("批量删除管理员用户，数量: {}", ids.size());
        ids.forEach(this::delete);
    }
}