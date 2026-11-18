import {
  BISECTION_MAX_ITERATIONS,
  BISECTION_TOLERANCE,
  GOS_LEVELS,
  MAX_TRAFFIC,
} from '../constants';

/**
 * Erlang B 阻塞概率（M/M/c/c 损失制），数值稳定的递归形式：
 * B(0)=1（空系统时“到达即损失”的归一化初值），B(n) = A·B(n-1) / (n + A·B(n-1))。
 *
 * @param traffic - 忙时话务量 A（Erlang），必须为正数
 * @param channels - 中继线 / 信道数 N，必须为非负整数
 * @returns 阻塞概率 B，区间 (0, 1)
 */
export function erlangB(traffic: number, channels: number): number {
  if (!Number.isFinite(traffic) || traffic <= 0) {
    throw new Error('话务量 A 必须为正数（Erlang）');
  }
  if (!Number.isInteger(channels) || channels < 0) {
    throw new Error('中继线数 N 必须为非负整数');
  }
  let b = 1;
  for (let n = 1; n <= channels; n += 1) {
    b = (traffic * b) / (n + traffic * b);
  }
  return channels === 0 ? 1 : b;
}

/**
 * 反向问题 ①：给定话务量与目标服务等级（阻塞率上限），求最少中继线数。
 * B 随 N 单调递减，从 N=1 起逐项递归直到满足 GoS。
 *
 * @returns 满足 B(N) ≤ gos 的最小 N
 */
export function minimumChannelsForGoS(traffic: number, gos: number): number {
  if (!Number.isFinite(traffic) || traffic <= 0) {
    throw new Error('话务量 A 必须为正数（Erlang）');
  }
  if (!(gos > 0 && gos < 1)) {
    throw new Error('目标阻塞率 GoS 必须位于 (0, 1) 区间');
  }
  let b = 1;
  for (let n = 1; n < 100_000; n += 1) {
    b = (traffic * b) / (n + traffic * b);
    if (b <= gos) {
      return n;
    }
  }
  throw new Error('中继线数超出可计算范围（>100000）');
}

/**
 * 反向问题 ②：给定中继线数与目标阻塞率，二分反算可承载的最大话务量。
 * B 对 A 单调递增，因此可在 (0, MAX_TRAFFIC) 上二分收敛。
 *
 * @returns 满足 B(A, N) ≤ gos 的最大话务量（Erlang）
 */
export function maximumTrafficForGoS(channels: number, gos: number): number {
  if (!Number.isInteger(channels) || channels <= 0) {
    throw new Error('中继线数 N 必须为正整数');
  }
  if (!(gos > 0 && gos < 1)) {
    throw new Error('目标阻塞率 GoS 必须位于 (0, 1) 区间');
  }

  let low = 0;
  let high = Math.max(MAX_TRAFFIC, channels * 2);
  // 确认上界确实越过目标阻塞率，否则继续加倍
  while (erlangB(high, channels) < gos) {
    high *= 2;
    if (high > MAX_TRAFFIC * 1024) {
      throw new Error('话务量反算超出可计算范围');
    }
  }

  for (let i = 0; i < BISECTION_MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const b = erlangB(mid, channels);
    if (Math.abs(high - low) < BISECTION_TOLERANCE) {
      break;
    }
    if (b > gos) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return low;
}

/** 灵敏度对照表行：N-1 / N / N+1 在 0.1% / 1% / 5% 三档 GoS 下的承载话务量 */
export interface SensitivityRow {
  channels: number;
  blockAtCurrentTraffic: number;
  maxTrafficByGoS: Record<(typeof GOS_LEVELS)[number], number>;
}

/**
 * 生成 N-1 / N / N+1 三行灵敏度对照，每行给出当前话务量下的实际阻塞率
 * 以及三档 GoS（0.1% / 1% / 5%）对应的可承载最大话务量。
 */
export function buildSensitivityTable(
  traffic: number,
  channels: number,
): SensitivityRow[] {
  const base = Math.max(1, channels);
  return [base - 1, base, base + 1].filter((n) => n >= 1).map((n) => ({
    channels: n,
    blockAtCurrentTraffic: erlangB(traffic, n),
    maxTrafficByGoS: {
      0.001: maximumTrafficForGoS(n, GOS_LEVELS[0]),
      0.01: maximumTrafficForGoS(n, GOS_LEVELS[1]),
      0.05: maximumTrafficForGoS(n, GOS_LEVELS[2]),
    },
  }));
}

/** 阻塞率曲线采样点：N 从 1 到给定信道数的 B 变化序列 */
export function blockCurve(traffic: number, maxChannels: number): Array<{ n: number; b: number }> {
  if (!Number.isFinite(traffic) || traffic <= 0) {
    throw new Error('话务量 A 必须为正数（Erlang）');
  }
  if (!Number.isInteger(maxChannels) || maxChannels <= 0 || maxChannels > 1000) {
    throw new Error('信道数上限必须为 1–1000 的整数');
  }
  const points: Array<{ n: number; b: number }> = [];
  let b = 1;
  for (let n = 1; n <= maxChannels; n += 1) {
    b = (traffic * b) / (n + traffic * b);
    points.push({ n, b });
  }
  return points;
}
