package com.beiguo.service;

import com.beiguo.entity.CardSkin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface CardSkinService {

    // CRUD方法
    CardSkin create(CardSkin cardSkin);
    CardSkin update(Integer id, CardSkin cardSkin);
    void delete(Integer id);
    CardSkin getById(Integer id);
    List<CardSkin> getAll();
    Page<CardSkin> getPage(Pageable pageable);

    // 业务特定方法
    CardSkin activateSkin(Integer id);
    CardSkin deactivateSkin(Integer id);
    CardSkin setAsDefault(Integer id);
    CardSkin updatePrice(Integer id, Integer diamondPrice, Integer goldPrice);

    // 查询方法
    List<CardSkin> getSkinsByCardId(Integer cardId);
    List<CardSkin> getActiveSkinsByCardId(Integer cardId);
    List<CardSkin> getDefaultSkins();
    List<CardSkin> getActiveSkins();
    CardSkin getDefaultSkinByCardId(Integer cardId);

    // 检查方法
    boolean isSkinActive(Integer id);
    boolean isDefaultSkin(Integer id);
    boolean existsByCardIdAndSkinName(Integer cardId, String skinName);

    // 统计方法
    Integer countSkinsByCardId(Integer cardId);
    Integer countActiveSkinsByCardId(Integer cardId);
}