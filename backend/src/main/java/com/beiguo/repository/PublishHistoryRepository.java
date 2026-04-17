package com.beiguo.repository;

import com.beiguo.entity.PublishHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PublishHistoryRepository extends JpaRepository<PublishHistory, Long> {
    List<PublishHistory> findAllByOrderByPublishTimeDesc();
    Optional<PublishHistory> findTopByOrderByPublishTimeDesc();
    List<PublishHistory> findByVersion(String version);
    List<PublishHistory> findByPublishedByContaining(String username);
    List<PublishHistory> findByAdminId(Long adminId);
    List<PublishHistory> findByPublishTimeBetween(LocalDateTime start, LocalDateTime end);
    Integer countByAdminId(Long adminId);
}