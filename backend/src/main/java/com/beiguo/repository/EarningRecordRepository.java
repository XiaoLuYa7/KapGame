package com.beiguo.repository;

import com.beiguo.entity.EarningRecord;
import com.beiguo.entity.EarningType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EarningRecordRepository extends JpaRepository<EarningRecord, Long>, JpaSpecificationExecutor<EarningRecord> {

    /**
     * 根据类型查询收益记录
     */
    Page<EarningRecord> findByType(EarningType type, Pageable pageable);

    /**
     * 根据日期范围查询收益记录
     */
    Page<EarningRecord> findByEarningDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 根据类型和日期范围查询收益记录
     */
    Page<EarningRecord> findByTypeAndEarningDateBetween(
            EarningType type, LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 查询指定日期的总收益
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EarningRecord e WHERE e.earningDate >= :start AND e.earningDate < :end")
    BigDecimal sumAmountByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 查询指定日期和类型的收益
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EarningRecord e WHERE e.type = :type AND e.earningDate >= :start AND e.earningDate < :end")
    BigDecimal sumAmountByTypeAndDate(@Param("type") EarningType type,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    /**
     * 查询指定日期和类型的记录数
     */
    long countByTypeAndEarningDateBetween(EarningType type, LocalDateTime start, LocalDateTime end);

    /**
     * 获取最近N条收益记录
     */
    List<EarningRecord> findTop10ByOrderByEarningDateDesc();

    /**
     * 按类型分组统计某日期范围内的收益
     */
    @Query("SELECT e.type, COUNT(e), COALESCE(SUM(e.amount), 0) FROM EarningRecord e " +
           "WHERE e.earningDate >= :start AND e.earningDate < :end " +
           "GROUP BY e.type")
    List<Object[]> sumAmountGroupByType(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
