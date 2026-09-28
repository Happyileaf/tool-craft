
/**
 * 密码强度评分等级
 */
export enum PasswordStrengthLevel {
  VERY_WEAK = 0,
  WEAK = 1,
  MEDIUM = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * 评分等级对应的标签与颜色
 */
export const PasswordStrengthInfo = {
  [PasswordStrengthLevel.VERY_WEAK]: {
    label: '极弱',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
  },
  [PasswordStrengthLevel.WEAK]: {
    label: '弱',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
  [PasswordStrengthLevel.MEDIUM]: {
    label: '中等',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
  },
  [PasswordStrengthLevel.STRONG]: {
    label: '强',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
  },
  [PasswordStrengthLevel.VERY_STRONG]: {
    label: '极强',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
};
