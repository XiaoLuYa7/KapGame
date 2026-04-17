package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "player")
@Data
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_ai", nullable = false)
    private Boolean isAi = false;

    @Column(name = "player_index", nullable = false)
    private Integer playerIndex;

    @Column(nullable = false)
    private Integer hp = 3;

    @Column(name = "hand_cards", columnDefinition = "json")
    private String handCards; // JSON array of card IDs

    @Column(name = "is_alive", nullable = false)
    private Boolean isAlive = true;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}