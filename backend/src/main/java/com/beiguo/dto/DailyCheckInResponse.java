package com.beiguo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyCheckInResponse {
    private String weekStartDate;
    private int todayIndex;
    private boolean todayClaimed;
    private Integer userGold;
    private Integer userDiamond;
    private List<DailyCheckInReward> rewards;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyCheckInReward {
        private int dayIndex;
        private String rewardType;
        private int rewardCount;
        private boolean claimed;
        private boolean claimable;
    }
}
