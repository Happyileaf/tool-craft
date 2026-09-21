'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LANGUAGE_STORAGE_KEY,
  LanguageEnum,
  LanguageHtmlLangMap,
  LanguageOptions,
  type LanguageOption,
} from './constants';
import { en } from './dictionaries/en';
import { zh, type Dictionary } from './dictionaries/zh';

/**
 * 翻译时允许传入的占位符参数类型
 */
type TranslateParams = Record<string, string | number>;

/**
 * 国际化上下文对外暴露的能力
 */
interface I18nContextValue {
  /** 当前生效的界面语言 */
  language: LanguageEnum;
  /** 可供切换控件渲染的语言选项集合 */
  languageOptions: LanguageOption[];
  /**
   * 设置界面语言并持久化到本地存储
   *
   * @param language - 目标语言
   */
  setLanguage: (language: LanguageEnum) => void;
  /**
   * 按点分路径读取文案，并使用传入参数替换花括号占位符
   *
   * @param key - 形如 hub.totalTools 的点分文案路径
   * @param params - 占位符参数集合
   * @returns 插值后的文案；路径不存在时返回原始键名
   */
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * 各语言对应的字典数据源
 */
const dictionaries: Record<LanguageEnum, Dictionary> = {
  [LanguageEnum.ZH]: zh,
  [LanguageEnum.EN]: en,
};

/**
 * 读取本地持久化的语言偏好，非法值回退为简体中文
 *
 * @returns 本地存储中的语言
 */
function getStoredLanguage() {
  if (typeof window === 'undefined') return LanguageEnum.ZH;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return Object.values(LanguageEnum).includes(stored as LanguageEnum)
    ? (stored as LanguageEnum)
    : LanguageEnum.ZH;
}

/**
 * 根据浏览器首选语言推断默认语言偏好
 *
 * @returns 推断出的语言
 */
function getBrowserLanguage() {
  if (typeof navigator === 'undefined') return LanguageEnum.ZH;
  return navigator.language.toLowerCase().startsWith('zh')
    ? LanguageEnum.ZH
    : LanguageEnum.EN;
}

/**
 * 按点分路径在字典中读取字符串文案
 *
 * @param dictionary - 目标字典
 * @param key - 点分文案路径
 * @returns 命中的字符串文案；不存在时返回 undefined
 */
function getDictionaryValue(dictionary: Dictionary, key: string) {
  const pathSegments = key.split('.');
  let current: unknown = dictionary;
  for (const segment of pathSegments) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * 国际化提供者，负责语言偏好的初始化、持久化与文案翻译
 *
 * @param props - 组件属性
 * @param props.children - 需要消费国际化上下文的子节点
 * @returns 包裹子节点的国际化上下文提供者
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageEnum>(LanguageEnum.ZH);

  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(
      stored === LanguageEnum.ZH &&
        !window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
        ? getBrowserLanguage()
        : stored,
    );
  }, []);

  useEffect(() => {
    document.documentElement.lang = LanguageHtmlLangMap[language];
  }, [language]);

  const setLanguage = useCallback((nextLanguage: LanguageEnum) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const dictionary = dictionaries[language];
      let text = getDictionaryValue(dictionary, key);
      if (text === undefined) {
        text = getDictionaryValue(dictionaries[LanguageEnum.ZH], key);
      }
      if (text === undefined) {
        return key;
      }
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(
            new RegExp(`\\{${paramKey}\\}`, 'g'),
            String(paramValue),
          );
        }
      }
      return text;
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, languageOptions: LanguageOptions, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 获取国际化上下文，必须在 I18nProvider 内部调用
 *
 * @returns 当前语言、语言选项、切换方法与翻译函数
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
