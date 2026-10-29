/**
 * robots.txt 生成与校验纯函数，不依赖 DOM 与 React。
 * 每组规则输出 User-agent / Allow / Disallow / Crawl-delay 指令，
 * 组间空行分隔，Sitemap 指令统一输出在末尾。
 */

/** 一条规则组（文本字段按行分隔多个值） */
export interface RobotsGroup {
  /** 组件内使用的唯一标识 */
  id: number;
  /** User-agent 列表，每行一个（支持 * 通配） */
  agents: string;
  /** Allow 路径列表，每行一条 */
  allow: string;
  /** Disallow 路径列表，每行一条 */
  disallow: string;
  /** 可选抓取间隔（秒），空字符串表示不输出 */
  crawlDelay: string;
}

/** 校验结果 */
export interface RobotsValidation {
  /** 全部问题，按出现顺序排列；为空表示校验通过 */
  errors: string[];
}

/**
 * 将多行文本拆分为值数组：按行拆分，去除逐行首尾空白，丢弃空行
 *
 * @param text - 原始多行文本
 * @returns 字符串数组
 */
export function splitEntries(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/**
 * 校验所有规则组与 Sitemap。
 * 检查项：每组至少一个 User-agent；路径必须以 / 开头；
 * Crawl-delay 必须是非负数字；Sitemap 必须是 http(s) URL。
 *
 * @param groups - 规则组
 * @param sitemaps - Sitemap 多行文本
 * @returns 校验结果
 */
export function validateRobots(groups: RobotsGroup[], sitemaps: string): RobotsValidation {
  const errors: string[] = [];
  let groupIndex = 0;

  for (const group of groups) {
    const agents = splitEntries(group.agents);
    const allow = splitEntries(group.allow);
    const disallow = splitEntries(group.disallow);
    const hasDelay = group.crawlDelay.trim() !== '';
    const isEmptyGroup =
      agents.length === 0 && allow.length === 0 && disallow.length === 0 && !hasDelay;

    if (!isEmptyGroup && agents.length === 0) {
      errors.push(`第 ${groupIndex + 1} 组：缺少 User-agent`);
    }

    for (const path of [...allow, ...disallow]) {
      if (!path.startsWith('/')) {
        errors.push(`第 ${groupIndex + 1} 组：路径「${path}」必须以 / 开头`);
      }
    }

    if (hasDelay) {
      const value = Number(group.crawlDelay.trim());
      if (!Number.isFinite(value) || value < 0) {
        errors.push(`第 ${groupIndex + 1} 组：Crawl-delay「${group.crawlDelay.trim()}」必须是非负数字`);
      }
    }

    groupIndex += 1;
  }

  for (const url of splitEntries(sitemaps)) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      errors.push(`Sitemap「${url}」必须是合法的 http(s) URL`);
      continue;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.push(`Sitemap「${url}」必须以 http:// 或 https:// 开头`);
    }
  }

  return { errors };
}

/**
 * 生成 robots.txt 文本。
 * 全空规则组或缺少 User-agent 的组跳过；非法路径指令跳过；
 * 规则组在前，组间空行分隔，Sitemap 指令输出在末尾。
 *
 * @param groups - 规则组
 * @param sitemaps - Sitemap 多行文本
 * @returns robots.txt 文本；无任何有效内容时返回空字符串
 */
export function generateRobotsTxt(groups: RobotsGroup[], sitemaps: string): string {
  const blocks: string[] = [];

  for (const group of groups) {
    const agents = splitEntries(group.agents);
    if (agents.length === 0) {
      continue;
    }
    const lines: string[] = [];
    for (const agent of agents) {
      lines.push(`User-agent: ${agent}`);
    }
    for (const path of splitEntries(group.allow)) {
      if (path.startsWith('/')) {
        lines.push(`Allow: ${path}`);
      }
    }
    for (const path of splitEntries(group.disallow)) {
      if (path.startsWith('/')) {
        lines.push(`Disallow: ${path}`);
      }
    }
    const delay = group.crawlDelay.trim();
    if (delay !== '') {
      lines.push(`Crawl-delay: ${delay}`);
    }
    blocks.push(lines.join('\n'));
  }

  for (const url of splitEntries(sitemaps)) {
    if (/^https?:\/\//.test(url)) {
      blocks.push(`Sitemap: ${url}`);
    }
  }

  return blocks.join('\n\n');
}
