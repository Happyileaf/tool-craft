/**
 * security.txt 生成器内常量：表单示例、解析样例与提示文案
 */

/** 顶部说明 */
export const HINT =
  '按 RFC 9116 生成并解析 /.well-known/security.txt：Contact 与 Expires 必填，全部内容仅在浏览器本地处理。';

/** 部署路径提示 */
export const DEPLOY_PATH = '/.well-known/security.txt';

/** 生成表单字段（均为多行文本，每行一条；Preferred-Languages 单行） */
export interface SecurityTxtForm {
  /** Contact，每行一条 URI */
  contacts: string;
  /** Expires，RFC 3339 日期时间 */
  expires: string;
  /** Encryption，每行一条 */
  encryption: string;
  /** Acknowledgments，每行一条 */
  acknowledgments: string;
  /** Preferred-Languages，单条 */
  preferredLanguages: string;
  /** Canonical，每行一条 */
  canonical: string;
  /** Policy，每行一条 */
  policy: string;
  /** CSAF，每行一条 */
  csaf: string;
}

/** 空白表单 */
export function createEmptyForm(): SecurityTxtForm {
  return {
    contacts: '',
    expires: '',
    encryption: '',
    acknowledgments: '',
    preferredLanguages: '',
    canonical: '',
    policy: '',
    csaf: '',
  };
}

/** 示例表单（「填充示例」按钮使用） */
export const SAMPLE_FORM: SecurityTxtForm = {
  contacts: 'mailto:security@example.com\nhttps://example.com/security',
  expires: '2027-12-31T23:59:59.000Z',
  encryption: 'https://example.com/pgp-key.txt',
  acknowledgments: 'https://example.com/hall-of-fame',
  preferredLanguages: 'en, zh-CN',
  canonical: 'https://example.com/.well-known/security.txt',
  policy: 'https://example.com/reporting-policy',
  csaf: 'https://example.com/.well-known/csaf/provider-metadata.json',
};

/** 解析模式默认载入的样例 security.txt（RFC 9116 合法示例） */
export const DEFAULT_SAMPLE_INPUT = [
  'Contact: mailto:security@example.com',
  'Contact: https://example.com/security',
  'Expires: 2027-12-31T23:59:59.000Z',
  'Preferred-Languages: en, zh-CN',
  'Canonical: https://example.com/.well-known/security.txt',
].join('\r\n');
