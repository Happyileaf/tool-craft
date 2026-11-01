export interface ModeOption {
  value: 'validate' | 'generate';
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'validate',
    label: '批量校验',
    hint: '每行一个完整 CAS RN，逐行给出合法性与正确校验位',
  },
  {
    value: 'generate',
    label: '补全校验位',
    hint: '输入两段主体（如 7732-18）自动补全末位，完整号则校验纠错',
  },
];

export const DEFAULT_INPUT = ['7732-18-5', '64-17-5', '58-08-2', '50-78-2', '7647-14-5'].join(
  '\n',
);
