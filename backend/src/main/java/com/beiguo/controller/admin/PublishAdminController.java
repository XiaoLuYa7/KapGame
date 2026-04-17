package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.PublishHistory;
import com.beiguo.service.PublishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/publish")
public class PublishAdminController {
    @Autowired
    private PublishService publishService;

    static class PublishRequest {
        private String description;
        private String publishedBy = "系统管理员";

        // getters and setters
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPublishedBy() { return publishedBy; }
        public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }
    }

    @PostMapping
    public ApiResponse<PublishHistory> publishConfig(@RequestBody PublishRequest request) {
        try {
            // 从安全上下文获取当前管理员信息（简化：使用参数）
            // 实际应从SecurityContextHolder获取
            Long adminId = 1L; // 默认管理员ID

            PublishHistory history = publishService.publishConfig(
                request.getPublishedBy(),
                adminId,
                request.getDescription()
            );
            return ApiResponse.success("发布成功", history);
        } catch (RuntimeException e) {
            return ApiResponse.error("发布失败: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public ApiResponse<List<PublishHistory>> getPublishHistory() {
        try {
            List<PublishHistory> history = publishService.getPublishHistory();
            return ApiResponse.success(history);
        } catch (RuntimeException e) {
            return ApiResponse.error("获取发布历史失败: " + e.getMessage());
        }
    }

    @GetMapping("/latest")
    public ApiResponse<PublishHistory> getLatestPublish() {
        try {
            PublishHistory latest = publishService.getLatestPublishedConfig();
            return ApiResponse.success(latest);
        } catch (RuntimeException e) {
            return ApiResponse.error("获取最新发布失败: " + e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getPublishStats() {
        try {
            PublishHistory latest = publishService.getLatestPublishedConfig();
            Map<String, Object> stats = Map.of(
                "version", latest.getVersion(),
                "publishTime", latest.getPublishTime(),
                "cardCount", latest.getCardCount(),
                "activityCount", latest.getActivityCount(),
                "configCount", latest.getConfigCount(),
                "publishedBy", latest.getPublishedBy()
            );
            return ApiResponse.success(stats);
        } catch (RuntimeException e) {
            return ApiResponse.error("获取统计信息失败: " + e.getMessage());
        }
    }
}