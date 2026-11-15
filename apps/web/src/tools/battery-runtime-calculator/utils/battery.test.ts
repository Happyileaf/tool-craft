import { describe, expect, it } from 'vitest';
import {
  COMPARISON_RATIOS,
  calculateRuntime,
  capacityAh,
  capacityWh,
  formatRuntime,
  packSpec,
  runtimeTable,
} from './battery';

const baseSpec = { capacity: 10, unit: 'Ah' as const, voltage: 12 };

describe('容量换算', () => {
  it('10Ah / 12V 对应 120Wh 与 10Ah', () => {
    expect(capacityWh(baseSpec)).toBe(120);
    expect(capacityAh(baseSpec)).toBe(10);
  });

  it('10000mAh / 12V 对应 120Wh 与 10Ah', () => {
    expect(capacityWh({ capacity: 10000, unit: 'mAh', voltage: 12 })).toBe(120);
    expect(capacityAh({ capacity: 10000, unit: 'mAh', voltage: 12 })).toBe(10);
  });

  it('120Wh / 12V 对应 10Ah', () => {
    expect(capacityAh({ capacity: 120, unit: 'Wh', voltage: 12 })).toBe(10);
  });

  it('非法容量或电压抛错', () => {
    expect(() => capacityWh({ capacity: 0, unit: 'Ah', voltage: 12 })).toThrow('电池容量必须大于 0');
    expect(() => capacityAh({ capacity: 10, unit: 'Ah', voltage: 0 })).toThrow('标称电压必须大于 0');
  });
});

describe('calculateRuntime', () => {
  it('10Ah、5A、100% 放电与效率时续航 2 小时', () => {
    const result = calculateRuntime(baseSpec, {
      loadType: 'current',
      currentA: 5,
      efficiencyPct: 100,
      depthOfDischargePct: 100,
    });
    expect(result.runtimeHours).toBeCloseTo(2, 6);
    expect(result.loadPowerW).toBeCloseTo(60, 6);
  });

  it('放电深度 80% 时续航 1.6 小时', () => {
    const result = calculateRuntime(baseSpec, {
      loadType: 'current',
      currentA: 5,
      efficiencyPct: 100,
      depthOfDischargePct: 80,
    });
    expect(result.runtimeHours).toBeCloseTo(1.6, 6);
  });

  it('转换效率 90% 时续航 1.8 小时', () => {
    const result = calculateRuntime(baseSpec, {
      loadType: 'current',
      currentA: 5,
      efficiencyPct: 90,
      depthOfDischargePct: 100,
    });
    expect(result.runtimeHours).toBeCloseTo(1.8, 6);
  });

  it('功率负载 24W 时续航 5 小时', () => {
    const result = calculateRuntime(baseSpec, {
      loadType: 'power',
      powerW: 24,
      efficiencyPct: 100,
      depthOfDischargePct: 100,
    });
    expect(result.runtimeHours).toBeCloseTo(5, 6);
    expect(result.loadCurrentA).toBeCloseTo(2, 6);
  });

  it('Peukert 指数 1.2、基准 10A、负载 5A 时续航约 2.30 小时', () => {
    const result = calculateRuntime(baseSpec, {
      loadType: 'current',
      currentA: 5,
      efficiencyPct: 100,
      depthOfDischargePct: 100,
      peukertExponent: 1.2,
      ratedCurrentA: 10,
    });
    expect(result.peukertApplied).toBe(true);
    expect(result.runtimeHours).toBeCloseTo(2 * 2 ** 0.2, 4);
  });

  it('非法负载、效率、放电深度与 Peukert 指数抛错', () => {
    expect(() =>
      calculateRuntime(baseSpec, {
        loadType: 'current',
        currentA: 0,
        efficiencyPct: 100,
        depthOfDischargePct: 100,
      }),
    ).toThrow('负载电流必须大于 0');
    expect(() =>
      calculateRuntime(baseSpec, {
        loadType: 'power',
        powerW: -1,
        efficiencyPct: 100,
        depthOfDischargePct: 100,
      }),
    ).toThrow('负载功率必须大于 0');
    expect(() =>
      calculateRuntime(baseSpec, {
        loadType: 'current',
        currentA: 1,
        efficiencyPct: 101,
        depthOfDischargePct: 100,
      }),
    ).toThrow('转换效率必须在 0 到 100 之间');
    expect(() =>
      calculateRuntime(baseSpec, {
        loadType: 'current',
        currentA: 1,
        efficiencyPct: 100,
        depthOfDischargePct: 0,
      }),
    ).toThrow('放电深度必须在 0 到 100 之间');
    expect(() =>
      calculateRuntime(baseSpec, {
        loadType: 'current',
        currentA: 1,
        efficiencyPct: 100,
        depthOfDischargePct: 100,
        peukertExponent: 0.9,
      }),
    ).toThrow('Peukert 指数必须为不小于 1 的数值');
  });
});

describe('packSpec 串并联电池组', () => {
  it('3S2P、单节 2500mAh / 3.7V 对应 11.1V 与 5Ah', () => {
    const pack = packSpec({ cellCapacityMah: 2500, cellVoltage: 3.7, series: 3, parallel: 2 });
    expect(pack.voltage).toBeCloseTo(11.1, 6);
    expect(pack.capacity).toBe(5000);
    expect(capacityAh(pack)).toBeCloseTo(5, 6);
    expect(capacityWh(pack)).toBeCloseTo(55.5, 4);
  });

  it('节数非法时抛错', () => {
    expect(() => packSpec({ cellCapacityMah: 2500, cellVoltage: 3.7, series: 0, parallel: 1 })).toThrow(
      '串联节数必须为不小于 1 的整数',
    );
    expect(() => packSpec({ cellCapacityMah: 2500, cellVoltage: 3.7, series: 3, parallel: 1.5 })).toThrow(
      '并联组数必须为不小于 1 的整数',
    );
  });
});

describe('runtimeTable 与 formatRuntime', () => {
  it('对比表覆盖全部倍率且电流递增、续航递减', () => {
    const options = {
      loadType: 'current' as const,
      efficiencyPct: 100,
      depthOfDischargePct: 100,
    };
    const rows = runtimeTable(baseSpec, options);
    expect(rows).toHaveLength(COMPARISON_RATIOS.length);
    let previous: (typeof rows)[number] | null = null;
    for (const row of rows) {
      if (previous !== null) {
        expect(row.currentA).toBeGreaterThan(previous.currentA);
        expect(row.runtimeHours).toBeLessThan(previous.runtimeHours);
      }
      previous = row;
    }
  });

  it('续航小时格式化为小时与分钟', () => {
    expect(formatRuntime(2.5)).toBe('2 小时 30 分');
    expect(formatRuntime(0.5)).toBe('30 分钟');
    expect(formatRuntime(0)).toBe('—');
  });
});
