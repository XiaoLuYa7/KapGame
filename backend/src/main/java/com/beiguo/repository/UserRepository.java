package com.beiguo.repository;

import com.beiguo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.domain.Pageable;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    long countByLastLoginTimeAfter(LocalDateTime time);

    List<User> findAllByOrderByCreateTimeDesc();
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    List<User> findByStatus(String status);
    List<User> findByRole(String role);
    List<User> findByUsernameContainingOrNickNameContainingOrEmailContainingOrPhoneContaining(
            String username, String nickName, String email, String phone);
    List<User> findTop10ByOrderByDiamondDesc(Pageable pageable);
    List<User> findTop10ByOrderByGoldDesc(Pageable pageable);
    Integer countByStatus(String status);
    Integer countByRole(String role);

    @Query("SELECT COALESCE(SUM(u.diamond), 0) FROM User u")
    Integer sumDiamonds();

    @Query("SELECT COALESCE(SUM(u.gold), 0) FROM User u")
    Integer sumGold();
}
