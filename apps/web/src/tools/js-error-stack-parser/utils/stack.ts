/**
 * JavaScript Error.stack 多方言解析（零新增依赖，纯字符串规则）
 *
 * 覆盖三种引擎格式：
 * - V8（Chrome / Node / Electron）：`    at func (file:line:col)` / `    at file:line:col`
 * - SpiderMonkey（Firefox）：`func@file:line:col`
 * - JavaScriptCore（Safari）：`func@file:line:col` 或 `eval code` / `native code` 帧
 *
 * 无法识别的行保留在 raw 并标记 unparsed，绝不丢弃。
 */

export type StackEngine = 'v8' | 'firefox' | 'jsc' | 'unknown';

/** 单帧标志位 */
export interface StackFlags {
  /** 异步帧（async 前缀 / processTicksAndRejections 等钩子） */
  async: boolean;
  /** 构造调用（new Func） */
  constructor: boolean;
  /** eval 代码帧（含 eval at 嵌套） */
  eval: boolean;
  /** native code 帧，无文件位置 */
  native: boolean;
  /** node: 内置模块帧 */
  nodeInternal: boolean;
  /** node_modules 第三方帧 */
  nodeModules: boolean;
  /** 本行未能按已知语法解析 */
  unparsed: boolean;
}

/** 统一帧结构 */
export interface StackFrame {
  /** 从 0 开始的帧序号（含未解析帧） */
  index: number;
  /** 函数名，匿名统一为 <anonymous> */
  functionName: string;
  /** 原始文件 / URL 描述，native/eval 无位置时为 null */
  file: string | null;
  line: number | null;
  column: number | null;
  flags: StackFlags;
  /** 原始行文本 */
  raw: string;
}

/** 错误头 */
export interface ErrorHeader {
  /** 错误名，如 TypeError；无法判定为 null */
  name: string | null;
  /** 错误消息全文 */
  message: string;
}

/** 完整解析结果 */
export interface StackParseResult {
  engine: StackEngine;
  header: ErrorHeader | null;
  /** 错误头之外的附加消息行（Caused by / cause 链等） */
  extraMessages: string[];
  frames: StackFrame[];
  /** 第一个非 node:/native 帧的序号，全部为内置时为 null */
  firstUserFrameIndex: number | null;
}

const ANONYMOUS = '<anonymous>';

function emptyFlags(): StackFlags {
  return {
    async: false,
    constructor: false,
    eval: false,
    native: false,
    nodeInternal: false,
    nodeModules: false,
    unparsed: false,
  };
}

/** 从文件描述末尾回溯切分 line:col，容忍 URL 中的冒号与括号 */
function splitLocation(
  location: string,
): { file: string | null; line: number | null; column: number | null } {
  const text = location.trim();
  // 从右向左找最后两个数字段：file:line:col 或 file:line
  const match = text.match(/^(.*):(\d+):(\d+)$/) ?? text.match(/^(.*):(\d+)$/);
  if (!match) {
    return { file: text || null, line: null, column: null };
  }
  const file = (match[1] as string).trim();
  const line = Number(match[2]);
  const column = match[3] !== undefined ? Number(match[3]) : null;
  return {
    file: file || null,
    line: Number.isInteger(line) && line >= 0 ? line : null,
    column: column !== null && Number.isInteger(column) && column >= 0 ? column : null,
  };
}

/** 根据文件描述填充 node 内置 / node_modules / eval 标志 */
function applyFileFlags(flags: StackFlags, file: string | null, raw: string): void {
  if (!file) {
    return;
  }
  if (file.startsWith('node:') || file.startsWith('internal/')) {
    flags.nodeInternal = true;
  }
  if (file.includes('/node_modules/') || file.includes('node_modules\\')) {
    flags.nodeModules = true;
  }
  if (/eval code/i.test(raw) || file.startsWith('eval') || /\beval\b/.test(raw)) {
    flags.eval = true;
  }
}

/**
 * 解析 V8 帧。
 * 形如：
 *   at foo (file:10:20)
 *   at Object.<anonymous> (file:3:5)
 *   at file:1:1（匿名）
 *   at async foo (file:1:2)
 *   at new Foo (file:1:2)
 *   at eval (eval at foo (file:1:2), file:3:4)
 *   at Array.forEach (native)
 */
function parseV8Frame(raw: string, index: number): StackFrame {
  const flags = emptyFlags();
  const body = raw.replace(/^\s+at\s+/, '').trim();

  if (/^async\s+/.test(body)) {
    flags.async = true;
  }
  let rest = body.replace(/^async\s+/, '');

  // native code：at Foo (native) / at Foo (native code)
  if (/\((?:native|native code)\)\s*$/i.test(rest)) {
    const funcPart = rest.replace(/\s*\((?:native|native code)\)\s*$/i, '').trim();
    flags.native = true;
    if (/processTicksAndRejections|processTimers|tickObject/.test(funcPart)) {
      flags.async = true;
      flags.nodeInternal = true;
    }
    return {
      index,
      functionName: funcPart || ANONYMOUS,
      file: null,
      line: null,
      column: null,
      flags,
      raw,
    };
  }

  // 带括号：func (location)；注意 eval at 嵌套的内层括号
  const parenMatch = rest.match(/^(.+?)\s+\((.*)\)$/);
  if (parenMatch) {
    let funcPart = (parenMatch[1] as string).trim();
    const location = parenMatch[2] as string;
    if (/^new\s+/.test(funcPart)) {
      flags.constructor = true;
      funcPart = funcPart.replace(/^new\s+/, '');
    }
    if (/eval at\s/.test(location) || /^eval\b/.test(funcPart)) {
      flags.eval = true;
    }
    // eval at foo (inner), outer:line:col —— 取外层位置
    const outerMatch = location.match(/,\s*(.*:\d+:\d+)\s*$/);
    const { file, line, column } = splitLocation(outerMatch ? (outerMatch[1] as string) : location);
    applyFileFlags(flags, file, raw);
    if (funcPart === 'eval') {
      flags.eval = true;
    }
    return { index, functionName: funcPart || ANONYMOUS, file, line, column, flags, raw };
  }

  // 无括号：整体即位置（匿名帧） at /app/x.js:1:1
  if (/:(\d+)(?::(\d+))?$/.test(rest)) {
    const { file, line, column } = splitLocation(rest);
    applyFileFlags(flags, file, raw);
    return { index, functionName: ANONYMOUS, file, line, column, flags, raw };
  }

  // 兜底：未识别
  flags.unparsed = true;
  return { index, functionName: ANONYMOUS, file: null, line: null, column: null, flags, raw };
}

/**
 * 解析 Firefox / JSC 帧：`func@file:line:col`。
 * Safari 还可能出现 `eval code`、`native code` 行内描述。
 */
function parseAtFrame(raw: string, index: number, engine: StackEngine): StackFrame {
  const flags = emptyFlags();
  const trimmed = raw.trim();

  if (/native code/i.test(trimmed)) {
    flags.native = true;
    const funcPart = trimmed.split('@')[0]?.replace(/\s*native code.*/i, '').trim() ?? '';
    return {
      index,
      functionName: funcPart || ANONYMOUS,
      file: null,
      line: null,
      column: null,
      flags,
      raw,
    };
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex < 0) {
    flags.unparsed = true;
    return { index, functionName: ANONYMOUS, file: null, line: null, column: null, flags, raw };
  }
  const funcPart = trimmed.slice(0, atIndex).trim();
  const location = trimmed.slice(atIndex + 1).trim();

  if (engine === 'jsc' && /eval code/i.test(trimmed)) {
    flags.eval = true;
  }
  const { file, line, column } = splitLocation(location);
  applyFileFlags(flags, file, raw);
  return {
    index,
    functionName: funcPart || ANONYMOUS,
    file,
    line,
    column,
    flags,
    raw,
  };
}

/** 依据帧特征自动识别引擎 */
export function detectEngine(lines: string[]): StackEngine {
  let v8Hits = 0;
  let atHits = 0;
  let jscHits = 0;
  for (const line of lines) {
    if (/^\s+at\s+/.test(line)) {
      v8Hits += 1;
    } else if (/@.*:\d+:\d+/.test(line) && !/^\s+at\s+/.test(line)) {
      atHits += 1;
    }
    if (/(eval code|native code|_*\[native code\]_*)/i.test(line)) {
      jscHits += 1;
    }
  }
  if (v8Hits > 0 && v8Hits >= atHits) {
    return 'v8';
  }
  if (atHits > 0) {
    // JSC 与 Firefox 同为 @ 语法；eval/native code 行内特征指向 JSC
    return jscHits > 0 ? 'jsc' : 'firefox';
  }
  return 'unknown';
}

const ERROR_NAME_PATTERN = /^([A-Za-z_$][\w$]*(?:Error|Exception)?)\s*:/;

/** 解析入口 */
export function parseStack(input: string, forcedEngine?: StackEngine): StackParseResult {
  const lines = input.split(/\r\n|\n|\r/);
  const autoEngine = detectEngine(lines);
  const engine = forcedEngine && forcedEngine !== 'unknown' ? forcedEngine : autoEngine;

  const frames: StackFrame[] = [];
  const extraMessages: string[] = [];
  let header: ErrorHeader | null = null;
  let frameIndex = 0;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }

    const isV8Frame = /^\s*at\s+/.test(rawLine);
    const isAtFrame = /@/.test(line) && /:\d+(:\d+)?/.test(line) && !isV8Frame;
    const isNativeJsc = engine === 'jsc' && /(eval code|native code)/i.test(line);

    if (isV8Frame || (engine === 'v8' && isAtFrame === false && isV8Frame)) {
      frames.push(parseV8Frame(rawLine, frameIndex));
      frameIndex += 1;
      return;
    }
    if ((engine === 'firefox' || engine === 'jsc') && (isAtFrame || isNativeJsc)) {
      frames.push(parseAtFrame(rawLine, frameIndex, engine));
      frameIndex += 1;
      return;
    }
    // 引擎未知时按形态兜底尝试
    if (engine === 'unknown') {
      if (isV8Frame) {
        frames.push(parseV8Frame(rawLine, frameIndex));
        frameIndex += 1;
        return;
      }
      if (isAtFrame) {
        frames.push(parseAtFrame(rawLine, frameIndex, 'firefox'));
        frameIndex += 1;
        return;
      }
    }

    // 非帧文本：首条作为错误头，其余进附加消息（Caused by 等）
    if (!header) {
      const nameMatch = line.match(ERROR_NAME_PATTERN);
      if (nameMatch) {
        const name = nameMatch[1] as string;
        header = { name, message: line.slice(name.length + 1).trim() };
      } else {
        header = { name: null, message: line };
      }
    } else {
      extraMessages.push(line);
    }
  });

  // 重新连续编号（未解析帧也占号）
  frames.forEach((frame, index) => {
    frame.index = index;
  });

  const firstUserFrameIndex =
    frames.findIndex((frame) => !frame.flags.nodeInternal && !frame.flags.native && !frame.flags.unparsed && frame.file !== null) ??
    -1;

  return {
    engine,
    header,
    extraMessages,
    frames,
    firstUserFrameIndex: firstUserFrameIndex >= 0 ? firstUserFrameIndex : null,
  };
}

export interface FrameFilterOptions {
  hideNodeInternal?: boolean;
  hideNodeModules?: boolean;
  hideNative?: boolean;
  /** 仅看用户代码：同时排除 node:、node_modules、native、unparsed */
  userOnly?: boolean;
  keyword?: string;
}

/** 帧过滤（纯函数，不修改原数组） */
export function filterFrames(frames: StackFrame[], options: FrameFilterOptions): StackFrame[] {
  const keyword = options.keyword?.trim().toLowerCase();
  return frames.filter((frame) => {
    if (options.userOnly) {
      if (frame.flags.nodeInternal || frame.flags.nodeModules || frame.flags.native || frame.flags.unparsed) {
        return false;
      }
    }
    if (options.hideNodeInternal && frame.flags.nodeInternal) return false;
    if (options.hideNodeModules && frame.flags.nodeModules) return false;
    if (options.hideNative && frame.flags.native) return false;
    if (keyword) {
      const haystack = `${frame.functionName} ${frame.file ?? ''}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

/** 序列化为固定字段的 JSON 字符串（可被 JSON.parse 还原） */
export function serializeResult(result: StackParseResult): string {
  return JSON.stringify(
    {
      engine: result.engine,
      header: result.header,
      extraMessages: result.extraMessages,
      firstUserFrameIndex: result.firstUserFrameIndex,
      frames: result.frames.map((frame) => ({
        index: frame.index,
        functionName: frame.functionName,
        file: frame.file,
        line: frame.line,
        column: frame.column,
        flags: frame.flags,
        raw: frame.raw,
      })),
    },
    null,
    2,
  );
}
