package com.beiguo.repository;

import com.beiguo.entity.UserSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkinRepository extends JpaRepository<UserSkin, Long> {

    // 根据用户ID查找所有皮肤
    List<UserSkin> findByUser_Id(Long userId);

    // 根据用户ID和皮肤ID查找
    Optional<UserSkin> findByUser_IdAndCardSkin_Id(Long userId, Integer skinId);

    // 根据用户ID和是否装备查找
    List<UserSkin> findByUser_IdAndIsEquipped(Long userId, Boolean isEquipped);

    // 根据用户ID和卡牌ID查找（通过皮肤关联卡牌）
    @Query("SELECT us FROM UserSkin us JOIN us.cardSkin cs WHERE us.user.id = :userId AND cs.cardConfig.id = :cardId")
    List<UserSkin> findByUserIdAndCardId(@Param("userId") Long userId, @Param("cardId") Integer cardId);

    // 根据用户ID、卡牌ID和是否装备查找
    @Query("SELECT us FROM UserSkin us JOIN us.cardSkin cs WHERE us.user.id = :userId AND cs.cardConfig.id = :cardId AND us.isEquipped = :isEquipped")
    List<UserSkin> findByUserIdAndCardIdAndIsEquipped(@Param("userId") Long userId, @Param("cardId") Integer cardId, @Param("isEquipped") Boolean isEquipped);

    // 根据皮肤ID查找所有拥有该皮肤的用户
    List<UserSkin> findByCardSkin_Id(Integer skinId);

    // 根据用户ID统计皮肤数量
    Long countByUser_Id(Long userId);

    // 根据用户ID和皮肤ID判断是否存在
    boolean existsByUser_IdAndCardSkin_Id(Long userId, Integer skinId);

    // 根据用户ID查找装备的皮肤
    @Query("SELECT us FROM UserSkin us WHERE us.user.id = :userId AND us.isEquipped = true")
    List<UserSkin> findEquippedSkinsByUserId(@Param("userId") Long userId);

    // 根据用户ID和购买类型查找
    List<UserSkin> findByUser_IdAndPurchaseType(Long userId, String purchaseType);
}