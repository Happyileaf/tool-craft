/**
 * 邮箱地址语法校验器工具内常量
 */

/** 输入框默认示例 */
export const DEFAULT_EMAIL = 'user.name+tag@sub.example.com';

/** 一键填充的示例地址（含合法与非法向量） */
export const EMAIL_EXAMPLES: { label: string; value: string }[] = [
  { label: '标准地址', value: 'user@example.com' },
  { label: '含加号与子域', value: 'a.b+c@sub.example.co' },
  { label: '引号本地部分', value: '"john doe"@example.com' },
  { label: 'IPv4 字面量域', value: 'admin@[192.168.0.1]' },
  { label: '国际化地址 (IDN)', value: '用户@例子.中国' },
  { label: '非法：连续点', value: 'a..b@example.com' },
  { label: '非法：IPv4 越界', value: 'ab@[256.1.1.1]' },
];

/** 输入框行数 */
export const INPUT_ROWS = 3;
