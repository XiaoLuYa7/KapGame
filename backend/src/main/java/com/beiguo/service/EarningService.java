package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.EarningRecord;
import com.beiguo.entity.EarningType;
import com.beiguo.repository.EarningRecordRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EarningService {

    @Autowired
    private EarningRecordRepository earningRecordRepository;

    /**
     * 分页查询收益记录 - 使用Specification动态构建查询条件
     */
    public ApiResponse<Map<String, Object>> getEarningsPage(
            EarningType type, LocalDate startDate, LocalDate endDate, int page, int size) {

        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "earningDate"));

        Specification<EarningRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("earningDate"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(cb.lessThan(root.get("earningDate"), endDate.plusDays(1).atStartOfDay()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<EarningRecord> recordPage = earningRecordRepository.findAll(spec, pageRequest);

        Map<String, Object> result = new HashMap<>();
        result.put("content", recordPage.getContent());
        result.put("totalElements", recordPage.getTotalElements());
        result.put("totalPages", recordPage.getTotalPages());
        result.put("currentPage", page);
        result.put("pageSize", size);

        return ApiResponse.success(result);
    }

    /**
     * 获取昨日收益汇总
     */
    public ApiResponse<Map<String, Object>> getYesterdaySummary() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime start = yesterday.atStartOfDay();
        LocalDateTime end = yesterday.plusDays(1).atStartOfDay();

        Map<String, Object> summary = new HashMap<>();

        // 总收益
        BigDecimal total = earningRecordRepository.sumAmountByDate(start, end);
        summary.put("total", total != null ? total : BigDecimal.ZERO);

        // 各类型收益
        Map<String, Object> skinData = getTypeData(EarningType.SKIN_PURCHASE, start, end);
        Map<String, Object> adData = getTypeData(EarningType.AD_REVENUE, start, end);
        Map<String, Object> sponsorData = getTypeData(EarningType.SPONSOR, start, end);
        Map<String, Object> trafficData = getTypeData(EarningType.TRAFFIC, start, end);

        summary.put("skin", skinData.get("amount"));
        summary.put("skinCount", skinData.get("count"));
        summary.put("ad", adData.get("amount"));
        summary.put("adCount", adData.get("count"));
        summary.put("sponsor", sponsorData.get("amount"));
        summary.put("sponsorCount", sponsorData.get("count"));
        summary.put("traffic", trafficData.get("amount"));
        summary.put("trafficCount", trafficData.get("count"));

        return ApiResponse.success(summary);
    }

    /**
     * 获取指定日期范围的收益汇总
     */
    public ApiResponse<Map<String, Object>> getSummaryByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveStart = (startDate != null) ? startDate : LocalDate.of(2020, 1, 1);
        LocalDate effectiveEnd = (endDate != null) ? endDate : LocalDate.now();
        LocalDateTime start = effectiveStart.atStartOfDay();
        LocalDateTime end = effectiveEnd.plusDays(1).atStartOfDay();

        Map<String, Object> summary = new HashMap<>();

        BigDecimal total = earningRecordRepository.sumAmountByDate(start, end);
        summary.put("total", total != null ? total : BigDecimal.ZERO);

        // 各类型收益 - 使用与前端对应的字段名
        Map<String, Object> skinData = getTypeData(EarningType.SKIN_PURCHASE, start, end);
        Map<String, Object> adData = getTypeData(EarningType.AD_REVENUE, start, end);
        Map<String, Object> sponsorData = getTypeData(EarningType.SPONSOR, start, end);
        Map<String, Object> trafficData = getTypeData(EarningType.TRAFFIC, start, end);

        summary.put("skinPurchase", skinData.get("amount"));
        summary.put("skinPurchaseCount", skinData.get("count"));
        summary.put("adRevenue", adData.get("amount"));
        summary.put("adRevenueCount", adData.get("count"));
        summary.put("sponsor", sponsorData.get("amount"));
        summary.put("sponsorCount", sponsorData.get("count"));
        summary.put("traffic", trafficData.get("amount"));
        summary.put("trafficCount", trafficData.get("count"));

        return ApiResponse.success(summary);
    }

    /**
     * 创建收益记录
     */
    public ApiResponse<EarningRecord> createEarning(EarningRecord record) {
        if (record.getEarningDate() == null) {
            record.setEarningDate(LocalDateTime.now());
        }
        EarningRecord saved = earningRecordRepository.save(record);
        return ApiResponse.success("收益记录创建成功", saved);
    }

    /**
     * 删除收益记录
     */
    public ApiResponse<Void> deleteEarning(Long id) {
        earningRecordRepository.deleteById(id);
        return ApiResponse.success("收益记录删除成功", null);
    }

    private Map<String, Object> getTypeData(EarningType type, LocalDateTime start, LocalDateTime end) {
        Map<String, Object> data = new HashMap<>();
        BigDecimal amount = earningRecordRepository.sumAmountByTypeAndDate(type, start, end);
        long count = earningRecordRepository.countByTypeAndEarningDateBetween(type, start, end);
        data.put("amount", amount != null ? amount : BigDecimal.ZERO);
        data.put("count", count);
        return data;
    }
}
