import { describe, expect, it } from 'vitest';
import {
  calculateSunTimes,
  formatDuration,
  formatLocalTime,
  formatUtcTime,
  hourAngle,
  julianDay,
  parseDateParts,
  solarPosition,
} from './sun';

const beijingSummer = {
  date: '2026-06-21',
  latitude: 39.9042,
  longitude: 116.4074,
  timezoneOffset: 8,
};

const beijingWinter = {
  date: '2026-12-21',
  latitude: 39.9042,
  longitude: 116.4074,
  timezoneOffset: 8,
};

const beijingSummerResult = calculateSunTimes(beijingSummer);
const beijingWinterResult = calculateSunTimes(beijingWinter);

describe('基础天文量', () => {
  it('儒略日与已知值一致', () => {
    expect(julianDay(2026, 1, 1)).toBe(2461041.5);
    expect(julianDay(2000, 1, 1)).toBe(2451544.5);
  });

  it('太阳赤纬与时差处于合理范围', () => {
    const summer = solarPosition(julianDay(2026, 6, 21));
    expect(summer.declination).toBeGreaterThan(23);
    expect(summer.declination).toBeLessThan(23.5);
    const winter = solarPosition(julianDay(2026, 12, 21));
    expect(winter.declination).toBeLessThan(-23);
    expect(winter.declination).toBeGreaterThan(-23.5);
    expect(Math.abs(summer.equationOfTime)).toBeLessThan(17);
  });

  it('时角在极区返回极昼/极夜标记', () => {
    const declination = solarPosition(julianDay(2026, 6, 21)).declination;
    expect(hourAngle(78, declination, 90.833).status).toBe('always-above');
    const winter = solarPosition(julianDay(2026, 12, 21)).declination;
    expect(hourAngle(78, winter, 90.833).status).toBe('always-below');
  });
});

describe('calculateSunTimes', () => {
  it('北京夏至日出日落接近权威值', () => {
    const sunrise = formatLocalTime(beijingSummerResult.sunrise.utcMinutes as number, 8);
    const sunset = formatLocalTime(beijingSummerResult.sunset.utcMinutes as number, 8);
    expect(sunrise).toBe('04:46');
    expect(sunset).toBe('19:46');
    expect(beijingSummerResult.dayLengthMinutes).toBeCloseTo(900, 0);
  });

  it('北京冬至昼短夜长', () => {
    const sunrise = formatLocalTime(beijingWinterResult.sunrise.utcMinutes as number, 8);
    const sunset = formatLocalTime(beijingWinterResult.sunset.utcMinutes as number, 8);
    expect(sunrise).toBe('07:32');
    expect(sunset).toBe('16:52');
    expect(beijingWinterResult.dayLengthMinutes).toBeLessThan(600);
  });

  it('赤道春分昼长接近 12 小时', () => {
    const result = calculateSunTimes({
      date: '2026-03-20',
      latitude: 0,
      longitude: 0,
      timezoneOffset: 0,
    });
    expect(result.dayLengthMinutes).toBeGreaterThan(715);
    expect(result.dayLengthMinutes).toBeLessThan(735);
    expect(formatLocalTime(result.sunrise.utcMinutes as number, 0)).toMatch(
      /^06:(0[0-9]|1[0-9])$/,
    );
  });

  it('极区夏冬分别返回极昼与极夜', () => {
    const summer = calculateSunTimes({
      date: '2026-06-21',
      latitude: 78,
      longitude: 15,
      timezoneOffset: 1,
    });
    expect(summer.sunrise.status).toBe('always-above');
    expect(summer.dayLengthMinutes).toBe(1440);
    const winter = calculateSunTimes({
      date: '2026-12-21',
      latitude: 78,
      longitude: 15,
      timezoneOffset: 1,
    });
    expect(winter.sunrise.status).toBe('always-below');
    expect(winter.dayLengthMinutes).toBe(0);
  });

  it('晨昏时刻按固定天顶角排列', () => {
    const result = beijingSummerResult;
    const civilDawn = result.civilDawn.utcMinutes as number;
    const nauticalDawn = result.nauticalDawn.utcMinutes as number;
    const astronomicalDawn = result.astronomicalDawn.utcMinutes as number;
    expect(civilDawn).toBeGreaterThan(nauticalDawn);
    expect(nauticalDawn).toBeGreaterThan(astronomicalDawn);
    expect(astronomicalDawn).toBeLessThan(civilDawn);
  });

  it('校验日期、纬度、经度与时区', () => {
    expect(() => calculateSunTimes({ ...beijingSummer, date: '2026-02-30' })).toThrow(/日期/);
    expect(() => calculateSunTimes({ ...beijingSummer, latitude: 90 })).toThrow(/纬度/);
    expect(() => calculateSunTimes({ ...beijingSummer, longitude: 181 })).toThrow(/经度/);
    expect(() => calculateSunTimes({ ...beijingSummer, timezoneOffset: 15 })).toThrow(/时区/);
  });
});

describe('格式化函数', () => {
  it('格式化 UTC 与本地时刻并处理跨日回绕', () => {
    expect(formatUtcTime(0)).toBe('00:00');
    expect(formatLocalTime(0, 8)).toBe('08:00');
    expect(formatLocalTime(1400, 8)).toBe('07:20');
    expect(formatLocalTime(-30, 8)).toBe('07:30');
  });

  it('格式化时长', () => {
    expect(formatDuration(901)).toBe('15 小时 1 分');
    expect(formatDuration(59.6)).toBe('1 小时 0 分');
  });

  it('parseDateParts 拒绝非法格式', () => {
    expect(() => parseDateParts('2026/06/21')).toThrow(/YYYY-MM-DD/);
  });
});
