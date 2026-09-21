'use client';

import { useEffect, useState } from 'react';
import { useRecent, useTracking } from '@/lib/storage';

/**
 * 最近使用记录组件属性
 */
interface RecentTrackerProps {
  /** 当前访问的工具短标识，挂载后按开关状态写入本地足迹 */
  slug: string;
}

/**
 * 最近使用访问记录器，在工具详情页挂载并在足迹记录开启时写入访问，自身不渲染任何界面
 *
 * @param props - 组件属性
 * @param props.slug - 当前访问的工具短标识
 * @returns 始终返回 null，不产生可见节点
 */
function RecentTracker({ slug }: RecentTrackerProps) {
  const { isTrackingEnabled } = useTracking();
  const { recordRecentVisit } = useRecent();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated && isTrackingEnabled) {
      recordRecentVisit(slug);
    }
  }, [slug, isTrackingEnabled, hasHydrated, recordRecentVisit]);

  return null;
}

export default RecentTracker;
