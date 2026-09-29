
// CRC32 查找表
let crcTable: number[] | null = null;

function makeCRCTable() {
  const table = new Array(256);
  let c;
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

/**
 * 计算字符串的 CRC32 校验值
 * @param str 输入字符串
 * @returns 十六进制格式的 CRC32 校验值
 */
export function computeCRC32(str: string): string {
  if (!crcTable) {
    crcTable = makeCRCTable();
  }

  let crc = 0 ^ (-1);
  const bytes = new TextEncoder().encode(str);

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ (-1)) >>> 0;

  return crc.toString(16).padStart(8, '0');
}
