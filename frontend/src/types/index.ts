export interface KlystronData {
  id: string;
  power: number | null;
  status: string | null;
  pulse: number[][];
}

export interface LinacData {
  klystrons: KlystronData[];
  phase: number[][];
  gunCurrent: number | null;
  linacCurrent: number | null;
  systemsStatus: string | null;
  injectorStatus: string | null;
  rfStatus: string | null;
  kl1LlrfPowerStatus: string | null;
  kl2LlrfPowerStatus: string | null;
  kl3LlrfPowerStatus: string | null;
  kl1PwrIlkStatus: string | null;
  kl2PwrIlkStatus: string | null;
  kl3PwrIlkStatus: string | null;
}

export interface InjectionExtractionData {
  time: number | null;
  energy: number | null;
  current: number | null;
}

export interface BoosterData {
  energy: number[][];
  current: number[][];
  bd1: number[][];
  bd2: number[][];
  bf: number[][];
  injection: InjectionExtractionData;
  extraction: InjectionExtractionData;
  rfStatus: string | null;
  magnetStatus: string | null;
  cav1LlrfModulatorStatus: string | null;
  cav2LlrfModulatorStatus: string | null;
  cav3LlrfModulatorStatus: string | null;
  powerSupplyStatus: string | null;
}

export interface MonitorSnapshot {
  timestamp: string;
  linac: LinacData | null;
  booster: BoosterData | null;
}
