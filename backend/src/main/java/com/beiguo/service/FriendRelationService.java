package com.beiguo.service;

import com.beiguo.entity.FriendRelation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface FriendRelationService {

    // CRUD方法
    FriendRelation create(FriendRelation friendRelation);
    FriendRelation update(Long id, FriendRelation friendRelation);
    void delete(Long id);
    FriendRelation getById(Long id);
    List<FriendRelation> getAll();
    Page<FriendRelation> getPage(Pageable pageable);

    // 业务特定方法
    FriendRelation sendFriendRequest(Long userId, Long friendId);
    FriendRelation acceptFriendRequest(Long relationId);
    FriendRelation rejectFriendRequest(Long relationId);
    FriendRelation blockFriend(Long userId, Long friendId);
    FriendRelation unblockFriend(Long userId, Long friendId);

    // 查询方法
    List<FriendRelation> getFriendRequestsByUserId(Long userId);
    List<FriendRelation> getFriendsByUserId(Long userId);
    List<FriendRelation> getBlockedFriendsByUserId(Long userId);

    // 状态检查
    boolean areFriends(Long userId1, Long userId2);
    boolean isFriendRequestPending(Long userId, Long friendId);
    boolean isBlocked(Long userId, Long friendId);
}