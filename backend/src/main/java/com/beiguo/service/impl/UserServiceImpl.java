package com.beiguo.service.impl;

import com.beiguo.dto.AuthRequest;
import com.beiguo.dto.AuthResponse;
import com.beiguo.dto.WechatLoginRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.beiguo.entity.AdminUser;
import com.beiguo.entity.User;
import com.beiguo.repository.AdminUserRepository;
import com.beiguo.repository.UserRepository;
import com.beiguo.service.UserService;
import com.beiguo.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
@Primary
public class UserServiceImpl implements UserService, UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 首先尝试查找管理员用户
        var adminUser = adminUserRepository.findByUsername(username);
        if (adminUser.isPresent()) {
            return adminUser.get(); // AdminUser已经实现了UserDetails
        }

        // 如果不是管理员，查找普通用户
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new ArrayList<>()
        );
    }

    @Override
    @Transactional
    public AuthResponse register(AuthRequest request) {
        logger.info("用户注册，用户名: {}", request.getUsername());
        if (userRepository.existsByUsername(request.getUsername())) {
            logger.warn("用户名已存在，用户名: {}", request.getUsername());
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreateTime(LocalDateTime.now());

        user = userRepository.save(user);
        logger.info("用户注册成功，用户ID: {}, 用户名: {}", user.getId(), user.getUsername());

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return new AuthResponse(token, user.getUsername(), user.getId());
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        logger.debug("Login attempt for username: {}", request.getUsername());
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            logger.warn("密码验证失败，用户名: {}", request.getUsername());
            throw new RuntimeException("密码错误");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        logger.info("用户登录成功，用户ID: {}, 用户名: {}", user.getId(), user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getId());
    }

    @Override
    public AuthResponse wechatLogin(WechatLoginRequest request) {
        logger.info("微信登录请求，昵称: {}, 头像URL: {}", request.getNickName(), request.getAvatarUrl());
        // 模拟微信登录，这里应该用code换openid，然后根据openid查找用户
        // 简化：用nickName作为用户名，如果用户不存在则创建
        String username = request.getNickName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            logger.info("微信新用户注册，昵称: {}", username);
            // 新用户注册
            user = new User();
            user.setUsername(username);
            user.setNickName(request.getNickName());
            user.setAvatarUrl(request.getAvatarUrl());
            user.setOpenId("mock_openid_" + System.currentTimeMillis()); // 模拟openid
            user.setPassword(""); // 微信用户无密码
            user = userRepository.save(user);
            logger.info("微信用户注册成功，用户ID: {}, 昵称: {}", user.getId(), user.getNickName());
        } else {
            logger.debug("微信用户已存在，用户ID: {}, 用户名: {}", user.getId(), user.getUsername());
        }
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        logger.info("微信登录成功，用户ID: {}, 昵称: {}", user.getId(), user.getNickName());
        return new AuthResponse(token, user.getUsername(), user.getId());
    }

    @Override
    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.debug("获取当前用户，用户名: {}", username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.error("用户未登录或不存在，用户名: {}", username);
                    return new RuntimeException("用户未登录");
                });
    }

    @Override
    public User getUserById(Long id) {
        logger.debug("根据ID查询用户，用户ID: {}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("用户不存在，用户ID: {}", id);
                    return new RuntimeException("用户不存在");
                });
    }

    @Override
    public User getUserByUsername(String username) {
        logger.debug("根据用户名查询用户，用户名: {}", username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.error("用户不存在，用户名: {}", username);
                    return new RuntimeException("用户不存在");
                });
    }

    // ========== CRUD方法实现 ==========

    @Override
    @Transactional
    public User create(User user) {
        // 验证必要字段
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }

        // 检查用户名是否已存在
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在: " + user.getUsername());
        }

        // 检查邮箱是否已存在（如果提供）
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty() &&
            userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("邮箱已存在: " + user.getEmail());
        }

        // 检查手机号是否已存在（如果提供）
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty() &&
            userRepository.existsByPhone(user.getPhone())) {
            throw new RuntimeException("手机号已存在: " + user.getPhone());
        }

        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // 设置默认值
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        }
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("USER");
        }
        if (user.getDiamond() == null) {
            user.setDiamond(0);
        }
        if (user.getGold() == null) {
            user.setGold(0);
        }
        if (user.getCreateTime() == null) {
            user.setCreateTime(LocalDateTime.now());
        }

        // 保存用户
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User update(Long id, User user) {
        User existingUser = getUserById(id);

        // 如果用户名有变化，检查是否已存在
        if (user.getUsername() != null && !user.getUsername().equals(existingUser.getUsername())) {
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new RuntimeException("用户名已存在: " + user.getUsername());
            }
            existingUser.setUsername(user.getUsername());
        }

        // 如果邮箱有变化，检查是否已存在
        if (user.getEmail() != null && !user.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("邮箱已存在: " + user.getEmail());
            }
            existingUser.setEmail(user.getEmail());
        }

        // 如果手机号有变化，检查是否已存在
        if (user.getPhone() != null && !user.getPhone().equals(existingUser.getPhone())) {
            if (userRepository.existsByPhone(user.getPhone())) {
                throw new RuntimeException("手机号已存在: " + user.getPhone());
            }
            existingUser.setPhone(user.getPhone());
        }

        // 更新其他字段
        if (user.getNickName() != null) {
            existingUser.setNickName(user.getNickName());
        }
        if (user.getAvatarUrl() != null) {
            existingUser.setAvatarUrl(user.getAvatarUrl());
        }
        if (user.getStatus() != null && !user.getStatus().trim().isEmpty()) {
            existingUser.setStatus(user.getStatus());
        }
        if (user.getRole() != null && !user.getRole().trim().isEmpty()) {
            existingUser.setRole(user.getRole());
        }
        if (user.getDiamond() != null) {
            existingUser.setDiamond(user.getDiamond());
        }
        if (user.getGold() != null) {
            existingUser.setGold(user.getGold());
        }
        if (user.getLevel() != null) {
            existingUser.setLevel(user.getLevel());
        }
        if (user.getExp() != null) {
            existingUser.setExp(user.getExp());
        }

        // 更新修改时间
        existingUser.setUpdateTime(LocalDateTime.now());

        return userRepository.save(existingUser);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    @Override
    public List<User> getAll() {
        return userRepository.findAllByOrderByCreateTimeDesc();
    }

    @Override
    public Page<User> getPage(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public User updateProfile(Long id, String nickname, String avatar) {
        User user = getUserById(id);
        if (nickname != null) {
            user.setNickName(nickname);
        }
        if (avatar != null) {
            user.setAvatarUrl(avatar);
        }
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User bindPhone(String phone, String code) {
        if (phone == null || !phone.matches("^1[3-9]\\d{9}$")) {
            throw new RuntimeException("手机号格式不正确");
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new RuntimeException("验证码格式不正确");
        }

        User currentUser = getCurrentUser();
        userRepository.findByPhone(phone)
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .ifPresent(user -> {
                    throw new RuntimeException("手机号已被绑定");
                });

        // TODO 接入短信服务后，在这里校验验证码。当前开发阶段只校验格式。
        currentUser.setPhone(phone);
        currentUser.setUpdateTime(LocalDateTime.now());
        return userRepository.save(currentUser);
    }

    @Override
    @Transactional
    public User verifyRealName(String realName, String idCard) {
        if (realName == null || realName.trim().isEmpty()) {
            throw new RuntimeException("真实姓名不能为空");
        }
        if (idCard == null || !idCard.matches("^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$")) {
            throw new RuntimeException("身份证号格式不正确");
        }

        User currentUser = getCurrentUser();
        currentUser.setRealName(realName.trim());
        currentUser.setIdCard(idCard.trim().toUpperCase());
        currentUser.setIsVerified(true);
        currentUser.setUpdateTime(LocalDateTime.now());
        return userRepository.save(currentUser);
    }

    @Override
    @Transactional
    public User updateUserSettings(Boolean soundEffectsEnabled, Boolean musicEnabled, Boolean vibrationEnabled) {
        User currentUser = getCurrentUser();
        if (soundEffectsEnabled != null) {
            currentUser.setSoundEffectsEnabled(soundEffectsEnabled);
        }
        if (musicEnabled != null) {
            currentUser.setMusicEnabled(musicEnabled);
        }
        if (vibrationEnabled != null) {
            currentUser.setVibrationEnabled(vibrationEnabled);
        }
        currentUser.setUpdateTime(LocalDateTime.now());
        return userRepository.save(currentUser);
    }

    @Override
    @Transactional
    public User updatePassword(Long id, String oldPassword, String newPassword) {
        User user = getUserById(id);

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("旧密码错误");
        }

        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User resetPassword(Long id, String newPassword) {
        User user = getUserById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateStatus(Long id, String status) {
        User user = getUserById(id);
        user.setStatus(status);
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User addDiamonds(Long id, Integer diamonds) {
        if (diamonds == null || diamonds <= 0) {
            throw new RuntimeException("钻石数量必须大于0");
        }
        User user = getUserById(id);
        user.setDiamond(user.getDiamond() + diamonds);
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User deductDiamonds(Long id, Integer diamonds) {
        if (diamonds == null || diamonds <= 0) {
            throw new RuntimeException("钻石数量必须大于0");
        }
        User user = getUserById(id);
        if (user.getDiamond() < diamonds) {
            throw new RuntimeException("钻石不足");
        }
        user.setDiamond(user.getDiamond() - diamonds);
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User addGold(Long id, Integer gold) {
        if (gold == null || gold <= 0) {
            throw new RuntimeException("金币数量必须大于0");
        }
        User user = getUserById(id);
        user.setGold(user.getGold() + gold);
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User deductGold(Long id, Integer gold) {
        if (gold == null || gold <= 0) {
            throw new RuntimeException("金币数量必须大于0");
        }
        User user = getUserById(id);
        if (user.getGold() < gold) {
            throw new RuntimeException("金币不足");
        }
        user.setGold(user.getGold() - gold);
        user.setUpdateTime(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public List<User> getUsersByStatus(String status) {
        return userRepository.findByStatus(status);
    }

    @Override
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    @Override
    public List<User> searchUsers(String keyword) {
        return userRepository.findByUsernameContainingOrNickNameContainingOrEmailContainingOrPhoneContaining(
            keyword, keyword, keyword, keyword);
    }

    @Override
    public List<User> getTopUsersByDiamonds(Integer limit) {
        Pageable pageable = Pageable.ofSize(limit != null ? limit : 10);
        return userRepository.findTop10ByOrderByDiamondDesc(pageable);
    }

    @Override
    public List<User> getTopUsersByGold(Integer limit) {
        Pageable pageable = Pageable.ofSize(limit != null ? limit : 10);
        return userRepository.findTop10ByOrderByGoldDesc(pageable);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }

    @Override
    public boolean isUserActive(Long id) {
        User user = getUserById(id);
        return "ACTIVE".equals(user.getStatus());
    }

    @Override
    public Integer countAllUsers() {
        return (int) userRepository.count();
    }

    @Override
    public Integer countUsersByStatus(String status) {
        return userRepository.countByStatus(status);
    }

    @Override
    public Integer countUsersByRole(String role) {
        return userRepository.countByRole(role);
    }

    @Override
    public Integer getTotalDiamonds() {
        return userRepository.sumDiamonds();
    }

    @Override
    public Integer getTotalGold() {
        return userRepository.sumGold();
    }

    @Override
    @Transactional
    public List<User> createBatch(List<User> users) {
        // 验证所有用户
        for (User user : users) {
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new RuntimeException("用户名已存在: " + user.getUsername());
            }
            if (user.getEmail() != null && !user.getEmail().trim().isEmpty() &&
                userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("邮箱已存在: " + user.getEmail());
            }
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty() &&
                userRepository.existsByPhone(user.getPhone())) {
                throw new RuntimeException("手机号已存在: " + user.getPhone());
            }
            // 加密密码
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.saveAll(users);
    }

    @Override
    @Transactional
    public List<User> updateBatch(List<User> users) {
        // 验证所有用户存在性
        for (User user : users) {
            if (user.getId() == null) {
                throw new RuntimeException("批量更新时用户ID不能为空");
            }
            if (!userRepository.existsById(user.getId())) {
                throw new RuntimeException("用户不存在，ID: " + user.getId());
            }
        }
        return userRepository.saveAll(users);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids) {
        for (Long id : ids) {
            if (!userRepository.existsById(id)) {
                throw new RuntimeException("用户不存在，ID: " + id);
            }
        }
        userRepository.deleteAllById(ids);
    }
}
