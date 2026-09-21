'use client';

import { useCallback, useEffect, useState } from 'react';
import { FAVORITES_STORAGE_KEY } from './constants';
import {
  readStorageJson,
  removeStorageValue,
  writeStorageJson,
} from './utils';

/**
 * 收藏列表发生变化时派发的自定义事件名
 */
export const FAVORITES_CHANGE_EVENT = 'toolcraft-favorites-change';

/**
 * 解析本地存储中的收藏 slug 列表，非法数据按空列表处理
 *
 * @returns 收藏的工具 slug 列表
 */
function getStoredFavorites() {
  const stored = readStorageJson<unknown>(FAVORITES_STORAGE_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is string => typeof item === 'string');
}

/**
 * 收藏工具 Hook，收藏为用户显式行为，不依赖足迹记录开关
 *
 * @returns 收藏 slug 列表、切换收藏、判断是否收藏与清空收藏的方法
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  useEffect(() => {
    const handleFavoritesChange = () => {
      setFavorites(getStoredFavorites());
    };
    window.addEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange);
    return () =>
      window.removeEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange);
  }, []);

  const persistFavorites = useCallback((nextFavorites: string[]) => {
    setFavorites(nextFavorites);
    writeStorageJson(FAVORITES_STORAGE_KEY, nextFavorites);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  }, []);

  const toggleFavorite = useCallback(
    (slug: string) => {
      const nextFavorites = favorites.includes(slug)
        ? favorites.filter((item) => item !== slug)
        : [...favorites, slug];
      persistFavorites(nextFavorites);
    },
    [favorites, persistFavorites],
  );

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const clearFavorites = useCallback(() => {
    removeStorageValue(FAVORITES_STORAGE_KEY);
    setFavorites([]);
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  }, []);

  return { favorites, toggleFavorite, isFavorite, clearFavorites };
}
