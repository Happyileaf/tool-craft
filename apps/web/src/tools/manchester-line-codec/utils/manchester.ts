/**
 * 曼彻斯特（IEEE 802.3 / Thomas）与差分曼彻斯特线路编解码纯函数。
 *
 * 电平用字符 'H'（高）/'L'（低）表示；每个比特编码为两个电平（双相码元），
 * 位中间恒有一次跳变，接收端可借此自同步提取时钟。
 */

export type Level = 'H' | 'L';

export type ManchesterConvention = 'ieee' | 'thomas';

/** 逐位映射条目：bit 为原始/还原比特，pair 为该位对应的双相电平，startTransition 仅差分编码使用 */
export interface CodeBit {
  bit: string;
  pair: string;
  /** 差分曼彻斯特：本位起始处相对上一位结束电平是否发生跳变 */
  startTransition?: boolean;
}

export interface CodeResult {
  /** 每位一个双相电平对，如 'LH' */
  pairs: string[];
  /** 空格连接的完整电平序列，如 'LH HL LH LH' */
  levels: string;
  perBit: CodeBit[];
}

export interface DecodeBit {
  /** 位序号（1-based） */
  index: number;
  bit: string;
  pair: string;
  /** 该位的判定依据 */
  reason: string;
}

export interface DecodeResult {
  bits: string;
  levels: string;
  perBit: DecodeBit[];
}

export interface TimingParams {
  symbolWidthSeconds: number;
  symbolWidthUs: number;
  minBandwidthHz: number;
}

const invert = (level: Level): Level => (level === 'H' ? 'L' : 'H');

/**
 * 规范化比特串：去除全部空白与 0b/0B 前缀，校验仅含 0/1。
 * 非法字符抛出带 1-based 定位的中文错误；空串同样抛出。
 */
export function normalizeBits(input: string): string {
  const cleaned = input.replace(/0b/gi, '').replace(/\s+/g, '');
  if (!cleaned) {
    throw new Error('比特串不能为空');
  }
  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]!;
    if (char !== '0' && char !== '1') {
      throw new Error(`第 ${i + 1} 位含非法字符“${char}”，比特串只能包含 0 或 1`);
    }
  }
  return cleaned;
}

/**
 * 规范化电平输入：去空白，接受 H/L；若全部为 0/1 则按双相采样把 0→L、1→H。
 * 非法符号抛出带 1-based 定位的中文错误。
 */
export function normalizeLevels(input: string): Level[] {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) {
    throw new Error('电平序列不能为空');
  }
  if (/^[01]+$/.test(cleaned)) {
    return cleaned.split('').map((char) => (char === '1' ? 'H' : 'L'));
  }
  const levels: Level[] = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]!;
    if (char === 'H' || char === 'L') {
      levels.push(char);
    } else {
      throw new Error(`第 ${i + 1} 个电平含非法符号“${char}”，仅允许 H/L（或全 0/1 双相采样）`);
    }
  }
  return levels;
}

function toResult(bits: string, pairs: string[], startTransitions?: boolean[]): CodeResult {
  return {
    pairs,
    levels: pairs.join(' '),
    perBit: bits.split('').map((bit, index) => ({
      bit,
      pair: pairs[index]!,
      ...(startTransitions ? { startTransition: startTransitions[index]! } : {}),
    })),
  };
}

/**
 * 曼彻斯特编码。
 * IEEE 802.3：0 → HL（先高后低），1 → LH（先低后高）；
 * Thomas 约定极性完全相反：0 → LH，1 → HL。
 */
export function encodeManchester(bitsInput: string, convention: ManchesterConvention): CodeResult {
  const bits = normalizeBits(bitsInput);
  const pairs: string[] = bits.split('').map((bit) => {
    if (convention === 'ieee') {
      return bit === '0' ? 'HL' : 'LH';
    }
    return bit === '0' ? 'LH' : 'HL';
  });
  return toResult(bits, pairs);
}

/**
 * 差分曼彻斯特编码。
 * 每位中间恒有一次跳变；位起始处：比特 1 不跳变（延续上一位结束电平），
 * 比特 0 在位起始处跳变。第一位以 initialLevel 作为位起始电平。
 */
export function encodeDifferentialManchester(bitsInput: string, initialLevel: Level): CodeResult {
  const bits = normalizeBits(bitsInput);
  const pairs: string[] = [];
  const startTransitions: boolean[] = [];
  let previousEnd: Level | null = null;
  bits.split('').forEach((bit) => {
    let start: Level;
    let transition = false;
    if (previousEnd === null) {
      start = initialLevel;
    } else if (bit === '1') {
      start = previousEnd;
    } else {
      start = invert(previousEnd);
      transition = true;
    }
    const end = invert(start);
    pairs.push(`${start}${end}`);
    startTransitions.push(transition);
    previousEnd = end;
  });
  return toResult(bits, pairs, startTransitions);
}

/**
 * 曼彻斯特解码：相邻两个电平为一对，按约定还原比特。
 * IEEE：LH→1、HL→0；Thomas 相反。一对内无跳变（HH/LL）抛出带位序号的错误。
 */
export function decodeManchester(levelsInput: string, convention: ManchesterConvention): DecodeResult {
  const levels = normalizeLevels(levelsInput);
  if (levels.length % 2 !== 0) {
    throw new Error('码元长度为奇数，无法成对对齐');
  }
  const perBit: DecodeBit[] = [];
  const bits: string[] = [];
  for (let i = 0; i < levels.length; i += 2) {
    const first = levels[i]!;
    const second = levels[i + 1]!;
    const bitIndex = i / 2 + 1;
    const pair = `${first}${second}`;
    if (first === second) {
      throw new Error(`第 ${bitIndex} 位缺少中间跳变沿（电平对 ${pair}）`);
    }
    const isLowToHigh = first === 'L' && second === 'H';
    const bit = convention === 'ieee' ? (isLowToHigh ? '1' : '0') : isLowToHigh ? '0' : '1';
    bits.push(bit);
    perBit.push({
      index: bitIndex,
      bit,
      pair,
      reason:
        convention === 'ieee'
          ? `${pair}：LH→1、HL→0（IEEE 802.3）`
          : `${pair}：LH→0、HL→1（Thomas，极性相反）`,
    });
  }
  return { bits: bits.join(''), levels: levels.join(' '), perBit };
}

/**
 * 差分曼彻斯特解码：依据相邻码元边界（上一位结束电平 vs 本位起始电平）是否跳变还原：
 * 边界跳变→0，不跳变→1；首位以 initialLevel 作为前置电平。每对内部必须有跳变。
 */
export function decodeDifferentialManchester(levelsInput: string, initialLevel: Level): DecodeResult {
  const levels = normalizeLevels(levelsInput);
  if (levels.length % 2 !== 0) {
    throw new Error('码元长度为奇数，无法成对对齐');
  }
  const perBit: DecodeBit[] = [];
  const bits: string[] = [];
  let previousEnd: Level = initialLevel;
  for (let i = 0; i < levels.length; i += 2) {
    const first = levels[i]!;
    const second = levels[i + 1]!;
    const bitIndex = i / 2 + 1;
    const pair = `${first}${second}`;
    if (first === second) {
      throw new Error(`第 ${bitIndex} 位缺少中间跳变沿（电平对 ${pair}）`);
    }
    const boundaryTransition = first !== previousEnd;
    const bit = boundaryTransition ? '0' : '1';
    bits.push(bit);
    perBit.push({
      index: bitIndex,
      bit,
      pair,
      reason:
        bitIndex === 1
          ? `首位前置电平 ${initialLevel}，位起始 ${
              boundaryTransition ? '跳变→0' : '不跳变→1'
            }`
          : `上一位结束 ${previousEnd} → 本位起始 ${first}，边界${
              boundaryTransition ? '跳变→0' : '不跳变→1'
            }`,
    });
    previousEnd = second;
  }
  return { bits: bits.join(''), levels: levels.join(' '), perBit };
}

/**
 * 时序参数：码元宽度 = 1/bitrateBps 秒；曼彻斯特主瓣带宽提示约等于比特率（Hz）。
 * bitrateBps 必须为正数。
 */
export function timingParams(bitrateBps: number): TimingParams {
  if (!Number.isFinite(bitrateBps) || bitrateBps <= 0) {
    throw new Error('比特率必须为正数');
  }
  const symbolWidthSeconds = 1 / bitrateBps;
  return {
    symbolWidthSeconds,
    symbolWidthUs: symbolWidthSeconds * 1_000_000,
    minBandwidthHz: bitrateBps,
  };
}
