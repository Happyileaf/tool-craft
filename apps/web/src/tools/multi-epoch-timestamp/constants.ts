import type { EpochKey } from './utils/epochs';

export interface EpochOption {
  value: EpochKey;
  label: string;
}

export const EPOCH_SELECT_OPTIONS: EpochOption[] = [
  { value: 'unix-sec', label: 'Unix 秒（10 位常见）' },
  { value: 'unix-ms', label: 'Unix 毫秒（13 位，JS Date）' },
  { value: 'unix-us', label: 'Unix 微秒（16 位）' },
  { value: 'unix-ns', label: 'Unix 纳秒（19 位）' },
  { value: 'filetime', label: 'Windows FILETIME（100ns，自 1601）' },
  { value: 'dotnet-ticks', label: '.NET Ticks（100ns，自 0001）' },
  { value: 'chrome', label: 'Chrome / WebKit 微秒（自 1601）' },
  { value: 'cocoa', label: 'Apple Cocoa 秒（自 2001）' },
];

export const DEFAULT_TIMESTAMP = '125911584000000000';
export const DEFAULT_SOURCE: EpochKey = 'filetime';
