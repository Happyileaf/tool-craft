export interface Point {
  x: number;
  y: number;
}

/** 直线的一般式 A x + B y + C = 0 */
export interface Line {
  a: number;
  b: number;
  c: number;
}

export interface Fraction {
  numerator: number;
  denominator: number;
}

export type LineRelation = 'intersect' | 'parallel' | 'coincident';

const EPSILON = 1e-9;

/**
 * 求两个整数的最大公约数
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

/**
 * 校验坐标是否为有限数
 */
export function validatePoint(point: Point, label = '点'): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${label}的坐标必须为有效数值`);
  }
}

/**
 * 校验直线系数，A、B 不能同时为 0
 */
export function validateLine(line: Line): void {
  if (!Number.isFinite(line.a) || !Number.isFinite(line.b) || !Number.isFinite(line.c)) {
    throw new Error('直线系数必须为有效数值');
  }
  if (Math.abs(line.a) < EPSILON && Math.abs(line.b) < EPSILON) {
    throw new Error('直线方程的 A、B 不能同时为 0');
  }
}

/**
 * 把小数近似为分数，使用连分数展开，分母不超过 maxDenominator
 */
export function toFraction(value: number, maxDenominator = 1000): Fraction {
  if (!Number.isFinite(value)) {
    throw new Error('数值必须为有效数值');
  }
  if (Number.isInteger(value)) {
    return { numerator: value, denominator: 1 };
  }
  const sign = value < 0 ? -1 : 1;
  const target = Math.abs(value);
  let numerator = 0;
  let denominator = 1;
  let previousNumerator = 1;
  let previousDenominator = 0;
  let rest = target;

  for (let index = 0; index < 40; index += 1) {
    const whole = Math.floor(rest);
    const nextNumerator = whole * previousNumerator + numerator;
    const nextDenominator = whole * previousDenominator + denominator;
    if (nextDenominator > maxDenominator) {
      break;
    }
    numerator = previousNumerator;
    denominator = previousDenominator;
    previousNumerator = nextNumerator;
    previousDenominator = nextDenominator;
    if (Math.abs(target - nextNumerator / nextDenominator) < 1e-10) {
      break;
    }
    const fractional = rest - whole;
    if (fractional < EPSILON) {
      break;
    }
    rest = 1 / fractional;
  }

  if (previousDenominator === 0) {
    return { numerator: sign * Math.round(target), denominator: 1 };
  }
  return {
    numerator: sign * previousNumerator,
    denominator: previousDenominator,
  };
}

/**
 * 格式化分数，自动约分，整数不带分母
 */
export function formatFraction(value: number, maxDenominator = 1000): string {
  const fraction = toFraction(value, maxDenominator);
  const divisor = gcd(fraction.numerator, fraction.denominator) || 1;
  const numerator = fraction.numerator / divisor;
  const denominator = fraction.denominator / divisor;
  if (denominator === 1) {
    return `${numerator}`;
  }
  return `${numerator}/${denominator}`;
}

/**
 * 格式化小数，最多保留 digits 位且去掉末尾多余的 0
 */
export function formatDecimal(value: number, digits = 4): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const fixed = value.toFixed(digits);
  if (Number(fixed) === 0) {
    return '0';
  }
  return fixed.replace(/\.?0+$/, '');
}

/**
 * 同时给出精确分数与小数表示
 */
export function formatExact(value: number, digits = 4): string {
  const fraction = formatFraction(value);
  const decimal = formatDecimal(value, digits);
  if (fraction === decimal) {
    return fraction;
  }
  return `${fraction} ≈ ${decimal}`;
}

/**
 * 两点距离
 */
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  validatePoint(p1, '起点');
  validatePoint(p2, '终点');
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 两点中点
 */
export function midpoint(p1: Point, p2: Point): Point {
  validatePoint(p1, '起点');
  validatePoint(p2, '终点');
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/**
 * 判断两点是否重合
 */
export function pointsCoincide(p1: Point, p2: Point): boolean {
  return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
}

/**
 * 由两点确定一般式直线 A x + B y + C = 0
 */
export function lineThroughPoints(p1: Point, p2: Point): Line {
  validatePoint(p1, '起点');
  validatePoint(p2, '终点');
  if (pointsCoincide(p1, p2)) {
    throw new Error('两点重合，无法确定唯一一条直线');
  }
  const line: Line = {
    a: p1.y - p2.y,
    b: p2.x - p1.x,
    c: p1.x * p2.y - p2.x * p1.y,
  };
  validateLine(line);
  return line;
}

/**
 * 由一般式系数构造并校验直线
 */
export function lineFromGeneral(a: number, b: number, c: number): Line {
  const line: Line = { a, b, c };
  validateLine(line);
  return line;
}

/**
 * 直线斜率；竖直线返回 null
 */
export function slopeOfLine(line: Line): number | null {
  validateLine(line);
  if (Math.abs(line.b) < EPSILON) {
    return null;
  }
  return -line.a / line.b;
}

/**
 * 直线在 y 轴上的截距；竖直线返回 null
 */
export function interceptOfLine(line: Line): number | null {
  const slope = slopeOfLine(line);
  if (slope === null) {
    return null;
  }
  return -line.c / line.b;
}

/**
 * 求两条直线的关系：相交、平行或重合
 */
export function lineRelation(line1: Line, line2: Line): LineRelation {
  validateLine(line1);
  validateLine(line2);
  const determinant = line1.a * line2.b - line2.a * line1.b;
  if (Math.abs(determinant) > EPSILON) {
    return 'intersect';
  }
  const crossA = line1.a * line2.c - line2.a * line1.c;
  const crossB = line1.b * line2.c - line2.b * line1.c;
  if (Math.abs(crossA) < EPSILON && Math.abs(crossB) < EPSILON) {
    return 'coincident';
  }
  return 'parallel';
}

/**
 * 将 -0 归一为 0，避免格式化与断言出现负零
 */
function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * 两条直线的交点；平行或重合时返回 null
 */
export function intersection(line1: Line, line2: Line): Point | null {
  if (lineRelation(line1, line2) !== 'intersect') {
    return null;
  }
  const determinant = line1.a * line2.b - line2.a * line1.b;
  return {
    x: normalizeZero((line1.b * line2.c - line2.b * line1.c) / determinant),
    y: normalizeZero((line2.a * line1.c - line1.a * line2.c) / determinant),
  };
}

/**
 * 点到直线的距离
 */
export function distancePointToLine(point: Point, line: Line): number {
  validatePoint(point, '点');
  validateLine(line);
  const norm = Math.hypot(line.a, line.b);
  if (norm < EPSILON) {
    throw new Error('直线方程的 A、B 不能同时为 0');
  }
  return Math.abs(line.a * point.x + line.b * point.y + line.c) / norm;
}

/**
 * 点在直线上的垂足
 */
export function footOfPerpendicular(point: Point, line: Line): Point {
  validatePoint(point, '点');
  validateLine(line);
  const denominator = line.a * line.a + line.b * line.b;
  if (denominator < EPSILON) {
    throw new Error('直线方程的 A、B 不能同时为 0');
  }
  const signed = line.a * point.x + line.b * point.y + line.c;
  return {
    x: point.x - (line.a * signed) / denominator,
    y: point.y - (line.b * signed) / denominator,
  };
}

/**
 * 过指定点且与原直线垂直的直线
 */
export function perpendicularLineThrough(line: Line, point: Point): Line {
  validatePoint(point, '点');
  validateLine(line);
  return {
    a: -line.b,
    b: line.a,
    c: line.b * point.x - line.a * point.y,
  };
}

/**
 * 过指定点且与原直线平行的直线
 */
export function parallelLineThrough(line: Line, point: Point): Line {
  validatePoint(point, '点');
  validateLine(line);
  return {
    a: line.a,
    b: line.b,
    c: -(line.a * point.x + line.b * point.y),
  };
}

/**
 * 将整数系数的直线约分为最简形式，并保证首个非零系数为正
 */
function normalizeLineForDisplay(line: Line): Line {
  const isInteger = (value: number) => Math.abs(value - Math.round(value)) < EPSILON;
  if (!isInteger(line.a) || !isInteger(line.b) || !isInteger(line.c)) {
    return line;
  }
  let a = Math.round(line.a);
  let b = Math.round(line.b);
  let c = Math.round(line.c);
  const divisor = gcd(gcd(a, b), c);
  if (divisor > 1) {
    a /= divisor;
    b /= divisor;
    c /= divisor;
  }
  if (a < 0 || (a === 0 && b < 0) || (a === 0 && b === 0 && c < 0)) {
    a = -a;
    b = -b;
    c = -c;
  }
  return { a, b, c };
}

/**
 * 生成一般式字符串，如 2x - y + 1 = 0
 */
export function formatGeneralForm(line: Line): string {
  const normalized = normalizeLineForDisplay(line);
  const terms: string[] = [];
  const pushTerm = (value: number, variable: string) => {
    if (Math.abs(value) < EPSILON) {
      return;
    }
    const magnitude = Math.abs(value);
    const body = variable
      ? Math.abs(magnitude - 1) < EPSILON
        ? variable
        : `${formatFraction(magnitude)}${variable}`
      : formatFraction(magnitude);
    if (terms.length === 0) {
      terms.push(value < 0 ? `-${body}` : body);
      return;
    }
    terms.push(value < 0 ? `- ${body}` : `+ ${body}`);
  };
  pushTerm(normalized.a, 'x');
  pushTerm(normalized.b, 'y');
  pushTerm(normalized.c, '');
  if (terms.length === 0) {
    return '0 = 0';
  }
  return `${terms.join(' ')} = 0`;
}

/**
 * 格式化斜率系数，1 与 -1 省略数字部分
 */
function formatSlopeCoefficient(slope: number): string {
  if (Math.abs(slope - 1) < EPSILON) {
    return '';
  }
  if (Math.abs(slope + 1) < EPSILON) {
    return '-';
  }
  return formatFraction(slope);
}

/**
 * 生成斜截式字符串，竖直线返回 null
 */
export function formatSlopeIntercept(line: Line): string | null {
  const slope = slopeOfLine(line);
  if (slope === null) {
    return null;
  }
  const intercept = -line.c / line.b;
  if (Math.abs(slope) < EPSILON) {
    return `y = ${formatFraction(intercept)}`;
  }
  const slopeText = `${formatSlopeCoefficient(slope)}x`;
  if (Math.abs(intercept) < EPSILON) {
    return `y = ${slopeText}`;
  }
  return `y = ${slopeText} ${intercept < 0 ? '-' : '+'} ${formatFraction(Math.abs(intercept))}`;
}

/**
 * 生成点斜式字符串，竖直线给出 x = x0
 */
export function formatPointSlope(line: Line, point: Point): string {
  const slope = slopeOfLine(line);
  if (slope === null) {
    return `x = ${formatFraction(point.x)}`;
  }
  if (Math.abs(slope) < EPSILON) {
    return `y = ${formatFraction(point.y)}`;
  }
  return `y - ${formatFraction(point.y)} = ${formatSlopeCoefficient(slope)}(x - ${formatFraction(point.x)})`;
}

/**
 * 判断直线是否竖直
 */
export function isVerticalLine(line: Line): boolean {
  return Math.abs(line.b) < EPSILON;
}
