package com.beiguo.repository;

import com.beiguo.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByGame_Id(Long gameId);
    Optional<Player> findByGame_IdAndUser_Id(Long gameId, Long userId);
    List<Player> findByGame_IdAndIsAliveTrue(Long gameId);
    Optional<Player> findByGame_IdAndPlayerIndex(Long gameId, Integer playerIndex);
}