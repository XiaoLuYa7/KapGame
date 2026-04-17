package com.beiguo.service;

import com.beiguo.entity.CardConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface CardConfigService {

    // CRUD方法
    CardConfig create(CardConfig cardConfig);
    CardConfig update(Integer id, CardConfig cardConfig);
    void delete(Integer id);
    CardConfig getById(Integer id);
    List<CardConfig> getAll();
    Page<CardConfig> getPage(Pageable pageable);

    // 业务特定方法
    CardConfig activateCard(Integer id);
    CardConfig deactivateCard(Integer id);
    CardConfig updateEffects(Integer id, String effectsJson, String modifiedBy, String reason);
    CardConfig updateCardStats(Integer id, Integer manaCost, Integer power, Integer health);

    // 查询方法
    List<CardConfig> getActiveCards();
    List<CardConfig> getCardsByType(String type);
    List<CardConfig> getCardsByRarity(String rarity);
    List<CardConfig> getCardsByManaCostRange(Integer minMana, Integer maxMana);
    List<CardConfig> getCardsByName(String name);
    CardConfig getCardByName(String name);

    // 检查方法
    boolean existsByName(String name);
    boolean isActive(Integer id);
    boolean isCardTypeValid(String type);
    boolean isRarityValid(String rarity);

    // 皮肤管理
    Integer countSkinsByCardId(Integer cardId);
    Integer countActiveSkinsByCardId(Integer cardId);

    // 统计方法
    Integer countActiveCards();
    Integer countCardsByType(String type);
    Integer countCardsByRarity(String rarity);
    Integer countCardsByManaCost(Integer manaCost);

    // 批量操作
    List<CardConfig> createBatch(List<CardConfig> cards);
    List<CardConfig> updateBatch(List<CardConfig> cards);
    void deleteBatch(List<Integer> ids);

    // 导入导出
    List<CardConfig> importFromJson(String jsonData);
    String exportToJson(List<Integer> cardIds);

    // 验证方法
    boolean validateCardConfig(CardConfig cardConfig);
    List<String> validateCardConfigBatch(List<CardConfig> cards);
}