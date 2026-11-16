/**
 * JavaScript 错误堆栈（Error.stack）多方言解析纯函数。
 *
 * 支持三种引擎方言：
 *  - V8（Chrome / Node.js / Electron）：`    at func (file:line:col)`
 *  - Firefox（SpiderMonkey）：`func@file:line:col`（列号可缺省）
 *  - Safari（JavaScriptCore）：`func@file:line:col`，可能含 `(eval)` / `(native code)`
 * 纯字符串与正则解析，零依赖；所有解析在浏览器本地完成。
 */

export type StackDialect = 'v8' | 'firefox' | 'safari' | 'unknown';

/** 统一帧结构 */
export interface StackFrame {
  /** 函数名，匿名帧为 `<anonymous>`；无法解析的怪行为 null */
  functionName: string | null;
  /** 文件 / URL 原文（保留 file://、node:、Windows 反斜杠与查询串），无位置信息时为 null */
  filePath: string | null;
  line: number | null;
  column: number | null;
  isAsync: boolean;
  isEval: boolean;
  /** native code 帧（无文件位置） */
  isNative: boolean;
  /** node:internal 等 Node 内置模块帧 */
  isInternal: boolean;
  /** node_modules 内的帧 */
  isNodeModules: boolean;
  /** 未能识别的原始行 */
  unparsed: boolean;
  /** 原始堆栈行 */
  raw: string;
}

export interface ParsedStack {
  /** 错误名，无法判定时为 null */
  name: string | null;
  /** 错误 message（多行已合并） */
  message: string;
  dialect: StackDialect;
  frames: StackFrame[];
  /** 非阻断提示（如未识别任何帧、存在无法解析的行） */
  warnings: string[];
}

export class StackParseError extends Error {}

const ANONYMOUS = '<anonymous>';

/**
 * 从尾部切分 `path:line:col`。
 * Windows 盘符 `C:` 后的冒号后不是数字，不会被误切；查询串保留在 path 中。
 */
function splitLocation(suffix: string): {
  filePath: string | null;
  line: number | null;
  column: number | null;
} {
  const trimmed = suffix.trim();
  const match = /^(.*?):(\d+)(?::(\d+))?$/.exec(trimmed);
  if (!match) {
    return { filePath: trimmed || null, line: null, column: null };
  }
  const filePath = match[1] || null;
  const line = Number(match[2]);
  const column = match[3] !== undefined ? Number(match[3]) : null;
  return { filePath, line, column };
}

function buildFlags(filePath: string | null): Pick<StackFrame, 'isInternal' | 'isNodeModules'> {
  return {
    isInternal: filePath !== null && filePath.startsWith('node:'),
    isNodeModules: filePath !== null && filePath.includes('node_modules'),
  };
}

/**
 * 解析单个 V8 帧行，失败返回 null。
 * 形如：
 *   at func (path:l:c) / at path:l:c / at async func (path:l:c)
 *   at Constructor.new ctor (path:l:c)
 *   at eval (eval at origin (eval位置), 位置:l:c)
 *   at func (native code)
 */
function parseV8Frame(rawLine: string): StackFrame | null {
  const line = rawLine.trim();
  if (!line.startsWith('at ')) {
    return null;
  }
  let body = line.slice(3).trim();
  const isAsync = body.startsWith('async ');
  if (isAsync) {
    body = body.slice(6).trim();
  }

  // eval 帧：at eval (eval at <origin> (<pos>), <pos>:l:c)
  const evalMatch = /^eval \s*\(eval at (.+)\)$/.exec(body);
  if (evalMatch) {
    const inner = evalMatch[1] ?? '';
    const lastComma = inner.lastIndexOf(', ');
    const locationPart = lastComma === -1 ? inner : inner.slice(lastComma + 2);
    const { filePath, line: lineNo, column } = splitLocation(locationPart);
    return {
      functionName: 'eval',
      filePath,
      line: lineNo,
      column,
      isAsync,
      isEval: true,
      isNative: false,
      ...buildFlags(filePath),
      unparsed: false,
      raw: rawLine,
    };
  }

  // native code：at func (native code) / at Array.forEach (native)
  if (/\(native(?: code)?\)\s*$/.test(body)) {
    const func = body.replace(/\s*\(native(?: code)?\)\s*$/, '').trim();
    return {
      functionName: func || ANONYMOUS,
      filePath: null,
      line: null,
      column: null,
      isAsync,
      isEval: false,
      isNative: true,
      isInternal: false,
      isNodeModules: false,
      unparsed: false,
      raw: rawLine,
    };
  }

  // 带括号：func (location)
  const parenMatch = /^(.+?)\s+\((.+)\)$/.exec(body);
  if (parenMatch) {
    const func = (parenMatch[1] ?? '').trim() || ANONYMOUS;
    const { filePath, line: lineNo, column } = splitLocation(parenMatch[2] ?? '');
    return {
      functionName: func,
      filePath,
      line: lineNo,
      column,
      isAsync,
      isEval: func === 'eval' || filePath?.includes('eval') === true,
      isNative: false,
      ...buildFlags(filePath),
      unparsed: false,
      raw: rawLine,
    };
  }

  // 无括号匿名帧：at path:line:col
  const bare = splitLocation(body);
  if (bare.filePath !== null && /[/\\]/.test(bare.filePath) === false && bare.line === null) {
    return null;
  }
  if (bare.filePath === null && bare.line === null) {
    return null;
  }
  return {
    functionName: ANONYMOUS,
    filePath: bare.filePath,
    line: bare.line,
    column: bare.column,
    isAsync,
    isEval: bare.filePath?.includes('eval') === true,
    isNative: false,
    ...buildFlags(bare.filePath),
    unparsed: false,
    raw: rawLine,
  };
}

/**
 * 解析 Firefox / Safari 风格帧：`func@location` 或 `@location`。
 * 以最后一个 `@` 切分（函数名内可能含 @ 的概率极低，位置部分不含 @）。
 */
function parseAtFrame(rawLine: string, dialect: 'firefox' | 'safari'): StackFrame | null {
  const line = rawLine.trim();
  if (!line.includes('@')) {
    return null;
  }
  const atIndex = line.lastIndexOf('@');
  const func = line.slice(0, atIndex).trim();
  let location = line.slice(atIndex + 1).trim();
  if (!location) {
    return null;
  }

  const isNative = /^(?:\[?native code\]?)$/i.test(location);
  const isEval = /\(eval\)/i.test(location) || /^eval/i.test(location);
  // Safari 形如 path:line:col (eval)，剥离尾部 eval 标注再切位置
  location = location.replace(/\s*\(eval\)\s*$/i, '');

  if (isNative) {
    return {
      functionName: func || ANONYMOUS,
      filePath: null,
      line: null,
      column: null,
      isAsync: false,
      isEval,
      isNative: true,
      isInternal: false,
      isNodeModules: false,
      unparsed: false,
      raw: rawLine,
    };
  }

  const { filePath, line: lineNo, column } = splitLocation(location);
  if (filePath === null && lineNo === null) {
    return null;
  }
  return {
    functionName: func || ANONYMOUS,
    filePath,
    line: lineNo,
    column,
    isAsync: false,
    isEval,
    isNative: false,
    ...buildFlags(filePath),
    unparsed: false,
    raw: rawLine,
  };
}

/** 按帧特征投票做方言自动探测 */
function detectDialect(lines: string[]): StackDialect {
  let v8 = 0;
  let firefox = 0;
  let safariMarker = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (parseV8Frame(line)) {
      v8 += 1;
      continue;
    }
    if (line.includes('@')) {
      if (/\(eval\)|\[native code\]|\(native code\)|eval code/i.test(line)) {
        safariMarker += 1;
      } else {
        firefox += 1;
      }
    } else if (/eval code/i.test(line)) {
      safariMarker += 1;
    }
  }
  if (v8 === 0 && firefox === 0 && safariMarker === 0) {
    return 'unknown';
  }
  // V8 帧特征最明确；无 V8 帧时，出现 JSC 专属标记（eval code / [native code] / (eval)）判 Safari
  if (v8 > 0 && v8 >= firefox) {
    return 'v8';
  }
  if (safariMarker > 0) {
    return 'safari';
  }
  return 'firefox';
}

/** 首行形如 `ErrorName: message` 时拆名（仅在第一个冒号拆分，message 可含冒号） */
function splitHeader(firstLine: string): { name: string | null; message: string } {
  const match = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*):\s?([\s\S]*)$/.exec(firstLine);
  if (match) {
    return { name: match[1] ?? null, message: match[2] ?? '' };
  }
  return { name: null, message: firstLine };
}

/**
 * 解析完整堆栈文本。
 * @param input 原始 Error.stack 文本
 * @param dialectHint 手动指定方言，默认 'unknown' 自动探测
 */
export function parseErrorStack(
  input: string,
  dialectHint: StackDialect = 'unknown',
): ParsedStack {
  if (!input || !input.trim()) {
    throw new StackParseError('堆栈内容为空，请粘贴 Error.stack 文本');
  }

  const rawLines = input.split(/\r?\n/);
  const dialect = dialectHint === 'unknown' ? detectDialect(rawLines) : dialectHint;
  const warnings: string[] = [];

  const frames: StackFrame[] = [];
  const messageLines: string[] = [];
  let headerParsed = false;
  let sawFrame = false;
  let name: string | null = null;

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      continue;
    }
    let frame: StackFrame | null = null;
    if (dialect === 'v8') {
      frame = parseV8Frame(rawLine);
    } else if (dialect === 'firefox') {
      frame = parseAtFrame(rawLine, 'firefox') ?? parseV8Frame(rawLine);
    } else if (dialect === 'safari') {
      frame = parseAtFrame(rawLine, 'safari') ?? parseV8Frame(rawLine);
    } else {
      frame = parseV8Frame(rawLine) ?? parseAtFrame(rawLine, 'firefox');
    }

    if (frame) {
      frames.push(frame);
      sawFrame = true;
      continue;
    }

    if (sawFrame) {
      // 首帧之后出现的怪行不丢弃，保留为 unparsed 帧
      frames.push({
        functionName: null,
        filePath: null,
        line: null,
        column: null,
        isAsync: false,
        isEval: /eval/i.test(rawLine),
        isNative: /native code/i.test(rawLine),
        isInternal: false,
        isNodeModules: false,
        unparsed: true,
        raw: rawLine,
      });
      continue;
    }

    // 首帧之前的非帧行：首行作为错误头，其余并入多行 message
    if (!headerParsed) {
      const header = splitHeader(rawLine.trim());
      name = header.name;
      messageLines.push(header.message);
      headerParsed = true;
    } else {
      messageLines.push(rawLine.trim());
    }
  }

  if (frames.length === 0) {
    warnings.push('未识别到任何堆栈帧，已保留原始文本于 message');
  }
  const unparsedCount = frames.filter((frame) => frame.unparsed).length;
  if (unparsedCount > 0) {
    warnings.push(`${unparsedCount} 行无法解析，已保留在 raw 字段并标记 unparsed`);
  }

  return {
    name,
    message: messageLines.join('\n'),
    dialect,
    frames,
    warnings,
  };
}

/** 序列化为可复制的 JSON 文本 */
export function stackToJson(result: ParsedStack): string {
  return JSON.stringify(result, null, 2);
}
