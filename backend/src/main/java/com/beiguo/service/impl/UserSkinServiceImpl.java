package com.beiguo.service.impl;

import com.beiguo.entity.CardSkin;
import com.beiguo.entity.User;
import com.beiguo.entity.UserSkin;
import com.beiguo.repository.UserSkinRepository;
import com.beiguo.service.CardSkinService;
import com.beiguo.service.UserService;
import com.beiguo.service.UserSkinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserSkinServiceImpl implements UserSkinService {

    @Autowired
    private UserSkinRepository userSkinRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private CardSkinService cardSkinService;

    @Override
    @Transactional
    public UserSkin create(UserSkin userSkin) {
        // 验证用户存在
        if (userSkin.getUser() == null || userSkin.getUser().getId() == null) {
            throw new RuntimeException("用户不能为空");
        }

        User user = userService.getUserById(userSkin.getUser().getId());

        // 验证皮肤存在
        if (userSkin.getCardSkin() == null || userSkin.getCardSkin().getId() == null) {
            throw new RuntimeException("卡牌皮肤不能为空");
        }

        CardSkin cardSkin = cardSkinService.getById(userSkin.getCardSkin().getId());

        // 检查用户是否已拥有该皮肤
        if (userSkinRepository.existsByUser_IdAndCardSkin_Id(user.getId(), cardSkin.getId())) {
            throw new RuntimeException("用户已拥有该皮肤");
        }

        // 设置默认值
        if (userSkin.getQuantity() == null) {
            userSkin.setQuantity(1);
        }
        if (userSkin.getIsEquipped() == null) {
            userSkin.setIsEquipped(false);
        }
        if (userSkin.getPurchaseTime() == null) {
            userSkin.setPurchaseTime(LocalDateTime.now());
        }
        if (userSkin.getPurchasePrice() == null) {
            userSkin.setPurchasePrice(0);
        }

        userSkin.setUser(user);
        userSkin.setCardSkin(cardSkin);

        return userSkinRepository.save(userSkin);
    }

    @Override
    @Transactional
    public UserSkin update(Long id, UserSkin userSkin) {
        UserSkin existing = getById(id);

        // 只能更新部分字段
        if (userSkin.getQuantity() != null) {
            existing.setQuantity(userSkin.getQuantity());
        }
        if (userSkin.getIsEquipped() != null) {
            existing.setIsEquipped(userSkin.getIsEquipped());
        }
        if (userSkin.getPurchaseType() != null) {
            existing.setPurchaseType(userSkin.getPurchaseType());
        }

        existing.setUpdateTime(LocalDateTime.now());
        return userSkinRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userSkinRepository.existsById(id)) {
            throw new RuntimeException("用户皮肤不存在");
        }
        userSkinRepository.deleteById(id);
    }

    @Override
    public UserSkin getById(Long id) {
        return userSkinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户皮肤不存在"));
    }

    @Override
    public List<UserSkin> getAll() {
        return userSkinRepository.findAll();
    }

    @Override
    public Page<UserSkin> getPage(Pageable pageable) {
        return userSkinRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public UserSkin acquireSkin(Long userId, Integer skinId, String purchaseType, Integer price) {
        User user = userService.getUserById(userId);
        CardSkin cardSkin = cardSkinService.getById(skinId);

        // 检查用户是否已拥有该皮肤
        UserSkin existingSkin = userSkinRepository.findByUser_IdAndCardSkin_Id(userId, skinId).orElse(null);

        if (existingSkin != null) {
            // 如果已拥有，增加数量
            existingSkin.setQuantity(existingSkin.getQuantity() + 1);
            existingSkin.setUpdateTime(LocalDateTime.now());
            return userSkinRepository.save(existingSkin);
        } else {
            // 新获得皮肤
            UserSkin userSkin = new UserSkin();
            userSkin.setUser(user);
            userSkin.setCardSkin(cardSkin);
            userSkin.setQuantity(1);
            userSkin.setIsEquipped(false);
            userSkin.setPurchaseTime(LocalDateTime.now());
            userSkin.setPurchaseType(purchaseType);
            userSkin.setPurchasePrice(price != null ? price : 0);

            return userSkinRepository.save(userSkin);
        }
    }

    @Override
    @Transactional
    public UserSkin equipSkin(Long userId, Integer skinId) {
        UserSkin userSkin = getUserSkinByUserAndSkin(userId, skinId);

        // 检查皮肤是否已装备
        if (Boolean.TRUE.equals(userSkin.getIsEquipped())) {
            throw new RuntimeException("皮肤已装备");
        }

        // 对于同一卡牌的其他皮肤，需要先卸下
        Integer cardId = userSkin.getCardSkin().getCardConfig().getId();
        List<UserSkin> equippedSkinsForSameCard = userSkinRepository
                .findByUserIdAndCardIdAndIsEquipped(userId, cardId, true);

        for (UserSkin equippedSkin : equippedSkinsForSameCard) {
            equippedSkin.setIsEquipped(false);
            equippedSkin.setUpdateTime(LocalDateTime.now());
            userSkinRepository.save(equippedSkin);
        }

        userSkin.setIsEquipped(true);
        userSkin.setUpdateTime(LocalDateTime.now());

        return userSkinRepository.save(userSkin);
    }

    @Override
    @Transactional
    public UserSkin unequipSkin(Long userId, Integer skinId) {
        UserSkin userSkin = getUserSkinByUserAndSkin(userId, skinId);

        if (!Boolean.TRUE.equals(userSkin.getIsEquipped())) {
            throw new RuntimeException("皮肤未装备");
        }

        userSkin.setIsEquipped(false);
        userSkin.setUpdateTime(LocalDateTime.now());

        return userSkinRepository.save(userSkin);
    }

    @Override
    @Transactional
    public UserSkin giftSkin(Long fromUserId, Long toUserId, Integer skinId) {
        // 检查发送者是否拥有该皮肤
        UserSkin senderSkin = getUserSkinByUserAndSkin(fromUserId, skinId);

        if (senderSkin.getQuantity() <= 0) {
            throw new RuntimeException("皮肤数量不足");
        }

        // 减少发送者数量
        senderSkin.setQuantity(senderSkin.getQuantity() - 1);
        senderSkin.setUpdateTime(LocalDateTime.now());
        userSkinRepository.save(senderSkin);

        // 赠送给接收者
        return acquireSkin(toUserId, skinId, "GIFT", 0);
    }

    @Override
    @Transactional
    public UserSkin increaseQuantity(Long userSkinId, Integer amount) {
        if (amount <= 0) {
            throw new RuntimeException("增加数量必须大于0");
        }

        UserSkin userSkin = getById(userSkinId);
        userSkin.setQuantity(userSkin.getQuantity() + amount);
        userSkin.setUpdateTime(LocalDateTime.now());

        return userSkinRepository.save(userSkin);
    }

    @Override
    @Transactional
    public UserSkin decreaseQuantity(Long userSkinId, Integer amount) {
        if (amount <= 0) {
            throw new RuntimeException("减少数量必须大于0");
        }

        UserSkin userSkin = getById(userSkinId);
        if (userSkin.getQuantity() < amount) {
            throw new RuntimeException("皮肤数量不足");
        }

        userSkin.setQuantity(userSkin.getQuantity() - amount);
        userSkin.setUpdateTime(LocalDateTime.now());

        // 如果数量为0，删除记录
        if (userSkin.getQuantity() <= 0) {
            userSkinRepository.delete(userSkin);
            return userSkin;
        }

        return userSkinRepository.save(userSkin);
    }

    @Override
    public List<UserSkin> getSkinsByUserId(Long userId) {
        return userSkinRepository.findByUser_Id(userId);
    }

    @Override
    public List<UserSkin> getEquippedSkinsByUserId(Long userId) {
        return userSkinRepository.findEquippedSkinsByUserId(userId);
    }

    @Override
    public UserSkin getUserSkinByUserAndSkin(Long userId, Integer skinId) {
        return userSkinRepository.findByUser_IdAndCardSkin_Id(userId, skinId)
                .orElseThrow(() -> new RuntimeException("用户未拥有该皮肤"));
    }

    @Override
    public List<UserSkin> getSkinsBySkinId(Integer skinId) {
        return userSkinRepository.findByCardSkin_Id(skinId);
    }

    @Override
    public List<UserSkin> getSkinsByPurchaseType(String purchaseType) {
        // 这个方法需要扩展Repository支持，暂时返回空列表
        // 在实际应用中需要添加相应查询方法
        return List.of();
    }

    @Override
    public boolean hasSkin(Long userId, Integer skinId) {
        return userSkinRepository.existsByUser_IdAndCardSkin_Id(userId, skinId);
    }

    @Override
    public boolean isSkinEquipped(Long userId, Integer skinId) {
        return userSkinRepository.findByUser_IdAndCardSkin_Id(userId, skinId)
                .map(UserSkin::getIsEquipped)
                .orElse(false);
    }

    @Override
    public Integer getSkinQuantity(Long userId, Integer skinId) {
        return userSkinRepository.findByUser_IdAndCardSkin_Id(userId, skinId)
                .map(UserSkin::getQuantity)
                .orElse(0);
    }

    @Override
    public Integer countSkinsByUserId(Long userId) {
        return userSkinRepository.countByUser_Id(userId).intValue();
    }

    @Override
    public Integer countEquippedSkinsByUserId(Long userId) {
        return userSkinRepository.findEquippedSkinsByUserId(userId).size();
    }

    @Override
    public Integer countSkinsBySkinId(Integer skinId) {
        return userSkinRepository.findByCardSkin_Id(skinId).size();
    }
}