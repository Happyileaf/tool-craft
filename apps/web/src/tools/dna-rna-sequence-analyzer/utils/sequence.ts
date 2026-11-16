/**
 * DNA / RNA 序列分析的纯函数模块（零依赖，不触碰 DOM / React）
 *
 * 处理流水线：清洗 → 类型识别 → 统计 → 变换（互补 / 反向互补 / 转录）→ 六框翻译。
 * 所有错误以结果对象返回，不在纯函数内抛异常。
 */
import {
  GENETIC_CODE,
  IUPAC_ALL,
  IUPAC_AMBIGUOUS,
  IUPAC_COMPLEMENT_DNA,
  MAX_SEQUENCE_LENGTH,
  type NucleicAcidType,
} from '../constants';

/** 清洗结果 */
export interface CleanResult {
  /** 清洗后拼接的大写序列 */
  sequence: string;
  /** 移除的比对空位 `-` 数量 */
  removedGaps: number;
  /** 检测到的 FASTA 头数量 */
  fastaHeaders: number;
}

/** 碱基统计 */
export interface BaseStats {
  length: number;
  counts: Record<string, number>;
  /** GC 含量（0–1），含模糊碱基时仅按确定碱基 G/C 计 */
  gcContent: number;
  /** AT（DNA）或 AU（RNA）含量（0–1） */
  atContent: number;
  /** IUPAC 模糊碱基数量 */
  ambiguousCount: number;
}

/** 单个读框的翻译结果 */
export interface FrameTranslation {
  /** 读框标识：+1/+2/+3/-1/-2/-3 */
  frame: string;
  /** 氨基酸序列，终止密码子为 `*`，模糊密码子为 `X` */
  peptides: string;
  /** 终止密码子在肽链中的 0-based 位置列表 */
  stopPositions: number[];
  /** 末尾未参与翻译的碱基数（0–2） */
  trailingBases: number;
}

export interface SequenceAnalysis {
  type: NucleicAcidType;
  /** 类型是否为推断（序列不含 T/U 时按 DNA 处理并注明） */
  typeInferred: boolean;
  clean: CleanResult;
  stats: BaseStats;
  complement: string;
  reverseComplement: string;
  /** 转录得到的 mRNA（DNA 的 T→U；RNA 原样返回） */
  mrna: string;
  frames: FrameTranslation[];
  error: string | null;
  /** 出错时在清洗后序列中的 1-based 位置 */
  errorPosition: number | null;
}

/**
 * 清洗原始输入：
 * - 以 `>` 开头的行视为 FASTA 头并跳过
 * - 移除空格 / 制表 / 换行 / 回车与数字（行号）
 * - 移除比对空位 `-` 并计数
 * - 统一转大写
 */
export function cleanSequence(raw: string): CleanResult {
  const lines = raw.split(/\r?\n/);
  let fastaHeaders = 0;
  let removedGaps = 0;
  let sequence = '';

  for (const line of lines) {
    if (line.trimStart().startsWith('>')) {
      fastaHeaders += 1;
      continue;
    }
    for (const char of line) {
      if (/\s/.test(char) || /[0-9]/.test(char)) {
        continue;
      }
      if (char === '-') {
        removedGaps += 1;
        continue;
      }
      sequence += char.toUpperCase();
    }
  }

  return { sequence, removedGaps, fastaHeaders };
}

/** 识别核酸类型；同时含 T 与 U 时通过 error 返回 */
function detectType(sequence: string): { type: NucleicAcidType; inferred: boolean; error: string | null } {
  const hasT = sequence.includes('T');
  const hasU = sequence.includes('U');
  if (hasT && hasU) {
    return { type: 'DNA', inferred: false, error: '序列同时包含 T 与 U，无法确定核酸类型，请检查输入' };
  }
  if (hasU) {
    return { type: 'RNA', inferred: false, error: null };
  }
  // 含 T，或两者都不含（纯模糊碱基等）→ 按 DNA 处理
  return { type: 'DNA', inferred: !hasT, error: null };
}

/** 校验字符是否属于 IUPAC（结合类型区分 T/U），返回首个非法字符的 0-based 位置 */
function findInvalidPosition(sequence: string, type: NucleicAcidType): number | null {
  for (let i = 0; i < sequence.length; i += 1) {
    const char = sequence[i];
    if (char === undefined || !IUPAC_ALL.has(char)) {
      return i;
    }
    if (type === 'DNA' && char === 'U') {
      return i;
    }
    if (type === 'RNA' && char === 'T') {
      return i;
    }
  }
  return null;
}

/** 计算碱基组成与 GC / AT 含量 */
export function computeStats(sequence: string): BaseStats {
  const counts: Record<string, number> = {};
  let ambiguousCount = 0;
  for (const char of sequence) {
    counts[char] = (counts[char] ?? 0) + 1;
    if (IUPAC_AMBIGUOUS.has(char)) {
      ambiguousCount += 1;
    }
  }
  const length = sequence.length;
  const gc = (counts.G ?? 0) + (counts.C ?? 0);
  const at = (counts.A ?? 0) + (counts.T ?? 0) + (counts.U ?? 0);
  return {
    length,
    counts,
    gcContent: length > 0 ? gc / length : 0,
    atContent: length > 0 ? at / length : 0,
    ambiguousCount,
  };
}

/** 取互补碱基；RNA 中 U 与 A 互补，其余按 DNA 表（表中无 U，单独处理） */
function complementBase(char: string, type: NucleicAcidType): string {
  if (type === 'RNA') {
    if (char === 'U') {
      return 'A';
    }
    if (char === 'A') {
      return 'U';
    }
  }
  return IUPAC_COMPLEMENT_DNA[char] ?? 'N';
}

/** 互补链（方向不变） */
export function complementSequence(sequence: string, type: NucleicAcidType): string {
  return sequence
    .split('')
    .map((char) => complementBase(char, type))
    .join('');
}

/** 反向互补链：先反向再互补；RNA 的反向互补仍为 RNA（不产生 T） */
export function reverseComplementSequence(sequence: string, type: NucleicAcidType): string {
  return sequence
    .split('')
    .reverse()
    .map((char) => complementBase(char, type))
    .join('');
}

/** 转录为 mRNA：DNA 的 T→U，RNA 原样返回 */
export function transcribe(sequence: string, type: NucleicAcidType): string {
  return type === 'DNA' ? sequence.replace(/T/g, 'U') : sequence;
}

/**
 * 翻译单个读框。
 * - 终止密码子输出 `*` 并记录位置
 * - 含模糊碱基（无法在密码表中命中）输出 `X`
 * - 末尾不足 3 个碱基不翻译，通过 trailingBases 提示
 */
function translateFrame(sequence: string, offset: number, frame: string): FrameTranslation {
  const peptides: string[] = [];
  const stopPositions: number[] = [];
  let index = offset;
  for (; index + 3 <= sequence.length; index += 3) {
    const codon = sequence.slice(index, index + 3);
    let aminoAcid: string;
    if (/[^ACGU]/.test(codon)) {
      aminoAcid = 'X';
    } else {
      aminoAcid = GENETIC_CODE[codon] ?? 'X';
    }
    if (aminoAcid === '*') {
      stopPositions.push(peptides.length);
    }
    peptides.push(aminoAcid);
  }
  return {
    frame,
    peptides: peptides.join(''),
    stopPositions,
    trailingBases: sequence.length - index,
  };
}

/** 六框翻译：正向 +1/+2/+3 与反向互补链 -1/-2/-3，翻译统一在 RNA 字母表上进行 */
export function translateSixFrames(
  sequence: string,
  type: NucleicAcidType,
): FrameTranslation[] {
  const forwardRna = transcribe(sequence, type);
  const reverseRna = transcribe(reverseComplementSequence(sequence, type), type);
  return [
    translateFrame(forwardRna, 0, '+1'),
    translateFrame(forwardRna, 1, '+2'),
    translateFrame(forwardRna, 2, '+3'),
    translateFrame(reverseRna, 0, '-1'),
    translateFrame(reverseRna, 1, '-2'),
    translateFrame(reverseRna, 2, '-3'),
  ];
}

/** 完整分析入口 */
export function analyzeSequence(raw: string): SequenceAnalysis {
  const clean = cleanSequence(raw);
  const empty: SequenceAnalysis = {
    type: 'DNA',
    typeInferred: false,
    clean,
    stats: computeStats(''),
    complement: '',
    reverseComplement: '',
    mrna: '',
    frames: [],
    error: '',
    errorPosition: null,
  };

  if (clean.sequence.length === 0) {
    return { ...empty, error: '清洗后序列为空，请粘贴有效的 DNA / RNA 序列' };
  }
  if (clean.sequence.length > MAX_SEQUENCE_LENGTH) {
    return {
      ...empty,
      error: `序列长度 ${clean.sequence.length} nt 超过上限 ${MAX_SEQUENCE_LENGTH.toLocaleString()} nt，已拒绝`,
    };
  }

  const typeCheck = detectType(clean.sequence);
  if (typeCheck.error) {
    return { ...empty, type: typeCheck.type, error: typeCheck.error };
  }

  const invalidPosition = findInvalidPosition(clean.sequence, typeCheck.type);
  if (invalidPosition !== null) {
    return {
      ...empty,
      type: typeCheck.type,
      error: `清洗后第 ${invalidPosition + 1} 位字符「${clean.sequence[invalidPosition]}」不属于 IUPAC 核酸字符`,
      errorPosition: invalidPosition + 1,
    };
  }

  const stats = computeStats(clean.sequence);
  const complement = complementSequence(clean.sequence, typeCheck.type);
  const reverseComplement = reverseComplementSequence(clean.sequence, typeCheck.type);
  const mrna = transcribe(clean.sequence, typeCheck.type);
  const frames = translateSixFrames(clean.sequence, typeCheck.type);

  return {
    type: typeCheck.type,
    typeInferred: typeCheck.inferred,
    clean,
    stats,
    complement,
    reverseComplement,
    mrna,
    frames,
    error: null,
    errorPosition: null,
  };
}
