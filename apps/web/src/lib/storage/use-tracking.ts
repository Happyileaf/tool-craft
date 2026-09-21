'use client';

import { useCallback, useEffect, useState } from 'react';
import { TRACKING_STORAGE_KEY } from './constants';
import { readStorageJson, writeStorageJson } from './utils';

/**
 * 足迹记录开关发生变化时派发的自定义事件名
 */
export const TRACKING_CHANGE_EVENT = 'toolcraft-tracking-change';

/**
 * 足迹记录开关 Hook，默认关闭，需用户显式开启
 *
 * @returns 足迹记录是否开启与切换方法
 */
export function useTracking() {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);

  useEffect(() => {
    setIsTrackingEnabled(readStorageJson<boolean>(TRACKING_STORAGE_KEY) === true);
  }, []);

  useEffect(() => {
    const handleTrackingChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setIsTrackingEnabled(customEvent.detail === true);
    };
    window.addEventListener(TRACKING_CHANGE_EVENT, handleTrackingChange);
    return () =>
      window.removeEventListener(TRACKING_CHANGE_EVENT, handleTrackingChange);
  }, []);

  const setTrackingEnabled = useCallback((enabled: boolean) => {
    setIsTrackingEnabled(enabled);
    writeStorageJson(TRACKING_STORAGE_KEY, enabled);
    window.dispatchEvent(
      new CustomEvent<boolean>(TRACKING_CHANGE_EVENT, { detail: enabled }),
    );
  }, []);

  return { isTrackingEnabled, setTrackingEnabled };
}
