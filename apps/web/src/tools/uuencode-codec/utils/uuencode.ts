/**
 * 经典 BSD uuencode / uudecode 编解码（零依赖纯函数）
 *
 * 与 Python binascii.b2a_uu / a2b_uu 兼容：
 * - 每 3 个字节拆成 4 个 6 位值，ENC(c) = c === 0 ? '`' : String(c + 32)；
 * - 每行最多编码 45 个输入字节（60 个编码字符），行首长度字符为 n + 32
 *   （n === 0 时用反引号 `），每行以 \n 结束；
 * - 包裹格式为 begin <mode> <filename> … ` end。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

/** 编解码方向 */
export type UuMode = 'encode' | 'decode';

/** uuencode / uudecode 统一结果 */
export interface UuEncodeResult {
  /** 编码后的包裹文本，或解码后的 UTF-8 文本；失败时为空串 */
  output: string;
  /** 是否成功（无 error） */
  valid: boolean;
  /** 失败时的可读中文错误信息 */
  error: string | null;
  /** 非致命问题提示（如 end 之后仍有内容、UTF-8 非法被替换） */
  warnings: string[];
  /** 实际参与编解码的字节数 */
  byteCount: number;
  /** 解码时从 begin 行取得的文件名（编码时为入参文件名） */
  filename: string | null;
  /** 解码时从 begin 行取得的权限模式（编码时为入参模式） */
  mode: string | null;
}

/** 每行最多编码的输入字节数（经典 uuencode 固定 45） */
const MAX_BYTES_PER_LINE = 45;

/**
 * 把一个 6 位值映射为 uuencode 字符：0 用反引号 `，其余加 32
 *
 * @param value - 0–63 的 6 位值
 * @returns 编码字符
 */
function encChar(value: number): string {
  return value === 0 ? '`' : String.fromCharCode(value + 32);
}

/**
 * 构造失败结果
 *
 * @param error - 中文错误信息
 * @param partial - 其余字段
 * @returns 统一失败结果
 */
function failure(
  error: string,
  partial?: Partial<UuEncodeResult>,
): UuEncodeResult {
  return {
    output: '',
    valid: false,
    error,
    warnings: [],
    byteCount: 0,
    filename: null,
    mode: null,
    ...partial,
  };
}

/**
 * 编码若干字节为一行（含行首长度字符，不含行尾换行）
 *
 * @param bytes - 全部输入字节
 * @param start - 本行起始下标
 * @param count - 本行字节数（1–45）
 * @returns 单行 uuencode 文本
 */
function encodeLine(bytes: Uint8Array, start: number, count: number): string {
  let line = encChar(count);
  const fullGroups = Math.floor(count / 3);
  for (let group = 0; group < fullGroups; group += 1) {
    const offset = start + group * 3;
    const b0 = bytes[offset] ?? 0;
    const b1 = bytes[offset + 1] ?? 0;
    const b2 = bytes[offset + 2] ?? 0;
    line += encChar(b0 >> 2);
    line += encChar(((b0 << 4) | (b1 >> 4)) & 0x3f);
    line += encChar(((b1 << 2) | (b2 >> 6)) & 0x3f);
    line += encChar(b2 & 0x3f);
  }
  const rest = count % 3;
  if (rest === 1) {
    const b0 = bytes[start + fullGroups * 3] ?? 0;
    line += encChar(b0 >> 2);
    line += encChar((b0 << 4) & 0x3f);
    line += '``';
  } else if (rest === 2) {
    const offset = start + fullGroups * 3;
    const b0 = bytes[offset] ?? 0;
    const b1 = bytes[offset + 1] ?? 0;
    line += encChar(b0 >> 2);
    line += encChar(((b0 << 4) | (b1 >> 4)) & 0x3f);
    line += encChar((b1 << 2) & 0x3f);
    line += '`';
  }
  return line;
}

/**
 * 把 UTF-8 文本编码为经典 uuencode 包裹格式
 *
 * @param text - 待编码文本（按 UTF-8 编码为字节）
 * @param filename - begin 行中的文件名，默认 'file'
 * @param mode - begin 行中的三位八进制权限，默认 '644'
 * @returns 编码结果；参数非法时 valid 为 false 并给出中文 error
 */
export function uuencode(
  text: string,
  filename: string = 'file',
  mode: string = '644',
): UuEncodeResult {
  if (filename === '') {
    return failure('文件名不能为空');
  }
  if (filename.includes('\n') || filename.includes('\r')) {
    return failure('文件名不能包含换行符');
  }
  if (!/^[0-7]{3}$/.test(mode)) {
    return failure('权限模式必须是三位八进制数字（0-7），例如 644');
  }

  const bytes = new TextEncoder().encode(text);
  const lines: string[] = [];
  for (let start = 0; start < bytes.length; start += MAX_BYTES_PER_LINE) {
    const count = Math.min(MAX_BYTES_PER_LINE, bytes.length - start);
    lines.push(encodeLine(bytes, start, count));
  }
  // 长度为 0 的结束行固定为单个反引号（空输入也必须有）
  lines.push('`');

  return {
    output: `begin ${mode} ${filename}\n${lines.join('\n')}\nend\n`,
    valid: true,
    error: null,
    warnings: [],
    byteCount: bytes.length,
    filename,
    mode,
  };
}

/**
 * 把 uuencode 包裹文本解码为 UTF-8 文本。
 * 同时接受反引号 `（0x60）与空格（0x20）作为 6 位零值；
 * 内容前的杂行忽略，end 之后的内容忽略并给 warning。
 *
 * @param text - 待解码的 uuencode 文本
 * @returns 解码结果；缺少 begin/end、字符非法或长度不符时 valid 为 false
 */
export function uudecode(text: string): UuEncodeResult {
  // 统一换行：CRLF / CR 归一为 LF，逐行去掉行尾可能残留的 CR
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');

  let beginIndex = -1;
  let mode: string | null = null;
  let filename: string | null = null;
  for (let i = 0; i < rawLines.length; i += 1) {
    const match = /^begin\s+(\S+)\s+(\S.*?)\s*$/.exec(rawLines[i] ?? '');
    if (match) {
      beginIndex = i;
      mode = match[1] ?? null;
      filename = match[2] ?? null;
      break;
    }
  }
  if (beginIndex === -1) {
    return failure('未找到 begin 行，输入不是合法的 uuencode 包裹文本（应以 "begin <mode> <filename>" 开头）');
  }

  const bytes: number[] = [];
  let ended = false;
  let endIndex = -1;
  // 是否已经遇到长度为 0 的数据结束行（` 或空格）；其后到 end 之间的杂行忽略
  let dataEnded = false;

  for (let i = beginIndex + 1; i < rawLines.length; i += 1) {
    // 不能剥除行尾空格：空格（0x20）是合法的 6 位零值，编码行常以空格收尾
    const line = rawLines[i] ?? '';

    if (line === 'end') {
      ended = true;
      endIndex = i;
      break;
    }
    if (dataEnded || line === '') {
      continue;
    }

    // 长度字符：(charCode - 32) & 0x3F
    const lengthCode = line.charCodeAt(0);
    const count = (lengthCode - 32) & 0x3f;
    // 长度为 0 的行（` 或空格）标志数据结束，其后应当是 end
    if (count === 0) {
      dataEnded = true;
      continue;
    }
    if (count > MAX_BYTES_PER_LINE) {
      return failure(
        `第 ${i + 1} 行长度字符声称有 ${count} 个字节，单行最多只能编码 ${MAX_BYTES_PER_LINE} 个字节`,
        { filename, mode, byteCount: bytes.length },
      );
    }

    for (let column = 0; column < line.length; column += 1) {
      const code = line.charCodeAt(column);
      const valid =
        (code >= 0x20 && code <= 0x5f) || code === 0x60;
      if (!valid) {
        return failure(
          `第 ${i + 1} 行第 ${column + 1} 列出现非法字符 ${JSON.stringify(line[column])}，uuencode 仅允许 ASCII 0x20–0x5F 与反引号 \`（0x60）`,
          { filename, mode, byteCount: bytes.length },
        );
      }
    }

    const groups = Math.ceil(count / 3);
    const neededChars = groups * 4;
    const payload = line.slice(1);
    if (payload.length !== neededChars) {
      return failure(
        `第 ${i + 1} 行长度字符声称有 ${count} 个字节（需 ${neededChars} 个编码字符），但该行实际有 ${payload.length} 个编码字符，数据长度不符`,
        { filename, mode, byteCount: bytes.length },
      );
    }

    // 逐 4 字符组还原 3 字节，末组按本行有效字节数剥除填充
    const remainder = count % 3;
    for (let group = 0; group < groups; group += 1) {
      const base = group * 4;
      const values = [0, 1, 2, 3].map((offset) => {
        const charCode = payload.charCodeAt(base + offset);
        // 反引号 0x60 与空格 0x20 都表示 6 位零值
        return charCode === 0x60 ? 0 : (charCode - 32) & 0x3f;
      });
      const triple = [
        (values[0]! << 2) | (values[1]! >> 4),
        ((values[1]! & 0x0f) << 4) | (values[2]! >> 2),
        ((values[2]! & 0x03) << 6) | values[3]!,
      ];
      const validBytesInGroup =
        group === groups - 1 && remainder !== 0
          ? remainder
          : 3;
      for (let b = 0; b < validBytesInGroup; b += 1) {
        bytes.push(triple[b]! & 0xff);
      }
    }
  }

  if (!ended) {
    return failure('未找到 end 行，uuencode 数据必须以单独的 end 行结束', {
      filename,
      mode,
      byteCount: bytes.length,
    });
  }

  const warnings: string[] = [];
  const trailing = rawLines
    .slice(endIndex + 1)
    .filter((line) => line.trim() !== '');
  if (trailing.length > 0) {
    warnings.push(`end 行之后仍有 ${trailing.length} 行内容，已忽略`);
  }

  const uint8 = Uint8Array.from(bytes);
  let output: string;
  try {
    output = new TextDecoder('utf-8', { fatal: true }).decode(uint8);
  } catch {
    output = new TextDecoder('utf-8').decode(uint8);
    warnings.push('解码所得字节不是合法的 UTF-8 序列，已用替换字符还原');
  }

  return {
    output,
    valid: true,
    error: null,
    warnings,
    byteCount: bytes.length,
    filename,
    mode,
  };
}
