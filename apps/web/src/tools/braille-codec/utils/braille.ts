/**
 * 盲文（Braille）点阵编解码（零依赖纯函数）
 *
 * 基于 Unicode Braille Patterns（U+2800–U+28FF）：
 * 盲文字符码位 = 0x2800 + 凸点位掩码，位与点号对应关系为
 * dot1=0x01, dot2=0x02, dot3=0x04, dot4=0x08,
 * dot5=0x10, dot6=0x20, dot7=0x40, dot8=0x80。
 *
 * 文本编码采用英文一级盲文（Grade 1）：字母 a–z 各有固定点位，
 * 数字 0–9 复用字母 a–j 的点位并以数字号 ⠼（dots 3,4,5,6）引导。
 */

/** 盲文模式区起始码位 */
export const BRAILLE_BASE = 0x2800;

/** 数字号（Number Sign）⠼，点位 3-4-5-6 */
export const NUMBER_SIGN = '\u283c';
/** 盲文空格 ⠀（无凸点） */
export const BRAILLE_SPACE = '\u2800';

/**
 * 点号到 Unicode 位掩码的映射（dot 1–8）
 */
const DOT_BIT: Record<number, number> = {
  1: 0x01,
  2: 0x02,
  3: 0x04,
  4: 0x08,
  5: 0x10,
  6: 0x20,
  7: 0x40,
  8: 0x80,
};

/**
 * 字母 a–z 的标准六点点位表
 */
const LETTER_DOTS: Record<string, number[]> = {
  a: [1],
  b: [1, 2],
  c: [1, 4],
  d: [1, 4, 5],
  e: [1, 5],
  f: [1, 2, 4],
  g: [1, 2, 4, 5],
  h: [1, 2, 5],
  i: [2, 4],
  j: [2, 4, 5],
  k: [1, 3],
  l: [1, 2, 3],
  m: [1, 3, 4],
  n: [1, 3, 4, 5],
  o: [1, 3],
  p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5],
  r: [1, 2, 3, 5],
  s: [2, 3, 4],
  t: [2, 3, 4, 5],
  u: [1, 3, 6],
  v: [1, 2, 3, 6],
  w: [2, 4, 5, 6],
  x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6],
  z: [1, 3, 5, 6],
};

/**
 * 常用标点的盲文点位（英文一级盲文常用集）
 */
const PUNCT_DOTS: Record<string, number[]> = {
  ',': [2],
  ';': [2, 3],
  ':': [2, 5],
  '.': [2, 5, 6],
  '!': [2, 3, 5],
  '?': [2, 3, 6],
  '-': [3, 6],
  "'": [3],
  '*': [3, 5],
  '/': [3, 4],
};

/** 数字 0–9 对应的字母（a–j） */
const DIGIT_LETTERS = 'abcdefghij';

export interface BrailleResult {
  /** 输出内容：编码时为盲文字符串，解码时为还原文本 */
  output: string;
  /** 处理过程中的非致命提示（不支持字符、未映射点位等） */
  warnings: string[];
}

/**
 * 判断字符是否为 Unicode 盲文模式区字符（U+2800–U+28FF）
 *
 * @param char - 待判断字符
 * @returns 是否属于盲文模式区
 */
export function isBraillePattern(char: string): boolean {
  if (char.length === 0) return false;
  const code = char.codePointAt(0) ?? 0;
  return code >= BRAILLE_BASE && code <= BRAILLE_BASE + 0xff;
}

/**
 * 将凸点编号集合转换为盲文字符
 *
 * @param dots - 点号数组，仅接受 1–8，重复点号自动去重
 * @returns 对应的盲文字符
   */
export function dotsToBraille(dots: number[]): string {
  let mask = 0;
  for (const dot of dots) {
    const bit = DOT_BIT[dot];
    if (bit === undefined) {
      throw new Error(`无效的盲文点号: ${dot}（仅支持 1–8）`);
    }
    mask |= bit;
  }
  return String.fromCodePoint(BRAILLE_BASE + mask);
}

/**
 * 解析盲文字符的凸点编号集合
 *
 * @param char - 单个盲文模式区字符
 * @returns 升序排列的点号数组（空字符 ⠀ 返回空数组）
 */
export function brailleToDots(char: string): number[] {
  if (!isBraillePattern(char)) {
    throw new Error(`不是盲文模式区字符（U+2800–U+28FF）: ${char}`);
  }
  const mask = (char.codePointAt(0) ?? BRAILLE_BASE) - BRAILLE_BASE;
  const dots: number[] = [];
  for (let dot = 1; dot <= 8; dot += 1) {
    if (mask & (DOT_BIT[dot] as number)) dots.push(dot);
  }
  return dots;
}

/**
 * 获取盲文字符的码位信息
 *
 * @param char - 单个盲文模式区字符
 * @returns 包含十进制码位、十六进制与点号集合的对象
 */
export function describeBraille(char: string): {
  codePoint: number;
  hex: string;
  dots: number[];
} {
  const codePoint = char.codePointAt(0) ?? 0;
  return {
    codePoint,
    hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    dots: brailleToDots(char),
  };
}

/**
 * 将普通文本编码为英文一级盲文字符串
 *
 * 数字序列自动插入数字号；遇到字母或空格退出数字模式；
 * 不支持的字符（如中文）跳过并记录 warning。
 *
 * @param text - 输入文本（大小写不敏感）
 * @returns 盲文字符串与警告信息
 */
export function encodeText(text: string): BrailleResult {
  const warnings: string[] = [];
  const cells: string[] = [];
  let numeric = false;

  for (const raw of text) {
    const char = raw.toLowerCase();

    if (char === ' ') {
      numeric = false;
      cells.push(BRAILLE_SPACE);
      continue;
    }

    if (char >= '0' && char <= '9') {
      if (!numeric) {
        cells.push(NUMBER_SIGN);
        numeric = true;
      }
      // 数字 1–9 对应字母 a–i，0 对应 j
      const letterIndex = char === '0' ? 9 : Number(char) - 1;
      cells.push(dotsToBraille(LETTER_DOTS[DIGIT_LETTERS[letterIndex]!]!));
      continue;
    }

    if (char in LETTER_DOTS) {
      numeric = false;
      cells.push(dotsToBraille(LETTER_DOTS[char]!));
      continue;
    }

    if (char in PUNCT_DOTS) {
      numeric = false;
      cells.push(dotsToBraille(PUNCT_DOTS[char]!));
      continue;
    }

    warnings.push(`不支持的字符已跳过: ${raw === '\n' ? '\\n' : raw}`);
  }

  return { output: cells.join(''), warnings };
}

/** 盲文字符 → 字母（仅 a–z 范围） */
const CELL_TO_LETTER: Map<string, string> = new Map(
  Object.entries(LETTER_DOTS).map(([letter, dots]) => [dotsToBraille(dots), letter]),
);

/** 盲文字符 → 标点 */
const CELL_TO_PUNCT: Map<string, string> = new Map(
  Object.entries(PUNCT_DOTS).map(([punct, dots]) => [dotsToBraille(dots), punct]),
);

/**
 * 将盲文字符串解码为普通文本
 *
 * 数字号 ⠼ 之后的 a–j 点位还原为数字 1–0，直到遇到非数字点位；
 * 未映射的盲文点位跳过并记录 warning。
 *
 * @param cells - 盲文字符串
 * @returns 还原文本与警告信息
 */
export function decodeBraille(cells: string): BrailleResult {
  const warnings: string[] = [];
  const chars: string[] = [];
  let numeric = false;

  for (const cell of cells) {
    if (cell === NUMBER_SIGN) {
      numeric = true;
      continue;
    }

    if (cell === BRAILLE_SPACE) {
      numeric = false;
      chars.push(' ');
      continue;
    }

    const letter = CELL_TO_LETTER.get(cell);
    if (letter !== undefined) {
      if (numeric && letter >= 'a' && letter <= 'j') {
        // a–i 还原为 1–9，j 还原为 0
        const index = DIGIT_LETTERS.indexOf(letter);
        chars.push(String(index === 9 ? 0 : index + 1));
      } else {
        numeric = false;
        chars.push(letter);
      }
      continue;
    }

    const punct = CELL_TO_PUNCT.get(cell);
    if (punct !== undefined) {
      numeric = false;
      chars.push(punct);
      continue;
    }

    numeric = false;
    warnings.push(
      `未映射的盲文点位已跳过: ${cell}（dots ${brailleToDots(cell).join(',') || '无'}）`,
    );
  }

  return { output: chars.join(''), warnings };
}
