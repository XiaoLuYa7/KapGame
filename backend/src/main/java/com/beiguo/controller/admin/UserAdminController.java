package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.FriendRelation;
import com.beiguo.entity.User;
import com.beiguo.repository.FriendRelationRepository;
import com.beiguo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
public class UserAdminController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRelationRepository friendRelationRepository;

    @GetMapping
    public ApiResponse<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<User> users = userRepository.findAll(pageable);

        // 关键字搜索（简化：内存过滤，实际应使用数据库查询）
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            List<User> filtered = users.getContent().stream()
                    .filter(user ->
                        (user.getUsername() != null && user.getUsername().toLowerCase().contains(lowerKeyword)) ||
                        (user.getNickName() != null && user.getNickName().toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
            // 由于是内存过滤，分页信息会不准确，这里简化处理
            return ApiResponse.success(new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size()));
        }

        return ApiResponse.success(users);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getUserDetail(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }

        User user = userOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("user", user);

        // 添加统计信息
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGames", user.getTotalGames());
        stats.put("winGames", user.getWinGames());
        stats.put("winRate", user.getTotalGames() > 0 ?
            String.format("%.2f%%", (double) user.getWinGames() / user.getTotalGames() * 100) : "0%");
        stats.put("level", user.getLevel());
        stats.put("exp", user.getExp());
        stats.put("rank", user.getRank());
        stats.put("diamond", user.getDiamond());
        stats.put("gold", user.getGold());
        stats.put("friendCount", user.getFriendCount());
        stats.put("totalOnlineTime", user.getTotalOnlineTime());
        stats.put("lastLoginTime", user.getLastLoginTime());

        result.put("stats", stats);

        return ApiResponse.success(result);
    }

    @GetMapping("/{id}/friends")
    public ApiResponse<List<Map<String, Object>>> getUserFriends(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }

        User user = userOpt.get();
        List<FriendRelation> friendRelations = friendRelationRepository.findAllFriends(user);

        List<Map<String, Object>> friends = friendRelations.stream()
                .map(fr -> {
                    Map<String, Object> friendInfo = new HashMap<>();
                    // 确定哪个是好友（不是当前用户）
                    User friendUser = fr.getUser().getId().equals(user.getId()) ? fr.getFriend() : fr.getUser();
                    friendInfo.put("friendId", friendUser.getId());
                    friendInfo.put("username", friendUser.getUsername());
                    friendInfo.put("nickName", friendUser.getNickName());
                    friendInfo.put("avatarUrl", friendUser.getAvatarUrl());
                    friendInfo.put("level", friendUser.getLevel());
                    friendInfo.put("rank", friendUser.getRank());
                    friendInfo.put("status", fr.getStatus());
                    friendInfo.put("since", fr.getCreateTime());
                    return friendInfo;
                })
                .collect(Collectors.toList());

        return ApiResponse.success(friends);
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateUserStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ApiResponse.<Void>error("用户不存在");
        }
        if (!"ACTIVE".equals(status) && !"BANNED".equals(status)) {
            return ApiResponse.<Void>error("状态只能是 ACTIVE 或 BANNED");
        }

        User user = userOpt.get();
        user.setStatus(status);
        userRepository.save(user);
        return ApiResponse.<Void>successMessage("状态更新成功");
    }

    @PutMapping("/{id}/ban")
    public ApiResponse<Void> banUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ApiResponse.<Void>error("用户不存在");
        }
        User user = userOpt.get();
        user.setStatus("BANNED");
        userRepository.save(user);
        return ApiResponse.<Void>successMessage("封禁成功");
    }

    @PutMapping("/{id}/unban")
    public ApiResponse<Void> unbanUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ApiResponse.<Void>error("用户不存在");
        }
        User user = userOpt.get();
        user.setStatus("ACTIVE");
        userRepository.save(user);
        return ApiResponse.<Void>successMessage("解封成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<User> updateUser(@PathVariable Long id, @RequestBody User userUpdate) {
        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }

        User existing = existingOpt.get();

        // 更新可编辑字段
        if (userUpdate.getNickName() != null) {
            existing.setNickName(userUpdate.getNickName());
        }
        if (userUpdate.getAvatarUrl() != null) {
            existing.setAvatarUrl(userUpdate.getAvatarUrl());
        }
        if (userUpdate.getRank() != null) {
            existing.setRank(userUpdate.getRank());
        }
        if (userUpdate.getRankLevel() != null) {
            existing.setRankLevel(userUpdate.getRankLevel());
        }
        if (userUpdate.getDiamond() != null) {
            existing.setDiamond(userUpdate.getDiamond());
        }
        if (userUpdate.getGold() != null) {
            existing.setGold(userUpdate.getGold());
        }
        if (userUpdate.getLevel() != null) {
            existing.setLevel(userUpdate.getLevel());
        }
        if (userUpdate.getExp() != null) {
            existing.setExp(userUpdate.getExp());
        }
        if (userUpdate.getTotalGames() != null) {
            existing.setTotalGames(userUpdate.getTotalGames());
        }
        if (userUpdate.getWinGames() != null) {
            existing.setWinGames(userUpdate.getWinGames());
        }

        User updated = userRepository.save(existing);
        return ApiResponse.success("更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }

        User existing = existingOpt.get();

        // 检查是否有好友关系
        List<FriendRelation> friendRelations = friendRelationRepository.findAllFriends(existing);
        if (!friendRelations.isEmpty()) {
            return ApiResponse.error("该用户存在好友关系，无法删除");
        }

        // 检查是否有用户皮肤
        if (existing.getUserSkins() != null && !existing.getUserSkins().isEmpty()) {
            return ApiResponse.error("该用户存在皮肤数据，无法删除");
        }

        userRepository.delete(existing);
        return ApiResponse.success("删除成功");
    }

    @PutMapping("/{id}/diamonds")
    public ApiResponse<User> addDiamonds(@PathVariable Long id, @RequestParam Integer diamonds) {
        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }
        if (diamonds == null || diamonds <= 0) {
            return ApiResponse.error("钻石数量必须大于0");
        }

        User existing = existingOpt.get();
        existing.setDiamond(existing.getDiamond() + diamonds);
        User updated = userRepository.save(existing);
        return ApiResponse.success("添加钻石成功", updated);
    }

    @PutMapping("/{id}/gold")
    public ApiResponse<User> addGold(@PathVariable Long id, @RequestParam Integer gold) {
        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("用户不存在");
        }
        if (gold == null || gold <= 0) {
            return ApiResponse.error("金币数量必须大于0");
        }

        User existing = existingOpt.get();
        existing.setGold(existing.getGold() + gold);
        User updated = userRepository.save(existing);
        return ApiResponse.success("添加金币成功", updated);
    }
}