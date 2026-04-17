package com.beiguo.service;

import com.beiguo.entity.PublishHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface PublishService {
    // Existing methods
    PublishHistory publishConfig(String publishedBy, Long adminId, String description);
    PublishHistory getLatestPublishedConfig();
    List<PublishHistory> getPublishHistory();
    Map<String, Object> getPublishedConfigData();
    String getCurrentVersion();

    // New CRUD methods for PublishHistory
    PublishHistory create(PublishHistory publishHistory);
    PublishHistory update(Long id, PublishHistory publishHistory);
    void delete(Long id);
    PublishHistory getById(Long id);
    List<PublishHistory> getAll();
    Page<PublishHistory> getPage(Pageable pageable);

    // New query methods
    List<PublishHistory> getByAdminId(Long adminId);
    List<PublishHistory> getByVersion(String version);
    List<PublishHistory> getByDateRange(LocalDateTime start, LocalDateTime end);

    // New statistical methods
    Integer countAll();
    Integer countByAdminId(Long adminId);
    Map<String, Integer> getPublishStatsByMonth();
}