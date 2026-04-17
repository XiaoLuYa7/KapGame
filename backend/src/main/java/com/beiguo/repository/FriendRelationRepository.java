package com.beiguo.repository;

import com.beiguo.entity.FriendRelation;
import com.beiguo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRelationRepository extends JpaRepository<FriendRelation, Long> {

    Optional<FriendRelation> findByUserAndFriend(User user, User friend);

    List<FriendRelation> findByUserAndStatus(User user, String status);

    List<FriendRelation> findByFriendAndStatus(User friend, String status);

    @Query("SELECT fr FROM FriendRelation fr WHERE (fr.user = :user OR fr.friend = :user) AND fr.status = 'ACCEPTED'")
    List<FriendRelation> findAllFriends(@Param("user") User user);

    @Query("SELECT fr FROM FriendRelation fr WHERE fr.user = :user AND fr.friend = :friend AND fr.status = :status")
    Optional<FriendRelation> findByUserAndFriendAndStatus(@Param("user") User user, @Param("friend") User friend, @Param("status") String status);

    @Query("SELECT COUNT(fr) FROM FriendRelation fr WHERE fr.user = :user AND fr.status = 'ACCEPTED'")
    long countFriendsByUser(@Param("user") User user);

    @Query("SELECT fr FROM FriendRelation fr WHERE (fr.user = :user OR fr.friend = :user) AND fr.status = 'PENDING'")
    List<FriendRelation> findPendingRequests(@Param("user") User user);

    boolean existsByUserAndFriendAndStatus(User user, User friend, String status);
}