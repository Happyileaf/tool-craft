/**
 * 三维旋转表示互转纯函数：四元数 (x, y, z, w) ↔ 欧拉角 (roll, pitch, yaw) ↔ 3×3 旋转矩阵
 *
 * 约定：
 * - 四元数分量顺序为 (x, y, z, w)，w 为实部；表示旋转时需为单位四元数。
 * - 欧拉角采用 Tait-Bryan 内旋（intrinsic）约定，旋转顺序如 'XYZ' 表示
 *   先绕机体 X 轴、再绕机体 Y 轴、最后绕机体 Z 轴，矩阵 R = R_first · R_middle · R_last。
 * - 分量含义固定为 roll = 绕 X 轴、pitch = 绕 Y 轴、yaw = 绕 Z 轴。
 * - 所有角度内部以弧度计算，角度（度）仅用于输入 / 输出换算。
 * - 矩阵为行优先二维数组 m[row][col]。
 *
 * 不接触 DOM / React，不引入任何第三方依赖。
 */

/** 浮点比较统一容差：矩阵正交性校验等 */
export const EPS = 1e-6;

/** 四元数范数偏离 1 超过该阈值时给出归一化提示 */
export const NORM_WARNING_EPS = 1e-9;

/** 中间轴角接近 ±90° 的判定阈值（|sin θ| 超过 0.499π 对应正弦值视为万向锁） */
export const GIMBAL_LOCK_SIN = Math.sin(Math.PI * 0.499);

/** 欧拉旋转顺序：Tait-Bryan 内旋，三种轴各出现一次 */
export type EulerOrder = 'XYZ' | 'YXZ' | 'ZYX' | 'ZXY' | 'YZX' | 'XZY';

/** 受支持的六种旋转顺序 */
export const EULER_ORDERS: EulerOrder[] = ['XYZ', 'YXZ', 'ZYX', 'ZXY', 'YZX', 'XZY'];

/** 四元数：x/y/z 为虚部分量，w 为实部分量 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** 欧拉角：roll 绕 X、pitch 绕 Y、yaw 绕 Z（弧度或度由调用处参数决定） */
export interface EulerAngles {
  roll: number;
  pitch: number;
  yaw: number;
}

/** 3×3 旋转矩阵（行优先） */
export type Matrix3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/** 归一化四元数结果 */
export interface NormalizedQuaternion {
  /** 归一化后的单位四元数 */
  q: Quaternion;
  /** 输入四元数原始范数 */
  norm: number;
  /** 范数非 1（非单位四元数）时的提示信息 */
  warning?: string;
}

/** 错误结果 */
export interface QuaternionError {
  /** 错误说明 */
  error: string;
}

/** 矩阵转四元数结果：成功返回四元数，失败返回错误 */
export type QuaternionResult = Quaternion | QuaternionError;

/** 四元数 / 矩阵转欧拉角结果（角度单位由调用处参数决定） */
export interface EulerResult extends EulerAngles {
  /** 中间轴角处于 ±90° 附近（万向锁）时为 true */
  gimbalLock?: boolean;
}

/** 判断是否为错误结果（判别联合）；可用于 QuaternionResult / EulerResult | QuaternionError */
export function isQuaternionError(result: unknown): result is QuaternionError {
  return typeof (result as QuaternionError)?.error === 'string';
}

/** 构造四元数，默认单位四元数 */
export function quaternion(x = 0, y = 0, z = 0, w = 1): Quaternion {
  return { x, y, z, w };
}

/** 判断四元数任一分量不是有限数 */
function hasNonFinite(q: Quaternion): boolean {
  return (
    !Number.isFinite(q.x) ||
    !Number.isFinite(q.y) ||
    !Number.isFinite(q.z) ||
    !Number.isFinite(q.w)
  );
}

/**
 * 归一化四元数
 *
 * @param input - 任意非零四元数（允许非单位）
 * @returns 归一化结果（含原范数与非单位提示）；全零或含 NaN/Infinity 时返回 error
 */
export function normalizeQuaternion(input: Quaternion): NormalizedQuaternion | QuaternionError {
  if (hasNonFinite(input)) {
    return { error: '四元数包含 NaN 或 Infinity，无法归一化' };
  }
  const norm = Math.hypot(input.x, input.y, input.z, input.w);
  if (norm < EPS) {
    return { error: '四元数不能为全零（范数为 0，无对应旋转）' };
  }
  const q: Quaternion = {
    x: input.x / norm,
    y: input.y / norm,
    z: input.z / norm,
    w: input.w / norm,
  };
  const warning =
    Math.abs(norm - 1) > NORM_WARNING_EPS
      ? `输入为非单位四元数（范数 = ${trimNumber(norm)}），已自动归一化`
      : undefined;
  return { q, norm, warning };
}

/** 四元数乘法（Hamilton 积）：先施加 p 旋转、再施加 q 旋转时复合为 multiplyQuaternion(q, p) */
export function multiplyQuaternion(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/** 绕单个坐标轴旋转 angle（弧度）的单位四元数，axis 为 0/1/2 对应 X/Y/Z */
function axisQuaternion(axis: 0 | 1 | 2, angle: number): Quaternion {
  const half = angle / 2;
  const s = Math.sin(half);
  const q: Quaternion = { x: 0, y: 0, z: 0, w: Math.cos(half) };
  if (axis === 0) q.x = s;
  else if (axis === 1) q.y = s;
  else q.z = s;
  return q;
}

/**
 * 四元数 → 3×3 旋转矩阵（标准列向量公式）
 *
 * @param input - 四元数（非单位输入会先归一化）
 * @returns 3×3 旋转矩阵（行优先）
 * @throws 输入全零或含 NaN/Infinity
 */
export function quaternionToMatrix(input: Quaternion): Matrix3 {
  const normalized = normalizeQuaternion(input);
  if ('error' in normalized) {
    throw new Error(normalized.error);
  }
  const { x, y, z, w } = normalized.q;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
    [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
    [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
  ];
}

/**
 * 校验矩阵是否近似为合法旋转矩阵：元素有限、det 接近 +1、RᵀR 接近 I
 *
 * @param m - 3×3 矩阵
 * @param tolerance - 容差，默认 EPS
 * @returns 不合法时返回中文错误信息，合法返回 null
 */
export function validateRotationMatrix(m: Matrix3, tolerance = EPS): string | null {
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      if (!Number.isFinite(m[i]?.[j])) {
        return '矩阵包含空值、NaN 或 Infinity';
      }
    }
  }
  // 行列式（Sarrus 法则）
  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  if (Math.abs(det - 1) > tolerance) {
    return `矩阵行列式为 ${trimNumber(det)}，不接近 +1，不是有效的旋转矩阵（期望 det ≈ 1）`;
  }
  // RᵀR 应近似单位矩阵
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) {
        sum += at(m, k, i) * at(m, k, j);
      }
      const expected = i === j ? 1 : 0;
      if (Math.abs(sum - expected) > tolerance) {
        return '矩阵不满足 RᵀR ≈ I（列向量非单位长或互不正交），不是有效的旋转矩阵';
      }
    }
  }
  return null;
}

/**
 * 3×3 旋转矩阵 → 四元数（Shepperd 分支法，数值稳定）
 *
 * @param m - 3×3 矩阵
 * @param tolerance - 正交性校验容差，默认 EPS
 * @returns 四元数（w ≥ 0 以消除双覆盖歧义）或 { error }
 */
export function matrixToQuaternion(m: Matrix3, tolerance = EPS): QuaternionResult {
  const invalid = validateRotationMatrix(m, tolerance);
  if (invalid) {
    return { error: invalid };
  }
  const trace = m[0][0] + m[1][1] + m[2][2];
  let q: Quaternion;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2; // s = 4w
    q = {
      w: 0.25 * s,
      x: (m[2][1] - m[1][2]) / s,
      y: (m[0][2] - m[2][0]) / s,
      z: (m[1][0] - m[0][1]) / s,
    };
  } else if (m[0][0] >= m[1][1] && m[0][0] >= m[2][2]) {
    const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; // s = 4x
    q = {
      w: (m[2][1] - m[1][2]) / s,
      x: 0.25 * s,
      y: (m[0][1] + m[1][0]) / s,
      z: (m[0][2] + m[2][0]) / s,
    };
  } else if (m[1][1] > m[2][2]) {
    const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; // s = 4y
    q = {
      w: (m[0][2] - m[2][0]) / s,
      x: (m[0][1] + m[1][0]) / s,
      y: 0.25 * s,
      z: (m[1][2] + m[2][1]) / s,
    };
  } else {
    const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; // s = 4z
    q = {
      w: (m[1][0] - m[0][1]) / s,
      x: (m[0][2] + m[2][0]) / s,
      y: (m[1][2] + m[2][1]) / s,
      z: 0.25 * s,
    };
  }
  // 统一取 w ≥ 0 的表示，消除 q 与 -q 双覆盖
  if (q.w < 0) {
    q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
  }
  return q;
}

/** 角度 → 弧度 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** 弧度 → 角度 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** 顺序字符 → 轴下标（X=0、Y=1、Z=2） */
function axisIndex(ch: string): 0 | 1 | 2 {
  if (ch === 'X') return 0;
  if (ch === 'Y') return 1;
  return 2;
}

/** 数值裁剪到 [-1, 1]，消除 asin 域上的浮点尾差 */
function clampUnit(value: number): number {
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}

/** 矩阵行列取值 */
function at(m: Matrix3, i: number, j: number): number {
  return m[i]?.[j] ?? 0;
}

/**
 * 各顺序的欧拉角提取公式（由 R = R_first · R_middle · R_last 逐元素推导）。
 *
 * middle：中间轴角 B 用 asin 提取（分量下标、矩阵行列、符号）；
 * first / last：首轴角 A 与末轴角 C 用 atan2 提取（分量下标、两个分子 / 分母矩阵元素、符号）。
 */
interface OrderExtraction {
  /** 中间角写入的分量下标 */
  middleAxis: 0 | 1 | 2;
  /** sin(B) = sign · m[i][j] */
  middleEntry: [number, number, number];
  /** A = atan2(sign·m[..], m[..])：分量下标与两组矩阵行列、分子符号 */
  first: { axis: 0 | 1 | 2; numerator: [number, number]; denominator: [number, number]; sign: number };
  /** C = atan2(sign·m[..], m[..]) */
  last: { axis: 0 | 1 | 2; numerator: [number, number]; denominator: [number, number]; sign: number };
  /** 万向锁（末角 C 取 0）时恢复首角 A：atan2(分子, 分母)，sinB 表示中间角方向 ±1 */
  lockFirst: (m: Matrix3, sinB: number) => number;
}

/** 六种 Tait-Bryan 内旋顺序的提取规则表 */
const EXTRACTION: Record<EulerOrder, OrderExtraction> = {
  // R = Rx(A)·Ry(B)·Rz(C)
  XYZ: {
    middleAxis: 1,
    middleEntry: [0, 2, 1],
    first: { axis: 0, numerator: [1, 2], denominator: [2, 2], sign: -1 },
    last: { axis: 2, numerator: [0, 1], denominator: [0, 0], sign: -1 },
    lockFirst: (m, sinB) =>
      sinB > 0
        ? Math.atan2(at(m, 2, 1), at(m, 1, 1))
        : Math.atan2(at(m, 1, 0), at(m, 2, 0)),
  },
  // R = Ry(A)·Rx(B)·Rz(C)
  YXZ: {
    middleAxis: 0,
    middleEntry: [1, 2, -1],
    first: { axis: 1, numerator: [0, 2], denominator: [2, 2], sign: 1 },
    last: { axis: 2, numerator: [1, 0], denominator: [1, 1], sign: 1 },
    lockFirst: (m) => Math.atan2(-at(m, 2, 0), at(m, 0, 0)),
  },
  // R = Rz(A)·Ry(B)·Rx(C)
  ZYX: {
    middleAxis: 1,
    middleEntry: [2, 0, -1],
    first: { axis: 2, numerator: [1, 0], denominator: [0, 0], sign: 1 },
    last: { axis: 0, numerator: [2, 1], denominator: [2, 2], sign: 1 },
    lockFirst: (m) => Math.atan2(-at(m, 0, 1), at(m, 1, 1)),
  },
  // R = Rz(A)·Rx(B)·Ry(C)
  ZXY: {
    middleAxis: 0,
    middleEntry: [2, 1, 1],
    first: { axis: 2, numerator: [0, 1], denominator: [1, 1], sign: -1 },
    last: { axis: 1, numerator: [2, 0], denominator: [2, 2], sign: -1 },
    lockFirst: (m) => Math.atan2(at(m, 1, 0), at(m, 0, 0)),
  },
  // R = Ry(A)·Rz(B)·Rx(C)
  YZX: {
    middleAxis: 2,
    middleEntry: [1, 0, 1],
    first: { axis: 1, numerator: [2, 0], denominator: [0, 0], sign: -1 },
    last: { axis: 0, numerator: [1, 2], denominator: [1, 1], sign: -1 },
    lockFirst: (m) => Math.atan2(at(m, 0, 2), at(m, 2, 2)),
  },
  // R = Rx(A)·Rz(B)·Ry(C)
  XZY: {
    middleAxis: 2,
    middleEntry: [0, 1, -1],
    first: { axis: 0, numerator: [2, 1], denominator: [1, 1], sign: 1 },
    last: { axis: 1, numerator: [0, 2], denominator: [0, 0], sign: 1 },
    lockFirst: (m, sinB) => Math.atan2(sinB * at(m, 2, 0), at(m, 2, 2)),
  },
};

/**
 * 欧拉角 → 四元数
 *
 * 内旋约定 R = R_first · R_middle · R_last；
 * 四元数按相同顺序复合 q = q_first · q_middle · q_last。
 *
 * @param angles - 欧拉角（isDegree 为 true 时单位为度，否则弧度）
 * @param order - 旋转顺序，默认 'XYZ'
 * @param isDegree - 输入是否为角度，默认 false（弧度）
 * @returns 复合后的单位四元数
 */
export function eulerToQuaternion(
  angles: EulerAngles,
  order: EulerOrder = 'XYZ',
  isDegree = false,
): Quaternion {
  const rad: [number, number, number] = isDegree
    ? [toRadians(angles.roll), toRadians(angles.pitch), toRadians(angles.yaw)]
    : [angles.roll, angles.pitch, angles.yaw];
  const axes = [
    axisIndex(order[0] as string),
    axisIndex(order[1] as string),
    axisIndex(order[2] as string),
  ] as [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
  const qFirst = axisQuaternion(axes[0], rad[axes[0]]);
  const qMiddle = axisQuaternion(axes[1], rad[axes[1]]);
  const qLast = axisQuaternion(axes[2], rad[axes[2]]);
  return multiplyQuaternion(multiplyQuaternion(qFirst, qMiddle), qLast);
}

/**
 * 四元数 → 欧拉角（atan2 / asin 分支公式随旋转顺序变化）
 *
 * @param input - 四元数（非单位先归一化）
 * @param order - 旋转顺序，默认 'XYZ'
 * @param useDegree - 输出是否换算为角度，默认 false（弧度）
 * @returns roll / pitch / yaw 与 gimbalLock 标记
 * @throws 输入全零或含 NaN/Infinity
 */
export function quaternionToEuler(
  input: Quaternion,
  order: EulerOrder = 'XYZ',
  useDegree = false,
): EulerResult {
  const m = quaternionToMatrix(input);
  const rule = EXTRACTION[order];
  const rad: [number, number, number] = [0, 0, 0];

  // 中间角 B：sin(B) = sign · m[i][j]
  const sinB = clampUnit(rule.middleEntry[2] * at(m, rule.middleEntry[0], rule.middleEntry[1]));
  const gimbalLock = Math.abs(sinB) >= GIMBAL_LOCK_SIN;

  if (!gimbalLock) {
    rad[rule.middleAxis] = Math.asin(sinB);
    rad[rule.first.axis] = Math.atan2(
      rule.first.sign * at(m, rule.first.numerator[0], rule.first.numerator[1]),
      at(m, rule.first.denominator[0], rule.first.denominator[1]),
    );
    rad[rule.last.axis] = Math.atan2(
      rule.last.sign * at(m, rule.last.numerator[0], rule.last.numerator[1]),
      at(m, rule.last.denominator[0], rule.last.denominator[1]),
    );
  } else {
    // 万向锁：末角 C 约定取 0，首角 A 由对应顺序的锁定分支公式恢复
    rad[rule.middleAxis] = sinB > 0 ? Math.PI / 2 : -Math.PI / 2;
    rad[rule.last.axis] = 0;
    rad[rule.first.axis] = rule.lockFirst(m, sinB > 0 ? 1 : -1);
  }

  const result: EulerResult = {
    roll: useDegree ? toDegrees(rad[0]) : rad[0],
    pitch: useDegree ? toDegrees(rad[1]) : rad[1],
    yaw: useDegree ? toDegrees(rad[2]) : rad[2],
  };
  if (gimbalLock) result.gimbalLock = true;
  return result;
}

/**
 * 3×3 旋转矩阵 → 欧拉角（经四元数中转）
 *
 * @param m - 3×3 矩阵
 * @param order - 旋转顺序
 * @param useDegree - 输出是否为角度
 * @returns 欧拉角结果；矩阵非正交时返回 error
 */
export function matrixToEuler(
  m: Matrix3,
  order: EulerOrder = 'XYZ',
  useDegree = false,
): EulerResult | QuaternionError {
  const q = matrixToQuaternion(m);
  if (isQuaternionError(q)) {
    return q;
  }
  return quaternionToEuler(q, order, useDegree);
}

/**
 * 欧拉角 → 3×3 旋转矩阵（经四元数中转）
 *
 * @param angles - 欧拉角
 * @param order - 旋转顺序
 * @param isDegree - 输入是否为角度
 * @returns 3×3 旋转矩阵
 */
export function eulerToMatrix(
  angles: EulerAngles,
  order: EulerOrder = 'XYZ',
  isDegree = false,
): Matrix3 {
  return quaternionToMatrix(eulerToQuaternion(angles, order, isDegree));
}

/** 数字展示：保留 10 位有效精度并去除浮点尾差与 −0 */
export function trimNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return '0';
  const cleaned = parseFloat(value.toPrecision(10));
  return Object.is(cleaned, -0) ? '0' : String(cleaned);
}
