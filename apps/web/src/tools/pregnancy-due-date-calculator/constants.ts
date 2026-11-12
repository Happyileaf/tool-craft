/**
 * 预产期计算器的静态配置
 */
import { DEFAULT_CYCLE_DAYS, MAX_CYCLE_DAYS, MIN_CYCLE_DAYS } from './utils/pregnancy';

export { DEFAULT_CYCLE_DAYS, MAX_CYCLE_DAYS, MIN_CYCLE_DAYS };

/** 模式选项 */
export const MODE_OPTIONS = [
  { label: '末次月经第一天（LMP，Naegele +280 天）', value: 'lmp' as const },
  { label: '已知排卵 / 受孕日（+266 天，自动反推 LMP）', value: 'ovulation' as const },
];

/** 三月期中文标签 */
export const TRIMESTER_LABELS: Record<number, string> = {
  1: '第一孕期（孕 1–13⁺⁶ 周）',
  2: '第二孕期（孕 14–27⁺⁶ 周）',
  3: '第三孕期（孕 28 周起）',
};

/** 固定免责声明，所有结果页常驻展示 */
export const MEDICAL_DISCLAIMER =
  '本工具仅基于标准日期算术（Naegele 规则与排卵日 +266 天）提供参考，不构成任何医疗诊断或建议；实际预产期、孕周与产检安排请以产检医院和专业医生的医嘱为准。';

/** 周期输入说明 */
export const CYCLE_HINT = `标准月经周期为 28 天，允许输入 ${MIN_CYCLE_DAYS}–${MAX_CYCLE_DAYS} 天；每偏离 1 天，预产期相应平移 1 天。`;
