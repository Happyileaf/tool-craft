import type { UuidVersion } from './utils/uuid-name';

/** 名称型 UUID 版本选项 */
export const VERSION_OPTIONS: { value: UuidVersion; label: string; hint: string }[] = [
  {
    value: 5,
    label: 'v5（SHA-1，推荐）',
    hint: '以 SHA-1 摘要命名空间与名称，RFC 9562 推荐的名称型 UUID',
  },
  {
    value: 3,
    label: 'v3（MD5，兼容）',
    hint: '以 MD5 摘要命名空间与名称，仅用于兼容历史系统',
  },
];

/** 内置命名空间选项（值为 CUSTOM 时使用用户粘贴的自定义命名空间） */
export const NAMESPACE_OPTIONS: { value: string; label: string; uuid: string }[] = [
  { value: 'DNS', label: 'DNS（完全限定域名）', uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { value: 'URL', label: 'URL', uuid: '6ba7b811-9dad-11d1-80b4-00c04fd430c8' },
  { value: 'OID', label: 'OID（ISO 对象标识符）', uuid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8' },
  { value: 'X500', label: 'X.500 DN（区分名）', uuid: '6ba7b814-9dad-11d1-80b4-00c04fd430c8' },
  { value: 'CUSTOM', label: '自定义命名空间 UUID…', uuid: '' },
];

export const CUSTOM_NAMESPACE_KEY = 'CUSTOM';

/** 默认名称（RFC 附录标准向量：DNS + python.org） */
export const DEFAULT_NAME = 'python.org';

/** 默认选中内置 DNS 命名空间 */
export const DEFAULT_NAMESPACE_KEY = 'DNS';
