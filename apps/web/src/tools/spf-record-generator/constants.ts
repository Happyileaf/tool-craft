/**
 * SPF 记录生成与校验器常量
 * 参考：RFC 7208（Sender Policy Framework）
 * https://www.rfc-editor.org/rfc/rfc7208
 */

/** SPF 版本标识 */
export const SPF_VERSION = 'v=spf1';

/** SPF 机制（mechanism） */
export const SPF_MECHANISMS = [
  { value: 'all', label: 'all', needsDomain: false, dnsLookups: 0, hint: '匹配所有其余发信源（通常放末尾）' },
  { value: 'a', label: 'a', needsDomain: false, dnsLookups: 1, hint: '域名 A / AAAA 记录匹配发信 IP' },
  { value: 'mx', label: 'mx', needsDomain: false, dnsLookups: 1, hint: '域名 MX 主机的 IP 匹配发信 IP' },
  { value: 'ptr', label: 'ptr', needsDomain: false, dnsLookups: 1, hint: 'PTR 主机名落在域内（RFC 不推荐，开销大）' },
  { value: 'ip4', label: 'ip4', needsDomain: false, dnsLookups: 0, hint: 'IPv4 地址或 CIDR，如 192.0.2.0/24' },
  { value: 'ip6', label: 'ip6', needsDomain: false, dnsLookups: 0, hint: 'IPv6 地址或 /前缀，如 2001:db8::/32' },
  { value: 'include', label: 'include', needsDomain: true, dnsLookups: 1, hint: '引入第三方域的 SPF 记录（计 1 次查询）' },
  { value: 'exists', label: 'exists', needsDomain: true, dnsLookups: 1, hint: '目标域解析出 A 记录即匹配（少用）' },
  { value: 'redirect', label: 'redirect=', needsDomain: true, dnsLookups: 1, hint: '整记录转交另一域（修饰符，非机制）' },
] as const;

/** 限定符（qualifier） */
export const SPF_QUALIFIERS = [
  { value: '+', label: '+ 通过（Pass）' },
  { value: '-', label: '- 拒绝（Fail）' },
  { value: '~', label: '~ 软失败（SoftFail）' },
  { value: '?', label: '? 中立（Neutral）' },
] as const;

/** RFC 7208 §4.6.4 规定的 SPF 评估期间最大 DNS 查询次数（仅统计需查询类机制） */
export const SPF_MAX_DNS_LOOKUPS = 10;

/** 会触发 DNS 查询计数的机制（§10.1/§4.6.4：include/a/mx/ptr/exists/redirect，不含 ip4/ip6/all） */
export const DNS_LOOKUP_MECHANISMS = new Set(['a', 'mx', 'ptr', 'include', 'exists', 'redirect']);

/** 单条 TXT 字符串上限（§4.5.4：单字符串 255 字节，保守按 ASCII 长度提示） */
export const SPF_MAX_RECORD_LENGTH = 255;

/** 示例：自建 + 常见第三方发信服务 */
export const SAMPLE_MECHANISMS: Array<{
  id: string;
  mechanism: string;
  qualifier: string;
  value: string;
}> = [
  { id: 'sample-ip4', mechanism: 'ip4', qualifier: '+', value: '192.0.2.0/24' },
  { id: 'sample-ip6', mechanism: 'ip6', qualifier: '+', value: '2001:db8::/32' },
  { id: 'sample-inc', mechanism: 'include', qualifier: '+', value: '_spf.example.com' },
  { id: 'sample-all', mechanism: 'all', qualifier: '~', value: '' },
];

/** 可一键加入的常见第三方发信域 include 模板 */
export const COMMON_INCLUDE_PRESETS = [
  { label: 'Google Workspace', domain: '_spf.google.com' },
  { label: 'Microsoft 365', domain: 'spf.protection.outlook.com' },
  { label: 'SendGrid', domain: 'sendgrid.net' },
  { label: 'Mailchimp', domain: 'servers.mcsv.net' },
  { label: 'Amazon SES', domain: 'amazonses.com' },
];

export const DEFAULT_QUALIFIER = '+';
