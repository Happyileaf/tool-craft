/**
 * Erlang B 中继线话务量计算纯函数模块。
 *
 * Erlang B 公式描述「阻塞呼叫清除（M/M/c/c）」模型：到达为泊松过程、
 * 占用时长指数分布、c 条中继线全忙时新呼叫立即被清除。阻塞概率
 *
 *   B(c, A) = (A^c / c!) / (Σ_{k=0..c} A^k / k!)
 *
 * 为避免大 c 下阶乘溢出，采用递推式  B_0 = 1；B_n = (A·B_{n-1}) / (n + A·B_{n-1})。
 * 所有函数均为确定性纯函数，不依赖浏览器 API。
 */

/** 计算结果中的统一错误 / 警告容器 */
export interface ErlangResult {
  /** 阻塞概率（0–1），无法计算时为 null */
  blocking: number | null;
  /** 阻断性错误信息 */
  errors: string[];
  /** 非阻断性提示 */
  warnings: string[];
}

/**
 * 正向计算：由中继线数 c 与话务量 A（Erlang）求阻塞概率。
 *
 * @param lines - 中继线数 c（正整数）
 * @param offered - 流入话务量 A（Erlang，非负数）
 * @returns 阻塞概率与诊断信息
 */
export function blockingProbability(lines: number, offered: number): ErlangResult {
  const errors = validateInputs(lines, offered);
  if (errors.length > 0) {
    return { blocking: null, errors, warnings: [] };
  }
  const warnings: string[] = [];
  const blocking = recurseErlangB(lines, offered);
  if (blocking > 0.5) {
    warnings.push('阻塞概率超过 50%，中继线严重不足，实际网络通常按 1%–5% GOS 规划');
  }
  return { blocking, errors, warnings };
}

/**
 * 反向求解：给定目标阻塞概率（GoS）与话务量 A，求所需最少中继线数。
 *
 * @param offered - 流入话务量 A（Erlang）
 * @param targetBlocking - 目标阻塞概率（0–1，不含 0）
 * @returns 所需线数与诊断信息
 */
export function requiredLines(
  offered: number,
  targetBlocking: number,
): ErlangResult & { lines: number | null } {
  const errors: string[] = [];
  if (!Number.isFinite(offered) || offered < 0) {
    errors.push('话务量必须是非负数值');
  }
  if (!Number.isFinite(targetBlocking) || targetBlocking <= 0 || targetBlocking >= 1) {
    errors.push('目标阻塞概率必须在 0 与 1 之间（不含端点）');
  }
  if (errors.length > 0) {
    return { lines: null, blocking: null, errors, warnings: [] };
  }

  // A=0 时 1 条线即可满足任意 GoS（无呼叫到达）
  if (offered === 0) {
    return { lines: 1, blocking: 0, errors, warnings: [] };
  }

  const maxLines = 100000;
  for (let c = 1; c <= maxLines; c += 1) {
    const blocking = recurseErlangB(c, offered);
    if (blocking <= targetBlocking) {
      return { lines: c, blocking, errors, warnings: [] };
    }
  }
  return {
    lines: null,
    blocking: null,
    errors: [`在 ${maxLines} 条中继线内仍无法达到目标阻塞概率，请检查话务量是否过大`],
    warnings: [],
  };
}

/**
 * 话务量反算：给定中继线数 c 与目标阻塞概率，二分求最大可承载话务量 A。
 *
 * @param lines - 中继线数 c
 * @param targetBlocking - 目标阻塞概率（0–1，不含 0）
 * @returns 可承载话务量（Erlang）与诊断信息
 */
export function offeredLoad(
  lines: number,
  targetBlocking: number,
): ErlangResult & { offered: number | null } {
  const errors: string[] = [];
  if (!Number.isInteger(lines) || lines < 1) {
    errors.push('中继线数必须是不小于 1 的整数');
  }
  if (!Number.isFinite(targetBlocking) || targetBlocking <= 0 || targetBlocking >= 1) {
    errors.push('目标阻塞概率必须在 0 与 1 之间（不含端点）');
  }
  if (errors.length > 0) {
    return { offered: null, blocking: null, errors, warnings: [] };
  }

  // B(c, A) 关于 A 单调递增，二分查找使 B = target 的 A
  let low = 0;
  let high = Math.max(lines * 4, 1);
  while (recurseErlangB(lines, high) < targetBlocking) {
    high *= 2;
    if (high > 1e9) {
      return {
        offered: null,
        blocking: null,
        errors: ['话务量求解超出数值范围'],
        warnings: [],
      };
    }
  }
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    if (recurseErlangB(lines, mid) > targetBlocking) {
      high = mid;
    } else {
      low = mid;
    }
  }
  const offered = (low + high) / 2;
  return { offered, blocking: recurseErlangB(lines, offered), errors, warnings: [] };
}

/**
 * 生成灵敏度对照表：固定话务量，逐线数列出阻塞概率。
 *
 * @param offered - 流入话务量
 * @param maxLines - 表内最大线数（1–200）
 * @returns 线数 → 阻塞概率对照
 */
export function sensitivityTable(
  offered: number,
  maxLines: number,
): { errors: string[]; rows: Array<{ lines: number; blocking: number }> } {
  const errors: string[] = [];
  if (!Number.isFinite(offered) || offered < 0) {
    errors.push('话务量必须是非负数值');
  }
  if (!Number.isInteger(maxLines) || maxLines < 1 || maxLines > 200) {
    errors.push('对照表最大线数必须是 1–200 之间的整数');
  }
  if (errors.length > 0) {
    return { errors, rows: [] };
  }
  const rows: Array<{ lines: number; blocking: number }> = [];
  for (let c = 1; c <= maxLines; c += 1) {
    rows.push({ lines: c, blocking: recurseErlangB(c, offered) });
  }
  return { errors, rows };
}

/**
 * Erlang B 递推核心（数值稳定，不直接计算阶乘）。
 *
 * @param lines - 中继线数 c（调用方已校验为正整数）
 * @param offered - 话务量 A（非负）
 * @returns 阻塞概率
 */
export function recurseErlangB(lines: number, offered: number): number {
  let b = 1; // B(0, A) = 1
  for (let n = 1; n <= lines; n += 1) {
    b = (offered * b) / (n + offered * b);
  }
  return b;
}

/** 校验正向计算的输入 */
function validateInputs(lines: number, offered: number): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(lines) || lines < 1) {
    errors.push('中继线数必须是不小于 1 的整数');
  }
  if (!Number.isFinite(offered) || offered < 0) {
    errors.push('话务量必须是非负数值（单位 Erlang）');
  }
  return errors;
}

/** 常用服务等级（GoS）预设 */
export const GOS_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: '1%（高服务质量）', value: 0.01 },
  { label: '2%（企业语音常用）', value: 0.02 },
  { label: '5%（移动网络典型）', value: 0.05 },
  { label: '10%（低成本场景）', value: 0.1 },
];

/** 默认样例：10 Erlang、5 条线 */
export const DEFAULT_LINES = 5;
export const DEFAULT_OFFERED = 10;
export const DEFAULT_GOS = 0.01;
