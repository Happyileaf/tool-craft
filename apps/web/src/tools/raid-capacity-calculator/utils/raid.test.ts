import { describe, it, expect } from 'vitest';
import {
  RAID_LEVELS,
  RAID_LEVEL_ORDER,
  calculateRaid,
  compareAllLevels,
  formatBytes,
  getFaultTolerance,
  getInfeasibleReason,
  type RaidLevel,
} from './raid';

/** 单盘 4TB（十进制口径，字节） */
const DISK_4TB = 4 * 10 ** 12;

describe('RAID_LEVELS 静态元信息', () => {
  it('五个级别的最小盘数分别为 2/2/3/4/4，且仅 RAID 10 要求偶数盘', () => {
    expect(RAID_LEVELS.raid0.minDisks).toBe(2);
    expect(RAID_LEVELS.raid1.minDisks).toBe(2);
    expect(RAID_LEVELS.raid5.minDisks).toBe(3);
    expect(RAID_LEVELS.raid6.minDisks).toBe(4);
    expect(RAID_LEVELS.raid10.minDisks).toBe(4);
    expect(RAID_LEVELS.raid10.requireEvenDisks).toBe(true);
    expect(RAID_LEVEL_ORDER).toEqual(['raid0', 'raid1', 'raid5', 'raid6', 'raid10']);
  });

  it('容错盘数：RAID 0 为 0、RAID 5 为 1、RAID 6 为 2、RAID 10 为 1，RAID 1 为 n−1', () => {
    expect(getFaultTolerance('raid0', 4)).toBe(0);
    expect(getFaultTolerance('raid5', 4)).toBe(1);
    expect(getFaultTolerance('raid6', 4)).toBe(2);
    expect(getFaultTolerance('raid10', 4)).toBe(1);
    expect(getFaultTolerance('raid1', 2)).toBe(1);
    expect(getFaultTolerance('raid1', 4)).toBe(3);
  });
});

describe('固定向量：4 × 4TB 各 RAID 级别', () => {
  it('RAID 0：可用 16TB、零开销、利用率 100%、容错 0 盘', () => {
    const result = calculateRaid('raid0', 4, DISK_4TB);
    expect(result.rawBytes).toBe(16 * 10 ** 12);
    expect(result.usableBytes).toBe(16 * 10 ** 12);
    expect(result.overheadBytes).toBe(0);
    expect(result.utilizationPercent).toBe(100);
    expect(result.faultTolerance).toBe(0);
  });

  it('RAID 1：可用 4TB、开销 12TB、利用率 25%、容错 3 盘', () => {
    const result = calculateRaid('raid1', 4, DISK_4TB);
    expect(result.rawBytes).toBe(16 * 10 ** 12);
    expect(result.usableBytes).toBe(4 * 10 ** 12);
    expect(result.overheadBytes).toBe(12 * 10 ** 12);
    expect(result.utilizationPercent).toBe(25);
    expect(result.faultTolerance).toBe(3);
  });

  it('RAID 5：可用 12TB、开销 4TB、利用率 75%、容错 1 盘', () => {
    const result = calculateRaid('raid5', 4, DISK_4TB);
    expect(result.rawBytes).toBe(16 * 10 ** 12);
    expect(result.usableBytes).toBe(12 * 10 ** 12);
    expect(result.overheadBytes).toBe(4 * 10 ** 12);
    expect(result.utilizationPercent).toBe(75);
    expect(result.faultTolerance).toBe(1);
    expect(result.minDisks).toBe(3);
  });

  it('RAID 6：可用 8TB、开销 8TB、利用率 50%、容错 2 盘', () => {
    const result = calculateRaid('raid6', 4, DISK_4TB);
    expect(result.usableBytes).toBe(8 * 10 ** 12);
    expect(result.overheadBytes).toBe(8 * 10 ** 12);
    expect(result.utilizationPercent).toBe(50);
    expect(result.faultTolerance).toBe(2);
  });

  it('RAID 10：可用 8TB、开销 8TB、利用率 50%、容错 1 盘', () => {
    const result = calculateRaid('raid10', 4, DISK_4TB);
    expect(result.usableBytes).toBe(8 * 10 ** 12);
    expect(result.overheadBytes).toBe(8 * 10 ** 12);
    expect(result.utilizationPercent).toBe(50);
    expect(result.faultTolerance).toBe(1);
  });

  it('2 盘 RAID 1：可用容量等于单盘容量、容错 1 盘、利用率 50%', () => {
    const result = calculateRaid('raid1', 2, DISK_4TB);
    expect(result.usableBytes).toBe(DISK_4TB);
    expect(result.overheadBytes).toBe(DISK_4TB);
    expect(result.utilizationPercent).toBe(50);
    expect(result.faultTolerance).toBe(1);
  });

  it('3 盘 RAID 5：可用 2C、开销 C', () => {
    const result = calculateRaid('raid5', 3, DISK_4TB);
    expect(result.usableBytes).toBe(2 * DISK_4TB);
    expect(result.overheadBytes).toBe(DISK_4TB);
    expect(result.utilizationPercent).toBeCloseTo(66.67, 2);
  });

  it('6 盘 RAID 10：可用 3C、容错 1 盘', () => {
    const result = calculateRaid('raid10', 6, DISK_4TB);
    expect(result.usableBytes).toBe(3 * DISK_4TB);
    expect(result.overheadBytes).toBe(3 * DISK_4TB);
    expect(result.utilizationPercent).toBe(50);
    expect(result.faultTolerance).toBe(1);
  });
});

describe('盘数不满足级别要求时抛出明确错误', () => {
  it('2 盘组建 RAID 5 抛出含级别与最小盘数的错误', () => {
    expect(() => calculateRaid('raid5', 2, DISK_4TB)).toThrow(/RAID 5/);
    expect(() => calculateRaid('raid5', 2, DISK_4TB)).toThrow(/3/);
  });

  it('3 盘组建 RAID 6 抛出含级别与最小盘数的错误', () => {
    expect(() => calculateRaid('raid6', 3, DISK_4TB)).toThrow(/RAID 6/);
    expect(() => calculateRaid('raid6', 3, DISK_4TB)).toThrow(/4/);
  });

  it('奇数盘组建 RAID 10 抛出偶数盘错误', () => {
    expect(() => calculateRaid('raid10', 5, DISK_4TB)).toThrow(/偶数/);
  });

  it('3 盘组建 RAID 10 同时不满足最小盘数，错误包含最小盘数 4', () => {
    expect(() => calculateRaid('raid10', 3, DISK_4TB)).toThrow(/4/);
  });

  it('1 盘组建 RAID 0 抛出最小盘数错误', () => {
    expect(() => calculateRaid('raid0', 1, DISK_4TB)).toThrow(/RAID 0/);
    expect(() => calculateRaid('raid0', 1, DISK_4TB)).toThrow(/2/);
  });

  it('getInfeasibleReason 对可行配置返回 null', () => {
    expect(getInfeasibleReason('raid5', 3)).toBeNull();
    expect(getInfeasibleReason('raid10', 4)).toBeNull();
  });
});

describe('非法输入抛出含字段名的错误且不产出 NaN', () => {
  it('盘数为 0 / 负数 / 小数 / NaN 时报错并包含 diskCount 字段名', () => {
    expect(() => calculateRaid('raid0', 0, DISK_4TB)).toThrow(/diskCount/);
    expect(() => calculateRaid('raid0', -2, DISK_4TB)).toThrow(/diskCount/);
    expect(() => calculateRaid('raid0', 1.5, DISK_4TB)).toThrow(/diskCount/);
    expect(() => calculateRaid('raid0', Number.NaN, DISK_4TB)).toThrow(/diskCount/);
  });

  it('单盘容量为 0 / 负数 / NaN / Infinity 时报错并包含 diskCapacityBytes 字段名', () => {
    expect(() => calculateRaid('raid0', 2, 0)).toThrow(/diskCapacityBytes/);
    expect(() => calculateRaid('raid0', 2, -1)).toThrow(/diskCapacityBytes/);
    expect(() => calculateRaid('raid0', 2, Number.NaN)).toThrow(/diskCapacityBytes/);
    expect(() => calculateRaid('raid0', 2, Number.POSITIVE_INFINITY)).toThrow(
      /diskCapacityBytes/,
    );
  });

  it('任何合法结果中均不出现 NaN', () => {
    for (const level of RAID_LEVEL_ORDER) {
      const result = calculateRaid(level, 4, DISK_4TB);
      for (const value of [
        result.rawBytes,
        result.usableBytes,
        result.overheadBytes,
        result.utilizationPercent,
        result.faultTolerance,
      ]) {
        expect(Number.isNaN(value)).toBe(false);
      }
    }
  });
});

describe('compareAllLevels 全级别对比', () => {
  it('4 盘时五个级别全部可行且顺序为 RAID 0/1/5/6/10', () => {
    const entries = compareAllLevels(4, DISK_4TB);
    expect(entries).toHaveLength(5);
    expect(entries.map((entry) => entry.level)).toEqual(RAID_LEVEL_ORDER);
    expect(entries.every((entry) => entry.feasible)).toBe(true);
    const raid5 = entries.find((entry) => entry.level === 'raid5');
    expect(raid5?.feasible).toBe(true);
    if (raid5?.feasible) {
      expect(raid5.usableBytes).toBe(12 * 10 ** 12);
      expect(raid5.utilizationPercent).toBe(75);
    }
  });

  it('2 盘时 RAID 5/6/10 不可行并返回原因，RAID 0/1 可行', () => {
    const entries = compareAllLevels(2, DISK_4TB);
    const byLevel = new Map(entries.map((entry) => [entry.level, entry]));
    expect(byLevel.get('raid0')?.feasible).toBe(true);
    expect(byLevel.get('raid1')?.feasible).toBe(true);

    const raid5 = byLevel.get('raid5');
    expect(raid5?.feasible).toBe(false);
    if (raid5 && !raid5.feasible) {
      expect(raid5.reason).toMatch(/RAID 5/);
      expect(raid5.reason).toMatch(/3/);
      expect(raid5.minDisks).toBe(3);
    }

    const raid6 = byLevel.get('raid6');
    expect(raid6?.feasible).toBe(false);
    if (raid6 && !raid6.feasible) {
      expect(raid6.reason).toMatch(/RAID 6/);
      expect(raid6.minDisks).toBe(4);
    }

    const raid10 = byLevel.get('raid10');
    expect(raid10?.feasible).toBe(false);
    if (raid10 && !raid10.feasible) {
      expect(raid10.reason).toMatch(/4/);
    }
  });

  it('5 盘时 RAID 10 因奇数盘不可行，原因包含偶数提示', () => {
    const entries = compareAllLevels(5, DISK_4TB);
    const raid10 = entries.find((entry) => entry.level === 'raid10');
    expect(raid10?.feasible).toBe(false);
    if (raid10 && !raid10.feasible) {
      expect(raid10.reason).toMatch(/偶数/);
    }
  });

  it('对比函数同样校验非法盘数与容量，并抛出含字段名的错误', () => {
    expect(() => compareAllLevels(0, DISK_4TB)).toThrow(/diskCount/);
    expect(() => compareAllLevels(4, 0)).toThrow(/diskCapacityBytes/);
  });
});

describe('formatBytes TB / TiB 双口径格式化', () => {
  it('TB 按 10^12 换算并保留两位小数', () => {
    expect(formatBytes(12 * 10 ** 12, 'TB')).toBe('12.00 TB');
    expect(formatBytes(0, 'TB')).toBe('0.00 TB');
  });

  it('TiB 按 2^40 换算：4TB 显示为 3.64 TiB', () => {
    const text = formatBytes(DISK_4TB, 'TiB');
    expect(text).toBe('3.64 TiB');
    expect(DISK_4TB / 2 ** 40).toBeCloseTo(3.64, 2);
  });

  it('12TB 在 TiB 口径下约为 10.91 TiB', () => {
    expect(formatBytes(12 * 10 ** 12, 'TiB')).toBe('10.91 TiB');
  });

  it('同一字节数在两种口径下的换算基数不同', () => {
    const bytes = 8 * 10 ** 12;
    expect(formatBytes(bytes, 'TB')).toBe('8.00 TB');
    expect(formatBytes(bytes, 'TiB')).toBe('7.28 TiB');
  });

  it('非有限字节数抛出错误', () => {
    expect(() => formatBytes(Number.NaN, 'TB')).toThrow(/字节数无效/);
  });
});

describe('结果对象字段完整性', () => {
  it('calculateRaid 返回任务约定的全部字段', () => {
    const result = calculateRaid('raid5' as RaidLevel, 4, DISK_4TB);
    expect(Object.keys(result).sort()).toEqual(
      [
        'faultTolerance',
        'level',
        'minDisks',
        'overheadBytes',
        'rawBytes',
        'usableBytes',
        'utilizationPercent',
      ].sort(),
    );
  });
});
