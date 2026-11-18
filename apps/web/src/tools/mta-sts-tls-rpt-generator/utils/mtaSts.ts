/**
 * MTA-STS 策略与 TLS-RPT 记录生成纯函数模块。
 *
 * 依据：
 * - RFC 8461（MTA-STS）：HTTPS 策略文件位于 https://mta-sts.<域>/.well-known/mta-sts.txt，
 *   DNS 通过 _mta-sts.<域> TXT 记录 v=STSv1; id=<id> 宣告策略存在与版本；
 * - RFC 8460（TLS-RPT）：_smtp._tls.<域> TXT 记录 v=TLSRPTv1; rua=<URI> 收集 TLS 投递失败报告。
 *
 * 所有函数均为确定性纯函数，不发起网络请求、不依赖浏览器 API。
 */

/** MTA-STS 模式（RFC 8461 §5） */
export type MtaStsMode = 'none' | 'testing' | 'enforce';

/** 表单输入 */
export interface MtaStsInput {
  /** 邮件域名，如 example.com */
  domain: string;
  /** 策略模式 */
  mode: MtaStsMode;
  /** 允许的 MX 主机名列表（enforce/testing 至少一条） */
  mxHosts: string[];
  /** 策略缓存上限（秒），RFC 建议最大 31557600 */
  maxAge: number;
  /** TLS-RPT 报告接收方式：mailto 或 https */
  reportScheme: 'mailto' | 'https';
  /** 报告接收目标：邮箱地址或 https URI */
  reportTarget: string;
  /** 策略版本 id（默认按时间戳生成时在 UI 层处理） */
  policyId: string;
}

/** 生成结果 */
export interface GenerationResult {
  errors: string[];
  warnings: string[];
  /** mta-sts.txt 策略文件全文 */
  policyFile: string;
  /** MTA-STS DNS TXT 记录（名称 + 值） */
  stsDns: { name: string; value: string } | null;
  /** TLS-RPT DNS TXT 记录（名称 + 值） */
  tlsRptDns: { name: string; value: string } | null;
  /** 策略文件应发布的完整 HTTPS URL */
  policyUrl: string;
}

/** RFC 8461 规定的 max_age 上限（一年） */
export const MAX_AGE_LIMIT = 31557600;
/** 常见测试 / 正式 max_age 预设 */
export const MAX_AGE_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: '1 天（灰度测试）', value: 86400 },
  { label: '1 周', value: 604800 },
  { label: '1 月', value: 2592000 },
  { label: '1 年（RFC 上限，正式）', value: MAX_AGE_LIMIT },
];

/** 主机名合法性（宽松校验，覆盖域名与通配符 *.example.com） */
const HOSTNAME_PATTERN = /^(\*\.)?([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
/** 域名（不含通配符） */
const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
/** 邮箱 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 按当前时间生成建议的策略 id（yyyymmddThhmmss 形式） */
export function generatePolicyId(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
}

/**
 * 生成完整的策略文件、DNS 记录与发布 URL。
 *
 * @param input - 表单输入
 * @returns 生成结果与错误 / 警告
 */
export function generate(input: MtaStsInput): GenerationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const domain = input.domain.trim().toLowerCase();

  if (!DOMAIN_PATTERN.test(domain)) {
    errors.push('邮件域名不合法，请输入如 example.com 的有效域名');
  }

  if (!['none', 'testing', 'enforce'].includes(input.mode)) {
    errors.push('策略模式必须是 none、testing 或 enforce');
  }

  if (!Number.isInteger(input.maxAge) || input.maxAge < 0 || input.maxAge > MAX_AGE_LIMIT) {
    errors.push(`max_age 必须是 0–${MAX_AGE_LIMIT} 之间的整数秒`);
  }

  const mxHosts = input.mxHosts.map((host) => host.trim().toLowerCase()).filter(Boolean);
  if ((input.mode === 'enforce' || input.mode === 'testing') && mxHosts.length === 0) {
    errors.push(`${input.mode} 模式至少需要一条 MX 主机名`);
  }
  for (const host of mxHosts) {
    if (!HOSTNAME_PATTERN.test(host)) {
      errors.push(`MX 主机名不合法：${host}`);
    }
    // 跨域告警：通配符与不同父域都可能放宽策略
    if (!host.endsWith(domain) && !host.endsWith(`.${domain}`)) {
      warnings.push(`MX ${host} 不在域名 ${domain} 之下，请确认第三方邮件网关是否符合预期`);
    }
  }
  if (new Set(mxHosts).size !== mxHosts.length) {
    errors.push('MX 主机名存在重复，请去重后再生成');
  }

  if (input.mode === 'none' && mxHosts.length > 0) {
    warnings.push('none 模式下 MX 行会被收件方忽略，通常仅用于临时下线 STS');
  }
  if (input.mode === 'testing') {
    warnings.push('testing 模式不强制拦截明文 / 证书失效投递，仅产出 TLS-RPT 报告供观察');
  }
  if (input.mode === 'enforce' && input.maxAge < 86400) {
    warnings.push('enforce 模式建议 max_age 至少 86400 秒（1 天），过短会削弱缓存保护');
  }

  let rua = '';
  if (input.reportScheme === 'mailto') {
    const email = input.reportTarget.trim();
    if (!EMAIL_PATTERN.test(email)) {
      errors.push('TLS-RPT 报告邮箱不合法');
    }
    rua = `mailto:${email}`;
  } else {
    const uri = input.reportTarget.trim();
    if (!/^https:\/\/[^\s/.]+\.[^\s]+$/i.test(uri)) {
      errors.push('TLS-RPT https 报告地址必须是合法的 https:// URI');
    }
    rua = uri;
  }

  if (!/^[A-Za-z0-9]{1,32}$/.test(input.policyId)) {
    errors.push('策略 id 必须是 1–32 位字母或数字（更新策略时应更换 id 触发刷新）');
  }

  // 策略文件行（RFC 8461 §3.2 规定键顺序：version、mode、max_age、mx）
  const policyLines = ['version: STSv1', `mode: ${input.mode}`, `max_age: ${input.maxAge}`];
  for (const host of mxHosts) {
    policyLines.push(`mx: ${host}`);
  }
  const policyFile = `${policyLines.join('\n')}\n`;

  const hasBlockingError = errors.length > 0;
  const stsDns = hasBlockingError
    ? null
    : { name: `_mta-sts.${domain}`, value: `v=STSv1; id=${input.policyId}` };
  const tlsRptDns = hasBlockingError
    ? null
    : { name: `_smtp._tls.${domain}`, value: `v=TLSRPTv1; rua=${rua}` };

  return {
    errors,
    warnings,
    policyFile: hasBlockingError ? '' : policyFile,
    stsDns,
    tlsRptDns,
    policyUrl: hasBlockingError ? '' : `https://mta-sts.${domain}/.well-known/mta-sts.txt`,
  };
}

/** 默认样例输入 */
export const DEFAULT_INPUT: Omit<MtaStsInput, 'policyId'> = {
  domain: 'example.com',
  mode: 'testing',
  mxHosts: ['mail.example.com', '*.example.com'],
  maxAge: 86400,
  reportScheme: 'mailto',
  reportTarget: 'tls-reports@example.com',
};
