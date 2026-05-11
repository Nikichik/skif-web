package ru.skif.monitor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class LinacData {
    private List<KlystronData> klystrons;
    private List<double[]> phase;
    private double gunCurrent;
    private double linacCurrent;
    private String systemsStatus;
    private String injectorStatus;
    private String rfStatus;
    private String kl1LlrfPowerStatus;
    private String kl2LlrfPowerStatus;
    private String kl3LlrfPowerStatus;
    private String kl1PwrIlkStatus;
    private String kl2PwrIlkStatus;
    private String kl3PwrIlkStatus;
}
