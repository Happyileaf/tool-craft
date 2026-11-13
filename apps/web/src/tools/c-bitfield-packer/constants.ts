/**
 * C 结构体位域打包 / 解包器工具内常量
 */
import type { BitOrder, StorageType } from './utils/bitfield';

/** 字段数量上限，超出后解析阶段直接报错 */
export const FIELD_LIMIT = 64;

/**
 * 默认字段定义文本：
 * 首行通过 # @order 指令声明 lsb-first 布局，flag/mode/addr 共占 16 位。
 */
export const DEFAULT_FIELD_DEFINITIONS = [
  '# @order lsb-first',
  '# 每行一个字段，语法：字段名:位宽',
  'flag:1',
  'mode:3',
  'addr:12',
].join('\n');

/** 默认字段赋值文本，每行一条 字段名=值（值支持 0x 十六进制前缀） */
export const DEFAULT_FIELD_VALUES = ['flag=1', 'mode=5', 'addr=0x123'].join('\n');

/** 存储单元类型选项 */
export interface StorageOption {
  /** 存储类型标识 */
  value: StorageType;
  /** 选项展示名称 */
  label: string;
  /** 总位宽 */
  bits: number;
}

/** 存储单元下拉选项，按位宽升序排列 */
export const STORAGE_OPTIONS: ReadonlyArray<StorageOption> = [
  { value: 'uint8', label: 'uint8（8 位）', bits: 8 },
  { value: 'uint16', label: 'uint16（16 位）', bits: 16 },
  { value: 'uint32', label: 'uint32（32 位）', bits: 32 },
  { value: 'uint64', label: 'uint64（64 位，BigInt）', bits: 64 },
];

/** 位序选项 */
export interface BitOrderOption {
  /** 位序标识 */
  value: BitOrder;
  /** 选项展示名称 */
  label: string;
  /** 布局规则说明 */
  description: string;
}

/** 位序单选选项，默认 lsb-first（常见 C 编译器行为） */
export const BIT_ORDER_OPTIONS: ReadonlyArray<BitOrderOption> = [
  {
    value: 'lsb-first',
    label: 'LSB-first（低位优先）',
    description: '字段按声明顺序从 bit0 向高位排列',
  },
  {
    value: 'msb-first',
    label: 'MSB-first（高位优先）',
    description: '第一个字段占据存储单元最高位，后续向低位排列',
  },
];
