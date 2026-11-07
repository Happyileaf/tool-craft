import type { AlignmentMode, DmarcPolicy, FoFlag, ReportFormat } from './utils/dmarc';

export const POLICY_OPTIONS: ReadonlyArray<{ label: string; value: DmarcPolicy }> = [
  { label: 'none（仅监控）', value: 'none' },
  { label: 'quarantine（隔离/进垃圾邮件）', value: 'quarantine' },
  { label: 'reject（拒收）', value: 'reject' },
];

export const SUBDOMAIN_POLICY_OPTIONS: ReadonlyArray<{ label: string; value: '' | DmarcPolicy }> = [
  { label: '不单独设置（跟随主域）', value: '' },
  { label: 'none', value: 'none' },
  { label: 'quarantine', value: 'quarantine' },
  { label: 'reject', value: 'reject' },
];

export const ALIGNMENT_OPTIONS: ReadonlyArray<{ label: string; value: AlignmentMode }> = [
  { label: 'r 宽松（默认）', value: 'r' },
  { label: 's 严格', value: 's' },
];

export const FO_OPTIONS: ReadonlyArray<{ label: string; value: FoFlag }> = [
  { label: '0 任一机制对齐即不报告（默认）', value: '0' },
  { label: '1 任一机制失败即取证', value: '1' },
  { label: 'd DKIM 失败取证', value: 'd' },
  { label: 's SPF 失败取证', value: 's' },
];

export const RF_OPTIONS: ReadonlyArray<{ label: string; value: ReportFormat }> = [
  { label: 'afrf（RFC 7489 默认）', value: 'afrf' },
  { label: 'iodef', value: 'iodef' },
];

export const DEFAULT_VALIDATE_RECORD =
  'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=50';
