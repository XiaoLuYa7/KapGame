package com.beiguo.engine.effect.impl;

import com.beiguo.engine.GameContext;
import com.beiguo.engine.effect.Effect;
import com.beiguo.engine.effect.EffectHandler;
import org.springframework.stereotype.Component;

@Component
public class DefuseBombEffectHandler implements EffectHandler {
    @Override
    public void handle(GameContext context, Effect effect) {
        // 拆除炸弹效果
        context.setMessage("成功拆除炸弹");
        context.setSuccess(true);
    }
}