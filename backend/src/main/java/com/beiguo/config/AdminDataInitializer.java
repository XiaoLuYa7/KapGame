package com.beiguo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class AdminDataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // 不再自动创建管理员账户
    }
}
