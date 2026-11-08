/**
 * 加班工资计算器的静态配置。
 */

/** 三类加班的展示配置 */
export const OVERTIME_CATEGORIES = [
  {
    key: 'workday' as const,
    label: '工作日延时加班',
    rate: 1.5,
    rateText: '150%',
    legalBasis: '《劳动法》第四十四条第（一）项：安排劳动者延长工作时间的，支付不低于工资的 150% 的工资报酬。',
    color: 'blue',
  },
  {
    key: 'restDay' as const,
    label: '休息日加班（不能补休）',
    rate: 2,
    rateText: '200%',
    legalBasis: '第四十四条第（二）项：休息日安排工作又不能安排补休的，支付不低于工资的 200% 的工资报酬。',
    color: 'gold',
  },
  {
    key: 'statutoryHoliday' as const,
    label: '法定节假日加班',
    rate: 3,
    rateText: '300%',
    legalBasis: '第四十四条第（三）项：法定休假日安排工作的，支付不低于工资的 300% 的工资报酬。',
    color: 'red',
  },
];

/** 常见月工资基数快捷输入 */
export const BASE_PRESETS = [3000, 5000, 8000, 12000, 20000];
