import { describe, it, expect } from 'vitest';
import {
  EPS,
  EULER_ORDERS,
  eulerToMatrix,
  eulerToQuaternion,
  isQuaternionError,
  matrixToEuler,
  matrixToQuaternion,
  multiplyQuaternion,
  normalizeQuaternion,
  quaternion,
  quaternionToEuler,
  quaternionToMatrix,
  toRadians,
  trimNumber,
  type EulerAngles,
  type EulerOrder,
  type Matrix3,
  type Quaternion,
} from './quaternion';

/** 期望单位四元数（4 个分量逐一近似） */
function expectQuaternionClose(actual: Quaternion, expected: Quaternion, digits = 10) {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
  expect(actual.z).toBeCloseTo(expected.z, digits);
  expect(actual.w).toBeCloseTo(expected.w, digits);
}

/**
 * 两个四元数表示同一旋转时允许整体取负（双覆盖），
 * 断言 q 与 ±expected 之一逐分量近似
 */
function expectSameRotation(actual: Quaternion, expected: Quaternion, digits = 9) {
  const direct =
    Math.abs(actual.x - expected.x) +
      Math.abs(actual.y - expected.y) +
      Math.abs(actual.z - expected.z) +
      Math.abs(actual.w - expected.w) <
    5 * 10 ** -digits;
  const negated =
    Math.abs(actual.x + expected.x) +
      Math.abs(actual.y + expected.y) +
      Math.abs(actual.z + expected.z) +
      Math.abs(actual.w + expected.w) <
    5 * 10 ** -digits;
  expect(direct || negated).toBe(true);
}

/** 断言 3×3 矩阵逐元素近似 */
function expectMatrixClose(actual: Matrix3, expected: Matrix3, digits = 10) {
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      expect(actual[i]?.[j]).toBeCloseTo(expected[i]?.[j] ?? 0, digits);
    }
  }
}

/** 固定的 3 组非单位四元数原始输入 */
const RAW_QUATERNIONS: Quaternion[] = [
  { x: 0.1, y: 0.2, z: 0.3, w: 0.9 },
  { x: -0.4, y: 0.5, z: 0.2, w: 0.7 },
  { x: 0.3, y: -0.1, z: -0.6, w: 0.5 },
];

/** 取归一化后的四元数（测试中输入均合法） */
function normalizedOf(q: Quaternion): Quaternion {
  const result = normalizeQuaternion(q);
  if ('error' in result) throw new Error(result.error);
  return result.q;
}

describe('四元数归一化', () => {
  it('单位四元数 (0,0,0,1) 归一化后保持不变且无提示', () => {
    const result = normalizeQuaternion(quaternion());
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expectQuaternionClose(result.q, { x: 0, y: 0, z: 0, w: 1 });
    expect(result.norm).toBeCloseTo(1, 12);
    expect(result.warning).toBeUndefined();
  });

  it('非单位四元数返回范数与归一化提示', () => {
    const result = normalizeQuaternion({ x: 0, y: 0, z: 0, w: 2 });
    if ('error' in result) throw new Error(result.error);
    expect(result.norm).toBeCloseTo(2, 12);
    expect(result.warning).toMatch(/非单位/);
    expectQuaternionClose(result.q, { x: 0, y: 0, z: 0, w: 1 });
  });

  it('非单位四元数归一化后与先归一化输入的转换结果一致', () => {
    const raw = RAW_QUATERNIONS[0] as Quaternion;
    const unit = normalizedOf(raw);
    const fromRaw = quaternionToMatrix(raw);
    const fromUnit = quaternionToMatrix(unit);
    expectMatrixClose(fromRaw, fromUnit, 12);
  });

  it('全零四元数返回错误', () => {
    const result = normalizeQuaternion({ x: 0, y: 0, z: 0, w: 0 });
    expect('error' in result).toBe(true);
    if (!('error' in result)) throw new Error('应返回错误');
    expect(result.error).toMatch(/全零/);
    expect(() => quaternionToMatrix({ x: 0, y: 0, z: 0, w: 0 })).toThrow(/全零/);
  });

  it('NaN 或 Infinity 分量返回错误', () => {
    expect(normalizeQuaternion({ x: Number.NaN, y: 0, z: 0, w: 1 })).toMatchObject({
      error: expect.stringMatching(/NaN|Infinity/),
    });
    expect(normalizeQuaternion({ x: 0, y: Number.POSITIVE_INFINITY, z: 0, w: 1 })).toMatchObject({
      error: expect.stringMatching(/NaN|Infinity/),
    });
    expect(() => quaternionToEuler({ x: Number.NaN, y: 0, z: 0, w: 1 })).toThrow();
  });
});

describe('四元数 → 旋转矩阵', () => {
  it('单位四元数 → 单位矩阵 I', () => {
    expectMatrixClose(quaternionToMatrix(quaternion()), [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });

  it('(0,0,sin45°,cos45°) 表示绕 Z 轴旋转 90°', () => {
    const q = { x: 0, y: 0, z: Math.sin(Math.PI / 4), w: Math.cos(Math.PI / 4) };
    expectMatrixClose(quaternionToMatrix(q), [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ]);
  });

  it('3 组固定四元数 → 矩阵 → 四元数往返一致（1e-10）', () => {
    for (const raw of RAW_QUATERNIONS) {
      const q = normalizedOf(raw);
      const m = quaternionToMatrix(q);
      const back = matrixToQuaternion(m);
      if (isQuaternionError(back)) throw new Error(back.error);
      expectSameRotation(back, q, 10);
    }
  });

  it('矩阵 → 单位矩阵时回到 (0,0,0,1)，且 w 非负', () => {
    const result = matrixToQuaternion([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    if (isQuaternionError(result)) throw new Error(result.error);
    expectQuaternionClose(result, { x: 0, y: 0, z: 0, w: 1 });
    expect(result.w).toBeGreaterThanOrEqual(0);
  });
});

describe('旋转矩阵校验', () => {
  it('2I 行列式为 8 且非正交，返回错误', () => {
    const result = matrixToQuaternion([
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 2],
    ]);
    expect(isQuaternionError(result)).toBe(true);
    if (!isQuaternionError(result)) throw new Error('应返回错误');
    expect(result.error).toMatch(/行列式|正交/);
  });

  it('镜像矩阵 det = -1 返回错误', () => {
    const result = matrixToQuaternion([
      [-1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(isQuaternionError(result)).toBe(true);
  });

  it('含 NaN 的矩阵返回错误', () => {
    const result = matrixToEuler(
      [
        [Number.NaN, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      'XYZ',
    );
    expect(isQuaternionError(result)).toBe(true);
  });

  it('导出的 EPS 为小的正数容差', () => {
    expect(EPS).toBeGreaterThan(0);
    expect(EPS).toBeLessThan(1e-3);
  });
});

describe('四元数 ↔ 欧拉角', () => {
  it('绕 Z 轴 90° 在 XYZ 与 ZYX 顺序下均解出 yaw = π/2', () => {
    const q = { x: 0, y: 0, z: Math.sin(Math.PI / 4), w: Math.cos(Math.PI / 4) };
    for (const order of ['XYZ', 'ZYX'] as EulerOrder[]) {
      const euler = quaternionToEuler(q, order, false);
      expect(euler.roll).toBeCloseTo(0, 10);
      expect(euler.pitch).toBeCloseTo(0, 10);
      expect(euler.yaw).toBeCloseTo(Math.PI / 2, 10);
      expect(euler.gimbalLock).toBeUndefined();
    }
  });

  it('角度模式下绕 Z 轴 90° 输出 yaw = 90', () => {
    const q = { x: 0, y: 0, z: Math.sin(Math.PI / 4), w: Math.cos(Math.PI / 4) };
    const euler = quaternionToEuler(q, 'ZYX', true);
    expect(euler.yaw).toBeCloseTo(90, 9);
    expect(euler.roll).toBeCloseTo(0, 9);
    expect(euler.pitch).toBeCloseTo(0, 9);
  });

  it('角度输入 90° 等价弧度 π/2', () => {
    const fromDegree = eulerToQuaternion({ roll: 0, pitch: 0, yaw: 90 }, 'XYZ', true);
    const fromRadian = eulerToQuaternion(
      { roll: 0, pitch: 0, yaw: Math.PI / 2 },
      'XYZ',
      false,
    );
    expectQuaternionClose(fromDegree, fromRadian, 12);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 12);
  });

  it('XYZ 顺序 2 组角度：q → 欧拉 → q 往返一致（1e-9）', () => {
    const cases: EulerAngles[] = [
      { roll: toRadians(30), pitch: toRadians(-45), yaw: toRadians(60) },
      { roll: 0.3, pitch: -0.2, yaw: 1.1 },
    ];
    for (const angles of cases) {
      const q = eulerToQuaternion(angles, 'XYZ');
      const euler = quaternionToEuler(q, 'XYZ');
      const roundTrip = eulerToQuaternion(euler, 'XYZ');
      expectSameRotation(roundTrip, q, 9);
    }
  });

  it('ZYX 顺序 2 组角度：q → 欧拉 → q 往返一致（1e-9）', () => {
    const cases: EulerAngles[] = [
      { roll: toRadians(-20), pitch: toRadians(50), yaw: toRadians(40) },
      { roll: -1.0, pitch: 0.4, yaw: -0.6 },
    ];
    for (const angles of cases) {
      const q = eulerToQuaternion(angles, 'ZYX');
      const euler = quaternionToEuler(q, 'ZYX');
      const roundTrip = eulerToQuaternion(euler, 'ZYX');
      expectSameRotation(roundTrip, q, 9);
    }
  });

  it('六种旋转顺序各做一组随机固定角度往返一致', () => {
    const cases: Record<EulerOrder, EulerAngles> = {
      XYZ: { roll: 0.5, pitch: -0.7, yaw: 1.2 },
      YXZ: { roll: -0.3, pitch: 0.6, yaw: 0.9 },
      ZYX: { roll: 0.8, pitch: -0.4, yaw: -1.0 },
      ZXY: { roll: 0.2, pitch: 0.9, yaw: -0.6 },
      YZX: { roll: -0.9, pitch: -0.3, yaw: 0.4 },
      XZY: { roll: 0.6, pitch: 0.2, yaw: -0.8 },
    };
    expect(EULER_ORDERS).toHaveLength(6);
    for (const order of EULER_ORDERS) {
      const q = eulerToQuaternion(cases[order] as EulerAngles, order);
      const euler = quaternionToEuler(q, order);
      const roundTrip = eulerToQuaternion(euler, order);
      expectSameRotation(roundTrip, q, 9);
    }
  });

  it('四元数复合与欧拉复合给出相同矩阵：XYZ 顺序复合示例', () => {
    // R = Rx(30°)·Ry(40°)·Rz(50°)
    const qx = eulerToQuaternion({ roll: toRadians(30), pitch: 0, yaw: 0 }, 'XYZ');
    const qy = eulerToQuaternion({ roll: 0, pitch: toRadians(40), yaw: 0 }, 'XYZ');
    const qz = eulerToQuaternion({ roll: 0, pitch: 0, yaw: toRadians(50) }, 'XYZ');
    const composed = multiplyQuaternion(multiplyQuaternion(qx, qy), qz);
    const viaEuler = eulerToQuaternion(
      { roll: toRadians(30), pitch: toRadians(40), yaw: toRadians(50) },
      'XYZ',
    );
    expectSameRotation(composed, viaEuler, 12);
  });
});

describe('万向锁（Gimbal Lock）', () => {
  it('XYZ 顺序 pitch = 90° 时标记 gimbalLock 且 pitch 恢复为 90°', () => {
    const q = eulerToQuaternion({ roll: 0, pitch: 90, yaw: 0 }, 'XYZ', true);
    const euler = quaternionToEuler(q, 'XYZ', true);
    expect(euler.gimbalLock).toBe(true);
    expect(euler.pitch).toBeCloseTo(90, 6);
  });

  it('ZYX 顺序 pitch = -90° 时同样标记 gimbalLock', () => {
    const q = eulerToQuaternion({ roll: 30, pitch: -90, yaw: 40 }, 'ZYX', true);
    const euler = quaternionToEuler(q, 'ZYX', true);
    expect(euler.gimbalLock).toBe(true);
    expect(euler.pitch).toBeCloseTo(-90, 6);
    // 锁定下分解不唯一，但恢复出的旋转矩阵应与原矩阵一致
    const matrix = eulerToMatrix({ roll: 30, pitch: -90, yaw: 40 }, 'ZYX', true);
    const recovered = eulerToMatrix(euler, 'ZYX', true);
    expectMatrixClose(matrix, recovered, 9);
  });

  it('pitch 远离 ±90° 时不标记', () => {
    const q = eulerToQuaternion({ roll: 10, pitch: 45, yaw: -20 }, 'ZYX', true);
    expect(quaternionToEuler(q, 'ZYX', true).gimbalLock).toBeUndefined();
  });
});

describe('矩阵 ↔ 欧拉角中转', () => {
  it('欧拉 → 矩阵 → 欧拉往返一致（XYZ 与 ZYX）', () => {
    const angles = { roll: toRadians(25), pitch: toRadians(-35), yaw: toRadians(70) };
    for (const order of ['XYZ', 'ZYX'] as EulerOrder[]) {
      const m = eulerToMatrix(angles, order);
      const result = matrixToEuler(m, order);
      if ('error' in result) throw new Error(result.error);
      expect(result.roll).toBeCloseTo(angles.roll, 9);
      expect(result.pitch).toBeCloseTo(angles.pitch, 9);
      expect(result.yaw).toBeCloseTo(angles.yaw, 9);
    }
  });
});

describe('展示辅助', () => {
  it('trimNumber 去除浮点尾差与 −0', () => {
    expect(trimNumber(0.1 + 0.2)).toBe('0.3');
    expect(trimNumber(-0)).toBe('0');
    expect(trimNumber(1)).toBe('1');
  });
});
