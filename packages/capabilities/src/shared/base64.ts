/**
 * 纯字节级 base64 编解码工具
 *
 * 不依赖 btoa/atob/Buffer 等平台专属 API，browser 与 node 两套入口共享同一实现，
 * 保证 Web / API / MCP 三端对同一字节序列产出完全一致的 base64 结果。
 */

/** 标准 base64 字母表：A-Z / a-z / 0-9 / + / /，字符索引即对应 6bit 分组的值 */
const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * 将字节序列编码为标准 base64 字符串
 *
 * @param bytes - 任意长度的字节序列
 * @returns base64 字符串，末尾按剩余字节数补 0-2 个 `=`，长度恒为 4 的倍数
 */
function encodeBase64(bytes: Uint8Array): string {
  let result = '';
  let index = 0;
  while (index + 3 <= bytes.length) {
    const byte1 = bytes[index] ?? 0;
    const byte2 = bytes[index + 1] ?? 0;
    const byte3 = bytes[index + 2] ?? 0;
    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;
    result += BASE64_ALPHABET.charAt((triplet >>> 18) & 0x3f);
    result += BASE64_ALPHABET.charAt((triplet >>> 12) & 0x3f);
    result += BASE64_ALPHABET.charAt((triplet >>> 6) & 0x3f);
    result += BASE64_ALPHABET.charAt(triplet & 0x3f);
    index += 3;
  }
  const remaining = bytes.length - index;
  if (remaining === 1) {
    /** 剩 1 字节：产出 2 个有效字符 + `==`，低位补零不影响解码（解码端按长度截断） */
    const triplet = (bytes[index] ?? 0) << 16;
    result += BASE64_ALPHABET.charAt((triplet >>> 18) & 0x3f);
    result += BASE64_ALPHABET.charAt((triplet >>> 12) & 0x3f);
    result += '==';
  } else if (remaining === 2) {
    /** 剩 2 字节：产出 3 个有效字符 + `=` */
    const triplet = ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8);
    result += BASE64_ALPHABET.charAt((triplet >>> 18) & 0x3f);
    result += BASE64_ALPHABET.charAt((triplet >>> 12) & 0x3f);
    result += BASE64_ALPHABET.charAt((triplet >>> 6) & 0x3f);
    result += '=';
  }
  return result;
}

/**
 * 将标准 base64 字符串解码为字节序列
 *
 * @param text - base64 字符串，末尾可带 0-2 个 `=` padding
 * @returns 解码后的字节序列
 * @throws 当文本包含字母表之外的非法字符、或去除 padding 后长度无法映射为整字节（长度 mod 4 为 1）时抛出 Error
 */
function decodeBase64(text: string): Uint8Array {
  const strippedText = text.replace(/=+$/, '');
  if (strippedText.length % 4 === 1) {
    throw new Error(
      `非法 base64 输入：正文长度 ${strippedText.length} 对 4 取余为 1，无法映射为整字节`,
    );
  }
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let index = 0; index < strippedText.length; index += 1) {
    const char = strippedText.charAt(index);
    const value = BASE64_ALPHABET.indexOf(char);
    if (value < 0) {
      throw new Error(`非法 base64 输入：位置 ${index} 存在非法字符 "${char}"`);
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export { encodeBase64, decodeBase64 };
