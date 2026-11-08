/**
 * Hamming(7,4) 编解码纯函数。
 *
 * 位编号约定：位置从 1 开始（位 1 在数组下标 0 / 字符串最左侧）。
 * 码字布局（共 7 位）：
 *   位置 1 = P1，位置 2 = P2，位置 4 = P4（2 的幂次位置放校验位，偶校验）
 *   位置 3 = D1，位置 5 = D2，位置 6 = D3，位置 7 = D4
 * 校验组：
 *   P1 覆盖位置 1,3,5,7；P2 覆盖位置 2,3,6,7；P4 覆盖位置 4,5,6,7
 */

/** 校验位所在的 1 基位置（2 的幂次）。 */
export const PARITY_POSITIONS = [1, 2, 4] as const;

/** 数据位所在的 1 基位置（非 2 的幂次）。 */
export const DATA_POSITIONS = [3, 5, 6, 7] as const;

/** 每个校验位负责覆盖的 1 基位置集合。 */
export const PARITY_GROUPS: Readonly<Record<number, readonly number[]>> = {
  1: [1, 3, 5, 7],
  2: [2, 3, 6, 7],
  4: [4, 5, 6, 7],
};

/** 单组解码结果。 */
export interface HammingBlock {
  /** 7 位码字（位 1 在字符串最左侧）。 */
  codeword: string;
  /** 从码字还原出的 4 位数据。 */
  data: string;
  /** 3 位校正子，顺序为 P4 P2 P1，其十进制值即错误位号（0 表示无错）。 */
  syndrome: number;
  /** 出错的 1 基位置，0 表示无单比特错误。 */
  errorPosition: number;
  /** 解码状态：无错 / 单错已纠正 / 双错检出但不可纠正。 */
  status: 'ok' | 'corrected' | 'double-error';
}

/** 仅允许 0/1 字符，去除空白后校验。 */
export function normalizeBits(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned.length === 0) {
    throw new Error('比特流为空');
  }
  if (!/^[01]+$/.test(cleaned)) {
    throw new Error('比特流只能包含 0 和 1');
  }
  return cleaned;
}

/**
 * 将单个 4 位数据编码为 7 位码字。
 * 输入长度必须恰为 4。
 */
export function encodeBlock(data4: string): string {
  const d = data4.replace(/\s+/g, '');
  if (d.length !== 4 || !/^[01]{4}$/.test(d)) {
    throw new Error('单组数据必须是 4 位 0/1');
  }
  // 1 基位置 -> 比特值，先放数据位，校验位暂存 0。
  const bits: number[] = new Array(8).fill(0); // 下标 0 不用
  DATA_POSITIONS.forEach((pos, i) => {
    bits[pos] = Number(d[i]);
  });
  for (const p of PARITY_POSITIONS) {
    const group = PARITY_GROUPS[p] ?? [];
    // 偶校验：让组内 1 的个数为偶数（计算时排除自身占位的 0）。
    const ones = group
      .filter((pos) => pos !== p)
      .reduce((sum, pos) => sum + (bits[pos] ?? 0), 0);
    bits[p] = ones % 2;
  }
  return bits.slice(1).join('');
}

/**
 * 将任意长度比特流按 4 位分组编码，返回每组 7 位码字拼接结果。
 * 最后一组不足 4 位时在右侧补 0 并通过返回值告知补齐位数。
 */
export function encodeStream(bits: string): { codeword: string; padded: number } {
  const normalized = normalizeBits(bits);
  const padded = (4 - (normalized.length % 4)) % 4;
  const filled = normalized.padEnd(normalized.length + padded, '0');
  const blocks: string[] = [];
  for (let i = 0; i < filled.length; i += 4) {
    blocks.push(encodeBlock(filled.slice(i, i + 4)));
  }
  return { codeword: blocks.join(''), padded };
}

/**
 * 解码单个 7 位码字，计算校正子并在单错时纠正。
 * 双比特错误只能检出（syndrome 非零但纠正会得到错误数据），
 * 这里通过 parity 总校验无法与单错区分，故由批量层结合注入数判断；
 * 单组场景下 syndrome 非零一律按单错纠正（标准 (7,4) 语义）。
 */
export function decodeBlock(codeword7: string): HammingBlock {
  const c = codeword7.replace(/\s+/g, '');
  if (c.length !== 7 || !/^[01]{7}$/.test(c)) {
    throw new Error('单组码字必须是 7 位 0/1');
  }
  const bits: number[] = [0, ...c.split('').map(Number)]; // 下标 0 不用
  let syndrome = 0;
  for (const p of PARITY_POSITIONS) {
    const group = PARITY_GROUPS[p] ?? [];
    const ones = group.reduce((sum, pos) => sum + (bits[pos] ?? 0), 0);
    if (ones % 2 !== 0) {
      syndrome += p;
    }
  }
  let status: HammingBlock['status'] = 'ok';
  if (syndrome !== 0) {
    // 标准 (7,4)：syndrome 即错误位号，翻转纠正。
    bits[syndrome] = bits[syndrome] === 0 ? 1 : 0;
    status = 'corrected';
  }
  const data = DATA_POSITIONS.map((pos) => bits[pos] ?? 0).join('');
  return {
    codeword: bits.slice(1).join(''),
    data,
    syndrome,
    errorPosition: syndrome,
    status,
  };
}

/**
 * 解码任意长度码字流（长度须为 7 的倍数），逐组解码。
 * 当已知某组发生双比特翻转时，调用方可通过 flippedCount 标记 double-error。
 */
export function decodeStream(
  codeword: string,
  flippedCounts?: number[],
): { blocks: HammingBlock[]; data: string } {
  const normalized = normalizeBits(codeword);
  if (normalized.length % 7 !== 0) {
    throw new Error('码字长度必须是 7 的倍数');
  }
  const blocks: HammingBlock[] = [];
  for (let i = 0; i < normalized.length; i += 7) {
    const block = decodeBlock(normalized.slice(i, i + 7));
    const groupIndex = i / 7;
    if ((flippedCounts?.[groupIndex] ?? 0) >= 2) {
      block.status = 'double-error';
    }
    blocks.push(block);
  }
  return { blocks, data: blocks.map((b) => b.data).join('') };
}

/** 在给定 7 位码字上翻转指定位（1 基位置数组）。 */
export function flipBits(codeword7: string, positions: number[]): string {
  const bits = codeword7.split('');
  for (const pos of positions) {
    if (pos < 1 || pos > 7) {
      throw new Error('错误位位置必须在 1–7 之间');
    }
    const idx = pos - 1;
    bits[idx] = bits[idx] === '0' ? '1' : '0';
  }
  return bits.join('');
}

/** 从 1..7 中随机选取 n 个不重复位置。 */
export function randomPositions(n: number): number[] {
  const all: number[] = [1, 2, 3, 4, 5, 6, 7];
  for (let i = all.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i] ?? 0;
    all[i] = all[j] ?? 0;
    all[j] = tmp;
  }
  return all.slice(0, n).sort((a, b) => a - b);
}
