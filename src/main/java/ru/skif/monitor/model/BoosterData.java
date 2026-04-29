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
public class BoosterData {
    private List<double[]> energy;
    private List<double[]> current;
    private List<double[]> bd1;
    private List<double[]> bd2;
    private List<double[]> bf;
    private InjectionExtractionData injection;
    private InjectionExtractionData extraction;
    private String rfStatus;
    private String magnetStatus;
}
