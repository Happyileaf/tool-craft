'use client';

import { useCallback, useEffect, useState } from 'react';
import { RECENT_MAX_COUNT, RECENT_STORAGE_KEY } from './constants';
import {
  readStorageJson,
  removeStorageValue,
  writeStorageJson,
} from './utils';

/**
 * 一条近期使用足迹记录
 */
export interface RecentRecord {
  /** 工具的唯一短标识 */
  slug: string;
  /** 最近一次访问时间的毫秒时间戳 */
  visitedAt: number;
}

/**
 * 足迹列表发生变化时派发的自定义事件名
 */
export const RECENT_CHANGE_EVENT = 'toolcraft-recent-change';

/**
 * 解析本地存储中的足迹记录，非法数据按空列表处理
 *
 * @returns 按访问时间由新到旧排列的足迹记录
 */
function getStoredRecentRecords() {
  const stored = readStorageJson<unknown>(RECENT_STORAGE_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (item): item is RecentRecord =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as RecentRecord).slug === 'string' &&
      typeof (item as RecentRecord).visitedAt === 'number',
  );
}

/**
 * 近期使用足迹 Hook，仅在足迹记录开启时写入
 *
 * @returns 足迹记录列表、记录访问与清空足迹的方法
 */
export function useRecent() {
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);

  useEffect(() => {
    setRecentRecords(getStoredRecentRecords());
  }, []);

  useEffect(() => {
    const handleRecentChange = () => {
      setRecentRecords(getStoredRecentRecords());
    };
    window.addEventListener(RECENT_CHANGE_EVENT, handleRecentChange);
    return () =>
      window.removeEventListener(RECENT_CHANGE_EVENT, handleRecentChange);
  }, []);

  const persistRecentRecords = useCallback(
    (nextRecords: RecentRecord[]) => {
      setRecentRecords(nextRecords);
      writeStorageJson(RECENT_STORAGE_KEY, nextRecords);
      window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
    },
    [],
  );

  const recordRecentVisit = useCallback(
    (slug: string) => {
      const nextRecords = [
        { slug, visitedAt: Date.now() },
        ...recentRecords.filter((record) => record.slug !== slug),
      ].slice(0, RECENT_MAX_COUNT);
      persistRecentRecords(nextRecords);
    },
    [recentRecords, persistRecentRecords],
  );

  const clearRecentRecords = useCallback(() => {
    removeStorageValue(RECENT_STORAGE_KEY);
    setRecentRecords([]);
    window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
  }, []);

  return { recentRecords, recordRecentVisit, clearRecentRecords };
}
