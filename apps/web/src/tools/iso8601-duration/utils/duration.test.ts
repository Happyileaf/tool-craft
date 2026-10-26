import { describe, expect, it } from 'vitest';
import {
  describeSeconds,
  durationToSeconds,
  formatDuration,
  normalizeSeconds,
  parseDuration,
} from './duration';

describe('parseDuration', () => {
  it('解析完整的年月日时分秒', () => {
    const result = parseDuration('P1Y2M3DT4H5M6S');
    expect(result.error).toBeNull();
    expect(result.value).toMatchObject({
      years: 1,
      months: 2,
      weeks: 0,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      sign: 1,
    });
  });

  it('解析只有时间部分的时长', () => {
    expect(parseDuration('PT90M').value).toMatchObject({
      hours: 0,
      minutes: 90,
      seconds: 0,
    });
    expect(parseDuration('PT1H30M').value).toMatchObject({ hours: 1, minutes: 30 });
  });

  it('解析周表示', () => {
    expect(parseDuration('P2W').value).toMatchObject({ weeks: 2 });
    expect(parseDuration('P0.5W').value).toMatchObject({ weeks: 0.5 });
  });

  it('解析负号与正号前缀', () => {
    expect(parseDuration('-P1D').value?.sign).toBe(-1);
    expect(parseDuration('+PT5S').value?.sign).toBe(1);
  });

  it('支持逗号或点的小数分量', () => {
    expect(parseDuration('PT0.5H').value?.hours).toBe(0.5);
    expect(parseDuration('PT1,5H').value?.hours).toBe(1.5);
  });

  it('小写 t 也可作为时间分隔符', () => {
    expect(parseDuration('Pt10s').error).toBeNull();
  });

  it('拒绝缺少 P 前缀', () => {
    expect(parseDuration('1Y').error).toContain('P');
  });

  it('拒绝空壳 P 与无分量', () => {
    expect(parseDuration('P').error).toBeTruthy();
    expect(parseDuration('PT').error).toBeTruthy();
  });

  it('拒绝重复分量', () => {
    expect(parseDuration('P1Y2Y').error).toContain('重复');
    expect(parseDuration('PT1M2M').error).toContain('重复');
  });

  it('拒绝周与其他分量混用', () => {
    expect(parseDuration('P1W1D').error).toContain('周');
  });

  it('拒绝小数分量后还有其他分量', () => {
    expect(parseDuration('PT0.5H30M').error).toContain('小数');
  });

  it('拒绝日期部分写时间单位、时间部分写日期单位', () => {
    expect(parseDuration('P1H').error).toBeTruthy();
    expect(parseDuration('PT1D').error).toBeTruthy();
  });

  it('拒绝无法识别的字符', () => {
    expect(parseDuration('P1X').error).toBeTruthy();
    expect(parseDuration('abc').error).toBeTruthy();
  });

  it('拒绝 T 出现两次', () => {
    expect(parseDuration('PT1HT2M').error).toBeTruthy();
  });
});

describe('durationToSeconds', () => {
  it('按 365 天/年、30 天/月、7 天/周折算总秒数', () => {
    const parsed = parseDuration('P1Y2M3DT4H5M6S').value;
    expect(parsed).not.toBeNull();
    const expected =
      (365 + 60 + 3) * 86400 + 4 * 3600 + 5 * 60 + 6;
    expect(durationToSeconds(parsed!)).toBe(expected);
  });

  it('PT90M 等于 5400 秒', () => {
    expect(durationToSeconds(parseDuration('PT90M').value!)).toBe(5400);
  });

  it('P2W 等于 14 天秒数', () => {
    expect(durationToSeconds(parseDuration('P2W').value!)).toBe(14 * 86400);
  });

  it('负时长返回负秒数', () => {
    expect(durationToSeconds(parseDuration('-PT30S').value!)).toBe(-30);
  });

  it('小数秒保留精度', () => {
    expect(durationToSeconds(parseDuration('PT0.25S').value!)).toBe(0.25);
  });
});

describe('normalizeSeconds', () => {
  it('把秒数进位为天 / 时 / 分 / 秒', () => {
    expect(normalizeSeconds(90540)).toMatchObject({
      days: 1,
      hours: 1,
      minutes: 9,
      seconds: 0,
      sign: 1,
    });
  });

  it('负数保留符号且分量非负', () => {
    const result = normalizeSeconds(-3661);
    expect(result.sign).toBe(-1);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(1);
  });

  it('零秒全部为 0 且符号为正', () => {
    expect(normalizeSeconds(0)).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      sign: 1,
    });
  });

  it('毫秒精度保留在秒字段', () => {
    expect(normalizeSeconds(1.5).seconds).toBe(1.5);
  });
});

describe('formatDuration', () => {
  it('格式化完整分量', () => {
    expect(
      formatDuration({
        years: 1,
        months: 2,
        weeks: 0,
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
        sign: 1,
      }),
    ).toBe('P1Y2M3DT4H5M6S');
  });

  it('只有时间部分时包含 T', () => {
    expect(
      formatDuration({ ...normalizeSeconds(5400) }),
    ).toBe('PT1H30M');
  });

  it('零时长统一为 PT0S', () => {
    expect(formatDuration(normalizeSeconds(0))).toBe('PT0S');
  });

  it('负秒数归一化后带负号', () => {
    expect(formatDuration(normalizeSeconds(-90))).toBe('-PT1M30S');
  });

  it('天与秒同时存在时保留 T 与 0 分省略', () => {
    expect(formatDuration(normalizeSeconds(86401))).toBe('P1DT1S');
  });

  it('小数秒最多 3 位', () => {
    expect(formatDuration(normalizeSeconds(0.1234))).toBe('PT0.123S');
  });

  it('normalizeSeconds → formatDuration 往返并可重新解析', () => {
    const formatted = formatDuration(normalizeSeconds(100000));
    expect(formatted).toBe('P1DT3H46M40S');
    expect(parseDuration(formatted).error).toBeNull();
  });
});

describe('describeSeconds', () => {
  it('给出中文可读描述', () => {
    expect(describeSeconds(90540)).toBe('1 天 1 小时 9 分');
    expect(describeSeconds(65)).toBe('1 分 5 秒');
  });

  it('零与负数描述', () => {
    expect(describeSeconds(0)).toBe('0 秒');
    expect(describeSeconds(-3600)).toBe('负 1 小时');
  });
});
