/**
 * 主题模式枚举
 */
export enum ThemeModeEnum {
  /** 浅色模式 */
  LIGHT = 'light',
  /** 深色模式 */
  DARK = 'dark',
  /** 跟随操作系统偏好 */
  SYSTEM = 'system',
}

/**
 * localStorage 中持久化主题模式使用的键名
 */
export const THEME_STORAGE_KEY = 'toolcraft-theme';

/**
 * 根元素上标识深色模式的类名
 */
export const DARK_CLASS_NAME = 'dark';
