import { CodecDirectionEnum, CodecModeEnum } from '../constants';

/**
 * 单次转换的结果
 */
export interface CodecResult {
  /** 是否转换成功 */
  success: boolean;
  /** 转换成功后的文本内容 */
  output: string;
  /** 转换失败时的中文错误信息 */
  errorMessage?: string;
}

/**
 * 将 UTF-8 字符串安全编码为标准 Base64，先以 encodeURIComponent 展开多字节字符，
 * 再交由 btoa 处理，规避 btoa 仅支持 Latin-1 字符的限制
 *
 * @param text - 待编码的任意 Unicode 文本
 * @returns Base64 密串
 */
export function encodeBase64(text: string) {
  const byteStream = encodeURIComponent(text).replace(
    /%([0-9A-F]{2})/g,
    (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );
  return btoa(byteStream);
}

/**
 * 将标准 Base64 密串解码为 UTF-8 字符串，先经 atob 还原字节流，
 * 再逐字节重建百分号序列并交由 decodeURIComponent 还原多字节字符
 *
 * @param encoded - Base64 密串
 * @returns 解码后的 Unicode 文本
 * @throws 密串含非法 Base64 字符或字节序列不构成合法 UTF-8 时抛出异常
 */
export function decodeBase64(encoded: string) {
  const byteStream = atob(encoded.trim());
  const percentStream = Array.from(byteStream, (char) => {
    return `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }).join('');
  return decodeURIComponent(percentStream);
}

/**
 * 将 UTF-8 字符串编码为以空格分隔的十六进制字节序列
 *
 * @param text - 待编码的任意 Unicode 文本
 * @returns 形如 "54 6f 6f 6c" 的十六进制串
 */
export function encodeHex(text: string) {
  return Array.from(new TextEncoder().encode(text))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * 将十六进制字节序列解码为 UTF-8 字符串，允许字节间存在任意空白
 *
 * @param encoded - 十六进制串
 * @returns 解码后的 Unicode 文本
 * @throws 串中含非十六进制字符或字节长度为奇数时抛出异常
 */
export function decodeHex(encoded: string) {
  const cleanHex = encoded.replace(/\s+/g, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('十六进制串长度必须为偶数');
  }
  if (cleanHex.length > 0 && /[^0-9a-fA-F]/.test(cleanHex)) {
    throw new Error('十六进制串含有非法字符');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let index = 0; index < cleanHex.length; index += 2) {
    bytes[index / 2] = parseInt(cleanHex.slice(index, index + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 按指定方案与方向执行一次编解码转换，捕获全部底层异常并转换为中文提示
 *
 * @param input - 用户输入的文本
 * @param mode - 编解码方案
 * @param direction - 转换方向
 * @returns 包含输出文本或错误信息的转换结果
 */
export function runCodec(
  input: string,
  mode: CodecModeEnum,
  direction: CodecDirectionEnum,
): CodecResult {
  if (input.length === 0) {
    return { success: true, output: '' };
  }
  try {
    if (mode === CodecModeEnum.BASE64) {
      return {
        success: true,
        output:
          direction === CodecDirectionEnum.ENCODE
            ? encodeBase64(input)
            : decodeBase64(input),
      };
    }
    if (mode === CodecModeEnum.URL) {
      return {
        success: true,
        output:
          direction === CodecDirectionEnum.ENCODE
            ? encodeURIComponent(input)
            : decodeURIComponent(input),
      };
    }
    return {
      success: true,
      output:
        direction === CodecDirectionEnum.ENCODE
          ? encodeHex(input)
          : decodeHex(input),
    };
  } catch (error: unknown) {
    return {
      success: false,
      output: '',
      errorMessage:
        error instanceof Error
          ? error.message
          : '转换失败，请核对输入内容',
    };
  }
}
