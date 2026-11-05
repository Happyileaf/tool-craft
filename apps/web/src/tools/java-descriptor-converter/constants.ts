export type JvmToolMode = 'name' | 'field' | 'method';

export type ConvertDirection = 'toDescriptor' | 'fromDescriptor';

export interface ModeOption {
  value: JvmToolMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'name',
    label: '内部名 ↔ 源码类名',
    hint: 'JVMS §4.2.1：java/util/Map$Entry 与 java.util.Map.Entry 双向转换',
  },
  {
    value: 'field',
    label: '字段描述符',
    hint: 'JVMS §4.3.2：如 [[Ljava/lang/String;、I、Z 的生成与解析',
  },
  {
    value: 'method',
    label: '方法描述符',
    hint: 'JVMS §4.3.3：如 (Ljava/lang/String;I)V 的参数与返回类型拆解',
  },
];

/** 原始类型描述符速查（JVMS §4.3.2） */
export const PRIMITIVE_TABLE: Array<{ descriptor: string; source: string; meaning: string }> = [
  { descriptor: 'B', source: 'byte', meaning: '字节型（8 位有符号整数）' },
  { descriptor: 'C', source: 'char', meaning: '字符型（UTF-16 码元）' },
  { descriptor: 'D', source: 'double', meaning: '双精度浮点（64 位）' },
  { descriptor: 'F', source: 'float', meaning: '单精度浮点（32 位）' },
  { descriptor: 'I', source: 'int', meaning: '整型（32 位有符号整数）' },
  { descriptor: 'J', source: 'long', meaning: '长整型（64 位有符号整数）' },
  { descriptor: 'S', source: 'short', meaning: '短整型（16 位有符号整数）' },
  { descriptor: 'Z', source: 'boolean', meaning: '布尔型（true / false）' },
  { descriptor: 'V', source: 'void', meaning: '无返回值（仅用于方法返回类型）' },
];

export const DEFAULT_NAME_SOURCE = 'java.util.Map.Entry';
export const DEFAULT_NAME_INTERNAL = 'java/util/Map$Entry';
export const DEFAULT_FIELD_SOURCE = 'java.lang.String[][]';
export const DEFAULT_FIELD_DESCRIPTOR = '[[Ljava/lang/String;';
export const DEFAULT_METHOD_PARAMS = 'java.lang.String, int';
export const DEFAULT_METHOD_RETURN = 'void';
export const DEFAULT_METHOD_DESCRIPTOR = '(Ljava/lang/String;I)V';
