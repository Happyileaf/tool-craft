/**
 * 地理坐标表示法互转：十进制度（DD）↔ 度分（DDM）↔ 度分秒（DMS）。
 * 纯角度算术与字符串解析/格式化，不依赖任何外部库。
 * 仅处理表示法，不涉及坐标系偏移或距离/方位计算。
 */

export type Axis = 'lat' | 'lon';
export type CoordFormat = 'dd' | 'ddm' | 'dms';

export interface ParseOk {
  value: number;
}

export interface ParseErr {
  error: string;
}

export type ParseResult = ParseOk | ParseErr;

const DEG = '°';
const PRIME = '′';
const DOUBLE_PRIME = '″';

function axisLimit(axis: Axis): number {
  return axis === 'lat' ? 90 : 180;
}

/** 规范化秒/分进位：round 到 precision 位小数后处理 60 进位 */
function normalizeDmsParts(
  absDegrees: number,
  minutePrecision: number | null,
): { deg: number; min: number; sec: number | null } {
  let deg = Math.floor(absDegrees);
  let totalMinutes = (absDegrees - deg) * 60;
  let min = Math.floor(totalMinutes);

  if (minutePrecision === null) {
    // DMS：秒保留 3 位小数
    let sec = (totalMinutes - min) * 60;
    sec = Math.round(sec * 1000) / 1000;
    if (sec >= 60) {
      sec = 0;
      min += 1;
    }
    if (min >= 60) {
      min = 0;
      deg += 1;
    }
    return { deg, min, sec };
  }

  // DDM：分保留 4 位小数
  let minutes = Math.round(totalMinutes * 10000) / 10000;
  if (minutes >= 60) {
    minutes = 0;
    deg += 1;
  }
  return { deg, min: minutes, sec: null };
}

function hemisphere(value: number, axis: Axis): string {
  if (axis === 'lat') {
    return value < 0 ? 'S' : 'N';
  }
  return value < 0 ? 'W' : 'E';
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** DD → DMS 文本，如 31.2304 → 31°13′49.440″N */
export function formatDms(value: number, axis: Axis): string {
  const hemi = hemisphere(value, axis);
  const parts = normalizeDmsParts(Math.abs(value), null);
  const sec = (parts.sec ?? 0).toFixed(3);
  return `${parts.deg}${DEG}${pad2(parts.min)}${PRIME}${sec}${DOUBLE_PRIME}${hemi}`;
}

/** DD → DDM 文本，如 31.2304 → 31°13.8240′N */
export function formatDdm(value: number, axis: Axis): string {
  const hemi = hemisphere(value, axis);
  const parts = normalizeDmsParts(Math.abs(value), 4);
  const min = parts.min.toFixed(4);
  return `${parts.deg}${DEG}${min}${PRIME}${hemi}`;
}

/** DD 文本（最多 6 位小数，去尾零） */
export function formatDd(value: number): string {
  const fixed = value.toFixed(6);
  return fixed.replace(/\.?0+$/, '');
}

/**
 * 解析任意写法的坐标（DD / DDM / DMS），兼容半球字母与正负号。
 * 支持 `N31°13′49.44″`、`31 13 49.44 N`、`121°28.040′E`、`-31.2304` 等。
 */
export function parseCoordinate(input: string, axis: Axis): ParseResult {
  const text = input.trim();
  if (text === '') {
    return { error: '坐标为空' };
  }

  // 提取首尾半球字母
  let body = text;
  let hemi: string | null = null;
  const first = body[0] ?? '';
  const last = body[body.length - 1] ?? '';
  if (/[NSEWnsew]/.test(first)) {
    hemi = first.toUpperCase();
    body = body.slice(1).trim();
  } else if (/[NSEWnsew]/.test(last)) {
    hemi = last.toUpperCase();
    body = body.slice(0, -1).trim();
  }
  if (hemi) {
    const valid = axis === 'lat' ? ['N', 'S'] : ['E', 'W'];
    if (!valid.includes(hemi)) {
      return {
        error: `半球字母 ${hemi} 与${axis === 'lat' ? '纬度（N/S）' : '经度（E/W）'}不匹配`,
      };
    }
  }

  const negativeBySign = body.startsWith('-');
  if (body.startsWith('-') || body.startsWith('+')) {
    body = body.slice(1).trim();
  }

  // 统一分隔符：°, ′, ', ″, " 全部转空格
  const tokens = body
    .replace(new RegExp(`[${DEG}${PRIME}'${DOUBLE_PRIME}"]`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');

  if (tokens.length < 1 || tokens.length > 3) {
    return { error: '无法识别的坐标写法：支持 DD / DDM / DMS' };
  }
  if (tokens.some((token) => token === '' || Number.isNaN(Number(token)))) {
    return { error: '坐标包含非数字分量' };
  }
  const nums = tokens.map(Number);
  if (nums.some((n) => n < 0)) {
    return { error: '符号只能写在坐标开头或用半球字母表示' };
  }

  const degrees = nums[0]!;
  const minutes = nums[1] ?? 0;
  const seconds = nums[2] ?? 0;
  if (minutes >= 60 || seconds >= 60) {
    return { error: '分、秒分量必须小于 60' };
  }

  let value = degrees + minutes / 60 + seconds / 3600;
  if (negativeBySign || hemi === 'S' || hemi === 'W') {
    value = -value;
  }

  const limit = axisLimit(axis);
  if (Math.abs(value) > limit) {
    return {
      error: `${axis === 'lat' ? '纬度' : '经度'}超出范围（-${limit} ~ ${limit}）`,
    };
  }
  return { value };
}

/** 任意写法直接转换为目标格式文本；解析失败返回错误 */
export function convertCoordinate(
  input: string,
  axis: Axis,
  target: CoordFormat,
): { text: string } | ParseErr {
  const parsed = parseCoordinate(input, axis);
  if ('error' in parsed) {
    return { error: parsed.error };
  }
  if (target === 'dd') {
    return { text: formatDd(parsed.value) };
  }
  if (target === 'ddm') {
    return { text: formatDdm(parsed.value, axis) };
  }
  return { text: formatDms(parsed.value, axis) };
}

export interface BatchLine {
  /** 1 起的原始行号 */
  lineNo: number;
  /** 原始行是否为空行 */
  empty: boolean;
  lat: string | null;
  lon: string | null;
  error: string | null;
}

/**
 * 批量逐行解析 "纬度, 经度"（逗号/中文逗号/分号分隔），保留空行。
 * 每行两个坐标，各自按半球字母/符号解析并做范围校验。
 */
export function parseBatchLines(text: string): BatchLine[] {
  const lines = text.split('\n');
  return lines.map((raw, index) => {
    const line = raw.trim();
    const base: BatchLine = { lineNo: index + 1, empty: line === '', lat: null, lon: null, error: null };
    if (line === '') {
      return { ...base, error: '空行' };
    }
    const parts = line.split(/[,，;；]/).map((p) => p.trim());
    if (parts.length !== 2 || parts.some((p) => p === '')) {
      return { ...base, error: '每行需以逗号分隔「纬度, 经度」两个坐标' };
    }
    const latResult = parseCoordinate(parts[0]!, 'lat');
    if ('error' in latResult) {
      return { ...base, error: `纬度：${latResult.error}` };
    }
    const lonResult = parseCoordinate(parts[1]!, 'lon');
    if ('error' in lonResult) {
      return { ...base, lat: formatDd(latResult.value), error: `经度：${lonResult.error}` };
    }
    return { ...base, lat: formatDd(latResult.value), lon: formatDd(lonResult.value) };
  });
}
