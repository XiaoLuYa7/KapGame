package com.beiguo.repository;

import com.beiguo.entity.AdminUser;
import com.beiguo.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);
    boolean existsByUsername(String username);

    List<AdminUser> findByStatus(String status);
    List<AdminUser> findByRole(Role role);

    @Query("SELECT u FROM AdminUser u WHERE u.role.name = :roleName")
    List<AdminUser> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM AdminUser u WHERE u.username LIKE %:keyword% OR u.realName LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<AdminUser> searchByKeyword(@Param("keyword") String keyword);

    long countByLastLoginTimeAfter(LocalDateTime time);

    @Query("SELECT COUNT(u) FROM AdminUser u WHERE u.status = 'ACTIVE'")
    long countActiveUsers();

    long countByRole(Role role);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AdminUser u SET u.onlineStatus = :status WHERE u.id = :id")
    void updateOnlineStatus(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AdminUser u SET u.lastHeartbeatTime = :time WHERE u.id = :id")
    void updateHeartbeatTime(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("time") java.time.LocalDateTime time);

    List<AdminUser> findByOnlineStatus(String onlineStatus);
}