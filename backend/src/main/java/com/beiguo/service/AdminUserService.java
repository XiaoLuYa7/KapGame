package com.beiguo.service;

import com.beiguo.entity.AdminUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AdminUserService {
    // CRUD methods
    AdminUser create(AdminUser adminUser);
    AdminUser update(Long id, AdminUser adminUser);
    void delete(Long id);
    AdminUser getById(Long id);
    List<AdminUser> getAll();
    Page<AdminUser> getPage(Pageable pageable);

    // Business methods
    AdminUser updateProfile(Long id, String realName, String email, String phone);
    AdminUser updatePassword(Long id, String oldPassword, String newPassword);
    AdminUser resetPassword(Long id, String newPassword);
    AdminUser updateStatus(Long id, String status);
    AdminUser assignRole(Long id, Long roleId);

    // Query methods
    AdminUser getByUsername(String username);
    List<AdminUser> getByRole(Long roleId);
    List<AdminUser> getByStatus(String status);
    List<AdminUser> search(String keyword);

    // Check methods
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean isActive(Long id);

    // Statistical methods
    Integer countAll();
    Integer countByRole(Long roleId);
    Integer countByStatus(String status);

    // Batch operations
    List<AdminUser> createBatch(List<AdminUser> adminUsers);
    List<AdminUser> updateBatch(List<AdminUser> adminUsers);
    void deleteBatch(List<Long> ids);
}