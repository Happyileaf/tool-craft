import type { HeaderKind } from './utils/negotiation';

/** 各头类型的中文标签 */
export const KIND_LABELS: Record<HeaderKind, string> = {
  accept: 'Accept',
  'accept-language': 'Accept-Language',
  'accept-encoding': 'Accept-Encoding',
  'accept-charset': 'Accept-Charset',
};

/** 头类型切换顺序 */
export const KIND_ORDER: HeaderKind[] = [
  'accept',
  'accept-language',
  'accept-encoding',
  'accept-charset',
];

/** 每种头类型的默认样例输入，切换类型时载入 */
export const DEFAULT_SAMPLES: Record<HeaderKind, string> = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/*;q=0.8,*/*;q=0.7',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7',
  'accept-encoding': 'gzip, deflate, br;q=0.9,*;q=0.5',
  'accept-charset': 'utf-8, iso-8859-1;q=0.5',
};

export const HINT =
  '粘贴 HTTP 内容协商请求头（Accept / Accept-Language / Accept-Encoding / Accept-Charset），按 RFC 9110 §12.5 的 q 值权重与具体度解析排序，输出首选表示。全部在浏览器本地完成。';
