/**
 * RAID 磁盘阵列容量与容错规划纯函数
 *
 * 覆盖 RAID 0（条带、无冗余）、RAID 1（镜像）、RAID 5（单分布式校验）、
 * RAID 6（双分布式校验）与 RAID 10（镜像 + 条带）。
 *
 * 约定：
 * - 盘数 n 为正整数，单盘容量 C（字节）为正数；
 * - 原始容量 rawBytes = n·C；
 * - 可用容量按标准理想模型计算：
 *   RAID 0 = n·C、RAID 1 = C、RAID 5 = (n−1)·C、
 *   RAID 6 = (n−2)·C、RAID 10 = n/2·C（n 为偶数）；
 * - 容量利用率 utilizationPercent = 可用 / 原始 × 100；
 * - 校验与镜像开销 overheadBytes = 原始 − 可用。
 */

/** RAID 级别标识 */
export type RaidLevel = 'raid0' | 'raid1' | 'raid5' | 'raid6' | 'raid10';

/** 容量展示口径：TB 为十进制 10^12，TiB 为二进制 2^40 */
export type CapacityUnit = 'TB' | 'TiB';

/** 容错盘数：可为固定值，也可按盘数动态计算（如 RAID 1 = n−1） */
export type FaultTolerance = number | ((diskCount: number) => number);

/** 单个 RAID 级别的静态元信息 */
export interface RaidLevelMeta {
  /** RAID 级别标识 */
  level: RaidLevel;
  /** 面向用户展示的名称 */
  label: string;
  /** 组建该级别所需的最少物理盘数（RAID 10 另要求盘数为偶数） */
  minDisks: number;
  /** 是否额外要求盘数为偶数（仅 RAID 10） */
  requireEvenDisks: boolean;
  /** 可容忍的故障盘数：固定数值或按盘数计算的函数 */
  faultTolerance: FaultTolerance;
  /** 容量计算公式说明（C 表示单盘容量，n 表示盘数） */
  formula: string;
  /** 冗余机制与典型用途的中文说明 */
  description: string;
}

/** 一次 RAID 容量计算的结果 */
export interface RaidResult {
  /** RAID 级别标识 */
  level: RaidLevel;
  /** 原始总容量（字节），等于盘数 × 单盘容量 */
  rawBytes: number;
  /** 可用容量（字节） */
  usableBytes: number;
  /** 校验 / 镜像开销容量（字节），等于原始容量 − 可用容量 */
  overheadBytes: number;
  /** 容量利用率百分比，如 75 表示 75% */
  utilizationPercent: number;
  /** 可容忍同时故障的物理盘数 */
  faultTolerance: number;
  /** 该级别要求的最少物理盘数 */
  minDisks: number;
}

/** 级别对比表中单个级别的条目：可行时携带完整结果，不可行时携带原因 */
export type RaidComparisonEntry =
  | ({ feasible: true; reason?: undefined } & RaidResult)
  | {
      feasible: false;
      level: RaidLevel;
      /** 不可行的中文原因 */
      reason: string;
      /** 该级别要求的最少物理盘数 */
      minDisks: number;
    };

/** 各 RAID 级别的静态元信息（顺序即对比表展示顺序） */
export const RAID_LEVELS: Record<RaidLevel, RaidLevelMeta> = {
  raid0: {
    level: 'raid0',
    label: 'RAID 0',
    minDisks: 2,
    requireEvenDisks: false,
    faultTolerance: 0,
    formula: '可用容量 = n × C',
    description: '纯条带、无冗余，容量利用率 100%，任意一块盘故障即丢失全部数据。',
  },
  raid1: {
    level: 'raid1',
    label: 'RAID 1',
    minDisks: 2,
    requireEvenDisks: false,
    faultTolerance: (diskCount) => diskCount - 1,
    formula: '可用容量 = C',
    description: '全盘镜像，可用容量等于单盘容量，可容忍 n−1 块盘同时故障。',
  },
  raid5: {
    level: 'raid5',
    label: 'RAID 5',
    minDisks: 3,
    requireEvenDisks: false,
    faultTolerance: 1,
    formula: '可用容量 = (n − 1) × C',
    description: '单分布式校验，牺牲一块盘的容量存放校验信息，可容忍 1 块盘故障。',
  },
  raid6: {
    level: 'raid6',
    label: 'RAID 6',
    minDisks: 4,
    requireEvenDisks: false,
    faultTolerance: 2,
    formula: '可用容量 = (n − 2) × C',
    description: '双分布式校验，牺牲两块盘的容量存放校验信息，可容忍 2 块盘同时故障。',
  },
  raid10: {
    level: 'raid10',
    label: 'RAID 10',
    minDisks: 4,
    requireEvenDisks: true,
    faultTolerance: 1,
    formula: '可用容量 = n / 2 × C（盘数须为偶数）',
    description: '先镜像后条带，每组镜像可容忍 1 块盘故障，兼顾性能与冗余。',
  },
};

/** 对比表使用的级别顺序 */
export const RAID_LEVEL_ORDER: RaidLevel[] = ['raid0', 'raid1', 'raid5', 'raid6', 'raid10'];

/**
 * 取某级别在给定盘数下可容忍的故障盘数
 *
 * @param level - RAID 级别标识
 * @param diskCount - 物理盘数
 * @returns 可容忍同时故障的盘数
 */
export function getFaultTolerance(level: RaidLevel, diskCount: number): number {
  const meta = RAID_LEVELS[level];
  return typeof meta.faultTolerance === 'function'
    ? meta.faultTolerance(diskCount)
    : meta.faultTolerance;
}

/**
 * 校验给定盘数是否满足某 RAID 级别的组建要求
 *
 * @param level - RAID 级别标识
 * @param diskCount - 物理盘数
 * @returns 满足要求时返回 null，否则返回不可行的中文原因
 */
export function getInfeasibleReason(level: RaidLevel, diskCount: number): string | null {
  const meta = RAID_LEVELS[level];
  if (diskCount < meta.minDisks) {
    return `${meta.label} 至少需要 ${meta.minDisks} 块盘，当前仅 ${diskCount} 块`;
  }
  if (meta.requireEvenDisks && diskCount % 2 !== 0) {
    return `${meta.label} 要求盘数为偶数，当前 ${diskCount} 块为奇数`;
  }
  return null;
}

/**
 * 将利用率百分比四舍五入保留两位小数，消除浮点尾差
 *
 * @param numerator - 分子（可用容量）
 * @param denominator - 分母（原始容量）
 * @returns 保留两位小数的百分比数值
 */
function roundUtilization(numerator: number, denominator: number): number {
  return Math.round((numerator / denominator) * 100 * 100) / 100;
}

/**
 * 计算指定 RAID 级别的容量、开销、利用率与容错盘数
 *
 * @param level - RAID 级别标识
 * @param diskCount - 物理盘数，必须 ≥ 1 的正整数
 * @param diskCapacityBytes - 单盘容量（字节），必须 > 0
 * @returns 原始 / 可用 / 开销容量、利用率、容错盘数与最小盘数
 * @throws 盘数小于 1、容量非正数或盘数不满足级别要求时抛出含字段名 / 级别与最小盘数的错误
 */
export function calculateRaid(
  level: RaidLevel,
  diskCount: number,
  diskCapacityBytes: number,
): RaidResult {
  if (!Number.isInteger(diskCount) || diskCount < 1) {
    throw new Error(`盘数（diskCount）必须为不小于 1 的正整数，当前为 ${String(diskCount)}`);
  }
  if (!Number.isFinite(diskCapacityBytes) || diskCapacityBytes <= 0) {
    throw new Error(
      `单盘容量（diskCapacityBytes）必须为正数，当前为 ${String(diskCapacityBytes)}`,
    );
  }

  const meta = RAID_LEVELS[level];
  const reason = getInfeasibleReason(level, diskCount);
  if (reason !== null) {
    throw new Error(reason);
  }

  const rawBytes = diskCount * diskCapacityBytes;
  let usableBytes: number;
  switch (level) {
    case 'raid0':
      usableBytes = diskCount * diskCapacityBytes;
      break;
    case 'raid1':
      usableBytes = diskCapacityBytes;
      break;
    case 'raid5':
      usableBytes = (diskCount - 1) * diskCapacityBytes;
      break;
    case 'raid6':
      usableBytes = (diskCount - 2) * diskCapacityBytes;
      break;
    case 'raid10':
      usableBytes = (diskCount / 2) * diskCapacityBytes;
      break;
  }

  return {
    level,
    rawBytes,
    usableBytes,
    overheadBytes: rawBytes - usableBytes,
    utilizationPercent: roundUtilization(usableBytes, rawBytes),
    faultTolerance: getFaultTolerance(level, diskCount),
    minDisks: meta.minDisks,
  };
}

/**
 * 在相同盘数与单盘容量下，同时计算全部 5 个 RAID 级别的结果
 *
 * 与 {@link calculateRaid} 不同：盘数不满足某级别要求时不抛错，
 * 而是返回 `{ feasible: false, reason }`，供对比表直接展示原因。
 *
 * @param diskCount - 物理盘数，必须 ≥ 1 的正整数
 * @param diskCapacityBytes - 单盘容量（字节），必须 > 0
 * @returns 按 RAID 0/1/5/6/10 顺序排列的对比条目数组
 * @throws 仅当盘数小于 1 或容量非正数时抛出含字段名的错误
 */
export function compareAllLevels(
  diskCount: number,
  diskCapacityBytes: number,
): RaidComparisonEntry[] {
  if (!Number.isInteger(diskCount) || diskCount < 1) {
    throw new Error(`盘数（diskCount）必须为不小于 1 的正整数，当前为 ${String(diskCount)}`);
  }
  if (!Number.isFinite(diskCapacityBytes) || diskCapacityBytes <= 0) {
    throw new Error(
      `单盘容量（diskCapacityBytes）必须为正数，当前为 ${String(diskCapacityBytes)}`,
    );
  }

  return RAID_LEVEL_ORDER.map((level) => {
    const reason = getInfeasibleReason(level, diskCount);
    if (reason !== null) {
      return {
        feasible: false as const,
        level,
        reason,
        minDisks: RAID_LEVELS[level].minDisks,
      };
    }
    return { feasible: true as const, ...calculateRaid(level, diskCount, diskCapacityBytes) };
  });
}

/** 十进制 TB 与二进制 TiB 的换算基数 */
const UNIT_DIVISOR: Record<CapacityUnit, number> = {
  TB: 10 ** 12,
  TiB: 2 ** 40,
};

/**
 * 按指定口径将字节数格式化为带单位的字符串
 *
 * TB 按 10^12 换算（厂商标称口径），TiB 按 2^40 换算（操作系统口径），
 * 结果保留两位小数。
 *
 * @param bytes - 字节数
 * @param unit - 展示口径：'TB' 或 'TiB'
 * @returns 形如 `12.00 TB`、`3.64 TiB` 的字符串
 */
export function formatBytes(bytes: number, unit: CapacityUnit): string {
  if (!Number.isFinite(bytes)) {
    throw new Error(`待格式化的字节数无效：${String(bytes)}`);
  }
  const value = bytes / UNIT_DIVISOR[unit];
  return `${value.toFixed(2)} ${unit}`;
}
