package com.beiguo.repository;

import com.beiguo.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findAllByOrderByCreateTimeDesc();
    List<Game> findByStatus(String status);
    List<Game> findByGameMode(String gameMode);
    @Query("SELECT DISTINCT g FROM Game g JOIN g.players p WHERE p.user.id = :userId")
    List<Game> findGamesByUserId(@Param("userId") Long userId);
    Integer countByStatus(String status);
    Integer countByGameMode(String gameMode);
    @Query("SELECT COUNT(DISTINCT g) FROM Game g JOIN g.players p WHERE p.user.id = :userId")
    Integer countGamesByUserId(@Param("userId") Long userId);
}
