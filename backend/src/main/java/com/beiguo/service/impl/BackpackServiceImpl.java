package com.beiguo.service.impl;

import com.beiguo.dto.BackpackItemDTO;
import com.beiguo.entity.CardSkin;
import com.beiguo.entity.User;
import com.beiguo.entity.UserSkin;
import com.beiguo.repository.UserSkinRepository;
import com.beiguo.service.BackpackService;
import com.beiguo.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
public class BackpackServiceImpl implements BackpackService {
    private static final String CATEGORY_DECORATE = "decorate";

    private final UserService userService;
    private final UserSkinRepository userSkinRepository;

    public BackpackServiceImpl(UserService userService, UserSkinRepository userSkinRepository) {
        this.userService = userService;
        this.userSkinRepository = userSkinRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BackpackItemDTO> getCurrentUserItems(String category) {
        String normalizedCategory = normalizeCategory(category);
        if (!CATEGORY_DECORATE.equals(normalizedCategory)) {
            return Collections.emptyList();
        }

        User user = userService.getCurrentUser();
        return userSkinRepository.findByUser_Id(user.getId())
                .stream()
                .map(userSkin -> toDecorateItem(userSkin, normalizedCategory))
                .toList();
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return CATEGORY_DECORATE;
        }

        return category.trim().toLowerCase(Locale.ROOT);
    }

    private BackpackItemDTO toDecorateItem(UserSkin userSkin, String category) {
        CardSkin skin = userSkin.getCardSkin();
        Integer quantity = userSkin.getQuantity() == null ? 1 : userSkin.getQuantity();

        BackpackItemDTO item = new BackpackItemDTO();
        item.setCategory(category);
        item.setItemName(skin == null ? "" : skin.getSkinName());
        item.setItemIcon(resolveSkinIcon(skin));
        item.setQuantity(quantity);
        item.setNumberOrDate("x" + quantity);
        return item;
    }

    private String resolveSkinIcon(CardSkin skin) {
        if (skin == null) {
            return "";
        }
        if (hasText(skin.getCoverUrl())) {
            return skin.getCoverUrl();
        }
        if (hasText(skin.getPreviewUrl())) {
            return skin.getPreviewUrl();
        }
        return hasText(skin.getAnimationUrl()) ? skin.getAnimationUrl() : "";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
