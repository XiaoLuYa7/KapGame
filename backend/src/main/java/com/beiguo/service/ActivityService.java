package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ActivityService {
    // Core CRUD
    Activity create(Activity activity);
    Activity update(Long id, Activity activity);
    void delete(Long id);
    Activity getById(Long id);
    List<Activity> getAll();
    Page<Activity> getPage(Pageable pageable);

    // Admin API (wrapped with ApiResponse)
    ApiResponse<Page<Activity>> getActivities(int page, int size, String type, String status, String startTime);
    ApiResponse<Activity> getActivity(Long id);
    ApiResponse<Activity> createActivity(Activity activity);
    ApiResponse<Activity> updateActivity(Long id, Activity activity);
    ApiResponse<Void> deleteActivity(Long id);
    ApiResponse<List<ActivityReward>> getRewards(Long activityId);
    ApiResponse<ActivityReward> addReward(Long activityId, ActivityReward reward);
    ApiResponse<Void> deleteReward(Long rewardId);

    // Activity lifecycle
    Activity activateActivity(Long id);
    Activity deactivateActivity(Long id);
    Activity startActivity(Long id);
    Activity endActivity(Long id);
    Activity updateRewards(Long id, String rewardsJson);
    int updateExpiredActivities();

    // Queries
    List<Activity> getActiveActivities();
    List<Activity> getUpcomingActivities();
    List<Activity> getEndedActivities();
    List<Activity> getActivitiesByType(String type);
    List<Activity> getActivitiesByStatus(String status);
    List<Activity> getActiveActivitiesByType(String type);

    // Status checks
    boolean isActivityActive(Long id);
    boolean isActivityUpcoming(Long id);
    boolean isActivityEnded(Long id);

    // Counts
    Integer countActiveActivities();
    Integer countUpcomingActivities();
    Integer countEndedActivities();
    Integer countActivitiesByType(String type);
}
