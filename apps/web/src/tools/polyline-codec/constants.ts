/**
 * Polyline 折线编解码工具的常量定义
 */

/** 默认编码精度（Google 静态地图/路线 API 的历史默认值） */
export const DEFAULT_PRECISION = 5;

/** 可选的高精度精度（Google 新版路线 API v1 常用精度 6） */
export const ALTERNATIVE_PRECISION = 6;

/** 精度允许的最小值 */
export const MIN_PRECISION = 0;

/** 精度允许的最大值（足够覆盖任意经纬度表示，防止误填巨大值） */
export const MAX_PRECISION = 13;

/** 默认示例：Google 官方文档精度 5 向量（旧金山沿线） */
export const DEFAULT_INPUT = `38.5,-120.2
40.7,-120.95
43.252,-126.453`;

/** 默认编码结果（Google 官方文档向量 `_p~iF~ps|U_ulLnnqC_mqNvxq`@`） */
export const DEFAULT_ENCODED = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

/** 输入为空时的提示文案 */
export const EMPTY_TEXT = '请在左侧输入坐标点（每行「纬度,经度」）或在右侧粘贴编码字符串';

/** 坐标编辑框下方的提示 */
export const POINTS_HINT =
  '每行一个坐标点，格式为「纬度,经度」（十进制度数），支持空格 / 制表符分隔。纬度范围 -90~90，经度范围 -180~180。';

/** 编码框下方的提示 */
export const ENCODED_HINT =
  'Encoded Polyline 以可打印 ASCII 字符承载坐标增量，仅接受 ASCII 32~126 范围内的字符；空串或含非法字符会明确报错。';
