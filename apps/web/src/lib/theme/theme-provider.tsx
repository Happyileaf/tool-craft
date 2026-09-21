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
  DARK_CLASS_NAME,
  THEME_STORAGE_KEY,
  ThemeModeEnum,
} from './constants';

/**
 * 实际生效的主题，system 模式解析后只可能为浅色或深色
 */
type ResolvedTheme = 'light' | 'dark';

/**
 * 主题上下文对外暴露的能力
 */
interface ThemeContextValue {
  /** 用户选择的主题模式 */
  themeMode: ThemeModeEnum;
  /** 解析系统偏好后的实际主题 */
  resolvedTheme: ResolvedTheme;
  /**
   * 设置主题模式
   *
   * @param mode - 目标主题模式
   */
  setThemeMode: (mode: ThemeModeEnum) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 读取本地持久化的主题模式，非法值回退为跟随系统
 *
 * @returns 本地存储中的主题模式
 */
function getStoredThemeMode() {
  if (typeof window === 'undefined') return ThemeModeEnum.SYSTEM;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  const isValid = Object.values(ThemeModeEnum).includes(
    stored as ThemeModeEnum,
  );
  return isValid ? (stored as ThemeModeEnum) : ThemeModeEnum.SYSTEM;
}

/**
 * 主题提供者，负责持久化主题模式、监听系统偏好并同步根元素类名
 *
 * @param props - 组件属性
 * @param props.children - 需要消费主题上下文的子节点
 * @returns 包裹子节点的主题上下文提供者
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeModeEnum>(
    ThemeModeEnum.SYSTEM,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    setThemeModeState(getStoredThemeMode());
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemPrefersDark(mediaQuery.matches);
    };
    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const nextResolved: ResolvedTheme =
      themeMode === ThemeModeEnum.SYSTEM
        ? systemPrefersDark
          ? 'dark'
          : 'light'
        : themeMode;
    setResolvedTheme(nextResolved);
    const root = document.documentElement;
    root.classList.toggle(DARK_CLASS_NAME, nextResolved === 'dark');
  }, [themeMode, systemPrefersDark]);

  const setThemeMode = useCallback((mode: ThemeModeEnum) => {
    setThemeModeState(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode }),
    [themeMode, resolvedTheme, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * 获取主题上下文，必须在 ThemeProvider 内部调用
 *
 * @returns 主题模式、实际主题与切换方法
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
