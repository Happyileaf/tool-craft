/**
 * 密码学安全随机工具常量
 */

/** 随机工具模式 */
export enum RandomModeEnum {
  /** 区间随机整数 */
  INTEGER = 'integer',
  /** 抽签（不放回抽取） */
  PICK = 'pick',
  /** 随机分组 */
  GROUP = 'group',
  /** 列表洗牌 */
  SHUFFLE = 'shuffle',
}

/** 模式中文标签 */
export const RANDOM_MODE_LABELS: Record<RandomModeEnum, string> = {
  [RandomModeEnum.INTEGER]: '随机整数',
  [RandomModeEnum.PICK]: '抽签',
  [RandomModeEnum.GROUP]: '随机分组',
  [RandomModeEnum.SHUFFLE]: '洗牌',
};

/** 单次生成数量上限，避免页面卡顿 */
export const MAX_OUTPUT_COUNT = 10000;

/** 随机整数默认最小值 */
export const DEFAULT_MIN = '1';

/** 随机整数默认最大值 */
export const DEFAULT_MAX = '100';

/** 随机整数默认生成数量 */
export const DEFAULT_INTEGER_COUNT = '10';

/** 抽签默认抽取数量 */
export const DEFAULT_PICK_COUNT = '1';

/** 随机分组默认组数 */
export const DEFAULT_GROUP_COUNT = '2';

/** 默认候选名单 */
export const DEFAULT_CANDIDATES = ['张三', '李四', '王五', '赵六', '钱七', '孙八'].join('\n');
