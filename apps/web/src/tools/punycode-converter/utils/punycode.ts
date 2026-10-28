/**
 * RFC 3492 Punycode / IDNA 编解码（零依赖纯函数实现）
 *
 * 参考规范：RFC 3492 "Punycode: A Bootstring encoding of Unicode
 * for Internationalized Domain Names in Applications (IDNA)"。
 */

/** Bootstring 参数（RFC 3492 第 5 节） */
const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

export interface ConvertResult {
  output: string;
  warnings: string[];
  error: string | null;
}

/** 将代码点转成 JavaScript 字符串（处理代理对） */
function codePointToChar(codePoint: number): string {
  if (codePoint > 0xffff) {
    const high = 0xd800 + ((codePoint - 0x10000) >> 10);
    const low = 0xdc00 + ((codePoint - 0x10000) & 0x3ff);
    return String.fromCharCode(high, low);
  }
  return String.fromCharCode(codePoint);
}

/** 将 0..35 的数字映射为 a-z0-9 */
function digitToBasic(digit: number): number {
  return digit + 22 + 75 * (digit < 26 ? 1 : 0);
}

/** 将 a-z / A-Z / 0-9 映射回 0..35，非法字符返回 -1 */
function basicToDigit(codePoint: number): number {
  if (codePoint >= 0x30 && codePoint <= 0x39) {
    return codePoint - 22;
  }
  if (codePoint >= 0x61 && codePoint <= 0x7a) {
    return codePoint - 97;
  }
  if (codePoint >= 0x41 && codePoint <= 0x5a) {
    return codePoint - 65;
  }
  return -1;
}

/** 偏置自适应（RFC 3492 第 3.4 节） */
function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return Math.floor(k + ((BASE - TMIN + 1) * d) / (d + SKEW));
}

/** 遍历字符串的全部 Unicode 代码点 */
function toCodePoints(input: string): number[] {
  const codePoints: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoints.push(0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00));
        i++;
        continue;
      }
    }
    codePoints.push(code);
  }
  return codePoints;
}

/** Punycode 编码：把任意 Unicode 字符串编码为 a-z0-9 bootstring */
export function punycodeEncode(input: string): string {
  const inputCodes = toCodePoints(input);
  const output: number[] = [];

  // 先复制全部基本码点（ASCII 且非分隔符以外的处理由调用方保证合法性）
  let basicCount = 0;
  for (const code of inputCodes) {
    if (code < INITIAL_N) {
      output.push(code);
      basicCount++;
    } else if (code > 0x10ffff) {
      throw new Error('输入包含超出 Unicode 范围的代码点');
    }
  }
  let handled = basicCount;
  if (basicCount > 0) {
    output.push(DELIMITER.charCodeAt(0));
  }

  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;

  while (handled < inputCodes.length) {
    let m = Number.MAX_SAFE_INTEGER;
    for (const code of inputCodes) {
      if (code >= n && code < m) {
        m = code;
      }
    }

    if (m - n > Math.floor((Number.MAX_SAFE_INTEGER - delta) / (handled + 1))) {
      throw new Error('编码溢出，输入过长');
    }
    delta += (m - n) * (handled + 1);
    n = m;

    for (const code of inputCodes) {
      if (code < n) {
        delta++;
        if (delta === Number.MAX_SAFE_INTEGER) {
          throw new Error('编码溢出，输入过长');
        }
      }
      if (code === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) {
            break;
          }
          const cp = t + ((q - t) % (BASE - t));
          output.push(digitToBasic(cp));
          q = Math.floor((q - t) / (BASE - t));
        }
        output.push(digitToBasic(q));
        bias = adapt(delta, handled + 1, handled === basicCount);
        delta = 0;
        handled++;
      }
    }
    delta++;
    n++;
  }

  return String.fromCharCode(...output);
}

/** Punycode 解码：把 bootstring 还原为 Unicode 字符串 */
export function punycodeDecode(input: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i));
  }

  // 最后一个分隔符前的内容原样作为基本码点
  let basicLength = bytes.lastIndexOf(DELIMITER.charCodeAt(0));
  let pos = basicLength === -1 ? 0 : basicLength + 1;
  if (basicLength === -1) {
    basicLength = 0;
  }

  const output: number[] = bytes.slice(0, basicLength);
  for (const code of output) {
    if (code >= 0x80) {
      throw new Error('基本码点段包含非 ASCII 字符');
    }
  }

  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  let i = 0;

  while (pos < bytes.length) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (pos >= bytes.length) {
        throw new Error('punycode 输入不完整：编码数字段被截断');
      }
      const code = bytes[pos];
      pos++;
      const digit = basicToDigit(code ?? -1);
      if (digit < 0) {
        throw new Error(`包含非法 punycode 字符：${String.fromCharCode(code ?? 0)}`);
      }
      if (digit > Math.floor((Number.MAX_SAFE_INTEGER - i) / w)) {
        throw new Error('解码溢出，输入过长');
      }
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) {
        break;
      }
      if (w > Math.floor(Number.MAX_SAFE_INTEGER / (BASE - t))) {
        throw new Error('解码溢出，输入过长');
      }
      w *= BASE - t;
    }

    const outLength = output.length + 1;
    bias = adapt(i - oldi, outLength, oldi === 0);

    if (n + Math.floor(i / outLength) > 0x10ffff) {
      throw new Error('解码出的代码点超出 Unicode 范围');
    }
    n += Math.floor(i / outLength);
    i %= outLength;

    output.splice(i, 0, n);
    i++;
  }

  return output.map(codePointToChar).join('');
}

/** 单个 DNS 标签：Unicode -> ACE（xn-- 前缀）；纯 ASCII 标签原样返回 */
function labelToAscii(label: string): string {
  if (/^[\x00-\x7f]*$/.test(label)) {
    // 已是 ASCII；若形如 xn-- 则校验能否正常解码
    if (label.toLowerCase().startsWith('xn--')) {
      punycodeDecode(label.slice(4));
    }
    return label;
  }
  if (label.length === 0) {
    throw new Error('存在空的域名标签');
  }
  return `xn--${punycodeEncode(label)}`;
}

/** 单个 DNS 标签：ACE -> Unicode；非 xn-- 标签原样返回 */
function labelToUnicode(label: string): string {
  if (label.toLowerCase().startsWith('xn--')) {
    return punycodeDecode(label.slice(4));
  }
  return label;
}

/** 按点号切分主机名，兼容 ASCII . 与中文全角点 U+3002 / U+FF0E */
function splitLabels(input: string): string[] | null {
  const normalized = input.replace(/[．。]/g, '.');
  if (normalized.includes('.')) {
    return normalized.split('.');
  }
  return null;
}

export type IdnaDirection = 'toAscii' | 'toUnicode';

/**
 * 转换主机名 / 域名：按点分标签逐个处理，支持中文全角点输入。
 * 邮箱地址也支持：仅转换 @ 之后的域名部分。
 */
export function convertDomain(input: string, direction: IdnaDirection): string {
  const text = input.trim();
  if (text === '') {
    throw new Error('输入为空');
  }
  const atIndex = text.lastIndexOf('@');
  const localPart = atIndex === -1 ? '' : text.slice(0, atIndex + 1);
  const host = atIndex === -1 ? text : text.slice(atIndex + 1);

  const labels = splitLabels(host);
  const convert = direction === 'toAscii' ? labelToAscii : labelToUnicode;
  if (labels) {
    if (labels.some((label) => label.length === 0)) {
      throw new Error('域名标签不能为空（检查连续的点号）');
    }
    return localPart + labels.map(convert).join('.');
  }
  return localPart + convert(host);
}

/** 多行批量转换：每行独立处理，错误带行号 */
export function convertDomainLines(input: string, direction: IdnaDirection): ConvertResult {
  if (input.trim() === '') {
    return { output: '', warnings: [], error: null };
  }
  const warnings: string[] = [];
  const outputLines: string[] = [];
  const lines = input.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      outputLines.push('');
      return;
    }
    try {
      outputLines.push(convertDomain(line, direction));
    } catch (err) {
      warnings.push(`第 ${index + 1} 行：${(err as Error).message}`);
      outputLines.push(rawLine);
    }
  });
  return { output: outputLines.join('\n'), warnings, error: null };
}

/** 裸 bootstring 编解码（面向整段文本，不做域名标签处理） */
export function convertRaw(
  input: string,
  direction: IdnaDirection,
): ConvertResult {
  const text = input.trim();
  if (text === '') {
    return { output: '', warnings: [], error: null };
  }
  try {
    const output =
      direction === 'toAscii' ? punycodeEncode(text) : punycodeDecode(text);
    return { output, warnings: [], error: null };
  } catch (err) {
    return { output: '', warnings: [], error: (err as Error).message };
  }
}
