import { MAX_MATCH_COUNT } from '../constants';

/**
 * 单条匹配结果
 */
export interface RegexMatchItem {
  /** 匹配到的完整文本 */
  match: string;
  /** 匹配起点在原文中的字符下标 */
  index: number;
  /** 各捕获组内容，未参与捕获时为空字符串 */
  groups: string[];
}

/**
 * 正则执行结果
 */
export interface RegexMatchResult {
  /** 正则表达式是否合法且执行完成 */
  success: boolean;
  /** 全部匹配条目 */
  matches: RegexMatchItem[];
  /** 正则语法错误时的原始错误信息 */
  errorMessage?: string;
  /** 命中数量是否已达到上限被截断 */
  truncated: boolean;
}

/**
 * 根据正则表达式、修饰符与测试文本执行匹配，自动处理零宽匹配可能导致的死循环，
 * 并将匹配数量限制在上限以内
 *
 * @param patternSource - 用户输入的正则表达式原文
 * @param flagString - 拼接后的修饰符串，如 "gim"
 * @param testText - 待测试的目标文本
 * @returns 包含匹配条目或语法错误的执行结果
 */
export function matchRegex(
  patternSource: string,
  flagString: string,
  testText: string,
): RegexMatchResult {
  if (patternSource.trim().length === 0) {
    return { success: true, matches: [], truncated: false };
  }
  try {
    const regex = new RegExp(patternSource, flagString);
    const matches: RegexMatchItem[] = [];
    let truncated = false;

    if (flagString.includes('g')) {
      let execution: RegExpExecArray | null;
      while ((execution = regex.exec(testText)) !== null) {
        matches.push({
          match: execution[0],
          index: execution.index,
          groups: execution.slice(1),
        });
        if (matches.length >= MAX_MATCH_COUNT) {
          truncated = true;
          break;
        }
        if (execution.index === regex.lastIndex) {
          regex.lastIndex += 1;
        }
      }
    } else {
      const execution = regex.exec(testText);
      if (execution) {
        matches.push({
          match: execution[0],
          index: execution.index,
          groups: execution.slice(1),
        });
      }
    }

    return { success: true, matches, truncated };
  } catch (error: unknown) {
    return {
      success: false,
      matches: [],
      truncated: false,
      errorMessage:
        error instanceof Error ? error.message : '正则表达式语法无效',
    };
  }
}

/**
 * 使用正则表达式执行文本替换，非全局模式下仅替换首个命中
 *
 * @param testText - 待处理的原文
 * @param patternSource - 正则表达式原文
 * @param flagString - 修饰符串
 * @param replacement - 替换文本，支持 $1 等捕获组引用
 * @returns 替换后的文本；正则非法时返回错误信息
 */
export function replaceWithRegex(
  testText: string,
  patternSource: string,
  flagString: string,
  replacement: string,
): RegexMatchResult & { output: string } {
  if (patternSource.trim().length === 0) {
    return {
      success: true,
      matches: [],
      truncated: false,
      output: testText,
    };
  }
  try {
    const regex = new RegExp(patternSource, flagString);
    return {
      success: true,
      matches: [],
      truncated: false,
      output: testText.replace(regex, replacement),
    };
  } catch (error: unknown) {
    return {
      success: false,
      matches: [],
      truncated: false,
      output: '',
      errorMessage:
        error instanceof Error ? error.message : '正则表达式语法无效',
    };
  }
}
