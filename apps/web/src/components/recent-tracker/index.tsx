'use client';

import { useEffect } from 'react';
import { addRecentTool } from '@/lib/recent';

/**
 * 最近使用记录组件属性
 */
interface RecentTrackerProps {
  /** 当前访问的工具短标识，挂载后写入本地存储的最近使用列表 */
  slug: string;
}

/**
 * 最近使用访问记录器，在工具详情页挂载时将当前工具写入本地存储，自身不渲染任何界面
 *
 * @param props - 组件属性
 * @param props.slug - 当前访问的工具短标识
 * @returns 始终返回 null，不产生可见节点
 */
function RecentTracker({ slug }: RecentTrackerProps) {
  useEffect(() => {
    addRecentTool(slug);
  }, [slug]);

  return null;
}

export default RecentTracker;
