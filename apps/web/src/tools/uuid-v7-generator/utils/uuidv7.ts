/**
 * UUID v7（RFC 9562 §5.2）生成与解析（零依赖纯函数）
 *
 * 128 位布局：
 *   48 位 Unix 毫秒时间戳 | 4 位版本号 0111(7) | 12 位 rand_a
 *   | 2 位变体位 10 | 62 位 rand_b
 *
 * 随机位共 74 位（rand_a 12 + rand_b 62），全部来自 crypto.getRandomValues；
 * 规范字符串为 8-4-4-4-12 小写十六进制，第三段首字符必为 7，第四段首字符必在 8/9/a/b。
 *
 * 为兼容低于 ES2020 的编译目标，本模块不使用 BigInt 字面量，全部位运算基于字节数组
 * （时间戳 48 位、rand_b 62 位均在 Number 安全整数范围内，以除法/取模拆分字节）。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出（批量生成对非法数量返回空数组）。
 */

/** 48 位毫秒时间戳上界（2^48 - 1） */
const TIME_MAX = 281474976710655;

/** 规范 UUID 正则：8-4-4-4-12 小写十六进制 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface UuidV7Fields {
  /** 48 位 Unix 毫秒时间戳 */
  unixTsMs: number;
  /** 版本号（UUID v7 固定为 7） */
  version: number;
  /** 变体位（RFC 4122 为二进制 10，展示为 10x） */
  variant: string;
  /** 12 位 rand_a，3 位十六进制 */
  randA: string;
  /** rand_b 段，16 位十六进制（首字符 8/9/a/b，已包含变体半字节） */
  randB: string;
}

export interface UuidV7Result {
  /** 8-4-4-4-12 规范 UUID 字符串 */
  uuid: string;
  /** 嵌入的毫秒时间戳 */
  timestampMs: number;
  /** 时间戳对应的 UTC ISO 字符串 */
  isoTime: string;
  /** 位字段拆解 */
  fields: UuidV7Fields;
  valid: boolean;
  error: string | null;
}

/** 用 Web Crypto 填充随机字节 */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** 生成 12 位随机 rand_a（0–4095） */
function randomRandA(): number {
  const bytes = randomBytes(2);
  return (bytes[0]! << 4) | (bytes[1]! >> 4);
}

/** 生成 62 位随机 rand_b：8 字节，首字节高 2 位清零以容纳变体 10 */
function randomRandB(): Uint8Array {
  const bytes = randomBytes(8);
  bytes[0]! &= 0x3f;
  return bytes;
}

/** 16 字节 → 8-4-4-4-12 规范字符串 */
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20, 32)}`;
}

/** 组装校验失败结果（字段以空值占位，保证结构稳定） */
function invalidResult(error: string): UuidV7Result {
  return {
    uuid: '',
    timestampMs: 0,
    isoTime: '',
    fields: { unixTsMs: 0, version: 0, variant: '', randA: '', randB: '' },
    valid: false,
    error,
  };
}

/**
 * 按位布局组装一个 UUID v7：写入 48 位大端时间戳、版本 7 与变体 10，
 * rand_a（12 位）与 rand_b（8 字节、首字节仅低 6 位有效）填充其余随机位。
 */
function assembleUuidV7(timestampMs: number, randA: number, randB: Uint8Array): UuidV7Result {
  const bytes = new Uint8Array(16);

  // 前 6 字节：48 位毫秒时间戳（大端），用除法/取模避免 32 位移位限制
  let ts = timestampMs;
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = ts % 256;
    ts = Math.floor(ts / 256);
  }

  // 第 7 字节高 4 位写版本号 0111，低 4 位为 rand_a 高 4 位
  bytes[6] = 0x70 | ((randA >> 8) & 0x0f);
  // 第 8 字节为 rand_a 低 8 位
  bytes[7] = randA & 0xff;
  // 第 9 字节高 2 位写变体 10，低 6 位为 rand_b 高 6 位（rand_b[0] ≤ 0x3F）
  bytes[8] = 0x80 | (randB[0]! & 0x3f);
  // 第 10–16 字节为 rand_b 剩余 56 位
  bytes.set(randB.subarray(1), 9);

  const uuid = bytesToUuid(bytes);
  const groups = uuid.split('-');
  const fields: UuidV7Fields = {
    unixTsMs: timestampMs,
    version: 7,
    variant: '10x',
    randA: groups[2]!.slice(1),
    randB: groups[3]! + groups[4],
  };

  return {
    uuid,
    timestampMs,
    isoTime: new Date(timestampMs).toISOString(),
    fields,
    valid: true,
    error: null,
  };
}

/**
 * 生成单个 UUID v7（无状态）。
 *
 * @param timestampMs - 可选毫秒时间戳，默认 Date.now()
 * @returns 生成结果（非法时间戳以 valid:false 结果对象返回）
 */
export function generateUuidV7(timestampMs: number = Date.now()): UuidV7Result {
  if (
    !Number.isFinite(timestampMs) ||
    !Number.isInteger(timestampMs) ||
    timestampMs < 0 ||
    timestampMs > TIME_MAX
  ) {
    return invalidResult(
      `时间戳必须是 0–${TIME_MAX}（2^48-1）之间的整数毫秒值`,
    );
  }
  return assembleUuidV7(timestampMs, randomRandA(), randomRandB());
}

/**
 * 把 rand_b（62 位）视为大端整数加一；进位越过 62 位（首字节出现 0x40 位）
 * 或整体进位溢出时返回 true，表示需要向 rand_a 进位。
 */
function incrementRandB(randB: Uint8Array): boolean {
  let carry = 1;
  for (let index = 7; index >= 0 && carry === 1; index -= 1) {
    const value = randB[index]! + 1;
    if (value > 0xff) {
      randB[index] = 0;
    } else {
      randB[index] = value;
      carry = 0;
    }
  }
  return carry === 1 || randB[0]! > 0x3f;
}

/**
 * 批量生成 UUID v7，批内严格字典序递增：
 * 同一毫秒内先对 62 位 rand_b 加一；rand_b 溢出则重新取随机 rand_b 并对 12 位
 * rand_a 加一；rand_a 也溢出（74 位全占满，极端情况）时全部重新取随机数；
 * 时间戳前进时重新取随机数。单调性仅由本函数内的局部状态保证，
 * 单次 generateUuidV7 不携带任何状态。
 *
 * @param count - 生成数量（1–1000，越界自动夹紧；非有限整数或小于 1 返回空数组）
 * @param timestampMs - 可选固定毫秒时间戳，默认首次生成时的 Date.now()
 * @returns 升序排列的 UUID 字符串数组
 */
export function generateBatch(count: number, timestampMs?: number): string[] {
  if (!Number.isFinite(count) || !Number.isInteger(count) || count < 1) {
    return [];
  }
  const total = Math.min(count, 1000);
  const baseTs = timestampMs ?? Date.now();
  if (!Number.isFinite(baseTs) || !Number.isInteger(baseTs) || baseTs < 0 || baseTs > TIME_MAX) {
    return [];
  }

  const uuids: string[] = [];
  let lastTs = -1;
  let randA = 0;
  const randB = new Uint8Array(8);

  for (let index = 0; index < total; index += 1) {
    const currentTs = timestampMs ?? Date.now();
    if (currentTs === lastTs) {
      // 同一毫秒：rand_b 加一；溢出则重新随机 rand_b 并 rand_a 加一；
      // rand_a 也溢出（回到 0）时全部重新取随机（不阻塞等待）
      const overflowB = incrementRandB(randB);
      if (overflowB) {
        randB.set(randomRandB());
        randA = (randA + 1) & 0xfff;
        if (randA === 0) {
          randA = randomRandA();
        }
      }
    } else {
      randA = randomRandA();
      randB.set(randomRandB());
    }
    lastTs = currentTs;
    uuids.push(assembleUuidV7(currentTs, randA, randB).uuid);
  }

  return uuids;
}

/**
 * 解析并校验 UUID v7。容忍首尾空白、花括号、urn:uuid: 前缀与大写输入。
 *
 * @param input - 待解析的 UUID 字符串
 * @returns 时间戳、ISO 时间与位字段拆解；校验失败时 valid:false 并带可读错误
 */
export function inspectUuidV7(input: string): UuidV7Result {
  const normalized = input
    .trim()
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .replace(/^urn:uuid:/i, '')
    .trim()
    .toLowerCase();

  if (normalized === '') {
    return invalidResult('内容不能为空');
  }
  if (normalized.length !== 36) {
    return invalidResult(
      `长度错误：标准 UUID 应为 36 个字符（8-4-4-4-12），当前为 ${normalized.length} 个`,
    );
  }
  if (!UUID_PATTERN.test(normalized)) {
    return invalidResult('格式错误：仅允许 8-4-4-4-12 排列的十六进制字符与连字符');
  }

  const groups = normalized.split('-');
  const version = parseInt(groups[2]![0]!, 16);
  if (version !== 7) {
    return invalidResult(
      `版本位错误：第三段首字符必须为 7（UUID v7），当前为 ${groups[2]![0]}（v${version}）`,
    );
  }

  const variantNibble = parseInt(groups[3]![0]!, 16);
  // 变体 10：首字符 ∈ 8(1000)/9(1001)/a(1010)/b(1011)
  if (variantNibble < 0x8 || variantNibble > 0xb) {
    return invalidResult(
      `变体位错误：第四段首字符必须在 8/9/a/b（二进制 10x），当前为 ${groups[3]![0]}`,
    );
  }

  const timestampMs = parseInt(normalized.replace(/-/g, '').slice(0, 12), 16);
  const fields: UuidV7Fields = {
    unixTsMs: timestampMs,
    version: 7,
    variant: '10x',
    randA: groups[2]!.slice(1),
    randB: groups[3]! + groups[4],
  };

  return {
    uuid: normalized,
    timestampMs,
    isoTime: new Date(timestampMs).toISOString(),
    fields,
    valid: true,
    error: null,
  };
}
