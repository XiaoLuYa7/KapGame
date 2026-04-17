package com.beiguo.repository;

import com.beiguo.entity.SysDict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SysDictRepository extends JpaRepository<SysDict, Long> {

    List<SysDict> findByCategoryOrderBySortOrderAsc(String category);

    @Query("SELECT d FROM SysDict d WHERE d.category = :category ORDER BY d.sortOrder ASC")
    List<SysDict> findListByCategory(String category);

    List<SysDict> findByCategoryIn(List<String> categories);
}
