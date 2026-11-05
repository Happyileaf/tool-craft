import type { UpcDirection } from './utils/upcE';

export interface DirectionOption {
  value: UpcDirection;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'a-to-e', label: 'UPC-A → UPC-E（压缩）', hint: '12 位标准码压缩为 8 位短码' },
  { value: 'e-to-a', label: 'UPC-E → UPC-A（展开）', hint: '8 位短码展开为 12 位标准码' },
];

export const DEFAULT_INPUT_A_TO_E = '012000003455\n052000003451\n012345000058';

export const DEFAULT_INPUT_E_TO_A = '01234505\n05234541\n01234558';
