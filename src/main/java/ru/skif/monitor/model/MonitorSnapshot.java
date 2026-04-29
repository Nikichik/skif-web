package ru.skif.monitor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitorSnapshot {
    private String timestamp;
    private LinacData linac;
    private BoosterData booster;

    public static MonitorSnapshot of(LinacData linac, BoosterData booster) {
        return MonitorSnapshot.builder()
                .timestamp(Instant.now().toString())
                .linac(linac)
                .booster(booster)
                .build();
    }
}
