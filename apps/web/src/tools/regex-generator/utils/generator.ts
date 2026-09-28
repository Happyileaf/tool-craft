export interface RegexPattern {
  name: string;
  description: string;
  pattern: string;
  category: string;
}

export const COMMON_PATTERNS: RegexPattern[] = [
  // 邮箱
  {
    name: 'Email',
    description: '匹配电子邮箱地址',
    pattern: '([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)',
    category: '网络',
  },
  // URL
  {
    name: 'URL',
    description: '匹配网址 URL',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    category: '网络',
  },
  // IPv4 地址
  {
    name: 'IPv4 Address',
    description: '匹配 IPv4 地址',
    pattern: '((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    category: '网络',
  },
  // 中国大陆手机号
  {
    name: '中国手机号',
    description: '匹配中国大陆手机号码',
    pattern: '1[3-9]\\d{9}',
    category: '验证',
  },
  // 中国大陆邮政编码
  {
    name: '中国邮政编码',
    description: '匹配中国大陆邮政编码',
    pattern: '[1-9]\\d{5}(?!\\d)',
    category: '验证',
  },
  // 身份证号码（18位）
  {
    name: '中国身份证（18位）',
    description: '匹配18位中国大陆身份证号码',
    pattern: '[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]',
    category: '验证',
  },
  // 银行卡号
  {
    name: '银行卡号',
    description: '匹配银行卡号',
    pattern: '\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}',
    category: '验证',
  },
  // 中文字符
  {
    name: '中文字符',
    description: '匹配中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    category: '文本',
  },
  // 英文数字下划线
  {
    name: '英文数字下划线',
    description: '匹配仅由英文字母、数字、下划线组成的字符串',
    pattern: '^\\w+$',
    category: '文本',
  },
  // HTML 标签
  {
    name: 'HTML 标签',
    description: '匹配 HTML 标签',
    pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)',
    category: '代码',
  },
  // 十六进制颜色
  {
    name: '十六进制颜色',
    description: '匹配 CSS 十六进制颜色值',
    pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})',
    category: '设计',
  },
  // YYYY-MM-DD 日期格式
  {
    name: 'YYYY-MM-DD 日期',
    description: '匹配 YYYY-MM-DD 格式的日期',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    category: '时间',
  },
  // HH:mm:ss 时间格式
  {
    name: 'HH:mm:ss 时间',
    description: '匹配 HH:mm:ss 格式的时间',
    pattern: '([01]?\\d|2[0-3]):([0-5]?\\d):([0-5]?\\d)',
    category: '时间',
  },
  // 文件名带扩展名
  {
    name: '文件名',
    description: '匹配带扩展名的文件名',
    pattern: '[^\\s]+\\.[a-zA-Z0-9]+',
    category: '文件',
  },
];
