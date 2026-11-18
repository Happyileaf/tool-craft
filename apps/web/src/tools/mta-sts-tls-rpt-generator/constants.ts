/**
 * MTA-STS / TLS-RPT 生成器的静态选项
 */
import type { MtaStsMode } from './utils/mtaSts';

/** 策略模式选项（RFC 8461 §5） */
export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: MtaStsMode }> = [
  { label: 'testing（仅观察、出报告，不拦截）', value: 'testing' },
  { label: 'enforce（强制 TLS，证书 / 明文失败即降级拒绝）', value: 'enforce' },
  { label: 'none（临时下线 STS）', value: 'none' },
];

/** 报告接收方式 */
export const REPORT_SCHEME_OPTIONS: ReadonlyArray<{ label: string; value: 'mailto' | 'https' }> = [
  { label: 'mailto（邮箱聚合报告）', value: 'mailto' },
  { label: 'https（POST 到收集端点）', value: 'https' },
];
