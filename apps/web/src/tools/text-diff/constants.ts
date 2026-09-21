/**
 * 文本对比视图模式枚举
 */
export enum TextDiffModeEnum {
  /** 左右双栏分栏输入 */
  SPLIT = 'split',
  /** 单栏上下堆叠输入 */
  UNIFIED = 'unified',
}

/**
 * 文本对比视图模式对应的国际化文案键，键为模式枚举值，值为点分文案路径
 */
export const TextDiffModeLabelMap: Record<TextDiffModeEnum, string> = {
  /** 左右双栏分栏输入文案键 */
  [TextDiffModeEnum.SPLIT]: 'tools.diff.splitView',
  /** 单栏上下堆叠输入文案键 */
  [TextDiffModeEnum.UNIFIED]: 'tools.diff.unifiedView',
};

/**
 * 文本对比视图模式选项数据源，供模式切换控件渲染
 */
export const TextDiffModeOptions: { label: string; value: TextDiffModeEnum }[] =
  Object.values(TextDiffModeEnum).map((value) => ({
    label: TextDiffModeLabelMap[value],
    value,
  }));

/**
 * 工具首次载入时填入的原始版本 A 默认文本
 */
export const DEFAULT_TEXT_A = `// 初始版本 v1.0
function calculateDiscount(user, cart) {
  let discount = 0;
  if (user.isVip) {
    discount = 0.15;
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return total * (1 - discount);
}`;

/**
 * 工具首次载入时填入的新版本 B 默认文本
 */
export const DEFAULT_TEXT_B = `// 重构版本 v2.0 - 支持阶梯立减与黑金会员
function calculateDiscount(user, cart) {
  let discount = 0;
  if (user.membershipTier === 'black_gold') {
    discount = 0.25;
  } else if (user.isVip) {
    discount = 0.15;
  }
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalPrice = total * (1 - discount);
  return Math.max(0, finalPrice);
}`;

/**
 * 合同条款样例原始版本 A
 */
export const CONTRACT_TEXT_A = `甲方应在每月 15 日前向乙方支付当月服务费人民币 10,000 元整。逾期按日万分之五收取违约金。`;

/**
 * 合同条款样例新版本 B
 */
export const CONTRACT_TEXT_B = `甲方应在每月 20 日前向乙方支付当月服务费人民币 12,500 元整（含税）。逾期按日万分之三收取违约金。`;
