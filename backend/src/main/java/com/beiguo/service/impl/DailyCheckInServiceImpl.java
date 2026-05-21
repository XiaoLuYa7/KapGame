package com.beiguo.service.impl;

import com.beiguo.dto.DailyCheckInResponse;
import com.beiguo.entity.User;
import com.beiguo.repository.UserRepository;
import com.beiguo.service.DailyCheckInService;
import com.beiguo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DailyCheckInServiceImpl implements DailyCheckInService {
    private static final int[] MOCK_WEEKLY_REWARDS = {100, 120, 150, 180, 220, 260, 320};
    private static final String REWARD_TYPE_GOLD = "GOLD";

    private final Map<Long, String> userWeekStartDate = new HashMap<>();
    private final Map<Long, Set<Integer>> userClaimedDays = new HashMap<>();
    private final Map<Long, String> userLastClaimDate = new HashMap<>();

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public DailyCheckInResponse getCurrentWeek() {
        User user = userService.getCurrentUser();
        ensureCurrentWeek(user.getId());
        return buildResponse(user);
    }

    @Override
    @Transactional
    public DailyCheckInResponse claimToday() {
        return claimTodayWithMultiplier(1);
    }

    @Override
    @Transactional
    public DailyCheckInResponse claimTodayWithMultiplier(int multiplier) {
        User user = userService.getCurrentUser();
        ensureCurrentWeek(user.getId());

        if (getLocalDateKey().equals(userLastClaimDate.get(user.getId()))) {
            throw new RuntimeException("今日已领取");
        }

        int claimDayIndex = getNextClaimableDayIndex(user.getId());
        if (claimDayIndex == 0) {
            throw new RuntimeException("暂无可领取签到奖励");
        }

        Set<Integer> claimedDays = userClaimedDays.computeIfAbsent(user.getId(), key -> new HashSet<>());
        int rewardCount = MOCK_WEEKLY_REWARDS[claimDayIndex - 1] * Math.max(1, multiplier);
        user.setGold((user.getGold() == null ? 0 : user.getGold()) + rewardCount);
        user.setUpdateTime(LocalDateTime.now());
        user = userRepository.save(user);
        claimedDays.add(claimDayIndex);
        userLastClaimDate.put(user.getId(), getLocalDateKey());

        return buildResponse(user);
    }

    private DailyCheckInResponse buildResponse(User user) {
        int todayIndex = getTodayIndex();
        Set<Integer> claimedDays = userClaimedDays.computeIfAbsent(user.getId(), key -> new HashSet<>());
        boolean claimedToday = getLocalDateKey().equals(userLastClaimDate.get(user.getId()));
        int nextClaimableDayIndex = claimedToday ? 0 : getNextClaimableDayIndex(user.getId());
        List<DailyCheckInResponse.DailyCheckInReward> rewards = new ArrayList<>();
        for (int dayIndex = 1; dayIndex <= MOCK_WEEKLY_REWARDS.length; dayIndex++) {
            boolean claimed = claimedDays.contains(dayIndex);
            rewards.add(new DailyCheckInResponse.DailyCheckInReward(
                    dayIndex,
                    REWARD_TYPE_GOLD,
                    MOCK_WEEKLY_REWARDS[dayIndex - 1],
                    claimed,
                    dayIndex == nextClaimableDayIndex
            ));
        }

        return new DailyCheckInResponse(
                getWeekStartDate(),
                todayIndex,
                claimedToday || nextClaimableDayIndex == 0,
                user.getGold(),
                user.getDiamond(),
                rewards
        );
    }

    private void ensureCurrentWeek(Long userId) {
        String currentWeekStart = getWeekStartDate();
        String storedWeekStart = userWeekStartDate.get(userId);
        if (!currentWeekStart.equals(storedWeekStart)) {
            userWeekStartDate.put(userId, currentWeekStart);
            userClaimedDays.put(userId, new HashSet<>());
            userLastClaimDate.remove(userId);
        }
    }

    private int getNextClaimableDayIndex(Long userId) {
        int todayIndex = getTodayIndex();
        Set<Integer> claimedDays = userClaimedDays.computeIfAbsent(userId, key -> new HashSet<>());
        for (int dayIndex = 1; dayIndex <= todayIndex; dayIndex++) {
            if (!claimedDays.contains(dayIndex)) {
                return dayIndex;
            }
        }
        return 0;
    }

    private int getTodayIndex() {
        return LocalDate.now().getDayOfWeek().getValue();
    }

    private String getLocalDateKey() {
        return LocalDate.now().toString();
    }

    private String getWeekStartDate() {
        return LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toString();
    }
}
