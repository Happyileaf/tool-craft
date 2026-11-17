import { ALPHABET, BACON_TABLE } from '../constants';

/** 密码处理结果 */
export interface CipherResult {
  output: string;
  /** 处理过程中的关键中间量 / 说明，便于 UI 展示与教学 */
  steps: string[];
}

/** 仅保留 A-Z（输入统一大写），其他字符剔除 */
function lettersOnly(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

/* ------------------------------------------------------------------ */
/* Atbash：字母表反转，A↔Z、B↔Y …，对大小写分别处理，非字母原样保留        */
/* ------------------------------------------------------------------ */

/**
 * Atbash 加解密（对称变换，加密与解密为同一函数）。
 */
export function atbash(text: string): CipherResult {
  const output = text
    .split('')
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(90 - (code - 65));
      }
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(122 - (code - 97));
      }
      return ch;
    })
    .join('');

  return {
    output,
    steps: ['Atbash 是自逆变换：A↔Z、B↔Y、C↔X …，同一函数同时用于加密与解密，非字母字符原样保留。'],
  };
}

/* ------------------------------------------------------------------ */
/* 培根密码：每字母 → 5 位 AB 串；解密按 5 位分组反查（I/J、U/V 合并）      */
/* ------------------------------------------------------------------ */

const BACON_REVERSE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [letter, code] of Object.entries(BACON_TABLE)) {
    // 反向表优先保留字母序靠前的代表字母（I 先于 J、U 先于 V）
    if (!(code in map)) {
      map[code] = letter;
    }
  }
  return map;
})();

/**
 * 培根加密：提取字母后逐字母映射为 5 位 A/B 编码，分组以空格分隔。
 */
export function baconEncrypt(plain: string): CipherResult {
  const letters = lettersOnly(plain);
  const groups: string[] = [];
  for (const ch of letters) {
    const code = BACON_TABLE[ch];
    if (code) {
      groups.push(code);
    }
  }
  return {
    output: groups.join(' '),
    steps: [
      `共识别 ${letters.length} 个字母，每个字母替换为 5 位 A/B 编码（J 按 I、V 按 U 编码）。`,
      '分组之间以空格分隔；真实使用中 A/B 可由任意两种字体 / 大小写承载，实现隐写。',
    ],
  };
}

/**
 * 培根解密：抽取 A/B 字符后按每 5 位分组反查，不足 5 位的尾组丢弃。
 */
export function baconDecrypt(cipher: string): CipherResult {
  const bits = cipher.toUpperCase().replace(/[^AB]/g, '');
  const letters: string[] = [];
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const group = bits.slice(i, i + 5);
    const letter = BACON_REVERSE[group];
    if (letter) {
      letters.push(letter);
    }
  }
  const dropped = bits.length % 5;
  return {
    output: letters.join(''),
    steps: [
      `抽取到 ${bits.length} 个 A/B 符号，按每 5 位一组得到 ${letters.length} 个字母${
        dropped ? `，尾部 ${dropped} 位不足一组已丢弃` : ''
      }。`,
      'I/J 与 U/V 在原始培根表中共用编码，解密统一输出 I 与 U。',
    ],
  };
}

/* ------------------------------------------------------------------ */
/* 栅栏密码：rails 行锯齿写入、按行读出；解密逆向重建                      */
/* ------------------------------------------------------------------ */

/**
 * 栅栏加密。
 *
 * @param text - 明文（非字母数字字符同样参与排列，保留在密文中）
 * @param rails - 栅栏行数，需 ≥ 2
 */
export function railFenceEncrypt(text: string, rails: number): CipherResult {
  const safeRails = Math.max(2, Math.floor(rails));
  const rows: string[][] = Array.from({ length: safeRails }, () => []);
  let row = 0;
  let step = 1;

  for (const ch of text) {
    rows[row]?.push(ch);
    if (row === 0) {
      step = 1;
    } else if (row === safeRails - 1) {
      step = -1;
    }
    row += step;
  }

  const output = rows.map((r) => r.join('')).join('');
  return {
    output,
    steps: [
      `明文沿 ${safeRails} 行锯齿形往返写入，再按行从上到下读出。`,
      `各行字符数：${rows.map((r) => r.length).join(' / ')}。`,
    ],
  };
}

/**
 * 栅栏解密：先按加密轨迹标记每个位置所属行，再按行回填密文后按轨迹读出。
 */
export function railFenceDecrypt(cipher: string, rails: number): CipherResult {
  const safeRails = Math.max(2, Math.floor(rails));
  const n = cipher.length;
  const pattern: number[] = [];
  let row = 0;
  let step = 1;
  for (let i = 0; i < n; i += 1) {
    pattern.push(row);
    if (row === 0) {
      step = 1;
    } else if (row === safeRails - 1) {
      step = -1;
    }
    row += step;
  }

  // 统计每行应分配的字符数，按行顺序切片密文
  const rowLengths = Array.from({ length: safeRails }, (_, r) =>
    pattern.filter((x) => x === r).length,
  );
  const rowStrings: string[] = [];
  let cursor = 0;
  for (const len of rowLengths) {
    rowStrings.push(cipher.slice(cursor, cursor + len));
    cursor += len;
  }
  const rowCursors = Array.from({ length: safeRails }, () => 0);
  const output = pattern
    .map((r) => {
      const idx = rowCursors[r] ?? 0;
      const ch = rowStrings[r]?.[idx] ?? '';
      rowCursors[r] = idx + 1;
      return ch;
    })
    .join('');

  return {
    output,
    steps: [
      `按 ${safeRails} 行轨迹重建位置序列，把密文切片回填各行后沿锯齿顺序读出。`,
      `各行字符数：${rowLengths.join(' / ')}。`,
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Playfair：5×5 方阵（I/J 合并），双字母分组、同行 / 同列 / 矩形规则       */
/* ------------------------------------------------------------------ */

/** 由密钥构造 5×5 Playfair 方阵（I/J 合并为 I） */
function buildPlayfairSquare(key: string): string[][] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const seed = lettersOnly(key).replace(/J/g, 'I') + ALPHABET.replace(/J/g, '');
  for (const ch of seed) {
    if (!seen.has(ch)) {
      seen.add(ch);
      ordered.push(ch);
    }
  }
  const square: string[][] = [];
  for (let r = 0; r < 5; r += 1) {
    square.push(ordered.slice(r * 5, r * 5 + 5));
  }
  return square;
}

/** 查找字母在方阵中的坐标 */
function locate(square: string[][], ch: string): [number, number] {
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      if (square[r]?.[c] === ch) {
        return [r, c];
      }
    }
  }
  return [0, 0];
}

/** 把明文规整为 Playfair 双字母组：J→I、同组重复插 X、长度奇数补 X */
function preparePlayfairPairs(text: string): string[] {
  const letters = lettersOnly(text).replace(/J/g, 'I').split('');
  const pairs: string[] = [];
  let i = 0;
  while (i < letters.length) {
    const first = letters[i] ?? '';
    let second = letters[i + 1] ?? '';
    if (!second) {
      second = 'X';
      i += 1;
    } else if (first === second) {
      second = 'X';
      i += 1;
    } else {
      i += 2;
    }
    pairs.push(first + second);
  }
  return pairs;
}

function renderSquare(square: string[][]): string {
  return square.map((row) => row.join(' ')).join(' / ');
}

/**
 * Playfair 加密。
 *
 * @param plain - 明文（J 统一按 I 处理）
 * @param key - 密钥，重复字母只取首次出现
 */
export function playfairEncrypt(plain: string, key: string): CipherResult {
  const square = buildPlayfairSquare(key);
  const pairs = preparePlayfairPairs(plain);
  const output = pairs
    .map((pair) => {
      const [r1, c1] = locate(square, pair[0] ?? 'A');
      const [r2, c2] = locate(square, pair[1] ?? 'A');
      if (r1 === r2) {
        return (square[r1]?.[(c1 + 1) % 5] ?? '') + (square[r2]?.[(c2 + 1) % 5] ?? '');
      }
      if (c1 === c2) {
        return (square[(r1 + 1) % 5]?.[c1] ?? '') + (square[(r2 + 1) % 5]?.[c2] ?? '');
      }
      return (square[r1]?.[c2] ?? '') + (square[r2]?.[c1] ?? '');
    })
    .join(' ');

  return {
    output,
    steps: [
      `密钥方阵（I/J 合并）：${renderSquare(square)}`,
      `明文规整为 ${pairs.length} 个双字母组（重复字母间插 X、奇数长度补 X）：${pairs.join(' ')}`,
      '同行右移、同列下移、矩形取对角，逐组加密后以空格分隔。',
    ],
  };
}

/**
 * Playfair 解密：与加密对称，同行 / 同列左移 / 上移，矩形规则不变。
 */
export function playfairDecrypt(cipher: string, key: string): CipherResult {
  const square = buildPlayfairSquare(key);
  const pairs = lettersOnly(cipher).match(/.{1,2}/g) ?? [];
  const output = pairs
    .filter((p) => p.length === 2)
    .map((pair) => {
      const [r1, c1] = locate(square, pair[0] ?? 'A');
      const [r2, c2] = locate(square, pair[1] ?? 'A');
      if (r1 === r2) {
        return (square[r1]?.[(c1 + 4) % 5] ?? '') + (square[r2]?.[(c2 + 4) % 5] ?? '');
      }
      if (c1 === c2) {
        return (square[(r1 + 4) % 5]?.[c1] ?? '') + (square[(r2 + 4) % 5]?.[c2] ?? '');
      }
      return (square[r1]?.[c2] ?? '') + (square[r2]?.[c1] ?? '');
    })
    .join('');

  return {
    output,
    steps: [
      `密钥方阵（I/J 合并）：${renderSquare(square)}`,
      '同行左移、同列上移、矩形取对角；解密结果中的补位 X 需结合语境人工识别。',
    ],
  };
}
