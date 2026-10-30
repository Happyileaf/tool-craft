/**
 * 解三角形（零依赖纯函数）
 *
 * 支持的已知条件类型：
 * - SSS：三边（side-side-side），余弦定理求角
 * - SAS：两边及夹角，余弦定理求第三边
 * - ASA：两角及夹边，正弦定理
 * - AAS：两角及非夹边，正弦定理
 * - SSA：两边及非夹角，正弦定理，可能存在 0 / 1 / 2 个解（两解歧义）
 *
 * 角度输入输出均为角度制（°），内部统一转弧度计算。
 */

export type TriangleMode = 'SSS' | 'SAS' | 'ASA' | 'AAS' | 'SSA';

export interface TriangleInput {
  mode: TriangleMode;
  /** 边 a（角 A 的对边） */
  a?: number;
  /** 边 b（角 B 的对边） */
  b?: number;
  /** 边 c（角 C 的对边） */
  c?: number;
  /** 角 A，单位：度 */
  A?: number;
  /** 角 B，单位：度 */
  B?: number;
  /** 角 C，单位：度 */
  C?: number;
}

export interface TriangleSolution {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
  area: number;
  perimeter: number;
}

export interface TriangleResult {
  solutions: TriangleSolution[];
  /** 是否命中 SSA 两解歧义 */
  ambiguous: boolean;
}

const DEG = Math.PI / 180;
const EPS = 1e-9;

function toRad(deg: number): number {
  return deg * DEG;
}

function toDeg(rad: number): number {
  return rad / DEG;
}

/** 校验已知量均为有限正数，缺失或非正抛错 */
function requirePositive(values: Array<[number | undefined, string]>): number[] {
  return values.map(([value, label]) => {
    if (value === undefined || !Number.isFinite(value)) {
      throw new Error(`请填写${label}`);
    }
    if (value <= 0) {
      throw new Error(`${label}必须为正数`);
    }
    return value;
  });
}

/** 余弦定理：由三边求某边的对角，返回角度（弧度），非法边长返回 NaN */
function angleByCosine(opposite: number, side1: number, side2: number): number {
  const cosine =
    (side1 * side1 + side2 * side2 - opposite * opposite) / (2 * side1 * side2);
  if (cosine < -1 - EPS || cosine > 1 + EPS) {
    return Number.NaN;
  }
  return Math.acos(Math.min(1, Math.max(-1, cosine)));
}

/** 由完整三边构造解：求三角、面积、周长 */
function buildFromSides(a: number, b: number, c: number): TriangleSolution {
  // 三角不等式（含退化情形，退化三角形不算合法三角形）
  if (a + b <= c + EPS || a + c <= b + EPS || b + c <= a + EPS) {
    throw new Error(
      `三边 ${formatNum(a)}、${formatNum(b)}、${formatNum(c)} 不满足三角不等式（任意两边之和必须严格大于第三边）`,
    );
  }

  const Ar = angleByCosine(a, b, c);
  const Br = angleByCosine(b, a, c);
  const Cr = Math.PI - Ar - Br;
  if (
    Number.isNaN(Ar) ||
    Number.isNaN(Br) ||
    Ar <= EPS ||
    Br <= EPS ||
    Cr <= EPS
  ) {
    throw new Error('给定的三边无法构成合法三角形');
  }

  // 海伦公式
  const s = (a + b + c) / 2;
  const radicand = s * (s - a) * (s - b) * (s - c);
  const area = Math.sqrt(Math.max(0, radicand));

  return {
    a,
    b,
    c,
    A: toDeg(Ar),
    B: toDeg(Br),
    C: toDeg(Cr),
    area,
    perimeter: a + b + c,
  };
}

/** 校验两角之和严格小于 180°，返回第三个角（度） */
function thirdAngle(angle1: number, angle2: number): number {
  const third = 180 - angle1 - angle2;
  if (third <= EPS) {
    throw new Error(
      `两角之和 ${formatNum(angle1 + angle2)}° 不小于 180°，无法构成三角形`,
    );
  }
  return third;
}

/** 正弦定理：已知一角及其对边，求另一角的对边 */
function sideBySine(knownSide: number, knownAngleRad: number, angleRad: number): number {
  return (knownSide * Math.sin(angleRad)) / Math.sin(knownAngleRad);
}

/**
 * 解三角形主入口。
 *
 * @param input - 已知条件
 * @returns 一个或两个解（SSA 歧义时两个）
 * @throws 输入缺失、非正或条件不构成三角形时抛出错误
 */
export function solveTriangle(input: TriangleInput): TriangleResult {
  switch (input.mode) {
    case 'SSS':
      return solveSSS(input);
    case 'SAS':
      return solveSAS(input);
    case 'ASA':
      return solveASA(input);
    case 'AAS':
      return solveAAS(input);
    case 'SSA':
      return solveSSA(input);
    default:
      throw new Error('不支持的已知条件类型');
  }
}

function solveSSS(input: TriangleInput): TriangleResult {
  const [a, b, c] = requirePositive([
    [input.a, '边 a'],
    [input.b, '边 b'],
    [input.c, '边 c'],
  ]) as [number, number, number];
  return { solutions: [buildFromSides(a, b, c)], ambiguous: false };
}

function solveSAS(input: TriangleInput): TriangleResult {
  // 夹角为 C（a、b 的夹角）
  const [a, b, Cdeg] = requirePositive([
    [input.a, '边 a'],
    [input.b, '边 b'],
    [input.C, '夹角 C'],
  ]) as [number, number, number];
  if (Cdeg >= 180 - EPS) {
    throw new Error('夹角 C 必须小于 180°');
  }
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(toRad(Cdeg)));
  return { solutions: [buildFromSides(a, b, c)], ambiguous: false };
}

function solveASA(input: TriangleInput): TriangleResult {
  // 夹边为 c（A、B 的夹边）
  const [Adeg, Bdeg, c] = requirePositive([
    [input.A, '角 A'],
    [input.B, '角 B'],
    [input.c, '夹边 c'],
  ]) as [number, number, number];
  if (Adeg >= 180 - EPS || Bdeg >= 180 - EPS) {
    throw new Error('三角形的内角必须小于 180°');
  }
  const Cdeg = thirdAngle(Adeg, Bdeg);
  const a = sideBySine(c, toRad(Cdeg), toRad(Adeg));
  const b = sideBySine(c, toRad(Cdeg), toRad(Bdeg));
  return {
    solutions: [{ ...buildFromSides(a, b, c), A: Adeg, B: Bdeg, C: Cdeg }],
    ambiguous: false,
  };
}

function solveAAS(input: TriangleInput): TriangleResult {
  // 已知 A、B 与角 A 的对边 a
  const [Adeg, Bdeg, a] = requirePositive([
    [input.A, '角 A'],
    [input.B, '角 B'],
    [input.a, '边 a'],
  ]) as [number, number, number];
  if (Adeg >= 180 - EPS || Bdeg >= 180 - EPS) {
    throw new Error('三角形的内角必须小于 180°');
  }
  const Cdeg = thirdAngle(Adeg, Bdeg);
  const b = sideBySine(a, toRad(Adeg), toRad(Bdeg));
  const c = sideBySine(a, toRad(Adeg), toRad(Cdeg));
  return {
    solutions: [{ ...buildFromSides(a, b, c), A: Adeg, B: Bdeg, C: Cdeg }],
    ambiguous: false,
  };
}

function solveSSA(input: TriangleInput): TriangleResult {
  // 已知两边 a、b 与其中一边的对角 A（a 对 A）
  const [a, b, Adeg] = requirePositive([
    [input.a, '边 a'],
    [input.b, '边 b'],
    [input.A, '角 A'],
  ]) as [number, number, number];
  if (Adeg >= 180 - EPS) {
    throw new Error('三角形的内角必须小于 180°');
  }

  const Arad = toRad(Adeg);
  // 由正弦定理 sin(B) = b·sin(A)/a
  const sinB = (b * Math.sin(Arad)) / a;

  const candidates: number[] = [];
  if (sinB > 1 + EPS) {
    throw new Error(
      `sin(B) = ${formatNum(sinB)} > 1，给定的两边及非夹角无法构成三角形`,
    );
  }
  if (Math.abs(sinB - 1) <= EPS) {
    candidates.push(90);
  } else if (sinB <= EPS) {
    throw new Error('给定条件无法构成三角形（角 B 趋近 0°）');
  } else {
    const B1 = toDeg(Math.asin(sinB));
    candidates.push(B1);
    const B2 = 180 - B1;
    if (B2 > EPS && Adeg + B2 < 180 - EPS) {
      candidates.push(B2);
    }
  }

  const solutions = candidates
    .map((Bdeg) => {
      const Cdeg = 180 - Adeg - Bdeg;
      if (Cdeg <= EPS) return null;
      const c = sideBySine(a, Arad, toRad(Cdeg));
      const base = buildFromSides(a, b, c);
      return { ...base, A: Adeg, B: Bdeg, C: Cdeg } satisfies TriangleSolution;
    })
    .filter((item): item is TriangleSolution => item !== null);

  if (solutions.length === 0) {
    throw new Error('给定的两边及非夹角无法构成三角形');
  }
  return { solutions, ambiguous: solutions.length === 2 };
}

/** 统一数字格式化（消浮点误差，保留 6 位小数并去尾零） */
export function formatNum(value: number, digits = 6): string {
  if (!Number.isFinite(value)) return '-';
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, '');
}
