/**
 * 零依赖 Keccak-256 纯 TypeScript 实现。
 *
 * 注意：Keccak-256（Ethereum 使用）与 NIST SHA3-256 的填充域分隔符不同——
 * Keccak 使用多填充 0x01，SHA3 使用 0x06，二者输出不一致，不可混用。
 * 置换采用 Keccak Team 参考实现的标准 Keccak-f[1600] 24 轮结构。
 * 为兼容项目 ES2017 编译目标，全部 BigInt 均以 BigInt(...) 构造，不使用 bigint 字面量。
 */

/** Keccak-f[1600] 状态为 5×5 个 64 位 lane，共 25 个 */
const LANE_COUNT = 25;

/** 24 轮置换使用的轮常量（以十六进制字符串构造，规避 ES2017 下的 bigint 字面量限制） */
const ROUND_CONSTANTS: bigint[] = [
  BigInt('0x0000000000000001'),
  BigInt('0x0000000000008082'),
  BigInt('0x800000000000808a'),
  BigInt('0x8000000080008000'),
  BigInt('0x000000000000808b'),
  BigInt('0x0000000080000001'),
  BigInt('0x8000000080008081'),
  BigInt('0x8000000000008009'),
  BigInt('0x000000000000008a'),
  BigInt('0x0000000000000088'),
  BigInt('0x0000000080008009'),
  BigInt('0x000000008000000a'),
  BigInt('0x000000008000808b'),
  BigInt('0x800000000000008b'),
  BigInt('0x8000000000008089'),
  BigInt('0x8000000000008003'),
  BigInt('0x8000000000008002'),
  BigInt('0x8000000000000080'),
  BigInt('0x000000000000800a'),
  BigInt('0x800000008000000a'),
  BigInt('0x8000000080008081'),
  BigInt('0x8000000000008080'),
  BigInt('0x0000000080000001'),
  BigInt('0x8000000080008008'),
];

/** π 步骤的 lane 重排索引，来自 Keccak 参考实现的 rho/pi 循环 */
const PI_LANES = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22,
  9, 6, 1,
];

/** 与 PI_LANES 对应的循环左移位数 */
const PI_OFFSETS = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39,
  61, 20, 44,
];

/** 64 位掩码，保证 BigInt 运算始终回绕在 2^64 内 */
const MASK64 = BigInt('0xffffffffffffffff');

/** BigInt 形式的 64，供循环移位复用 */
const SIXTY_FOUR = BigInt(64);

/**
 * 循环左移一个 64 位 lane
 *
 * @param value - 待移位的 64 位 BigInt
 * @param offset - 移位位数（0–63）
 * @returns 循环左移后的 64 位值
 */
function rotl(value: bigint, offset: number): bigint {
  if (offset === 0) {
    return value;
  }
  const shift = BigInt(offset);
  return (
    ((value << shift) | (value >> (SIXTY_FOUR - shift))) & MASK64
  );
}

/**
 * Keccak-f[1600] 24 轮置换，原地变换 25 个 lane
 *
 * @param state - 长度 25 的 BigInt lane 数组
 */
function keccakF(state: bigint[]): void {
  for (let round = 0; round < ROUND_CONSTANTS.length; round += 1) {
    // θ 步骤
    const c = new Array<bigint>(5);
    for (let x = 0; x < 5; x += 1) {
      c[x] =
        state[x]! ^ state[x + 5]! ^ state[x + 10]! ^ state[x + 15]! ^ state[x + 20]!;
    }
    const d = new Array<bigint>(5);
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5]! ^ rotl(c[(x + 1) % 5]!, 1);
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y]! ^= d[x]!;
      }
    }

    // ρ 与 π 步骤
    let lane = state[1]!;
    for (let i = 0; i < LANE_COUNT - 1; i += 1) {
      const target = PI_LANES[i]!;
      const temp = state[target]!;
      state[target] = rotl(lane, PI_OFFSETS[i]!);
      lane = temp;
    }

    // χ 步骤
    for (let y = 0; y < 5; y += 1) {
      const row = new Array<bigint>(5);
      for (let x = 0; x < 5; x += 1) {
        row[x] = state[x + 5 * y]!;
      }
      for (let x = 0; x < 5; x += 1) {
        state[x + 5 * y] =
          row[x]! ^ ((~row[(x + 1) % 5]! & row[(x + 2) % 5]!) & MASK64);
      }
    }

    // ι 步骤
    state[0] = (state[0]! ^ ROUND_CONSTANTS[round]!) & MASK64;
  }
}

/**
 * Keccak 海绵构造吸收阶段使用的域分隔字节。
 * Keccak-256 为 0x01；若改为 NIST SHA3-256 则应使用 0x06。
 */
const KECCAK_DOMAIN_SUFFIX = 0x01;

/** 速率块大小（字节）：1600 位状态、容量 512 位 → 1088 位 = 136 字节 */
const RATE_BYTES = 136;

/** 单块内的 lane 数量（136 / 8） */
const LANES_PER_BLOCK = RATE_BYTES / 8;

/** 输出摘要字节数（256 位） */
const DIGEST_BYTES = 32;

/**
 * 计算 Keccak-256 摘要
 *
 * @param message - 输入字节序列
 * @returns 32 字节摘要
 */
export function keccak256(message: Uint8Array): Uint8Array {
  const state = new Array<bigint>(LANE_COUNT).fill(BigInt(0));

  // 填充：pad10*1，并在首字节叠加 Keccak 域分隔符 0x01
  const padded = new Uint8Array(Math.ceil((message.length + 1) / RATE_BYTES) * RATE_BYTES);
  padded.set(message);
  padded[message.length] = KECCAK_DOMAIN_SUFFIX;
  padded[padded.length - 1] = padded[padded.length - 1]! | 0x80;

  // 吸收：每个速率块按小端 lane 异或进状态后做置换
  for (let blockStart = 0; blockStart < padded.length; blockStart += RATE_BYTES) {
    for (let laneIndex = 0; laneIndex < LANES_PER_BLOCK; laneIndex += 1) {
      let lane = BigInt(0);
      const base = blockStart + laneIndex * 8;
      for (let byteIndex = 0; byteIndex < 8; byteIndex += 1) {
        lane |= BigInt(padded[base + byteIndex]!) << BigInt(byteIndex * 8);
      }
      state[laneIndex]! ^= lane;
    }
    keccakF(state);
  }

  // 挤出：取前 32 字节，lane 按小端展开
  const output = new Uint8Array(DIGEST_BYTES);
  for (let byteIndex = 0; byteIndex < DIGEST_BYTES; byteIndex += 1) {
    const laneIndex = Math.floor(byteIndex / 8);
    const shift = BigInt((byteIndex % 8) * 8);
    output[byteIndex] = Number((state[laneIndex]! >> shift) & BigInt(0xff));
  }
  return output;
}

/**
 * 计算 UTF-8 文本的 Keccak-256 十六进制摘要（小写）
 *
 * @param text - 输入文本
 * @returns 64 字符小写 hex 摘要
 */
export function keccak256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const digest = keccak256(bytes);
  return Array.from(digest)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
