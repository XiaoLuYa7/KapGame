package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.ActivityReward;

import java.util.Map;

public interface UserActivityService {
    ApiResponse<Void> signIn(Long userId, Long activityId);
    ApiResponse<Void> claimReward(Long userId, Long activityId, Long rewardId);
    ApiResponse<Map<String, Object>> getUserActivityProgress(Long userId, Long activityId);
}
