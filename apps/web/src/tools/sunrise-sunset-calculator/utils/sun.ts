/** 日出日落与晨昏时刻计算的核心纯函数（NOAA 太阳位置近似算法） */

export interface SunTimesInput {
  /** YYYY-MM-DD */
  date: string;
  /** 纬度，-89.99–89.99 */
  latitude: number;
  /** 经度，-180–180，东经为正 */
  longitude: number;
  /** 时区偏移，单位小时，东侧为正，如北京为 8 */
  timezoneOffset: number;
}

export type SolarEventStatus = 'ok' | 'always-above' | 'always-below';

export interface SolarEvent {
  /** UTC 当日分钟数，正常事件为数值 */
  utcMinutes: number | null;
  status: SolarEventStatus;
}

export interface SunTimesResult {
  /** 太阳正午 */
  solarNoon: SolarEvent;
  sunrise: SolarEvent;
  sunset: SolarEvent;
  civilDawn: SolarEvent;
  civilDusk: SolarEvent;
  nauticalDawn: SolarEvent;
  nauticalDusk: SolarEvent;
  astronomicalDawn: SolarEvent;
  astronomicalDusk: SolarEvent;
  /** 昼长（分钟），极昼 1440，极夜 0 */
  dayLengthMinutes: number;
  /** 太阳赤纬（度） */
  declination: number;
  /** 时差（分钟） */
  equationOfTime: number;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** 计算 0h UT 的儒略日 */
export function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

/** 解析 YYYY-MM-DD 并校验真实日期 */
export function parseDateParts(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) {
    throw new Error('日期需为 YYYY-MM-DD 格式');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error('日期不存在，请检查年月日');
  }
  return { year, month, day };
}

interface SolarPosition {
  declination: number;
  equationOfTime: number;
}

/** 计算给定儒略日对应的太阳赤纬与时差 */
export function solarPosition(jd: number): SolarPosition {
  const t = (jd - 2451545) / 36525;

  const meanLongitude = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const m = meanAnomaly * DEG;
  const equationOfCenter =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;

  const trueLongitude = meanLongitude + equationOfCenter;
  const apparentLongitude =
    trueLongitude - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * DEG);

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos((125.04 - 1934.136 * t) * DEG);

  const declination =
    Math.asin(Math.sin(obliquity * DEG) * Math.sin(apparentLongitude * DEG)) * RAD;

  const y = Math.tan((obliquity / 2) * DEG) ** 2;
  const l0 = meanLongitude * DEG;
  const equationOfTime =
    4 *
    RAD *
    (y * Math.sin(2 * l0) -
      2 * eccentricity * Math.sin(m) +
      4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
      0.5 * y * y * Math.sin(4 * l0) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * m));

  return { declination, equationOfTime };
}

/** 根据纬度、赤纬与天顶角求太阳时角（度）；超出范围说明极昼或极夜 */
export function hourAngle(
  latitude: number,
  declination: number,
  zenith: number,
): { status: 'ok'; angle: number } | { status: 'always-above' | 'always-below' } {
  const lat = latitude * DEG;
  const dec = declination * DEG;
  const cosHa =
    (Math.cos(zenith * DEG) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  if (cosHa < -1) {
    return { status: 'always-above' };
  }
  if (cosHa > 1) {
    return { status: 'always-below' };
  }
  return { status: 'ok', angle: Math.acos(cosHa) * RAD };
}

function buildEvent(noonMinutes: number, angle: number, sign: -1 | 1): SolarEvent {
  return { utcMinutes: noonMinutes + sign * angle * 4, status: 'ok' };
}

function buildTwilight(
  noonMinutes: number,
  result: { status: 'ok'; angle: number } | { status: 'always-above' | 'always-below' },
  sign: -1 | 1,
): SolarEvent {
  if (result.status !== 'ok') {
    return { utcMinutes: null, status: result.status };
  }
  return buildEvent(noonMinutes, result.angle, sign);
}

/**
 * 计算某日某地的太阳正午、日出日落与三档晨昏时刻
 */
export function calculateSunTimes(input: SunTimesInput): SunTimesResult {
  if (input.latitude < -89.99 || input.latitude > 89.99) {
    throw new Error('纬度需在 -89.99–89.99 之间');
  }
  if (input.longitude < -180 || input.longitude > 180) {
    throw new Error('经度需在 -180–180 之间');
  }
  if (input.timezoneOffset < -12 || input.timezoneOffset > 14) {
    throw new Error('时区偏移需在 -12–+14 小时之间');
  }

  const { year, month, day } = parseDateParts(input.date);
  const jd = julianDay(year, month, day);
  const { declination, equationOfTime } = solarPosition(jd);

  const noonMinutes = 720 - 4 * input.longitude - equationOfTime;

  const sunriseAngle = hourAngle(input.latitude, declination, 90.833);
  const civilAngle = hourAngle(input.latitude, declination, 96);
  const nauticalAngle = hourAngle(input.latitude, declination, 102);
  const astronomicalAngle = hourAngle(input.latitude, declination, 108);

  const sunrise =
    sunriseAngle.status === 'ok'
      ? buildEvent(noonMinutes, sunriseAngle.angle, -1)
      : { utcMinutes: null, status: sunriseAngle.status };
  const sunset =
    sunriseAngle.status === 'ok'
      ? buildEvent(noonMinutes, sunriseAngle.angle, 1)
      : { utcMinutes: null, status: sunriseAngle.status };

  const dayLengthMinutes =
    sunriseAngle.status === 'ok'
      ? sunriseAngle.angle * 8
      : sunriseAngle.status === 'always-above'
        ? 1440
        : 0;

  return {
    solarNoon: { utcMinutes: noonMinutes, status: 'ok' },
    sunrise,
    sunset,
    civilDawn: buildTwilight(noonMinutes, civilAngle, -1),
    civilDusk: buildTwilight(noonMinutes, civilAngle, 1),
    nauticalDawn: buildTwilight(noonMinutes, nauticalAngle, -1),
    nauticalDusk: buildTwilight(noonMinutes, nauticalAngle, 1),
    astronomicalDawn: buildTwilight(noonMinutes, astronomicalAngle, -1),
    astronomicalDusk: buildTwilight(noonMinutes, astronomicalAngle, 1),
    dayLengthMinutes,
    declination,
    equationOfTime,
  };
}

/** 把「UTC 当日分钟数 + 时区偏移」格式化为本地 HH:mm */
export function formatLocalTime(utcMinutes: number, timezoneOffset: number): string {
  const total = Math.round((((utcMinutes + timezoneOffset * 60) % 1440) + 1440) % 1440);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** 把 UTC 当日分钟数格式化为 HH:mm */
export function formatUtcTime(utcMinutes: number): string {
  return formatLocalTime(utcMinutes, 0);
}

/** 把分钟数格式化为「X 小时 Y 分」 */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours} 小时 ${mins} 分`;
}
