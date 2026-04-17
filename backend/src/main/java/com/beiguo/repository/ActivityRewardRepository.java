package com.beiguo.repository;

import com.beiguo.entity.ActivityReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRewardRepository extends JpaRepository<ActivityReward, Long> {
    List<ActivityReward> findByActivityIdOrderBySortOrderAsc(Long activityId);
    long countByActivityId(Long activityId);
}
