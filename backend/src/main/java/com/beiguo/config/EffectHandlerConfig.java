package com.beiguo.config;

import com.beiguo.engine.effect.EffectDispatcher;
import com.beiguo.engine.effect.EffectType;
import com.beiguo.engine.effect.impl.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EffectHandlerConfig {
    @Autowired
    private EffectDispatcher effectDispatcher;

    @Autowired
    private ExplodeEffectHandler explodeEffectHandler;

    @Autowired
    private DefuseBombEffectHandler defuseBombEffectHandler;

    @Autowired
    private DrawCardEffectHandler drawCardEffectHandler;

    @PostConstruct
    public void registerHandlers() {
        effectDispatcher.registerHandler(EffectType.EXPLODE, explodeEffectHandler);
        effectDispatcher.registerHandler(EffectType.DEFUSE_BOMB, defuseBombEffectHandler);
        effectDispatcher.registerHandler(EffectType.DRAW_CARD, drawCardEffectHandler);
        // 注册其他处理器
        // effectDispatcher.registerHandler(EffectType.TRANSFER_CARD, transferCardEffectHandler);
        // effectDispatcher.registerHandler(EffectType.SKIP_TURN, skipTurnEffectHandler);
        // ...
    }
}