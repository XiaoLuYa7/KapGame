package com.beiguo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BeiguoApplication {
    public static void main(String[] args) {
        SpringApplication.run(BeiguoApplication.class, args);
    }
}