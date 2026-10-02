/**
 * 默认样例输入
 */
export const DEFAULT_SAMPLE_INPUT = '';

/**
 * 密码强度评分等级
 */
export enum PasswordStrengthEnum {
  WEAK = 0,
  MEDIUM = 1,
  STRONG = 2,
}

/**
 * 评分等级对应的显示文案和颜色
 */
export const StrengthConfig = {
  [PasswordStrengthEnum.WEAK]: {
    labelZh: '弱',
    labelEn: 'Weak',
    colorClass: 'bg-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
  [PasswordStrengthEnum.MEDIUM]: {
    labelZh: '中',
    labelEn: 'Medium',
    colorClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  [PasswordStrengthEnum.STRONG]: {
    labelZh: '强',
    labelEn: 'Strong',
    colorClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
};
