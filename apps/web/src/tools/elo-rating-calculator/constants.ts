/** 初始等级分输入框默认值（FIDE 入门基准分） */
export const DEFAULT_INITIAL_RATING = 1500;

/** K 因子默认值（FIDE 公开级棋手标准） */
export const DEFAULT_K_FACTOR = 32;

/** K 因子快捷预设：新手 / 公开级 / 高级别 */
export const K_FACTOR_PRESETS = [
  { label: '40（新手 /  Junior）', value: 40 },
  { label: '32（公开级标准）', value: 32 },
  { label: '24（2400 分以下）', value: 24 },
  { label: '16（2400 分以上大师）', value: 16 },
];

/** 批量推演输入框占位示例 */
export const MATCH_TEXTAREA_PLACEHOLDER = [
  '每行一场对局，格式：对手等级分,结果',
  '结果支持 W（胜）/ D（平）/ L（负），也可写 1 / 0.5 / 0',
  '示例：',
  '1400,W',
  '1520,D',
  '1610,L',
].join('\n');

/** 批量推演的一键填充样例 */
export const SAMPLE_MATCH_TEXT = ['1480,W', '1535,D', '1602,L', '1450,W', '1575,W'].join('\n');
