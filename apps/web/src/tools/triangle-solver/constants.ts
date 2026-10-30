import type { TriangleInput, TriangleMode } from './utils/triangle';

export interface ModeOption {
  value: TriangleMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'SSS', label: 'SSS 三边', hint: '已知三条边，余弦定理求三角' },
  { value: 'SAS', label: 'SAS 两边夹角', hint: '已知两边及其夹角 C，余弦定理求第三边' },
  { value: 'ASA', label: 'ASA 两角夹边', hint: '已知两角 A、B 及其夹边 c，正弦定理求解' },
  { value: 'AAS', label: 'AAS 两角对边', hint: '已知两角 A、B 及角 A 的对边 a，正弦定理求解' },
  { value: 'SSA', label: 'SSA 两边对角', hint: '已知两边 a、b 及非夹角 A，可能有两个解' },
];

/** 各模式需要填写的字段（a/b/c 为边，A/B/C 为角度） */
export const MODE_FIELDS: Record<TriangleMode, Array<keyof TriangleInput>> = {
  SSS: ['a', 'b', 'c'],
  SAS: ['a', 'b', 'C'],
  ASA: ['A', 'B', 'c'],
  AAS: ['A', 'B', 'a'],
  SSA: ['a', 'b', 'A'],
};

export const FIELD_LABELS: Record<keyof Omit<TriangleInput, 'mode'>, string> = {
  a: '边 a',
  b: '边 b',
  c: '边 c',
  A: '角 A（°）',
  B: '角 B（°）',
  C: '角 C（°）',
};

export const SAMPLES: Array<{ label: string; input: TriangleInput }> = [
  { label: '3-4-5 直角三角形（SSS）', input: { mode: 'SSS', a: 3, b: 4, c: 5 } },
  { label: '两边 3、4 夹角 90°（SAS）', input: { mode: 'SAS', a: 3, b: 4, C: 90 } },
  { label: '等边：A=B=60°，c=2（ASA）', input: { mode: 'ASA', A: 60, B: 60, c: 2 } },
  { label: '30-60-90：A=90、B=30，a=10（AAS）', input: { mode: 'AAS', A: 90, B: 30, a: 10 } },
  { label: 'SSA 两解歧义：a=7、b=8、A=60°', input: { mode: 'SSA', a: 7, b: 8, A: 60 } },
];
