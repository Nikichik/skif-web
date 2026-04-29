package ru.skif.monitor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
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
}
