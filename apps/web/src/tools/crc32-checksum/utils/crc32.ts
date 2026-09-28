// CRC32 查找表
const crcTable: number[] = (() => {
  const table = new Array(256);
  let c;
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

/**
 * 计算文本的 CRC32 校验值
 * @param text 要计算的文本
 * @returns CRC32 校验值的十六进制字符串（小写）
 */
export function calculateCRC32(text: string): string {
  let crc = 0 ^ -1;
  const bytes = new TextEncoder().encode(text);

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]! as number;
    crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }

  crc = crc ^ -1;
  // 转换为无符号 32 位整数，然后转为十六进制，补零到 8 位
  return (crc >>> 0).toString(16).toLowerCase().padStart(8, '0');
}
