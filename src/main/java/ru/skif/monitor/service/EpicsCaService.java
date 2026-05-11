package ru.skif.monitor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.skif.monitor.config.EpicsConfig;
import ru.skif.monitor.model.BoosterData;
import ru.skif.monitor.model.InjectionExtractionData;
import ru.skif.monitor.model.LinacData;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class EpicsCaService {

    private static final int TARGET_POINTS = 1000;
    private static final double INJECTION_TIME = 0.05;
    private static final double EXTRACTION_TIME = 0.9;

    private final EpicsConfig epicsConfig;
    private final CurrentCalculationService currentCalculationService;
    private final AtomicReference<double[]> lastGoodBeamCurrent = new AtomicReference<>();
    private final Map<String, String> lastGoodScalarValues = new ConcurrentHashMap<>();

    public Optional<BoosterData> readBoosterData() {
        try {
            Map<String, String> boosterPv = epicsConfig.getPv().get("booster");
            double[] bd1Raw = readWaveform(resolvePv(boosterPv, "bd1", "MG-BR:BD1-I:Wf"));
            double[] bd2Raw = readWaveform(resolvePv(boosterPv, "bd2", "MG-BR:BD2-I:Wf"));
            double[] bfRaw = readWaveform(resolvePv(boosterPv, "bf", "MG-BR:BF-I:Wf"));
            String beamPv = resolvePv(boosterPv, "beam-current", "BI-BDS:DCCT-Ch1Wf10Data:Mes");
            double[] beamRaw = tryReadBeamCurrent(beamPv);
            String cav1 = toUiStatus(tryReadScalarWithFallback(resolvePv(boosterPv, "cav1-llrf-modulator-status", "RF-BR:CAV1:LLRF-ModulatorOn:Sts"), "NO"));
            String cav2 = toUiStatus(tryReadScalarWithFallback(resolvePv(boosterPv, "cav2-llrf-modulator-status", "RF-BR:CAV2:LLRF-ModulatorOn:Sts"), "NO"));
            String cav3 = toUiStatus(tryReadScalarWithFallback(resolvePv(boosterPv, "cav3-llrf-modulator-status", "RF-BR:CAV3:LLRF-ModulatorOn:Sts"), "NO"));
            String bd1Pson = tryReadScalarWithFallback(resolvePv(boosterPv, "bd1-pson-status", "MG-BR:BD1-PSON:Cmd"), "NO");
            String bd2Pson = tryReadScalarWithFallback(resolvePv(boosterPv, "bd2-pson-status", "MG-BR:BD2-PSON:Cmd"), "NO");
            String bfPson = tryReadScalarWithFallback(resolvePv(boosterPv, "bf-pson-status", "MG-BR:BF-PSON:Cmd"), "NO");
            String powerSupplyStatus = (isYes(bd1Pson) && isYes(bd2Pson) && isYes(bfPson)) ? "OK" : "FAULT";

            if (bd1Raw.length == 0 || bd2Raw.length == 0 || bfRaw.length == 0) {
                return Optional.empty();
            }

            double[] energy = currentCalculationService.calculateEnergyWaveform(bd1Raw, bd2Raw, bfRaw, TARGET_POINTS);
            double[] beam = currentCalculationService.calculateBeamCurrent(beamRaw, TARGET_POINTS);
            double[] bd1 = currentCalculationService.downsample(bd1Raw, TARGET_POINTS);
            double[] bd2 = currentCalculationService.downsample(bd2Raw, TARGET_POINTS);
            double[] bf = currentCalculationService.downsample(bfRaw, TARGET_POINTS);

            return Optional.of(toBoosterData(energy, beam, bd1, bd2, bf, cav1, cav2, cav3, powerSupplyStatus));
        } catch (Exception e) {
            log.warn("Failed reading required EPICS PV waveforms via CA: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<LinacData> readLinacStatusData(LinacData baseLinac) {
        try {
            Map<String, String> linacPv = epicsConfig.getPv().get("linac");
            return Optional.of(baseLinac.toBuilder()
                    .kl1LlrfPowerStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl1-llrf-power-status", "RF-LN:KL1:LLRF-PwrOn:Sts"), "NO")))
                    .kl2LlrfPowerStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl2-llrf-power-status", "RF-LN:KL2:LLRF-PwrOn:Sts"), "NO")))
                    .kl3LlrfPowerStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl3-llrf-power-status", "RF-LN:KL3:LLRF-PwrOn:Sts"), "NO")))
                    .kl1PwrIlkStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl1-pwr-ilk-status", "RF-LN:KL1-PwrILK:Sts"), "NO")))
                    .kl2PwrIlkStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl2-pwr-ilk-status", "RF-LN:KL2-PwrILK:Sts"), "NO")))
                    .kl3PwrIlkStatus(toUiStatus(tryReadScalarWithFallback(resolvePv(linacPv, "kl3-pwr-ilk-status", "RF-LN:KL3-PwrILK:Sts"), "NO")))
                    .build());
        } catch (Exception e) {
            log.warn("Failed reading LINAC EPICS statuses via CA: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private double[] tryReadBeamCurrent(String beamPv) {
        try {
            double[] beamRaw = readWaveform(beamPv);
            if (beamRaw.length == 0) {
                throw new IllegalStateException("empty waveform");
            }
            lastGoodBeamCurrent.set(beamRaw);
            return beamRaw;
        } catch (Exception e) {
            double[] last = lastGoodBeamCurrent.get();
            if (last != null && last.length > 0) {
                log.warn("Beam current PV '{}' unavailable ({}), using last-good waveform", beamPv, e.getMessage());
                return last;
            }
            log.warn("Beam current PV '{}' unavailable ({}), using zero waveform fallback", beamPv, e.getMessage());
            return new double[TARGET_POINTS];
        }
    }

    private BoosterData toBoosterData(double[] energy, double[] beam, double[] bd1, double[] bd2, double[] bf,
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

    private String tryReadScalarWithFallback(String pvName, String defaultValue) {
        try {
            String rawValue = readScalar(pvName);
            if (rawValue == null || rawValue.isBlank()) {
                throw new IllegalStateException("empty scalar value");
            }
            lastGoodScalarValues.put(pvName, rawValue);
            return rawValue;
        } catch (Exception e) {
            String last = lastGoodScalarValues.get(pvName);
            if (last != null && !last.isBlank()) {
                log.warn("Scalar PV '{}' unavailable ({}), using last-good value", pvName, e.getMessage());
                return last;
            }
            log.warn("Scalar PV '{}' unavailable ({}), using default '{}'", pvName, e.getMessage(), defaultValue);
            return defaultValue;
        }
    }

    private String readScalar(String pvName) throws Exception {
        String mergedOutput = runCaget(pvName);
        String[] tokens = mergedOutput.trim().split("\\s+");
        for (String token : tokens) {
            if (token != null && !token.isBlank()) {
                return token.trim();
            }
        }
        return "";
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
        return "YES".equalsIgnoreCase(rawValue == null ? "" : rawValue.trim());
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
