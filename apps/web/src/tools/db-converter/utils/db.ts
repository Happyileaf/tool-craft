/**
 * 分贝（dB）与线性倍数互算纯函数，不依赖 DOM 与 React。
 * 功率量：dB = 10·log10(P/P0)，倍数 = 10^(dB/10)；
 * 场量（电压 / 幅值 / 声压）：dB = 20·log10(V/V0)，倍数 = 10^(dB/20)。
 */

/** 分贝定义模式 */
export enum DbModeEnum {
  /** 功率量（系数 10） */
  POWER = 'power',
  /** 场量 / 幅值（系数 20） */
  AMPLITUDE = 'amplitude',
}

/** 各模式下的对数系数 */
const MODE_FACTOR: Record<DbModeEnum, number> = {
  [DbModeEnum.POWER]: 10,
  [DbModeEnum.AMPLITUDE]: 20,
};

/**
 * dB 换算为线性倍数
 *
 * @param db - 分贝值（可为 -Infinity，此时倍数为 0）
 * @param mode - 功率或场量模式
 * @returns 线性倍数
 */
export function dbToRatio(db: number, mode: DbModeEnum): number {
  const factor = MODE_FACTOR[mode];
  return 10 ** (db / factor);
}

/**
 * 线性倍数换算为 dB
 *
 * @param ratio - 线性倍数（必须大于等于 0，0 对应 -Infinity dB）
 * @param mode - 功率或场量模式
 * @returns dB 值；倍数为负返回 NaN
 */
export function ratioToDb(ratio: number, mode: DbModeEnum): number {
  if (ratio < 0) {
    return Number.NaN;
  }
  if (ratio === 0) {
    return Number.NEGATIVE_INFINITY;
  }
  const factor = MODE_FACTOR[mode];
  return factor * Math.log10(ratio);
}

/**
 * 校验线性倍数合法性
 *
 * @param ratio - 线性倍数
 * @returns 错误信息，合法为 null
 */
export function validateRatio(ratio: number): string | null {
  if (!Number.isFinite(ratio)) {
    return '倍数必须是有效数字（0 倍表示信号完全衰减）';
  }
  if (ratio < 0) {
    return '倍数不能为负数';
  }
  return null;
}

/** 级联解析结果 */
export interface GainListResult {
  /** 解析出的各级 dB 增益 */
  gains: number[];
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 解析多级 dB 增益列表，支持逗号、空白与换行分隔
 *
 * @param text - 原始文本
 * @returns 解析结果
 */
export function parseGainList(text: string): GainListResult {
  const tokens = text.split(/[\s,;，]+/).filter((token) => token.trim() !== '');
  const gains: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      return { gains: [], error: `「${token}」不是有效的 dB 数值` };
    }
    gains.push(value);
  }
  return { gains, error: null };
}

/**
 * 多级增益级联：dB 直接相加
 *
 * @param gains - 各级 dB 增益
 * @returns 总 dB；空列表返回 null
 */
export function cascadeDb(gains: number[]): number | null {
  if (gains.length === 0) {
    return null;
  }
  return gains.reduce((sum, value) => sum + value, 0);
}
