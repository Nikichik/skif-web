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
public class KlystronData {
    private String id;
    private Double power;
    private String status;
    private List<double[]> pulse;
    private List<double[]> phase;
}
