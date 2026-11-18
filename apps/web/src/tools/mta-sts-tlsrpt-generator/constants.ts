/** MTA-STS / TLS-RPT 生成器的固定文案与默认值（RFC 8461 / RFC 8460） */

export const STS_VERSION = 'STSv1';
export const TLSRPT_VERSION = 'TLSRPTv1';

export type StsMode = 'enforce' | 'testing' | 'none';

export const STS_MODE_OPTIONS: Array<{ value: StsMode; label: string; hint: string }> = [
  { value: 'enforce', label: 'enforce（强制）', hint: '拒绝无法建立 TLS 的连接' },
  { value: 'testing', label: 'testing（仅报告）', hint: '不拦截投递，仅触发 TLS-RPT 报告' },
  { value: 'none', label: 'none（停用）', hint: '声明域暂不实施 MTA-STS' },
];

/** RFC 8461 §3.2：mx 通配符仅允许 *. 前缀且至少带一个标签 */
export const MAX_AGE_LIMIT = 31557600;

export const DEFAULT_DOMAIN = 'example.com';
export const DEFAULT_MODE: StsMode = 'enforce';
export const DEFAULT_MAX_AGE = 86400;
export const DEFAULT_MX_HOSTS = 'mail.example.com';
export const DEFAULT_RUA = 'mailto:sts-reports@example.com';
export const DEFAULT_POLICY_ID = '20261118000000';
