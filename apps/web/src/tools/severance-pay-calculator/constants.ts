import type { SeveranceScenario } from './utils/severance';

export const SCENARIO_OPTIONS: { value: SeveranceScenario; label: string; hint: string }[] = [
  {
    value: 'N',
    label: 'N：经济补偿金',
    hint: '协商一致解除、无过失性辞退、经济性裁员等《劳动合同法》第 46 条情形',
  },
  {
    value: 'N_PLUS_1',
    label: 'N+1：补偿 + 代通知金',
    hint: '第 40 条情形（医疗期满 / 不胜任 / 客观情况重大变化）且未提前 30 日书面通知',
  },
  {
    value: '2N',
    label: '2N：违法解除赔偿金',
    hint: '用人单位违反法律规定解除或终止劳动合同，按经济补偿标准的二倍支付（第 87 条）',
  },
];

export const DEFAULT_INPUTS = {
  years: 3,
  months: 4,
  monthlyWage: 10000,
  localAvgWage: null as number | null,
  scenario: 'N' as SeveranceScenario,
};
