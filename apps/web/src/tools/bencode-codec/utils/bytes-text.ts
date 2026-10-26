/**
 * Bencode 原始字节与文本框字符串之间的无损承载工具。
 * 统一采用 Latin-1（ISO-8859-1）映射：每个字节 0–255 一一对应码点 U+0000–U+00FF，
 * 这样含非 UTF-8 原始字节（如 .torrent 的 pieces 字段）的 Bencode 也能安全进出文本域。
 */

/**
 * 字节序列转 Latin-1 文本
 *
 * @param bytes - 原始字节
 * @returns 与字节一一对应的文本
 */
export function bytesToLatin1(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }
  return text;
}

/**
 * Latin-1 文本转字节序列，出现码点大于 255 的字符时报错
 *
 * @param text - Latin-1 文本
 * @returns 字节序列
 */
export function latin1ToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code > 255) {
      throw new Error(`第 ${index + 1} 个字符码点为 ${code}，超出单字节范围，无法按 Latin-1 解析为 Bencode`);
    }
    bytes[index] = code;
  }
  return bytes;
}
