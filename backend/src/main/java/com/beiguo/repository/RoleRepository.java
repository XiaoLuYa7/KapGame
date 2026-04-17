package com.beiguo.repository;

import com.beiguo.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    boolean existsByName(String name);

    List<Role> findByStatus(String status);
    List<Role> findAllByOrderByNameAsc();

    @Query("SELECT r FROM Role r WHERE r.id IN :roleIds")
    List<Role> findByIds(@Param("roleIds") Set<Long> roleIds);

    @Query("SELECT r FROM Role r WHERE r.name LIKE %:keyword% OR r.description LIKE %:keyword%")
    List<Role> searchByKeyword(@Param("keyword") String keyword);

    List<Role> findByUsers_Id(Long userId);
    Integer countByStatus(String status);
}