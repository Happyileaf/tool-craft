/**
 * Maidenhead 网格定位（QTH Locator）编解码纯函数。
 * 参考 ARRL VHF 手册与 Wikipedia Maidenhead Locator System：
 * 字段对交替使用 A–R（经/纬各 18 格）、0–9（10 格）、A–X（24 格），
 * 之后每对重复 10 格 / 24 格的交替细分。
 */

/** 解码后的网格地理信息 */
export interface MaidenheadBounds {
  /** 网格字符串（大写规范形式） */
  locator: string;
  /** 西南角经度 */
  west: number;
  /** 西南角纬度 */
  south: number;
  /** 东北角经度 */
  east: number;
  /** 东北角纬度 */
  north: number;
  /** 中心经度 */
  centerLon: number;
  /** 中心纬度 */
  centerLat: number;
  /** 字段对数量（2 对 = 4 字符，依此类推） */
  pairs: number;
}

const FIELD_LETTERS = 18; // A–R
const SQUARE_DIGITS = 10; // 0–9
const SUB_LETTERS = 24; // A–X
const MAX_PAIRS = 5; // 4/6/8/10 字符

/** 第 pair 对（从 0 开始）在经/纬方向上的格数（两轴基数相同） */
function baseForPair(pair: number): number {
  if (pair === 0) {
    return FIELD_LETTERS;
  }
  if (pair === 1) {
    return SQUARE_DIGITS;
  }
  return pair % 2 === 0 ? SUB_LETTERS : SQUARE_DIGITS;
}

/**
 * 把经纬度编码为 Maidenhead 网格。
 * 经、纬两轴各自维护当前格大小与剩余偏移：
 * 第 0 对经度格 20°、纬度格 10°；其后每对两轴同除该对基数（10 或 24）。
 *
 * @param latitude - 纬度，范围 [-90, 90]
 * @param longitude - 经度，范围 [-180, 180)
 * @param pairs - 字段对数量，1–5（输出长度 = pairs × 2），默认 3（6 字符）
 * @returns 大写网格字符串
 * @throws 坐标越界或 pairs 非法时抛出错误
 */
export function encodeMaidenhead(latitude: number, longitude: number, pairs = 3): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('经纬度必须为有限数值');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('纬度必须在 -90 到 90 之间');
  }
  if (longitude < -180 || longitude >= 180) {
    throw new Error('经度必须在 -180（含）到 180（不含）之间');
  }
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > MAX_PAIRS) {
    throw new Error(`字段对数量必须是 1 到 ${MAX_PAIRS} 之间的整数`);
  }

  let lon = longitude + 180;
  let lat = latitude + 90;
  let lonCell = 20; // 360° / 18
  let latCell = 10; // 180° / 18
  let output = '';

  for (let pair = 0; pair < pairs; pair += 1) {
    if (pair > 0) {
      const divisor = baseForPair(pair);
      lonCell /= divisor;
      latCell /= divisor;
    }

    const lonIndex = Math.min(baseForPair(pair) - 1, Math.floor(lon / lonCell));
    const latIndex = Math.min(baseForPair(pair) - 1, Math.floor(lat / latCell));

    if (pair % 2 === 0) {
      // 字母对：第 0 对 A–R，其余偶数对 A–X
      output += String.fromCharCode(65 + lonIndex);
      output += String.fromCharCode(65 + latIndex);
    } else {
      // 数字对 0–9
      output += String(lonIndex);
      output += String(latIndex);
    }

    lon -= lonIndex * lonCell;
    lat -= latIndex * latCell;
  }

  return output;
}

/**
 * 解码 Maidenhead 网格为地理边界与中心坐标。
 *
 * @param input - 网格字符串（大小写不敏感，自动去空白）
 * @returns 网格边界与中心坐标
 * @throws 长度非偶数、字符非法或超出各字段取值范围时抛出错误
 */
export function decodeMaidenhead(input: string): MaidenheadBounds {
  const locator = input.trim().toUpperCase();
  if (locator.length === 0) {
    throw new Error('网格字符串不能为空');
  }
  if (locator.length % 2 !== 0) {
    throw new Error('网格长度必须为偶数（2/4/6/8/10 字符）');
  }
  const pairs = locator.length / 2;
  if (pairs > MAX_PAIRS) {
    throw new Error(`最多支持 ${MAX_PAIRS * 2} 字符（${MAX_PAIRS} 对字段）`);
  }

  let west = -180;
  let south = -90;
  let lonCell = 20;
  let latCell = 10;

  for (let pair = 0; pair < pairs; pair += 1) {
    if (pair > 0) {
      const divisor = baseForPair(pair);
      lonCell /= divisor;
      latCell /= divisor;
    }

    const lonChar = locator.charAt(pair * 2);
    const latChar = locator.charAt(pair * 2 + 1);
    const base = baseForPair(pair);
    let lonIndex: number;
    let latIndex: number;

    if (pair % 2 === 0) {
      if (!/[A-Z]/.test(lonChar) || !/[A-Z]/.test(latChar)) {
        throw new Error(`第 ${pair + 1} 对字段必须为字母，收到 "${lonChar}${latChar}"`);
      }
      lonIndex = lonChar.charCodeAt(0) - 65;
      latIndex = latChar.charCodeAt(0) - 65;
      if (lonIndex >= base || latIndex >= base) {
        throw new Error(`第 ${pair + 1} 对字母超出取值范围（该对允许 ${base} 个取值）`);
      }
    } else {
      if (!/[0-9]/.test(lonChar) || !/[0-9]/.test(latChar)) {
        throw new Error(`第 ${pair + 1} 对字段必须为数字，收到 "${lonChar}${latChar}"`);
      }
      lonIndex = Number(lonChar);
      latIndex = Number(latChar);
    }

    west += lonIndex * lonCell;
    south += latIndex * latCell;
  }

  const east = west + lonCell;
  const north = south + latCell;

  return {
    locator,
    west,
    south,
    east,
    north,
    centerLon: (west + east) / 2,
    centerLat: (south + north) / 2,
    pairs,
  };
}
