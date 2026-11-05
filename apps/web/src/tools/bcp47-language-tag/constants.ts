/** BCP 47 语言标签解析器常量 */

/** 快捷示例标签 */
export const SAMPLE_TAGS: { label: string; value: string }[] = [
  { label: 'zh-Hans-CN', value: 'zh-Hans-CN' },
  { label: 'zh-Hans-CN-u-ca-chinese-nu-hans', value: 'zh-Hans-CN-u-ca-chinese-nu-hans' },
  { label: 'en-US', value: 'en-US' },
  { label: 'en-GB-oed（grandfathered）', value: 'en-GB-oed' },
  { label: 'ja-JP-u-ca-japanese', value: 'ja-JP-u-ca-japanese' },
  { label: 'de-DE-u-co-phonebk', value: 'de-DE-u-co-phonebk' },
  { label: 'x-private（纯私有）', value: 'x-private' },
  { label: 'en_US（非法下划线）', value: 'en_US' },
];

/** 输入框占位提示 */
export const INPUT_PLACEHOLDER = '输入 BCP 47 语言标签，如 zh-Hans-CN-u-ca-chinese-nu-hans';
