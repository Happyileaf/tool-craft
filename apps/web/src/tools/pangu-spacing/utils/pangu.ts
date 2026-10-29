/**
 * 盘古之白：中英文混排自动留白与反向移除的纯函数实现
 * 规则参考 pangu.js（https://github.com/vinta/pangu.js）
 * 围栏代码块、行内代码与 URL 内部不做处理，仅在它们与正文的边界补/删空格
 */

/** 处理结果 */
export interface PanguResult {
  /** 处理后的文本 */
  output: string;
  /** 插入或移除的空格数量 */
  changed: number;
}

/** 片段类型 */
type SegmentType = 'text' | 'fence' | 'inline' | 'url';

/** 文本片段：普通文本或受保护片段（代码、URL） */
interface Segment {
  /** 片段类型 */
  type: SegmentType;
  /** 片段内容 */
  text: string;
}

/** 汉字与 CJK 表意文字（含扩展 A、兼容区），不含 CJK 标点 */
const HAN = '\\u2e80-\\u2eff\\u2f00-\\u2fdf\\u3400-\\u4dbf\\u4e01-\\u9fff\\uf900-\\ufaff';
/** 日文假名与韩文音节 */
const KANA = '\\u3040-\\u309f\\u30a0-\\u30ff\\u3100-\\u312f\\u3200-\\u32ff';
/** 参与留白的 CJK 字符：汉字/假名 + 全角形式（含全角逗号冒号），排除 U+3000-303F 句读标点 */
const CJK = `${HAN}${KANA}\\uff00-\\uffef`;
/** 半角字母、数字及紧邻的常见符号 */
const LATIN = 'A-Za-z0-9%';

const IS_CJK = new RegExp(`^[${CJK}]$`);
const IS_LATIN = new RegExp(`^[${LATIN}]$`);

/** CJK 后直接跟半角字母数字 */
const CJK_LATIN_NO_SPACE = new RegExp(`([${CJK}])([${LATIN}])`, 'g');
/** 半角字母数字后直接跟 CJK */
const LATIN_CJK_NO_SPACE = new RegExp(`([${LATIN}])([${CJK}])`, 'g');
/** CJK 与半角字母数字之间的一个或多个空格/制表符 */
const CJK_LATIN_SPACES = new RegExp(`([${CJK}])[ \\t]+([${LATIN}])`, 'g');
const LATIN_CJK_SPACES = new RegExp(`([${LATIN}])[ \\t]+([${CJK}])`, 'g');

/** 围栏代码块：``` 或 ~~~ 起始，到同型闭合围栏或文本末尾 */
const FENCED_CODE = /(?:^|\n)[ \t]{0,3}(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]{0,3}(?:`{3,}|~{3,})[^\n]*)?(?=\n|$)/g;
/** 行内代码：`...`（不跨行） */
const INLINE_CODE = /`[^`\n]+`/g;
/** URL：http(s)/ftp/www. 开头，遇到空白、CJK 字符或常见后置标点即终止 */
const URL_STOP = `\\s，。；：、）」』】》〕${HAN}${KANA}\\uff00-\\uffef`;
const URL_PATTERN = new RegExp(`(?:https?:\\/\\/|ftp:\\/\\/|www\\.)[^${URL_STOP}]+`, 'g');

/**
 * 把文本切成带类型的片段，代码与 URL 标记为受保护类型
 */
function segmentize(text: string): Segment[] {
  const patternSpecs: { type: Exclude<SegmentType, 'text'>; regex: RegExp }[] = [
    { type: 'fence', regex: FENCED_CODE },
    { type: 'inline', regex: INLINE_CODE },
    { type: 'url', regex: URL_PATTERN },
  ];

  const segments: Segment[] = [];
  let index = 0;
  let guard = 0;

  const append = (type: SegmentType, value: string): void => {
    if (!value) {
      return;
    }
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      last.text += value;
    } else {
      segments.push({ type, text: value });
    }
  };

  while (index < text.length && guard < 100000) {
    guard += 1;
    let earliest: { index: number; length: number; type: Exclude<SegmentType, 'text'> } | null = null;
    for (const spec of patternSpecs) {
      const regex = new RegExp(spec.regex.source, spec.regex.flags);
      regex.lastIndex = index;
      const match = regex.exec(text);
      if (match && match.index >= index && (earliest === null || match.index < earliest.index)) {
        earliest = { index: match.index, length: match[0].length, type: spec.type };
      }
    }
    if (!earliest) {
      append('text', text.slice(index));
      break;
    }
    append('text', text.slice(index, earliest.index));
    append(earliest.type, text.slice(earliest.index, earliest.index + earliest.length));
    index = earliest.index + earliest.length;
  }
  return segments;
}

/**
 * 取片段在指定侧参与留白判断的边界字符；受保护片段按类型决定
 */
function edgeChar(segment: Segment | undefined, side: 'start' | 'end'): string | undefined {
  if (!segment) {
    return undefined;
  }
  const text = segment.text;
  if (!text) {
    return undefined;
  }
  if (segment.type === 'fence') {
    return undefined;
  }
  if (segment.type === 'inline') {
    // 行内代码整体视为半角环境，剥去外层反引号后任意非空边界字符都参与留白
    const inner = text.replace(/^`|`$/g, '');
    if (!inner) {
      return undefined;
    }
    return side === 'start' ? inner.charAt(0) : inner.charAt(inner.length - 1);
  }
  const char = side === 'start' ? text.charAt(0) : text.charAt(text.length - 1);
  return IS_LATIN.test(char) ? char : undefined;
}

function isCjk(char: string | undefined): boolean {
  return char !== undefined && IS_CJK.test(char);
}

/**
 * 在中文与英文/数字边界自动插入一个空格
 */
export function addSpacing(input: string): PanguResult {
  if (!input) {
    return { output: input, changed: 0 };
  }
  const segments = segmentize(input);
  let changed = 0;

  segments.forEach((segment, i) => {
    if (segment.type === 'fence') {
      return;
    }
    if (segment.type === 'text') {
      const before = segment.text;
      segment.text = segment.text
        .replace(CJK_LATIN_NO_SPACE, '$1 $2')
        .replace(LATIN_CJK_NO_SPACE, '$1 $2');
      changed += segment.text.length - before.length;
      return;
    }

    // inline / url：仅在与相邻普通文本的 CJK 边界补空格
    const previous = segments[i - 1];
    const next = segments[i + 1];
    if (previous && previous.type === 'text') {
      const tail = previous.text.charAt(previous.text.length - 1);
      const head = edgeChar(segment, 'start');
      if (isCjk(tail) && head !== undefined) {
        previous.text += ' ';
        changed += 1;
      }
    }
    if (next && next.type === 'text') {
      const lead = next.text.charAt(0);
      const close = edgeChar(segment, 'end');
      if (isCjk(lead) && close !== undefined) {
        next.text = ` ${next.text}`;
        changed += 1;
      }
    }
  });

  return { output: segments.map((segment) => segment.text).join(''), changed };
}

/**
 * 移除中文与英文/数字之间多余的空格
 */
export function removeSpacing(input: string): PanguResult {
  if (!input) {
    return { output: input, changed: 0 };
  }
  const segments = segmentize(input);
  let changed = 0;

  for (const segment of segments) {
    if (segment.type !== 'text') {
      continue;
    }
    const before = segment.text;
    segment.text = segment.text
      .replace(CJK_LATIN_SPACES, '$1$2')
      .replace(LATIN_CJK_SPACES, '$1$2');
    changed += before.length - segment.text.length;
  }

  return { output: segments.map((segment) => segment.text).join(''), changed };
}
