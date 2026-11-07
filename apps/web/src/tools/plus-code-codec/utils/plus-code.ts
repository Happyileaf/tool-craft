/**
 * Google Open Location Code（Plus Codes）编解码纯函数集合（零依赖）。
 *
 * 严格移植官方参考实现（github.com/google/open-location-code，Apache-2.0）
 * 的整数化算法：前 10 个字符为 5 对 Base20 经纬度粗格网，
 * 第 11 位起每字符在当前格子内按 5 行 × 4 列细分；
 * 全部运算在整数空间完成以避免浮点累积误差，最终再换算为角度。
 */

/** Plus Codes 字母表（20 字符，去除元音与 0/1 等易混字符） */
export const CODE_ALPHABET = '23456789CFGHJMPQRVWX';

/** + 分隔符 */
export const SEPARATOR = '+';
/** 零填充字符 */
export const PADDING_CHARACTER = '0';
/** 分隔符前的字符数 */
export const SEPARATOR_POSITION = 8;
/** 标准精度码长（约 14m × 14m，赤道附近） */
export const CODE_PRECISION_NORMAL = 10;
/** 扩展精度码长（约 3m × 3m） */
export const CODE_PRECISION_EXTRA = 11;
/** 最小有效码长 */
export const MIN_DIGIT_COUNT = 2;
/** 最大有效码长 */
export const MAX_DIGIT_COUNT = 15;

const ENCODING_BASE = CODE_ALPHABET.length;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const PAIR_CODE_LENGTH = 10;
const GRID_CODE_LENGTH = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH;
const GRID_COLUMNS = 4;
const GRID_ROWS = 5;
/** 粗格网部分的精度倒数（20^3） */
const PAIR_PRECISION = Math.pow(ENCODING_BASE, 3);
/** 第一对字符的位权 */
const PAIR_FIRST_PLACE_VALUE = Math.pow(ENCODING_BASE, PAIR_CODE_LENGTH / 2 - 1);
/** 各粗格网对的角度分辨率 */
const PAIR_RESOLUTIONS = [20.0, 1.0, 0.05, 0.0025, 0.000125];
const GRID_LAT_FIRST_PLACE_VALUE = Math.pow(GRID_ROWS, GRID_CODE_LENGTH - 1);
const GRID_LNG_FIRST_PLACE_VALUE = Math.pow(GRID_COLUMNS, GRID_CODE_LENGTH - 1);
/** 纬度换算到最细整数精度的乘数 */
const FINAL_LAT_PRECISION =
  PAIR_PRECISION * Math.pow(GRID_ROWS, MAX_DIGIT_COUNT - PAIR_CODE_LENGTH);
/** 经度换算到最细整数精度的乘数 */
const FINAL_LNG_PRECISION =
  PAIR_PRECISION * Math.pow(GRID_COLUMNS, MAX_DIGIT_COUNT - PAIR_CODE_LENGTH);
/** 可执行 shorten 的最小码长 */
const MIN_TRIMMABLE_CODE_LEN = 6;

const ALPHABET_POSITION = new Map<string, number>(
  CODE_ALPHABET.split('').map((char, index) => [char, index]),
);

/** 解码得到的编码区域：边界框、中心点与格子精度（角度单位） */
export interface PlusCodeArea {
  /** 西南角纬度 */
  latitudeLo: number;
  /** 西南角经度 */
  longitudeLo: number;
  /** 东北角纬度 */
  latitudeHi: number;
  /** 东北角经度 */
  longitudeHi: number;
  /** 中心纬度 */
  latitudeCenter: number;
  /** 中心经度 */
  longitudeCenter: number;
  /** 格子纬度高度（度） */
  latitudePrecision: number;
  /** 格子经度宽度（度） */
  longitudePrecision: number;
  /** 有效码长（不含 + 与零填充） */
  codeLength: number;
}

/** 把纬度钳制在 [-90, 90] */
export function clipLatitude(latitude: number): number {
  return Math.min(LATITUDE_MAX, Math.max(-LATITUDE_MAX, latitude));
}

/** 把经度归一化到 [-180, 180) */
export function normalizeLongitude(longitude: number): number {
  let lng = longitude;
  while (lng < -LONGITUDE_MAX) {
    lng += LONGITUDE_MAX * 2;
  }
  while (lng >= LONGITUDE_MAX) {
    lng -= LONGITUDE_MAX * 2;
  }
  return lng;
}

/** 规范化输入：trim、转大写 */
export function normalizeCode(code: string): string {
  if (typeof code !== 'string') {
    throw new Error('Plus Code 必须是字符串');
  }
  return code.trim().toUpperCase();
}

/**
 * 判断 Plus Code 语法是否合法（允许完整码与短码）。
 * 规则移植官方 isValid：至多一个分隔符、分隔符位于偶数位且不超过第 8 位、
 * 零填充只能成偶数组且紧贴分隔符之前、分隔符后不能只有 1 个字符。
 */
export function isValid(codeInput: string): boolean {
  const code = normalizeCode(codeInput);
  if (!code) {
    return false;
  }
  const separatorIndex = code.indexOf(SEPARATOR);
  if (separatorIndex === -1) {
    return false;
  }
  if (separatorIndex !== code.lastIndexOf(SEPARATOR)) {
    return false;
  }
  if (code.length === 1) {
    return false;
  }
  if (separatorIndex > SEPARATOR_POSITION || separatorIndex % 2 === 1) {
    return false;
  }
  if (code.indexOf(PADDING_CHARACTER) > -1) {
    // 短码不允许零填充
    if (separatorIndex < SEPARATOR_POSITION) {
      return false;
    }
    // 不能以零填充开头
    if (code.charAt(0) === PADDING_CHARACTER) {
      return false;
    }
    const padMatch = code.match(new RegExp(`${PADDING_CHARACTER}+`, 'g'));
    if (
      !padMatch ||
      padMatch.length > 1 ||
      padMatch[0].length % 2 === 1 ||
      padMatch[0].length > SEPARATOR_POSITION - 2
    ) {
      return false;
    }
    // 含填充时必须以分隔符结尾
    if (code.charAt(code.length - 1) !== SEPARATOR) {
      return false;
    }
  }
  // 分隔符后只允许 0 个或至少 2 个字符
  if (code.length - separatorIndex - 1 === 1) {
    return false;
  }
  const digits = code.replace(/[+0]/g, '');
  for (const char of digits) {
    if (!ALPHABET_POSITION.has(char)) {
      return false;
    }
  }
  return true;
}

/** 是否为短码（合法且分隔符位于第 8 位之前） */
export function isShort(code: string): boolean {
  const normalized = normalizeCode(code);
  if (!isValid(normalized)) {
    return false;
  }
  return normalized.indexOf(SEPARATOR) < SEPARATOR_POSITION;
}

/**
 * 是否为完整码：除语法合法外，首对字符解码出的经纬度不能越界
 * （首纬度字符 × 20 必须 < 180，首经度字符 × 20 必须 < 360）。
 */
export function isFull(code: string): boolean {
  const normalized = normalizeCode(code);
  if (!isValid(normalized) || isShort(normalized)) {
    return false;
  }
  const firstLatValue = (ALPHABET_POSITION.get(normalized.charAt(0)) ?? -1) * ENCODING_BASE;
  if (firstLatValue >= LATITUDE_MAX * 2) {
    return false;
  }
  if (normalized.length > 1) {
    const firstLngValue = (ALPHABET_POSITION.get(normalized.charAt(1)) ?? -1) * ENCODING_BASE;
    if (firstLngValue >= LONGITUDE_MAX * 2) {
      return false;
    }
  }
  return true;
}

/** 把经纬度换算为最细格网下的非负整数坐标 */
function locationToIntegers(
  latitude: number,
  longitude: number,
): [number, number] {
  let latVal = Math.floor(latitude * FINAL_LAT_PRECISION) + LATITUDE_MAX * FINAL_LAT_PRECISION;
  if (latVal < 0) {
    latVal = 0;
  } else if (latVal >= 2 * LATITUDE_MAX * FINAL_LAT_PRECISION) {
    latVal = 2 * LATITUDE_MAX * FINAL_LAT_PRECISION - 1;
  }
  let lngVal = Math.floor(longitude * FINAL_LNG_PRECISION) + LONGITUDE_MAX * FINAL_LNG_PRECISION;
  const lngModulus = 2 * LONGITUDE_MAX * FINAL_LNG_PRECISION;
  if (lngVal < 0) {
    lngVal = (lngVal % lngModulus) + lngModulus;
  } else if (lngVal >= lngModulus) {
    lngVal %= lngModulus;
  }
  return [latVal, lngVal];
}

/** 整数坐标 → 指定码长的 Plus Code（官方 encodeIntegers 等价实现） */
function encodeIntegers(latIntInput: number, lngIntInput: number, codeLength: number): string {
  let latInt = latIntInput;
  let lngInt = lngIntInput;
  const code: string[] = new Array(MAX_DIGIT_COUNT + 1).fill('');
  code[SEPARATOR_POSITION] = SEPARATOR;

  if (codeLength > PAIR_CODE_LENGTH) {
    // 细分格网：i=5..1，写入数组第 14..10 位（对应字符串第 15..11 位）
    for (let i = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH; i >= 1; i -= 1) {
      const latDigit = latInt % GRID_ROWS;
      const lngDigit = lngInt % GRID_COLUMNS;
      code[SEPARATOR_POSITION + 2 + i] =
        CODE_ALPHABET.charAt(latDigit * GRID_COLUMNS + lngDigit);
      latInt = Math.floor(latInt / GRID_ROWS);
      lngInt = Math.floor(lngInt / GRID_COLUMNS);
    }
  } else {
    latInt = Math.floor(latInt / Math.pow(GRID_ROWS, GRID_CODE_LENGTH));
    lngInt = Math.floor(lngInt / Math.pow(GRID_COLUMNS, GRID_CODE_LENGTH));
  }

  // 分隔符后的第一对（第 9、10 位）
  code[SEPARATOR_POSITION + 1] = CODE_ALPHABET.charAt(latInt % ENCODING_BASE);
  code[SEPARATOR_POSITION + 2] = CODE_ALPHABET.charAt(lngInt % ENCODING_BASE);
  latInt = Math.floor(latInt / ENCODING_BASE);
  lngInt = Math.floor(lngInt / ENCODING_BASE);

  // 前 8 位粗格网（4 对）
  for (let i = PAIR_CODE_LENGTH / 2 + 1; i >= 0; i -= 2) {
    code[i] = CODE_ALPHABET.charAt(latInt % ENCODING_BASE);
    code[i + 1] = CODE_ALPHABET.charAt(lngInt % ENCODING_BASE);
    latInt = Math.floor(latInt / ENCODING_BASE);
    lngInt = Math.floor(lngInt / ENCODING_BASE);
  }

  if (codeLength >= SEPARATOR_POSITION) {
    return code.slice(0, codeLength + 1).join('');
  }
  return (
    code.slice(0, codeLength).join('') +
    '0'.repeat(SEPARATOR_POSITION - codeLength) +
    SEPARATOR
  );
}

/**
 * 把经纬度编码为 Plus Code。
 *
 * @param latitude - 纬度（自动钳制到 ±90）
 * @param longitude - 经度（自动归一化，允许超出 ±180）
 * @param codeLength - 码长：偶数或 ≥10 的整数，默认 10
 * @returns 含 + 分隔符的 Plus Code
 */
export function encode(
  latitude: number,
  longitude: number,
  codeLength: number = CODE_PRECISION_NORMAL,
): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('经纬度必须是有限数值');
  }
  const length = Math.min(MAX_DIGIT_COUNT, codeLength);
  if (
    length < MIN_DIGIT_COUNT ||
    (length < PAIR_CODE_LENGTH && length % 2 === 1)
  ) {
    throw new Error('非法码长：10 位以下必须为偶数，且不能小于 2');
  }
  const [latInt, lngInt] = locationToIntegers(
    clipLatitude(latitude),
    normalizeLongitude(longitude),
  );
  return encodeIntegers(latInt, lngInt, length);
}

/**
 * 把完整 Plus Code 解码为边界框与中心点。
 *
 * @param codeInput - 完整 Plus Code（允许小写与首尾空白）
 * @returns 编码区域
 */
export function decode(codeInput: string): PlusCodeArea {
  const code = normalizeCode(codeInput);
  if (!isFull(code)) {
    throw new Error('只能解码合法的完整 Plus Code；短码请先用参考位置恢复');
  }
  const digits = code.replace(/[+0]/g, '');

  let normalLat = -LATITUDE_MAX * PAIR_PRECISION;
  let normalLng = -LONGITUDE_MAX * PAIR_PRECISION;
  let gridLat = 0;
  let gridLng = 0;

  let pairedDigits = Math.min(digits.length, PAIR_CODE_LENGTH);
  let placeValue = PAIR_FIRST_PLACE_VALUE;
  for (let i = 0; i < pairedDigits; i += 2) {
    normalLat += (ALPHABET_POSITION.get(digits.charAt(i)) ?? 0) * placeValue;
    normalLng += (ALPHABET_POSITION.get(digits.charAt(i + 1)) ?? 0) * placeValue;
    if (i < pairedDigits - 2) {
      placeValue /= ENCODING_BASE;
    }
  }

  let latPrecision = placeValue / PAIR_PRECISION;
  let lngPrecision = placeValue / PAIR_PRECISION;

  if (digits.length > PAIR_CODE_LENGTH) {
    let rowPlaceValue = GRID_LAT_FIRST_PLACE_VALUE;
    let colPlaceValue = GRID_LNG_FIRST_PLACE_VALUE;
    pairedDigits = Math.min(digits.length, MAX_DIGIT_COUNT);
    for (let i = PAIR_CODE_LENGTH; i < pairedDigits; i += 1) {
      const digitValue = ALPHABET_POSITION.get(digits.charAt(i)) ?? 0;
      const row = Math.floor(digitValue / GRID_COLUMNS);
      const col = digitValue % GRID_COLUMNS;
      gridLat += row * rowPlaceValue;
      gridLng += col * colPlaceValue;
      if (i < pairedDigits - 1) {
        rowPlaceValue /= GRID_ROWS;
        colPlaceValue /= GRID_COLUMNS;
      }
    }
    latPrecision = rowPlaceValue / FINAL_LAT_PRECISION;
    lngPrecision = colPlaceValue / FINAL_LNG_PRECISION;
  }

  const latitudeLo = normalLat / PAIR_PRECISION + gridLat / FINAL_LAT_PRECISION;
  const longitudeLo = normalLng / PAIR_PRECISION + gridLng / FINAL_LNG_PRECISION;
  const latitudeHi = latitudeLo + latPrecision;
  const longitudeHi = longitudeLo + lngPrecision;

  return {
    latitudeLo,
    longitudeLo,
    latitudeHi,
    longitudeHi,
    latitudeCenter: Math.min(latitudeLo + latPrecision / 2, LATITUDE_MAX),
    longitudeCenter: Math.min(longitudeLo + lngPrecision / 2, LONGITUDE_MAX),
    latitudePrecision: latPrecision,
    longitudePrecision: lngPrecision,
    codeLength: Math.min(digits.length, MAX_DIGIT_COUNT),
  };
}

/**
 * 依据参考点把完整 Plus Code 缩短为最短的无歧义短码。
 *
 * @param fullCode - 完整 Plus Code
 * @param latitude - 参考点纬度
 * @param longitude - 参考点经度
 * @returns 短码；参考点过远时原样返回完整码
 */
export function shorten(
  fullCode: string,
  latitude: number,
  longitude: number,
): string {
  const code = normalizeCode(fullCode);
  if (!isFull(code)) {
    throw new Error('shorten 只接受合法的完整 Plus Code');
  }
  if (code.indexOf(PADDING_CHARACTER) !== -1) {
    throw new Error('含零填充的低精度码不能缩短');
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('参考点经纬度必须是有限数值');
  }
  const area = decode(code);
  if (area.codeLength < MIN_TRIMMABLE_CODE_LEN) {
    throw new Error(`码长至少为 ${MIN_TRIMMABLE_CODE_LEN} 才能缩短`);
  }
  const refLat = clipLatitude(latitude);
  const refLng = normalizeLongitude(longitude);
  const range = Math.max(
    Math.abs(area.latitudeCenter - refLat),
    Math.abs(area.longitudeCenter - refLng),
  );
  for (let i = PAIR_RESOLUTIONS.length - 2; i >= 1; i -= 1) {
    const resolution = PAIR_RESOLUTIONS[i];
    if (resolution !== undefined && range < resolution * 0.3) {
      return code.substring((i + 1) * 2);
    }
  }
  return code;
}

/**
 * 用参考点把短码恢复为距离参考点最近的完整 Plus Code。
 *
 * @param shortCodeInput - 短码（完整码则规范化后原样返回）
 * @param referenceLatitude - 参考点纬度
 * @param referenceLongitude - 参考点经度
 * @returns 完整 Plus Code
 */
export function recoverLongCode(
  shortCodeInput: string,
  referenceLatitude: number,
  referenceLongitude: number,
): string {
  const shortCode = normalizeCode(shortCodeInput);
  if (!isShort(shortCode)) {
    if (isFull(shortCode)) {
      return shortCode;
    }
    throw new Error('输入既不是合法短码也不是完整 Plus Code');
  }
  if (!Number.isFinite(referenceLatitude) || !Number.isFinite(referenceLongitude)) {
    throw new Error('参考点经纬度必须是有限数值');
  }
  const refLat = clipLatitude(referenceLatitude);
  const refLng = normalizeLongitude(referenceLongitude);

  const paddingLength = SEPARATOR_POSITION - shortCode.indexOf(SEPARATOR);
  const resolution = Math.pow(20, 2 - paddingLength / 2);
  const halfResolution = resolution / 2;

  const area = decode(
    encode(refLat, refLng).substring(0, paddingLength) + shortCode,
  );

  let latitudeCenter = area.latitudeCenter;
  let longitudeCenter = area.longitudeCenter;

  if (
    refLat + halfResolution < latitudeCenter &&
    latitudeCenter - resolution >= -LATITUDE_MAX
  ) {
    latitudeCenter -= resolution;
  } else if (
    refLat - halfResolution > latitudeCenter &&
    latitudeCenter + resolution <= LATITUDE_MAX
  ) {
    latitudeCenter += resolution;
  }

  if (refLng + halfResolution < longitudeCenter) {
    longitudeCenter -= resolution;
  } else if (refLng - halfResolution > longitudeCenter) {
    longitudeCenter += resolution;
  }

  return encode(latitudeCenter, longitudeCenter, area.codeLength);
}

/**
 * 校验 Plus Code 并返回面向用户的错误说明。
 *
 * @param code - 任意 Plus Code 文本
 * @returns 合法返回 null，否则返回中文错误说明
 */
export function validateCode(code: string): string | null {
  let normalized: string;
  try {
    normalized = normalizeCode(code);
  } catch (error) {
    return error instanceof Error ? error.message : '输入非法';
  }
  if (!normalized) {
    return 'Plus Code 不能为空';
  }
  if (!isValid(normalized)) {
    if (!normalized.includes(SEPARATOR)) {
      return '缺少 + 分隔符';
    }
    if (normalized.indexOf(SEPARATOR) % 2 === 1) {
      return '+ 分隔符必须位于偶数位（第 3 / 5 / 7 / 9 个字符之后）';
    }
    if (normalized.indexOf(SEPARATOR) > SEPARATOR_POSITION) {
      return '+ 分隔符不能位于第 9 个字符之后';
    }
    if (normalized.length - normalized.indexOf(SEPARATOR) - 1 === 1) {
      return '分隔符后不能只有 1 个字符';
    }
    const invalidChar = normalized
      .split('')
      .find((char) => char !== SEPARATOR && char !== PADDING_CHARACTER && !ALPHABET_POSITION.has(char));
    if (invalidChar) {
      return `字符「${invalidChar}」不在 Plus Codes 字母表（${CODE_ALPHABET}）中`;
    }
    return 'Plus Code 语法非法（请检查零填充与分隔符位置）';
  }
  if (!isFull(normalized) && !isShort(normalized)) {
    return '首对字符解码出的经纬度越界（如纬度超过 ±90）';
  }
  return null;
}
