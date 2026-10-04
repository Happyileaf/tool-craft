// CRC32 table
const table = new Uint32Array(256);
let tableInitialized = false;

/**
 * Initialize CRC32 table
 */
function initTable() {
  if (tableInitialized) return;
  let c: number;
  for (let i = 0; i < 256; i++) {
    c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  tableInitialized = true;
}

/**
 * Calculate CRC32 checksum for a string
 * Returns the checksum as a lowercase hex string
 */
export function crc32(str: string): string {
  initTable();
  let crc = 0 ^ -1;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ -1;
  // Convert to unsigned 32-bit integer and format as 8-character lowercase hex
  const result = (crc >>> 0).toString(16);
  return result.padStart(8, '0');
}
