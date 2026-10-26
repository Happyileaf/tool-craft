/**
 * 数字区域化格式化工具内常量
 */

/** 格式化模式 */
export enum NumberFormatModeEnum {
  DECIMAL = 'decimal',
  CURRENCY = 'currency',
  PERCENT = 'percent',
}

/** 模式中文标签 */
export const NUMBER_FORMAT_MODE_LABELS: Record<NumberFormatModeEnum, string> = {
  [NumberFormatModeEnum.DECIMAL]: '数字',
  [NumberFormatModeEnum.CURRENCY]: '货币',
  [NumberFormatModeEnum.PERCENT]: '百分比',
};

/** 数字记法 */
export enum NotationEnum {
  STANDARD = 'standard',
  COMPACT = 'compact',
}

/** 记法中文标签 */
export const NOTATION_LABELS: Record<NotationEnum, string> = {
  [NotationEnum.STANDARD]: '标准',
  [NotationEnum.COMPACT]: '紧凑（1.2K / 1.2 万）',
};

/** 区域选项（locale，标签，示例分组风格） */
export interface LocaleOption {
  value: string;
  label: string;
}

/** 常用区域设置，值为 BCP 47 语言标签 */
export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: 'zh-CN', label: '中国大陆（zh-CN）' },
  { value: 'zh-TW', label: '繁体中文（zh-TW）' },
  { value: 'en-US', label: '英语 · 美国（en-US）' },
  { value: 'en-GB', label: '英语 · 英国（en-GB）' },
  { value: 'de-DE', label: '德语 · 德国（de-DE）' },
  { value: 'fr-FR', label: '法语 · 法国（fr-FR）' },
  { value: 'ja-JP', label: '日语（ja-JP）' },
  { value: 'hi-IN', label: '印地语 · 印度（hi-IN）' },
];

/** 常用货币（ISO 4217 代码 + 中文名称） */
export const COMMON_CURRENCIES: readonly LocaleOption[] = [
  { value: 'CNY', label: 'CNY · 人民币' },
  { value: 'USD', label: 'USD · 美元' },
  { value: 'EUR', label: 'EUR · 欧元' },
  { value: 'GBP', label: 'GBP · 英镑' },
  { value: 'JPY', label: 'JPY · 日元' },
  { value: 'HKD', label: 'HKD · 港币' },
  { value: 'TWD', label: 'TWD · 新台币' },
  { value: 'INR', label: 'INR · 印度卢比' },
];

/** 默认输入数值 */
export const DEFAULT_NUMBER = '1234567.895';

/** 默认勾选的区域 */
export const DEFAULT_SELECTED_LOCALES: readonly string[] = ['zh-CN', 'en-US', 'de-DE', 'ja-JP'];
