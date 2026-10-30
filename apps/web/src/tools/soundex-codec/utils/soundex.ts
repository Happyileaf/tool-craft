/**
 * American Soundex 读音编码（零依赖纯函数）
 *
 * 规则（经典 US Census / NARA 版本）：
 * 1. 保留首字母（大写），其余字母按读音映射为数字：
 *    B/F/P/V→1，C/G/J/K/Q/S/X/Z→2，D/T→3，L→4，M/N→5，R→6；
 * 2. 相邻同音字母只编码一次；被 H/W 分隔的两个同音字母也只编码一次，
 *    被元音（A/E/I/O/U，含 Y）分隔则分别编码；
 * 3. 结果固定为首字母 + 3 位数字，不足补 0，超出截断。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

/** 辅音字母 → Soundex 数字；元音返回 0（起分隔作用），H/W 返回 -1（忽略且不重置） */
const LETTER_CODE: Record<string, number> = {
  B: 1,
  F: 1,
  P: 1,
  V: 1,
  C: 2,
  G: 2,
  J: 2,
  K: 2,
  Q: 2,
  S: 2,
  X: 2,
  Z: 2,
  D: 3,
  T: 3,
  L: 4,
  M: 5,
  N: 5,
  R: 6,
};

/** 起分隔作用的元音（经典实现中 Y 与 A/E/I/O/U 同样重置同音合并） */
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

export interface SoundexStep {
  /** 字符在词中的下标（0 = 首字母） */
  index: number;
  /** 当前处理的字符（大写） */
  char: string;
  /** 该字符的处理依据 */
  reason: string;
  /** 处理后当前累积编码 */
  codeAfter: string;
}

export interface SoundexResult {
  /** 规范化后的单词（大写、仅字母） */
  word: string;
  /** 4 位 Soundex 编码 */
  code: string;
  steps: SoundexStep[];
  valid: boolean;
  error: string | null;
}

/** 单个单词编码，返回逐字符推导步骤 */
export function encodeWord(input: string): SoundexResult {
  const word = input.toUpperCase().replace(/[^A-Z]/g, '');
  if (word.length === 0) {
    return { word: '', code: '', steps: [], valid: false, error: '不包含任何字母' };
  }

  const first = word[0]!;
  let code = first;
  let prevCode = LETTER_CODE[first] ?? 0;
  const steps: SoundexStep[] = [
    {
      index: 0,
      char: first,
      reason: `首字母「${first}」原样保留${prevCode > 0 ? `（同音码 ${prevCode}，参与后续合并判断）` : '（元音，同音码重置）'}`,
      codeAfter: code,
    },
  ];

  for (let index = 1; index < word.length; index += 1) {
    const char = word[index]!;
    let reason: string;

    if (VOWELS.has(char)) {
      prevCode = 0;
      reason = `元音「${char}」不编码，并作为分隔符重置同音合并`;
    } else if (char === 'H' || char === 'W') {
      reason = `「${char}」不编码，且不隔断两侧同音字母（同音码保持 ${prevCode}）`;
    } else {
      const digit = LETTER_CODE[char]!;
      if (digit === prevCode) {
        reason = `「${char}」读音码 ${digit} 与前一辅音相同（相邻或仅隔 H/W），合并跳过`;
      } else {
        code += String(digit);
        reason = `「${char}」读音码 ${digit}，追加到编码`;
      }
      prevCode = digit;
    }

    steps.push({ index, char, reason, codeAfter: code.length > 4 ? `${code}（将截断）` : code });
  }

  let finalReason: string;
  if (code.length >= 4) {
    code = code.slice(0, 4);
    finalReason = '编码达到 1 位字母 + 3 位数字，截断到 4 位';
  } else {
    const padded = '000'.slice(code.length - 1);
    code += padded;
    finalReason = `不足 4 位，末尾补 0（补 ${padded.length} 个）`;
  }
  steps.push({ index: word.length, char: '—', reason: finalReason, codeAfter: code });

  return { word, code, steps, valid: true, error: null };
}

export interface BatchResult {
  /** 与输入行对齐的输出：每个 token 一个编码，空行保留 */
  output: string;
  /** 逐行的可读错误 */
  warnings: string[];
  /** 同音分组：编码 → 该编码下的单词（首次出现顺序） */
  groups: Array<{ code: string; words: string[] }>;
}

/**
 * 多行批量编码：以空白拆分每行的单词，每个单词输出一个 4 位编码；
 * 非法 token（无字母）原样保留并逐行告警；同时按编码聚合同音分组。
 */
export function processLines(input: string): BatchResult {
  const warnings: string[] = [];
  const groupMap = new Map<string, string[]>();
  const outputLines = input.split('\n').map((line, lineIndex) => {
    if (line.trim() === '') return '';
    return line
      .trim()
      .split(/\s+/)
      .map((token) => {
        const result = encodeWord(token);
        if (!result.valid) {
          warnings.push(`第 ${lineIndex + 1} 行：「${token}」${result.error}`);
          return token;
        }
        const bucket = groupMap.get(result.code);
        if (bucket) {
          if (!bucket.includes(result.word)) bucket.push(result.word);
        } else {
          groupMap.set(result.code, [result.word]);
        }
        return result.code;
      })
      .join(' ');
  });

  return {
    output: outputLines.join('\n'),
    warnings,
    groups: Array.from(groupMap, ([code, words]) => ({ code, words })).sort((a, b) =>
      a.code.localeCompare(b.code),
    ),
  };
}
