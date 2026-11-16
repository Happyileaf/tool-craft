/**
 * 电阻 / 阻抗网络 Δ-Y（三角形-星形）双向等效变换（零依赖纯函数）
 *
 * 端子命名：A、B、C；Δ（三角形）三边电阻 R_AB、R_BC、R_CA；
 * Y（星形）三臂电阻 R_A、R_B、R_C（中心节点 N）。
 *
 * Δ → Y：
 *   R_A = R_AB·R_CA / (R_AB + R_BC + R_CA)
 *   R_B = R_AB·R_BC / (R_AB + R_BC + R_CA)
 *   R_C = R_BC·R_CA / (R_AB + R_BC + R_CA)
 *
 * Y → Δ：
 *   R_AB = R_A·R_B + R_B·R_C + R_C·R_A，再除以对臂 R_C
 *   R_BC = 上述和 / R_A
 *   R_CA = 上述和 / R_B
 *
 * 平衡网络（三边 / 三臂相等）：R_Y = R_Δ / 3，R_Δ = 3·R_Y。
 * 本模块不触碰 DOM 与 React，非法输入以抛出 Error 的方式返回中文提示。
 */

export type TransformDirection = 'delta-to-wye' | 'wye-to-delta';

export interface DeltaResistors {
  /** 三角形边电阻 R_AB（Ω） */
  rab: number;
  /** 三角形边电阻 R_BC（Ω） */
  rbc: number;
  /** 三角形边电阻 R_CA（Ω） */
  rca: number;
}

export interface WyeResistors {
  /** 星形臂电阻 R_A（Ω，A 到中心节点 N） */
  ra: number;
  /** 星形臂电阻 R_B（Ω） */
  rb: number;
  /** 星形臂电阻 R_C（Ω） */
  rc: number;
}

function requirePositive(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} 不是有效数字`);
  }
  if (value <= 0) {
    throw new Error(`${name} 必须为正数`);
  }
  return value;
}

const UNIT_FACTORS: Record<string, number> = {
  '': 1,
  Ω: 1,
  ω: 1,
  ohm: 1,
  k: 1e3,
  kΩ: 1e3,
  kω: 1e3,
  kohm: 1e3,
  m: 1e6,
  mΩ: 1e6,
  mω: 1e6,
  mohm: 1e6,
};

/**
 * 解析带可选单位后缀的电阻输入，统一换算为 Ω。
 *
 * 支持：纯数字（30）、k / kΩ / kohm（×1e3）、M / MΩ / mohm（×1e6），
 * 例如 `1k` → 1000、`2.2kΩ` → 2200、`4.7M` → 4700000、`330` → 330。
 */
export function parseResistance(input: string, name: string): number {
  const text = input.trim().replace(/\s+/g, '');
  if (text === '') {
    throw new Error(`${name} 不能为空`);
  }
  const match = /^([0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)(Ω|ohm|kΩ|kohm|k|mΩ|mohm|m)?$/i.exec(text);
  if (!match || match[1] === undefined) {
    throw new Error(`${name} 格式无效：${input}（示例：330、1k、2.2kΩ、4.7M）`);
  }
  const numeric = Number(match[1]);
  // 注意：Ω 小写化为 ω，因此映射表同时收录大小写两种希腊字母形式
  const suffix = (match[2] ?? '').toLowerCase();
  const factor = UNIT_FACTORS[suffix];
  if (factor === undefined) {
    throw new Error(`${name} 单位不支持：${match[2]}`);
  }
  return requirePositive(numeric * factor, name);
}

/**
 * Δ（三角形）→ Y（星形）
 *
 * @param delta - 三角形三边电阻
 * @returns 星形三臂电阻
 */
export function deltaToWye(delta: DeltaResistors): WyeResistors {
  const rab = requirePositive(delta.rab, 'R_AB');
  const rbc = requirePositive(delta.rbc, 'R_BC');
  const rca = requirePositive(delta.rca, 'R_CA');
  const sum = rab + rbc + rca;
  if (!Number.isFinite(sum) || sum <= 0) {
    throw new Error('三边电阻之和无效，无法变换');
  }
  return {
    ra: (rab * rca) / sum,
    rb: (rab * rbc) / sum,
    rc: (rbc * rca) / sum,
  };
}

/**
 * Y（星形）→ Δ（三角形）
 *
 * @param wye - 星形三臂电阻
 * @returns 三角形三边电阻
 */
export function wyeToDelta(wye: WyeResistors): DeltaResistors {
  const ra = requirePositive(wye.ra, 'R_A');
  const rb = requirePositive(wye.rb, 'R_B');
  const rc = requirePositive(wye.rc, 'R_C');
  const pairSum = ra * rb + rb * rc + rc * ra;
  if (!Number.isFinite(pairSum) || pairSum <= 0) {
    throw new Error('三臂电阻两两乘积之和无效，无法变换');
  }
  return {
    rab: pairSum / rc,
    rbc: pairSum / ra,
    rca: pairSum / rb,
  };
}

/**
 * 判断网络是否平衡（三个电阻相等，容差 1e-9 相对误差）
 */
export function isBalanced(values: number[]): boolean {
  const first = values[0];
  if (first === undefined) return false;
  return values.every((v) => Math.abs(v - first) <= Math.abs(first) * 1e-9);
}

/**
 * 双向变换入口
 */
export function transform(
  direction: TransformDirection,
  input: DeltaResistors | WyeResistors,
): DeltaResistors | WyeResistors {
  if (direction === 'delta-to-wye') {
    return deltaToWye(input as DeltaResistors);
  }
  return wyeToDelta(input as WyeResistors);
}
