package ru.skif.monitor.service;

import org.springframework.stereotype.Service;

@Service
public class CurrentCalculationService {

    private static final double TOTAL_ENERGY_MEV = 3000.0;
    private static final double BD_SHARE = 0.6;
    private static final double BF_SHARE = 0.4;

    public double[] calculateBeamCurrent(double[] currentWaveform, int targetLength) {
        return downsample(currentWaveform, targetLength);
    }

    public double[] calculateEnergyWaveform(double[] bd1, double[] bd2, double[] bf, int targetLength) {
        int len = Math.min(bd1.length, Math.min(bd2.length, bf.length));
        if (len == 0) {
            return new double[0];
        }

        double[] truncatedBd1 = new double[len];
        double[] truncatedBd2 = new double[len];
        double[] truncatedBf = new double[len];
        System.arraycopy(bd1, 0, truncatedBd1, 0, len);
        System.arraycopy(bd2, 0, truncatedBd2, 0, len);
        System.arraycopy(bf, 0, truncatedBf, 0, len);

        double bd1Max = max(truncatedBd1);
        double bd2Max = max(truncatedBd2);
        double bfMax = max(truncatedBf);

        double aDenominator = bd1Max + bd2Max;
        double a = aDenominator > 0.0 ? (BD_SHARE * TOTAL_ENERGY_MEV * 2.0) / aDenominator : 0.0;
        double b = bfMax > 0.0 ? (BF_SHARE * TOTAL_ENERGY_MEV) / bfMax : 0.0;

        double[] energy = new double[len];
        for (int i = 0; i < len; i++) {
            energy[i] = a * ((truncatedBd1[i] + truncatedBd2[i]) / 2.0) + b * truncatedBf[i];
        }

        return downsample(energy, targetLength);
    }

    public double[] calculateBoosterCurrent(double[] bd1, double[] bd2, double[] bf) {
        int len = Math.min(bd1.length, Math.min(bd2.length, bf.length));
        double[] current = new double[len];
        for (int i = 0; i < len; i++) {
            current[i] = ((bd1[i] + bd2[i]) / 2.0) * 1.3 * bf[i];
        }
        return current;
    }

    public double[] downsample(double[] source, int targetLength) {
        if (source.length == 0 || targetLength <= 0) {
            return new double[0];
        }
        if (source.length == targetLength) {
            return source.clone();
        }

        double[] result = new double[targetLength];
        for (int i = 0; i < targetLength; i++) {
            int start = (int) Math.floor(i * (double) source.length / targetLength);
            int end = (int) Math.floor((i + 1) * (double) source.length / targetLength);
            if (end <= start) {
                end = Math.min(start + 1, source.length);
            }

            double sum = 0.0;
            for (int j = start; j < end; j++) {
                sum += source[j];
            }
            result[i] = sum / (end - start);
        }

        return result;
    }

    private double max(double[] values) {
        double max = Double.NEGATIVE_INFINITY;
        for (double value : values) {
            if (value > max) {
                max = value;
            }
        }
        return max;
    }
}
