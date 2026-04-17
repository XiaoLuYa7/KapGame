package com.beiguo.repository;

import com.beiguo.entity.MailConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MailConfigRepository extends JpaRepository<MailConfig, Long> {
    List<MailConfig> findByStatus(String status);
    List<MailConfig> findAllByOrderByCreateTimeDesc();
    List<MailConfig> findBySendTimeBetween(LocalDateTime start, LocalDateTime end);
    @Query("SELECT COUNT(m) FROM MailConfig m WHERE m.status = 'SENT'")
    Integer countSent();
}
