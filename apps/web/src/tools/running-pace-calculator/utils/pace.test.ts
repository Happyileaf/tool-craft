import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatPace,
  paceToSpeed,
  parseTimeToSeconds,
  solveByDurationDistance,
  solveByPaceDistance,
  solveByPaceDuration,
  speedToPace,
  validateDistance,
} from './pace';

describe('parseTimeToSeconds', () => {
  it('支持秒数、分:秒、时:分:秒', () => {
    expect(parseTimeToSeconds('90')).toBe(90);
    expect(parseTimeToSeconds('5:00')).toBe(300);
    expect(parseTimeToSeconds('4:30')).toBe(270);
    expect(parseTimeToSeconds('1:30:58')).toBe(5458);
    expect(parseTimeToSeconds('0:00:10')).toBe(10);
  });

  it('容忍首尾空白', () => {
    expect(parseTimeToSeconds('  5:00 ')).toBe(300);
  });

  it('非法格式返回 null', () => {
    expect(parseTimeToSeconds('')).toBeNull();
    expect(parseTimeToSeconds('abc')).toBeNull();
    expect(parseTimeToSeconds('5:60')).toBeNull();
    expect(parseTimeToSeconds('1:60:00')).toBeNull();
    expect(parseTimeToSeconds('1:2:3:4')).toBeNull();
    expect(parseTimeToSeconds('5:')).toBeNull();
    expect(parseTimeToSeconds('-1:00')).toBeNull();
  });
});

describe('formatDuration / formatPace', () => {
  it('格式化为 mm:ss 或 h:mm:ss', () => {
    expect(formatDuration(300)).toBe('05:00');
    expect(formatDuration(2700)).toBe('45:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(12658.5)).toBe('3:30:59');
  });

  it('配速格式化为 m:ss', () => {
    expect(formatPace(300)).toBe('5:00');
    expect(formatPace(270)).toBe('4:30');
    expect(formatPace(0)).toBe('--:--');
  });
});

describe('配速与速度换算', () => {
  it('5:00/km 对应 12 km/h 且双向一致', () => {
    expect(paceToSpeed(300)).toBeCloseTo(12, 10);
    expect(speedToPace(12)).toBeCloseTo(300, 10);
  });

  it('非法配速 / 速度返回 null', () => {
    expect(paceToSpeed(0)).toBeNull();
    expect(paceToSpeed(-1)).toBeNull();
    expect(speedToPace(0)).toBeNull();
  });
});

describe('validateDistance', () => {
  it('零或负距离报错', () => {
    expect(validateDistance(0)).toBe('距离必须大于 0');
    expect(validateDistance(-5)).toBe('距离必须大于 0');
    expect(validateDistance(Number.NaN)).toBe('距离必须是有效数字');
    expect(validateDistance(10)).toBeNull();
  });
});

describe('solveByPaceDistance', () => {
  it('配速 5:00/km、距离 10km → 50:00、12 km/h', () => {
    const result = solveByPaceDistance(300, 10);
    expect(result.error).toBeNull();
    expect(result.duration).toBeCloseTo(3000, 10);
    expect(result.speed).toBeCloseTo(12, 10);
  });

  it('全马 42.195km、5:00/km → 约 3:30:58', () => {
    const result = solveByPaceDistance(300, 42.195);
    expect(result.error).toBeNull();
    expect(result.duration).toBeCloseTo(12658.5, 6);
    expect(formatDuration(result.duration)).toBe('3:30:59');
  });

  it('半马 21.0975km、5:00/km → 约 1:45:29', () => {
    const result = solveByPaceDistance(300, 21.0975);
    expect(result.error).toBeNull();
    expect(result.duration).toBeCloseTo(6329.25, 6);
    expect(formatDuration(result.duration)).toBe('1:45:29');
  });
});

describe('solveByDurationDistance', () => {
  it('10km 目标 45:00 → 配速 4:30/km、速度 13.333 km/h', () => {
    const result = solveByDurationDistance(2700, 10);
    expect(result.error).toBeNull();
    expect(result.paceSecPerKm).toBeCloseTo(270, 10);
    expect(formatPace(result.paceSecPerKm)).toBe('4:30');
    expect(result.speed).toBeCloseTo(13.3333333333, 8);
  });
});

describe('solveByPaceDuration', () => {
  it('配速 5:00/km、时长 50:00 → 距离 10km', () => {
    const result = solveByPaceDuration(300, 3000);
    expect(result.error).toBeNull();
    expect(result.distance).toBeCloseTo(10, 10);
    expect(result.speed).toBeCloseTo(12, 10);
  });
});
