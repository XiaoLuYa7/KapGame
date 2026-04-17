package com.beiguo.repository;

import com.beiguo.entity.UserReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRewardRepository extends JpaRepository<UserReward, Long> {
    List<UserReward> findByUserIdAndActivityId(Long userId, Long activityId);

    Optional<UserReward> findByUserIdAndRewardId(Long userId, Long rewardId);

    boolean existsByUserIdAndRewardId(Long userId, Long rewardId);
}
