import type { CapabilitySummary } from '@tool-craft/core';
import { createBrowserRegistry } from '@tool-craft/capabilities/browser';

/**
 * Web 端能力注册表单例
 *
 * 仅消费浏览器侧注册入口；image.resize 在此为 Canvas 实现，其 execute 只在
 * 客户端组件中调用，而 list() 返回的纯摘要数据可在服务端组件中安全使用
 */
const webRegistry = createBrowserRegistry();

/**
 * 能力域中文名映射
 * key 为能力 id 中第一个 '.' 之前的 domain 前缀，未登记的域回退展示原始前缀
 */
const DOMAIN_LABEL_MAP: Record<string, string> = {
  text: '文本',
  data: '数据',
  time: '时间',
  image: '图片',
};

/**
 * 按能力域分组的能力目录项
 */
interface CapabilityGroup {
  /** 能力域标识，取能力 id 中第一个 '.' 之前的部分，如 text / data / time / image */
  domain: string;
  /** 能力域中文名，用于分组标题展示 */
  domainLabel: string;
  /** 该域下的能力摘要列表，顺序与注册顺序一致 */
  capabilities: CapabilitySummary[];
}

/**
 * 获取按能力域分组的能力目录
 *
 * 分组顺序以各 domain 在注册表中首次出现的顺序为准，供首页渲染分组卡片网格
 *
 * @returns 能力分组数组
 */
function getCapabilityGroups(): CapabilityGroup[] {
  const groupMap = new Map<string, CapabilitySummary[]>();
  for (const summary of webRegistry.list()) {
    const domain = summary.id.split('.')[0] ?? summary.id;
    const groupCapabilities = groupMap.get(domain) ?? [];
    groupCapabilities.push(summary);
    groupMap.set(domain, groupCapabilities);
  }
  return Array.from(groupMap.entries()).map(([domain, capabilities]) => ({
    domain,
    domainLabel: DOMAIN_LABEL_MAP[domain] ?? domain,
    capabilities,
  }));
}

export { webRegistry, getCapabilityGroups, type CapabilityGroup };
