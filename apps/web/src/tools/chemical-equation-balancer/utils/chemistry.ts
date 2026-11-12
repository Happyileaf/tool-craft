/**
 * 化学方程式解析、配平与化学计量纯函数。
 * 支持括号嵌套、水合点（· / *）与下标数字；配平采用 BigInt 分数高斯-约当消元
 * 求齐次线性方程组的零空间，再整数化得到最小正整数系数。零外部依赖。
 */

/** 常见元素相对原子质量（IUPAC 常用约定值，覆盖中学/大学常见元素） */
const ATOMIC_MASS: Record<string, number> = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ar: 39.948,
  Ca: 40.078,
  Sc: 44.956,
  Ti: 47.867,
  V: 50.942,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Co: 58.933,
  Ni: 58.693,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  Ge: 72.63,
  As: 74.922,
  Se: 78.971,
  Br: 79.904,
  Kr: 83.798,
  Rb: 85.468,
  Sr: 87.62,
  Y: 88.906,
  Zr: 91.224,
  Nb: 92.906,
  Mo: 95.95,
  Ag: 107.868,
  Cd: 112.414,
  In: 114.818,
  Sn: 118.71,
  Sb: 121.76,
  Te: 127.6,
  I: 126.904,
  Xe: 131.293,
  Cs: 132.905,
  Ba: 137.327,
  W: 183.84,
  Pt: 195.084,
  Au: 196.967,
  Hg: 200.592,
  Pb: 207.2,
  Bi: 208.98,
};

/** 标准状况（0 ℃、101.325 kPa）下理想气体摩尔体积，单位 L/mol */
export const STP_GAS_MOLAR_VOLUME = 22.4;

/** 化学式解析结果 */
export interface FormulaParseResult {
  /** 是否成功 */
  ok: boolean;
  /** 元素 → 原子个数 */
  composition?: Record<string, number>;
  /** 摩尔质量（g/mol） */
  molarMass?: number;
  /** 失败时的错误信息 */
  error?: string;
}

/** 方程式解析结果 */
export interface EquationParseResult {
  /** 是否成功 */
  ok: boolean;
  /** 左侧物种（原始化学式） */
  reactants?: string[];
  /** 右侧物种 */
  products?: string[];
  /** 失败时的错误信息 */
  error?: string;
}

/** 配平结果 */
export interface BalanceResult {
  /** 是否成功 */
  ok: boolean;
  /** 全部物种（左 + 右，原始化学式） */
  species?: string[];
  /** 与 species 对齐的配平系数 */
  coefficients?: number[];
  /** 左侧物种数量 */
  reactantCount?: number;
  /** 每个物种的摩尔质量（g/mol），与 species 对齐 */
  molarMasses?: number[];
  /** 配平后的可读方程式 */
  balancedEquation?: string;
  /** 失败时的错误信息 */
  error?: string;
}

/** BigInt 分数（分子/分母均为 BigInt，分母恒正） */
class Fraction {
  num: bigint;

  den: bigint;

  constructor(num: bigint, den: bigint = BigInt(1)) {
    if (den === BigInt(0)) {
      throw new Error('分数分母为 0');
    }
    if (den < BigInt(0)) {
      num = -num;
      den = -den;
    }
    const divisor = gcdAbs(num, den);
    this.num = num / divisor;
    this.den = den / divisor;
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den + other.num * this.den,
      this.den * other.den,
    );
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  negate(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  isZero(): boolean {
    return this.num === BigInt(0);
  }
}

/** 绝对值最大公约数 */
function gcdAbs(a: bigint, b: bigint): bigint {
  let x = a < BigInt(0) ? -a : a;
  let y = b < BigInt(0) ? -b : b;
  while (y !== BigInt(0)) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === BigInt(0) ? BigInt(1) : x;
}

/** 最小公倍数 */
function lcm(a: bigint, b: bigint): bigint {
  return (a / gcdAbs(a, b)) * b;
}

/**
 * 解析单个化学式为元素组成。
 * 支持元素符号、括号嵌套、下标数字与水合点（CuSO4·5H2O）。
 *
 * @param formula - 化学式文本
 * @returns 解析结果
 */
export function parseFormula(formula: string): FormulaParseResult {
  const text = formula.replace(/\s+/g, '');
  if (text === '') {
    return { ok: false, error: '化学式为空' };
  }

  // 水合点拆分为若干加和项，每项可带倍数（如 5H2O）
  const hydrateParts = text.split(/[·•*]/);
  const total: Record<string, number> = {};

  for (const part of hydrateParts) {
    const leading = /^(\d+)(?=[A-Z(])/.exec(part);
    const multiplier = leading ? Number(leading[1]) : 1;
    const body = leading ? part.slice(leading[0].length) : part;
    const parsed = parseSegment(body);
    if (!parsed.ok) {
      return parsed;
    }
    if (!parsed.composition) {
      return { ok: false, error: `「${formula}」解析失败` };
    }
    for (const [element, count] of Object.entries(parsed.composition)) {
      total[element] = (total[element] ?? 0) + count * multiplier;
    }
  }

  let molarMass = 0;
  for (const [element, count] of Object.entries(total)) {
    const mass = ATOMIC_MASS[element];
    if (mass === undefined) {
      return { ok: false, error: `元素「${element}」不在内置原子质量表中` };
    }
    molarMass += mass * count;
  }

  return {
    ok: true,
    composition: total,
    molarMass: Number(molarMass.toFixed(4)),
  };
}

/**
 * 递归解析不含水合点的化学式段，支持圆括号嵌套与下标。
 *
 * @param segment - 化学式段
 * @returns 元素组成或错误
 */
function parseSegment(segment: string): FormulaParseResult {
  let index = 0;

  const readSubscript = (): number => {
    let digits = '';
    while (index < segment.length && /\d/.test(segment[index] ?? '')) {
      digits += segment[index];
      index += 1;
    }
    return digits === '' ? 1 : Number(digits);
  };

  /** 解析一个括号组，遇到匹配的右括号或串尾停止 */
  const readGroup = (): FormulaParseResult => {
    const composition: Record<string, number> = {};
    while (index < segment.length) {
      const char = segment[index] ?? '';
      if (char === ')') {
        return { ok: true, composition };
      }
      if (char === '(') {
        index += 1;
        const inner = readGroup();
        if (!inner.ok || !inner.composition) {
          return inner;
        }
        if (segment[index] !== ')') {
          return { ok: false, error: '括号不匹配：缺少右括号「)」' };
        }
        index += 1;
        const subscript = readSubscript();
        for (const [element, count] of Object.entries(inner.composition)) {
          composition[element] = (composition[element] ?? 0) + count * subscript;
        }
      } else if (/[A-Z]/.test(char)) {
        let symbol = char;
        index += 1;
        if (index < segment.length && /[a-z]/.test(segment[index] ?? '')) {
          symbol += segment[index];
          index += 1;
        }
        if (ATOMIC_MASS[symbol] === undefined) {
          return { ok: false, error: `未知元素符号「${symbol}」` };
        }
        const subscript = readSubscript();
        composition[symbol] = (composition[symbol] ?? 0) + subscript;
      } else {
        return { ok: false, error: `化学式中出现意外字符「${char}」` };
      }
    }
    return { ok: true, composition };
  };

  const result = readGroup();
  if (!result.ok) {
    return result;
  }
  if (index !== segment.length) {
    return { ok: false, error: '括号不匹配：存在多余的右括号「)」' };
  }
  if (!result.composition || Object.keys(result.composition).length === 0) {
    return { ok: false, error: '化学式中未找到任何元素' };
  }
  return result;
}

/**
 * 解析完整方程式文本，按箭头/等号分左右、加号分物种。
 *
 * @param equation - 方程式文本
 * @returns 左右物种列表或错误
 */
export function parseEquation(equation: string): EquationParseResult {
  const normalized = equation.replace(/→/g, '->').replace(/＝/g, '=');
  const arrowMatch = /\s*(?:->|=|⇌|⇋)\s*/.exec(normalized);
  if (!arrowMatch) {
    return { ok: false, error: '方程式缺少箭头「->」或等号「=」分隔反应物与生成物' };
  }
  const left = normalized.slice(0, arrowMatch.index).trim();
  const right = normalized.slice((arrowMatch.index ?? 0) + arrowMatch[0].length).trim();

  const splitSide = (side: string): string[] =>
    side
      .split('+')
      .map((species) => species.trim().replace(/^\d+(?=[A-Z(])/, ''))
      .filter((species) => species !== '');

  const reactants = splitSide(left);
  const products = splitSide(right);

  if (reactants.length === 0 || products.length === 0) {
    return { ok: false, error: '箭头两侧都必须至少包含一个物种' };
  }

  const all = [...reactants, ...products];
  const duplicate = all.find(
    (species, i) => all.findIndex((other) => other === species) !== i,
  );
  if (duplicate) {
    return { ok: false, error: `物种「${duplicate}」在方程式中重复出现，请先合并` };
  }

  return { ok: true, reactants, products };
}

/**
 * 配平化学方程式：建立元素守恒齐次方程组（生成物取负号），
 * 用分数 RREF 求零空间，要求零空间维数恰好为 1，再整数化。
 *
 * @param equation - 未配平的方程式文本
 * @returns 最小正整数系数与配平方程式，或错误信息
 */
export function balanceEquation(equation: string): BalanceResult {
  const parsed = parseEquation(equation);
  if (!parsed.ok || !parsed.reactants || !parsed.products) {
    return { ok: false, error: parsed.error };
  }

  const reactants = parsed.reactants;
  const products = parsed.products;
  const species = [...reactants, ...products];
  const reactantCount = reactants.length;

  const compositions: Record<string, number>[] = [];
  const molarMasses: number[] = [];
  for (const formula of species) {
    const result = parseFormula(formula);
    if (!result.ok || !result.composition || result.molarMass === undefined) {
      return { ok: false, error: `「${formula}」解析失败：${result.error ?? '未知错误'}` };
    }
    compositions.push(result.composition);
    molarMasses.push(result.molarMass);
  }

  const elements = Array.from(
    new Set(compositions.flatMap((composition) => Object.keys(composition))),
  ).sort();

  // 守恒检查：每个元素都必须同时出现在箭头两侧
  for (const element of elements) {
    const onLeft = reactants.some(
      (_, i) => (compositions[i]?.[element] ?? 0) > 0,
    );
    const onRight = products.some(
      (_, i) => (compositions[reactantCount + i]?.[element] ?? 0) > 0,
    );
    if (!onLeft || !onRight) {
      return {
        ok: false,
        error: `元素「${element}」只出现在方程式的一侧，无法满足元素守恒`,
      };
    }
  }

  const rowCount = elements.length;
  const colCount = species.length;
  const matrix: Fraction[][] = elements.map((element, row) =>
    species.map((_, col) => {
      const count = compositions[col]?.[element] ?? 0;
      const signed = col < reactantCount ? count : -count;
      return new Fraction(BigInt(signed));
    }),
  );

  const nullVector = solveNullSpace(matrix, rowCount, colCount);
  if (!nullVector) {
    return { ok: false, error: '方程组无解或存在多组独立解，无法唯一配平该方程式' };
  }

  // 整数化：所有分母的 LCM
  let denominatorLcm = BigInt(1);
  for (const fraction of nullVector) {
    denominatorLcm = lcm(denominatorLcm, fraction.den);
  }
  const integers = nullVector.map((fraction) =>
    Number((fraction.num * denominatorLcm) / fraction.den),
  );

  if (integers.some((value) => value <= 0)) {
    return { ok: false, error: '配平出现非正系数，请检查物种是否写在箭头正确的一侧' };
  }

  const gcdAll = integers.reduce((acc, value) => gcdNumber(acc, value));
  const coefficients = integers.map((value) => value / gcdAll);

  return {
    ok: true,
    species,
    coefficients,
    reactantCount,
    molarMasses,
    balancedEquation: renderEquation(species, coefficients, reactantCount),
  };
}

/**
 * 分数高斯-约当消元求矩阵零空间的一组基。
 * 仅当零空间维数恰好为 1 时返回该向量，否则返回 null。
 *
 * @param matrix - 分数矩阵（会被原地变换）
 * @param rowCount - 行数
 * @param colCount - 列数
 * @returns 唯一零空间向量或 null
 */
function solveNullSpace(
  matrix: Fraction[][],
  rowCount: number,
  colCount: number,
): Fraction[] | null {
  const pivotCols: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < colCount && pivotRow < rowCount; col += 1) {
    let candidate = -1;
    for (let row = pivotRow; row < rowCount; row += 1) {
      if (!matrix[row]?.[col]?.isZero()) {
        candidate = row;
        break;
      }
    }
    if (candidate === -1) {
      continue;
    }

    const swap = matrix[pivotRow];
    const candidateRow = matrix[candidate];
    if (!swap || !candidateRow) {
      return null;
    }
    matrix[pivotRow] = candidateRow;
    matrix[candidate] = swap;

    const pivot = matrix[pivotRow]?.[col];
    if (!pivot) {
      return null;
    }
    for (let j = 0; j < colCount; j += 1) {
      const cell = matrix[pivotRow]?.[j];
      if (cell) {
        matrix[pivotRow]![j] = cell.multiply(new Fraction(pivot.den, pivot.num));
      }
    }

    for (let row = 0; row < rowCount; row += 1) {
      if (row === pivotRow) {
        continue;
      }
      const factor = matrix[row]?.[col];
      if (!factor || factor.isZero()) {
        continue;
      }
      for (let j = 0; j < colCount; j += 1) {
        const target = matrix[row]?.[j];
        const pivotCell = matrix[pivotRow]?.[j];
        if (target && pivotCell) {
          matrix[row]![j] = target.add(factor.multiply(pivotCell).negate());
        }
      }
    }

    pivotCols.push(col);
    pivotRow += 1;
  }

  const freeCols: number[] = [];
  for (let col = 0; col < colCount; col += 1) {
    if (!pivotCols.includes(col)) {
      freeCols.push(col);
    }
  }

  if (freeCols.length !== 1) {
    return null;
  }

  const freeCol = freeCols[0] ?? 0;
  const vector: Fraction[] = Array.from(
    { length: colCount },
    () => new Fraction(BigInt(0)),
  );
  vector[freeCol] = new Fraction(BigInt(1));

  for (let row = 0; row < pivotCols.length; row += 1) {
    const pivotCol = pivotCols[row];
    if (pivotCol === undefined) {
      continue;
    }
    const coefficient = matrix[row]?.[freeCol];
    vector[pivotCol] = coefficient ? coefficient.negate() : new Fraction(BigInt(0));
  }

  return vector;
}

/** 数字版最大公约数 */
function gcdNumber(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === 0 ? 1 : x;
}

/**
 * 把系数与物种渲染为可读方程式（系数 1 省略）。
 *
 * @param species - 物种列表
 * @param coefficients - 配平系数
 * @param reactantCount - 左侧物种数
 * @returns 配平后的方程式文本
 */
export function renderEquation(
  species: string[],
  coefficients: number[],
  reactantCount: number,
): string {
  const term = (index: number): string => {
    const coefficient = coefficients[index] ?? 1;
    return `${coefficient === 1 ? '' : coefficient}${species[index] ?? ''}`;
  };
  const left = species.slice(0, reactantCount).map((_, i) => term(i)).join(' + ');
  const right = species
    .slice(reactantCount)
    .map((_, i) => term(reactantCount + i))
    .join(' + ');
  return `${left} -> ${right}`;
}

/** 单个物种的计量换算结果 */
export interface StoichRow {
  /** 物种化学式 */
  species: string;
  /** 配平系数 */
  coefficient: number;
  /** 摩尔质量 g/mol */
  molarMass: number;
  /** 物质的量 mol */
  moles: number;
  /** 质量 g */
  mass: number;
  /** 标况气体体积 L（仅气态物种有意义，UI 决定是否展示） */
  gasVolume: number;
}

/**
 * 给定某物种的物质的量，按配平系数比换算全部物种的物质的量、质量与标况体积。
 *
 * @param result - 配平结果
 * @param speciesIndex - 已知物种下标
 * @param moles - 已知物种的物质的量（mol）
 * @returns 与 species 对齐的计量行
 */
export function stoichiometryFromMoles(
  result: BalanceResult,
  speciesIndex: number,
  moles: number,
): StoichRow[] {
  if (!result.ok || !result.species || !result.coefficients || !result.molarMasses) {
    return [];
  }
  const referenceCoefficient = result.coefficients[speciesIndex];
  if (!referenceCoefficient || referenceCoefficient <= 0) {
    return [];
  }
  const ratio = moles / referenceCoefficient;
  return result.species.map((species, index) => {
    const coefficient = result.coefficients?.[index] ?? 0;
    const molarMass = result.molarMasses?.[index] ?? 0;
    const speciesMoles = ratio * coefficient;
    return {
      species,
      coefficient,
      molarMass,
      moles: speciesMoles,
      mass: speciesMoles * molarMass,
      gasVolume: speciesMoles * STP_GAS_MOLAR_VOLUME,
    };
  });
}

/**
 * 由质量（g）与摩尔质量求物质的量（mol）。
 *
 * @param mass - 质量
 * @param molarMass - 摩尔质量
 * @returns 物质的量
 */
export function molesFromMass(mass: number, molarMass: number): number {
  if (molarMass <= 0) {
    return 0;
  }
  return mass / molarMass;
}
