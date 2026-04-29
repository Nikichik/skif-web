package ru.skif.monitor.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.skif.monitor.config.EpicsConfig;
import ru.skif.monitor.model.MonitorSnapshot;
import ru.skif.monitor.service.DataCacheService;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final DataCacheService dataCacheService;
    private final EpicsConfig epicsConfig;

    @GetMapping("/current")
    public ResponseEntity<MonitorSnapshot> current() {
        MonitorSnapshot snapshot = dataCacheService.getLatest();
        if (snapshot == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "simulationMode", epicsConfig.isSimulationMode(),
                "hasData", dataCacheService.getLatest() != null
        );
    }
}
