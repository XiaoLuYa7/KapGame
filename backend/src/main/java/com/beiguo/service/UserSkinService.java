package com.beiguo.service;

import com.beiguo.entity.UserSkin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface UserSkinService {

    // CRUD方法
    UserSkin create(UserSkin userSkin);
    UserSkin update(Long id, UserSkin userSkin);
    void delete(Long id);
    UserSkin getById(Long id);
    List<UserSkin> getAll();
    Page<UserSkin> getPage(Pageable pageable);

    // 业务特定方法
    UserSkin acquireSkin(Long userId, Integer skinId, String purchaseType, Integer price);
    UserSkin equipSkin(Long userId, Integer skinId);
    UserSkin unequipSkin(Long userId, Integer skinId);
    UserSkin giftSkin(Long fromUserId, Long toUserId, Integer skinId);
    UserSkin increaseQuantity(Long userSkinId, Integer amount);
    UserSkin decreaseQuantity(Long userSkinId, Integer amount);

    // 查询方法
    List<UserSkin> getSkinsByUserId(Long userId);
    List<UserSkin> getEquippedSkinsByUserId(Long userId);
    UserSkin getUserSkinByUserAndSkin(Long userId, Integer skinId);
    List<UserSkin> getSkinsBySkinId(Integer skinId);
    List<UserSkin> getSkinsByPurchaseType(String purchaseType);

    // 检查方法
    boolean hasSkin(Long userId, Integer skinId);
    boolean isSkinEquipped(Long userId, Integer skinId);
    Integer getSkinQuantity(Long userId, Integer skinId);

    // 统计方法
    Integer countSkinsByUserId(Long userId);
    Integer countEquippedSkinsByUserId(Long userId);
    Integer countSkinsBySkinId(Integer skinId);
}