/**
 * Open Location Code（Plus Codes）编解码，零依赖纯函数实现。
 *
 * 严格对照 Google 官方参考实现 openlocationcode.js（整数算法版本）移植：
 * https://github.com/google/open-location-code
 * 字符表为 20 进制 Base20，不含易混淆字符；前 8 个字符后插入分隔符 "+"。
 */

const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;
const PADDING_CHARACTER = '0';
const ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = ALPHABET.length; // 20
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const MIN_DIGIT_COUNT = 2;
const MAX_DIGIT_COUNT = 15;
const PAIR_CODE_LENGTH = 10;
const GRID_CODE_LENGTH = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH; // 5
const GRID_COLUMNS = 4;
const GRID_ROWS = 5;

// 成对部分首位位权（最后一对位权为 1 时）
const PAIR_FIRST_PLACE_VALUE = ENCODING_BASE ** (PAIR_CODE_LENGTH / 2 - 1); // 20^4
// 成对部分精度的倒数
const PAIR_PRECISION = ENCODING_BASE ** 3; // 20^3
// 成对部分各级分辨率（度）
const PAIR_RESOLUTIONS = [20.0, 1.0, 0.05, 0.0025, 0.000125];
// 网格部分纬度/经度首位位权
const GRID_LAT_FIRST_PLACE_VALUE = GRID_ROWS ** (GRID_CODE_LENGTH - 1); // 5^4
const GRID_LNG_FIRST_PLACE_VALUE = GRID_COLUMNS ** (GRID_CODE_LENGTH - 1); // 4^4
// 满 15 位精度下度 -> 整数坐标的缩放因子
const FINAL_LAT_PRECISION = PAIR_PRECISION * GRID_ROWS ** GRID_CODE_LENGTH; // 20^3 * 5^5
const FINAL_LNG_PRECISION = PAIR_PRECISION * GRID_COLUMNS ** GRID_CODE_LENGTH; // 20^3 * 4^5
// 可缩短的最小有效长度
const MIN_TRIMMABLE_CODE_LEN = 6;

export interface CodeArea {
  latitudeLo: number;
  longitudeLo: number;
  latitudeHi: number;
  longitudeHi: number;
  codeLength: number;
  latitudeCenter: number;
  longitudeCenter: number;
}

export interface EncodeOptions {
  /** 输出 code 的有效长度：偶数 2..8 或 10..15，默认 10 */
  codeLength?: number;
}

/**
 * 校验字符串是否为结构合法的 Plus Code（完整码或短码均可能合法）。
 */
export function isValid(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const firstSep = code.indexOf(SEPARATOR);
  // 必须存在且仅存在一个分隔符
  if (firstSep === -1 || firstSep !== code.lastIndexOf(SEPARATOR)) return false;
  if (code.length === 1) return false;
  // 分隔符位置非法：超过第 8 位，或落在奇数位
  if (firstSep > SEPARATOR_POSITION || firstSep % 2 === 1) return false;

  if (code.indexOf(PADDING_CHARACTER) > -1) {
    // 短码不允许填充
    if (firstSep < SEPARATOR_POSITION) return false;
    // 不允许以填充字符开头
    if (code.indexOf(PADDING_CHARACTER) === 0) return false;
    // 填充字符只能有一组、偶数个，且最多 6 个
    const padMatches = code.match(/0+/g) ?? [];
    if (padMatches.length > 1) return false;
    const padLength = padMatches[0]?.length ?? 0;
    if (padLength % 2 === 1 || padLength > SEPARATOR_POSITION - 2) return false;
    // 含填充时必须以分隔符结尾
    if (code.charAt(code.length - 1) !== SEPARATOR) return false;
  }

  // 分隔符后只允许 0 个或至少 2 个字符
  if (code.length - firstSep - 1 === 1) return false;

  const stripped = code.replace(/\++/g, '').replace(/0+/g, '');
  for (const ch of stripped) {
    if (ALPHABET.indexOf(ch.toUpperCase()) === -1) return false;
  }
  return true;
}

/**
 * 判断是否为合法短码（分隔符出现在第 8 位之前，需要参考位置还原）。
 */
export function isShortCode(code: string): boolean {
  if (!isValid(code)) return false;
  const sep = code.indexOf(SEPARATOR);
  return sep >= 0 && sep < SEPARATOR_POSITION;
}

/**
 * 判断是否为合法完整码（结构合法、非短码，且首对字符不越界）。
 */
export function isFull(code: string): boolean {
  if (!isValid(code)) return false;
  if (isShortCode(code)) return false;
  const firstLatValue = ALPHABET.indexOf(code.charAt(0).toUpperCase()) * ENCODING_BASE;
  if (firstLatValue >= LATITUDE_MAX * 2) return false;
  if (code.length > 1) {
    const firstLngValue = ALPHABET.indexOf(code.charAt(1).toUpperCase()) * ENCODING_BASE;
    if (firstLngValue >= LONGITUDE_MAX * 2) return false;
  }
  return true;
}

/**
 * 把经纬度换算为满 15 位精度下的非负整数坐标。
 */
function locationToIntegers(latitude: number, longitude: number): [number, number] {
  let latVal = Math.floor(latitude * FINAL_LAT_PRECISION) + LATITUDE_MAX * FINAL_LAT_PRECISION;
  const latMax = 2 * LATITUDE_MAX * FINAL_LAT_PRECISION;
  if (latVal < 0) latVal = 0;
  else if (latVal >= latMax) latVal = latMax - 1;

  let lngVal = Math.floor(longitude * FINAL_LNG_PRECISION) + LONGITUDE_MAX * FINAL_LNG_PRECISION;
  const lngMax = 2 * LONGITUDE_MAX * FINAL_LNG_PRECISION;
  if (lngVal < 0) lngVal = (lngVal % lngMax) + lngMax;
  else if (lngVal >= lngMax) lngVal %= lngMax;
  return [latVal, lngVal];
}

/**
 * 把经纬度编码为 Plus Code。
 */
export function encode(
  latitude: number,
  longitude: number,
  options: EncodeOptions = {},
): string {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error('经纬度必须是数字');
  }
  let codeLength = options.codeLength ?? PAIR_CODE_LENGTH;
  if (Number.isNaN(codeLength)) throw new Error('codeLength 必须是数字');
  codeLength = Math.min(MAX_DIGIT_COUNT, codeLength);
  if (
    codeLength < MIN_DIGIT_COUNT ||
    (codeLength < PAIR_CODE_LENGTH && codeLength % 2 === 1)
  ) {
    throw new Error('非法 Plus Code 长度：需为 2、4、6、8 或 10..15 之间的整数');
  }

  const [rawLatInt, rawLngInt] = locationToIntegers(
    Math.min(Math.max(lat, -LATITUDE_MAX), LATITUDE_MAX),
    normalizeLongitude(lng),
  );
  let latInt = rawLatInt;
  let lngInt = rawLngInt;

  const code: string[] = new Array<string>(MAX_DIGIT_COUNT + 1).fill('');
  code[SEPARATOR_POSITION] = SEPARATOR;

  // 网格细化部分（5 行 × 4 列），从最低位向高位生成
  if (codeLength > PAIR_CODE_LENGTH) {
    for (let i = GRID_CODE_LENGTH; i >= 1; i -= 1) {
      const latDigit = latInt % GRID_ROWS;
      const lngDigit = lngInt % GRID_COLUMNS;
      const ndx = latDigit * GRID_COLUMNS + lngDigit;
      code[SEPARATOR_POSITION + 2 + i] = ALPHABET.charAt(ndx);
      latInt = Math.floor(latInt / GRID_ROWS);
      lngInt = Math.floor(lngInt / GRID_COLUMNS);
    }
  } else {
    latInt = Math.floor(latInt / GRID_ROWS ** GRID_CODE_LENGTH);
    lngInt = Math.floor(lngInt / GRID_COLUMNS ** GRID_CODE_LENGTH);
  }

  // 分隔符后的第一对
  code[SEPARATOR_POSITION + 1] = ALPHABET.charAt(latInt % ENCODING_BASE);
  code[SEPARATOR_POSITION + 2] = ALPHABET.charAt(lngInt % ENCODING_BASE);
  latInt = Math.floor(latInt / ENCODING_BASE);
  lngInt = Math.floor(lngInt / ENCODING_BASE);

  // 分隔符前的成对部分（i 取 6, 4, 2, 0）
  for (let i = PAIR_CODE_LENGTH / 2 + 1; i >= 0; i -= 2) {
    code[i] = ALPHABET.charAt(latInt % ENCODING_BASE);
    code[i + 1] = ALPHABET.charAt(lngInt % ENCODING_BASE);
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
 * 解码完整 Plus Code，返回编码区域边界、中心与精度信息。
 */
export function decode(code: string): CodeArea {
  if (!isFull(code)) {
    throw new Error(`非法完整 Plus Code：${code}`);
  }
  const normalized = code.replace(SEPARATOR, '').replace(/0/g, '').toUpperCase();

  let normalLat = -LATITUDE_MAX * PAIR_PRECISION;
  let normalLng = -LONGITUDE_MAX * PAIR_PRECISION;
  let gridLat = 0;
  let gridLng = 0;

  let digits = Math.min(normalized.length, PAIR_CODE_LENGTH);
  let placeValue = PAIR_FIRST_PLACE_VALUE;
  for (let i = 0; i < digits; i += 2) {
    const latDigit = ALPHABET.indexOf(normalized.charAt(i));
    const lngDigit = ALPHABET.indexOf(normalized.charAt(i + 1));
    normalLat += latDigit * placeValue;
    normalLng += lngDigit * placeValue;
    if (i < digits - 2) placeValue /= ENCODING_BASE;
  }
  let latPrecision = placeValue / PAIR_PRECISION;
  let lngPrecision = placeValue / PAIR_PRECISION;

  if (normalized.length > PAIR_CODE_LENGTH) {
    let rowPlaceValue = GRID_LAT_FIRST_PLACE_VALUE;
    let colPlaceValue = GRID_LNG_FIRST_PLACE_VALUE;
    digits = Math.min(normalized.length, MAX_DIGIT_COUNT);
    for (let i = PAIR_CODE_LENGTH; i < digits; i += 1) {
      const digitValue = ALPHABET.indexOf(normalized.charAt(i));
      const row = Math.floor(digitValue / GRID_COLUMNS);
      const column = digitValue % GRID_COLUMNS;
      gridLat += row * rowPlaceValue;
      gridLng += column * colPlaceValue;
      if (i < digits - 1) {
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
    codeLength: Math.min(normalized.length, MAX_DIGIT_COUNT),
    latitudeCenter: Math.min(latitudeLo + (latitudeHi - latitudeLo) / 2, LATITUDE_MAX),
    longitudeCenter: Math.min(longitudeLo + (longitudeHi - longitudeLo) / 2, LONGITUDE_MAX),
  };
}

/**
 * 利用参考位置把短码恢复为完整 code。
 */
export function recoverNearest(
  shortCode: string,
  referenceLatitude: number,
  referenceLongitude: number,
): string {
  if (!isShortCode(shortCode)) {
    if (isFull(shortCode)) return shortCode.toUpperCase();
    throw new Error(`非法 Plus Code 短码：${shortCode}`);
  }
  let refLat = Number(referenceLatitude);
  let refLng = Number(referenceLongitude);
  if (Number.isNaN(refLat) || Number.isNaN(refLng)) {
    throw new Error('参考位置必须是数字');
  }
  refLat = Math.min(Math.max(refLat, -LATITUDE_MAX), LATITUDE_MAX);
  refLng = normalizeLongitude(refLng);

  const upperCode = shortCode.toUpperCase();
  const paddingLength = SEPARATOR_POSITION - upperCode.indexOf(SEPARATOR);
  const resolution = ENCODING_BASE ** (2 - paddingLength / 2);
  const halfResolution = resolution / 2;

  const area = decode(encode(refLat, refLng).substring(0, paddingLength) + upperCode);

  if (
    refLat + halfResolution < area.latitudeCenter &&
    area.latitudeCenter - resolution >= -LATITUDE_MAX
  ) {
    area.latitudeCenter -= resolution;
  } else if (
    refLat - halfResolution > area.latitudeCenter &&
    area.latitudeCenter + resolution <= LATITUDE_MAX
  ) {
    area.latitudeCenter += resolution;
  }

  if (refLng + halfResolution < area.longitudeCenter) {
    area.longitudeCenter -= resolution;
  } else if (refLng - halfResolution > area.longitudeCenter) {
    area.longitudeCenter += resolution;
  }

  return encode(area.latitudeCenter, area.longitudeCenter, {
    codeLength: area.codeLength,
  });
}

/**
 * 在参考位置附近把完整 code 缩短为短码。
 */
export function shorten(
  fullCode: string,
  latitude: number,
  longitude: number,
): string {
  if (!isFull(fullCode)) {
    throw new Error(`只能对合法完整 Plus Code 执行缩短：${fullCode}`);
  }
  if (fullCode.indexOf(PADDING_CHARACTER) !== -1) {
    throw new Error('含填充 0 的低精度 code 无法缩短');
  }
  const code = fullCode.toUpperCase();
  const codeArea = decode(code);
  if (codeArea.codeLength < MIN_TRIMMABLE_CODE_LEN) {
    throw new Error(`code 有效长度至少为 ${MIN_TRIMMABLE_CODE_LEN} 才能缩短`);
  }
  const lat = Math.min(Math.max(Number(latitude), -LATITUDE_MAX), LATITUDE_MAX);
  const lng = normalizeLongitude(Number(longitude));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error('参考位置必须是数字');
  }

  const range = Math.max(
    Math.abs(codeArea.latitudeCenter - lat),
    Math.abs(codeArea.longitudeCenter - lng),
  );
  for (let i = PAIR_RESOLUTIONS.length - 2; i >= 1; i -= 1) {
    if (range < (PAIR_RESOLUTIONS[i] ?? 0) * 0.3) {
      return code.substring((i + 1) * 2);
    }
  }
  return code;
}

/**
 * 计算给定有效长度对应的纬度方向精度（度）。
 */
export function computeLatitudePrecision(codeLength: number): number {
  if (codeLength <= PAIR_CODE_LENGTH) {
    return ENCODING_BASE ** (2 - codeLength / 2);
  }
  return ENCODING_BASE ** -3 / GRID_ROWS ** (codeLength - PAIR_CODE_LENGTH);
}

function normalizeLongitude(longitude: number): number {
  let lng = longitude;
  while (lng < -LONGITUDE_MAX) lng += LONGITUDE_MAX * 2;
  while (lng >= LONGITUDE_MAX) lng -= LONGITUDE_MAX * 2;
  return lng;
}
