package com.beiguo.service.impl;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.Activity;
import com.beiguo.entity.ActivityReward;
import com.beiguo.repository.ActivityRepository;
import com.beiguo.repository.ActivityRewardRepository;
import com.beiguo.service.ActivityService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ActivityServiceImpl implements ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityRewardRepository activityRewardRepository;

    @Override
    @Transactional
    public Activity create(Activity activity) {
        // 验证必要字段
        if (activity.getTitle() == null || activity.getTitle().trim().isEmpty()) {
            throw new RuntimeException("活动标题不能为空");
        }
        if (activity.getActivityType() == null || activity.getActivityType().trim().isEmpty()) {
            throw new RuntimeException("活动类型不能为空");
        }
        if (activity.getRewardType() == null || activity.getRewardType().trim().isEmpty()) {
            throw new RuntimeException("奖励类型不能为空");
        }
        if (activity.getStartTime() == null) {
            throw new RuntimeException("开始时间不能为空");
        }
        if (activity.getEndTime() == null) {
            throw new RuntimeException("结束时间不能为空");
        }

        // 验证时间逻辑
        if (activity.getEndTime().isBefore(activity.getStartTime())) {
            throw new RuntimeException("结束时间不能早于开始时间");
        }

        // 设置默认值
        if (activity.getStatus() == null) {
            activity.setStatus("ACTIVE");
        }
        if (activity.getSortOrder() == null) {
            activity.setSortOrder(0);
        }

        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity update(Long id, Activity activity) {
        Activity existing = getById(id);

        // 更新允许的字段
        if (activity.getTitle() != null) {
            existing.setTitle(activity.getTitle());
        }
        if (activity.getDescription() != null) {
            existing.setDescription(activity.getDescription());
        }
        if (activity.getImageUrl() != null) {
            existing.setImageUrl(activity.getImageUrl());
        }
        if (activity.getActivityType() != null) {
            existing.setActivityType(activity.getActivityType());
        }
        if (activity.getRewardType() != null) {
            existing.setRewardType(activity.getRewardType());
        }
        if (activity.getRewardValue() != null) {
            existing.setRewardValue(activity.getRewardValue());
        }
        if (activity.getStartTime() != null) {
            existing.setStartTime(activity.getStartTime());
        }
        if (activity.getEndTime() != null) {
            existing.setEndTime(activity.getEndTime());
        }
        if (activity.getStatus() != null) {
            existing.setStatus(activity.getStatus());
        }
        if (activity.getSortOrder() != null) {
            existing.setSortOrder(activity.getSortOrder());
        }
        if (activity.getLastModifiedBy() != null) {
            existing.setLastModifiedBy(activity.getLastModifiedBy());
        }
        if (activity.getLastModifiedReason() != null) {
            existing.setLastModifiedReason(activity.getLastModifiedReason());
        }

        existing.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new RuntimeException("活动不存在");
        }
        activityRepository.deleteById(id);
    }

    @Override
    public Activity getById(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("活动不存在"));
    }

    @Override
    public List<Activity> getAll() {
        return activityRepository.findAll();
    }

    @Override
    public Page<Activity> getPage(Pageable pageable) {
        return activityRepository.findAll(pageable);
    }

    @Override
    public ApiResponse<Page<Activity>> getActivities(int page, int size, String type, String status, String startTime) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime"));

            Specification<Activity> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (type != null && !type.isEmpty()) {
                    predicates.add(cb.equal(root.get("activityType"), type));
                }
                if (status != null && !status.isEmpty()) {
                    predicates.add(cb.equal(root.get("status"), status));
                }
                if (startTime != null && !startTime.isEmpty()) {
                    LocalDateTime startDateTime = LocalDateTime.parse(startTime + "T00:00:00");
                    LocalDateTime nextDay = startDateTime.plusDays(1);
                    predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startDateTime));
                    predicates.add(cb.lessThan(root.get("startTime"), nextDay));
                }

                return cb.and(predicates.toArray(new Predicate[0]));
            };

            Page<Activity> result = activityRepository.findAll(spec, pageable);

            // 填充每个活动的奖励数量
            for (Activity a : result.getContent()) {
                long count = activityRewardRepository.countByActivityId(a.getId());
                a.setRewardCount((int) count);
            }

            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("获取活动列表失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Activity> getActivity(Long id) {
        try {
            return ApiResponse.success(getById(id));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    public ApiResponse<Activity> createActivity(Activity activity) {
        try {
            return ApiResponse.success(create(activity));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    public ApiResponse<Activity> updateActivity(Long id, Activity activity) {
        try {
            return ApiResponse.success(update(id, activity));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    public ApiResponse<Void> deleteActivity(Long id) {
        try {
            delete(id);
            return ApiResponse.success();
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    public ApiResponse<ActivityReward> addReward(Long activityId, ActivityReward reward) {
        try {
            Activity activity = getById(activityId);
            reward.setActivity(activity);
            ActivityReward saved = activityRewardRepository.save(reward);
            return ApiResponse.success(saved);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    public ApiResponse<Void> deleteReward(Long rewardId) {
        try {
            activityRewardRepository.deleteById(rewardId);
            return ApiResponse.success();
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Override
    @Transactional
    public Activity activateActivity(Long id) {
        Activity activity = getById(id);
        activity.setStatus("ACTIVE");
        activity.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity deactivateActivity(Long id) {
        Activity activity = getById(id);
        activity.setStatus("INACTIVE");
        activity.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity startActivity(Long id) {
        Activity activity = getById(id);
        activity.setStatus("ACTIVE");
        activity.setStartTime(LocalDateTime.now());
        activity.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity endActivity(Long id) {
        Activity activity = getById(id);
        activity.setStatus("EXPIRED");
        activity.setEndTime(LocalDateTime.now());
        activity.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity updateRewards(Long id, String rewardsJson) {
        Activity activity = getById(id);
        activity.setRewardValue(rewardsJson);
        activity.setUpdateTime(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    @Override
    public List<Activity> getActiveActivities() {
        LocalDateTime now = LocalDateTime.now();
        return activityRepository.findAll().stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()) &&
                        a.getStartTime() != null && a.getStartTime().isBefore(now) &&
                        a.getEndTime() != null && a.getEndTime().isAfter(now))
                .toList();
    }

    @Override
    public List<Activity> getUpcomingActivities() {
        LocalDateTime now = LocalDateTime.now();
        return activityRepository.findAll().stream()
                .filter(a -> ("ACTIVE".equals(a.getStatus()) || "INACTIVE".equals(a.getStatus())) &&
                        a.getStartTime() != null && a.getStartTime().isAfter(now))
                .toList();
    }

    @Override
    public List<Activity> getEndedActivities() {
        LocalDateTime now = LocalDateTime.now();
        return activityRepository.findAll().stream()
                .filter(a -> "EXPIRED".equals(a.getStatus()) ||
                        (a.getEndTime() != null && a.getEndTime().isBefore(now)))
                .toList();
    }

    @Override
    public List<Activity> getActivitiesByType(String type) {
        return activityRepository.findAll().stream()
                .filter(a -> type.equals(a.getActivityType()))
                .toList();
    }

    @Override
    public List<Activity> getActivitiesByStatus(String status) {
        return activityRepository.findAll().stream()
                .filter(a -> status.equals(a.getStatus()))
                .toList();
    }

    @Override
    public boolean isActivityActive(Long id) {
        Activity activity = getById(id);
        LocalDateTime now = LocalDateTime.now();
        return "ACTIVE".equals(activity.getStatus()) &&
                activity.getStartTime() != null && activity.getStartTime().isBefore(now) &&
                activity.getEndTime() != null && activity.getEndTime().isAfter(now);
    }

    @Override
    public boolean isActivityUpcoming(Long id) {
        Activity activity = getById(id);
        LocalDateTime now = LocalDateTime.now();
        return ("ACTIVE".equals(activity.getStatus()) || "INACTIVE".equals(activity.getStatus())) &&
                activity.getStartTime() != null && activity.getStartTime().isAfter(now);
    }

    @Override
    public boolean isActivityEnded(Long id) {
        Activity activity = getById(id);
        LocalDateTime now = LocalDateTime.now();
        return "EXPIRED".equals(activity.getStatus()) ||
                (activity.getEndTime() != null && activity.getEndTime().isBefore(now));
    }

    @Override
    public Integer countActiveActivities() {
        return getActiveActivities().size();
    }

    @Override
    public Integer countUpcomingActivities() {
        return getUpcomingActivities().size();
    }

    @Override
    public Integer countEndedActivities() {
        return getEndedActivities().size();
    }

    @Override
    public Integer countActivitiesByType(String type) {
        return getActivitiesByType(type).size();
    }

    @Override
    public List<Activity> getActiveActivitiesByType(String type) {
        LocalDateTime now = LocalDateTime.now();
        return activityRepository.findAll().stream()
                .filter(a -> type.equals(a.getActivityType()) &&
                        "ACTIVE".equals(a.getStatus()) &&
                        a.getStartTime() != null && a.getStartTime().isBefore(now) &&
                        a.getEndTime() != null && a.getEndTime().isAfter(now))
                .toList();
    }

    @Override
    public ApiResponse<List<ActivityReward>> getRewards(Long activityId) {
        try {
            return ApiResponse.success(activityRewardRepository.findByActivityIdOrderBySortOrderAsc(activityId));
        } catch (Exception e) {
            return ApiResponse.error("获取奖励列表失败: " + e.getMessage());
        }
    }

    @Override
    public int updateExpiredActivities() {
        List<Activity> expired = activityRepository.findExpiredActivities(LocalDateTime.now());
        for (Activity activity : expired) {
            activity.setStatus("INACTIVE");
            activity.setUpdateTime(LocalDateTime.now());
            activityRepository.save(activity);
        }
        return expired.size();
    }
}