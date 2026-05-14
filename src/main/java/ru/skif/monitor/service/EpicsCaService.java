package ru.skif.monitor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.skif.monitor.config.EpicsConfig;
import ru.skif.monitor.model.BoosterData;
import ru.skif.monitor.model.InjectionExtractionData;
import ru.skif.monitor.model.KlystronData;
import ru.skif.monitor.model.LinacData;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EpicsCaService {

    private static final int TARGET_POINTS = 1000;
    private static final int CAVITY_VOLTAGE_MAX_READ = 20000;
    private static final double INJECTION_TIME = 0.05;
    private static final double EXTRACTION_TIME = 0.9;

    private final EpicsConfig epicsConfig;
    private final CurrentCalculationService currentCalculationService;

    public Optional<BoosterData> readBoosterData() {
        try {
            Map<String, String> boosterPv = epicsConfig.getPv().get("booster");
            double[] bd1Raw = readWaveform(resolvePv(boosterPv, "bd1", "MG-BR:BD1-I:Wf"));
            double[] bd2Raw = readWaveform(resolvePv(boosterPv, "bd2", "MG-BR:BD2-I:Wf"));
            double[] bfRaw = readWaveform(resolvePv(boosterPv, "bf", "MG-BR:BF-I:Wf"));
            String beamPv = resolvePv(boosterPv, "beam-current", "BI-BDS:DCCT-Ch1Wf10Data:Mes");
            double[] beamRaw = readWaveform(beamPv);
            String cav1 = toUiStatus(readScalar(resolvePv(boosterPv, "cav1-llrf-modulator-status", "RF-BR:CAV1:LLRF-ModulatorOn:Sts")));
            String cav2 = toUiStatus(readScalar(resolvePv(boosterPv, "cav2-llrf-modulator-status", "RF-BR:CAV2:LLRF-ModulatorOn:Sts")));
            String cav3 = toUiStatus(readScalar(resolvePv(boosterPv, "cav3-llrf-modulator-status", "RF-BR:CAV3:LLRF-ModulatorOn:Sts")));
            String bd1Pson = readScalar(resolvePv(boosterPv, "bd1-pson-status", "MG-BR:BD1-PSON:Cmd"));
            String bd2Pson = readScalar(resolvePv(boosterPv, "bd2-pson-status", "MG-BR:BD2-PSON:Cmd"));
            String bfPson = readScalar(resolvePv(boosterPv, "bf-pson-status", "MG-BR:BF-PSON:Cmd"));
            String powerSupplyStatus = (isYes(bd1Pson) && isYes(bd2Pson) && isYes(bfPson)) ? "OK" : "FAULT";

            if (bd1Raw.length == 0 || bd2Raw.length == 0 || bfRaw.length == 0) {
                return Optional.empty();
            }

            double[] energy = currentCalculationService.calculateEnergyWaveform(bd1Raw, bd2Raw, bfRaw, TARGET_POINTS);
            double[] beam = currentCalculationService.calculateBeamCurrent(beamRaw, TARGET_POINTS);
            double[] bd1 = currentCalculationService.downsample(bd1Raw, TARGET_POINTS);
            double[] bd2 = currentCalculationService.downsample(bd2Raw, TARGET_POINTS);
            double[] bf = currentCalculationService.downsample(bfRaw, TARGET_POINTS);
            List<double[]> cav1Voltage = tryReadWaveformPoints(resolvePv(boosterPv, "cav1-voltage", ""), TARGET_POINTS, CAVITY_VOLTAGE_MAX_READ);
            List<double[]> cav2Voltage = tryReadWaveformPoints(resolvePv(boosterPv, "cav2-voltage", ""), TARGET_POINTS, CAVITY_VOLTAGE_MAX_READ);
            List<double[]> cav3Voltage = tryReadWaveformPoints(resolvePv(boosterPv, "cav3-voltage", ""), TARGET_POINTS, CAVITY_VOLTAGE_MAX_READ);

            return Optional.of(toBoosterData(energy, beam, bd1, bd2, bf, cav1Voltage, cav2Voltage, cav3Voltage, cav1, cav2, cav3, powerSupplyStatus));
        } catch (Exception e) {
            log.warn("Failed reading required EPICS PV waveforms via CA: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<LinacData> readLinacData() {
        try {
            Map<String, String> linacPv = epicsConfig.getPv().get("linac");
            KlystronData kl1 = readKlystron("KL1", linacPv, "klystron1-power", "klystron1-phase", "klystron1-status");
            KlystronData kl2 = readKlystron("KL2", linacPv, "klystron2-power", "klystron2-phase", "klystron2-status");
            KlystronData kl3 = readKlystron("KL3", linacPv, "klystron3-power", "klystron3-phase", "klystron3-status");

            List<double[]> phase = !kl1.getPhase().isEmpty() ? kl1.getPhase() : List.of();
            LinacData linac = LinacData.builder()
                    .klystrons(List.of(kl1, kl2, kl3))
                    .phase(phase)
                    .gunCurrent(tryReadNumericScalar(resolvePv(linacPv, "gun-current", "")))
                    .linacCurrent(tryReadNumericScalar(resolvePv(linacPv, "linac-current", "")))
                    .systemsStatus(tryReadUiStatus(resolvePv(linacPv, "systems-status", "")))
                    .injectorStatus(tryReadUiStatus(resolvePv(linacPv, "injector-status", "")))
                    .rfStatus(tryReadUiStatus(resolvePv(linacPv, "rf-status", "")))
                    .kl1LlrfPowerStatus(tryReadUiStatus(resolvePv(linacPv, "kl1-llrf-power-status", "RF-LN:KL1:LLRF-PwrOn:Sts")))
                    .kl2LlrfPowerStatus(tryReadUiStatus(resolvePv(linacPv, "kl2-llrf-power-status", "RF-LN:KL2:LLRF-PwrOn:Sts")))
                    .kl3LlrfPowerStatus(tryReadUiStatus(resolvePv(linacPv, "kl3-llrf-power-status", "RF-LN:KL3:LLRF-PwrOn:Sts")))
                    .kl1PwrIlkStatus(tryReadUiStatus(resolvePv(linacPv, "kl1-pwr-ilk-status", "RF-LN:KL1-PwrILK:Sts")))
                    .kl2PwrIlkStatus(tryReadUiStatus(resolvePv(linacPv, "kl2-pwr-ilk-status", "RF-LN:KL2-PwrILK:Sts")))
                    .kl3PwrIlkStatus(tryReadUiStatus(resolvePv(linacPv, "kl3-pwr-ilk-status", "RF-LN:KL3-PwrILK:Sts")))
                    .build();

            boolean hasAny = linac.getKlystrons().stream().anyMatch(k -> k.getPower() != null || k.getStatus() != null || !k.getPulse().isEmpty())
                    || linac.getGunCurrent() != null
                    || linac.getLinacCurrent() != null
                    || linac.getRfStatus() != null
                    || linac.getSystemsStatus() != null
                    || linac.getInjectorStatus() != null;
            return hasAny ? Optional.of(linac) : Optional.empty();
        } catch (Exception e) {
            log.warn("Failed reading LINAC EPICS data via CA: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private KlystronData readKlystron(String id, Map<String, String> linacPv, String powerKey, String phaseKey, String statusKey) {
        String powerPv = resolvePv(linacPv, powerKey, "");
        String phasePv = resolvePv(linacPv, phaseKey, "");
        String statusPv = resolvePv(linacPv, statusKey, "");

        List<double[]> powerWave = tryReadWaveformPoints(powerPv, 1000);
        List<double[]> phaseWave = tryReadWaveformPoints(phasePv, 1000);
        Double power = powerWave.isEmpty() ? null : powerWave.stream().mapToDouble(p -> p[1]).average().orElse(Double.NaN);
        if (power != null && Double.isNaN(power)) {
            power = null;
        }

        return KlystronData.builder()
                .id(id)
                .power(power == null ? null : round2(power))
                .status(tryReadUiStatus(statusPv))
                .pulse(powerWave)
                .phase(phaseWave)
                .build();
    }

    private BoosterData toBoosterData(double[] energy, double[] beam, double[] bd1, double[] bd2, double[] bf,
                                      List<double[]> cav1Voltage, List<double[]> cav2Voltage, List<double[]> cav3Voltage,
                                      String cav1, String cav2, String cav3, String powerSupplyStatus) {
        List<double[]> energyPoints = new ArrayList<>(TARGET_POINTS);
        List<double[]> currentPoints = new ArrayList<>(TARGET_POINTS);
        List<double[]> bd1Points = new ArrayList<>(TARGET_POINTS);
        List<double[]> bd2Points = new ArrayList<>(TARGET_POINTS);
        List<double[]> bfPoints = new ArrayList<>(TARGET_POINTS);

        for (int i = 0; i < TARGET_POINTS; i++) {
            double t = i / (double) TARGET_POINTS;
            energyPoints.add(new double[]{round4(t), round2(energy[i])});
            currentPoints.add(new double[]{round4(t), round3(beam[i])});
            bd1Points.add(new double[]{round4(t), round2(bd1[i])});
            bd2Points.add(new double[]{round4(t), round2(bd2[i])});
            bfPoints.add(new double[]{round4(t), round3(bf[i])});
        }

        int injIdx = Math.min(TARGET_POINTS - 1, (int) Math.round(INJECTION_TIME * TARGET_POINTS));
        int extIdx = Math.min(TARGET_POINTS - 1, (int) Math.round(EXTRACTION_TIME * TARGET_POINTS));

        return BoosterData.builder()
                .energy(energyPoints)
                .current(currentPoints)
                .bd1(bd1Points)
                .bd2(bd2Points)
                .bf(bfPoints)
                .cav1Voltage(cav1Voltage)
                .cav2Voltage(cav2Voltage)
                .cav3Voltage(cav3Voltage)
                .injection(InjectionExtractionData.builder()
                        .time(INJECTION_TIME)
                        .energy(round2(energy[injIdx]))
                        .current(round3(beam[injIdx]))
                        .build())
                .extraction(InjectionExtractionData.builder()
                        .time(EXTRACTION_TIME)
                        .energy(round2(energy[extIdx]))
                        .current(round3(Math.max(0.0, beam[extIdx])))
                        .build())
                .rfStatus(cav1)
                .magnetStatus(powerSupplyStatus)
                .cav1LlrfModulatorStatus(cav1)
                .cav2LlrfModulatorStatus(cav2)
                .cav3LlrfModulatorStatus(cav3)
                .powerSupplyStatus(powerSupplyStatus)
                .build();
    }

    private double[] readWaveform(String pvName) throws Exception {
        return readWaveform(pvName, 0);
    }

    private double[] readWaveform(String pvName, int maxElements) throws Exception {
        String epicsBase = System.getenv("EPICS_BASE");
        if (epicsBase == null || epicsBase.isBlank()) {
            throw new IllegalStateException("EPICS_BASE is not set");
        }

        String cagetPath = epicsBase + "/bin/linux-x86_64/caget";
        List<String> cmd = new ArrayList<>();
        cmd.add(cagetPath);
        cmd.add("-t");
        cmd.add("-w");
        cmd.add("1.0");
        if (maxElements > 0) {
            cmd.add("-#");
            cmd.add(String.valueOf(maxElements));
        }
        cmd.add(pvName);
        ProcessBuilder pb = new ProcessBuilder(cmd);
        if (epicsConfig.getCaAddrList() != null && !epicsConfig.getCaAddrList().isBlank()) {
            pb.environment().put("EPICS_CA_ADDR_LIST", epicsConfig.getCaAddrList());
            pb.environment().put("EPICS_CA_AUTO_ADDR_LIST", "NO");
        }
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String mergedOutput = readStream(process.getInputStream());
        boolean finished = process.waitFor(2, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("caget timeout for " + pvName);
        }
        if (process.exitValue() != 0) {
            String details = mergedOutput.isBlank() ? "exitCode=" + process.exitValue() : mergedOutput.trim();
            throw new IllegalStateException("caget failed for " + pvName + ": " + details);
        }
        return parseWaveform(mergedOutput);
    }

    private String readStream(java.io.InputStream stream) throws Exception {
        StringBuilder out = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                out.append(line).append(' ');
            }
        }
        return out.toString();
    }

    private String readScalar(String pvName) throws Exception {
        String mergedOutput = runCaget(pvName);
        String[] tokens = mergedOutput.trim().split("\\s+");
        for (String token : tokens) {
            if (token != null && !token.isBlank()) {
                return token.trim();
            }
        }
        throw new IllegalStateException("empty scalar value for " + pvName);
    }

    private double readNumericScalar(String pvName) throws Exception {
        String raw = readScalar(pvName);
        return Double.parseDouble(raw);
    }

    private Double tryReadNumericScalar(String pvName) {
        if (pvName == null || pvName.isBlank()) {
            return null;
        }
        try {
            return readNumericScalar(pvName);
        } catch (Exception e) {
            return null;
        }
    }

    private String tryReadUiStatus(String pvName) {
        if (pvName == null || pvName.isBlank()) {
            return null;
        }
        try {
            return toUiStatus(readScalar(pvName));
        } catch (Exception e) {
            return null;
        }
    }

    private List<double[]> tryReadWaveformPoints(String pvName, int targetPoints) {
        return tryReadWaveformPoints(pvName, targetPoints, 0);
    }

    private List<double[]> tryReadWaveformPoints(String pvName, int targetPoints, int maxElements) {
        if (pvName == null || pvName.isBlank()) {
            return List.of();
        }
        try {
            double[] raw = readWaveform(pvName, maxElements);
            if (raw.length == 0) {
                return List.of();
            }
            double[] downsampled = raw.length > targetPoints ? currentCalculationService.downsample(raw, targetPoints) : raw;
            List<double[]> points = new ArrayList<>(downsampled.length);
            for (int i = 0; i < downsampled.length; i++) {
                double t = downsampled.length <= 1 ? 0.0 : i / (double) (downsampled.length - 1);
                points.add(new double[]{round4(t), round3(downsampled[i])});
            }
            return points;
        } catch (Exception e) {
            return List.of();
        }
    }

    private String runCaget(String pvName) throws Exception {
        String epicsBase = System.getenv("EPICS_BASE");
        if (epicsBase == null || epicsBase.isBlank()) {
            throw new IllegalStateException("EPICS_BASE is not set");
        }

        String cagetPath = epicsBase + "/bin/linux-x86_64/caget";
        ProcessBuilder pb = new ProcessBuilder(cagetPath, "-t", "-w", "1.0", pvName);
        if (epicsConfig.getCaAddrList() != null && !epicsConfig.getCaAddrList().isBlank()) {
            pb.environment().put("EPICS_CA_ADDR_LIST", epicsConfig.getCaAddrList());
            pb.environment().put("EPICS_CA_AUTO_ADDR_LIST", "NO");
        }
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String mergedOutput = readStream(process.getInputStream());
        boolean finished = process.waitFor(2, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("caget timeout for " + pvName);
        }
        if (process.exitValue() != 0) {
            String details = mergedOutput.isBlank() ? "exitCode=" + process.exitValue() : mergedOutput.trim();
            throw new IllegalStateException("caget failed for " + pvName + ": " + details);
        }
        return mergedOutput;
    }

    private double[] parseWaveform(String raw) {
        String[] tokens = raw.trim().split("\\s+");
        List<Double> values = new ArrayList<>(tokens.length);
        for (String token : tokens) {
            try {
                values.add(Double.parseDouble(token));
            } catch (NumberFormatException ignored) {
            }
        }
        if (values.size() > 1) {
            values.remove(0);
        }
        double[] result = new double[values.size()];
        for (int i = 0; i < values.size(); i++) {
            result[i] = values.get(i);
        }
        return result;
    }

    private String toUiStatus(String rawValue) {
        return isYes(rawValue) ? "OK" : "FAULT";
    }

    private boolean isYes(String rawValue) {
        String normalized = rawValue == null ? "" : rawValue.trim().toUpperCase();
        return "YES".equals(normalized)
                || "ON".equals(normalized)
                || "OK".equals(normalized)
                || "1".equals(normalized)
                || "TRUE".equals(normalized);
    }

    private String resolvePv(Map<String, String> map, String key, String fallback) {
        if (map == null) {
            return fallback;
        }
        return map.getOrDefault(key, fallback);
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
}
