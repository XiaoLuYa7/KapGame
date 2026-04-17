package com.beiguo.repository;

import com.beiguo.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
    boolean existsByCode(String code);

    List<Permission> findByParentIdIsNull();
    List<Permission> findByParentId(Long parentId);

    List<Permission> findByParentIdOrderByOrderNumAsc(Long parentId);
    List<Permission> findByParentIdIsNullOrderByOrderNumAsc();


    @Query("SELECT p FROM Permission p WHERE p.code LIKE %:keyword% OR p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    List<Permission> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT p FROM Permission p WHERE p.id IN :permissionIds")
    List<Permission> findByIds(@Param("permissionIds") Set<Long> permissionIds);

    @Query("SELECT p FROM Permission p WHERE (:code IS NULL OR p.code LIKE %:code%) AND (:name IS NULL OR p.name LIKE %:name%)")
    List<Permission> searchByCodeOrName(@Param("code") String code, @Param("name") String name);

}