package com.beiguo.engine.effect;

import com.beiguo.engine.GameContext;

public interface EffectHandler {
    void handle(GameContext context, Effect effect);
}