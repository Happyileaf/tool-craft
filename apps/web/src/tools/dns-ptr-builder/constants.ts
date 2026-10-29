/** 默认示例地址 */
export const DEFAULT_INPUT = '2001:db8::1';

/** 常用前缀快捷选项 */
export const IPV4_PREFIX_OPTIONS = [8, 16, 24, 32];
export const IPV6_PREFIX_OPTIONS = [32, 48, 64, 128];

/** RFC 参考向量，供页面提示 */
export const SAMPLE_VECTORS: { input: string; ptr: string }[] = [
  { input: '192.0.2.10', ptr: '10.2.0.192.in-addr.arpa' },
  {
    input: '2001:db8::1',
    ptr: '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
  },
];
