package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.service.ActivityService;
import com.beiguo.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class MiniActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserActivityService userActivityService;

    @GetMapping
    public ApiResponse<List<Activity>> getActiveActivities(
            @RequestParam(required = false) String type) {
        if (type != null && !type.isEmpty()) {
            return ApiResponse.success(activityService.getActiveActivitiesByType(type));
        }
        return ApiResponse.success(activityService.getActiveActivities());
    }

    @GetMapping("/{id}")
    public ApiResponse<Activity> getActivity(@PathVariable Long id) {
        return ApiResponse.success(activityService.getById(id));
    }

    @GetMapping("/{id}/rewards")
    public ApiResponse<List<ActivityReward>> getRewards(@PathVariable Long id) {
        return activityService.getRewards(id);
    }

    @PostMapping("/{id}/signin")
    public ApiResponse<Void> signIn(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.signIn(userId, id);
    }

    @PostMapping("/{id}/claim")
    public ApiResponse<Void> claimReward(
            @PathVariable Long id,
            @RequestParam Long rewardId,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.claimReward(userId, id, rewardId);
    }

    @PostMapping("/{id}/progress")
    public ApiResponse<?> getProgress(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return userActivityService.getUserActivityProgress(userId, id);
    }
}
