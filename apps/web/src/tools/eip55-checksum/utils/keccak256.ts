/**
 * 零依赖 Keccak-256 实现（EIP-55 校验和使用的原始 Keccak，而非 NIST SHA3 填充）。
 *
 * 注意：Web Crypto 的 crypto.subtle 仅提供 SHA3-256（padding 0x06），
 * 以太坊 EIP-55 需要原始 Keccak-256（padding 0x01），二者输出不同，
 * 因此此处按 Keccak 团队参考实现手工实现，不引入任何第三方依赖。
 * 为兼容仓库 ES2017 编译目标，统一使用 BigInt() 构造而非 bigint 字面量。
 */

const PERMUTATION_ROUNDS = 24;
const RATE_BYTES = 136; // 1088 bit 速率，对应 Keccak-256

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

const ROTATION_OFFSETS: number[][] = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

const MASK64 = BigInt('0xffffffffffffffff');
const BIG_ZERO = BigInt(0);
const BIG_EIGHT = BigInt(8);
const BIG_FF = BigInt(0xff);

function rotl(value: bigint, offset: number): bigint {
  if (offset === 0) return value;
  const shift = BigInt(offset);
  return ((value << shift) | (value >> (BigInt(64) - shift))) & MASK64;
}

/**
 * 对 5×5 的 64 位 lane 状态执行一次 Keccak-f[1600] 置换。
 */
function keccakF(state: bigint[]): void {
  for (let round = 0; round < PERMUTATION_ROUNDS; round += 1) {
    // θ 步骤
    const columnParity: bigint[] = [];
    for (let x = 0; x < 5; x += 1) {
      columnParity[x] =
        (state[x] ?? BIG_ZERO) ^
        (state[x + 5] ?? BIG_ZERO) ^
        (state[x + 10] ?? BIG_ZERO) ^
        (state[x + 15] ?? BIG_ZERO) ^
        (state[x + 20] ?? BIG_ZERO);
    }
    for (let x = 0; x < 5; x += 1) {
      const theta =
        (columnParity[(x + 4) % 5] ?? BIG_ZERO) ^
        rotl(columnParity[(x + 1) % 5] ?? BIG_ZERO, 1);
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        state[index] = (state[index] ?? BIG_ZERO) ^ theta;
      }
    }

    // ρ 与 π 步骤
    const rotated = new Array<bigint>(25).fill(BIG_ZERO);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        const rotation = ROTATION_OFFSETS[x]?.[y] ?? 0;
        rotated[newX + 5 * newY] = rotl(state[x + 5 * y] ?? BIG_ZERO, rotation);
      }
    }

    // χ 步骤
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const current = rotated[x + 5 * y] ?? BIG_ZERO;
        const next = rotated[((x + 1) % 5) + 5 * y] ?? BIG_ZERO;
        const afterNext = rotated[((x + 2) % 5) + 5 * y] ?? BIG_ZERO;
        state[x + 5 * y] = current ^ ((~next & MASK64) & afterNext);
      }
    }

    // ι 步骤
    state[0] = (state[0] ?? BIG_ZERO) ^ (ROUND_CONSTANTS[round] ?? BIG_ZERO);
  }
}

/**
 * 计算原始 Keccak-256 摘要（domain padding 0x01），返回 32 字节的 Uint8Array。
 *
 * @param message - 任意长度的输入字节
 * @returns 32 字节 Keccak-256 摘要
 */
export function keccak256(message: Uint8Array): Uint8Array {
  const state = new Array<bigint>(25).fill(BIG_ZERO);

  // 填充（multi-rate padding，原始 Keccak 域分隔字节为 0x01）
  const paddedLength = Math.ceil((message.length + 1) / RATE_BYTES) * RATE_BYTES;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x01;
  const lastIndex = paddedLength - 1;
  padded[lastIndex] = (padded[lastIndex] ?? 0) | 0x80;

  // 吸收阶段：每个 136 字节块按小端 lane 异或进状态后做置换
  for (let blockStart = 0; blockStart < padded.length; blockStart += RATE_BYTES) {
    for (let laneIndex = 0; laneIndex < RATE_BYTES / 8; laneIndex += 1) {
      let lane = BIG_ZERO;
      const offset = blockStart + laneIndex * 8;
      for (let byteIndex = 7; byteIndex >= 0; byteIndex -= 1) {
        lane = (lane << BIG_EIGHT) | BigInt(padded[offset + byteIndex] ?? 0);
      }
      state[laneIndex] = (state[laneIndex] ?? BIG_ZERO) ^ lane;
    }
    keccakF(state);
  }

  // 挤出阶段：取前 32 字节，lane 按小端拆回字节
  const digest = new Uint8Array(32);
  for (let byteIndex = 0; byteIndex < 32; byteIndex += 1) {
    const laneIndex = Math.floor(byteIndex / 8);
    const laneByte = byteIndex % 8;
    digest[byteIndex] = Number(((state[laneIndex] ?? BIG_ZERO) >> BigInt(laneByte * 8)) & BIG_FF);
  }
  return digest;
}

/**
 * 计算 UTF-8 字符串的 Keccak-256 摘要，返回小写十六进制字符串。
 */
export function keccak256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(keccak256(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
