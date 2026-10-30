import type { PolynomialMode } from './utils/polynomial';

export interface ModeOption {
  value: PolynomialMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'quadratic',
    label: '二次方程 ax² + bx + c = 0',
    hint: '求根公式：Δ = b² − 4ac，按 Δ > 0 / = 0 / < 0 给出两实根、二重根或共轭复根',
  },
  {
    value: 'cubic',
    label: '三次方程 ax³ + bx² + cx + d = 0',
    hint: '归一化后使用 Cardano 法；首项系数为 0 时自动降次为二次 / 一次方程',
  },
];

export const FIELD_LABELS: Record<'a' | 'b' | 'c' | 'd', string> = {
  a: '系数 a',
  b: '系数 b',
  c: '系数 c',
  d: '系数 d',
};

export interface Sample {
  label: string;
  mode: PolynomialMode;
  a: number;
  b: number;
  c: number | null;
  d: number | null;
}

export const SAMPLES: Sample[] = [
  { label: '二次：x²−5x+6=0', mode: 'quadratic', a: 1, b: -5, c: 6, d: null },
  { label: '二次复根：x²+1=0', mode: 'quadratic', a: 1, b: 0, c: 1, d: null },
  { label: '三次三实根：x³−6x²+11x−6=0', mode: 'cubic', a: 1, b: -6, c: 11, d: -6 },
  { label: '三次重根：(x−2)³=0', mode: 'cubic', a: 1, b: -6, c: 12, d: -8 },
  { label: '自动降次：0x³+3x−9=0', mode: 'cubic', a: 0, b: 0, c: 3, d: -9 },
];
