/**
 * 文本硬换行（hard wrap）与反向还原（unwrap）零依赖纯函数
 *
 * 折行规则：
 * - 段落以空行（连续换行）分隔，折行在段落内部进行，段落边界保留
 * - 拉丁等按空格分词的文字按词边界贪心折行，尽量不切断单词
 * - CJK / 全角等无空格文字按字符折行，每个字符可独立成行
 * - 长度超过列宽且不含空格的单词，默认原样溢出，breakLongWords 开启时按列宽硬切
 *
 * 还原规则：段落内的单个换行合并（CJK 字符边界不加空格，其余以单空格连接），
 * 段落之间的空行保留。本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type WrapMode = 'wrap' | 'unwrap';

export interface WrapOptions {
  /** 目标列宽（每行最大显示宽度，按码元计数），需为 >= 1 的整数 */
  width: number;
  /** 超长单词是否按列宽硬切（false 时保留在同一行并溢出列宽） */
  breakLongWords: boolean;
  /** 是否去除每行尾部空白 */
  trimTrailingWhitespace: boolean;
}

export interface WrapResult {
  output: string;
  /** 输出总行数（不含末尾空行） */
  lineCount: number;
  /** 输出最长行的实际宽度 */
  maxLineWidth: number;
  /** 识别到的段落数 */
  paragraphCount: number;
  valid: boolean;
  error: string | null;
}

/** 判断字符是否为 CJK / 全角类字符：这类字符之间不靠空格分词，可在任意字符间断行 */
function isCjk(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x2e80 && code <= 0x9fff) || // CJK 部首、康熙、中日韩统一表意文字
    (code >= 0xac00 && code <= 0xd7a3) || // 韩文音节
    (code >= 0xf900 && code <= 0xfaff) || // CJK 兼容表意文字
    (code >= 0xfe30 && code <= 0xfe4f) || // CJK 兼容符号
    (code >= 0xff00 && code <= 0xffef) || // 全角 ASCII / 半角假名
    (code >= 0x3000 && code <= 0x303f) || // CJK 符号与标点
    (code >= 0x3040 && code <= 0x30ff) // 平假名 / 片假名
  );
}

/** 判断字符是否为空白（不含换行，换行在分段阶段处理） */
function isSpace(char: string): boolean {
  return /[^\S\n]/.test(char);
}

interface Token {
  text: string;
  /** CJK 单字 token 与相邻 token 之间不插入空格 */
  cjk: boolean;
}

/** 将一个段落切分为 token：CJK 逐字切分，其余按空白切词 */
function tokenize(paragraph: string): Token[] {
  const tokens: Token[] = [];
  let word = '';
  const flushWord = () => {
    if (word !== '') {
      tokens.push({ text: word, cjk: false });
      word = '';
    }
  };
  for (const char of paragraph) {
    if (isCjk(char)) {
      flushWord();
      tokens.push({ text: char, cjk: true });
    } else if (isSpace(char)) {
      flushWord();
    } else {
      word += char;
    }
  }
  flushWord();
  return tokens;
}

/** 两个相邻 token 在同一行拼接时使用的连接串（CJK 之间无空格） */
function joinGap(prev: Token, next: Token): string {
  return prev.cjk && next.cjk ? '' : ' ';
}

function appendLine(lines: string[], line: string, trimTrailing: boolean): void {
  lines.push(trimTrailing ? line.replace(/\s+$/, '') : line);
}

/** 单个段落按列宽折行 */
function wrapParagraph(paragraph: string, options: WrapOptions): string {
  const { width, breakLongWords, trimTrailingWhitespace } = options;
  const tokens = tokenize(paragraph);
  if (tokens.length === 0) return '';

  const lines: string[] = [];
  let line = '';
  let lastOnLine: Token | null = null;
  const pushLine = () => {
    appendLine(lines, line, trimTrailingWhitespace);
    line = '';
    lastOnLine = null;
  };

  for (const token of tokens) {
    if (line === '') {
      line = token.text;
    } else {
      const gap = joinGap(lastOnLine ?? token, token);
      if (line.length + gap.length + token.text.length <= width) {
        line += gap + token.text;
      } else {
        pushLine();
        line = token.text;
      }
    }
    lastOnLine = token;

    // 单个 token 自身超宽：非 CJK 长词按开关决定是否硬切；CJK 单字不会超宽
    while (line.length > width) {
      if (!breakLongWords || token.cjk) break;
      lines.push(line.slice(0, width));
      line = line.slice(width);
      lastOnLine = { text: line, cjk: false };
    }
  }
  if (line !== '' || lines.length === 0) pushLine();
  return lines.join('\n');
}

/** 按空行切分段落，保留段落内部的换行与空白原样 */
function splitParagraphs(input: string): string[] {
  return input.split(/\n[ \t]*\n/);
}

/** 折行入口 */
export function hardWrap(input: string, options: WrapOptions): WrapResult {
  if (!Number.isInteger(options.width) || options.width < 1) {
    return {
      output: '',
      lineCount: 0,
      maxLineWidth: 0,
      paragraphCount: 0,
      valid: false,
      error: '列宽必须为大于等于 1 的整数',
    };
  }
  const paragraphs = splitParagraphs(input);
  const wrapped = paragraphs.map((paragraph) => wrapParagraph(paragraph, options));
  const output = wrapped.join('\n\n');
  return buildResult(output, paragraphs.length, true, null);
}

/** 还原：段落内换行合并，段落间空行保留 */
export function unwrapText(input: string, trimTrailingWhitespace: boolean): WrapResult {
  const paragraphs = splitParagraphs(input);
  const restored = paragraphs.map((paragraph) => {
    const lines = paragraph.split('\n');
    let merged = '';
    lines.forEach((rawLine, index) => {
      const line = trimTrailingWhitespace ? rawLine.replace(/\s+$/, '') : rawLine;
      if (index === 0) {
        merged = line;
        return;
      }
      if (merged === '' || line === '') {
        merged += line;
        return;
      }
      const lastChar = merged[merged.length - 1] ?? '';
      const firstChar = line[0] ?? '';
      const noGap = isCjk(lastChar) && isCjk(firstChar);
      merged += noGap ? line : ` ${line}`;
    });
    return merged;
  });
  const output = restored.join('\n\n');
  return buildResult(output, paragraphs.length, true, null);
}

function buildResult(output: string, paragraphCount: number, valid: boolean, error: string | null): WrapResult {
  const lines = output.split('\n');
  return {
    output,
    lineCount: lines.length,
    maxLineWidth: lines.reduce((max, line) => Math.max(max, line.length), 0),
    paragraphCount,
    valid,
    error,
  };
}

/** 统一入口：按模式分发 */
export function processText(input: string, mode: WrapMode, options: WrapOptions): WrapResult {
  if (input.trim() === '') {
    return {
      output: '',
      lineCount: 0,
      maxLineWidth: 0,
      paragraphCount: 0,
      valid: false,
      error: '内容不能为空',
    };
  }
  if (mode === 'wrap') {
    return hardWrap(input, options);
  }
  return unwrapText(input, options.trimTrailingWhitespace);
}
