package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.EarningRecord;
import com.beiguo.entity.EarningType;
import com.beiguo.service.EarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/admin/earnings")
public class EarningController {

    @Autowired
    private EarningService earningService;

    /**
     * 分页查询收益记录
     * @param type 收益类型：SKIN_PURCHASE, AD_REVENUE, SPONSOR
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param page 页码
     * @param size 每页大小
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getEarningsPage(
            @RequestParam(required = false) EarningType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return earningService.getEarningsPage(type, startDate, endDate, page, size);
    }

    /**
     * 获取昨日收益汇总
     */
    @GetMapping("/yesterday-summary")
    public ApiResponse<Map<String, Object>> getYesterdaySummary() {
        return earningService.getYesterdaySummary();
    }

    /**
     * 获取指定日期范围的收益汇总
     */
    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getSummaryByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return earningService.getSummaryByDateRange(startDate, endDate);
    }

    /**
     * 创建收益记录
     */
    @PostMapping
    public ApiResponse<EarningRecord> createEarning(@RequestBody EarningRecord record) {
        return earningService.createEarning(record);
    }

    /**
     * 删除收益记录
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteEarning(@PathVariable Long id) {
        return earningService.deleteEarning(id);
    }
}
