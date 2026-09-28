/**
 * 根据描述生成常用正则表达式
 */

interface PatternTemplate {
  pattern: string;
  description: string;
  flags?: string;
}

const commonPatterns: Record<string, PatternTemplate> = {
  email: {
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配电子邮箱地址',
    flags: 'i',
  },
  url: {
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: '匹配 URL 链接',
  },
  ipv4: {
    pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    description: '匹配 IPv4 地址',
  },
  ipv6: {
    pattern: '(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])',
    description: '匹配 IPv6 地址',
  },
  'phone-cn': {
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆手机号码',
  },
  'phone-us': {
    pattern: '\\+?1?[-.\\s]?\\(?[2-9][0-8]\\d{2}\\)?[-.\\s]?[2-9]\\d{2}[-.\\s]?\\d{4}',
    description: '匹配美国电话号码',
  },
  'zipcode-cn': {
    pattern: '[1-9]\\d{5}(?!\\d)',
    description: '匹配中国邮政编码',
  },
  'zipcode-us': {
    pattern: '[0-9]{5}(?:-[0-9]{4})?',
    description: '匹配美国邮政编码',
  },
  creditcard: {
    pattern: '\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}',
    description: '匹配信用卡号码',
  },
  chinese: {
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配中文字符',
  },
  'date_yyyy_mm_dd': {
    pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
    description: '匹配 YYYY-MM-DD 格式日期',
  },
  'date_mm_dd_yyyy': {
    pattern: '(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])-\\d{4}',
    description: '匹配 MM-DD-YYYY 格式日期',
  },
  'date_dd_mm_yyyy': {
    pattern: '(0[1-9]|[12]\\d|3[01])-(0[1-9]|1[0-2])-\\d{4}',
    description: '匹配 DD-MM-YYYY 格式日期',
  },
  'time_hh_mm': {
    pattern: '([01]?\\d|2[0-3]):([0-5]\\d)',
    description: '匹配 HH:mm 格式时间',
  },
  'time_hh_mm_ss': {
    pattern: '([01]?\\d|2[0-3]):([0-5]\\d):([0-5]\\d)',
    description: '匹配 HH:mm:ss 格式时间',
  },
  hexcolor: {
    pattern: '#([a-fA-F\\d]{3}){1,2}\\b',
    description: '匹配十六进制颜色值',
    flags: 'i',
  },
  username: {
    pattern: '[a-zA-Z0-9_-]{3,16}',
    description: '匹配用户名（3-16位字母数字下划线减号）',
  },
  password: {
    pattern: '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}',
    description: '匹配密码（至少8位，包含大小写字母和数字）',
  },
  'html-tag': {
    pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/?>)',
    description: '匹配 HTML 标签',
    flags: 'i',
  },
  md5: {
    pattern: '[a-fA-F\\d]{32}',
    description: '匹配 MD5 哈希值（32位十六进制）',
    flags: 'i',
  },
  sha1: {
    pattern: '[a-fA-F\\d]{40}',
    description: '匹配 SHA-1 哈希值（40位十六进制）',
    flags: 'i',
  },
  sha256: {
    pattern: '[a-fA-F\\d]{64}',
    description: '匹配 SHA-256 哈希值（64位十六进制）',
    flags: 'i',
  },
  base64: {
    pattern: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$',
    description: '匹配 Base64 编码字符串',
  },
  uuid: {
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    description: '匹配 UUID 格式',
    flags: 'i',
  },
  macaddress: {
    pattern: '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})',
    description: '匹配 MAC 地址',
    flags: 'i',
  },
  'strong_password': {
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    description: '强密码：至少8位，包含大小写字母、数字和特殊字符',
  },
};

export function getCommonPatterns(): string[] {
  return Object.keys(commonPatterns);
}

export function getPattern(name: string): PatternTemplate | undefined {
  return commonPatterns[name];
}

export function generateRegexByName(name: string): { pattern: string; flags: string; description: string } | null {
  const template = getPattern(name);
  if (!template) {
    return null;
  }
  return {
    pattern: template.pattern,
    flags: template.flags || '',
    description: template.description,
  };
}
