/**
 * Google Encoded Polyline Algorithm Format 编解码纯函数，
 * 不依赖 DOM、React 与任何第三方库。支持精度 5（Directions API 经典格式）
 * 与精度 6（2019 年后的官方推荐精度），全部运算在本地完成。
 */

/** 经纬度坐标点 */
export interface LatLng {
  /** 纬度，范围 -90 ~ 90 */
  lat: number;
  /** 经度，范围 -180 ~ 180 */
  lng: number;
}

/** 编码结果 */
export interface EncodeResult {
  /** 编码后的折线字符串；出错时为空字符串 */
  output: string;
  /** 错误信息；成功时为 null */
  error: string | null;
}

/** 解码结果 */
export interface DecodeResult {
  /** 解码出的坐标点列表；出错时为空数组 */
  points: LatLng[];
  /** 错误信息；成功时为 null */
  error: string | null;
}

/**
 * 将一个有符号整数按 zigzag 展开后做 5 位分块并编码为 ASCII 字符序列
 *
 * @param value - 已经乘过 10^precision 并四舍五入的差值
 * @returns 编码字符
 */
function encodeSignedValue(value: number): string {
  // 左移可能超过 32 位有符号整数安全范围时仍可靠：精度 6、经纬度差值不超过 360e6，
  // 左移 1 位约 7.2e8，远低于 Number.MAX_SAFE_INTEGER。
  let sorter = value < 0 ? ~(value << 1) : value << 1;
  let chunks = '';
  while (sorter >= 0x20) {
    chunks += String.fromCharCode((0x20 | (sorter & 0x1f)) + 63);
    sorter >>= 5;
  }
  chunks += String.fromCharCode(sorter + 63);
  return chunks;
}

/**
 * 将坐标点数组编码为 Polyline ASCII 字符串。
 *
 * @param points - 坐标点数组
 * @param precision - 小数位精度，5 或 6
 * @returns 编码结果，非法输入时 error 给出原因
 */
export function encodePolyline(points: LatLng[], precision: 5 | 6): EncodeResult {
  if (!Number.isInteger(precision) || (precision !== 5 && precision !== 6)) {
    return { output: '', error: '精度仅支持 5 或 6 位小数' };
  }
  if (points.length === 0) {
    return { output: '', error: null };
  }

  const factor = 10 ** precision;
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (
      typeof point.lat !== 'number' ||
      typeof point.lng !== 'number' ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng)
    ) {
      return { output: '', error: `第 ${i + 1} 个坐标包含非数字或非有限数值` };
    }
    if (point.lat < -90 || point.lat > 90) {
      return { output: '', error: `第 ${i + 1} 个坐标纬度 ${point.lat} 超出 -90 ~ 90 范围` };
    }
    if (point.lng < -180 || point.lng > 180) {
      return { output: '', error: `第 ${i + 1} 个坐标经度 ${point.lng} 超出 -180 ~ 180 范围` };
    }

    const latRounded = Math.round(point.lat * factor);
    const lngRounded = Math.round(point.lng * factor);
    output += encodeSignedValue(latRounded - prevLat);
    output += encodeSignedValue(lngRounded - prevLng);
    prevLat = latRounded;
    prevLng = lngRounded;
  }

  return { output, error: null };
}

/**
 * 将 Polyline ASCII 字符串解码为坐标点数组。
 *
 * @param text - 折线字符串
 * @param precision - 小数位精度，5 或 6
 * @returns 解码结果，非法输入时 error 带定位信息
 */
export function decodePolyline(text: string, precision: 5 | 6): DecodeResult {
  if (precision !== 5 && precision !== 6) {
    return { points: [], error: '精度仅支持 5 或 6 位小数' };
  }
  const input = text.trim();
  if (input === '') {
    return { points: [], error: null };
  }

  const factor = 10 ** precision;
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < input.length) {
    const dimensions: number[] = [];
    for (let dim = 0; dim < 2; dim += 1) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        if (index >= input.length) {
          return {
            points: [],
            error: `字符串在第 ${index + 1} 个字符处截断：第 ${points.length + 1} 个坐标缺少${
              dim === 0 ? '纬度' : '经度'
            }分块`,
          };
        }
        byte = input.charCodeAt(index) - 63;
        if (byte < 0 || byte > 63) {
          return {
            points: [],
            error: `第 ${index + 1} 个字符「${input[index]}」不是合法的 Polyline 字符（编码值需落在 ?(63) ~ _{(126) 区间）`,
          };
        }
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      dimensions.push(delta);
    }

    lat += dimensions[0];
    lng += dimensions[1];
    const latValue = lat / factor;
    const lngValue = lng / factor;
    if (latValue < -90 || latValue > 90) {
      return { points: [], error: `第 ${points.length + 1} 个坐标纬度 ${latValue} 超出 -90 ~ 90 范围，请确认精度选择是否正确` };
    }
    if (lngValue < -180 || lngValue > 180) {
      return { points: [], error: `第 ${points.length + 1} 个坐标经度 ${lngValue} 超出 -180 ~ 180 范围，请确认精度选择是否正确` };
    }
    points.push({ lat: latValue, lng: lngValue });
  }

  return { points, error: null };
}

/**
 * 解析多行「纬度,经度」文本为坐标点数组
 *
 * @param text - 每行一个坐标，逗号 / 空白分隔
 * @returns 坐标点与可能的错误（首个非法行）
 */
export function parsePointsText(text: string): { points: LatLng[]; error: string | null } {
  const points: LatLng[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');

  for (let i = 0; i < lines.length; i += 1) {
    const parts = lines[i].split(/[,\s]+/).filter((part) => part !== '');
    if (parts.length !== 2) {
      return { points: [], error: `第 ${i + 1} 行格式错误：应为「纬度,经度」两个数字` };
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { points: [], error: `第 ${i + 1} 行包含无法解析的数字：${lines[i]}` };
    }
    points.push({ lat, lng });
  }

  return { points, error: null };
}
