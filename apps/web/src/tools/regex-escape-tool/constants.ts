/** 可选的 RegExp flags（按字母序，符合规范要求） */
export const REGEX_FLAG_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'd', label: 'd', hint: '生成匹配结果的索引信息（hasIndices）' },
  { value: 'g', label: 'g', hint: '全局匹配（global）' },
  { value: 'i', label: 'i', hint: '忽略大小写（ignoreCase）' },
  { value: 'm', label: 'm', hint: '多行模式（multiline）' },
  { value: 's', label: 's', hint: '允许 . 匹配换行（dotAll）' },
  { value: 'u', label: 'u', hint: 'Unicode 模式（unicode）' },
  { value: 'v', label: 'v', hint: '增强 Unicode 模式（unicodeSets）' },
  { value: 'y', label: 'y', hint: '粘性匹配（sticky）' },
];

/** 输入区示例文本 */
export const SAMPLE_INPUT = 'C:\\tools\\v2\\file.txt (v1.0)? price: $5.00';

/** 工具支持转义的元字符清单（用于说明区展示） */
export const META_CHARACTERS = ['\\', '^', '$', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|', '/', '-'];
