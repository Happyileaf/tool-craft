import { describe, expect, it } from 'vitest';
import {
  doubleDeclining,
  round2,
  straightLine,
  sumOfYearsDigits,
  toCsv,
  unitsOfProduction,
  validateAssetInput,
  type AssetInput,
} from './depreciation';

/** 任务给定的标准入参：原值 10 万、净残值 5 千、使用 5 年 */
const BASE_INPUT: AssetInput = { cost: 100000, salvage: 5000, usefulLife: 5 };
/** 标准入参下的应计折旧额 */
const DEPRECIABLE_BASE = 95000;

describe('round2', () => {
  it('rounds half up to 2 decimals and absorbs floating point tails', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(19000)).toBe(19000);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('straightLine', () => {
  it('matches the fixed vector: 19000 per year, 95000 accumulated, 5000 book value', () => {
    const rows = straightLine(BASE_INPUT);
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.depreciation)).toEqual([19000, 19000, 19000, 19000, 19000]);
    expect(rows.map((row) => row.accumulatedDepreciation)).toEqual([
      19000, 38000, 57000, 76000, 95000,
    ]);
    expect(rows.map((row) => row.bookValue)).toEqual([81000, 62000, 43000, 24000, 5000]);
  });

  it('reports a constant annual rate of 1/life', () => {
    const rows = straightLine(BASE_INPUT);
    rows.forEach((row) => {
      expect(row.rate).toBe(0.2);
    });
  });

  it('clamps the final year so book value equals salvage despite rounding', () => {
    // 1000 / 3 = 333.33…，前两年累计 666.66，末年钳制到应计折旧额 1000
    const rows = straightLine({ cost: 1000, salvage: 0, usefulLife: 3 });
    expect(rows.map((row) => row.depreciation)).toEqual([333.33, 333.33, 333.34]);
    expect(rows[2]?.accumulatedDepreciation).toBe(1000);
    expect(rows[2]?.bookValue).toBe(0);
  });
});

describe('doubleDeclining', () => {
  it('matches the fixed vector 40000 / 24000 / 14400 then straight-line 8300 / 8300', () => {
    const rows = doubleDeclining(BASE_INPUT);
    expect(rows.map((row) => row.depreciation)).toEqual([40000, 24000, 14400, 8300, 8300]);
    expect(rows.map((row) => row.accumulatedDepreciation)).toEqual([
      40000, 64000, 78400, 86700, 95000,
    ]);
    expect(rows.map((row) => row.bookValue)).toEqual([60000, 36000, 21600, 13300, 5000]);
  });

  it('uses rate 0.4 in declining years and the switched straight-line rate afterwards', () => {
    const rows = doubleDeclining(BASE_INPUT);
    expect(rows[0]?.rate).toBe(0.4);
    expect(rows[1]?.rate).toBe(0.4);
    expect(rows[2]?.rate).toBe(0.4);
    // 倒数第二年按年初账面净值 21600 摊销 8300
    expect(rows[3]?.rate).toBeCloseTo(8300 / 21600, 6);
    expect(rows[4]?.rate).toBeCloseTo(8300 / 21600, 6);
  });

  it('never depreciates below salvage and switches to straight line in the last two years', () => {
    // 残值 3000 高于第二年末账面净值的自然递减结果，折旧被钳制，最后两年为 0
    const rows = doubleDeclining({ cost: 10000, salvage: 3000, usefulLife: 4 });
    expect(rows.map((row) => row.depreciation)).toEqual([5000, 2000, 0, 0]);
    rows.forEach((row) => {
      expect(row.bookValue).toBeGreaterThanOrEqual(3000);
    });
    expect(rows[3]?.bookValue).toBe(3000);
  });

  it('handles life=1 with a single full-base row', () => {
    const rows = doubleDeclining({ cost: 100000, salvage: 5000, usefulLife: 1 });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.depreciation).toBe(DEPRECIABLE_BASE);
    expect(rows[0]?.accumulatedDepreciation).toBe(DEPRECIABLE_BASE);
    expect(rows[0]?.bookValue).toBe(5000);
    expect(rows[0]?.rate).toBe(1);
  });
});

describe('sumOfYearsDigits', () => {
  it('matches the fixed vector: first year 31666.67 and last year 6333.33', () => {
    const rows = sumOfYearsDigits(BASE_INPUT);
    expect(rows[0]?.depreciation).toBe(31666.67);
    expect(rows[1]?.depreciation).toBe(25333.33);
    expect(rows[2]?.depreciation).toBe(19000);
    expect(rows[3]?.depreciation).toBe(12666.67);
    expect(rows[4]?.depreciation).toBe(6333.33);
  });

  it('accumulates exactly to the depreciable base over all years', () => {
    const rows = sumOfYearsDigits(BASE_INPUT);
    expect(rows[4]?.accumulatedDepreciation).toBe(DEPRECIABLE_BASE);
    expect(rows[4]?.bookValue).toBe(5000);
  });

  it('uses declining fractions of the sum of years as rates', () => {
    const rows = sumOfYearsDigits(BASE_INPUT);
    expect(rows.map((row) => row.rate)).toEqual([
      5 / 15,
      4 / 15,
      3 / 15,
      2 / 15,
      1 / 15,
    ]);
  });
});

describe('unitsOfProduction', () => {
  it('matches the fixed vector with unit rate 1.0', () => {
    const rows = unitsOfProduction(BASE_INPUT, 95000, [20000, 30000, 25000, 20000]);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.depreciation)).toEqual([20000, 30000, 25000, 20000]);
    expect(rows.map((row) => row.accumulatedDepreciation)).toEqual([
      20000, 50000, 75000, 95000,
    ]);
    expect(rows[3]?.bookValue).toBe(5000);
  });

  it('does not provide an annual rate field', () => {
    const rows = unitsOfProduction(BASE_INPUT, 95000, [20000, 30000, 25000, 20000]);
    rows.forEach((row) => {
      expect(row.rate).toBeUndefined();
    });
  });

  it('throws when yearly units exceed total units', () => {
    expect(() => unitsOfProduction(BASE_INPUT, 100, [60, 50])).toThrow('总工作量');
  });

  it('supports a single workload row that depreciates the full base', () => {
    const rows = unitsOfProduction(BASE_INPUT, 95000, [95000]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.depreciation).toBe(DEPRECIABLE_BASE);
    expect(rows[0]?.bookValue).toBe(5000);
  });
});

describe('life=1 boundary across all methods', () => {
  it('produces one row whose accumulated depreciation equals cost minus salvage', () => {
    const input: AssetInput = { cost: 8000, salvage: 800, usefulLife: 1 };
    const expectedBase = 7200;
    const sl = straightLine(input);
    const ddb = doubleDeclining(input);
    const syd = sumOfYearsDigits(input);
    const uop = unitsOfProduction(input, 7200, [7200]);
    [sl, ddb, syd, uop].forEach((rows) => {
      expect(rows).toHaveLength(1);
      expect(rows[0]?.accumulatedDepreciation).toBe(expectedBase);
      expect(rows[0]?.bookValue).toBe(800);
    });
  });
});

describe('validateAssetInput', () => {
  it('accepts the standard valid input', () => {
    expect(validateAssetInput(BASE_INPUT).valid).toBe(true);
    expect(validateAssetInput(BASE_INPUT).errors).toEqual([]);
  });

  it('rejects salvage greater than or equal to cost', () => {
    const result = validateAssetInput({ cost: 1000, salvage: 1000, usefulLife: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors.join('')).toContain('净残值');
  });

  it('rejects life outside 1-50 and non-integer life', () => {
    expect(validateAssetInput({ ...BASE_INPUT, usefulLife: 0 }).valid).toBe(false);
    expect(validateAssetInput({ ...BASE_INPUT, usefulLife: 51 }).valid).toBe(false);
    const nonInteger = validateAssetInput({ ...BASE_INPUT, usefulLife: 2.5 });
    expect(nonInteger.valid).toBe(false);
    expect(nonInteger.errors.join('')).toContain('整数');
  });

  it('rejects negative, zero and NaN cost', () => {
    expect(validateAssetInput({ ...BASE_INPUT, cost: -1 }).valid).toBe(false);
    expect(validateAssetInput({ ...BASE_INPUT, cost: 0 }).valid).toBe(false);
    expect(validateAssetInput({ ...BASE_INPUT, cost: Number.NaN }).valid).toBe(false);
  });

  it('rejects negative salvage and NaN salvage', () => {
    expect(validateAssetInput({ ...BASE_INPUT, salvage: -100 }).valid).toBe(false);
    expect(validateAssetInput({ ...BASE_INPUT, salvage: Number.NaN }).valid).toBe(false);
  });

  it('accepts valid production options', () => {
    const result = validateAssetInput(BASE_INPUT, {
      totalUnits: 95000,
      yearlyUnits: [20000, 30000, 25000, 20000],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects empty yearly units, non-positive total and over-limit workload', () => {
    const empty = validateAssetInput(BASE_INPUT, { totalUnits: 95000, yearlyUnits: [] });
    expect(empty.valid).toBe(false);
    expect(empty.errors.join('')).toContain('年度工作量');

    const badTotal = validateAssetInput(BASE_INPUT, { totalUnits: 0, yearlyUnits: [100] });
    expect(badTotal.valid).toBe(false);
    expect(badTotal.errors.join('')).toContain('总工作量');

    const overLimit = validateAssetInput(BASE_INPUT, {
      totalUnits: 100,
      yearlyUnits: [60, 50],
    });
    expect(overLimit.valid).toBe(false);
    expect(overLimit.errors.join('')).toContain('超过');

    const negativeUnit = validateAssetInput(BASE_INPUT, {
      totalUnits: 100,
      yearlyUnits: [-1],
    });
    expect(negativeUnit.valid).toBe(false);
  });
});

describe('toCsv', () => {
  it('renders the Chinese header and one data line per row with CRLF endings', () => {
    const rows = straightLine(BASE_INPUT);
    const csv = toCsv(rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('年份,年折旧额,累计折旧额,年末账面价值,年折旧率');
    expect(lines).toHaveLength(rows.length + 1);
    expect(csv).toContain('\r\n');
  });

  it('formats amounts to 2 decimals and rates as percentage strings', () => {
    const rows = straightLine(BASE_INPUT);
    const csv = toCsv(rows);
    const firstLine = csv.split('\r\n')[1];
    expect(firstLine).toBe('1,19000.00,19000.00,81000.00,20.00%');
    const sydLine = toCsv(sumOfYearsDigits(BASE_INPUT)).split('\r\n')[1];
    expect(sydLine).toBe('1,31666.67,31666.67,68333.33,33.33%');
  });

  it('leaves the rate field empty for workload rows', () => {
    const rows = unitsOfProduction(BASE_INPUT, 95000, [20000, 30000, 25000, 20000]);
    const lines = toCsv(rows).split('\r\n');
    expect(lines).toHaveLength(5);
    // 工作量法不提供年折旧率，每行末字段留空；中间行不触发末年钳制
    expect(lines[1]).toBe('1,20000.00,20000.00,80000.00,');
    expect(lines[2]).toBe('2,30000.00,50000.00,50000.00,');
    expect(lines[3]).toBe('3,25000.00,75000.00,25000.00,');
  });
});
