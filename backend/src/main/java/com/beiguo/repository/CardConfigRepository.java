package com.beiguo.repository;

import com.beiguo.entity.CardConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardConfigRepository extends JpaRepository<CardConfig, Integer> {
    List<CardConfig> findAll();
    Integer countByIsActive(Boolean isActive);
    boolean existsByName(String name);

    List<CardConfig> findAllByOrderByNameAsc();
    List<CardConfig> findByIsActive(Boolean isActive);
    List<CardConfig> findByType(String type);
    List<CardConfig> findByRarity(String rarity);
    List<CardConfig> findByManaCostBetween(Integer minMana, Integer maxMana);
    List<CardConfig> findByNameContaining(String name);
    Optional<CardConfig> findByName(String name);
    Integer countByType(String type);
    Integer countByRarity(String rarity);
    Integer countByManaCost(Integer manaCost);
}