export const REGEX_PATTERNS = {
  email: {
    name: '电子邮箱',
    nameEn: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配标准电子邮箱地址'
  },
  url: {
    name: '网址 URL',
    nameEn: 'URL',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: '匹配 HTTP/HTTPS URL'
  },
  ipv4: {
    name: 'IPv4 地址',
    nameEn: 'IPv4 Address',
    pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    description: '匹配 IPv4 地址'
  },
  phoneCN: {
    name: '中国手机号码',
    nameEn: 'China Mobile Phone',
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆手机号码'
  },
  idCardCN: {
    name: '中国身份证号码',
    nameEn: 'China ID Card',
    pattern: '[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    description: '匹配 18 位中国居民身份证号码'
  },
  zipCodeUS: {
    name: '美国邮政编码',
    nameEn: 'US ZIP Code',
    pattern: '\\d{5}(-\\d{4})?',
    description: '匹配美国邮政编码（支持 5 位和 9 位格式）'
  },
  creditCard: {
    name: '信用卡号码',
    nameEn: 'Credit Card',
    pattern: '\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}',
    description: '匹配信用卡卡号（支持带空格或连分隔符）'
  },
  dateISO: {
    name: 'ISO 日期 (YYYY-MM-DD)',
    nameEn: 'ISO Date (YYYY-MM-DD)',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    description: '匹配 ISO 8601 标准日期格式 YYYY-MM-DD'
  },
  timeHHMM: {
    name: '时间 (HH:MM)',
    nameEn: 'Time (HH:MM)',
    pattern: '([01]?\\d|2[0-3]):[0-5]\\d',
    description: '匹配 24 小时制时间 HH:MM'
  },
  chinese: {
    name: '中文字符',
    nameEn: 'Chinese Characters',
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配中文字符'
  },
  hexColor: {
    name: '十六进制颜色',
    nameEn: 'Hex Color',
    pattern: '#([A-Fa-f\\d]{3}|[A-Fa-f\\d]{6})',
    description: '匹配十六进制颜色代码'
  },
  youtubeId: {
    name: 'YouTube Video ID',
    nameEn: 'YouTube Video ID',
    pattern: '[a-zA-Z0-9_-]{11}',
    description: '匹配 YouTube 视频 ID'
  }
};

export const FLAGS = [
  { key: 'g', name: '全局匹配 (g)', description: '查找所有匹配项，而非第一个匹配后停止' },
  { key: 'i', name: '不区分大小写 (i)', description: '匹配时忽略大小写' },
  { key: 'm', name: '多行模式 (m)', description: '^ 和 $ 匹配行首行尾而非整个字符串首尾' },
  { key: 's', name: '点号匹配换行 (s)', description: '让 . 匹配包括换行符在内的所有字符' },
  { key: 'u', name: 'Unicode (u)', description: '开启 Unicode 识别，支持 \\u{hhhh} 语法' },
];

export const DEFAULT_SAMPLE = 'Please contact us at support@example.com or sales@company.org.uk';
