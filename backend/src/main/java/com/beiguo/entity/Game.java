package com.beiguo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "game")
@Data
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String status = "WAITING"; // WAITING, PLAYING, FINISHED, PAUSED, CANCELLED

    @Column(name = "game_mode", length = 20)
    private String gameMode = "STANDARD"; // STANDARD, RANKED, CASUAL

    @Column(name = "current_turn")
    private Integer currentTurn = 0;

    @Column(name = "current_player_index")
    private Integer currentPlayerIndex = 0;

    @Column(name = "round_count")
    private Integer roundCount = 0;

    @Column(name = "max_players")
    private Integer maxPlayers = 4;

    @Column(name = "winner", length = 100)
    private String winner;

    @Column(name = "deck_cards", columnDefinition = "json")
    private String deckCards; // JSON array of card IDs

    @Column(name = "discard_pile", columnDefinition = "json")
    private String discardPile; // JSON array of card IDs

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Player> players;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}