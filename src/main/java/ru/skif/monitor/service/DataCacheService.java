package ru.skif.monitor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ru.skif.monitor.config.EpicsConfig;
import ru.skif.monitor.model.BoosterData;
import ru.skif.monitor.model.LinacData;
import ru.skif.monitor.model.MonitorSnapshot;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataCacheService {

    private final EpicsConfig epicsConfig;
    private final EpicsCaService epicsCaService;
    private final AtomicReference<MonitorSnapshot> latestSnapshot = new AtomicReference<>();

    @Scheduled(fixedRate = 1000)
    public void updateData() {
        if (epicsConfig.isSimulationMode()) {
            // Hard-stop simulation path: this service is EPICS-only.
            latestSnapshot.set(null);
            log.warn("simulation-mode=true but simulation is disabled in EPICS-only mode");
            return;
        }

        Optional<LinacData> linacData = epicsCaService.readLinacData();
        Optional<BoosterData> boosterData = epicsCaService.readBoosterData();

        if (linacData.isPresent() || boosterData.isPresent()) {
            MonitorSnapshot snapshot = MonitorSnapshot.builder()
                    .timestamp(java.time.Instant.now().toString())
                    .linac(linacData.orElse(null))
                    .booster(boosterData.orElse(null))
                    .build();
            latestSnapshot.set(snapshot);
            log.trace("EPICS data updated");
        } else {
            latestSnapshot.set(null);
            log.warn("EPICS read failed, no real data available");
        }
    }

    public MonitorSnapshot getLatest() {
        return latestSnapshot.get();
    }
}
