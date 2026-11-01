/**
 * KSUID 生成与解析器工具内常量
 */

/** 默认批量生成数量 */
export const DEFAULT_COUNT = 10;

/** 单次生成数量下限 */
export const MIN_COUNT = 1;

/** 单次生成数量上限 */
export const MAX_COUNT = 500;

/** 生成结果表格每页条数 */
export const TABLE_PAGE_SIZE = 10;

/** 生成区说明文案 */
export const GENERATE_HINT =
  'KSUID 为固定 27 字符 Base62（0-9A-Za-z）：底层 20 字节 = 4 字节大端秒级调整时间戳' +
  '（Unix 秒 - 1400000000）+ 16 字节密码学安全随机 payload（Web Crypto getRandomValues），' +
  '可直接按字符串字典序排序，反映创建先后。';

/** 解析区说明文案 */
export const PARSE_HINT =
  '粘贴单个 27 字符 KSUID，将实时反解出 UTC 创建时间、调整时间戳（秒）与 16 字节随机 payload。';

/** 解析区默认示例（Segment KSUID 标准示例串） */
export const DEFAULT_SAMPLE_KSUID = '0ujsswThIGTUYm2K8FjOOfXtY1K';
