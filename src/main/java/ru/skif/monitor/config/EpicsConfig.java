package ru.skif.monitor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "epics")
public class EpicsConfig {
    private boolean simulationMode = true;
    private String caAddrList = "";
    private Map<String, Map<String, String>> pv;
}
