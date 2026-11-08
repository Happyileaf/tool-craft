/**
 * 三相交流电路功率 / 功率因数 / 扭矩计算纯函数
 *
 * 支持星形（Y）与三角形（Δ）两种接法，线电压 / 线相位为输入基准，
 * 全部为确定性纯函数，不依赖 DOM。
 */

/** 接法类型 */
export type ConnectionType = 'star' | 'delta';

/** 功率计算入参 */
export interface PowerInput {
  /** 线电压 V_L（V） */
  lineVoltage: number;
  /** 线电流 I_L（A） */
  lineCurrent: number;
  /** 功率因数 cosφ，取值 (0,1] */
  powerFactor: number;
  /** 接法 */
  connection: ConnectionType;
}

/** 功率计算结果（W / var / VA） */
export interface PowerResult {
  /** 有功功率 P（W） */
  activePower: number;
  /** 无功功率 Q（var） */
  reactivePower: number;
  /** 视在功率 S（VA） */
  apparentPower: number;
  /** 相电压 V_ph（V） */
  phaseVoltage: number;
  /** 相电流 I_ph（A） */
  phaseCurrent: number;
  /** 阻抗角 φ（度） */
  phaseAngle: number;
}

/** sqrt(3) 常量，三相系数 */
const SQRT3 = Math.sqrt(3);

/**
 * 由接法换算相电压 / 相电流
 *
 * 星形：V_ph = V_L/√3，I_ph = I_L
 * 三角形：V_ph = V_L，I_ph = I_L/√3
 */
export function resolvePhaseQuantities(
  lineVoltage: number,
  lineCurrent: number,
  connection: ConnectionType,
): { phaseVoltage: number; phaseCurrent: number } {
  if (connection === 'star') {
    return { phaseVoltage: lineVoltage / SQRT3, phaseCurrent: lineCurrent };
  }
  return { phaseVoltage: lineVoltage, phaseCurrent: lineCurrent / SQRT3 };
}

/**
 * 计算三相有功 / 无功 / 视在功率与相位角
 *
 * P = √3·V_L·I_L·cosφ
 * S = √3·V_L·I_L
 * Q = √(S²−P²)
 */
export function calculateThreePhasePower(input: PowerInput): PowerResult {
  const { lineVoltage, lineCurrent, powerFactor, connection } = input;
  if (lineVoltage <= 0 || lineCurrent <= 0) {
    throw new Error('线电压与线电流必须为正数');
  }
  if (!(powerFactor > 0 && powerFactor <= 1)) {
    throw new Error('功率因数 cosφ 必须在 0 与 1 之间（不含 0）');
  }
  const apparentPower = SQRT3 * lineVoltage * lineCurrent;
  const activePower = apparentPower * powerFactor;
  const reactivePower = Math.sqrt(Math.max(apparentPower ** 2 - activePower ** 2, 0));
  const phaseAngle = Math.acos(powerFactor) * (180 / Math.PI);
  const { phaseVoltage, phaseCurrent } = resolvePhaseQuantities(
    lineVoltage,
    lineCurrent,
    connection,
  );
  return {
    activePower,
    reactivePower,
    apparentPower,
    phaseVoltage,
    phaseCurrent,
    phaseAngle,
  };
}

/** 由有功功率反推线电流入参 */
export interface CurrentInput {
  /** 目标有功功率 P（W） */
  activePower: number;
  /** 线电压 V_L（V） */
  lineVoltage: number;
  /** 功率因数 cosφ */
  powerFactor: number;
}

/**
 * 由有功功率反推所需线电流
 *
 * I_L = P / (√3·V_L·cosφ)
 */
export function calculateLineCurrent(input: CurrentInput): number {
  const { activePower, lineVoltage, powerFactor } = input;
  if (activePower <= 0 || lineVoltage <= 0) {
    throw new Error('有功功率与线电压必须为正数');
  }
  if (!(powerFactor > 0 && powerFactor <= 1)) {
    throw new Error('功率因数 cosφ 必须在 0 与 1 之间（不含 0）');
  }
  return activePower / (SQRT3 * lineVoltage * powerFactor);
}

/**
 * 由有功 / 视在功率求功率因数
 *
 * cosφ = P / S
 */
export function calculatePowerFactor(activePower: number, apparentPower: number): number {
  if (apparentPower <= 0) {
    throw new Error('视在功率必须为正数');
  }
  if (activePower < 0 || activePower > apparentPower) {
    throw new Error('有功功率必须满足 0 ≤ P ≤ S');
  }
  return activePower / apparentPower;
}

/**
 * 电机轴扭矩换算
 *
 * T = 9550 · P(kW) / n(rpm)，单位 N·m
 *
 * @param activePowerW - 有功功率（W）
 * @param rpm - 转速（转 / 分钟）
 * @param efficiency - 电机效率，取值 (0,1]，默认 1（直接用输入功率）
 * @returns 轴扭矩（N·m）
 */
export function calculateTorque(activePowerW: number, rpm: number, efficiency: number = 1): number {
  if (activePowerW <= 0 || rpm <= 0) {
    throw new Error('功率与转速必须为正数');
  }
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new Error('电机效率必须在 0 与 1 之间（不含 0）');
  }
  const shaftPowerKw = (activePowerW * efficiency) / 1000;
  return (9550 * shaftPowerKw) / rpm;
}

/**
 * 工程单位换算：W → kW、var → kvar、VA → kVA
 *
 * @param value - 原始值
 * @returns 千级单位值
 */
export function toKilo(value: number): number {
  return value / 1000;
}
