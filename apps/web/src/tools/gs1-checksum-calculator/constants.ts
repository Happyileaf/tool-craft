import type { Gs1Kind } from './utils/gs1';
import { GS1_TYPES } from './utils/gs1';

export const KIND_OPTIONS: ReadonlyArray<{ label: string; value: Gs1Kind }> = (
  Object.values(GS1_TYPES) as Array<(typeof GS1_TYPES)[Gs1Kind]>
).map((spec) => ({
  label: `${spec.label}（${spec.fullLength} 位${spec.ai ? `，AI ${spec.ai}` : ''}）`,
  value: spec.kind,
}));

export const DEFAULT_BATCH_TEXT = [
  'SSCC,001234560000000018',
  'GTIN14,12345678901231',
  'GTIN13,4006381333931',
  'GTIN12,036000291452',
  'GTIN8,96385074',
].join('\n');
