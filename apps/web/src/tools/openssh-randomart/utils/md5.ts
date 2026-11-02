/**
 * 零依赖 MD5 实现（RFC 1321），返回小写十六进制摘要。
 * Web Crypto API 不支持 MD5，而 OpenSSH randomart 必须基于公钥 blob 的 MD5 摘要，
 * 因此在此按 RFC 1321 §3.3/§3.4 的常量与四轮运算自行实现。
 */

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = Uint32Array.from(
  Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32)),
);

function rotateLeft(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

export function md5Hex(input: Uint8Array): string {
  // §3.1 填充：0x80 + 若干 0x00，使长度 ≡ 56 (mod 64)，再追加 64 位小端长度
  const paddedLen = Math.ceil((input.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLen);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  // 输入远小于 2^29 字节，低 32 位位长用普通数值运算即可
  const bitLenLow = (input.length * 8) >>> 0;
  view.setUint32(paddedLen - 8, bitLenLow, true);
  view.setUint32(paddedLen - 4, Math.floor(input.length / 2 ** 29), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const M = new Uint32Array(16);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      M[i] = view.getUint32(offset + i * 4, true);
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      f = (f + a + K[i]! + M[g]!) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(f, S[i]!)) | 0;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0 >>> 0, true);
  outView.setUint32(4, b0 >>> 0, true);
  outView.setUint32(8, c0 >>> 0, true);
  outView.setUint32(12, d0 >>> 0, true);
  return Array.from(out, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
