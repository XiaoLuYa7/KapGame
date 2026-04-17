package com.beiguo.service.impl;

import com.beiguo.entity.CardConfig;
import com.beiguo.entity.CardSkin;
import com.beiguo.repository.CardConfigRepository;
import com.beiguo.repository.CardSkinRepository;
import com.beiguo.service.CardSkinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CardSkinServiceImpl implements CardSkinService {

    @Autowired
    private CardSkinRepository cardSkinRepository;

    @Autowired
    private CardConfigRepository cardConfigRepository;

    @Override
    @Transactional
    public CardSkin create(CardSkin cardSkin) {
        // 验证卡牌配置存在
        if (cardSkin.getCardConfig() == null || cardSkin.getCardConfig().getId() == null) {
            throw new RuntimeException("卡牌配置不能为空");
        }

        CardConfig cardConfig = cardConfigRepository.findById(cardSkin.getCardConfig().getId())
                .orElseThrow(() -> new RuntimeException("卡牌配置不存在"));

        // 检查皮肤名称是否唯一
        if (cardSkinRepository.findByCardConfig_IdAndSkinName(cardConfig.getId(), cardSkin.getSkinName()).isPresent()) {
            throw new RuntimeException("该卡牌已存在相同名称的皮肤");
        }

        // 如果是默认皮肤，确保该卡牌没有其他默认皮肤
        if (Boolean.TRUE.equals(cardSkin.getIsDefault())) {
            cardSkinRepository.findByCardConfig_IdAndIsDefault(cardConfig.getId(), true).ifPresent(existingDefault -> {
                existingDefault.setIsDefault(false);
                cardSkinRepository.save(existingDefault);
            });
        }

        cardSkin.setCardConfig(cardConfig);
        return cardSkinRepository.save(cardSkin);
    }

    @Override
    @Transactional
    public CardSkin update(Integer id, CardSkin cardSkin) {
        CardSkin existing = getById(id);

        // 更新允许的字段
        if (cardSkin.getSkinName() != null) {
            // 检查新名称是否唯一（如果不是当前皮肤）
            if (!existing.getSkinName().equals(cardSkin.getSkinName())) {
                if (cardSkinRepository.findByCardConfig_IdAndSkinName(existing.getCardConfig().getId(), cardSkin.getSkinName()).isPresent()) {
                    throw new RuntimeException("该卡牌已存在相同名称的皮肤");
                }
                existing.setSkinName(cardSkin.getSkinName());
            }
        }
        if (cardSkin.getDescription() != null) {
            existing.setDescription(cardSkin.getDescription());
        }
        if (cardSkin.getCoverUrl() != null) {
            existing.setCoverUrl(cardSkin.getCoverUrl());
        }
        if (cardSkin.getAnimationUrl() != null) {
            existing.setAnimationUrl(cardSkin.getAnimationUrl());
        }
        if (cardSkin.getPreviewUrl() != null) {
            existing.setPreviewUrl(cardSkin.getPreviewUrl());
        }
        if (cardSkin.getIsActive() != null) {
            existing.setIsActive(cardSkin.getIsActive());
        }
        if (cardSkin.getIsDefault() != null) {
            // 如果是默认皮肤，确保该卡牌没有其他默认皮肤
            if (Boolean.TRUE.equals(cardSkin.getIsDefault())) {
                cardSkinRepository.findByCardConfig_IdAndIsDefault(existing.getCardConfig().getId(), true)
                        .ifPresent(otherDefault -> {
                            if (!otherDefault.getId().equals(id)) {
                                otherDefault.setIsDefault(false);
                                cardSkinRepository.save(otherDefault);
                            }
                        });
            }
            existing.setIsDefault(cardSkin.getIsDefault());
        }
        if (cardSkin.getPriceDiamond() != null) {
            existing.setPriceDiamond(cardSkin.getPriceDiamond());
        }
        if (cardSkin.getPriceGold() != null) {
            existing.setPriceGold(cardSkin.getPriceGold());
        }
        if (cardSkin.getDisplayOrder() != null) {
            existing.setDisplayOrder(cardSkin.getDisplayOrder());
        }

        existing.setUpdateTime(LocalDateTime.now());
        return cardSkinRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!cardSkinRepository.existsById(id)) {
            throw new RuntimeException("卡牌皮肤不存在");
        }
        cardSkinRepository.deleteById(id);
    }

    @Override
    public CardSkin getById(Integer id) {
        return cardSkinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("卡牌皮肤不存在"));
    }

    @Override
    public List<CardSkin> getAll() {
        return cardSkinRepository.findAll();
    }

    @Override
    public Page<CardSkin> getPage(Pageable pageable) {
        return cardSkinRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public CardSkin activateSkin(Integer id) {
        CardSkin skin = getById(id);
        skin.setIsActive(true);
        skin.setUpdateTime(LocalDateTime.now());
        return cardSkinRepository.save(skin);
    }

    @Override
    @Transactional
    public CardSkin deactivateSkin(Integer id) {
        CardSkin skin = getById(id);
        skin.setIsActive(false);
        skin.setUpdateTime(LocalDateTime.now());
        return cardSkinRepository.save(skin);
    }

    @Override
    @Transactional
    public CardSkin setAsDefault(Integer id) {
        CardSkin skin = getById(id);

        // 确保该卡牌没有其他默认皮肤
        cardSkinRepository.findByCardConfig_IdAndIsDefault(skin.getCardConfig().getId(), true)
                .ifPresent(existingDefault -> {
                    if (!existingDefault.getId().equals(id)) {
                        existingDefault.setIsDefault(false);
                        cardSkinRepository.save(existingDefault);
                    }
                });

        skin.setIsDefault(true);
        skin.setUpdateTime(LocalDateTime.now());
        return cardSkinRepository.save(skin);
    }

    @Override
    @Transactional
    public CardSkin updatePrice(Integer id, Integer diamondPrice, Integer goldPrice) {
        CardSkin skin = getById(id);
        if (diamondPrice != null) {
            skin.setPriceDiamond(diamondPrice);
        }
        if (goldPrice != null) {
            skin.setPriceGold(goldPrice);
        }
        skin.setUpdateTime(LocalDateTime.now());
        return cardSkinRepository.save(skin);
    }

    @Override
    public List<CardSkin> getSkinsByCardId(Integer cardId) {
        return cardSkinRepository.findByCardConfig_Id(cardId);
    }

    @Override
    public List<CardSkin> getActiveSkinsByCardId(Integer cardId) {
        return cardSkinRepository.findByCardConfig_IdAndIsActive(cardId, true);
    }

    @Override
    public List<CardSkin> getDefaultSkins() {
        return cardSkinRepository.findByIsDefault(true);
    }

    @Override
    public List<CardSkin> getActiveSkins() {
        return cardSkinRepository.findByIsActiveTrue();
    }

    @Override
    public CardSkin getDefaultSkinByCardId(Integer cardId) {
        return cardSkinRepository.findByCardConfig_IdAndIsDefault(cardId, true)
                .orElseThrow(() -> new RuntimeException("该卡牌没有默认皮肤"));
    }

    @Override
    public boolean isSkinActive(Integer id) {
        CardSkin skin = getById(id);
        return Boolean.TRUE.equals(skin.getIsActive());
    }

    @Override
    public boolean isDefaultSkin(Integer id) {
        CardSkin skin = getById(id);
        return Boolean.TRUE.equals(skin.getIsDefault());
    }

    @Override
    public boolean existsByCardIdAndSkinName(Integer cardId, String skinName) {
        return cardSkinRepository.findByCardConfig_IdAndSkinName(cardId, skinName).isPresent();
    }

    @Override
    public Integer countSkinsByCardId(Integer cardId) {
        return cardSkinRepository.findByCardConfig_Id(cardId).size();
    }

    @Override
    public Integer countActiveSkinsByCardId(Integer cardId) {
        return cardSkinRepository.findByCardConfig_IdAndIsActive(cardId, true).size();
    }
}