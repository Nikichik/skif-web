package ru.skif.monitor.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CurrentCalculationServiceTest {

    private final CurrentCalculationService service = new CurrentCalculationService();

    @Test
    void calculateBoosterCurrent() {
        double[] bd1 = {100, 200, 300};
        double[] bd2 = {100, 200, 300};
        double[] bf = {1.0, 1.0, 1.0};

        double[] result = service.calculateBoosterCurrent(bd1, bd2, bf);

        assertEquals(3, result.length);
        assertEquals(130.0, result[0], 0.001);
        assertEquals(260.0, result[1], 0.001);
        assertEquals(390.0, result[2], 0.001);
    }

    @Test
    void calculateEnergyWaveformAndDownsample() {
        double[] bd1 = {0, 100, 200, 300};
        double[] bd2 = {0, 100, 200, 300};
        double[] bf = {0, 1, 2, 3};

        double[] energy = service.calculateEnergyWaveform(bd1, bd2, bf, 2);

        assertEquals(2, energy.length);
        assertTrue(energy[0] < energy[1]);
        assertTrue(energy[1] >= 2400 && energy[1] <= 3000);
    }

    @Test
    void downsampleUsesAllInputPoints() {
        double[] source = {1, 2, 3, 4, 5, 6};

        double[] result = service.downsample(source, 3);

        assertArrayEquals(new double[]{1.5, 3.5, 5.5}, result, 0.0001);
    }
}
