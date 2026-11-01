/**
 * RFC 2047 邮件头编码字解码工具内常量
 */

/**
 * 顶部提示文案
 */
export const HINT =
  '把邮件头中的 RFC 2047 编码字（形如 =?UTF-8?B?5rWL6K+V?=）还原为可读文本，支持 B（Base64）与 Q（=XX 十六进制、_ 表示空格）两种编码，支持 UTF-8、GBK、GB2312 等字符集，以及多段编码字与明文混排（相邻编码字间的折行空白按 RFC 2047 折叠）。全部在浏览器本地完成。';

/**
 * 默认示例：含 UTF-8 B 编码字与明文混排的邮件主题
 */
export const DEFAULT_INPUT =
  'Subject: =?UTF-8?B?5rWL6K+V5oql5ZGK?= (=?GB2312?Q?=B2=E2=CA=D4?=)';

/**
 * 空输入提示
 */
export const EMPTY_TEXT = '请在上方粘贴含编码字的邮件头文本';
