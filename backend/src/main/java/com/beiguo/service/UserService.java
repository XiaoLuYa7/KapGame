package com.beiguo.service;

import com.beiguo.dto.AuthRequest;
import com.beiguo.dto.AuthResponse;
import com.beiguo.dto.WechatLoginRequest;
import com.beiguo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface UserService {
    AuthResponse register(AuthRequest request);
    AuthResponse login(AuthRequest request);
    AuthResponse wechatLogin(WechatLoginRequest request);
    User getCurrentUser();
    User getUserById(Long id);
    User getUserByUsername(String username);

    // CRUD方法
    User create(User user);
    User update(Long id, User user);
    void delete(Long id);
    List<User> getAll();
    Page<User> getPage(Pageable pageable);

    // 业务特定方法
    User updateProfile(Long id, String nickname, String avatar);
    User bindPhone(String phone, String code);
    User verifyRealName(String realName, String idCard);
    User updateUserSettings(Boolean soundEffectsEnabled, Boolean musicEnabled, Boolean vibrationEnabled);
    User updatePassword(Long id, String oldPassword, String newPassword);
    User resetPassword(Long id, String newPassword);
    User updateStatus(Long id, String status);
    User addDiamonds(Long id, Integer diamonds);
    User deductDiamonds(Long id, Integer diamonds);
    User addGold(Long id, Integer gold);
    User deductGold(Long id, Integer gold);

    // 查询方法
    List<User> getUsersByStatus(String status);
    List<User> getUsersByRole(String role);
    List<User> searchUsers(String keyword);
    List<User> getTopUsersByDiamonds(Integer limit);
    List<User> getTopUsersByGold(Integer limit);

    // 检查方法
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean isUserActive(Long id);

    // 统计方法
    Integer countAllUsers();
    Integer countUsersByStatus(String status);
    Integer countUsersByRole(String role);
    Integer getTotalDiamonds();
    Integer getTotalGold();

    // 批量操作
    List<User> createBatch(List<User> users);
    List<User> updateBatch(List<User> users);
    void deleteBatch(List<Long> ids);
}
