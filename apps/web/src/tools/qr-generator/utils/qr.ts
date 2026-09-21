import QRCode from 'qrcode';
import type { QrErrorLevelEnum } from '../constants';

/**
 * 二维码生成参数
 */
export interface QrGenerateOptions {
  /** 容错等级，决定二维码可被遮挡后仍可识别的面积比例 */
  errorLevel: QrErrorLevelEnum;
  /** 输出图片边长（像素），二维码始终为正方形 */
  size: number;
  /** 前景色（码点颜色），十六进制 HEX 写法 */
  darkColor: string;
  /** 背景色（静区颜色），十六进制 HEX 写法 */
  lightColor: string;
}

/**
 * 二维码四周保留的静区宽度（单位为码元模块数），2 个模块可兼顾体积与扫码稳定性
 */
const QR_MARGIN = 2;

/**
 * 校验待编码文本，空白内容无法生成可识别的二维码
 *
 * @param text - 待编码文本
 * @throws 当文本为空或仅包含空白字符时抛出异常
 */
function validateText(text: string) {
  if (!text.trim()) {
    throw new Error('二维码内容不能为空');
  }
}

/**
 * 生成 PNG 格式二维码并以 Data URL 返回
 *
 * @param text - 待编码文本
 * @param options - 生成参数
 * @param options.errorLevel - 容错等级
 * @param options.size - 图片边长（像素）
 * @param options.darkColor - 前景色
 * @param options.lightColor - 背景色
 * @returns 形如 data:image/png;base64,xxxx 的 Data URL
 * @throws 当文本为空或超出当前容错等级可编码容量时抛出异常
 */
export async function generateQrDataUrl(
  text: string,
  options: QrGenerateOptions,
): Promise<string> {
  validateText(text);
  const { errorLevel, size, darkColor, lightColor } = options;
  return QRCode.toDataURL(text, {
    type: 'image/png',
    errorCorrectionLevel: errorLevel,
    margin: QR_MARGIN,
    width: size,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * 生成 SVG 矢量格式二维码字符串
 *
 * @param text - 待编码文本
 * @param options - 生成参数
 * @param options.errorLevel - 容错等级
 * @param options.size - 图形边长（像素）
 * @param options.darkColor - 前景色
 * @param options.lightColor - 背景色
 * @returns 可直接写入文件的 SVG 标记字符串
 * @throws 当文本为空或超出当前容错等级可编码容量时抛出异常
 */
export async function generateQrSvg(
  text: string,
  options: QrGenerateOptions,
): Promise<string> {
  validateText(text);
  const { errorLevel, size, darkColor, lightColor } = options;
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: errorLevel,
    margin: QR_MARGIN,
    width: size,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}
