/**
 * LED 限流电阻计算与 E24 标称阻值选型。
 * 纯数值运算，无外部依赖；固定输入必有固定输出。
 */

/** E24 系列 24 个基础标称值（1.0..9.1，配合十进制倍率覆盖全量程） */
export const E24_BASE = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
] as const;

export type LedTopology = 'single' | 'series' | 'parallel';

export interface LedInput {
  /** 电源电压（V） */
  supplyVoltage: number;
  /** 单颗 LED 正向压降（V） */
  forwardVoltage: number;
  /** 期望支路电流（mA） */
  currentMa: number;
  topology: LedTopology;
  /** 串联 LED 颗数（topology=series 时生效） */
  seriesCount: number;
  /** 并联支路数（topology=parallel 时生效，每条支路一颗 LED） */
  parallelCount: number;
}

export interface LedResult {
  ok: boolean;
  error: string | null;
  /** 理论电阻（Ω） */
  theoreticalOhms: number;
  /** 推荐 E24 标称电阻（Ω） */
  nominalOhms: number;
  /** 采用标称电阻后的实际电流（mA） */
  actualCurrentMa: number;
  /** 实际电流相对期望值的偏差（%，负值表示偏保守、不过流） */
  currentDeviationPct: number;
  /** 电阻功耗（W） */
  resistorPowerW: number;
  /** 建议电阻额定功率（W，按 2 倍冗余） */
  ratedPowerW: number;
}

/** 在 E24 全量程中选取不小于 targetOhms 的最小标称值（向上优先，防止过流） */
export function pickE24(targetOhms: number): number {
  if (targetOhms <= 0) return E24_BASE[0];
  const decade = Math.floor(Math.log10(targetOhms));
  const scaled = targetOhms / 10 ** decade;
  // 在当前数量级的 24 个标称值里找第一个 >= scaled 的
  for (const base of E24_BASE) {
    if (base >= scaled - 1e-9) {
      // 归一化浮点尾差（如 1.1×100=110.00000000000001）
      return Number((base * 10 ** decade).toPrecision(12));
    }
  }
  // 当前量级全部小于目标（scaled>9.1，理论上不会发生），跳到下一级 1.0
  return Number((E24_BASE[0] * 10 ** (decade + 1)).toPrecision(12));
}

/** 按拓扑折算 LED 总压降与总电流 */
function resolveTopology(input: LedInput): { totalVf: number; totalCurrentMa: number } {
  const { topology, forwardVoltage, currentMa, seriesCount, parallelCount } = input;
  if (topology === 'series') {
    return { totalVf: forwardVoltage * seriesCount, totalCurrentMa: currentMa };
  }
  if (topology === 'parallel') {
    // 每条支路一颗 LED、共享同一限流电阻时按总支路电流换算
    return { totalVf: forwardVoltage, totalCurrentMa: currentMa * parallelCount };
  }
  return { totalVf: forwardVoltage, totalCurrentMa: currentMa };
}

/** 主计算：欧姆定律求理论电阻，E24 向上选型后回算实际电流、偏差与功耗 */
export function calculateLedResistor(input: LedInput): LedResult {
  const { supplyVoltage, topology, seriesCount, parallelCount } = input;
  const fail = (error: string): LedResult => ({
    ok: false,
    error,
    theoreticalOhms: 0,
    nominalOhms: 0,
    actualCurrentMa: 0,
    currentDeviationPct: 0,
    resistorPowerW: 0,
    ratedPowerW: 0,
  });

  if (!Number.isFinite(supplyVoltage) || supplyVoltage <= 0) {
    return fail('电源电压必须为大于 0 的数值');
  }
  if (!Number.isFinite(input.forwardVoltage) || input.forwardVoltage <= 0) {
    return fail('LED 正向压降必须为大于 0 的数值');
  }
  if (!Number.isFinite(input.currentMa) || input.currentMa <= 0) {
    return fail('期望电流必须为大于 0 的数值（mA）');
  }
  if (topology === 'series' && (!Number.isInteger(seriesCount) || seriesCount < 1)) {
    return fail('串联颗数必须为不小于 1 的整数');
  }
  if (topology === 'parallel' && (!Number.isInteger(parallelCount) || parallelCount < 1)) {
    return fail('并联支路数必须为不小于 1 的整数');
  }

  const { totalVf, totalCurrentMa } = resolveTopology(input);
  if (supplyVoltage <= totalVf) {
    return fail(
      `电源电压 ${supplyVoltage}V 不大于 LED 总压降 ${totalVf.toFixed(2)}V，无法通过电阻限流，请提高电源电压或减少 LED 数量`,
    );
  }

  const currentA = totalCurrentMa / 1000;
  const theoreticalOhms = (supplyVoltage - totalVf) / currentA;
  const nominalOhms = pickE24(theoreticalOhms);
  const actualCurrentMa = ((supplyVoltage - totalVf) / nominalOhms) * 1000;
  const currentDeviationPct = ((actualCurrentMa - totalCurrentMa) / totalCurrentMa) * 100;
  const resistorPowerW = currentA * currentA * nominalOhms;

  // 额定功率按 2 倍冗余并向上对齐常用档（1/8, 1/4, 1/2, 1, 2, 5 W）
  const standardRatings = [0.125, 0.25, 0.5, 1, 2, 5];
  const needed = resistorPowerW * 2;
  const ratedPowerW = standardRatings.find((r) => r >= needed) ?? Math.ceil(needed);

  return {
    ok: true,
    error: null,
    theoreticalOhms,
    nominalOhms,
    actualCurrentMa,
    currentDeviationPct,
    resistorPowerW,
    ratedPowerW,
  };
}

/** 电阻值自适应量级格式化：Ω / kΩ / MΩ */
export function formatOhms(ohms: number): string {
  if (ohms >= 1_000_000) return `${trim(ohms / 1_000_000)} MΩ`;
  if (ohms >= 1_000) return `${trim(ohms / 1_000)} kΩ`;
  return `${trim(ohms)} Ω`;
}

function trim(n: number): string {
  return Number(n.toFixed(3)).toString();
}
