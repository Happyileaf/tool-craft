export interface RegexPattern {
  name: string;
  description: string;
  pattern: string;
  flags: string;
  category: string;
  examples: string[];
}

export const REGEX_PATTERNS: RegexPattern[] = [
  // Common validations
  {
    name: 'Email',
    description: '匹配标准电子邮箱地址',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'i',
    category: 'validation',
    examples: [
      'user@example.com',
      'john.doe+tag@domain.co.uk',
    ],
  },
  {
    name: 'URL',
    description: '匹配 HTTP/HTTPS URL',
    pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$',
    flags: 'i',
    category: 'validation',
    examples: [
      'https://www.example.com',
      'http://example.com/path?query=123',
    ],
  },
  {
    name: 'IPv4 Address',
    description: '匹配 IPv4 地址',
    pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
    flags: '',
    category: 'validation',
    examples: [
      '192.168.1.1',
      '8.8.8.8',
    ],
  },
  {
    name: 'IPv6 Address',
    description: '匹配 IPv6 地址',
    pattern: '(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])',
    flags: 'i',
    category: 'validation',
    examples: [
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      'fe80::1ff:fe23:4567:890a',
    ],
  },
  {
    name: 'MAC Address',
    description: '匹配 MAC 硬件地址',
    pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
    flags: 'i',
    category: 'validation',
    examples: [
      '00:1A:2B:3C:4D:5E',
      '00-1A-2B-3C-4D-5E',
    ],
  },
  {
    name: 'U.S. Phone Number',
    description: '匹配美国电话号码',
    pattern: '^\\+?1?[-.\\s]?\\(?[2-9][0-9]{2}\\)?[-.\\s]?[2-9][0-9]{2}[-.\\s]?[0-9]{4}$',
    flags: '',
    category: 'validation',
    examples: [
      '(123) 456-7890',
      '123-456-7890',
      '+1 123 456 7890',
    ],
  },
  {
    name: 'Chinese Phone Number',
    description: '匹配中国大陆手机号码',
    pattern: '^1[3-9]\\d{9}$',
    flags: '',
    category: 'validation',
    examples: [
      '13812345678',
      '15912345678',
    ],
  },
  {
    name: 'Credit Card Number',
    description: '匹配信用卡卡号 (Luhn 校验不在这里做)',
    pattern: '^[4-6][0-9]{14}([0-9]{2})?$',
    flags: '',
    category: 'validation',
    examples: [
      '4111111111111111',
      '5555555555554444',
    ],
  },
  {
    name: 'US ZIP Code',
    description: '匹配美国邮政编码',
    pattern: '^\\d{5}(-\\d{4})?$',
    flags: '',
    category: 'validation',
    examples: [
      '90210',
      '10001-1234',
    ],
  },
  {
    name: 'HTML Color Hex',
    description: '匹配 HEX 格式颜色码',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
    flags: 'i',
    category: 'validation',
    examples: [
      '#fff',
      '#ff0000',
    ],
  },

  // identifiers
  {
    name: 'UUID v4',
    description: '匹配 UUID 版本 4',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$',
    flags: 'i',
    category: 'identifier',
    examples: [
      '550e8400-e29b-41d4-a716-446655440000',
    ],
  },
  {
    name: 'JWT Token',
    description: '匹配 JSON Web Token',
    pattern: '^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$',
    flags: '',
    category: 'identifier',
    examples: [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    ],
  },

  // common patterns
  {
    name: 'Number',
    description: '匹配整数或小数（支持正负号）',
    pattern: '^[+-]?\\d+(\\.\\d+)?$',
    flags: '',
    category: 'common',
    examples: [
      '123',
      '-45.67',
      '+89.0',
    ],
  },
  {
    name: 'Integer',
    description: '匹配整数（支持正负号）',
    pattern: '^[+-]?\\d+$',
    flags: '',
    category: 'common',
    examples: [
      '123',
      '-456',
    ],
  },
  {
    name: 'Alphanumeric',
    description: '只匹配字母和数字',
    pattern: '^[a-zA-Z0-9]+$',
    flags: '',
    category: 'common',
    examples: [
      'abc123',
      'ABCDEF',
    ],
  },
  {
    name: 'Slug',
    description: '匹配 URL slug（小写字母、数字、连字符）',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    flags: '',
    category: 'common',
    examples: [
      'hello-world',
      'post-title-123',
    ],
  },
  {
    name: 'Date (YYYY-MM-DD)',
    description: '匹配 ISO 格式日期 YYYY-MM-DD',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    flags: '',
    category: 'common',
    examples: [
      '2024-12-31',
      '2026-01-01',
    ],
  },
  {
    name: 'Time (HH:MM)',
    description: '匹配 24 小时制时间 HH:MM',
    pattern: '^([01]?\\d|2[0-3]):[0-5]\\d$',
    flags: '',
    category: 'common',
    examples: [
      '09:30',
      '23:59',
    ],
  },
  {
    name: 'Username',
    description: '用户名：3-20 位，字母开头，字母数字下划线',
    pattern: '^[a-zA-Z][a-zA-Z0-9_]{2,19}$',
    flags: '',
    category: 'common',
    examples: [
      'johndoe',
      'user_name123',
    ],
  },
  {
    name: 'Strong Password',
    description: '强密码：至少 8 位，包含大小写、数字和特殊符号',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: '',
    category: 'common',
    examples: [
      'Passw0rd!',
      'Str0ngP@ss',
    ],
  },
  {
    name: 'Chinese Characters',
    description: '只匹配中文字符',
    pattern: '^[\\u4e00-\\u9fa5]+$',
    flags: '',
    category: 'common',
    examples: [
      '你好世界',
      '中文测试',
    ],
  },
];

export function getCategories() {
  const categories = new Set(REGEX_PATTERNS.map(p => p.category));
  return Array.from(categories);
}

export function getPatternsByCategory(category: string) {
  return REGEX_PATTERNS.filter(p => p.category === category);
}

export function getPatternByName(name: string) {
  return REGEX_PATTERNS.find(p => p.name === name);
}
