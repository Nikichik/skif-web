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
}

export interface MonitorSnapshot {
  timestamp: string;
  linac: LinacData;
  booster: BoosterData;
}
