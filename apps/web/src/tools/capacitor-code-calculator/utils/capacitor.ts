/** 电容标码解析、容差换算与反查标码的纯函数 */

/** 容差信息，percent 与 absolutePf 二选一 */
export interface ToleranceInfo {
  code: string;
  label: string;
  percent: number | null;
  absolutePf: number | null;
}

/** 容差字母表：B/C/D 为绝对偏差，F/G/J/K/M 为百分比，Z 为非对称偏差 */
export const TOLERANCE_TABLE: Record<string, ToleranceInfo> = {
  B: { code: 'B', label: '±0.1 pF', percent: null, absolutePf: 0.1 },
  C: { code: 'C', label: '±0.25 pF', percent: null, absolutePf: 0.25 },
  D: { code: 'D', label: '±0.5 pF', percent: null, absolutePf: 0.5 },
  F: { code: 'F', label: '±1%', percent: 1, absolutePf: null },
  G: { code: 'G', label: '±2%', percent: 2, absolutePf: null },
  J: { code: 'J', label: '±5%', percent: 5, absolutePf: null },
  K: { code: 'K', label: '±10%', percent: 10, absolutePf: null },
  M: { code: 'M', label: '±20%', percent: 20, absolutePf: null },
  Z: { code: 'Z', label: '+80% / −20%', percent: null, absolutePf: null },
};

/** 陶瓷电容常见额定电压码（EIA/IEC 两位编码） */
export const VOLTAGE_CODE_TABLE: Record<string, number> = {
  '0J': 6.3,
  '1A': 10,
  '1C': 16,
  '1E': 25,
  '1H': 50,
  '2A': 100,
  '2B': 125,
  '2C': 160,
  '2E': 250,
  '2H': 500,
  '3A': 1000,
};

/** 电压码信息 */
export interface VoltageInfo {
  code: string;
  volts: number;
}

/** 标码解析结果 */
export interface CapacitorParseResult {
  /** 原始输入（去除首尾空白） */
  code: string;
  /** 去掉容差与电压码后的容值记号 */
  valueToken: string;
  /** 容值（皮法） */
  picofarads: number;
  /** 容值（纳法） */
  nanofarads: number;
  /** 容值（微法） */
  microfarads: number;
  /** 容差 */
  tolerance: ToleranceInfo | null;
  /** 额定电压 */
  voltage: VoltageInfo | null;
  /** 容差下限（皮法） */
  minPf: number | null;
  /** 容差上限（皮法） */
  maxPf: number | null;
  /** 标码规则说明 */
  explanation: string;
}

/** 反查得到的标码及其误差 */
export interface EncodedCode {
  code: string;
  actualPf: number;
  errorPercent: number;
}

const VALUE_UNIT_TO_PF: Record<string, number> = { P: 1, N: 1e3, U: 1e6 };

/**
 * 解析容值记号并返回皮法值，无法识别时返回 NaN
 */
function parseValueToken(token: string): number {
  let match = /^R(\d{1,2})$/.exec(token);
  if (match) {
    return Number(`0.${match[1]}`) * 1e6;
  }
  match = /^(\d{1,2})R(\d)$/.exec(token);
  if (match) {
    return Number(`${match[1]}.${match[2]}`) * 1e6;
  }
  match = /^(\d{1,2})([PNU])(\d{1,2})$/.exec(token);
  if (match) {
    return Number(`${match[1] ?? ''}.${match[3] ?? ''}`) * (VALUE_UNIT_TO_PF[match[2] ?? ''] ?? 1);
  }
  match = /^(\d+)([PNU])$/.exec(token);
  if (match) {
    return Number(match[1]) * (VALUE_UNIT_TO_PF[match[2] ?? ''] ?? 1);
  }
  match = /^([PNU])(\d{1,2})$/.exec(token);
  if (match) {
    return Number(`0.${match[2] ?? ''}`) * (VALUE_UNIT_TO_PF[match[1] ?? ''] ?? 1);
  }
  match = /^(\d{2})$/.exec(token);
  if (match) {
    return Number(match[1]);
  }
  match = /^(\d{3})$/.exec(token);
  if (match) {
    const digits = match[1] ?? '';
    return Number(digits.slice(0, 2)) * 10 ** Number(digits.charAt(2));
  }
  return Number.NaN;
}

/**
 * 将皮法值格式化为 pF / nF / µF 三种可读字符串
 */
export function formatCapacitance(pf: number): { pf: string; nf: string; uf: string } {
  const format = (value: number): string => {
    if (!Number.isFinite(value)) {
      return '—';
    }
    if (value !== 0 && (Math.abs(value) >= 1e9 || Math.abs(value) < 1e-4)) {
      return value.toExponential(3);
    }
    return Number(value.toPrecision(10)).toString();
  };
  return { pf: format(pf), nf: format(pf / 1e3), uf: format(pf / 1e6) };
}

/**
 * 生成标码规则的可读说明
 */
function describeValue(token: string, pf: number): string {
  const formatted = formatCapacitance(pf);
  if (/^R\d{1,2}$/.test(token)) {
    return `R 记法：R 表示小数点，单位为 µF，${token} = ${formatted.uf} µF。`;
  }
  const rMatch = /^(\d{1,2})R(\d)$/.exec(token);
  if (rMatch) {
    return `R 记法：R 表示小数点，单位为 µF，${token} = ${rMatch[1]}.${rMatch[2]} µF。`;
  }
  const decimalMatch = /^(\d{1,2})([PNU])(\d{1,2})$/.exec(token);
  if (decimalMatch) {
    const unit = decimalMatch[2] === 'P' ? 'pF' : decimalMatch[2] === 'N' ? 'nF' : 'µF';
    return `小数记法：${decimalMatch[1]}${decimalMatch[2]}${decimalMatch[3]} = ${decimalMatch[1]}.${decimalMatch[3]} ${unit}。`;
  }
  const suffixMatch = /^(\d+)([PNU])$/.exec(token);
  if (suffixMatch) {
    const unit = suffixMatch[2] === 'P' ? 'pF' : suffixMatch[2] === 'N' ? 'nF' : 'µF';
    return `单位后缀记法：${suffixMatch[1]}${suffixMatch[2]} = ${suffixMatch[1]} ${unit}。`;
  }
  const leadingMatch = /^([PNU])(\d{1,2})$/.exec(token);
  if (leadingMatch) {
    const unit = leadingMatch[1] === 'P' ? 'pF' : leadingMatch[1] === 'N' ? 'nF' : 'µF';
    return `前置单位小数记法：${token} = 0.${leadingMatch[2]} ${unit}。`;
  }
  const threeMatch = /^(\d{3})$/.exec(token);
  if (threeMatch) {
    const digits = threeMatch[1] ?? '';
    const exponent = digits.charAt(2);
    return `三位数字码：前两位 ${digits.slice(0, 2)} 为有效数字，末位 ${exponent} 为倍率 10^${exponent}，即 ${Number(digits.slice(0, 2))} × 10^${exponent} pF = ${formatted.pf} pF = ${formatted.nf} nF = ${formatted.uf} µF。`;
  }
  return `两位数字码直接以 pF 为单位：${token} = ${formatted.pf} pF。`;
}

/**
 * 解析电容标码，支持三位数字码、两位小容值码、R / p / n / u 记法、
 * 容差字母以及尾随的两位额定电压码
 */
export function parseCapacitorCode(input: string): CapacitorParseResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('请输入电容标码，例如 104、104K 或 4R7');
  }
  let rest = trimmed.toUpperCase().replace(/\s+/g, '');

  let voltage: VoltageInfo | null = null;
  if (rest.length >= 5) {
    const tail = rest.slice(-2);
    const volts = VOLTAGE_CODE_TABLE[tail];
    if (volts !== undefined) {
      voltage = { code: tail, volts };
      rest = rest.slice(0, -2);
    }
  }

  let tolerance: ToleranceInfo | null = null;
  const lastChar = rest.slice(-1);
  const toleranceInfo = TOLERANCE_TABLE[lastChar];
  if (
    toleranceInfo !== undefined &&
    rest.length > 1 &&
    !Number.isNaN(parseValueToken(rest.slice(0, -1)))
  ) {
    tolerance = toleranceInfo;
    rest = rest.slice(0, -1);
  }

  const picofarads = parseValueToken(rest);
  if (!Number.isFinite(picofarads) || picofarads <= 0) {
    throw new Error(`无法识别标码「${trimmed}」，支持 104 / 47 / 4R7 / 2N2 / 100N 等格式`);
  }

  let minPf: number | null = null;
  let maxPf: number | null = null;
  if (tolerance) {
    if (tolerance.percent !== null) {
      minPf = picofarads * (1 - tolerance.percent / 100);
      maxPf = picofarads * (1 + tolerance.percent / 100);
    } else if (tolerance.absolutePf !== null) {
      minPf = picofarads - tolerance.absolutePf;
      maxPf = picofarads + tolerance.absolutePf;
    } else {
      minPf = picofarads * 0.8;
      maxPf = picofarads * 1.8;
    }
  }

  return {
    code: trimmed,
    valueToken: rest,
    picofarads,
    nanofarads: picofarads / 1e3,
    microfarads: picofarads / 1e6,
    tolerance,
    voltage,
    minPf,
    maxPf,
    explanation: describeValue(rest, picofarads),
  };
}

/**
 * 给定容值（皮法）反查最接近的标准标码
 */
export function encodeCapacitance(pf: number): EncodedCode {
  if (!Number.isFinite(pf) || pf <= 0) {
    throw new Error('待反查的容值需为正数');
  }

  let best: EncodedCode | null = null;
  const consider = (code: string, actualPf: number): void => {
    const errorPercent = (Math.abs(actualPf - pf) / pf) * 100;
    if (best === null || errorPercent < best.errorPercent) {
      best = { code, actualPf, errorPercent };
    }
  };

  for (let mantissa = 10; mantissa <= 99; mantissa += 1) {
    consider(String(mantissa), mantissa);
    for (let exponent = 0; exponent <= 9; exponent += 1) {
      consider(`${mantissa}${exponent}`, mantissa * 10 ** exponent);
    }
  }
  for (let tenths = 10; tenths <= 99; tenths += 1) {
    const value = tenths / 10;
    consider(`${Math.floor(value)}P${tenths % 10}`, value);
  }

  if (best === null) {
    throw new Error('未能找到匹配的标码');
  }
  return best;
}
