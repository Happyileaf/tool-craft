import type { ChecksumAlgorithm, ChecksumMode } from './utils/checksum';

export interface AlgorithmOption {
  value: ChecksumAlgorithm;
  label: string;
  hint: string;
}

export const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  {
    value: 'verhoeff',
    label: 'Verhoeff',
    hint: '二面体群 D5 置换表，检出全部单字符错误与相邻换位错误',
  },
  {
    value: 'damm',
    label: 'Damm',
    hint: '反对称拟群拉丁方，单一校验位，同样检出换位错误',
  },
];

export interface ModeOption {
  value: ChecksumMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'generate', label: '生成校验位', hint: '为每行数字串追加一位校验位' },
  { value: 'validate', label: '校验合法性', hint: '末位视为校验位，校验整串是否合法并纠错' },
];

export const DEFAULT_INPUT = '123\n12345\n572';
