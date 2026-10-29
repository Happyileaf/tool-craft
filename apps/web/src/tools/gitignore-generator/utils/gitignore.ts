/**
 * .gitignore 规则生成纯函数，不依赖 DOM 与 React。
 * 按模板分组顺序拼装带注释头的规则块，跨组与自定义规则全局去重，保持稳定输出顺序。
 */

import { TEMPLATE_GROUPS } from '../constants';

/**
 * 将多行文本拆分为规则数组：去除逐行首尾空白，丢弃空行
 *
 * @param text - 原始多行文本
 * @returns 规范化后的规则数组
 */
export function splitRules(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/**
 * 根据勾选的模板 key 与自定义规则生成 .gitignore 文本。
 * 输出按模板分组顺序排列，每组以 `# 组名` 注释开头；
 * 已在前面出现的规则（含自定义规则）被去重，顺序以首次出现为准。
 *
 * @param selectedKeys - 勾选的模板 key 数组
 * @param customRules - 自定义规则文本（每行一条）
 * @returns 生成的 .gitignore 文本；无任何规则时返回空字符串
 */
export function generateGitignore(selectedKeys: string[], customRules: string): string {
  const sections: string[] = [];
  const seen = new Set<string>();

  for (const group of TEMPLATE_GROUPS) {
    if (!selectedKeys.includes(group.key)) {
      continue;
    }
    const lines: string[] = [`# ${group.label}`];
    for (const rule of group.rules) {
      if (seen.has(rule)) {
        continue;
      }
      seen.add(rule);
      lines.push(rule);
    }
    sections.push(lines.join('\n'));
  }

  const custom = splitRules(customRules);
  if (custom.length > 0) {
    const lines: string[] = ['# Custom rules'];
    for (const rule of custom) {
      if (seen.has(rule)) {
        continue;
      }
      seen.add(rule);
      lines.push(rule);
    }
    if (lines.length > 1) {
      sections.push(lines.join('\n'));
    }
  }

  return sections.join('\n\n');
}
