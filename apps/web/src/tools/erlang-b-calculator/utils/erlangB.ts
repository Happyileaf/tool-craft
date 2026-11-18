/**
 * Erlang B 中继线话务模型纯函数（ITU-T E.600 术语体系）。
 *
 * Erlang B 描述「阻塞呼叫被清除」的中继线群：给定到达话务量 A（Erlang）
 * 与中继线数 N（整数），呼叫到达瞬时 N 条线全忙的概率即阻塞概率
 *
 *   B(N, A) = (A^N / N!) / Σ(k=0..N) A^k / k!
 *
 * 直接计算 A^N/N! 在 N 稍大时即上溢，因此采用数值稳定的递推（递归）形式：
 *   B(0, A) = 1；B(n, A) = (A · B(n−1, A)) / (n + A · B(n−1, A))
 * 该递推与闭式等价，且全程在普通浮点范围内。
 *
 * 全部为零依赖数学计算，不触碰 DOM / React。
 */

/** 话务量 / 线数的合法输入范围 */
export const ERBOUNDS = {
  /** 单群中继线数上限，超过该规模工程上应拆群，且递推收益递减 */
  maxLines: 10000,
  /** 话务量上限（Erlang），与万线规模匹配并防止无意义的超大输入 */
  maxTraffic: 100000,
} as const;

/**
 * 正向计算 Erlang B 阻塞概率（数值稳定递推形式）。
 *
 * @param lines 中继线数 N，必须为 ≥1 的整数
 * @param trafficErlang 到达话务量 A（Erlang），必须为非负数
 * @returns 阻塞概率 B(N,A)，区间 [0,1]
 * @throws 输入非法时抛错
 */
export function erlangBBlocking(lines: number, trafficErlang: number): number {
  assertLines(lines);
  assertTraffic(trafficErlang);
  if (trafficErlang === 0) {
    return 0;
  }
  let blocking = 1; // B(0, A) = 1
  for (let n = 1; n <= lines; n += 1) {
    blocking = (trafficErlang * blocking) / (n + trafficErlang * blocking);
  }
  return blocking;
}

/**
 * 反算满足目标阻塞概率所需的最少中继线数。
 *
 * 策略：B(N,A) 随 N 单调下降，从 N=1 起逐项递推，取首个 B ≤ target 的 N；
 * 对极小目标概率配合万线上限兜底，避免无界循环。
 *
 * @param trafficErlang 到达话务量 A（Erlang）
 * @param targetBlocking 目标阻塞概率，区间 (0,1)
 * @returns 最少线数 N 及该 N 下的实际阻塞概率
 */
export function requiredLines(
  trafficErlang: number,
  targetBlocking: number,
): { lines: number; blocking: number } {
  assertTraffic(trafficErlang);
  if (!(Number.isFinite(targetBlocking) && targetBlocking > 0 && targetBlocking < 1)) {
    throw new Error('目标阻塞概率必须在 0 与 1 之间（不含端点）');
  }
  if (trafficErlang === 0) {
    return { lines: 1, blocking: 0 };
  }
  let blocking = 1;
  for (let n = 1; n <= ERBOUNDS.maxLines; n += 1) {
    blocking = (trafficErlang * blocking) / (n + trafficErlang * blocking);
    if (blocking <= targetBlocking) {
      return { lines: n, blocking };
    }
  }
  throw new Error(`在 ${ERBOUNDS.maxLines} 条中继线内仍无法达到目标阻塞概率，请检查话务量或目标值`);
}

/**
 * 给定线数与目标阻塞概率，反算可承载的最大话务量 A（Erlang）。
 *
 * B(N,A) 对固定 N 随 A 单调上升，使用二分搜索求 B(N,A)=target 的根。
 *
 * @param lines 中继线数 N
 * @param targetBlocking 目标阻塞概率，区间 (0,1)
 * @returns 话务量 A（Erlang，保留 4 位小数）与该话务量下的实际阻塞概率
 */
export function supportedTraffic(
  lines: number,
  targetBlocking: number,
): { trafficErlang: number; blocking: number } {
  assertLines(lines);
  if (!(Number.isFinite(targetBlocking) && targetBlocking > 0 && targetBlocking < 1)) {
    throw new Error('目标阻塞概率必须在 0 与 1 之间（不含端点）');
  }
  let low = 0;
  let high = 1;
  // 扩张上界直到 B(N, high) 超过目标
  while (erlangBBlocking(lines, high) < targetBlocking && high < ERBOUNDS.maxTraffic) {
    low = high;
    high = Math.min(high * 2, ERBOUNDS.maxTraffic);
  }
  // 二分 60 轮，远超双精度分辨率
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const mid = (low + high) / 2;
    if (erlangBBlocking(lines, mid) > targetBlocking) {
      high = mid;
    } else {
      low = mid;
    }
  }
  const trafficErlang = round4(low);
  return { trafficErlang, blocking: erlangBBlocking(lines, trafficErlang) };
}

/**
 * 生成灵敏度对照表：固定话务量，输出 N−2 … N+2 各线数下的阻塞概率。
 *
 * @param lines 中心线数
 * @param trafficErlang 话务量
 * @returns 每项含线数、阻塞概率与相对中心线的增减标记
 */
export function sensitivityTable(
  lines: number,
  trafficErlang: number,
): Array<{ lines: number; blocking: number; delta: -2 | -1 | 0 | 1 | 2 }> {
  assertLines(lines);
  assertTraffic(trafficErlang);
  const deltas = [-2, -1, 0, 1, 2] as const;
  return deltas.flatMap((delta) => {
    const candidate = lines + delta;
    if (candidate < 1) {
      return [];
    }
    return [
      {
        lines: candidate,
        blocking: erlangBBlocking(candidate, trafficErlang),
        delta,
      },
    ];
  });
}

/**
 * 生成「目标阻塞概率 → 所需线数」的经典 Erlang B 查表行。
 *
 * @param trafficErlang 话务量
 * @param targets 工程常用目标阻塞概率序列
 */
export function gradeOfServiceTable(
  trafficErlang: number,
  targets: number[],
): Array<{ target: number; lines: number; blocking: number }> {
  assertTraffic(trafficErlang);
  return targets.map((target) => {
    const result = requiredLines(trafficErlang, target);
    return { target, lines: result.lines, blocking: result.blocking };
  });
}

/** 校验线数输入 */
function assertLines(lines: number): void {
  if (!Number.isInteger(lines) || lines < 1) {
    throw new Error('中继线数必须为 ≥ 1 的整数');
  }
  if (lines > ERBOUNDS.maxLines) {
    throw new Error(`中继线数不能超过 ${ERBOUNDS.maxLines}`);
  }
}

/** 校验话务量输入 */
function assertTraffic(trafficErlang: number): void {
  if (!Number.isFinite(trafficErlang) || trafficErlang < 0) {
    throw new Error('话务量必须为非负有限数值（Erlang）');
  }
  if (trafficErlang > ERBOUNDS.maxTraffic) {
    throw new Error(`话务量不能超过 ${ERBOUNDS.maxTraffic} Erlang`);
  }
}

/** 保留 4 位小数，消除二分尾差 */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** 阻塞概率格式化为百分比文本（含千分位级小概率的科学计数兜底） */
export function formatBlocking(blocking: number): string {
  if (blocking === 0) {
    return '0%';
  }
  if (blocking < 0.0001) {
    return `${(blocking * 100).toExponential(2)}%`;
  }
  return `${(blocking * 100).toFixed(4)}%`;
}
