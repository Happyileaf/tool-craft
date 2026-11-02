/**
 * Cache-Control 头逐 token 解析（RFC 9111 第 5.2 节）
 */

import { NUMERIC_RESPONSE_DIRECTIVES, REQUEST_DIRECTIVES, RESPONSE_DIRECTIVES } from '../constants';

/** 单个解析后的 Cache-Control 指令 */
export interface Directive {
  /** 指令名（小写） */
  name: string;
  /** 指令原始字符串值；无参数为 null */
  value: string | null;
  /** 数值型指令解析出的数字；非数值或无参数为 null */
  numericValue: number | null;
  /** 是否为已知指令（请求/响应指令表中存在） */
  known: boolean;
}

/** 解析结果 */
export interface ParseResult {
  directives: Directive[];
  /** 解析过程中的告警（重复、冲突、非法值等） */
  warnings: string[];
}

/**
 * 解析 Cache-Control 头字段值
 *
 * @param raw - 原始头值（如 `public, max-age=604800, immutable`）
 * @param side - 响应头或请求头，决定指令的「已知」判定
 */
export function parseCacheControl(raw: string, side: 'response' | 'request' = 'response'): ParseResult {
  const directives: Directive[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { directives, warnings };
  }

  const knownSet = side === 'response' ? RESPONSE_DIRECTIVES : REQUEST_DIRECTIVES;
  const tokens = raw.split(',');

  tokens.forEach((token, index) => {
    const trimmed = token.trim();
    if (trimmed.length === 0) {
      return;
    }
    const eqIndex = trimmed.indexOf('=');
    let name = trimmed;
    let rawValue: string | null = null;
    if (eqIndex !== -1) {
      name = trimmed.slice(0, eqIndex).trim();
      rawValue = trimmed.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, '$1');
    }
    name = name.toLowerCase();

    if (name.length === 0) {
      warnings.push(`第 ${index + 1} 个 token "${trimmed}" 缺少指令名，已忽略`);
      return;
    }

    let numericValue: number | null = null;
    if (rawValue !== null) {
      if (NUMERIC_RESPONSE_DIRECTIVES.has(name) || name === 'max-stale' || name === 'min-fresh') {
        const parsed = Number(rawValue);
        if (rawValue === '' || !Number.isFinite(parsed) || parsed < 0) {
          warnings.push(`指令 ${name} 的值 "${rawValue}" 不是合法的非负整数秒，按 0 处理`);
          numericValue = 0;
        } else {
          numericValue = Math.floor(parsed);
        }
      }
    } else if (NUMERIC_RESPONSE_DIRECTIVES.has(name) && name !== 'no-cache') {
      // 数值型指令缺失参数
      if (name === 'stale-while-revalidate' || name === 'stale-if-error') {
        warnings.push(`指令 ${name} 缺少秒数参数，已忽略其数值含义`);
      } else {
        warnings.push(`指令 ${name} 缺少 "=秒数" 参数，按 0 处理`);
        numericValue = 0;
      }
    }

    if (!knownSet.has(name)) {
      warnings.push(`未知指令 "${name}"：${side === 'response' ? '响应' : '请求'}端标准未定义，将原样透传但不参与缓存计算`);
    }

    const count = seen.get(name) ?? 0;
    if (count > 0) {
      warnings.push(`指令 ${name} 出现了 ${count + 1} 次：重复出现时以第一次为准（RFC 9111）`);
    }
    seen.set(name, count + 1);

    directives.push({ name, value: rawValue, numericValue, known: knownSet.has(name) });
  });

  detectConflicts(directives, warnings);
  return { directives, warnings };
}

/** 按指令名取首个匹配指令 */
export function findDirective(directives: Directive[], name: string): Directive | undefined {
  return directives.find((directive) => directive.name === name);
}

/** 是否存在某个指令 */
export function hasDirective(directives: Directive[], name: string): boolean {
  return directives.some((directive) => directive.name === name);
}

/** 冲突与互斥关系检查 */
function detectConflicts(directives: Directive[], warnings: string[]): void {
  if (hasDirective(directives, 'no-store')) {
    if (hasDirective(directives, 'max-age') || hasDirective(directives, 's-maxage')) {
      warnings.push('no-store 与 max-age/s-maxage 同时出现：no-store 优先，缓存不得存储该响应');
    }
    if (hasDirective(directives, 'immutable')) {
      warnings.push('no-store 与 immutable 语义冲突：响应不会被存储，immutable 无意义');
    }
  }
  if (hasDirective(directives, 'public') && directives.some((d) => d.name === 'private')) {
    warnings.push('public 与 private 同时出现：二者互斥，实际效果取决于具体缓存实现，建议只保留其一');
  }
  if (hasDirective(directives, 'must-revalidate') && hasDirective(directives, 'immutable')) {
    warnings.push('must-revalidate 与 immutable 同时出现：immutable 仅在新鲜期内有效，过期后仍须重新验证');
  }
}
