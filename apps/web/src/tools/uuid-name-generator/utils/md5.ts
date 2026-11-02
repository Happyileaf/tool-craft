/**
 * RFC 1321 MD5 消息摘要（字节级实现，供 UUID v3 使用）
 *
 * 与 hash-generator 中的字符串版保持同一算法，但直接接收/返回字节，
 * 便于与 Web Crypto 的 SHA-1 接口对齐。
 */

function rotateLeft(value: number, shiftBits: number): number {
  return (value << shiftBits) | (value >>> (32 - shiftBits));
}

const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/**
 * 计算任意字节序列的 MD5 摘要，返回 16 字节
 *
 * @param data - 原始字节
 * @returns 16 字节 MD5 摘要
 */
export function md5Bytes(data: Uint8Array): Uint8Array {
  const originalByteLength = data.length;
  const paddedLength = (((originalByteLength + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[originalByteLength] = 0x80;

  const lengthLow = (originalByteLength * 8) >>> 0;
  const lengthHigh = Math.floor(originalByteLength / 0x20000000);
  const lengthView = new DataView(padded.buffer);
  lengthView.setUint32(paddedLength - 8, lengthLow, true);
  lengthView.setUint32(paddedLength - 4, lengthHigh, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < paddedLength; chunkStart += 64) {
    const chunkView = new DataView(padded.buffer, chunkStart, 64);
    const words = new Uint32Array(16);
    for (let wordIndex = 0; wordIndex < 16; wordIndex += 1) {
      words[wordIndex] = chunkView.getUint32(wordIndex * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let step = 0; step < 64; step += 1) {
      let fValue: number;
      let wordIndex: number;

      if (step < 16) {
        fValue = (b & c) | (~b & d);
        wordIndex = step;
      } else if (step < 32) {
        fValue = (d & b) | (~d & c);
        wordIndex = (5 * step + 1) % 16;
      } else if (step < 48) {
        fValue = b ^ c ^ d;
        wordIndex = (3 * step + 5) % 16;
      } else {
        fValue = c ^ (b | ~d);
        wordIndex = (7 * step) % 16;
      }

      const kValue = Math.floor(Math.abs(Math.sin(step + 1)) * 0x100000000);
      fValue = (fValue + a + kValue + words[wordIndex]!) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(fValue, SHIFT_AMOUNTS[step]!)) | 0;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const output = new Uint8Array(16);
  const outputView = new DataView(output.buffer);
  outputView.setUint32(0, a0 >>> 0, true);
  outputView.setUint32(4, b0 >>> 0, true);
  outputView.setUint32(8, c0 >>> 0, true);
  outputView.setUint32(12, d0 >>> 0, true);
  return output;
}
