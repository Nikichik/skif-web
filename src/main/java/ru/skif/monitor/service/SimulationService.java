package ru.skif.monitor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.skif.monitor.model.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final CurrentCalculationService currentCalculationService;
    private final Random rng = new Random();

    public MonitorSnapshot generateSnapshot() {
        return MonitorSnapshot.of(generateLinac(), generateBooster());
    }

    public LinacData generateLinacSnapshot() {
        return generateLinac();
    }

    private LinacData generateLinac() {
        List<KlystronData> klystrons = new ArrayList<>();
        for (int k = 1; k <= 3; k++) {
            double basePower = 50.0;
            double power = basePower * (1.0 + (rng.nextGaussian() * 0.05));
            String status = randomStatus();
            List<double[]> pulse = generateKlystronPulse(power);
            klystrons.add(KlystronData.builder()
                    .id("KL" + k)
                    .power(round2(power))
                    .status(status)
                    .pulse(pulse)
                    .phase(List.of())
                    .build());
        }

        return LinacData.builder()
                .klystrons(klystrons)
                .phase(generatePhaseTrace())
                .gunCurrent(round2(300.0 * (1.0 + rng.nextGaussian() * 0.1)))
                .linacCurrent(round2(200.0 * (1.0 + rng.nextGaussian() * 0.15)))
                .systemsStatus(randomStatus())
                .injectorStatus(randomStatus())
                .rfStatus(randomStatus())
                .kl1LlrfPowerStatus(randomStatus())
                .kl2LlrfPowerStatus(randomStatus())
                .kl3LlrfPowerStatus(randomStatus())
                .kl1PwrIlkStatus(randomStatus())
                .kl2PwrIlkStatus(randomStatus())
                .kl3PwrIlkStatus(randomStatus())
                .build();
    }

    private List<double[]> generateKlystronPulse(double peakPower) {
        List<double[]> points = new ArrayList<>(100);
        double totalTime = 2.0; // мкс
        double dt = totalTime / 100.0;
        double riseStart = 0.2;
        double riseEnd = 0.4;
        double fallStart = 1.6;
        double fallEnd = 1.8;
        double rfFreq = 2856.0; // МГц — в масштабе мкс это даёт видимые осцилляции

        for (int i = 0; i < 100; i++) {
            double t = i * dt;
            double envelope;
            if (t < riseStart) {
                envelope = 0;
            } else if (t < riseEnd) {
                envelope = (t - riseStart) / (riseEnd - riseStart);
            } else if (t < fallStart) {
                envelope = 1.0;
            } else if (t < fallEnd) {
                envelope = 1.0 - (t - fallStart) / (fallEnd - fallStart);
            } else {
                envelope = 0;
            }
            double rfOscillation = 1.0 + 0.08 * Math.sin(2 * Math.PI * rfFreq * t * 0.001);
            double noise = 1.0 + rng.nextGaussian() * 0.02;
            double value = peakPower * envelope * rfOscillation * noise;
            points.add(new double[]{round3(t), round2(Math.max(0, value))});
        }
        return points;
    }

    private List<double[]> generatePhaseTrace() {
        List<double[]> points = new ArrayList<>(100);
        double dt = 2.0 / 100.0;
        double basePhase = rng.nextDouble() * 20 - 10;
        for (int i = 0; i < 100; i++) {
            double t = i * dt;
            double phase = basePhase + 15 * Math.sin(2 * Math.PI * 3.5 * t) + rng.nextGaussian() * 5;
            phase = Math.max(-180, Math.min(180, phase));
            points.add(new double[]{round3(t), round2(phase)});
        }
        return points;
    }

    private BoosterData generateBooster() {
        int rawMagnetPoints = 9838;
        int rawBeamCurrentPoints = 10_000;
        int targetPoints = 1000;
        double dtRaw = 1.0 / rawMagnetPoints;
        double dtTarget = 1.0 / targetPoints;
        double injTime = 0.05;
        double extTime = 0.9;
        double[] bd1Raw = new double[rawMagnetPoints];
        double[] bd2Raw = new double[rawMagnetPoints];
        double[] bfRaw = new double[rawMagnetPoints];
        double[] beamCurrentRaw = new double[rawBeamCurrentPoints];

        for (int i = 0; i < rawMagnetPoints; i++) {
            double t = i * dtRaw;
            double accel = smoothRamp(t, injTime, extTime);
            double bdBase = 210.0 * accel;
            bd1Raw[i] = Math.max(0.0, bdBase * (0.98 + rng.nextGaussian() * 0.02));
            bd2Raw[i] = Math.max(0.0, bdBase * (1.02 + rng.nextGaussian() * 0.02));
            bfRaw[i] = Math.max(0.05, 1.2 * accel + 0.08 + rng.nextGaussian() * 0.02);
        }

        for (int i = 0; i < rawBeamCurrentPoints; i++) {
            double t = i / (double) rawBeamCurrentPoints;
            double current;
            if (t < injTime) {
                current = 0.0;
            } else if (t < extTime) {
                current = 2.95 + rng.nextGaussian() * 0.01;
            } else {
                current = Math.max(0.0, 0.12 * Math.exp(-40.0 * (t - extTime)) + rng.nextGaussian() * 0.003);
            }
            beamCurrentRaw[i] = current;
        }

        double[] energy = currentCalculationService.calculateEnergyWaveform(bd1Raw, bd2Raw, bfRaw, targetPoints);
        double[] beamCurrent = currentCalculationService.calculateBeamCurrent(beamCurrentRaw, targetPoints);
        double[] bd1 = currentCalculationService.downsample(bd1Raw, targetPoints);
        double[] bd2 = currentCalculationService.downsample(bd2Raw, targetPoints);
        double[] bf = currentCalculationService.downsample(bfRaw, targetPoints);

        List<double[]> energyPoints = new ArrayList<>(targetPoints);
        List<double[]> currentPoints = new ArrayList<>(targetPoints);
        List<double[]> bd1Points = new ArrayList<>(targetPoints);
        List<double[]> bd2Points = new ArrayList<>(targetPoints);
        List<double[]> bfPoints = new ArrayList<>(targetPoints);

        for (int i = 0; i < targetPoints; i++) {
            double t = i * dtTarget;
            energyPoints.add(new double[]{round4(t), round2(energy[i])});
            currentPoints.add(new double[]{round4(t), round3(beamCurrent[i])});
            bd1Points.add(new double[]{round4(t), round2(bd1[i])});
            bd2Points.add(new double[]{round4(t), round2(bd2[i])});
            bfPoints.add(new double[]{round4(t), round3(bf[i])});
        }

        int injIndex = Math.min(targetPoints - 1, Math.max(0, (int) Math.round(injTime * targetPoints)));
        int extIndex = Math.min(targetPoints - 1, Math.max(0, (int) Math.round(extTime * targetPoints)));
        double injCurrent = beamCurrent[injIndex];
        double extCurrent = beamCurrent[extIndex];
        double injEnergy = energy[injIndex];
        double extEnergy = energy[extIndex];

        return BoosterData.builder()
                .energy(energyPoints)
                .current(currentPoints)
                .bd1(bd1Points)
                .bd2(bd2Points)
                .bf(bfPoints)
                .injection(InjectionExtractionData.builder()
                        .time(injTime).energy(round2(injEnergy)).current(round3(injCurrent)).build())
                .extraction(InjectionExtractionData.builder()
                        .time(extTime).energy(round2(extEnergy)).current(round3(Math.max(0, extCurrent))).build())
                .rfStatus(randomStatus())
                .magnetStatus(randomStatus())
                .cav1LlrfModulatorStatus(randomStatus())
                .cav2LlrfModulatorStatus(randomStatus())
                .cav3LlrfModulatorStatus(randomStatus())
                .powerSupplyStatus(randomStatus())
                .build();
    }

    private double smoothRamp(double t, double injTime, double extTime) {
        if (t < injTime) {
            return 0.0;
        }
        if (t > extTime) {
            return 0.0;
        }
        double normalized = (t - injTime) / (extTime - injTime);
        return Math.sin(Math.PI * normalized);
    }

    private String randomStatus() {
        double r = rng.nextDouble();
        if (r < 0.85) return "OK";
        if (r < 0.97) return "WARN";
        return "FAULT";
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
}
