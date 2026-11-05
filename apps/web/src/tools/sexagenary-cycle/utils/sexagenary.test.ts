import { describe, expect, it } from 'vitest';
import {
  BRANCHES,
  STEMS,
  buildCycleTable,
  cycleIndexToGanzhi,
  findYears,
  ganzhiToYearsBatch,
  yearToGanzhi,
  yearsToGanzhiBatch,
} from './sexagenary';

describe('yearToGanzhi 固定验收向量', () => {
  it('1984 为甲子年（六十甲子第 1 位，生肖鼠，五行木）', () => {
    const info = yearToGanzhi(1984);
    expect(info.ganzhi).toBe('甲子');
    expect(info.stem).toBe('甲');
    expect(info.branch).toBe('子');
    expect(info.cycleIndex).toBe(1);
    expect(info.zodiac).toBe('鼠');
    expect(info.element).toBe('木');
    expect(info.polarity).toBe('阳');
  });

  it('2024 为甲辰年（六十甲子第 41 位，生肖龙）', () => {
    const info = yearToGanzhi(2024);
    expect(info.ganzhi).toBe('甲辰');
    expect(info.cycleIndex).toBe(41);
    expect(info.zodiac).toBe('龙');
    expect(info.element).toBe('木');
  });

  it('公元 4 年为甲子年（纪年锚点）', () => {
    expect(yearToGanzhi(4).ganzhi).toBe('甲子');
    expect(yearToGanzhi(4).cycleIndex).toBe(1);
  });

  it('天干按年份尾数循环：2023 癸卯、2025 乙巳', () => {
    expect(yearToGanzhi(2023).ganzhi).toBe('癸卯');
    expect(yearToGanzhi(2025).ganzhi).toBe('乙巳');
  });

  it('每 60 年一个完整甲子循环', () => {
    const base = yearToGanzhi(1984);
    const later = yearToGanzhi(2044);
    expect(later.ganzhi).toBe(base.ganzhi);
    expect(later.cycleIndex).toBe(base.cycleIndex);
    expect(later.zodiac).toBe(base.zodiac);
  });

  it('公元前年份取模正确：前 72 年（-72）可计算且回推一致', () => {
    const info = yearToGanzhi(-72);
    expect(STEMS).toContain(info.stem as never);
    expect(BRANCHES).toContain(info.branch as never);
    expect(info.cycleIndex).toBeGreaterThanOrEqual(1);
    expect(info.cycleIndex).toBeLessThanOrEqual(60);
    // 与前 72 + 60 = 前 12 年同干支
    expect(yearToGanzhi(-12).ganzhi).toBe(info.ganzhi);
  });
});

describe('yearsToGanzhiBatch 批量与错误处理', () => {
  it('每行独立解析，返回干支组合', () => {
    const results = yearsToGanzhiBatch('1984\n2024\n2023');
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.output)).toEqual(['甲子', '甲辰', '癸卯']);
    expect(results.every((r) => r.valid)).toBe(true);
  });

  it('支持「前 72」「公元前 72」形式', () => {
    const results = yearsToGanzhiBatch('前 72\n公元前 221');
    expect(results.every((r) => r.valid)).toBe(true);
    expect(results[0]!.info!.year).toBe(-72);
    expect(results[1]!.info!.year).toBe(-221);
  });

  it('拒绝非整数与公元 0 年', () => {
    const results = yearsToGanzhiBatch('abc\n0\n1984.5');
    expect(results.every((r) => !r.valid)).toBe(true);
    expect(results[1]!.error).toContain('公元 0 年');
  });

  it('空行被跳过', () => {
    expect(yearsToGanzhiBatch('1984\n\n  \n2024')).toHaveLength(2);
  });
});

describe('cycleIndexToGanzhi 与六十甲子表', () => {
  it('序号 1 为甲子、序号 41 为甲辰、序号 60 为癸亥', () => {
    expect(cycleIndexToGanzhi(1).ganzhi).toBe('甲子');
    expect(cycleIndexToGanzhi(41).ganzhi).toBe('甲辰');
    expect(cycleIndexToGanzhi(60).ganzhi).toBe('癸亥');
  });

  it('完整循环表含 60 项且序号连续、干支组合唯一', () => {
    const table = buildCycleTable();
    expect(table).toHaveLength(60);
    expect(table.map((item) => item.cycleIndex)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    expect(new Set(table.map((item) => item.ganzhi)).size).toBe(60);
    // 表内每项天干地支阴阳一致
    expect(
      table.every((item) => STEMS.indexOf(item.stem as never) % 2 === BRANCHES.indexOf(item.branch as never) % 2),
    ).toBe(true);
  });
});

describe('findYears 反向推算', () => {
  it('1900..2100 区间内甲子年包含 1984 与 2044', () => {
    const years = findYears(0, 0, 1900, 2100);
    expect(years).toContain(1984);
    expect(years).toContain(2044);
    // 1924、1984、2044；下一个 2104 超出区间上界
    expect(years).toEqual([1924, 1984, 2044]);
  });

  it('甲辰年在 2000..2030 内仅 2024', () => {
    const stemIndex = STEMS.indexOf('甲');
    const branchIndex = BRANCHES.indexOf('辰');
    expect(findYears(stemIndex, branchIndex, 2000, 2030)).toEqual([2024]);
  });

  it('起止反向时返回空数组', () => {
    expect(findYears(0, 0, 2030, 2000)).toEqual([]);
  });
});

describe('ganzhiToYearsBatch 批量反向', () => {
  it('序号与干支组合两种输入等价', () => {
    const byIndex = ganzhiToYearsBatch('1', 1900, 2100);
    const byCombo = ganzhiToYearsBatch('甲子', 1900, 2100);
    expect(byIndex[0]!.years).toEqual(byCombo[0]!.years);
    expect(byIndex[0]!.years).toContain(1984);
  });

  it('非法天干/地支与越界序号报错', () => {
    const results = ganzhiToYearsBatch('甲猫\n99\nXYZ', 1900, 2100);
    expect(results[0]!.valid).toBe(false);
    expect(results[0]!.error).toContain('地支');
    expect(results[1]!.valid).toBe(false);
    expect(results[1]!.error).toContain('1..60');
    expect(results[2]!.valid).toBe(false);
  });

  it('天干地支阴阳不一致的组合报非法组合错误', () => {
    const result = ganzhiToYearsBatch('甲丑', 1900, 2100);
    expect(result[0]!.valid).toBe(false);
    expect(result[0]!.error).toContain('不是合法干支组合');
  });

  it('区间内无匹配年时给出提示但不抛错', () => {
    const result = ganzhiToYearsBatch('甲子', 1985, 2043);
    expect(result[0]!.valid).toBe(true);
    expect(result[0]!.years).toEqual([]);
    expect(result[0]!.error).toContain('无');
  });
});
