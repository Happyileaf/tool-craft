/**
 * 理想气体状态方程 PV = nRT 计算核心
 *
 * 内部统一使用 SI：P(Pa)、V(m³)、n(mol)、T(K)。
 * 通用气体常数 R = 8.314462618 J/(mol·K)（CODATA 推荐值）。
 *
 * 纯函数、零第三方依赖；单位换算因子集中在本文件常量中并被单测锁定。
 */

/** 通用气体常数 R，J/(mol·K) */
export const GAS_CONSTANT_R = 8.314462618;

/** 物理量字段（四量求一） */
export type GasField = 'pressure' | 'volume' | 'moles' | 'temperature';

/** 压强单位选项（label 为界面文案，factor 为换算到 Pa 的倍率） */
export const PRESSURE_UNITS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: 'Pa', factor: 1 },
  { label: 'kPa', factor: 1000 },
  { label: 'bar', factor: 100000 },
  { label: 'atm', factor: 101325 },
  { label: 'mmHg (Torr)', factor: 101325 / 760 },
];

/** 体积单位选项（换算到 m³） */
export const VOLUME_UNITS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: 'm³', factor: 1 },
  { label: 'L', factor: 0.001 },
  { label: 'mL', factor: 1e-6 },
];

/** 物质的量单位选项（换算到 mol） */
export const MOLE_UNITS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: 'mol', factor: 1 },
  { label: 'mmol', factor: 1e-3 },
];

/** 温度单位 */
export type TemperatureUnit = 'K' | '°C' | '°F';

/** 质量单位（摩尔质量辅助模式，换算到 g） */
export const MASS_UNITS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: 'g', factor: 1 },
  { label: 'kg', factor: 1000 },
  { label: 'mg', factor: 1e-3 },
];

/** 摩尔质量单位（换算到 g/mol） */
export const MOLAR_MASS_UNITS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: 'g/mol', factor: 1 },
  { label: 'kg/mol', factor: 1000 },
];

/** 按 label 查换算倍率，找不到时回退 1 */
function factorOf(units: ReadonlyArray<{ label: string; factor: number }>, label: string): number {
  return units.find((item) => item.label === label)?.factor ?? 1;
}

/** 温度转开尔文 */
export function toKelvin(value: number, unit: TemperatureUnit): number {
  if (!Number.isFinite(value)) {
    throw new Error('温度必须是有限数值。');
  }
  if (unit === 'K') return value;
  if (unit === '°C') return value + 273.15;
  // °F → °C → K
  return ((value - 32) * 5) / 9 + 273.15;
}

/** 开尔文转目标温度单位 */
export function fromKelvin(kelvin: number, unit: TemperatureUnit): number {
  if (!Number.isFinite(kelvin)) {
    throw new Error('开尔文温度必须是有限数值。');
  }
  if (unit === 'K') return kelvin;
  if (unit === '°C') return kelvin - 273.15;
  return ((kelvin - 273.15) * 9) / 5 + 32;
}

/** 压强 → Pa */
export function pressureToPascal(value: number, unit: string): number {
  if (!Number.isFinite(value)) throw new Error('压强必须是有限数值。');
  return value * factorOf(PRESSURE_UNITS, unit);
}

/** Pa → 目标压强单位 */
export function pascalToUnit(pascal: number, unit: string): number {
  return pascal / factorOf(PRESSURE_UNITS, unit);
}

/** 体积 → m³ */
export function volumeToCubicMeter(value: number, unit: string): number {
  if (!Number.isFinite(value)) throw new Error('体积必须是有限数值。');
  return value * factorOf(VOLUME_UNITS, unit);
}

/** m³ → 目标体积单位 */
export function cubicMeterToUnit(cubicMeter: number, unit: string): number {
  return cubicMeter / factorOf(VOLUME_UNITS, unit);
}

/** 物质的量 → mol */
export function molesToMol(value: number, unit: string): number {
  if (!Number.isFinite(value)) throw new Error('物质的量必须是有限数值。');
  return value * factorOf(MOLE_UNITS, unit);
}

/** mol → 目标物质的量单位 */
export function molToUnit(mol: number, unit: string): number {
  return mol / factorOf(MOLE_UNITS, unit);
}

/** 质量 → g */
export function massToGram(value: number, unit: string): number {
  if (!Number.isFinite(value)) throw new Error('质量必须是有限数值。');
  return value * factorOf(MASS_UNITS, unit);
}

/** 摩尔质量 → g/mol */
export function molarMassToGramPerMol(value: number, unit: string): number {
  if (!Number.isFinite(value)) throw new Error('摩尔质量必须是有限数值。');
  return value * factorOf(MOLAR_MASS_UNITS, unit);
}

/**
 * 摩尔质量辅助：n = m / M
 *
 * @param mass - 质量（按 massUnit 换算到 g）
 * @param massUnit - 质量单位
 * @param molarMass - 摩尔质量（按 mmUnit 换算到 g/mol）
 * @param molarMassUnit - 摩尔质量单位
 * @returns 物质的量 n（mol）
 */
export function molesFromMass(
  mass: number,
  massUnit: string,
  molarMass: number,
  molarMassUnit: string,
): number {
  const massGram = massToGram(mass, massUnit);
  const mmGramPerMol = molarMassToGramPerMol(molarMass, molarMassUnit);
  if (!(massGram > 0)) throw new Error('气体质量必须大于 0。');
  if (!(mmGramPerMol > 0)) throw new Error('摩尔质量必须大于 0。');
  return massGram / mmGramPerMol;
}

/** 单个字段的界面输入（数值 + 单位） */
export interface FieldInput {
  value: number | null;
  unit: string;
}

/** 四量求一输入（恰好一个字段 value 为 null） */
export interface GasLawInput {
  pressure: FieldInput;
  volume: FieldInput;
  moles: FieldInput;
  temperature: FieldInput & { tempUnit: TemperatureUnit };
}

/** 求解结果 */
export interface GasLawResult {
  /** 待求字段 */
  unknown: GasField;
  /** SI 单位下的待求值（Pa / m³ / mol / K） */
  siValue: number;
  /** 按该字段界面单位表达的待求值 */
  displayValue: number;
  /** 结果使用的单位 label */
  displayUnit: string;
  /** 代入公式文本 */
  formulaText: string;
  /** 非物理情形警示（如 P=0 导致 V 发散） */
  warning?: string;
}

/** 校验 SI 绝对值的物理合法性（压强/体积/n 必须为正，T 必须 >0 K） */
function assertPositiveSI(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name}必须为大于 0 的有限数值。`);
  }
}

/**
 * 理想气体状态方程四量求一
 *
 * 输入四个字段，恰好一个 value 为 null 作为待求量；
 * 其余三个先换算到 SI，再按 PV=nRT 闭式求解。
 *
 * @param input - 四字段输入
 * @returns 求解结果（含 SI 值、界面单位值与代入文本）
 */
export function solveIdealGas(input: GasLawInput): GasLawResult {
  const unknowns: GasField[] = [];
  (Object.keys(input) as GasField[]).forEach((field) => {
    if (input[field].value === null || input[field].value === undefined) unknowns.push(field);
  });
  if (unknowns.length === 0) {
    throw new Error('四个字段均已填写，请将待求字段留空。');
  }
  if (unknowns.length >= 2) {
    throw new Error('仅支持四量求一：请恰好留空一个字段，其余三个填写数值。');
  }
  const unknown = unknowns[0] as GasField;

  // 已知量换算 SI
  const pPa =
    unknown === 'pressure' ? null : pressureToPascal(input.pressure.value as number, input.pressure.unit);
  const vM3 =
    unknown === 'volume' ? null : volumeToCubicMeter(input.volume.value as number, input.volume.unit);
  const nMol = unknown === 'moles' ? null : molesToMol(input.moles.value as number, input.moles.unit);
  const tKelvin =
    unknown === 'temperature'
      ? null
      : toKelvin(input.temperature.value as number, input.temperature.tempUnit);

  if (pPa !== null && pPa < 0) throw new Error('压强不能为负。');
  if (vM3 !== null && vM3 <= 0) assertPositiveSI(vM3, '体积');
  if (nMol !== null) assertPositiveSI(nMol, '物质的量 n');
  if (tKelvin !== null && tKelvin <= 0) {
    throw new Error('绝对温度必须高于 0 K（约 −273.15 °C），请检查温度输入。');
  }

  let siValue: number;
  let formulaText: string;
  let warning: string | undefined;

  if (unknown === 'pressure') {
    // P = nRT / V
    siValue = ((nMol as number) * GAS_CONSTANT_R * (tKelvin as number)) / (vM3 as number);
    formulaText = `P = nRT / V = ${fmt(nMol)} × ${GAS_CONSTANT_R} × ${fmt(tKelvin)} / ${fmt(vM3)}`;
    if (vM3 === 0) warning = '体积为 0 属于非物理情形，压强发散。';
  } else if (unknown === 'volume') {
    // V = nRT / P
    if (pPa === null || pPa === 0) {
      throw new Error('压强 P=0 时理想气体体积在数学上发散（V=nRT/P），无法给出有限体积。');
    }
    if (nMol === null || tKelvin === null) {
      throw new Error('内部错误：求体积时 n 或 T 缺失。');
    }
    siValue = (nMol * GAS_CONSTANT_R * tKelvin) / pPa;
    formulaText = `V = nRT / P = ${fmt(nMol)} × ${GAS_CONSTANT_R} × ${fmt(tKelvin)} / ${fmt(pPa)}`;
  } else if (unknown === 'moles') {
    // n = PV / (RT)
    if (pPa === null || pPa === 0) {
      throw new Error('压强 P=0 时 n=PV/(RT)=0，无法描述有限物质的量，请检查压强输入。');
    }
    siValue = (pPa * (vM3 as number)) / (GAS_CONSTANT_R * (tKelvin as number));
    formulaText = `n = PV / (RT) = ${fmt(pPa)} × ${fmt(vM3)} / (${GAS_CONSTANT_R} × ${fmt(tKelvin)})`;
  } else {
    // T = PV / (nR)
    if (pPa === null || pPa === 0) {
      throw new Error('压强 P=0 时 T=PV/(nR)=0 K，违反绝对温度 >0 的物理约束，请检查压强输入。');
    }
    siValue = (pPa * (vM3 as number)) / ((nMol as number) * GAS_CONSTANT_R);
    formulaText = `T = PV / (nR) = ${fmt(pPa)} × ${fmt(vM3)} / (${fmt(nMol)} × ${GAS_CONSTANT_R})`;
    if (siValue <= 0) {
      throw new Error('解出的绝对温度不高于 0 K，输入组合不满足理想气体物理约束。');
    }
  }

  if (!Number.isFinite(siValue)) {
    throw new Error('计算结果非有限值，请检查输入数量级或单位。');
  }

  // 转回界面单位
  let displayValue: number;
  let displayUnit: string;
  if (unknown === 'pressure') {
    displayUnit = input.pressure.unit;
    displayValue = pascalToUnit(siValue, displayUnit);
  } else if (unknown === 'volume') {
    displayUnit = input.volume.unit;
    displayValue = cubicMeterToUnit(siValue, displayUnit);
  } else if (unknown === 'moles') {
    displayUnit = input.moles.unit;
    displayValue = molToUnit(siValue, displayUnit);
  } else {
    const tempUnit: TemperatureUnit = input.temperature.tempUnit;
    displayUnit = tempUnit;
    displayValue = fromKelvin(siValue, tempUnit);
  }

  return {
    unknown,
    siValue,
    displayValue: normalizeNegativeZero(displayValue),
    displayUnit,
    formulaText,
    warning,
  };
}

/** STP / SATP 参考点 */
export interface ReferencePoint {
  key: 'stp' | 'satp';
  label: string;
  temperatureCelsius: number;
  temperatureKelvin: number;
  pressurePascal: number;
  /** 该参考点下理想气体摩尔体积 L/mol */
  molarVolumeLPerMol: number;
}

/** 标准状况 STP（0 °C、1 atm）与标准环境 SATP（25 °C、1 atm） */
export const REFERENCE_POINTS: ReadonlyArray<ReferencePoint> = [
  {
    key: 'stp',
    label: 'STP：0 °C / 1 atm',
    temperatureCelsius: 0,
    temperatureKelvin: 273.15,
    pressurePascal: 101325,
    molarVolumeLPerMol: 22.414,
  },
  {
    key: 'satp',
    label: 'SATP：25 °C / 1 atm',
    temperatureCelsius: 25,
    temperatureKelvin: 298.15,
    pressurePascal: 101325,
    molarVolumeLPerMol: 24.465,
  },
];

/**
 * 指定参考点下的摩尔体积 Vm = RT/P（m³/mol），界面可换算 L/mol
 *
 * @param reference - 参考点
 * @returns 摩尔体积（m³/mol）
 */
export function molarVolumeAt(reference: ReferencePoint): number {
  return (GAS_CONSTANT_R * reference.temperatureKelvin) / reference.pressurePascal;
}

/** 低于该绝对量的数值视为浮点残差，统一显示为 0（远低于本工具工程结果量级） */
const RESIDUAL_EPSILON = 1e-10;

/** 紧凑数字格式化（默认 6 位有效数字），消除浮点残差造成的 −0 */
export function formatSignificant(value: number, significantDigits = 6): string {
  if (!Number.isFinite(value)) return '—';
  const normalized = normalizeNegativeZero(value);
  if (normalized === 0) return '0';
  if (Math.abs(normalized) < RESIDUAL_EPSILON) return '0';
  const rounded = parseFloat(normalized.toPrecision(significantDigits));
  if (Object.is(rounded, -0) || rounded === 0) return '0';
  const abs = Math.abs(rounded);
  if (abs < 1e-4 || abs >= 1e7) return rounded.toExponential(significantDigits - 1);
  return String(rounded);
}

/** 内部公式文本用紧凑格式 */
function fmt(value: number | null): string {
  if (value === null) return '?';
  return formatSignificant(value, 6);
}

/** −0 归一为 0 */
function normalizeNegativeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
