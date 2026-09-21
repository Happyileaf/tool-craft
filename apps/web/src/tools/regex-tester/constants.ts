/**
 * 正则修饰符枚举
 */
export enum RegexFlagEnum {
  /** 全局匹配 */
  GLOBAL = 'g',
  /** 忽略大小写 */
  IGNORE_CASE = 'i',
  /** 多行模式 */
  MULTILINE = 'm',
}

/**
 * 修饰符对应的国际化文案键，键为修饰符枚举值，值为点分文案路径
 */
export const RegexFlagLabelKeyMap: Record<RegexFlagEnum, string> = {
  /** 全局匹配文案键 */
  [RegexFlagEnum.GLOBAL]: 'tools.regex.flagGlobal',
  /** 忽略大小写文案键 */
  [RegexFlagEnum.IGNORE_CASE]: 'tools.regex.flagIgnoreCase',
  /** 多行模式文案键 */
  [RegexFlagEnum.MULTILINE]: 'tools.regex.flagMultiline',
};

/**
 * 预设规则结构
 */
export interface RegexPreset {
  /** 预设对应的国际化文案键 */
  labelKey: string;
  /** 点击后填入的正则表达式 */
  pattern: string;
}

/**
 * 常用正则预设集合，顺序与字典中的预设文案保持一致
 */
export const REGEX_PRESETS: RegexPreset[] = [
  {
    labelKey: 'tools.regex.presetEmail',
    pattern:
      '([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)',
  },
  {
    labelKey: 'tools.regex.presetPhone',
    pattern: '1[3-9]\\d{9}',
  },
  {
    labelKey: 'tools.regex.presetUrl',
    pattern:
      'https?:\\/\\/[\\w\\-\\.]+(:[0-9]+)?(/[\\w\\-\\.\\/\\?\\%\\&\\=]*)?',
  },
  {
    labelKey: 'tools.regex.presetIpv4',
    pattern: '(?:[0-9]{1,3}\\.){3}[0-9]{1,3}',
  },
  {
    labelKey: 'tools.regex.presetDate',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
  },
  {
    labelKey: 'tools.regex.presetChinese',
    pattern: '[\\u4e00-\\u9fa5]+',
  },
];

/**
 * 单次匹配最多保留的结果数量，避免超长文本渲染卡顿
 */
export const MAX_MATCH_COUNT = 200;

/**
 * 工具首次载入时填入的默认正则表达式
 */
export const DEFAULT_PATTERN =
  '([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)';

/**
 * 工具首次载入时填入的默认测试文本
 */
export const DEFAULT_TEST_TEXT = `欢迎体验 ToolCraft 在线工具箱！
您可以联系我们的支持团队：contact@toolcraft.dev，或者提交反馈至 help_service@gmail.com。
无效格式测试：invalid@@domain, user@domain..com, alex.design@studio.io`;
