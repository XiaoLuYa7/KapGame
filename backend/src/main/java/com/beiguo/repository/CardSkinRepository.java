package com.beiguo.repository;

import com.beiguo.entity.CardSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardSkinRepository extends JpaRepository<CardSkin, Integer> {

    // 根据卡牌ID查找所有皮肤
    List<CardSkin> findByCardConfig_Id(Integer cardId);

    // 根据卡牌ID和是否激活查找皮肤
    List<CardSkin> findByCardConfig_IdAndIsActive(Integer cardId, Boolean isActive);

    // 根据是否默认皮肤查找
    List<CardSkin> findByIsDefault(Boolean isDefault);

    // 根据卡牌ID查找默认皮肤
    Optional<CardSkin> findByCardConfig_IdAndIsDefault(Integer cardId, Boolean isDefault);

    // 根据卡牌ID和皮肤名称查找
    Optional<CardSkin> findByCardConfig_IdAndSkinName(Integer cardId, String skinName);

    // 查找所有激活的皮肤
    List<CardSkin> findByIsActiveTrue();

    // 根据卡牌ID查找并按显示顺序排序
    List<CardSkin> findByCardConfig_IdOrderByDisplayOrderAsc(Integer cardId);

    // 根据卡牌ID和是否激活查找并按显示顺序排序
    List<CardSkin> findByCardConfig_IdAndIsActiveOrderByDisplayOrderAsc(Integer cardId, Boolean isActive);
}