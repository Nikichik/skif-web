package ru.skif.monitor.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import ru.skif.monitor.model.MonitorSnapshot;
import ru.skif.monitor.service.DataCacheService;

import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SseController {

    private final DataCacheService dataCacheService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<MonitorSnapshot> stream() {
        return Flux.interval(Duration.ofSeconds(1))
                .map(tick -> dataCacheService.getLatest())
                .filter(snapshot -> snapshot != null);
    }
}
