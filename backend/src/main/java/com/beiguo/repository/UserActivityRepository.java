package com.beiguo.repository;

import com.beiguo.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    Optional<UserActivity> findByUserIdAndActivityId(@Param("userId") Long userId, @Param("activityId") Long activityId);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.id = :userId AND ua.activity.id = :activityId")
    Optional<UserActivity> findByUserAndActivity(@Param("userId") Long userId, @Param("activityId") Long activityId);
}
