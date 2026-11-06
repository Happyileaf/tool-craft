/**
 * unicode-bcp47-lookup 工具的静态展示文案与参考数据。
 * 全部为本地常量，运行时不发起任何网络请求。
 */

export const TOOL_TITLE = 'BCP 47 语言标签解析器';

export const INPUT_PLACEHOLDER = '输入 BCP 47 语言标签，如 zh-Hans-CN、en-US-u-ca-gregory';

export const DATA_SOURCE_HINT =
  '解析规则依据 RFC 5646（Tags for Identifying Languages）ABNF 语法；常用子标签表为 ISO 639 / 15924 / 3166 / UN M.49 高频子集，全部内置于本地，无网络请求。';

/** 一键填入的示例标签 */
export const EXAMPLE_TAGS: { label: string; value: string }[] = [
  { label: '简体中文（中国）', value: 'zh-Hans-CN' },
  { label: '英语（美国）', value: 'en-US' },
  { label: '含 extlang 与繁体文字', value: 'zh-cmn-Hant-TW' },
  { label: 'Unicode 日历扩展', value: 'en-US-u-ca-gregory-co-phonebk' },
  { label: '多扩展 + 私有段', value: 'de-DE-a-foo-b-bar-x-custom' },
  { label: '数字区域代码', value: 'es-419' },
  { label: '遗留标签', value: 'i-klingon' },
];

/** 语法分段说明（用于底部速查卡片） */
export const SYNTAX_SECTIONS: { term: string; rule: string; example: string }[] = [
  { term: 'language', rule: '2–3 字母主语言（ISO 639），或 4 字母保留语 / 5–8 字母未注册语言', example: 'zh、en、cmn' },
  { term: 'extlang', rule: '可选，最多 3 个 3 字母扩展语言子标签，仅紧跟主语言', example: 'zh-cmn' },
  { term: 'script', rule: '可选，恰好 4 字母文字代码（ISO 15924），首字母大写', example: 'Hans、Hant、Latn' },
  { term: 'region', rule: '可选，2 字母国家 / 地区（ISO 3166）或 3 位数字（UN M.49）', example: 'CN、US、419' },
  { term: 'variant', rule: '可重复，5–8 字母数字；以数字开头时 4 字符即可', example: '1994、valencia' },
  { term: 'extension', rule: '单字母 / 单数字前缀 + 若干 2–8 字符子标签，前缀不可重复', example: 'u-ca-gregory' },
  { term: 'privateuse', rule: 'x- 前缀 + 1–8 字符子标签，可独立成标签或置于末尾', example: 'x-private' },
];

/** 结果字段中文标签 */
export const FIELD_LABELS = {
  canonical: '规范化标签（推荐大小写）',
  language: '主语言 language',
  extlangs: '扩展语言 extlang',
  script: '文字 script',
  region: '区域 region',
  variants: '变体 variant',
  extensions: '扩展 extension',
  privateUse: '私有使用 privateuse',
  grandfathered: '遗留标签 grandfathered',
  unicode: 'Unicode (u) 扩展',
} as const;
