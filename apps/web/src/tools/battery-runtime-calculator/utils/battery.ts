export interface BatterySpec {
  /** 标称容量数值 */
  capacity: number;
  /** 容量单位：mAh / Ah / Wh */
  unit: 'mAh' | 'Ah' | 'Wh';
  /** 标称电压（V） */
  voltage: number;
}

export interface PackSpec {
  /** 单节容量（mAh） */
  cellCapacityMah: number;
  /** 单节标称电压（V） */
  cellVoltage: number;
  /** 串联节数 */
  series: number;
  /** 并联组数 */
  parallel: number;
}

export interface RuntimeOptions {
  /** 负载类型 */
  loadType: 'current' | 'power';
  /** 负载电流（A），loadType 为 current 时使用 */
  currentA?: number;
  /** 负载功率（W），loadType 为 power 时使用 */
  powerW?: number;
  /** 转换效率百分比，0-100 */
  efficiencyPct: number;
  /** 放电深度百分比，0-100 */
  depthOfDischargePct: number;
  /** Peukert 指数，1 表示理想电池 */
  peukertExponent?: number;
  /** Peukert 基准放电电流（A），默认取 1C */
  ratedCurrentA?: number;
}

export interface RuntimeResult {
  /** 标称能量（Wh） */
  capacityWh: number;
  /** 标称容量（Ah） */
  capacityAh: number;
  /** 可用能量（Wh，扣除放电深度与效率） */
  usableWh: number;
  /** 可用容量（Ah） */
  usableAh: number;
  /** 实际负载电流（A） */
  loadCurrentA: number;
  /** 实际负载功率（W） */
  loadPowerW: number;
  /** 预计续航（小时） */
  runtimeHours: number;
  /** 预计续航（分钟） */
  runtimeMinutes: number;
  /** 是否应用了 Peukert 修正 */
  peukertApplied: boolean;
}

export const COMPARISON_RATIOS = [0.1, 0.25, 0.5, 1, 2];

/**
 * 换算标称能量（Wh）
 */
export function capacityWh(spec: BatterySpec): number {
  validateSpec(spec);
  if (spec.unit === 'Wh') {
    return spec.capacity;
  }
  if (spec.unit === 'Ah') {
    return spec.capacity * spec.voltage;
  }
  return (spec.capacity / 1000) * spec.voltage;
}

/**
 * 换算标称容量（Ah）
 */
export function capacityAh(spec: BatterySpec): number {
  validateSpec(spec);
  if (spec.unit === 'Ah') {
    return spec.capacity;
  }
  if (spec.unit === 'mAh') {
    return spec.capacity / 1000;
  }
  return spec.capacity / spec.voltage;
}

/**
 * 由串并联参数生成等效电池规格
 */
export function packSpec(input: PackSpec): BatterySpec {
  if (!Number.isInteger(input.series) || input.series < 1) {
    throw new Error('串联节数必须为不小于 1 的整数');
  }
  if (!Number.isInteger(input.parallel) || input.parallel < 1) {
    throw new Error('并联组数必须为不小于 1 的整数');
  }
  if (!Number.isFinite(input.cellCapacityMah) || input.cellCapacityMah <= 0) {
    throw new Error('单节容量必须大于 0');
  }
  if (!Number.isFinite(input.cellVoltage) || input.cellVoltage <= 0) {
    throw new Error('单节电压必须大于 0');
  }
  return {
    capacity: input.cellCapacityMah * input.parallel,
    unit: 'mAh',
    voltage: input.cellVoltage * input.series,
  };
}

/**
 * 计算续航时间与可用能量。Peukert 修正按 t = t_base × (I_rated / I)^(k-1) 计算。
 */
export function calculateRuntime(spec: BatterySpec, options: RuntimeOptions): RuntimeResult {
  validateSpec(spec);
  if (!Number.isFinite(options.efficiencyPct) || options.efficiencyPct <= 0 || options.efficiencyPct > 100) {
    throw new Error('转换效率必须在 0 到 100 之间');
  }
  if (
    !Number.isFinite(options.depthOfDischargePct) ||
    options.depthOfDischargePct <= 0 ||
    options.depthOfDischargePct > 100
  ) {
    throw new Error('放电深度必须在 0 到 100 之间');
  }

  const wh = capacityWh(spec);
  const ah = capacityAh(spec);
  const usableWh = wh * (options.depthOfDischargePct / 100) * (options.efficiencyPct / 100);
  const usableAh = ah * (options.depthOfDischargePct / 100) * (options.efficiencyPct / 100);

  let loadPowerW: number;
  let loadCurrentA: number;
  if (options.loadType === 'power') {
    if (!Number.isFinite(options.powerW) || (options.powerW ?? 0) <= 0) {
      throw new Error('负载功率必须大于 0');
    }
    loadPowerW = options.powerW as number;
    loadCurrentA = loadPowerW / spec.voltage;
  } else {
    if (!Number.isFinite(options.currentA) || (options.currentA ?? 0) <= 0) {
      throw new Error('负载电流必须大于 0');
    }
    loadCurrentA = options.currentA as number;
    loadPowerW = loadCurrentA * spec.voltage;
  }

  const baseHours = usableWh / loadPowerW;
  const exponent = options.peukertExponent ?? 1;
  if (!Number.isFinite(exponent) || exponent < 1) {
    throw new Error('Peukert 指数必须为不小于 1 的数值');
  }
  const ratedCurrent = options.ratedCurrentA ?? ah;
  if (!Number.isFinite(ratedCurrent) || ratedCurrent <= 0) {
    throw new Error('Peukert 基准电流必须大于 0');
  }
  const peukertApplied = exponent > 1;
  const runtimeHours = peukertApplied
    ? baseHours * (ratedCurrent / loadCurrentA) ** (exponent - 1)
    : baseHours;
  if (!Number.isFinite(runtimeHours) || runtimeHours <= 0) {
    throw new Error('输入参数无法得到有效续航，请检查容量与负载');
  }

  return {
    capacityWh: wh,
    capacityAh: ah,
    usableWh,
    usableAh,
    loadCurrentA,
    loadPowerW,
    runtimeHours,
    runtimeMinutes: runtimeHours * 60,
    peukertApplied,
  };
}

/**
 * 生成不同放电倍率下的续航对比表
 */
export function runtimeTable(
  spec: BatterySpec,
  options: RuntimeOptions,
  ratios: number[] = COMPARISON_RATIOS,
): { ratio: number; currentA: number; runtimeHours: number; runtimeLabel: string }[] {
  const ah = capacityAh(spec);
  return ratios.map((ratio) => {
    const currentA = ah * ratio;
    const result = calculateRuntime(spec, { ...options, loadType: 'current', currentA });
    return {
      ratio,
      currentA,
      runtimeHours: result.runtimeHours,
      runtimeLabel: formatRuntime(result.runtimeHours),
    };
  });
}

/**
 * 把小时数格式化为「x 小时 y 分」或分钟数
 */
export function formatRuntime(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return '—';
  }
  if (hours >= 1) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 60) {
      return `${wholeHours + 1} 小时 0 分`;
    }
    return `${wholeHours} 小时 ${minutes} 分`;
  }
  return `${Math.round(hours * 60)} 分钟`;
}

/**
 * 校验电池规格
 */
export function validateSpec(spec: BatterySpec): void {
  if (!Number.isFinite(spec.capacity) || spec.capacity <= 0) {
    throw new Error('电池容量必须大于 0');
  }
  if (!Number.isFinite(spec.voltage) || spec.voltage <= 0) {
    throw new Error('标称电压必须大于 0');
  }
}
