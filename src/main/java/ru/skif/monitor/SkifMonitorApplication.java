package ru.skif.monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkifMonitorApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkifMonitorApplication.class, args);
    }
}
