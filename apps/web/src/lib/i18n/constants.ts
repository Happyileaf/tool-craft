/**
 * 界面语言枚举
 */
export enum LanguageEnum {
  /** 简体中文 */
  ZH = 'zh',
  /** 英文 */
  EN = 'en',
}

/**
 * localStorage 中持久化语言偏好使用的键名
 */
export const LANGUAGE_STORAGE_KEY = 'toolcraft-language';

/**
 * 语言本地化名称 Map，键为语言枚举值，值为该语言下展示的母语名称
 */
export const LanguageNativeLabelMap: Record<LanguageEnum, string> = {
  /** 简体中文 */
  [LanguageEnum.ZH]: '简体中文',
  /** 英文 */
  [LanguageEnum.EN]: 'English',
};

/**
 * 语言紧凑缩写 Map，键为语言枚举值，值为在窄空间控件中展示的短标识
 */
export const LanguageShortLabelMap: Record<LanguageEnum, string> = {
  /** 中文缩写 */
  [LanguageEnum.ZH]: '中',
  /** 英文缩写 */
  [LanguageEnum.EN]: 'EN',
};

/**
 * 语言对应的 html lang 属性值 Map
 */
export const LanguageHtmlLangMap: Record<LanguageEnum, string> = {
  /** 中文页面语言标识 */
  [LanguageEnum.ZH]: 'zh-CN',
  /** 英文页面语言标识 */
  [LanguageEnum.EN]: 'en',
};

/**
 * 语言选项数据结构，供语言切换控件渲染
 */
export interface LanguageOption {
  /** 语言枚举值 */
  value: LanguageEnum;
  /** 面向用户展示的语言名称 */
  label: string;
  /** 窄空间下展示的缩写 */
  shortLabel: string;
}

/**
 * 语言选项数据源，顺序与语言枚举定义顺序保持一致
 */
export const LanguageOptions: LanguageOption[] = Object.values(LanguageEnum).map(
  (value) => ({
    value,
    label: LanguageNativeLabelMap[value],
    shortLabel: LanguageShortLabelMap[value],
  }),
);
