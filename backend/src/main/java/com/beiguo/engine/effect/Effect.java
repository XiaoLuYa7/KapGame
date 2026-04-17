package com.beiguo.engine.effect;

import lombok.Data;
import java.util.Map;

@Data
public class Effect {
    private EffectType type;
    private Map<String, Object> params;
}