/** 转换模式标识 */
export type JavaToolMode = 'field' | 'method' | 'name';

export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: JavaToolMode }> = [
  { label: '字段描述符', value: 'field' },
  { label: '方法描述符', value: 'method' },
  { label: '内部名 / 类名', value: 'name' },
];

export const DEFAULT_FIELD_DESCRIPTOR = '[[Ljava/lang/String;';

export const DEFAULT_METHOD_DESCRIPTOR = '(Ljava/lang/String;I)V';

export const DEFAULT_INTERNAL_NAME = 'java/util/Map$Entry';

/** 原始类型描述符速查表 */
export const PRIMITIVE_TABLE: ReadonlyArray<{ descriptor: string; source: string }> = [
  { descriptor: 'B', source: 'byte' },
  { descriptor: 'C', source: 'char' },
  { descriptor: 'D', source: 'double' },
  { descriptor: 'F', source: 'float' },
  { descriptor: 'I', source: 'int' },
  { descriptor: 'J', source: 'long' },
  { descriptor: 'S', source: 'short' },
  { descriptor: 'Z', source: 'boolean' },
  { descriptor: 'V', source: 'void' },
];
