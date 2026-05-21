package com.beiguo.service;

import com.beiguo.dto.DailyCheckInResponse;

public interface DailyCheckInService {
    DailyCheckInResponse getCurrentWeek();
    DailyCheckInResponse claimToday();
    DailyCheckInResponse claimTodayWithMultiplier(int multiplier);
}
