package com.beiguo.engine.effect;

import com.beiguo.engine.GameContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class EffectDispatcher {
    private final Map<EffectType, EffectHandler> handlers = new EnumMap<>(EffectType.class);

    public EffectDispatcher() {
        // 处理器通过registerHandler方法注册
    }

    public void registerHandler(EffectType type, EffectHandler handler) {
        handlers.put(type, handler);
    }

    public void dispatch(GameContext context, Effect effect) {
        EffectHandler handler = handlers.get(effect.getType());
        if (handler != null) {
            handler.handle(context, effect);
        } else {
            context.setMessage("未找到对应的效果处理器: " + effect.getType());
            context.setSuccess(false);
        }
    }

    public void dispatchAll(GameContext context, List<Effect> effects) {
        for (Effect effect : effects) {
            dispatch(context, effect);
            if (!context.isSuccess()) {
                break;
            }
        }
    }
}