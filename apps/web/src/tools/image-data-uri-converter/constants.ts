/**
 * 图片与 Base64 Data URI 互转工具的常量定义
 */

/**
 * 支持的图片 MIME 类型白名单，拒绝非图片内容
 */
export const SUPPORTED_IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/avif',
] as const;

/**
 * Data URI 协议前缀
 */
export const DATA_URI_PREFIX = 'data:';

/**
 * base64 编码标记
 */
export const BASE64_MARKER = ';base64,';

/**
 * 默认图片 MIME 类型（无法识别时回退）
 */
export const DEFAULT_IMAGE_TYPE = 'image/png';

/**
 * 输入 Data URI 的最大长度（约 20 MB 文本），防止粘贴超大内容卡死页面
 */
export const MAX_DATA_URI_LENGTH = 20 * 1024 * 1024 * 1.4;

/**
 * 上传图片文件的最大字节数（20 MB）
 */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
