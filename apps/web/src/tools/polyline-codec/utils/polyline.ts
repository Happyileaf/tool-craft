/**
 * Encoded Polyline Algorithm Format（Google 折线编码）编解码内核
 *
 * 纯本地零依赖实现，规则见：
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * 坐标先乘 10^precision 四舍五入为整数，相邻点做差量 ZigZag 编码，
 * 再按每 5 位分块、OR 0x20 续位、加 63 输出 ASCII。
 */

import { MAX_PRECISION, MIN_PRECISION } from '../constants';

/** 单个坐标点（纬度、经度，十进制度数） */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 编码结果 */
export interface EncodeResult {
  /** 编码字符串；无法编码时为 null */
  output: string | null;
  /** 编码失败时的中文错误信息 */
  error: string | null;
}

/** 解码结果 */
export interface DecodeResult {
  /** 解码出的坐标点；无法解码时为 null */
  points: LatLng[] | null;
  /** 解码失败时的中文错误信息 */
  error: string | null;
}

/** 将精度参数归一化到允许范围内的整数 */
export function normalizePrecision(precision: number): number {
  if (!Number.isFinite(precision)) {
    return MIN_PRECISION;
  }
  const rounded = Math.round(precision);
  if (rounded < MIN_PRECISION) {
    return MIN_PRECISION;
  }
  if (rounded > MAX_PRECISION) {
    return MAX_PRECISION;
  }
  return rounded;
}

/**
 * 按 Polyline 规则对单个整数做 ZigZag + 5 位分块编码
 *
 * @param value - 已四舍五入的整数（坐标差值 × 10^precision）
 * @returns 编码后的 ASCII 子串
 */
function encodeSignedInteger(value: number): string {
  // 左移 1 位后异或符号位（正数高位补 0、负数变补码后取反）
  let signed = value << 1;
  if (value < 0) {
    signed = ~signed;
  }

  let output = '';
  let remaining = signed;
  while (remaining >= 0x20) {
    // 取低 5 位并置续位标志（0x20），加 63 转为可打印 ASCII
    output += String.fromCharCode((0x20 | (remaining & 0x1f)) + 63);
    remaining >>>= 5;
  }
  output += String.fromCharCode(remaining + 63);
  return output;
}

/**
 * 把坐标点序列编码为 Polyline 字符串
 *
 * @param points - 坐标点数组（按路径顺序）
 * @param precision - 小数精度（Google 传统为 5，新版路线 API 常用 6）
 * @returns 编码结果或错误信息
 */
export function encodePolyline(points: LatLng[], precision: number): EncodeResult {
  if (!Array.isArray(points) || points.length === 0) {
    return { output: null, error: '至少需要一个坐标点' };
  }

  const factor = 10 ** normalizePrecision(precision);
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!point) {
      continue;
    }
    const { lat, lng } = point;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { output: null, error: `第 ${index + 1} 个坐标不是有效数字` };
    }
    if (lat < -90 || lat > 90) {
      return { output: null, error: `第 ${index + 1} 个坐标的纬度 ${lat} 超出 -90 ~ 90 范围` };
    }
    if (lng < -180 || lng > 180) {
      return { output: null, error: `第 ${index + 1} 个坐标的经度 ${lng} 超出 -180 ~ 180 范围` };
    }

    const intLat = Math.round(lat * factor);
    const intLng = Math.round(lng * factor);
    output += encodeSignedInteger(intLat - prevLat);
    output += encodeSignedInteger(intLng - prevLng);
    prevLat = intLat;
    prevLng = intLng;
  }

  return { output, error: null };
}

/**
 * 将 Polyline 字符串解码为坐标点序列
 *
 * @param text - 编码字符串
 * @param precision - 编码时使用的小数精度
 * @returns 坐标点数组或错误信息
 */
export function decodePolyline(text: string, precision = MIN_PRECISION): DecodeResult {
  if (typeof text !== 'string' || text.length === 0) {
    return { points: null, error: '编码字符串为空' };
  }

  const factor = 10 ** normalizePrecision(precision);
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < text.length) {
    const values: number[] = [];
    // 每一轮连续解析两个有符号整数（纬度差、经度差）
    for (let dimension = 0; dimension < 2; dimension += 1) {
      let result = 0;
      let shift = 0;
      let chunk: number;

      do {
        if (index >= text.length) {
          return { points: null, error: '编码不完整：缺少续位字符（路径在一个数值中途结束）' };
        }
        const charCode = text.charCodeAt(index);
        if (charCode < 63 || charCode > 126) {
          return {
            points: null,
            error: `第 ${index + 1} 个字符 "${text[index]}" 非法：编码只允许 ASCII 63~126 范围字符`,
          };
        }
        index += 1;
        chunk = charCode - 63;
        result |= (chunk & 0x1f) << shift;
        shift += 5;
      } while (chunk & 0x20);

      // ZigZag 还原：奇数为负
      const signed = result & 1 ? ~(result >>> 1) : result >>> 1;
      values.push(signed);
    }

    const [latDelta, lngDelta] = values;
    if (latDelta === undefined || lngDelta === undefined) {
      return { points: null, error: '编码不完整：缺少纬度或经度分量' };
    }
    lat += latDelta;
    lng += lngDelta;
    points.push({ lat: lat / factor, lng: lng / factor });
  }

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = points[pointIndex];
    if (!point) {
      continue;
    }
    if (point.lat < -90 || point.lat > 90) {
      return { points: null, error: `解码出的第 ${pointIndex + 1} 个点纬度 ${point.lat} 超出 -90 ~ 90，请确认精度是否正确` };
    }
    if (point.lng < -180 || point.lng > 180) {
      return { points: null, error: `解码出的第 ${pointIndex + 1} 个点经度 ${point.lng} 超出 -180 ~ 180，请确认精度是否正确` };
    }
  }

  return { points, error: null };
}

/**
 * 解析坐标文本：每行「纬度,经度」，逗号或空白分隔
 *
 * @param text - 原始坐标文本
 * @returns 坐标点数组；逐行返回原始值，范围校验交给编码器
 */
export function parsePointsText(text: string): { points: LatLng[] | null; error: string | null } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { points: null, error: null };
  }

  const points: LatLng[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }
    const parts = line.split(/[\s,;\t]+/).filter((part) => part.length > 0);
    if (parts.length !== 2) {
      return { points: null, error: `第 ${index + 1} 行格式错误：应为「纬度,经度」两个数值，实际得到 ${parts.length} 个字段` };
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { points: null, error: `第 ${index + 1} 行包含无法识别的数字：${lines[index]}` };
    }
    points.push({ lat, lng });
  }

  return { points, error: null };
}

/** 将坐标点序列渲染回「纬度,经度」逐行文本 */
export function formatPointsText(points: LatLng[]): string {
  return points.map((point) => `${point.lat},${point.lng}`).join('\n');
}
