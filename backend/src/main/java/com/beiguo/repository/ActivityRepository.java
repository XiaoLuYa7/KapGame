package com.beiguo.repository;

import com.beiguo.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long>, JpaSpecificationExecutor<Activity> {
    List<Activity> findByActivityTypeAndStatusOrderBySortOrderDesc(String activityType, String status);

    @Query("SELECT a FROM Activity a WHERE a.status = 'ACTIVE' AND a.startTime <= :now AND a.endTime >= :now ORDER BY a.sortOrder DESC")
    List<Activity> findActiveActivities(@Param("now") java.time.LocalDateTime now);

    @Query("SELECT a FROM Activity a WHERE a.status = 'ACTIVE' AND a.startTime <= :now AND a.endTime >= :now AND a.activityType = :type ORDER BY a.sortOrder DESC")
    List<Activity> findActiveActivitiesByType(@Param("now") java.time.LocalDateTime now, @Param("type") String type);

    @Query("SELECT a FROM Activity a WHERE a.status = 'ACTIVE' AND a.endTime < :now")
    List<Activity> findExpiredActivities(@Param("now") java.time.LocalDateTime now);
}
