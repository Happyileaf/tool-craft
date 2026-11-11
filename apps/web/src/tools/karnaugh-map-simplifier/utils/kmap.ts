/**
 * 卡诺图化简纯函数实现（零依赖）。
 *
 * 基于 Quine–McCluskey 思路直接在最小项集合上求解，不依赖网格几何：
 * 1. `parseMintermString` 解析 Σm(...)+d(...) 记号；
 * 2. `findPrimeImplicants` 按 1 位差异递归合并得到全部质蕴涵项；
 * 3. `selectMinimumCover` 先取本质质蕴涵项，再确定性贪心选取最小覆盖；
 * 4. `simplifyKmap` 同时输出 SOP 与 POS（对 0 集合跑同一套 QM 后按德摩根定律取反）。
 *
 * 变量固定命名 A/B/C/D，A 为最高位；最小项编号即变量取值二进制对应的十进制。
 */

/** 单元格取值：0、1 或无关项 x */
export type CellValue = 0 | 1 | 'x';

/** 化简器输入：单元格数组或最小项编号集合 */
export type KmapInput = CellValue[] | { ones: number[]; dontCares: number[] };

/** 单个蕴涵项（乘积项 / 和项的统一表示） */
export interface Implicant {
  /** 该蕴涵项覆盖的最小项编号集合（可能包含参与合并的无关项） */
  minterms: number[];
  /** 固定位掩码：为 1 的位表示该变量取值固定，为 0 的位表示已被合并消除 */
  mask: number;
  /** 固定位取值，与 mask 配对解释 */
  value: number;
  /** 字面量数组，变量编号 0 对应 A；带 "'" 后缀表示反变量，如 ["A", "B'"] */
  literals: string[];
}

/** Σm 字符串解析结果 */
export interface ParsedMintermString {
  /** 值为 1 的最小项编号（升序去重） */
  ones: number[];
  /** 无关项最小项编号（升序去重） */
  dontCares: number[];
}

/** 门电路统计 */
export interface GateStats {
  /** 与门数量（单字面量项不计与门） */
  andGates: number;
  /** 或门数量（仅一个乘积项时不计或门） */
  orGates: number;
  /** 非门数量（按出现反变量的不同变量计） */
  notGates: number;
  /** 字面量总数 */
  literals: number;
}

/** 化简结果 */
export interface SimplifyResult {
  /** SOP 乘积项集合 */
  sop: Implicant[];
  /** POS 和项集合（字面量已按德摩根定律取反，含义为和项中的变量） */
  pos: Implicant[];
  /** SOP 表达式，如 "B + C"；常量函数为 "1" / "0" */
  sopExpression: string;
  /** POS 表达式，如 "(A+B')(C+D)"；常量函数为 "1" / "0" */
  posExpression: string;
  /** 基于 SOP 两级电路的门数统计 */
  gateStats: GateStats;
}

/** 固定变量名，下标即变量编号（0 → A） */
const VARIABLE_NAMES = ['A', 'B', 'C', 'D'] as const;

/** 支持的变量数范围 */
const MIN_VARS = 2;
const MAX_VARS = 4;

/**
 * 取变量编号对应的变量名
 *
 * @param index - 变量编号，0 对应 A
 * @returns 变量名字符
 * @throws 编号越界时抛出错误
 */
function variableName(index: number): string {
  const name = VARIABLE_NAMES[index];
  if (name === undefined) {
    throw new Error(`变量编号 ${index} 越界`);
  }
  return name;
}

/**
 * 校验变量数是否为 2–4 的整数
 *
 * @param varCount - 变量数
 * @throws 非法变量数时抛出错误
 */
function assertVarCount(varCount: number): void {
  if (!Number.isInteger(varCount) || varCount < MIN_VARS || varCount > MAX_VARS) {
    throw new Error(`变量数必须是 ${MIN_VARS}–${MAX_VARS} 之间的整数，当前为 ${varCount}`);
  }
}

/**
 * 校验最小项编号集合
 *
 * @param terms - 最小项编号数组
 * @param varCount - 变量数
 * @throws 编号非整数或越界时抛出错误
 */
function assertTerms(terms: number[], varCount: number): void {
  const max = (1 << varCount) - 1;
  for (const term of terms) {
    if (!Number.isInteger(term) || term < 0 || term > max) {
      throw new Error(`最小项编号 ${term} 超出 ${varCount} 变量合法范围（0–${max}）`);
    }
  }
}

/** 判断字符是否为 ASCII 数字 */
function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

/**
 * 解析 Σm 记号字符串，如 `Σm(1,3,5,7)+d(4,6)`。
 *
 * 容忍空格、全角逗号 / 括号、大小写 m/d 以及可选的 Σ 前缀；d(...) 分组可缺省。
 *
 * @param input - 原始输入字符串
 * @param varCount - 变量数，决定合法编号上限
 * @returns 解析出的 1 集合与无关项集合
 * @throws 语法错误、编号非数字或越界（≥ 2^n）时抛出带 1 基位置信息的错误
 */
export function parseMintermString(input: string, varCount: number): ParsedMintermString {
  assertVarCount(varCount);
  const max = (1 << varCount) - 1;
  const ones: number[] = [];
  const dontCares: number[] = [];
  const length = input.length;
  let index = 0;
  let sawGroup = false;

  /** 跳过空白字符（含全角空格） */
  const skipSpaces = (): void => {
    while (index < length && /\s/.test(input[index] as string)) {
      index += 1;
    }
  };

  while (index < length) {
    skipSpaces();
    if (index >= length) {
      break;
    }
    if (sawGroup) {
      if (input[index] !== '+') {
        throw new Error(`第 ${index + 1} 位附近：分组之间需要用 "+" 连接`);
      }
      index += 1;
      skipSpaces();
    }
    // 可选的 Σ / ∑ 前缀
    if (input[index] === 'Σ' || input[index] === '∑') {
      index += 1;
      skipSpaces();
    }
    const letter = input[index];
    if (letter !== 'm' && letter !== 'M' && letter !== 'd' && letter !== 'D') {
      throw new Error(`第 ${index + 1} 位附近：期望分组标识 m 或 d，实际得到 "${letter ?? '空'}"`);
    }
    const isDontCare = letter === 'd' || letter === 'D';
    index += 1;
    skipSpaces();
    if (input[index] !== '(' && input[index] !== '（') {
      throw new Error(`第 ${index + 1} 位附近：期望左括号 "("`);
    }
    index += 1;

    const target = isDontCare ? dontCares : ones;
    let expectNumber = true;
    while (true) {
      skipSpaces();
      if (expectNumber) {
        const numberStart = index;
        while (index < length && isDigit(input[index] as string)) {
          index += 1;
        }
        if (index === numberStart) {
          throw new Error(`第 ${numberStart + 1} 位附近：期望 0–${max} 的最小项编号`);
        }
        const number = Number(input.slice(numberStart, index));
        if (number > max) {
          throw new Error(
            `第 ${numberStart + 1} 位附近：编号 ${number} 超出 ${varCount} 变量合法范围（0–${max}）`,
          );
        }
        if (!target.includes(number)) {
          target.push(number);
        }
        expectNumber = false;
      }
      skipSpaces();
      const separator = input[index];
      if (separator === ',' || separator === '，') {
        index += 1;
        expectNumber = true;
        continue;
      }
      if (separator === ')' || separator === '）') {
        index += 1;
        break;
      }
      throw new Error(
        `第 ${index + 1} 位附近：期望逗号分隔或右括号 ")"，实际得到 "${separator ?? '空'}"`,
      );
    }
    sawGroup = true;
  }

  if (!sawGroup) {
    throw new Error('未找到有效的 m(...) 或 d(...) 分组');
  }
  for (const term of ones) {
    if (dontCares.includes(term)) {
      throw new Error(`最小项 ${term} 同时出现在 m(...) 与 d(...) 中，取值冲突`);
    }
  }
  return {
    ones: [...ones].sort((a, b) => a - b),
    dontCares: [...dontCares].sort((a, b) => a - b),
  };
}

/** QM 合并过程中的中间分组 */
interface QmGroup {
  /** 组内全部最小项 */
  terms: number[];
  /** 固定位掩码 */
  mask: number;
  /** 固定位取值 */
  value: number;
  /** 本轮是否已被更大的组合并 */
  used: boolean;
}

/**
 * 由掩码与取值构造字面量数组（变量编号 0 → A，按 A/B/C/D 顺序）
 *
 * @param mask - 固定位掩码
 * @param value - 固定位取值
 * @param varCount - 变量数
 * @returns 字面量数组，固定位为 0 输出反变量（带 "'" 后缀）
 */
function buildLiterals(mask: number, value: number, varCount: number): string[] {
  const literals: string[] = [];
  for (let variable = 0; variable < varCount; variable += 1) {
    const bit = 1 << (varCount - 1 - variable);
    // mask 为 1 表示该变量固定：固定值 1 输出原变量，固定值 0 输出反变量
    if ((mask & bit) !== 0) {
      literals.push(variableName(variable) + ((value & bit) !== 0 ? '' : "'"));
    }
  }
  return literals;
}

/** 将 QM 中间分组转换为对外蕴涵项结构 */
function toImplicant(group: QmGroup, varCount: number): Implicant {
  return {
    minterms: [...group.terms].sort((a, b) => a - b),
    mask: group.mask,
    value: group.value,
    literals: buildLiterals(group.mask, group.value, varCount),
  };
}

/**
 * 求全部质蕴涵项：在 ones ∪ dontCares 上按 1 位差异递归合并，
 * 每一轮中未被合并的分组即为质蕴涵项。
 *
 * @param ones - 值为 1 的最小项编号
 * @param dontCares - 无关项最小项编号（参与合并但不要求被覆盖）
 * @param varCount - 变量数（2–4）
 * @returns 全部质蕴涵项，按掩码、取值升序保证确定性
 * @throws 输入编号非法时抛出错误
 */
export function findPrimeImplicants(
  ones: number[],
  dontCares: number[],
  varCount: number,
): Implicant[] {
  assertVarCount(varCount);
  assertTerms(ones, varCount);
  assertTerms(dontCares, varCount);

  const terms = [...new Set<number>([...ones, ...dontCares])].sort((a, b) => a - b);
  if (terms.length === 0) {
    return [];
  }

  const allBits = (1 << varCount) - 1;

  // 约定：mask 中为 1 的位表示该变量固定（未消除），为 0 表示已合并消除。
  // 单个最小项时全部 n 位都固定，value 即最小项编号；value 只在固定位上有效。
  let level: QmGroup[] = terms.map((term) => ({
    terms: [term],
    mask: allBits,
    value: term,
    used: false,
  }));
  const primes: QmGroup[] = [];

  /** 统计整数二进制中 1 的位数 */
  const popCount = (bits: number): number => {
    let remaining = bits;
    let count = 0;
    while (remaining > 0) {
      count += remaining & 1;
      remaining >>= 1;
    }
    return count;
  };

  while (level.length > 0) {
    const merged: QmGroup[] = [];
    const mergedKeys = new Set<string>();
    // 每轮使用全新的使用标记，避免上一轮残留状态阻断后续合并
    const current = level.map((group) => ({ ...group, used: false }));
    // 经典 QM 按固定位中取值为 1 的个数分层，仅相邻层之间允许合并
    const layers = new Map<number, QmGroup[]>();
    for (const group of current) {
      // 组内最小项仅在已消除位（0/1 两种取值）上不同，其总 1 数并不恒定，
      // 故取组内最小 popcount 作为层键：合并总是把某 1 位降为 0，层级恰好相邻
      const layer = Math.min(...group.terms.map((term) => popCount(term)));
      const bucket = layers.get(layer);
      if (bucket === undefined) {
        layers.set(layer, [group]);
      } else {
        bucket.push(group);
      }
    }
    for (const [layerIndex, lower] of layers) {
      const upper = layers.get(layerIndex + 1);
      if (upper === undefined) {
        continue;
      }
      for (const left of lower) {
        for (const right of upper) {
          if (left.mask !== right.mask) {
            continue;
          }
          // 相邻层 + 同掩码的两组，其固定位取值必然一致；
          // 只需在仍固定的位上恰好相差 1 位即可合并
          const xor = left.value ^ right.value;
          const diff = xor & left.mask;
          if (diff === 0 || (diff & (diff - 1)) !== 0 || (xor & ~left.mask & allBits) !== 0) {
            continue;
          }
          left.used = true;
          right.used = true;
          // 合并后差异位转为已消除：固定位掩码清掉该位，value 同步清零
          const nextMask = left.mask & ~diff;
          const nextValue = left.value & nextMask;
          const key = `${nextMask}:${nextValue}`;
          if (!mergedKeys.has(key)) {
            mergedKeys.add(key);
            merged.push({
              terms: [...left.terms, ...right.terms].sort((a, b) => a - b),
              mask: nextMask,
              value: nextValue,
              used: false,
            });
          }
        }
      }
    }
    for (const group of current) {
      if (!group.used) {
        primes.push(group);
      }
    }
    level = merged;
  }

  // 排序键：固定位多（字面量多）的项在前，固定位取值升序，保证输出确定性
  return primes
    .map((group) => toImplicant(group, varCount))
    .sort((a, b) => b.mask - a.mask || a.value - b.value);
}

/**
 * 在质蕴涵项中选取覆盖全部 ones 的最小集合。
 *
 * 先选取本质质蕴涵项（唯一覆盖某个 1 最小项的 PI），再对剩余未覆盖项做确定性贪心：
 * 覆盖未覆盖项最多 → 字面量最少 → 掩码数值最小 → 取值数值最小。
 *
 * @param primeImplicants - 全部质蕴涵项
 * @param ones - 必须被覆盖的 1 最小项
 * @returns 选中的质蕴涵项数组；ones 为空时返回空数组
 */
export function selectMinimumCover(
  primeImplicants: Implicant[],
  ones: number[],
): Implicant[] {
  if (ones.length === 0) {
    return [];
  }
  const sortedOnes = [...ones].sort((a, b) => a - b);
  const selected: Implicant[] = [];
  const covered = new Set<number>();

  const addCover = (implicant: Implicant): void => {
    if (!selected.includes(implicant)) {
      selected.push(implicant);
    }
    for (const term of implicant.minterms) {
      covered.add(term);
    }
  };

  // 第一步：本质质蕴涵项
  for (const minterm of sortedOnes) {
    if (covered.has(minterm)) {
      continue;
    }
    const owners = primeImplicants.filter((implicant) =>
      implicant.minterms.includes(minterm),
    );
    if (owners.length === 1) {
      addCover(owners[0] as Implicant);
    }
  }

  // 第二步：确定性贪心覆盖剩余最小项
  let remaining = sortedOnes.filter((minterm) => !covered.has(minterm));
  while (remaining.length > 0) {
    let best: Implicant | null = null;
    let bestCount = -1;
    for (const implicant of primeImplicants) {
      const count = remaining.filter((minterm) =>
        implicant.minterms.includes(minterm),
      ).length;
      if (count === 0) {
        continue;
      }
      const current = best;
      const better =
        current === null ||
        count > bestCount ||
        (count === bestCount && implicant.literals.length < current.literals.length) ||
        (count === bestCount &&
          implicant.literals.length === current.literals.length &&
          implicant.mask < current.mask) ||
        (count === bestCount &&
          implicant.literals.length === current.literals.length &&
          implicant.mask === current.mask &&
          implicant.value < current.value);
      if (better) {
        best = implicant;
        bestCount = count;
      }
    }
    // 每个 one 至少被一个质蕴涵项覆盖，best 不可能为 null
    addCover(best as Implicant);
    remaining = sortedOnes.filter((minterm) => !covered.has(minterm));
  }

  return selected;
}

/** 取字面量的变量编号（A → 0） */
function literalVariableIndex(literal: string): number {
  return literal.charCodeAt(0) - 'A'.charCodeAt(0);
}

/**
 * 表达式展示顺序比较器：按变量编号 A→D 字典序，同变量原变量优先于反变量，
 * 前缀相同时短项优先，保证输出稳定可读。
 */
function compareForExpression(a: Implicant, b: Implicant): number {
  const shared = Math.min(a.literals.length, b.literals.length);
  for (let i = 0; i < shared; i += 1) {
    const left = a.literals[i] as string;
    const right = b.literals[i] as string;
    const leftIndex = literalVariableIndex(left);
    const rightIndex = literalVariableIndex(right);
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    const leftNegated = left.endsWith("'") ? 1 : 0;
    const rightNegated = right.endsWith("'") ? 1 : 0;
    if (leftNegated !== rightNegated) {
      return leftNegated - rightNegated;
    }
  }
  return a.literals.length - b.literals.length;
}

/**
 * 格式化单个 SOP 乘积项；空字面量项表示常量 1
 *
 * @param literals - 字面量数组
 * @returns 乘积项文本，如 "AB'"
 */
function formatProductTerm(literals: string[]): string {
  return literals.length === 0 ? '1' : literals.join('');
}

/**
 * 格式化单个 POS 和项；空字面量项表示常量 0
 *
 * @param literals - 字面量数组
 * @returns 和项文本，如 "(A+B')"
 */
function formatSumTerm(literals: string[]): string {
  return literals.length === 0 ? '0' : `(${literals.join('+')})`;
}

/**
 * 基于 SOP 结果统计两级与或电路的门数与字面量
 *
 * @param sop - SOP 乘积项
 * @returns 门电路统计
 */
function computeGateStats(sop: Implicant[]): GateStats {
  const literals = sop.reduce((sum, term) => sum + term.literals.length, 0);
  const negatedVariables = new Set<number>();
  for (const term of sop) {
    for (const literal of term.literals) {
      if (literal.endsWith("'")) {
        negatedVariables.add(literalVariableIndex(literal));
      }
    }
  }
  return {
    andGates: sop.filter((term) => term.literals.length >= 2).length,
    orGates: sop.length >= 2 ? 1 : 0,
    notGates: negatedVariables.size,
    literals,
  };
}

/**
 * 卡诺图化简主入口，同时给出 SOP 与 POS。
 *
 * POS 求解：对 0 集合（含无关项）跑同一套 QM 得到零值乘积项，
 * 再按德摩根定律将每个字面量取反转换为和项。
 *
 * @param input - 长度为 2^n 的单元格数组，或 `{ ones, dontCares }` 编号集合
 * @param varCount - 变量数（2–4）
 * @returns SOP/POS 蕴涵项、表达式文本与门数统计
 * @throws 变量数非法、输入长度不符、空映射或仅含无关项时抛出明确错误
 */
export function simplifyKmap(input: KmapInput, varCount: number): SimplifyResult {
  assertVarCount(varCount);
  const size = 1 << varCount;

  let ones: number[];
  let dontCares: number[];
  if (Array.isArray(input)) {
    if (input.length !== size) {
      throw new Error(`单元格数量应为 ${size}，实际为 ${input.length}`);
    }
    ones = [];
    dontCares = [];
    input.forEach((cell, index) => {
      if (cell === 1) {
        ones.push(index);
      } else if (cell === 'x') {
        dontCares.push(index);
      }
    });
  } else {
    ones = [...input.ones];
    dontCares = [...input.dontCares];
    assertTerms(ones, varCount);
    assertTerms(dontCares, varCount);
  }

  if (ones.length === 0 && dontCares.length === 0) {
    if (Array.isArray(input)) {
      // 全 0 映射
      const zeroTerm: Implicant = {
        minterms: Array.from({ length: size }, (_, index) => index),
        mask: 0,
        value: 0,
        literals: [],
      };
      return {
        sop: [],
        pos: [zeroTerm],
        sopExpression: '0',
        posExpression: '0',
        gateStats: { andGates: 0, orGates: 0, notGates: 0, literals: 0 },
      };
    }
    throw new Error('空映射：未提供任何值为 1 的最小项，无法化简');
  }
  if (ones.length === 0) {
    throw new Error('仅提供无关项时逻辑函数无法唯一确定，请至少标记一个值为 1 的最小项');
  }

  const oneSet = new Set(ones);
  const dontCareSet = new Set(dontCares);
  const zeros: number[] = [];
  for (let minterm = 0; minterm < size; minterm += 1) {
    if (!oneSet.has(minterm) && !dontCareSet.has(minterm)) {
      zeros.push(minterm);
    }
  }

  // 没有任何 0 约束：所有指定单元格均为 1，常量函数 1
  if (zeros.length === 0) {
    const oneTerm: Implicant = {
      minterms: Array.from({ length: size }, (_, index) => index),
      mask: 0,
      value: 0,
      literals: [],
    };
    return {
      sop: [oneTerm],
      pos: [],
      sopExpression: '1',
      posExpression: '1',
      gateStats: { andGates: 0, orGates: 0, notGates: 0, literals: 0 },
    };
  }

  const sopPrimes = findPrimeImplicants(ones, dontCares, varCount);
  const sop = selectMinimumCover(sopPrimes, ones).sort(compareForExpression);

  const zeroPrimes = findPrimeImplicants(zeros, dontCares, varCount);
  const zeroCover = selectMinimumCover(zeroPrimes, zeros);
  const pos: Implicant[] = zeroCover
    .map((implicant) => ({
      ...implicant,
      // 德摩根定律：零值乘积项中的字面量整体取反后成为和项
      literals: implicant.literals.map((literal) =>
        literal.endsWith("'") ? literal.slice(0, -1) : `${literal}'`,
      ),
    }))
    .sort(compareForExpression);

  const sopExpression = sop.map((term) => formatProductTerm(term.literals)).join(' + ');
  const posExpression = pos.map((term) => formatSumTerm(term.literals)).join('');

  return {
    sop,
    pos,
    sopExpression,
    posExpression,
    gateStats: computeGateStats(sop),
  };
}

/**
 * 计算单个字面量在给定最小项取值下的真假
 *
 * @param literal - 字面量，如 "A" 或 "B'"
 * @param minterm - 最小项编号（A 为最高位）
 * @param varCount - 变量数
 * @returns 字面量真值
 */
function evaluateLiteral(literal: string, minterm: number, varCount: number): boolean {
  const variable = literalVariableIndex(literal);
  const bit = 1 << (varCount - 1 - variable);
  const present = (minterm & bit) !== 0;
  return literal.endsWith("'") ? !present : present;
}

/**
 * 代入 SOP 表达式求值（乘积项之间为或）。
 * 空数组视为常量 0；含空字面量项视为常量 1。
 *
 * @param sop - SOP 乘积项
 * @param minterm - 输入最小项编号
 * @param varCount - 变量数
 * @returns 函数真值
 */
export function evaluateSop(sop: Implicant[], minterm: number, varCount: number): boolean {
  if (sop.length === 0) {
    return false;
  }
  return sop.some(
    (term) =>
      term.literals.length === 0 ||
      term.literals.every((literal) => evaluateLiteral(literal, minterm, varCount)),
  );
}

/**
 * 代入 POS 表达式求值（和项之间为与）。
 * 空数组视为常量 1；含空字面量和项视为常量 0。
 *
 * @param pos - POS 和项
 * @param minterm - 输入最小项编号
 * @param varCount - 变量数
 * @returns 函数真值
 */
export function evaluatePos(pos: Implicant[], minterm: number, varCount: number): boolean {
  if (pos.length === 0) {
    return true;
  }
  return pos.every((term) =>
    term.literals.length === 0
      ? false
      : term.literals.some((literal) => evaluateLiteral(literal, minterm, varCount)),
  );
}
