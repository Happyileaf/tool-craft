/**
 * 计算字符串的 CRC32 校验和
 * @param text - 输入文本字符串
 * @returns 计算得到的 CRC32 值，十六进制小写字符串
 */
export function computeCrc32(text: string): string {
  if (!text) {
    return '00000000';
  }

  // Convert string to byte array (UTF-8)
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  let crc = 0 ^ (-1);
  const polynomial = 0xEDB88320;

  for (const byte of bytes) {
    crc = crc ^ byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ polynomial;
      } else {
        crc = crc >>> 1;
      }
    }
  }

  crc = crc ^ (-1);
  // 转换为无符号 32 位整数，然后转为十六进制小写，补齐到 8 位
  return (crc >>> 0).toString(16).padStart(8, '0');
}
