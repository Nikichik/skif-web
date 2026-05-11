export interface KlystronData {
  id: string;
  power: number;
  status: string;
  pulse: number[][];
}

export interface LinacData {
  klystrons: KlystronData[];
  phase: number[][];
  gunCurrent: number;
  linacCurrent: number;
  systemsStatus: string;
  injectorStatus: string;
  rfStatus: string;
  kl1LlrfPowerStatus: string;
  kl2LlrfPowerStatus: string;
  kl3LlrfPowerStatus: string;
  kl1PwrIlkStatus: string;
  kl2PwrIlkStatus: string;
  kl3PwrIlkStatus: string;
}

export interface InjectionExtractionData {
  time: number;
  energy: number;
  current: number;
}

export interface BoosterData {
  energy: number[][];
  current: number[][];
  bd1: number[][];
  bd2: number[][];
  bf: number[][];
  injection: InjectionExtractionData;
  extraction: InjectionExtractionData;
  rfStatus: string;
  magnetStatus: string;
  cav1LlrfModulatorStatus: string;
  cav2LlrfModulatorStatus: string;
  cav3LlrfModulatorStatus: string;
  powerSupplyStatus: string;
}

export interface MonitorSnapshot {
  timestamp: string;
  linac: LinacData;
  booster: BoosterData;
}
