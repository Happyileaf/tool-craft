/**
 * RAID 容量计算器常量：级别选项与容量单位选项
 */
import { RAID_LEVELS, type CapacityUnit, type RaidLevel } from './utils/raid';

/** RAID 级别选项，补充面向用户的典型用途说明 */
export interface RaidLevelOption {
  /** RAID 级别标识 */
  value: RaidLevel;
  /** 级别名称，如 RAID 5 */
  label: string;
  /** 组建该级别所需的最少盘数说明 */
  minDisksText: string;
  /** 冗余机制与容量公式说明 */
  description: string;
  /** 典型使用场景 */
  useCase: string;
}

/** 五个 RAID 级别的选择项，顺序与对比表保持一致 */
export const RAID_LEVEL_OPTIONS: RaidLevelOption[] = (
  ['raid0', 'raid1', 'raid5', 'raid6', 'raid10'] as RaidLevel[]
).map((level) => {
  const meta = RAID_LEVELS[level];
  const evenText = meta.requireEvenDisks ? '（且盘数为偶数）' : '';
  return {
    value: level,
    label: meta.label,
    minDisksText: `最少 ${meta.minDisks} 块盘${evenText}`,
    description: meta.description,
    useCase: RAID_USE_CASES[level],
  };
});

/** 各 RAID 级别的典型用途 */
const RAID_USE_CASES: Record<RaidLevel, string> = {
  raid0: '视频剪辑缓存、临时数据等高吞吐、可重建场景',
  raid1: '系统盘、小规模关键业务的简单镜像冗余',
  raid5: 'NAS、文件服务器等兼顾容量与单盘容错的通用场景',
  raid6: '大容量归档盘柜、重建周期长、需容忍双盘故障的存储',
  raid10: '数据库、虚拟化等高 IOPS 且要求高可用的业务',
};

/** 容量单位选项：TB 为十进制口径，TiB 为二进制口径 */
export interface CapacityUnitOption {
  /** 单位标识 */
  value: CapacityUnit;
  /** 单位名称 */
  label: CapacityUnit;
  /** 换算到字节的倍率 */
  factor: number;
  /** 口径说明 */
  hint: string;
}

/** 容量单位选择项（TB / TiB） */
export const CAPACITY_UNIT_OPTIONS: CapacityUnitOption[] = [
  { value: 'TB', label: 'TB', factor: 10 ** 12, hint: '十进制，1 TB = 10¹² 字节（厂商标称）' },
  { value: 'TiB', label: 'TiB', factor: 2 ** 40, hint: '二进制，1 TiB = 2⁴⁰ 字节（系统识别）' },
];
