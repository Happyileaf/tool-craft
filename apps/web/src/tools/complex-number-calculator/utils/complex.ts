/**
 * 复数运算纯函数：直角坐标 a+bi 与极坐标形式互转、四则运算
 * 不接触 DOM / React，不引入任何第三方依赖
 */

export interface Complex {
  /** 实部 */
  re: number;
  /** 虚部 */
  im: number;
}

export interface Polar {
  /** 模 r（非负） */
  r: number;
  /** 辐角 θ（弧度，范围 (-π, π]） */
  theta: number;
}

/** 绝对值小于该阈值的浮点结果归一为 0，消除 −0 与计算误差 */
const EPSILON = 1e-12;

function normalize(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  return Math.abs(value) < EPSILON ? 0 : value;
}

export function complex(re: number, im = 0): Complex {
  return { re: normalize(re), im: normalize(im) };
}

export function add(a: Complex, b: Complex): Complex {
  return complex(a.re + b.re, a.im + b.im);
}

export function sub(a: Complex, b: Complex): Complex {
  return complex(a.re - b.re, a.im - b.im);
}

export function mul(a: Complex, b: Complex): Complex {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

/**
 * 复数除法；除数为 0+0i 时抛出错误
 */
export function div(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im;
  if (denominator === 0) {
    throw new Error('除数不能为零复数（0+0i）');
  }
  return complex(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator,
  );
}

/** 共轭 a−bi */
export function conjugate(a: Complex): Complex {
  return complex(a.re, -a.im);
}

/** 模 |z| = sqrt(re²+im²) */
export function modulus(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

/**
 * 辐角（弧度，范围 (-π, π]）；零复数约定为 0
 */
export function argument(a: Complex): number {
  if (a.re === 0 && a.im === 0) {
    return 0;
  }
  return Math.atan2(a.im, a.re);
}

/** 直角坐标 → 极坐标（r, θ 弧度） */
export function toPolar(a: Complex): Polar {
  return { r: modulus(a), theta: argument(a) };
}

/**
 * 极坐标 → 直角坐标
 *
 * @param r - 模
 * @param theta - 辐角（弧度）
 */
export function fromPolar(r: number, theta: number): Complex {
  return complex(r * Math.cos(theta), r * Math.sin(theta));
}

/** 弧度 → 角度 */
export function toDegrees(radians: number): number {
  return normalize((radians * 180) / Math.PI);
}

/** 角度 → 弧度 */
export function toRadians(degrees: number): number {
  return normalize((degrees * Math.PI) / 180);
}

/**
 * 把复数格式化为 a+bi 字符串，自动处理实部或虚部为 0、虚部 ±1 等情形
 */
export function formatComplex(a: Complex, fixed = 6): string {
  const fmt = (value: number): string => {
    const rounded = Number(value.toFixed(fixed));
    return String(rounded);
  };
  const re = fmt(a.re);
  if (a.im === 0) {
    return re;
  }
  const absIm = Math.abs(a.im);
  const imPart = `${absIm === 1 ? '' : fmt(absIm)}i`;
  if (a.re === 0) {
    return `${a.im < 0 ? '-' : ''}${imPart}`;
  }
  return `${re} ${a.im < 0 ? '-' : '+'} ${imPart}`;
}
