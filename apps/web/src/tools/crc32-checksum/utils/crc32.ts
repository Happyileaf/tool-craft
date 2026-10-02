import { CRC32_TABLE } from '../constants';

/**
 * 计算字符串的 CRC32 校验和
 * @param text - 输入文本字符串
 * @returns 计算得到的 CRC32 值，十六进制小写字符串
 */
export function computeCrc32(text: string): string {
  if (!text) {
    return '00000000';
  }

  let crc = 0 ^ (-1);

  for (let i = 0; i < text.length; i++) {
    const byte = text.charCodeAt(i);
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }

  crc = crc ^ (-1);
  // 转换为无符号 32 位整数，然后转为十六进制小写
  return ((crc >>> 0) & 0xffffffff).toString(16);
}
