package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.EarningType;
import com.beiguo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private CardConfigRepository cardConfigRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private EarningRecordRepository earningRecordRepository;

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 总用户数
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);

        // 今日活跃用户数（今日登录过的用户）
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        long todayActiveUsers = userRepository.countByLastLoginTimeAfter(todayStart);
        stats.put("todayActiveUsers", todayActiveUsers);

        // 总对局数
        long totalGames = gameRepository.count();
        stats.put("totalGames", totalGames);

        // 活跃卡牌数（状态为激活的卡牌）
        long activeCards = cardConfigRepository.countByIsActive(true);
        stats.put("activeCards", activeCards);

        // 在线人数（最近5分钟有登录的用户）
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        long onlineUsers = userRepository.countByLastLoginTimeAfter(fiveMinutesAgo);
        stats.put("onlineUsers", onlineUsers);

        // 访问流量（今日登录次数，这里用今日活跃用户数代替）
        long todayVisits = todayActiveUsers;
        stats.put("todayVisits", todayVisits);

        return ApiResponse.success(stats);
    }

    /**
     * 获取仪表盘统计数据（新版）
     */
    @GetMapping("/stats-new")
    public ApiResponse<Map<String, Object>> getDashboardStatsNew() {
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
    @GetMapping("/yesterday-earnings")
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
