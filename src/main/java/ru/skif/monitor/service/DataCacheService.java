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
    private final SimulationService simulationService;
    private final EpicsCaService epicsCaService;
    private final AtomicReference<MonitorSnapshot> latestSnapshot = new AtomicReference<>();

    @Scheduled(fixedRate = 1000)
    public void updateData() {
        if (epicsConfig.isSimulationMode()) {
            MonitorSnapshot snapshot = simulationService.generateSnapshot();
            latestSnapshot.set(snapshot);
            log.trace("Simulation data updated");
            return;
        }

        Optional<BoosterData> boosterData = epicsCaService.readBoosterData();
        if (boosterData.isPresent()) {
            LinacData linacBase = simulationService.generateLinacSnapshot();
            LinacData linacData = epicsCaService.readLinacStatusData(linacBase).orElse(linacBase);
            MonitorSnapshot snapshot = MonitorSnapshot.of(
                    linacData,
                    boosterData.get()
            );
            latestSnapshot.set(snapshot);
            log.trace("EPICS data updated");
        } else {
            log.warn("EPICS read failed, keeping last-good snapshot");
        }
    }

    public MonitorSnapshot getLatest() {
        return latestSnapshot.get();
    }
}
