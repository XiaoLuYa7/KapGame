package com.beiguo.service.impl;

import com.beiguo.entity.FriendRelation;
import com.beiguo.entity.User;
import com.beiguo.repository.FriendRelationRepository;
import com.beiguo.service.FriendRelationService;
import com.beiguo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FriendRelationServiceImpl implements FriendRelationService {

    @Autowired
    private FriendRelationRepository friendRelationRepository;

    @Autowired
    private UserService userService;

    @Override
    @Transactional
    public FriendRelation create(FriendRelation friendRelation) {
        // 验证用户和好友不是同一人
        if (friendRelation.getUser().getId().equals(friendRelation.getFriend().getId())) {
            throw new RuntimeException("不能添加自己为好友");
        }

        // 检查是否已存在关系
        if (friendRelationRepository.existsByUserAndFriendAndStatus(
                friendRelation.getUser(), friendRelation.getFriend(), "PENDING") ||
            friendRelationRepository.existsByUserAndFriendAndStatus(
                friendRelation.getUser(), friendRelation.getFriend(), "ACCEPTED")) {
            throw new RuntimeException("好友关系已存在");
        }

        // 设置默认状态和时间
        if (friendRelation.getStatus() == null) {
            friendRelation.setStatus("PENDING");
        }

        return friendRelationRepository.save(friendRelation);
    }

    @Override
    @Transactional
    public FriendRelation update(Long id, FriendRelation friendRelation) {
        FriendRelation existing = getById(id);

        // 只能更新状态字段
        existing.setStatus(friendRelation.getStatus());
        existing.setUpdateTime(LocalDateTime.now());

        return friendRelationRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!friendRelationRepository.existsById(id)) {
            throw new RuntimeException("好友关系不存在");
        }
        friendRelationRepository.deleteById(id);
    }

    @Override
    public FriendRelation getById(Long id) {
        return friendRelationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("好友关系不存在"));
    }

    @Override
    public List<FriendRelation> getAll() {
        return friendRelationRepository.findAll();
    }

    @Override
    public Page<FriendRelation> getPage(Pageable pageable) {
        return friendRelationRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public FriendRelation sendFriendRequest(Long userId, Long friendId) {
        User user = userService.getUserById(userId);
        User friend = userService.getUserById(friendId);

        // 检查是否已存在关系
        if (friendRelationRepository.existsByUserAndFriendAndStatus(user, friend, "PENDING") ||
            friendRelationRepository.existsByUserAndFriendAndStatus(user, friend, "ACCEPTED") ||
            friendRelationRepository.existsByUserAndFriendAndStatus(user, friend, "BLOCKED")) {
            throw new RuntimeException("好友关系已存在");
        }

        FriendRelation friendRelation = new FriendRelation();
        friendRelation.setUser(user);
        friendRelation.setFriend(friend);
        friendRelation.setStatus("PENDING");

        return friendRelationRepository.save(friendRelation);
    }

    @Override
    @Transactional
    public FriendRelation acceptFriendRequest(Long relationId) {
        FriendRelation relation = getById(relationId);

        if (!"PENDING".equals(relation.getStatus())) {
            throw new RuntimeException("只有待处理的好友请求可以接受");
        }

        relation.setStatus("ACCEPTED");
        relation.setUpdateTime(LocalDateTime.now());

        return friendRelationRepository.save(relation);
    }

    @Override
    @Transactional
    public FriendRelation rejectFriendRequest(Long relationId) {
        FriendRelation relation = getById(relationId);

        if (!"PENDING".equals(relation.getStatus())) {
            throw new RuntimeException("只有待处理的好友请求可以拒绝");
        }

        friendRelationRepository.delete(relation);
        return relation;
    }

    @Override
    @Transactional
    public FriendRelation blockFriend(Long userId, Long friendId) {
        User user = userService.getUserById(userId);
        User friend = userService.getUserById(friendId);

        // 检查是否已存在关系
        FriendRelation existingRelation = friendRelationRepository
                .findByUserAndFriendAndStatus(user, friend, "ACCEPTED")
                .orElse(friendRelationRepository
                        .findByUserAndFriendAndStatus(user, friend, "PENDING")
                        .orElse(null));

        if (existingRelation != null) {
            existingRelation.setStatus("BLOCKED");
            existingRelation.setUpdateTime(LocalDateTime.now());
            return friendRelationRepository.save(existingRelation);
        } else {
            FriendRelation relation = new FriendRelation();
            relation.setUser(user);
            relation.setFriend(friend);
            relation.setStatus("BLOCKED");
            return friendRelationRepository.save(relation);
        }
    }

    @Override
    @Transactional
    public FriendRelation unblockFriend(Long userId, Long friendId) {
        User user = userService.getUserById(userId);
        User friend = userService.getUserById(friendId);

        FriendRelation relation = friendRelationRepository
                .findByUserAndFriendAndStatus(user, friend, "BLOCKED")
                .orElseThrow(() -> new RuntimeException("未找到屏蔽关系"));

        // 解除屏蔽即删除关系
        friendRelationRepository.delete(relation);
        return relation;
    }

    @Override
    public List<FriendRelation> getFriendRequestsByUserId(Long userId) {
        User user = userService.getUserById(userId);
        return friendRelationRepository.findByFriendAndStatus(user, "PENDING");
    }

    @Override
    public List<FriendRelation> getFriendsByUserId(Long userId) {
        User user = userService.getUserById(userId);
        return friendRelationRepository.findAllFriends(user);
    }

    @Override
    public List<FriendRelation> getBlockedFriendsByUserId(Long userId) {
        User user = userService.getUserById(userId);
        return friendRelationRepository.findByUserAndStatus(user, "BLOCKED");
    }

    @Override
    public boolean areFriends(Long userId1, Long userId2) {
        User user1 = userService.getUserById(userId1);
        User user2 = userService.getUserById(userId2);

        return friendRelationRepository.existsByUserAndFriendAndStatus(user1, user2, "ACCEPTED") ||
               friendRelationRepository.existsByUserAndFriendAndStatus(user2, user1, "ACCEPTED");
    }

    @Override
    public boolean isFriendRequestPending(Long userId, Long friendId) {
        User user = userService.getUserById(userId);
        User friend = userService.getUserById(friendId);

        return friendRelationRepository.existsByUserAndFriendAndStatus(user, friend, "PENDING") ||
               friendRelationRepository.existsByUserAndFriendAndStatus(friend, user, "PENDING");
    }

    @Override
    public boolean isBlocked(Long userId, Long friendId) {
        User user = userService.getUserById(userId);
        User friend = userService.getUserById(friendId);

        return friendRelationRepository.existsByUserAndFriendAndStatus(user, friend, "BLOCKED") ||
               friendRelationRepository.existsByUserAndFriendAndStatus(friend, user, "BLOCKED");
    }
}