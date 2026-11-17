/**
 * 圆管内流核心计算：雷诺数、流态判定、Darcy 摩擦系数与沿程水头损失
 *
 * 全部为无副作用纯函数，仅使用闭式 / 显式公式，零第三方依赖。
 * 单位约定：除特别说明外，内部计算一律采用 SI 基准单位
 * （m、m/s、m²/s、kg/m³、Pa）。
 */

/** 流态标识 */
export type FlowRegime = 'laminar' | 'critical' | 'turbulent';

/** 流态判定分界值（工程常用圆管判据） */
export const RE_LOWER = 2300;
export const RE_UPPER = 4000;

/** 重力加速度 m/s²（标准值） */
export const GRAVITY = 9.80665;

/** 相对粗糙度建议上限，超过则仅给出警告（仍可计算） */
export const RELATIVE_ROUGHNESS_LIMIT = 0.1;

/** 输入单位换算到 SI 基准单位的倍率配置 */
export interface UnitOption {
  /** 下拉展示标签 */
  label: string;
  /** 换算倍率：基准值 = 输入值 × factor */
  factor: number;
}

/** 管径单位（基准 m） */
export const DIAMETER_UNITS: UnitOption[] = [
  { label: 'm', factor: 1 },
  { label: 'mm', factor: 0.001 },
  { label: 'cm', factor: 0.01 },
  { label: 'in', factor: 0.0254 },
];

/** 流速单位（基准 m/s） */
export const VELOCITY_UNITS: UnitOption[] = [
  { label: 'm/s', factor: 1 },
  { label: 'cm/s', factor: 0.01 },
  { label: 'ft/s', factor: 0.3048 },
];

/** 体积流量单位（基准 m³/s） */
export const FLOW_RATE_UNITS: UnitOption[] = [
  { label: 'm³/s', factor: 1 },
  { label: 'm³/h', factor: 1 / 3600 },
  { label: 'L/s', factor: 0.001 },
  { label: 'L/min', factor: 0.001 / 60 },
  { label: 'ft³/min', factor: 0.028316846592 / 60 },
];

/** 运动黏度单位（基准 m²/s） */
export const KINEMATIC_VISCOSITY_UNITS: UnitOption[] = [
  { label: 'm²/s', factor: 1 },
  { label: 'mm²/s (cSt)', factor: 1e-6 },
  { label: 'ft²/s', factor: 0.09290304 },
];

/** 密度单位（基准 kg/m³） */
export const DENSITY_UNITS: UnitOption[] = [
  { label: 'kg/m³', factor: 1 },
  { label: 'g/cm³', factor: 1000 },
  { label: 'lb/ft³', factor: 16.01846337396014 },
];

/** 绝对粗糙度单位（基准 m） */
export const ROUGHNESS_UNITS: UnitOption[] = [
  { label: 'm', factor: 1 },
  { label: 'mm', factor: 0.001 },
  { label: 'µm', factor: 1e-6 },
];

/** 带单位的标量输入 */
export interface ScalarInput {
  /** 按所选单位填写的数值 */
  value: number;
  /** 对应单位的换算倍率 */
  factor: number;
}

/** 校验正数输入，失败时抛出带字段名的错误 */
function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name}必须是有限数值。`);
  }
  if (value <= 0) {
    throw new Error(`${name}必须大于 0。`);
  }
}

/** 把带单位输入归一化为 SI 基准值并做正数校验 */
function toBase(input: ScalarInput, name: string): number {
  if (input === null || input === undefined || typeof input.value !== 'number') {
    throw new Error(`${name}缺失，请填写有效数值。`);
  }
  const base = input.value * input.factor;
  assertPositive(base, name);
  return base;
}

/**
 * 由体积流量 Q 与圆管内径 d 求断面平均流速
 *
 * @param flowRate - 体积流量（SI：m³/s）
 * @param diameter - 圆管内径（SI：m）
 * @returns 平均流速 v = 4Q / (π·d²)，单位 m/s
 */
export function velocityFromFlowRate(flowRate: number, diameter: number): number {
  assertPositive(flowRate, '流量 Q');
  assertPositive(diameter, '内径 d');
  return (4 * flowRate) / (Math.PI * diameter * diameter);
}

/**
 * 由平均流速 v 与圆管内径 d 求体积流量
 *
 * @param velocity - 平均流速（SI：m/s）
 * @param diameter - 圆管内径（SI：m）
 * @returns 体积流量 Q = v·π·d²/4，单位 m³/s
 */
export function flowRateFromVelocity(velocity: number, diameter: number): number {
  assertPositive(velocity, '流速 v');
  assertPositive(diameter, '内径 d');
  return (velocity * Math.PI * diameter * diameter) / 4;
}

/**
 * 计算雷诺数 Re = v·d / ν
 *
 * @param velocity - 平均流速（SI：m/s）
 * @param diameter - 圆管内径（SI：m）
 * @param kinematicViscosity - 运动黏度（SI：m²/s）
 * @returns 无量纲雷诺数
 */
export function reynoldsNumber(
  velocity: number,
  diameter: number,
  kinematicViscosity: number,
): number {
  assertPositive(velocity, '流速 v');
  assertPositive(diameter, '内径 d');
  assertPositive(kinematicViscosity, '运动黏度 ν');
  return (velocity * diameter) / kinematicViscosity;
}

/**
 * 按工程常用分界判定圆管流态
 *
 * @param re - 雷诺数
 * @returns laminar（Re<2300）/ critical（2300–4000）/ turbulent（>4000）
 */
export function flowRegime(re: number): FlowRegime {
  if (!Number.isFinite(re) || re <= 0) {
    throw new Error('雷诺数必须为正的有限数值。');
  }
  if (re < RE_LOWER) return 'laminar';
  if (re <= RE_UPPER) return 'critical';
  return 'turbulent';
}

/**
 * 计算 Darcy 摩擦系数 f
 *
 * - 层流：f = 64 / Re（解析解）
 * - 湍流：Swamee–Jain 显式式
 *   f = 0.25 / [ log10( ε/(3.7d) + 5.74/Re^0.9 ) ]²
 * - 临界区（2300–4000）：两种公式均不适用，返回 null 由界面给出警告
 *
 * @param re - 雷诺数
 * @param relativeRoughness - 相对粗糙度 ε/d（光滑管取 0）
 * @returns Darcy 摩擦系数；临界区返回 null
 */
export function frictionFactor(re: number, relativeRoughness = 0): number | null {
  if (!Number.isFinite(re) || re <= 0) {
    throw new Error('雷诺数必须为正的有限数值。');
  }
  if (!Number.isFinite(relativeRoughness) || relativeRoughness < 0) {
    throw new Error('相对粗糙度 ε/d 不能为负。');
  }
  const regime = flowRegime(re);
  if (regime === 'critical') {
    return null;
  }
  if (regime === 'laminar') {
    return 64 / re;
  }
  const term = relativeRoughness / 3.7 + 5.74 / Math.pow(re, 0.9);
  return 0.25 / Math.pow(Math.log10(term), 2);
}

/**
 * Darcy–Weisbach 单位长度沿程水头损失
 *
 * hf/L = f·v² / (2·g·d)
 *
 * @param friction - Darcy 摩擦系数 f
 * @param velocity - 平均流速（SI：m/s）
 * @param diameter - 圆管内径（SI：m）
 * @returns 单位长度水头损失（m/m）
 */
export function headLossPerLength(
  friction: number,
  velocity: number,
  diameter: number,
): number {
  if (!Number.isFinite(friction) || friction <= 0) {
    throw new Error('摩擦系数必须为正的有限数值。');
  }
  assertPositive(velocity, '流速 v');
  assertPositive(diameter, '内径 d');
  return (friction * velocity * velocity) / (2 * GRAVITY * diameter);
}

/**
 * 单位长度压降 ΔP/L = ρ·g·(hf/L)
 *
 * @param headLossGradient - 单位长度水头损失 hf/L（m/m）
 * @param density - 流体密度（SI：kg/m³）
 * @returns 单位长度压降（Pa/m）
 */
export function pressureDropPerLength(
  headLossGradient: number,
  density: number,
): number {
  if (!Number.isFinite(headLossGradient) || headLossGradient < 0) {
    throw new Error('水头损失梯度必须为非负有限数值。');
  }
  assertPositive(density, '密度 ρ');
  return density * GRAVITY * headLossGradient;
}

/** 一次完整管流计算的输入（SI 基准值，由界面完成单位归一化） */
export interface PipeFlowInputs {
  /** 平均流速 m/s */
  velocity: number;
  /** 圆管内径 m */
  diameter: number;
  /** 运动黏度 m²/s */
  kinematicViscosity: number;
  /** 绝对粗糙度 m（光滑管取 0） */
  roughness?: number;
  /** 流体密度 kg/m³；省略则不计算压降 */
  density?: number;
}

/** 一次完整管流计算的结果 */
export interface PipeFlowResult {
  /** 雷诺数 */
  re: number;
  /** 流态 */
  regime: FlowRegime;
  /** 相对粗糙度 ε/d */
  relativeRoughness: number;
  /** Darcy 摩擦系数；临界区为 null */
  friction: number | null;
  /** 单位长度水头损失 hf/L（m/m）；临界区为 null */
  headLossGradient: number | null;
  /** 单位长度压降 ΔP/L（Pa/m）；临界区或缺密度时为 null */
  pressureGradient: number | null;
  /** 非阻断性警告信息 */
  warnings: string[];
}

/**
 * 端到端管流计算：雷诺数 → 流态 → 摩擦系数 → 水头损失 / 压降
 *
 * @param inputs - 已归一化为 SI 基准单位的输入
 * @returns 完整结果与警告集合
 */
export function calculatePipeFlow(inputs: PipeFlowInputs): PipeFlowResult {
  const { velocity, diameter, kinematicViscosity, roughness = 0, density } = inputs;
  assertPositive(velocity, '流速 v');
  assertPositive(diameter, '内径 d');
  assertPositive(kinematicViscosity, '运动黏度 ν');
  if (!Number.isFinite(roughness) || roughness < 0) {
    throw new Error('绝对粗糙度 ε 不能为负。');
  }

  const warnings: string[] = [];
  const re = reynoldsNumber(velocity, diameter, kinematicViscosity);
  const regime = flowRegime(re);
  const relativeRoughness = roughness / diameter;

  if (relativeRoughness > RELATIVE_ROUGHNESS_LIMIT) {
    warnings.push(
      `相对粗糙度 ε/d=${relativeRoughness.toFixed(4)} 超过 ${RELATIVE_ROUGHNESS_LIMIT}，请确认管径或粗糙度输入是否正确。`,
    );
  }

  const friction = frictionFactor(re, relativeRoughness);
  let headLossGradient: number | null = null;
  let pressureGradient: number | null = null;

  if (regime === 'critical') {
    warnings.push(
      `雷诺数 ${re.toFixed(0)} 处于临界过渡区（2300–4000），层流与湍流摩擦系数公式均不适用，f、水头损失与压降不给出确定值。`,
    );
  } else if (friction !== null) {
    headLossGradient = headLossPerLength(friction, velocity, diameter);
    if (density === undefined) {
      warnings.push('未填写流体密度 ρ，压降 ΔP/L 无法计算（水头损失不受影响）。');
    } else {
      assertPositive(density, '密度 ρ');
      pressureGradient = pressureDropPerLength(headLossGradient, density);
    }
  }

  return {
    re,
    regime,
    relativeRoughness,
    friction,
    headLossGradient,
    pressureGradient,
    warnings,
  };
}

/** 把带单位的标量输入集合归一化为 SI 基准值 */
export function normalizeInputs(raw: {
  velocity: ScalarInput;
  diameter: ScalarInput;
  kinematicViscosity: ScalarInput;
  roughness?: ScalarInput;
  density?: ScalarInput;
}): PipeFlowInputs {
  return {
    velocity: toBase(raw.velocity, '流速 v'),
    diameter: toBase(raw.diameter, '内径 d'),
    kinematicViscosity: toBase(raw.kinematicViscosity, '运动黏度 ν'),
    roughness:
      raw.roughness && typeof raw.roughness.value === 'number'
        ? toBase(raw.roughness, '绝对粗糙度 ε')
        : 0,
    density:
      raw.density && typeof raw.density.value === 'number'
        ? toBase(raw.density, '密度 ρ')
        : undefined,
  };
}
