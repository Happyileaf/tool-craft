import type { FormField } from './utils/multipart';

/** boundary 固定前缀，模仿浏览器 WebKit 风格的分隔符 */
export const BOUNDARY_PREFIX = '----WebKitFormBoundary';

/** 允许同时编辑的字段数量上限 */
export const MAX_FIELDS = 200;

/** 默认目标请求 URL */
export const DEFAULT_URL = 'https://example.com/api/upload';

/** 构造页初始字段：两个普通文本字段 + 一个文件字段 */
export const DEFAULT_FIELDS: FormField[] = [
  {
    id: 'field-1',
    kind: 'text',
    name: 'title',
    value: 'hello',
  },
  {
    id: 'field-2',
    kind: 'text',
    name: 'tags',
    value: 'web',
  },
  {
    id: 'field-3',
    kind: 'file',
    name: 'report',
    value: '示例内容',
    filename: 'report.txt',
    contentType: 'text/plain',
  },
];
