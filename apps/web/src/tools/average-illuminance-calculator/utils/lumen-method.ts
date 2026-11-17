/**
 * 室内平均照度计算核心（利用系数法 / 流明法）
 *
 * 标准定义（IES 照明手册体系）：
 * - 室空间比 RCR = 5·hrc·(L+W) / (L·W)
 * - 室形指数 RI  = L·W / [hrc·(L+W)]
 * - 恒等关系：RCR · RI = 5，即 RI = 5 / RCR
 * - 平均维持照度 Eavg = N·Φ·CU·MF / A
 *
 * 纯函数、零第三方依赖，内部采用 SI 单位（m、lm、lux）。
 */

/** 长度单位（基准 m） */
export interface UnitOption {
  /** 下拉标签 */
  label: string;
  /** 换算倍率：基准值 = 输入值 × factor */
  factor: number;
}

/** 长度单位选项（基准 m） */
export const LENGTH_UNITS: UnitOption[] = [
  { label: 'm', factor: 1 },
  { label: 'cm', factor: 0.01 },
  { label: 'ft', factor: 0.3048 },
];

/** 反算灯具数的异常上限保护 */
export const MAX_LUMINAIRE_COUNT = 10000;

/** 校验正数 */
function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name}必须是有限数值。`);
  }
  if (value <= 0) {
    throw new Error(`${name}必须大于 0。`);
  }
}

/**
 * 房间面积 A = L·W
 *
 * @param length - 房间长 L，m
 * @param width - 房间宽 W，m
 * @returns 面积，m²
 */
export function roomArea(length: number, width: number): number {
  assertPositive(length, '房间长度 L');
  assertPositive(width, '房间宽度 W');
  return length * width;
}

/**
 * 计算高度 hrc = 灯具安装高度 − 工作面高度
 *
 * @param mountingHeight - 灯具安装高度，m
 * @param workingPlaneHeight - 工作面高度，m
 * @returns 室空间计算高度 hrc，m
 */
export function calculatedHeight(
  mountingHeight: number,
  workingPlaneHeight: number,
): number {
  assertPositive(mountingHeight, '灯具安装高度');
  if (!Number.isFinite(workingPlaneHeight) || workingPlaneHeight < 0) {
    throw new Error('工作面高度必须为非负有限数值。');
  }
  const hrc = mountingHeight - workingPlaneHeight;
  if (hrc <= 0) {
    throw new Error('计算高度 hrc 必须为正：灯具安装高度应高于工作面高度。');
  }
  return hrc;
}

/**
 * 室空间比 RCR = 5·hrc·(L+W) / (L·W)
 *
 * @param length - 房间长 L，m
 * @param width - 房间宽 W，m
 * @param hrc - 计算高度，m
 * @returns 无量纲 RCR
 */
export function roomCavityRatio(length: number, width: number, hrc: number): number {
  assertPositive(length, '房间长度 L');
  assertPositive(width, '房间宽度 W');
  assertPositive(hrc, '计算高度 hrc');
  return (5 * hrc * (length + width)) / (length * width);
}

/**
 * 室形指数 RI = L·W / [hrc·(L+W)]
 *
 * 与 RCR 满足恒等关系 RI = 5 / RCR。
 *
 * @param length - 房间长 L，m
 * @param width - 房间宽 W，m
 * @param hrc - 计算高度，m
 * @returns 无量纲 RI
 */
export function roomIndex(length: number, width: number, hrc: number): number {
  assertPositive(length, '房间长度 L');
  assertPositive(width, '房间宽度 W');
  assertPositive(hrc, '计算高度 hrc');
  return (length * width) / (hrc * (length + width));
}

/**
 * 流明法平均维持照度 Eavg = N·Φ·CU·MF / A
 *
 * @param luminaireCount - 灯具数量 N（正整数）
 * @param lumenPerLuminaire - 单灯光通量 Φ，lm
 * @param utilizationFactor - 利用系数 CU，区间 (0, 1]
 * @param maintenanceFactor - 维护系数 MF，区间 (0, 1]
 * @param area - 房间面积 A，m²
 * @returns 工作面平均维持照度，lux
 */
export function averageIlluminance(
  luminaireCount: number,
  lumenPerLuminaire: number,
  utilizationFactor: number,
  maintenanceFactor: number,
  area: number,
): number {
  assertPositive(luminaireCount, '灯具数量 N');
  if (!Number.isInteger(luminaireCount)) {
    throw new Error('灯具数量 N 必须为正整数。');
  }
  assertPositive(lumenPerLuminaire, '单灯光通量 Φ');
  assertFactorRange(utilizationFactor, '利用系数 CU');
  assertFactorRange(maintenanceFactor, '维护系数 MF');
  assertPositive(area, '房间面积 A');
  return (luminaireCount * lumenPerLuminaire * utilizationFactor * maintenanceFactor) / area;
}

/** 校验 (0, 1] 区间系数 */
function assertFactorRange(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error(`${name}必须落在 (0, 1] 区间内。`);
  }
}

/**
 * 反算达到目标照度所需的最少灯具数量（向上取整）
 *
 * N_req = E_target·A / (Φ·CU·MF)，结果 ceil 取整，
 * 并返回收整后按正算公式复核的实际照度（保证 ≥ 目标照度）。
 *
 * @param targetIlluminance - 目标平均照度，lux
 * @param lumenPerLuminaire - 单灯光通量 Φ，lm
 * @param utilizationFactor - 利用系数 CU
 * @param maintenanceFactor - 维护系数 MF
 * @param area - 房间面积 A，m²
 * @returns 所需灯具数与复核照度
 */
export function requiredLuminaireCount(
  targetIlluminance: number,
  lumenPerLuminaire: number,
  utilizationFactor: number,
  maintenanceFactor: number,
  area: number,
): { count: number; achievedIlluminance: number; rawCount: number } {
  assertPositive(targetIlluminance, '目标照度 E');
  assertPositive(lumenPerLuminaire, '单灯光通量 Φ');
  assertFactorRange(utilizationFactor, '利用系数 CU');
  assertFactorRange(maintenanceFactor, '维护系数 MF');
  assertPositive(area, '房间面积 A');

  const perLuminaire = lumenPerLuminaire * utilizationFactor * maintenanceFactor;
  const rawCount = (targetIlluminance * area) / perLuminaire;
  const count = Math.ceil(rawCount - 1e-10);
  if (count > MAX_LUMINAIRE_COUNT) {
    throw new Error(
      `反算灯具数超过 ${MAX_LUMINAIRE_COUNT}，请检查目标照度、光通量或房间尺寸输入是否异常。`,
    );
  }
  const achievedIlluminance = averageIlluminance(
    count,
    lumenPerLuminaire,
    utilizationFactor,
    maintenanceFactor,
    area,
  );
  return { count, achievedIlluminance, rawCount };
}

/**
 * 固定灯具数量下，反算满足目标照度所需的单灯光通量
 *
 * Φ_req = E_target·A / (N·CU·MF)，与正算公式互逆。
 *
 * @param targetIlluminance - 目标平均照度，lux
 * @param luminaireCount - 灯具数量 N
 * @param utilizationFactor - 利用系数 CU
 * @param maintenanceFactor - 维护系数 MF
 * @param area - 房间面积 A
 * @returns 所需单灯光通量，lm
 */
export function requiredLumenPerLuminaire(
  targetIlluminance: number,
  luminaireCount: number,
  utilizationFactor: number,
  maintenanceFactor: number,
  area: number,
): number {
  assertPositive(targetIlluminance, '目标照度 E');
  assertPositive(luminaireCount, '灯具数量 N');
  if (!Number.isInteger(luminaireCount)) {
    throw new Error('灯具数量 N 必须为正整数。');
  }
  assertFactorRange(utilizationFactor, '利用系数 CU');
  assertFactorRange(maintenanceFactor, '维护系数 MF');
  assertPositive(area, '房间面积 A');
  return (targetIlluminance * area) / (luminaireCount * utilizationFactor * maintenanceFactor);
}

/** RCR → CU 对照表节点 */
export interface CuTablePoint {
  /** 室空间比 RCR */
  rcr: number;
  /** 对应该 RCR 的利用系数 CU，(0, 1] */
  cu: number;
}

/**
 * 按 RCR 在对照表中做分段线性插值求 CU
 *
 * - 表必须按 RCR 升序且不含重复 RCR；
 * - 恰好落在节点上时返回节点 CU（精确）；
 * - 位于两节点之间时线性插值；
 * - 超出表的 RCR 范围时报错（不做外插）。
 *
 * @param rcr - 当前室空间比
 * @param table - RCR→CU 对照表（至少 2 个节点）
 * @returns 插值得到的利用系数 CU
 */
export function interpolateUtilizationFactor(
  rcr: number,
  table: CuTablePoint[],
): number {
  if (!Number.isFinite(rcr) || rcr < 0) {
    throw new Error('室空间比 RCR 必须为非负有限数值。');
  }
  if (!Array.isArray(table) || table.length < 2) {
    throw new Error('CU 对照表至少需要 2 个节点才能插值。');
  }
  for (let i = 0; i < table.length; i += 1) {
    const point = table[i] as CuTablePoint;
    if (!Number.isFinite(point.rcr) || point.rcr < 0) {
      throw new Error('对照表中存在非法 RCR 节点。');
    }
    assertFactorRange(point.cu, '对照表 CU');
    if (i > 0) {
      const previous = table[i - 1] as CuTablePoint;
      if (point.rcr <= previous.rcr) {
        throw new Error('CU 对照表必须按 RCR 升序排列且不得重复。');
      }
    }
  }

  const first = table[0] as CuTablePoint;
  const last = table[table.length - 1] as CuTablePoint;
  if (rcr < first.rcr || rcr > last.rcr) {
    throw new Error(
      `RCR=${rcr.toFixed(3)} 超出对照表范围 [${first.rcr}, ${last.rcr}]，外插不可用，请扩充厂商光度数据表。`,
    );
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const left = table[i] as CuTablePoint;
    const right = table[i + 1] as CuTablePoint;
    if (rcr === left.rcr) return left.cu;
    if (rcr === right.rcr) return right.cu;
    if (rcr > left.rcr && rcr < right.rcr) {
      const t = (rcr - left.rcr) / (right.rcr - left.rcr);
      return left.cu + t * (right.cu - left.cu);
    }
  }
  // 理论上不可达：范围检查已覆盖
  throw new Error('CU 插值失败。');
}

/** 几何计算汇总结果 */
export interface RoomGeometry {
  /** 面积 A，m² */
  area: number;
  /** 计算高度 hrc，m */
  hrc: number;
  /** 室空间比 RCR */
  rcr: number;
  /** 室形指数 RI */
  ri: number;
}

/**
 * 一次性计算房间几何中间量
 *
 * @param length - 房间长 L，m
 * @param width - 房间宽 W，m
 * @param mountingHeight - 灯具安装高度，m
 * @param workingPlaneHeight - 工作面高度，m
 */
export function calculateRoomGeometry(
  length: number,
  width: number,
  mountingHeight: number,
  workingPlaneHeight: number,
): RoomGeometry {
  const hrc = calculatedHeight(mountingHeight, workingPlaneHeight);
  const area = roomArea(length, width);
  const rcr = roomCavityRatio(length, width, hrc);
  const ri = roomIndex(length, width, hrc);
  return { area, hrc, rcr, ri };
}
