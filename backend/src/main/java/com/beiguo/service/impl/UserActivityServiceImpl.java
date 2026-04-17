package com.beiguo.service.impl;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.*;
import com.beiguo.repository.*;
import com.beiguo.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserActivityServiceImpl implements UserActivityService {

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityRewardRepository activityRewardRepository;

    @Autowired
    private UserRewardRepository userRewardRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ApiResponse<Void> signIn(Long userId, Long activityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("活动不存在"));

        Optional<UserActivity> existing = userActivityRepository.findByUserIdAndActivityId(userId, activityId);
        if (existing.isPresent()) {
            return ApiResponse.error("今日已签到");
        }

        UserActivity userActivity = new UserActivity();
        userActivity.setUser(user);
        userActivity.setActivity(activity);
        userActivity.setProgress(1);
        userActivity.setStatus("DOING");
        userActivityRepository.save(userActivity);

        return ApiResponse.successMessage("签到成功");
    }

    @Override
    @Transactional
    public ApiResponse<Void> claimReward(Long userId, Long activityId, Long rewardId) {
        if (userRewardRepository.existsByUserIdAndRewardId(userId, rewardId)) {
            return ApiResponse.error("奖励已领取");
        }

        ActivityReward reward = activityRewardRepository.findById(rewardId)
                .orElseThrow(() -> new RuntimeException("奖励不存在"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("活动不存在"));

        UserReward userReward = new UserReward();
        userReward.setUser(user);
        userReward.setActivity(activity);
        userReward.setReward(reward);
        userRewardRepository.save(userReward);

        return ApiResponse.successMessage("领取成功");
    }

    @Override
    public ApiResponse<Map<String, Object>> getUserActivityProgress(Long userId, Long activityId) {
        Optional<UserActivity> uaOpt = userActivityRepository.findByUserIdAndActivityId(userId, activityId);
        Map<String, Object> progress = new HashMap<>();

        if (uaOpt.isPresent()) {
            UserActivity ua = uaOpt.get();
            progress.put("progress", ua.getProgress());
            progress.put("status", ua.getStatus());
            progress.put("startTime", ua.getStartTime());
            progress.put("updateTime", ua.getUpdateTime());
        } else {
            progress.put("progress", 0);
            progress.put("status", "NOT_STARTED");
        }

        List<ActivityReward> rewards = activityRewardRepository.findByActivityIdOrderBySortOrderAsc(activityId);
        progress.put("totalRewards", rewards.size());

        return ApiResponse.success(progress);
    }
}
