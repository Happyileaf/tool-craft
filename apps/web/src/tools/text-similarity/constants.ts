/**
 * 文本相似度计算器工具内常量
 */

/** 默认样例：拼写纠错场景 */
export const DEFAULT_SAMPLE = {
  label: '拼写纠错',
  a: 'kitten',
  b: 'sitting',
};

/** 示例：模糊去重（日志文案） */
export const LOG_SAMPLE = {
  label: '日志文案',
  a: '用户登录成功，欢迎回来',
  b: '用户登录成功，欢迎回来！',
};

/** 示例：英文短语 */
export const ENGLISH_SAMPLE = {
  label: '英文短语',
  a: 'the quick brown fox',
  b: 'the quick red fox',
};

/** 示例按钮配置，顺序即按钮排列顺序 */
export const SAMPLE_OPTIONS = [DEFAULT_SAMPLE, LOG_SAMPLE, ENGLISH_SAMPLE];
