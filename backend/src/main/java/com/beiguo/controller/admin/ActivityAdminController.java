package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/activities")
public class ActivityAdminController {

    @Autowired
    private ActivityService activityService;

    @GetMapping
    public ApiResponse<Page<Activity>> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime) {
        return activityService.getActivities(page, size, type, status, startTime);
    }

    @GetMapping("/{id}")
    public ApiResponse<Activity> getActivity(@PathVariable Long id) {
        return activityService.getActivity(id);
    }

    @PostMapping
    public ApiResponse<Activity> createActivity(@RequestBody Activity activity) {
        return activityService.createActivity(activity);
    }

    @PutMapping("/{id}")
    public ApiResponse<Activity> updateActivity(@PathVariable Long id, @RequestBody Activity activity) {
        return activityService.updateActivity(id, activity);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteActivity(@PathVariable Long id) {
        return activityService.deleteActivity(id);
    }

    @GetMapping("/{id}/rewards")
    public ApiResponse<List<ActivityReward>> getRewards(@PathVariable Long id) {
        return activityService.getRewards(id);
    }

    @PostMapping("/{id}/rewards")
    public ApiResponse<ActivityReward> addReward(@PathVariable Long id, @RequestBody ActivityReward reward) {
        return activityService.addReward(id, reward);
    }

    @DeleteMapping("/{id}/rewards/{rewardId}")
    public ApiResponse<Void> deleteReward(@PathVariable Long id, @PathVariable Long rewardId) {
        return activityService.deleteReward(rewardId);
    }
}
