/**
 * AWG（American Wire Gauge，美国线规 / Brown & Sharpe）计算器纯函数
 *
 * 标准定义：
 * - 直径 d(n) = 0.127 mm × 92^((36-n)/39)   （36 AWG 恰为 0.127 mm / 5 mil）
 * - 截面积 A = π d² / 4
 * - 电阻与载流量表为经验数据：电阻采用 20 ℃ 退火铜电阻率（约 1.7241×10⁻⁸ Ω·m，
 *   即 10.37 Ω·cmil/ft）；载流量采用机箱布线（chassis wiring）保守经验值
 *
 * 参考范围：0000（4/0）AWG 至 40 AWG。
 */

/** 最小 AWG 序号：0000 = 4/0，内部表示为 -3 */
export const MIN_AWG = -3;
/** 最大 AWG 序号：40 */
export const MAX_AWG = 40;

/** 铜在 20 ℃ 的电阻率（Ω·m，退火铜标准值） */
const COPPER_RESISTIVITY_OHM_M = 1.7241e-8;

/** AWG 序号 -> 机箱布线（单根铜线、绝缘、开放环境）保守载流量（A），-3(4/0)..40 */
const AMPACITY_TABLE: Record<number, number> = {
  [-3]: 260,
  [-2]: 225,
  [-1]: 195,
  0: 170,
  1: 150,
  2: 130,
  3: 110,
  4: 95,
  5: 85,
  6: 75,
  7: 65,
  8: 55,
  9: 50,
  10: 40,
  11: 35,
  12: 30,
  13: 25,
  14: 20,
  15: 15,
  16: 13,
  17: 11,
  18: 10,
  19: 8,
  20: 6,
  21: 5,
  22: 4,
  23: 3.5,
  24: 2.5,
  25: 2,
  26: 1.5,
  27: 1.2,
  28: 1,
  29: 0.86,
  30: 0.72,
  31: 0.58,
  32: 0.5,
  33: 0.4,
  34: 0.33,
  35: 0.27,
  36: 0.21,
  37: 0.17,
  38: 0.13,
  39: 0.11,
  40: 0.09,
};

/** AWG 计算结果 */
export interface AwgResult {
  /** 是否为合法 AWG 线号 */
  ok: boolean;
  /** 直径（mm） */
  diameterMm: number | null;
  /** 直径（inch） */
  diameterIn: number | null;
  /** 截面积（mm²） */
  areaMm2: number | null;
  /** 截面积（kcmil，千圆密耳） */
  kcmil: number | null;
  /** 每千米电阻（Ω/km，20 ℃ 铜） */
  ohmsPerKm: number | null;
  /** 每千英尺电阻（Ω/1000 ft） */
  ohmsPer1000Ft: number | null;
  /** 机箱布线经验载流量（A） */
  ampacityA: number | null;
  /** 非法时的中文原因 */
  reason?: string;
}

/**
 * 解析用户输入的 AWG 线号，支持 4/0、3/0、2/0、1/0（或 0000、000、00、0）与 0-40
 *
 * @param raw - 原始输入
 * @returns 内部序号（0000 为 -3）；非法返回 null
 */
export function parseAwg(raw: string): number | null {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  if (!s) {
    return null;
  }

  // n/0 形式：4/0 -> -3, 3/0 -> -2, 2/0 -> -1, 1/0 -> 0
  const aught = /^([1-4])\/0$/.exec(s);
  if (aught) {
    const n = Number(aught[1]);
    return 1 - n;
  }

  // 多个 0 形式：0000 -> -3, 000 -> -2, 00 -> -1；单个 0 落到下面的整数分支
  if (/^0{2,4}$/.test(s)) {
    // 0000 -> -3, 000 -> -2, 00 -> -1
    return 1 - s.length;
  }

  if (!/^\d{1,2}$/.test(s)) {
    return null;
  }

  const n = Number(s);
  if (n > 40) {
    return null;
  }
  return n;
}

/**
 * 将内部序号格式化为标准线号显示文本
 *
 * @param n - 内部序号（-3..40）
 * @returns 如 4/0 AWG、12 AWG
 */
export function formatAwg(n: number): string {
  if (n < 0) {
    return `${1 - n}/0 AWG`;
  }
  return `${n} AWG`;
}

/**
 * 计算给定 AWG 线号的几何与电气参数
 *
 * @param rawGauge - 用户输入的线号字符串
 * @returns 直径、截面积、电阻、载流量等
 */
export function calculateAwg(rawGauge: string): AwgResult {
  const n = parseAwg(rawGauge);
  if (n === null) {
    return {
      ok: false,
      diameterMm: null,
      diameterIn: null,
      areaMm2: null,
      kcmil: null,
      ohmsPerKm: null,
      ohmsPer1000Ft: null,
      ampacityA: null,
      reason:
        "请输入合法线号：4/0、3/0、2/0、1/0（或 0000/000/00/0）或 0–40 的整数",
    };
  }
  if (n < MIN_AWG || n > MAX_AWG) {
    return {
      ok: false,
      diameterMm: null,
      diameterIn: null,
      areaMm2: null,
      kcmil: null,
      ohmsPerKm: null,
      ohmsPer1000Ft: null,
      ampacityA: null,
      reason: "线号超出支持范围（4/0 – 40 AWG）",
    };
  }

  // 直径：36 AWG = 0.127 mm，每减 3 个线号直径约翻倍
  const diameterMm = 0.127 * 92 ** ((36 - n) / 39);
  const diameterIn = diameterMm / 25.4;
  const areaMm2 = (Math.PI * diameterMm ** 2) / 4;

  // 圆密耳（circular mil）面积：1 cmil 定义为直径 1 mil 的圆面积，故面积(cmil) = 直径(mil)²
  const diameterMil = diameterIn * 1000;
  const kcmil = diameterMil ** 2 / 1000;

  // 20 ℃ 铜电阻：ρL/A
  const areaM2 = areaMm2 * 1e-6;
  const ohmsPerM = COPPER_RESISTIVITY_OHM_M / areaM2;
  const ohmsPerKm = ohmsPerM * 1000;
  const ohmsPer1000Ft = ohmsPerM * 304.8;

  return {
    ok: true,
    diameterMm,
    diameterIn,
    areaMm2,
    kcmil,
    ohmsPerKm,
    ohmsPer1000Ft,
    ampacityA: AMPACITY_TABLE[n] ?? null,
  };
}

/**
 * 由输入直径（mm）反查最接近的标准 AWG 线号
 *
 * @param diameterMm - 目标导体直径（mm，正数）
 * @returns 最接近的线号序号及其直径与偏差；非法输入返回 null
 */
export function nearestAwgByDiameter(
  diameterMm: number,
): { gauge: number; diameterMm: number; deviationPct: number } | null {
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) {
    return null;
  }

  let best: { gauge: number; diameterMm: number; deviationPct: number } | null =
    null;
  for (let n = MIN_AWG; n <= MAX_AWG; n += 1) {
    const d = 0.127 * 92 ** ((36 - n) / 39);
    const deviationPct = Math.abs((d - diameterMm) / diameterMm) * 100;
    if (best === null || deviationPct < best.deviationPct) {
      best = { gauge: n, diameterMm: d, deviationPct };
    }
  }
  return best;
}
