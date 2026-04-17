package com.beiguo.service.impl;

import com.beiguo.entity.CardConfig;
import com.beiguo.repository.CardConfigRepository;
import com.beiguo.service.CardConfigService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CardConfigServiceImpl implements CardConfigService {

    @Autowired
    private CardConfigRepository cardConfigRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 有效的卡牌类型
    private static final List<String> VALID_TYPES = List.of("ATTACK", "DEFENSE", "UTILITY");

    // 有效的稀有度
    private static final List<String> VALID_RARITIES = List.of("COMMON", "RARE", "EPIC", "LEGENDARY");

    @Override
    @Transactional
    public CardConfig create(CardConfig cardConfig) {
        // 验证必要字段
        if (cardConfig.getName() == null || cardConfig.getName().trim().isEmpty()) {
            throw new RuntimeException("卡牌名称不能为空");
        }
        if (cardConfig.getType() == null || cardConfig.getType().trim().isEmpty()) {
            throw new RuntimeException("卡牌类型不能为空");
        }
        if (cardConfig.getEffects() == null || cardConfig.getEffects().trim().isEmpty()) {
            throw new RuntimeException("卡牌效果不能为空");
        }

        // 验证字段值有效性
        if (!isCardTypeValid(cardConfig.getType())) {
            throw new RuntimeException("无效的卡牌类型: " + cardConfig.getType() +
                "，有效类型: " + String.join(", ", VALID_TYPES));
        }
        if (cardConfig.getRarity() != null && !isRarityValid(cardConfig.getRarity())) {
            throw new RuntimeException("无效的稀有度: " + cardConfig.getRarity() +
                "，有效稀有度: " + String.join(", ", VALID_RARITIES));
        }

        // 验证JSON格式效果
        try {
            objectMapper.readTree(cardConfig.getEffects());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("卡牌效果JSON格式无效: " + e.getMessage());
        }

        // 检查卡牌名称是否已存在
        if (cardConfigRepository.existsByName(cardConfig.getName())) {
            throw new RuntimeException("卡牌名称已存在: " + cardConfig.getName());
        }

        // 设置默认值
        if (cardConfig.getRarity() == null || cardConfig.getRarity().trim().isEmpty()) {
            cardConfig.setRarity("COMMON");
        }
        if (cardConfig.getManaCost() == null) {
            cardConfig.setManaCost(0);
        }
        if (cardConfig.getPower() == null) {
            cardConfig.setPower(0);
        }
        if (cardConfig.getHealth() == null) {
            cardConfig.setHealth(0);
        }
        if (cardConfig.getIsActive() == null) {
            cardConfig.setIsActive(true);
        }

        // 保存卡牌配置
        return cardConfigRepository.save(cardConfig);
    }

    @Override
    @Transactional
    public CardConfig update(Integer id, CardConfig cardConfig) {
        CardConfig existingCard = getById(id);

        // 如果卡牌名称有变化，检查是否已存在
        if (cardConfig.getName() != null && !cardConfig.getName().equals(existingCard.getName())) {
            if (cardConfigRepository.existsByName(cardConfig.getName())) {
                throw new RuntimeException("卡牌名称已存在: " + cardConfig.getName());
            }
            existingCard.setName(cardConfig.getName());
        }

        // 更新其他字段
        if (cardConfig.getDescription() != null) {
            existingCard.setDescription(cardConfig.getDescription());
        }
        if (cardConfig.getType() != null && !cardConfig.getType().trim().isEmpty()) {
            if (!isCardTypeValid(cardConfig.getType())) {
                throw new RuntimeException("无效的卡牌类型: " + cardConfig.getType());
            }
            existingCard.setType(cardConfig.getType());
        }
        if (cardConfig.getRarity() != null && !cardConfig.getRarity().trim().isEmpty()) {
            if (!isRarityValid(cardConfig.getRarity())) {
                throw new RuntimeException("无效的稀有度: " + cardConfig.getRarity());
            }
            existingCard.setRarity(cardConfig.getRarity());
        }
        if (cardConfig.getImageUrl() != null) {
            existingCard.setImageUrl(cardConfig.getImageUrl());
        }
        if (cardConfig.getManaCost() != null) {
            existingCard.setManaCost(cardConfig.getManaCost());
        }
        if (cardConfig.getPower() != null) {
            existingCard.setPower(cardConfig.getPower());
        }
        if (cardConfig.getHealth() != null) {
            existingCard.setHealth(cardConfig.getHealth());
        }
        if (cardConfig.getIsActive() != null) {
            existingCard.setIsActive(cardConfig.getIsActive());
        }
        if (cardConfig.getEffects() != null && !cardConfig.getEffects().trim().isEmpty()) {
            // 验证JSON格式
            try {
                objectMapper.readTree(cardConfig.getEffects());
                existingCard.setEffects(cardConfig.getEffects());
            } catch (JsonProcessingException e) {
                throw new RuntimeException("卡牌效果JSON格式无效: " + e.getMessage());
            }
        }
        if (cardConfig.getLastModifiedBy() != null) {
            existingCard.setLastModifiedBy(cardConfig.getLastModifiedBy());
        }
        if (cardConfig.getLastModifiedReason() != null) {
            existingCard.setLastModifiedReason(cardConfig.getLastModifiedReason());
        }

        return cardConfigRepository.save(existingCard);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        CardConfig card = getById(id);
        cardConfigRepository.delete(card);
    }

    @Override
    public CardConfig getById(Integer id) {
        return cardConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("卡牌配置不存在，ID: " + id));
    }

    @Override
    public List<CardConfig> getAll() {
        return cardConfigRepository.findAllByOrderByNameAsc();
    }

    @Override
    public Page<CardConfig> getPage(Pageable pageable) {
        return cardConfigRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public CardConfig activateCard(Integer id) {
        CardConfig card = getById(id);
        card.setIsActive(true);
        return cardConfigRepository.save(card);
    }

    @Override
    @Transactional
    public CardConfig deactivateCard(Integer id) {
        CardConfig card = getById(id);
        card.setIsActive(false);
        return cardConfigRepository.save(card);
    }

    @Override
    @Transactional
    public CardConfig updateEffects(Integer id, String effectsJson, String modifiedBy, String reason) {
        CardConfig card = getById(id);

        // 验证JSON格式
        try {
            objectMapper.readTree(effectsJson);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("卡牌效果JSON格式无效: " + e.getMessage());
        }

        card.setEffects(effectsJson);
        card.setLastModifiedBy(modifiedBy);
        card.setLastModifiedReason(reason);
        return cardConfigRepository.save(card);
    }

    @Override
    @Transactional
    public CardConfig updateCardStats(Integer id, Integer manaCost, Integer power, Integer health) {
        CardConfig card = getById(id);

        if (manaCost != null) {
            card.setManaCost(manaCost);
        }
        if (power != null) {
            card.setPower(power);
        }
        if (health != null) {
            card.setHealth(health);
        }

        return cardConfigRepository.save(card);
    }

    @Override
    public List<CardConfig> getActiveCards() {
        return cardConfigRepository.findByIsActive(true);
    }

    @Override
    public List<CardConfig> getCardsByType(String type) {
        return cardConfigRepository.findByType(type);
    }

    @Override
    public List<CardConfig> getCardsByRarity(String rarity) {
        return cardConfigRepository.findByRarity(rarity);
    }

    @Override
    public List<CardConfig> getCardsByManaCostRange(Integer minMana, Integer maxMana) {
        return cardConfigRepository.findByManaCostBetween(minMana, maxMana);
    }

    @Override
    public List<CardConfig> getCardsByName(String name) {
        return cardConfigRepository.findByNameContaining(name);
    }

    @Override
    public CardConfig getCardByName(String name) {
        return cardConfigRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("卡牌配置不存在，名称: " + name));
    }

    @Override
    public boolean existsByName(String name) {
        return cardConfigRepository.existsByName(name);
    }

    @Override
    public boolean isActive(Integer id) {
        CardConfig card = getById(id);
        return Boolean.TRUE.equals(card.getIsActive());
    }

    @Override
    public boolean isCardTypeValid(String type) {
        return VALID_TYPES.contains(type.toUpperCase());
    }

    @Override
    public boolean isRarityValid(String rarity) {
        return VALID_RARITIES.contains(rarity.toUpperCase());
    }

    @Override
    public Integer countSkinsByCardId(Integer cardId) {
        CardConfig card = getById(cardId);
        return card.getSkins().size();
    }

    @Override
    public Integer countActiveSkinsByCardId(Integer cardId) {
        CardConfig card = getById(cardId);
        return (int) card.getSkins().stream()
                .filter(skin -> Boolean.TRUE.equals(skin.getIsActive()))
                .count();
    }

    @Override
    public Integer countActiveCards() {
        return cardConfigRepository.countByIsActive(true);
    }

    @Override
    public Integer countCardsByType(String type) {
        return cardConfigRepository.countByType(type);
    }

    @Override
    public Integer countCardsByRarity(String rarity) {
        return cardConfigRepository.countByRarity(rarity);
    }

    @Override
    public Integer countCardsByManaCost(Integer manaCost) {
        return cardConfigRepository.countByManaCost(manaCost);
    }

    @Override
    @Transactional
    public List<CardConfig> createBatch(List<CardConfig> cards) {
        // 验证所有卡牌
        for (CardConfig card : cards) {
            validateCardConfig(card);
            if (cardConfigRepository.existsByName(card.getName())) {
                throw new RuntimeException("卡牌名称已存在: " + card.getName());
            }
        }
        return cardConfigRepository.saveAll(cards);
    }

    @Override
    @Transactional
    public List<CardConfig> updateBatch(List<CardConfig> cards) {
        // 验证所有卡牌存在性
        for (CardConfig card : cards) {
            if (card.getId() == null) {
                throw new RuntimeException("批量更新时卡牌ID不能为空");
            }
            if (!cardConfigRepository.existsById(card.getId())) {
                throw new RuntimeException("卡牌配置不存在，ID: " + card.getId());
            }
            validateCardConfig(card);
        }
        return cardConfigRepository.saveAll(cards);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Integer> ids) {
        for (Integer id : ids) {
            if (!cardConfigRepository.existsById(id)) {
                throw new RuntimeException("卡牌配置不存在，ID: " + id);
            }
        }
        cardConfigRepository.deleteAllById(ids);
    }

    @Override
    public List<CardConfig> importFromJson(String jsonData) {
        try {
            CardConfig[] cards = objectMapper.readValue(jsonData, CardConfig[].class);
            return createBatch(List.of(cards));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("导入JSON格式无效: " + e.getMessage());
        }
    }

    @Override
    public String exportToJson(List<Integer> cardIds) {
        List<CardConfig> cards = cardConfigRepository.findAllById(cardIds);
        try {
            return objectMapper.writeValueAsString(cards);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("导出JSON失败: " + e.getMessage());
        }
    }

    @Override
    public boolean validateCardConfig(CardConfig cardConfig) {
        if (cardConfig.getName() == null || cardConfig.getName().trim().isEmpty()) {
            return false;
        }
        if (cardConfig.getType() == null || cardConfig.getType().trim().isEmpty()) {
            return false;
        }
        if (!isCardTypeValid(cardConfig.getType())) {
            return false;
        }
        if (cardConfig.getEffects() == null || cardConfig.getEffects().trim().isEmpty()) {
            return false;
        }
        try {
            objectMapper.readTree(cardConfig.getEffects());
        } catch (JsonProcessingException e) {
            return false;
        }
        return true;
    }

    @Override
    public List<String> validateCardConfigBatch(List<CardConfig> cards) {
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < cards.size(); i++) {
            CardConfig card = cards.get(i);
            try {
                if (!validateCardConfig(card)) {
                    errors.add("第" + (i + 1) + "个卡牌配置无效: " + card.getName());
                }
            } catch (Exception e) {
                errors.add("第" + (i + 1) + "个卡牌配置验证失败: " + e.getMessage());
            }
        }
        return errors;
    }
}