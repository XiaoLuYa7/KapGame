package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.EarningType;
import com.beiguo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CardConfigRepository cardConfigRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private EarningRecordRepository earningRecordRepository;

    /**
     * 获取仪表盘统计数据
     */
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 用户总数
        long userCount = userRepository.count();
        stats.put("userCount", userCount);

        // 卡牌总数
        long cardCount = cardConfigRepository.count();
        stats.put("cardCount", cardCount);

        // 活动总数
        long activityCount = activityRepository.count();
        stats.put("activityCount", activityCount);

        // 配置总数
        long configCount = systemConfigRepository.count();
        stats.put("configCount", configCount);

        return ApiResponse.success(stats);
    }

    /**
     * 获取昨日收益汇总
     */
    public ApiResponse<Map<String, Object>> getYesterdayEarnings() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime start = yesterday.atStartOfDay();
        LocalDateTime end = yesterday.plusDays(1).atStartOfDay();

        Map<String, Object> summary = new HashMap<>();

        // 总收益
        BigDecimal total = earningRecordRepository.sumAmountByDate(start, end);
        summary.put("total", total != null ? total : BigDecimal.ZERO);

        // 各类型收益
        for (EarningType type : EarningType.values()) {
            BigDecimal amount = earningRecordRepository.sumAmountByTypeAndDate(type, start, end);
            long count = earningRecordRepository.countByTypeAndEarningDateBetween(type, start, end);
            summary.put(type.name().toLowerCase(), amount != null ? amount : BigDecimal.ZERO);
            summary.put(type.name().toLowerCase() + "Count", count);
        }

        return ApiResponse.success(summary);
    }
}
