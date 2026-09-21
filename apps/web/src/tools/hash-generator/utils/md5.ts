/**
 * 对 32 位整数执行循环左移
 *
 * @param value - 待移位的 32 位整数
 * @param shiftBits - 向左循环移动的位数，取值范围 1 至 31
 * @returns 循环左移后的 32 位整数
 */
function rotateLeft(value: number, shiftBits: number): number {
  return (value << shiftBits) | (value >>> (32 - shiftBits));
}

/**
 * 将 32 位整数按小端序输出为 8 位十六进制字符串
 *
 * @param word - 32 位整数
 * @returns 小端序的 8 位十六进制字符串
 */
function toLittleEndianHex(word: number): string {
  let hex = '';
  for (let byteIndex = 0; byteIndex < 4; byteIndex += 1) {
    const byte = (word >>> (byteIndex * 8)) & 0xff;
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * MD5 每轮各步的循环左移位量，依次覆盖四轮共 64 步
 */
const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/**
 * 计算 RFC 1321 规定的 MD5 消息摘要，输入按 UTF-8 编码
 *
 * @param input - 待摘要的原始字符串
 * @returns 小写 32 位十六进制 MD5 值
 */
export function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const originalByteLength = bytes.length;

  /** 追加 0x80 与填零后再写入 64 位小端长度，使总长度为 64 字节的整数倍 */
  const paddedLength = (((originalByteLength + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[originalByteLength] = 0x80;

  /** 长度以位为单位按 64 位小端序写入；高位只需处理模 2^32 的字节 */
  const lengthLow = (originalByteLength * 8) >>> 0;
  const lengthHigh = Math.floor(originalByteLength / 0x20000000);
  const lengthView = new DataView(padded.buffer);
  lengthView.setUint32(paddedLength - 8, lengthLow, true);
  lengthView.setUint32(paddedLength - 4, lengthHigh, true);

  /** 初始化四个链式变量，初值为 RFC 1321 规定的魔数 */
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

      /** K[i] = floor(abs(sin(i + 1)) * 2^32)，直接按 RFC 公式计算避免手抄常量表；step 恒在 0-63 内，两个索引必有值 */
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

  /** 四个链式变量按小端序拼接为最终摘要 */
  return (
    toLittleEndianHex(a0) +
    toLittleEndianHex(b0) +
    toLittleEndianHex(c0) +
    toLittleEndianHex(d0)
  );
}
