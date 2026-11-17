/**
 * 梁弯曲应力与挠度计算核心（材料力学标准梁表闭式解）
 *
 * 仅覆盖静定梁的单一荷载工况：
 * - 简支梁：跨中集中力、任意位置集中力、满跨均布荷载
 * - 悬臂梁（固定端 x=0）：自由端集中力、满跨均布荷载
 *
 * 内部一律采用 SI 基准单位：m、N、Pa、m⁴、m³。
 * 纯函数、零第三方依赖，不含超静定 / 组合荷载 / 压杆稳定。
 */

/** 梁形式 */
export type BeamType = 'simply-supported' | 'cantilever';

/** 荷载类型 */
export type LoadType = 'central-point' | 'arbitrary-point' | 'uniform';

/** 截面类型 */
export type SectionType = 'rectangle' | 'circle' | 'custom';

/** 单位换算选项（基准值 = 输入值 × factor） */
export interface UnitOption {
  /** 下拉标签 */
  label: string;
  /** 换算倍率 */
  factor: number;
}

/** 长度单位（基准 m） */
export const LENGTH_UNITS: UnitOption[] = [
  { label: 'm', factor: 1 },
  { label: 'mm', factor: 0.001 },
  { label: 'cm', factor: 0.01 },
];

/** 力单位（基准 N） */
export const FORCE_UNITS: UnitOption[] = [
  { label: 'N', factor: 1 },
  { label: 'kN', factor: 1000 },
  { label: 'lbf', factor: 4.4482216152605 },
];

/** 线荷载单位（基准 N/m） */
export const LINE_LOAD_UNITS: UnitOption[] = [
  { label: 'N/m', factor: 1 },
  { label: 'kN/m', factor: 1000 },
];

/** 弹性模量单位（基准 Pa） */
export const MODULUS_UNITS: UnitOption[] = [
  { label: 'Pa', factor: 1 },
  { label: 'GPa', factor: 1e9 },
  { label: 'MPa', factor: 1e6 },
];

/** 惯性矩单位（基准 m⁴） */
export const INERTIA_UNITS: UnitOption[] = [
  { label: 'm⁴', factor: 1 },
  { label: 'cm⁴', factor: 1e-8 },
  { label: 'mm⁴', factor: 1e-12 },
];

/** 截面模量单位（基准 m³） */
export const SECTION_MODULUS_UNITS: UnitOption[] = [
  { label: 'm³', factor: 1 },
  { label: 'cm³', factor: 1e-6 },
  { label: 'mm³', factor: 1e-9 },
];

/** 应力单位（基准 Pa） */
export const STRESS_UNITS: UnitOption[] = [
  { label: 'Pa', factor: 1 },
  { label: 'MPa', factor: 1e6 },
  { label: 'GPa', factor: 1e9 },
];

/** 校验正数 */
function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name}必须是有限数值。`);
  }
  if (value <= 0) {
    throw new Error(`${name}必须大于 0。`);
  }
}

/** 截面几何性质 */
export interface SectionProperties {
  /** 截面惯性矩 I，m⁴ */
  inertia: number;
  /** 截面模量 W = I / y_max，m³ */
  sectionModulus: number;
}

/**
 * 矩形截面惯性矩与截面模量
 * I = b·h³/12，W = b·h²/6
 *
 * @param width - 宽度 b，m
 * @param height - 高度 h，m
 */
export function rectangleSection(width: number, height: number): SectionProperties {
  assertPositive(width, '截面宽度 b');
  assertPositive(height, '截面高度 h');
  return {
    inertia: (width * height ** 3) / 12,
    sectionModulus: (width * height ** 2) / 6,
  };
}

/**
 * 实心圆截面惯性矩与截面模量
 * I = π·d⁴/64，W = π·d³/32
 *
 * @param diameter - 直径 d，m
 */
export function circleSection(diameter: number): SectionProperties {
  assertPositive(diameter, '截面直径 d');
  return {
    inertia: (Math.PI * diameter ** 4) / 64,
    sectionModulus: (Math.PI * diameter ** 3) / 32,
  };
}

/** 梁表某一工况的输入（SI 基准单位） */
export interface BeamCaseInputs {
  /** 梁形式 */
  beamType: BeamType;
  /** 荷载类型 */
  loadType: LoadType;
  /** 梁长 L，m */
  length: number;
  /** 集中力 P，N（点载工况使用） */
  pointLoad?: number;
  /** 均布荷载 q，N/m（均布工况使用） */
  uniformLoad?: number;
  /** 任意点载距左支座（悬臂为固定端）距离 a，m */
  loadPosition?: number;
}

/** 最大弯矩结果 */
export interface MomentResult {
  /** 最大弯矩绝对值 Mmax，N·m */
  maxMoment: number;
  /** 最大弯矩出现位置 x，m（自梁端 / 固定端起算） */
  location: number;
  /** 所用梁表公式说明 */
  formula: string;
}

/**
 * 标准梁表最大弯矩
 *
 * 简支梁：
 * - 跨中点载：Mmax = P·L/4（x=L/2）
 * - 任意点载：Mmax = P·a·b/L，b=L-a（x=a）
 * - 满跨均布：Mmax = q·L²/8（x=L/2）
 * 悬臂梁（固定端 x=0）：
 * - 自由端点载：Mmax = P·L（固定端 x=0）
 * - 满跨均布：Mmax = q·L²/2（固定端 x=0）
 */
export function maxBendingMoment(inputs: BeamCaseInputs): MomentResult {
  const { beamType, loadType, length } = inputs;
  assertPositive(length, '梁长 L');

  if (beamType === 'simply-supported') {
    if (loadType === 'central-point') {
      const p = inputs.pointLoad as number;
      assertPositive(p, '集中力 P');
      return { maxMoment: (p * length) / 4, location: length / 2, formula: 'Mmax = P·L/4' };
    }
    if (loadType === 'arbitrary-point') {
      const p = inputs.pointLoad as number;
      const a = inputs.loadPosition as number;
      assertPositive(p, '集中力 P');
      if (!Number.isFinite(a) || a <= 0 || a >= length) {
        throw new Error('荷载位置 a 必须落在开区间 (0, L) 内。');
      }
      const b = length - a;
      return {
        maxMoment: (p * a * b) / length,
        location: a,
        formula: 'Mmax = P·a·b/L，b = L − a',
      };
    }
    const q = inputs.uniformLoad as number;
    assertPositive(q, '均布荷载 q');
    return { maxMoment: (q * length ** 2) / 8, location: length / 2, formula: 'Mmax = q·L²/8' };
  }

  // 悬臂梁
  if (loadType === 'uniform') {
    const q = inputs.uniformLoad as number;
    assertPositive(q, '均布荷载 q');
    return { maxMoment: (q * length ** 2) / 2, location: 0, formula: 'Mmax = q·L²/2（固定端）' };
  }
  const p = inputs.pointLoad as number;
  assertPositive(p, '集中力 P');
  if (loadType === 'arbitrary-point') {
    const a = inputs.loadPosition as number;
    if (!Number.isFinite(a) || a <= 0 || a > length) {
      throw new Error('荷载位置 a 必须落在区间 (0, L] 内。');
    }
    // 悬臂梁点载作用于距固定端 a 处，固定端弯矩 P·a（a=L 即自由端点载）
    return { maxMoment: p * a, location: 0, formula: 'Mmax = P·a（固定端）' };
  }
  return { maxMoment: p * length, location: 0, formula: 'Mmax = P·L（固定端）' };
}

/**
 * 弯曲正应力 σ = M / W
 *
 * @param moment - 弯矩 N·m
 * @param sectionModulus - 截面模量 m³
 * @returns 弯曲正应力 Pa
 */
export function bendingStress(moment: number, sectionModulus: number): number {
  if (!Number.isFinite(moment) || moment < 0) {
    throw new Error('弯矩必须为非负有限数值。');
  }
  assertPositive(sectionModulus, '截面模量 W');
  return moment / sectionModulus;
}

/** 最大挠度结果 */
export interface DeflectionResult {
  /** 最大挠度绝对值 δmax，m */
  maxDeflection: number;
  /** 最大挠度位置 x，m */
  location: number;
  /** 所用梁表公式说明 */
  formula: string;
}

/**
 * 标准梁表最大挠度（小变形、线弹性、等截面假设）
 *
 * 简支梁：
 * - 跨中点载：δmax = P·L³/(48·E·I)（x=L/2）
 * - 任意点载（a≥b）：δmax = P·b·(L²−b²)^(3/2)/(9√3·E·I·L)，
 *   极值位置 x = √((L²−b²)/3)；a<b 时对称交换 a、b
 * - 满跨均布：δmax = 5·q·L⁴/(384·E·I)（x=L/2）
 * 悬臂梁（固定端 x=0）：
 * - 自由端点载：δmax = P·L³/(3·E·I)（自由端 x=L）
 * - 满跨均布：δmax = q·L⁴/(8·E·I)（自由端 x=L）
 */
export function maxDeflection(
  inputs: BeamCaseInputs,
  modulus: number,
  inertia: number,
): DeflectionResult {
  const { beamType, loadType, length } = inputs;
  assertPositive(length, '梁长 L');
  assertPositive(modulus, '弹性模量 E');
  assertPositive(inertia, '惯性矩 I');
  const ei = modulus * inertia;

  if (beamType === 'simply-supported') {
    if (loadType === 'central-point') {
      const p = inputs.pointLoad as number;
      assertPositive(p, '集中力 P');
      return {
        maxDeflection: (p * length ** 3) / (48 * ei),
        location: length / 2,
        formula: 'δmax = P·L³/(48·E·I)',
      };
    }
    if (loadType === 'arbitrary-point') {
      const p = inputs.pointLoad as number;
      const a = inputs.loadPosition as number;
      assertPositive(p, '集中力 P');
      if (!Number.isFinite(a) || a <= 0 || a >= length) {
        throw new Error('荷载位置 a 必须落在开区间 (0, L) 内。');
      }
      // 以距较远支座的距离为 b（保证 a ≥ b 的标准形式）
      const b = Math.min(a, length - a);
      const location = Math.sqrt((length ** 2 - b ** 2) / 3);
      const delta = (p * b * (length ** 2 - b ** 2) ** 1.5) / (9 * Math.sqrt(3) * ei * length);
      return {
        maxDeflection: delta,
        location,
        formula: 'δmax = P·b·(L²−b²)^(3/2)/(9√3·E·I·L)',
      };
    }
    const q = inputs.uniformLoad as number;
    assertPositive(q, '均布荷载 q');
    return {
      maxDeflection: (5 * q * length ** 4) / (384 * ei),
      location: length / 2,
      formula: 'δmax = 5·q·L⁴/(384·E·I)',
    };
  }

  // 悬臂梁
  if (loadType === 'uniform') {
    const q = inputs.uniformLoad as number;
    assertPositive(q, '均布荷载 q');
    return {
      maxDeflection: (q * length ** 4) / (8 * ei),
      location: length,
      formula: 'δmax = q·L⁴/(8·E·I)（自由端）',
    };
  }
  const p = inputs.pointLoad as number;
  assertPositive(p, '集中力 P');
  if (loadType === 'arbitrary-point') {
    const a = inputs.loadPosition as number;
    if (!Number.isFinite(a) || a <= 0 || a > length) {
      throw new Error('荷载位置 a 必须落在区间 (0, L] 内。');
    }
    // 悬臂点载于 a 处：荷载点挠度 P·a³/(3EI)，自由端因直线段更大：
    // δ(L) = P·a²·(3L−a)/(6EI)
    return {
      maxDeflection: (p * a ** 2 * (3 * length - a)) / (6 * ei),
      location: length,
      formula: 'δmax = P·a²·(3L−a)/(6·E·I)（自由端）',
    };
  }
  return {
    maxDeflection: (p * length ** 3) / (3 * ei),
    location: length,
    formula: 'δmax = P·L³/(3·E·I)（自由端）',
  };
}

/** 强度校核结果 */
export interface StressCheck {
  /** 是否通过（σmax ≤ [σ]，恰好相等判通过） */
  pass: boolean;
  /** 利用率 σmax/[σ]，百分比数值（如 87.5 表示 87.5%） */
  utilizationPercent: number;
}

/**
 * 按许用应力做强度校核
 *
 * @param stress - 最大弯曲正应力 Pa
 * @param allowableStress - 许用应力 [σ] Pa
 */
export function checkStress(stress: number, allowableStress: number): StressCheck {
  assertPositive(stress, '弯曲应力 σ');
  assertPositive(allowableStress, '许用应力 [σ]');
  return {
    pass: stress <= allowableStress,
    utilizationPercent: (stress / allowableStress) * 100,
  };
}

/** 端到端梁计算输入（SI 基准单位） */
export interface BeamCalculationInputs extends BeamCaseInputs {
  /** 弹性模量 E，Pa */
  modulus: number;
  /** 截面性质 */
  section: SectionProperties;
  /** 许用应力 [σ]，Pa；省略则跳过校核 */
  allowableStress?: number;
}

/** 端到端梁计算结果 */
export interface BeamCalculationResult {
  /** 最大弯矩 */
  moment: MomentResult;
  /** 最大弯曲正应力 Pa */
  maxStress: number;
  /** 最大挠度 */
  deflection: DeflectionResult;
  /** 跨厚比 L/δ（无量纲量级参考） */
  spanDeflectionRatio: number;
  /** 强度校核；未提供许用应力时为 null */
  check: StressCheck | null;
  /** 非阻断性提示 */
  warnings: string[];
}

/**
 * 端到端计算：截面 → 弯矩 → 应力 → 挠度 → 强度校核
 */
export function calculateBeam(inputs: BeamCalculationInputs): BeamCalculationResult {
  const { modulus, section, allowableStress } = inputs;
  assertPositive(modulus, '弹性模量 E');
  assertPositive(section.inertia, '惯性矩 I');
  assertPositive(section.sectionModulus, '截面模量 W');

  const warnings: string[] = [];
  const moment = maxBendingMoment(inputs);
  const maxStress = bendingStress(moment.maxMoment, section.sectionModulus);
  const deflection = maxDeflection(inputs, modulus, section.inertia);
  const spanDeflectionRatio = inputs.length / deflection.maxDeflection;

  let check: StressCheck | null = null;
  if (allowableStress !== undefined) {
    check = checkStress(maxStress, allowableStress);
  }

  return {
    moment,
    maxStress,
    deflection,
    spanDeflectionRatio,
    check,
    warnings,
  };
}
