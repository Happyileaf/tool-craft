/**
 * 一元二次 / 三次方程求根（零依赖纯函数）
 *
 * - 二次方程 ax² + bx + c = 0：求根公式 + 判别式 Δ = b² − 4ac
 * - 三次方程 ax³ + bx² + cx + d = 0：归一化后用 Cardano 法（含 casus irreducibilis 三实根情形）
 * - 首项系数为 0 时自动降次（三次 → 二次 → 一次）
 * - 全部根（实根 / 共轭复根）均标注重数
 */

export type PolynomialMode = 'quadratic' | 'cubic';

export interface PolynomialInput {
  mode: PolynomialMode;
  /** 二次：a、b、c；三次：a、b、c、d（高次项到常数项） */
  a: number;
  b: number;
  c?: number;
  d?: number;
}

export interface PolynomialRoot {
  re: number;
  im: number;
  multiplicity: number;
}

export interface SolveStep {
  title: string;
  detail: string;
}

export interface PolynomialResult {
  /** 实际次数（自动降次后） */
  degree: 1 | 2 | 3;
  roots: PolynomialRoot[];
  /** 判别式：二次为 b²−4ac；三次为 Cardano 判别式 Δ=(Q/2)²+(P/3)³；一次为 null */
  discriminant: number | null;
  steps: SolveStep[];
}

const EPS = 1e-12;
const IM_EPS = 1e-10;

function nearZero(value: number): boolean {
  return Math.abs(value) < EPS;
}

/** 清洗浮点残差（极小虚部 / 实部归零） */
function cleanRoot(re: number, im: number, multiplicity = 1): PolynomialRoot {
  return {
    re: Math.abs(re) < IM_EPS ? 0 : re,
    im: Math.abs(im) < IM_EPS ? 0 : im,
    multiplicity,
  };
}

/** 实根升序在前，复根按实部、虚部升序在后 */
function sortRoots(roots: PolynomialRoot[]): PolynomialRoot[] {
  return [...roots].sort((r1, r2) => {
    if (r1.im === 0 && r2.im !== 0) return -1;
    if (r1.im !== 0 && r2.im === 0) return 1;
    if (r1.re !== r2.re) return r1.re - r2.re;
    return r1.im - r2.im;
  });
}

/** 解一次方程 A·x + B = 0（A ≠ 0） */
function solveLinear(A: number, B: number): PolynomialResult {
  const root = -B / A;
  return {
    degree: 1,
    roots: [cleanRoot(root, 0)],
    discriminant: null,
    steps: [
      {
        title: '降次为一次方程',
        detail: `首项系数为 0，方程降为 ${formatNum(A)}x + ${formatNum(B)} = 0`,
      },
      {
        title: '求解',
        detail: `x = −(${formatNum(B)}) / ${formatNum(A)} = ${formatNum(root)}`,
      },
    ],
  };
}

/** 解二次方程 A·x² + B·x + C = 0（A ≠ 0） */
function solveQuadratic(A: number, B: number, C: number): PolynomialResult {
  const delta = B * B - 4 * A * C;
  const steps: SolveStep[] = [
    {
      title: '方程与判别式',
      detail: `方程 ${formatNum(A)}x² + ${formatNum(B)}x + ${formatNum(C)} = 0，Δ = b² − 4ac = ${formatNum(delta)}`,
    },
  ];

  let roots: PolynomialRoot[];
  if (delta > EPS) {
    const sqrtD = Math.sqrt(delta);
    const r1 = (-B - sqrtD) / (2 * A);
    const r2 = (-B + sqrtD) / (2 * A);
    roots = [cleanRoot(r1, 0), cleanRoot(r2, 0)];
    steps.push({
      title: 'Δ > 0：两个不相等实根',
      detail: `x = (−b ± √Δ) / 2a = (−(${formatNum(B)}) ± √${formatNum(delta)}) / ${formatNum(2 * A)}`,
    });
  } else if (delta < -EPS) {
    const re = -B / (2 * A);
    const im = Math.sqrt(-delta) / (2 * A);
    roots = [cleanRoot(re, -Math.abs(im)), cleanRoot(re, Math.abs(im))];
    steps.push({
      title: 'Δ < 0：一对共轭复根',
      detail: `x = −b / 2a ± i·√(−Δ) / 2a = ${formatNum(re)} ± ${formatNum(Math.abs(im))}i`,
    });
  } else {
    const re = -B / (2 * A);
    roots = [cleanRoot(re, 0, 2)];
    steps.push({
      title: 'Δ = 0：一个二重实根',
      detail: `x = −b / 2a = ${formatNum(re)}（重数 2）`,
    });
  }

  return { degree: 2, roots: sortRoots(roots), discriminant: delta, steps };
}

/** 解三次方程 A·x³ + B·x² + C·x + D = 0（A ≠ 0），Cardano 法 */
function solveCubic(A: number, B: number, C: number, D: number): PolynomialResult {
  // 归一化为首一多项式 x³ + p x² + q x + r = 0
  const p = B / A;
  const q = C / A;
  const r = D / A;

  // Cardano 替换 x = t − p/3，化为 t³ + P t + Q = 0
  const P = q - (p * p) / 3;
  const Q = (2 * p * p * p - 9 * p * q + 27 * r) / 27;
  const delta = (Q / 2) * (Q / 2) + (P / 3) * (P / 3) * (P / 3);

  const steps: SolveStep[] = [
    {
      title: '归一化为首一多项式',
      detail: `x³ + p x² + q x + r = 0，p = ${formatNum(p)}，q = ${formatNum(q)}，r = ${formatNum(r)}`,
    },
    {
      title: 'Cardano 替换',
      detail: `令 x = t − p/3，化为 t³ + P t + Q = 0，P = ${formatNum(P)}，Q = ${formatNum(Q)}`,
    },
    {
      title: 'Cardano 判别式',
      detail: `Δ = (Q/2)² + (P/3)³ = ${formatNum(delta)}（Δ>0 一实根一对复根；Δ=0 重根；Δ<0 三个实根）`,
    },
  ];

  let roots: PolynomialRoot[];

  if (delta > EPS) {
    // 一个实根 + 一对共轭复根
    const u = Math.cbrt(-Q / 2 + Math.sqrt(delta));
    const v = Math.cbrt(-Q / 2 - Math.sqrt(delta));
    const t1 = u + v;
    const x1 = t1 - p / 3;
    const xRe = -(u + v) / 2 - p / 3;
    const xIm = (Math.sqrt(3) * (u - v)) / 2;
    roots = [
      cleanRoot(x1, 0),
      cleanRoot(xRe, xIm),
      cleanRoot(xRe, -xIm),
    ];
    steps.push({
      title: 'Δ > 0：一实根与一对共轭复根',
      detail: `u = ³√(−Q/2 + √Δ) = ${formatNum(u)}，v = ³√(−Q/2 − √Δ) = ${formatNum(v)}，x₁ = u + v − p/3`,
    });
  } else if (delta < -EPS) {
    // casus irreducibilis：三个不同实根
    const radius = 2 * Math.sqrt(-P / 3);
    const phi = Math.acos(clamp((-Q / 2) / Math.sqrt((-P / 3) ** 3), -1, 1));
    const ts = [0, 1, 2].map((k) => radius * Math.cos(phi / 3 - (2 * Math.PI * k) / 3));
    roots = ts.map((t) => cleanRoot(t - p / 3, 0));
    steps.push({
      title: 'Δ < 0（casus irreducibilis）：三个不相等实根',
      detail: `tₖ = 2√(−P/3)·cos(⅓ arccos(...) − 2kπ/3)，k = 0, 1, 2，再由 x = t − p/3 回代`,
    });
  } else {
    // Δ = 0：重根
    const u = Math.cbrt(-Q / 2);
    const t1 = 2 * u;
    const t2 = -u;
    if (Math.abs(t1 - t2) < IM_EPS) {
      roots = [cleanRoot(t1 - p / 3, 0, 3)];
      steps.push({
        title: 'Δ = 0 且 P = Q = 0：一个三重实根',
        detail: `x = −p/3 = ${formatNum(t1 - p / 3)}（重数 3）`,
      });
    } else {
      roots = [
        cleanRoot(t1 - p / 3, 0, 1),
        cleanRoot(t2 - p / 3, 0, 2),
      ];
      steps.push({
        title: 'Δ = 0：一个单根与一个二重根',
        detail: `x₁ = 2u − p/3 = ${formatNum(t1 - p / 3)}，x₂ = −u − p/3 = ${formatNum(t2 - p / 3)}（重数 2）`,
      });
    }
  }

  return { degree: 3, roots: sortRoots(roots), discriminant: delta, steps };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 求根主入口。系数按高次项到常数项给出，首项为 0 时自动降次。
 *
 * @throws 系数缺失、非有限数、全零多项式或矛盾常数方程时抛出错误
 */
export function solvePolynomial(input: PolynomialInput): PolynomialResult {
  const coeffs =
    input.mode === 'cubic'
      ? [input.a, input.b, input.c, input.d]
      : [input.a, input.b, input.c];

  if (coeffs.some((v) => v === undefined || v === null || !Number.isFinite(v))) {
    throw new Error('请填写全部系数（无该项时请填 0）');
  }
  const numbers = coeffs as number[];

  // 去掉前导零系数，确定实际次数
  let first = 0;
  while (first < numbers.length - 1 && nearZero(numbers[first]!)) {
    first += 1;
  }
  const trimmed = numbers.slice(first);

  if (trimmed.every((v) => nearZero(v))) {
    throw new Error('所有系数均为 0：该等式对任意 x 都成立，不是可求根的方程');
  }
  if (trimmed.length === 1) {
    throw new Error(`方程退化为矛盾的常数方程 ${formatNum(trimmed[0]!)} = 0，无解`);
  }

  if (trimmed.length === 2) {
    return solveLinear(trimmed[0]!, trimmed[1]!);
  }
  if (trimmed.length === 3) {
    return solveQuadratic(trimmed[0]!, trimmed[1]!, trimmed[2]!);
  }
  return solveCubic(trimmed[0]!, trimmed[1]!, trimmed[2]!, trimmed[3]!);
}

/** 统一数字格式化（消浮点误差，保留 6 位小数并去尾零） */
export function formatNum(value: number, digits = 6): string {
  if (!Number.isFinite(value)) return '-';
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

/** 将复根格式化为可读字符串，如 3、2i、-0.5 + 0.866025i */
export function formatComplex(root: PolynomialRoot, digits = 6): string {
  const { re, im } = root;
  let text: string;
  if (im === 0) {
    text = formatNum(re, digits);
  } else if (re === 0) {
    text = `${im < 0 ? '-' : ''}${formatNum(Math.abs(im), digits)}i`;
  } else {
    text = `${formatNum(re, digits)} ${im > 0 ? '+' : '−'} ${formatNum(Math.abs(im), digits)}i`;
  }
  return root.multiplicity > 1 ? `${text}（重数 ${root.multiplicity}）` : text;
}
