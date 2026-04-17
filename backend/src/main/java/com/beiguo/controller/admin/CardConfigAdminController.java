package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.CardConfig;
import com.beiguo.repository.CardConfigRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin/cards")
public class CardConfigAdminController {
    @Autowired
    private CardConfigRepository cardConfigRepository;

    @GetMapping
    public ApiResponse<Page<CardConfig>> getCards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String rarity,
            @RequestParam(required = false) Boolean isActive) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));

        // 这里应该使用Specification进行动态查询，简化：先获取全部再过滤
        // 实际项目应使用JPA Specification或QueryDSL
        Page<CardConfig> cards = cardConfigRepository.findAll(pageable);

        // 临时过滤逻辑（实际应使用数据库查询）
        if (type != null || rarity != null || isActive != null) {
            // 简化处理，实际应实现动态查询
            return ApiResponse.success(cards);
        }

        return ApiResponse.success(cards);
    }

    @GetMapping("/{id}")
    public ApiResponse<CardConfig> getCard(@PathVariable Integer id) {
        Optional<CardConfig> card = cardConfigRepository.findById(id);
        if (card.isEmpty()) {
            return ApiResponse.error("卡牌不存在");
        }
        return ApiResponse.success(card.get());
    }

    @PostMapping
    public ApiResponse<CardConfig> createCard(@Valid @RequestBody CardConfig cardConfig) {
        // 设置创建时间
        cardConfig.setCreateTime(LocalDateTime.now());
        cardConfig.setUpdateTime(LocalDateTime.now());
        if (cardConfig.getIsActive() == null) {
            cardConfig.setIsActive(true);
        }

        CardConfig saved = cardConfigRepository.save(cardConfig);
        return ApiResponse.success("创建成功", saved);
    }

    @PutMapping("/{id}")
    public ApiResponse<CardConfig> updateCard(@PathVariable Integer id, @Valid @RequestBody CardConfig cardConfig) {
        Optional<CardConfig> existingOpt = cardConfigRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("卡牌不存在");
        }

        CardConfig existing = existingOpt.get();
        // 更新字段
        if (cardConfig.getName() != null) existing.setName(cardConfig.getName());
        if (cardConfig.getDescription() != null) existing.setDescription(cardConfig.getDescription());
        if (cardConfig.getType() != null) existing.setType(cardConfig.getType());
        if (cardConfig.getRarity() != null) existing.setRarity(cardConfig.getRarity());
        if (cardConfig.getImageUrl() != null) existing.setImageUrl(cardConfig.getImageUrl());
        if (cardConfig.getManaCost() != null) existing.setManaCost(cardConfig.getManaCost());
        if (cardConfig.getPower() != null) existing.setPower(cardConfig.getPower());
        if (cardConfig.getHealth() != null) existing.setHealth(cardConfig.getHealth());
        if (cardConfig.getIsActive() != null) existing.setIsActive(cardConfig.getIsActive());
        if (cardConfig.getEffects() != null) existing.setEffects(cardConfig.getEffects());

        existing.setUpdateTime(LocalDateTime.now());

        CardConfig updated = cardConfigRepository.save(existing);
        return ApiResponse.success("更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteCard(@PathVariable Integer id) {
        Optional<CardConfig> existingOpt = cardConfigRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("卡牌不存在");
        }

        // 软删除：设置is_active = false
        CardConfig existing = existingOpt.get();
        existing.setIsActive(false);
        existing.setUpdateTime(LocalDateTime.now());
        cardConfigRepository.save(existing);

        return ApiResponse.success("删除成功");
    }

    @PutMapping("/{id}/publish")
    public ApiResponse<CardConfig> publishCard(@PathVariable Integer id) {
        Optional<CardConfig> existingOpt = cardConfigRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ApiResponse.error("卡牌不存在");
        }

        CardConfig existing = existingOpt.get();
        existing.setIsActive(true);
        existing.setUpdateTime(LocalDateTime.now());
        CardConfig published = cardConfigRepository.save(existing);

        return ApiResponse.success("发布成功", published);
    }
}