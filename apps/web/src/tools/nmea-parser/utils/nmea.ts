/**
 * NMEA 0183 语句解析（零依赖纯函数，不触碰 DOM / React）
 *
 * 支持标准语句：$GP/GN/GL/GA… + GGA / RMC / GLL / GSA / GSV / VTG，
 * 完成 XOR 校验和验证、talker/类型识别、ddmm.mmmm ↔ 十进制度换算，
 * 以及时间/日期、航向、航速、卫星等字段解码。
 * 错误以结果对象返回而非抛出。
 */

export interface DecodedField {
  /** 字段中文名 */
  label: string;
  /** 原始报文值（空串表示缺测） */
  raw: string;
  /** 解码后的可读值；缺测字段为 null */
  value: string | null;
}

export interface ParsedSentence {
  /** 原始行（去除首尾空白） */
  raw: string;
  /** 是否整体有效（结构 + 校验和均通过） */
  valid: boolean;
  /** 结构合法但语句类型不在已知列表时为 true */
  unsupported: boolean;
  /** talker 前缀（如 GP/GN/GL），未知语句为 null */
  talker: string | null;
  /** 语句类型（如 GGA/RMC），未知语句为 null */
  type: string | null;
  /** 报文给出的校验和（两位十六进制大写） */
  checksumGiven: string | null;
  /** 按 payload 计算的校验和 */
  checksumCalculated: string | null;
  /** 字段数组（不含地址与校验和） */
  fields: string[];
  /** 解码字段（未知类型为空数组） */
  decoded: DecodedField[];
  /** 错误信息；有效时为 null */
  error: string | null;
}

/** 计算 $ 与 * 之间 payload 的 XOR 校验和，返回两位大写十六进制 */
export function computeChecksum(payload: string): string {
  let xor = 0;
  for (let i = 0; i < payload.length; i += 1) {
    xor ^= payload.charCodeAt(i);
  }
  return xor.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * 将 NMEA 度分格式（dddmm.mmmm）换算为十进制度。
 * 半球为 S/W 时取负；空串返回 null。
 */
export function dmToDecimal(value: string, hemisphere: string): number | null {
  if (value === '') {
    return null;
  }
  const dm = Number(value);
  if (!Number.isFinite(dm)) {
    return null;
  }
  const degrees = Math.floor(dm / 100);
  const minutes = dm - degrees * 100;
  let decimal = degrees + minutes / 60;
  if (hemisphere === 'S' || hemisphere === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

function formatNumber(raw: string, digits: number): string | null {
  if (raw === '') {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n.toFixed(digits) : raw;
}

/** hhmmss(.sss) → HH:MM:SS(.sss) UTC */
function decodeUtcTime(raw: string): string | null {
  if (raw === '' || raw.length < 6) {
    return null;
  }
  const hh = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  const ss = raw.slice(4, 6);
  const frac = raw.slice(6);
  return `${hh}:${mm}:${ss}${frac} UTC`;
}

/** ddmmyy（RMC 日期）→ YYYY-MM-DD UTC，两位年按 20YY */
function decodeDate(raw: string): string | null {
  if (raw === '' || raw.length !== 6) {
    return null;
  }
  const dd = raw.slice(0, 2);
  const mo = raw.slice(2, 4);
  const yy = Number(raw.slice(4, 6));
  if (!Number.isInteger(yy)) {
    return null;
  }
  return `20${String(yy).padStart(2, '0')}-${mo}-${dd} UTC`;
}

function coordFields(
  lat: string,
  ns: string,
  lon: string,
  ew: string,
): DecodedField[] {
  const latDec = dmToDecimal(lat, ns);
  const lonDec = dmToDecimal(lon, ew);
  return [
    {
      label: '纬度（原始）',
      raw: lat,
      value: lat === '' ? null : `${lat} ${ns}`,
    },
    {
      label: '纬度（十进制）',
      raw: '',
      value: latDec === null ? null : latDec.toFixed(7),
    },
    {
      label: '经度（原始）',
      raw: lon,
      value: lon === '' ? null : `${lon} ${ew}`,
    },
    {
      label: '经度（十进制）',
      raw: '',
      value: lonDec === null ? null : lonDec.toFixed(7),
    },
  ];
}

const FIX_QUALITY: Record<string, string> = {
  '0': '无效定位',
  '1': 'GPS 定位（SPS）',
  '2': '差分 GPS 定位',
  '3': 'PPS 精确定位',
  '4': '实时动态（RTK 固定解）',
  '5': '浮点 RTK',
  '6': '航位推算',
  '7': '人工输入',
  '8': '模拟模式',
};

const MODE_AUTO: Record<string, string> = {
  A: '自动（2D/3D 自动切换）',
  M: '手动',
};

const GSA_MODE3D: Record<string, string> = {
  '1': '无定位',
  '2': '2D 定位',
  '3': '3D 定位',
};

const STATUS_ACTIVE: Record<string, string> = {
  A: '有效（Active）',
  V: '无效（Void）',
};

type Field = [string, string | ((raw: string) => string | null)];

function buildDecoded(fields: string[], specs: Field[]): DecodedField[] {
  return specs.map(([label, mapper], idx) => {
    const raw = fields[idx] ?? '';
    const value = typeof mapper === 'function' ? mapper(raw) : raw === '' ? null : mapper;
    return { label, raw, value };
  });
}

const passthrough = (raw: string): string | null => (raw === '' ? null : raw);

function parseGGA(fields: string[]): DecodedField[] {
  const [time, lat, ns, lon, ew, quality, sats, hdop, alt, altUnit, geoid, geoidUnit] =
    fields;
  const decoded: DecodedField[] = [
    { label: 'UTC 时间', raw: time ?? '', value: decodeUtcTime(time ?? '') },
    ...coordFields(lat ?? '', ns ?? '', lon ?? '', ew ?? ''),
    {
      label: '定位质量',
      raw: quality ?? '',
      value: quality ? FIX_QUALITY[quality] ?? `未知（${quality}）` : null,
    },
    { label: '参与定位卫星数', raw: sats ?? '', value: passthrough(sats ?? '') },
    { label: 'HDOP 水平精度因子', raw: hdop ?? '', value: formatNumber(hdop ?? '', 2) },
    {
      label: '海拔高程',
      raw: alt ?? '',
      value: alt === '' ? null : `${formatNumber(alt ?? '', 3)} ${altUnit || 'M'}`,
    },
    {
      label: '大地水准面差距',
      raw: geoid ?? '',
      value: geoid === '' ? null : `${formatNumber(geoid ?? '', 3)} ${geoidUnit || 'M'}`,
    },
  ];
  return decoded;
}

function parseRMC(fields: string[]): DecodedField[] {
  const [time, status, lat, ns, lon, ew, speedKnots, course, date, magVar, magDir, mode] =
    fields;
  const speedKmh =
    speedKnots === '' ? null : `${formatNumber(String(Number(speedKnots) * 1.852), 2)} km/h`;
  return [
    { label: 'UTC 时间', raw: time ?? '', value: decodeUtcTime(time ?? '') },
    { label: 'UTC 日期', raw: date ?? '', value: decodeDate(date ?? '') },
    {
      label: '定位状态',
      raw: status ?? '',
      value: status ? STATUS_ACTIVE[status] ?? `未知（${status}）` : null,
    },
    ...coordFields(lat ?? '', ns ?? '', lon ?? '', ew ?? ''),
    {
      label: '对地航速',
      raw: speedKnots ?? '',
      value: speedKnots === '' ? null : `${formatNumber(speedKnots ?? '', 2)} kn`,
    },
    { label: '对地航速（km/h）', raw: '', value: speedKmh },
    {
      label: '对地航向（真北）',
      raw: course ?? '',
      value: formatNumber(course ?? '', 2) === null ? null : `${formatNumber(course ?? '', 2)}°`,
    },
    {
      label: '磁偏角',
      raw: magVar ?? '',
      value: magVar === '' ? null : `${magVar}° ${magDir || ''}`.trim(),
    },
    { label: '定位模式', raw: mode ?? '', value: passthrough(mode ?? '') },
  ];
}

function parseGLL(fields: string[]): DecodedField[] {
  const [lat, ns, lon, ew, time, status, mode] = fields;
  return [
    ...coordFields(lat ?? '', ns ?? '', lon ?? '', ew ?? ''),
    { label: 'UTC 时间', raw: time ?? '', value: decodeUtcTime(time ?? '') },
    {
      label: '定位状态',
      raw: status ?? '',
      value: status ? STATUS_ACTIVE[status] ?? `未知（${status}）` : null,
    },
    { label: '定位模式', raw: mode ?? '', value: passthrough(mode ?? '') },
  ];
}

function parseVTG(fields: string[]): DecodedField[] {
  const [courseTrue, tFlag, courseMag, mFlag, speedKnots, nFlag, speedKmh, kFlag, mode] =
    fields;
  void tFlag;
  void mFlag;
  void nFlag;
  void kFlag;
  return [
    {
      label: '对地航向（真北）',
      raw: courseTrue ?? '',
      value: courseTrue === '' ? null : `${formatNumber(courseTrue ?? '', 2)}° T`,
    },
    {
      label: '对地航向（磁北）',
      raw: courseMag ?? '',
      value: courseMag === '' ? null : `${formatNumber(courseMag ?? '', 2)}° M`,
    },
    {
      label: '对地航速',
      raw: speedKnots ?? '',
      value: speedKnots === '' ? null : `${formatNumber(speedKnots ?? '', 2)} kn`,
    },
    {
      label: '对地航速（km/h）',
      raw: speedKmh ?? '',
      value: speedKmh === '' ? null : `${formatNumber(speedKmh ?? '', 2)} km/h`,
    },
    { label: '定位模式', raw: mode ?? '', value: passthrough(mode ?? '') },
  ];
}

function parseGSA(fields: string[]): DecodedField[] {
  const [mode, fixType, ...rest] = fields;
  const prns = rest.slice(0, 12);
  const pdop = rest[12] ?? '';
  const hdop = rest[13] ?? '';
  const vdop = rest[14] ?? '';
  const used = prns.filter((p) => p !== '');
  return [
    {
      label: '模式选择',
      raw: mode ?? '',
      value: mode ? MODE_AUTO[mode] ?? `未知（${mode}）` : null,
    },
    {
      label: '定位类型',
      raw: fixType ?? '',
      value: fixType ? GSA_MODE3D[fixType] ?? `未知（${fixType}）` : null,
    },
    {
      label: '使用的卫星 PRN',
      raw: prns.join(','),
      value: used.length === 0 ? null : used.join(', '),
    },
    { label: 'PDOP 位置精度因子', raw: pdop, value: formatNumber(pdop, 2) },
    { label: 'HDOP 水平精度因子', raw: hdop, value: formatNumber(hdop, 2) },
    { label: 'VDOP 垂直精度因子', raw: vdop, value: formatNumber(vdop, 2) },
  ];
}

function parseGSV(fields: string[]): DecodedField[] {
  const total = fields[0] ?? '';
  const index = fields[1] ?? '';
  const inView = fields[2] ?? '';
  const sats: string[] = [];
  for (let i = 3; i + 3 < fields.length; i += 4) {
    const prn = fields[i];
    const elev = fields[i + 1];
    const azimuth = fields[i + 2];
    const snr = fields[i + 3];
    if (prn) {
      sats.push(
        `PRN ${prn}（仰角${elev || '-'}° / 方位${azimuth || '-'}° / 信噪比${
          snr || '-'
        }dB）`,
      );
    }
  }
  return buildDecoded([total, index, inView], [
    ['本条消息总数', passthrough],
    ['本条消息序号', passthrough],
    ['可见卫星数', passthrough],
  ]).concat([
    { label: '卫星列表', raw: '', value: sats.length === 0 ? null : sats.join('；') },
  ]);
}

const KNOWN_TYPES = ['GGA', 'RMC', 'GLL', 'GSA', 'GSV', 'VTG'] as const;
type KnownType = (typeof KNOWN_TYPES)[number];

const TYPE_LABELS: Record<KnownType, string> = {
  GGA: '全球定位数据（定位/高程）',
  RMC: '推荐最小定位信息',
  GLL: '地理位置（经纬度）',
  GSA: '卫星精度因子与活动卫星',
  GSV: '可见卫星列表',
  VTG: '对地航向与航速',
};

const PARSERS: Record<KnownType, (fields: string[]) => DecodedField[]> = {
  GGA: parseGGA,
  RMC: parseRMC,
  GLL: parseGLL,
  GSA: parseGSA,
  GSV: parseGSV,
  VTG: parseVTG,
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as KnownType] ?? type;
}

const SENTENCE_RE = /^\$([!-~]+)\*([0-9A-Fa-f]{2})$/;
const ADDRESS_RE = /^[A-Z]{2}([A-Z]{3})$/;

/** 解析单行 NMEA 0183 语句 */
export function parseSentence(input: string): ParsedSentence {
  const raw = input.trim();
  const base: ParsedSentence = {
    raw,
    valid: false,
    unsupported: false,
    talker: null,
    type: null,
    checksumGiven: null,
    checksumCalculated: null,
    fields: [],
    decoded: [],
    error: null,
  };

  if (raw === '') {
    return { ...base, error: '空行' };
  }
  if (!raw.startsWith('$')) {
    return { ...base, error: '语句必须以 $ 开头' };
  }
  if (!raw.includes('*')) {
    return { ...base, error: '缺少 *HH 校验和段' };
  }

  const match = SENTENCE_RE.exec(raw);
  if (!match) {
    return { ...base, error: '结构不符合 $…*HH（校验和须为两位十六进制）' };
  }
  const payload = match[1] ?? '';
  const given = (match[2] ?? '').toUpperCase();
  const calculated = computeChecksum(payload);

  const parts = payload.split(',');
  const address = parts.shift() ?? '';
  const fields = parts;

  const addrMatch = ADDRESS_RE.exec(address);
  const talker = addrMatch ? address.slice(0, 2) : null;
  const type = addrMatch ? (addrMatch[1] ?? null) : null;

  const common = {
    ...base,
    checksumGiven: given,
    checksumCalculated: calculated,
    fields,
    talker,
    type,
  };

  if (given !== calculated) {
    return {
      ...common,
      error: `校验和不匹配：报文为 ${given}，计算应为 ${calculated}`,
    };
  }
  if (!addrMatch) {
    return { ...common, unsupported: true, error: `未识别的语句地址 ${address}` };
  }
  if (!(KNOWN_TYPES as readonly string[]).includes(type ?? '')) {
    return {
      ...common,
      unsupported: true,
      error: `暂不支持的语句类型 ${type}（校验和有效）`,
    };
  }

  const decoded = PARSERS[type as KnownType](fields);
  return { ...common, decoded, valid: true };
}

export interface BatchResult {
  sentences: ParsedSentence[];
  total: number;
  validCount: number;
  invalidCount: number;
}

/** 批量解析多行语句，空白行自动忽略 */
export function parseLines(input: string): BatchResult {
  const sentences = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map(parseSentence);
  const validCount = sentences.filter((s) => s.valid).length;
  return {
    sentences,
    total: sentences.length,
    validCount,
    invalidCount: sentences.length - validCount,
  };
}
