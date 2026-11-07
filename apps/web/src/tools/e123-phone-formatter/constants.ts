import type { SeparatorStyle } from './utils/e123';

/** 分隔符选项（供 antd Radio / Select 使用） */
export const SEPARATOR_OPTIONS: ReadonlyArray<{ label: string; value: SeparatorStyle }> = [
  { label: '空格（E.123 推荐）', value: 'space' },
  { label: '点号', value: 'dot' },
  { label: '连字符', value: 'hyphen' },
];

export const DEFAULT_PHONE_INPUT = '+86 138-0013-8000';

export const SAMPLE_PHONES: readonly string[] = [
  '+86 138 0013 8000',
  '+1 (555) 123-4567',
  '+852 9123 4567',
  '(042) 123 4567',
];
