import type { OpAmpTopology } from './utils/opamp';

/** 拓扑选项元数据 */
export const TOPOLOGY_OPTIONS: { value: OpAmpTopology; label: string; formula: string }[] = [
  { value: 'inverting', label: '反相放大器', formula: 'Vout = −(Rf / Rin) · Vin' },
  { value: 'nonInverting', label: '同相放大器', formula: 'Vout = (1 + Rf / Rg) · Vin' },
  { value: 'summing', label: '反相加法器', formula: 'Vout = −Rf · Σ(Vi / Ri)' },
  { value: 'differential', label: '差分放大器', formula: 'Vout = (Rf / R1) · (V2 − V1)' },
];

/** 各拓扑默认输入（首次切换时载入） */
export const DEFAULT_INPUTS: Record<OpAmpTopology, Record<string, string>> = {
  inverting: { vin: '0.5V', rin: '10k', rf: '100k' },
  nonInverting: { vin: '0.2V', rg: '10k', rf: '90k' },
  summing: { rf: '100k', v1: '0.1V', r1: '10k', v2: '0.2V', r2: '10k' },
  differential: { v1: '0.1V', v2: '0.3V', r1: '10k', rf: '100k', rg1: '10k', rg2: '100k' },
};
