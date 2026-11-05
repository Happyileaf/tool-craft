/**
 * Java 字节码名称与描述符（JVMS §4.2 / §4.3）零依赖纯函数实现。
 *
 * 覆盖：
 * - 内部名（binary name，'/' 分隔，内部类用 '$'）与源码类名（'.' 分隔）互转
 * - 字段描述符（field descriptor）生成与解析，含数组维度与全部原始类型
 * - 方法描述符（method descriptor）生成与解析，含参数列表与返回类型
 * 所有非法输入抛出带具体原因的 Error。
 */

/** JVMS §4.3.2 原始类型描述符 */
const PRIMITIVE_DESCRIPTORS: Record<string, string> = {
  B: 'byte',
  C: 'char',
  D: 'double',
  F: 'float',
  I: 'int',
  J: 'long',
  S: 'short',
  Z: 'boolean',
  V: 'void',
};

const PRIMITIVE_SOURCE_TO_DESCRIPTOR: Record<string, string> = {
  byte: 'B',
  char: 'C',
  double: 'D',
  float: 'F',
  int: 'I',
  long: 'J',
  short: 'S',
  boolean: 'Z',
  void: 'V',
};

export interface JvmType {
  /** 源码风格类型名，如 int、java.lang.String[][] */
  sourceName: string;
  /** 描述符，如 I、[Ljava/lang/String; */
  descriptor: string;
  /** 数组维度，非数组为 0 */
  arrayDimensions: number;
  /** 去掉数组后的基础类型：原始类型名或引用类型内部名（'/' 分隔） */
  baseType: string;
  /** 是否引用类型（含数组的引用语义） */
  isReference: boolean;
}

// ---------------------------------------------------------------------------
// 内部名 / 源码类名互转（JVMS §4.2.1）
// ---------------------------------------------------------------------------

/**
 * 源码类名（java.util.Map.Entry）→ 内部名（java/util/Map$Entry）。
 * 规则：顶层包分隔 '.' 换 '/'，类与其内部类之间的 '.' 换 '$'。
 * 由于源码名本身不区分包点与嵌套点，约定：
 * 全大写段或首字母大写段视为类名的一部分（首个大写段起的点都转 '$'）。
 */
export function sourceNameToInternal(sourceName: string): string {
  const trimmed = sourceName.trim();
  if (trimmed === '') throw new Error('类名不能为空');
  const parts = trimmed.split('.');
  let firstClassIndex = parts.findIndex((part) => part.length > 0 && /^[A-Z]/.test(part));
  if (firstClassIndex === -1) {
    // 全小写（如奇怪的包名）：整体视为包路径
    firstClassIndex = parts.length;
  }
  const packageParts = parts.slice(0, firstClassIndex);
  const classParts = parts.slice(firstClassIndex);
  const segments: string[] = [];
  if (packageParts.length > 0) segments.push(packageParts.join('/'));
  if (classParts.length > 0) segments.push(classParts.join('$'));
  const internal = segments.join('/');
  validateInternalName(internal);
  return internal;
}

/**
 * 内部名（java/util/Map$Entry）→ 源码类名（java.util.Map.Entry）。
 */
export function internalToSourceName(internalName: string): string {
  const trimmed = internalName.trim();
  validateInternalName(trimmed);
  return trimmed.replace(/\//g, '.').replace(/\$/g, '.');
}

function validateInternalName(name: string): void {
  if (name === '') throw new Error('内部名不能为空');
  if (name.startsWith('/') || name.endsWith('/')) {
    throw new Error(`非法内部名「${name}」：不能以 / 开头或结尾`);
  }
  if (name.includes('//')) {
    throw new Error(`非法内部名「${name}」：存在连续的 /`);
  }
  if (/\.\s*\./.test(name) || name.includes(';') || name.includes('[')) {
    throw new Error(`非法内部名「${name}」：包含 . ; [ 等保留字符`);
  }
  const simpleNames = name.split(/[/$]/);
  for (const simple of simpleNames) {
    if (simple === '') {
      throw new Error(`非法内部名「${name}」：存在空的类名或包名段`);
    }
    // 纯数字段对应匿名内部类编号（如 Outer$1），是合法的字节码简单名
    const isAnonymousNumber = /^[0-9]+$/.test(simple);
    if (!isAnonymousNumber && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(simple)) {
      throw new Error(`非法内部名「${name}」：标识符「${simple}」不符合 Java 命名规则`);
    }
  }
}

// ---------------------------------------------------------------------------
// 字段描述符（JVMS §4.3.2）
// ---------------------------------------------------------------------------

/** 解析单个类型描述符，返回类型信息与消费掉的字符长度 */
function parseSingleFieldDescriptor(descriptor: string, start: number): {
  type: JvmType;
  next: number;
} {
  let index = start;
  let dimensions = 0;
  while (descriptor.charAt(index) === '[') {
    dimensions += 1;
    index += 1;
    if (dimensions > 255) {
      throw new Error(`描述符「${descriptor}」数组维度超过 255（位置 ${start}）`);
    }
  }
  if (index >= descriptor.length) {
    throw new Error(`描述符「${descriptor}」在位置 ${index} 意外结束，缺少数组元素类型`);
  }

  const marker = descriptor.charAt(index);
  let baseSource: string;
  let baseInternal: string;
  let isReference: boolean;

  if (marker === 'L') {
    const end = descriptor.indexOf(';', index);
    if (end === -1) {
      throw new Error(`描述符「${descriptor}」缺少引用类型结尾的 ;（位置 ${index}）`);
    }
    baseInternal = descriptor.substring(index + 1, end);
    validateInternalName(baseInternal);
    baseSource = internalToSourceName(baseInternal);
    isReference = true;
    index = end + 1;
  } else if (marker in PRIMITIVE_DESCRIPTORS) {
    baseSource = PRIMITIVE_DESCRIPTORS[marker] ?? marker;
    baseInternal = marker;
    isReference = false;
    index += 1;
  } else {
    throw new Error(
      `描述符「${descriptor}」位置 ${index} 的字符「${marker}」不是合法的字段类型标记`,
    );
  }

  const descriptorText = descriptor.substring(start, index);
  return {
    type: {
      sourceName: baseSource + '[]'.repeat(dimensions),
      descriptor: descriptorText,
      arrayDimensions: dimensions,
      baseType: isReference ? baseInternal : baseSource,
      isReference: dimensions > 0 || isReference,
    },
    next: index,
  };
}

/** 解析完整字段描述符（如 [[Ljava/lang/String;、I、Z） */
export function parseFieldDescriptor(descriptor: string): JvmType {
  const trimmed = descriptor.trim();
  if (trimmed === '') throw new Error('字段描述符不能为空');
  const { type, next } = parseSingleFieldDescriptor(trimmed, 0);
  if (next !== trimmed.length) {
    throw new Error(`字段描述符「${trimmed}」在位置 ${next} 之后存在多余字符`);
  }
  return type;
}

export interface FieldDescriptorInput {
  /** 源码类型名，如 int、java.lang.String、boolean[][] */
  sourceName: string;
}

/** 由源码风格类型名生成字段描述符 */
export function buildFieldDescriptor(input: FieldDescriptorInput): JvmType {
  const sourceName = input.sourceName.trim();
  if (sourceName === '') throw new Error('类型名不能为空');

  let dimensions = 0;
  let base = sourceName;
  while (base.endsWith('[]')) {
    dimensions += 1;
    base = base.slice(0, -2).trim();
    if (dimensions > 255) throw new Error('数组维度不能超过 255');
  }
  if (base.includes('[]') || base.includes(';') || base.includes('[')) {
    throw new Error(`非法类型名「${sourceName}」：数组方括号只能成对出现在末尾`);
  }

  let descriptor: string;
  let baseInternal: string;
  let isReference: boolean;
  const primitive = PRIMITIVE_SOURCE_TO_DESCRIPTOR[base];
  if (primitive !== undefined) {
    descriptor = primitive;
    baseInternal = base;
    isReference = false;
  } else {
    baseInternal = sourceNameToInternal(base);
    descriptor = `L${baseInternal};`;
    isReference = true;
  }

  return {
    sourceName: base + '[]'.repeat(dimensions),
    descriptor: '['.repeat(dimensions) + descriptor,
    arrayDimensions: dimensions,
    baseType: isReference ? baseInternal : base,
    isReference: dimensions > 0 || isReference,
  };
}

// ---------------------------------------------------------------------------
// 方法描述符（JVMS §4.3.3）
// ---------------------------------------------------------------------------

export interface MethodDescriptor {
  /** 完整方法描述符，如 (Ljava/lang/String;I)V */
  descriptor: string;
  /** 参数类型列表（按声明顺序） */
  parameters: JvmType[];
  /** 返回类型；void 方法返回 void 类型 */
  returnType: JvmType;
}

/** 解析方法描述符，拆解参数类型列表与返回类型 */
export function parseMethodDescriptor(descriptor: string): MethodDescriptor {
  const trimmed = descriptor.trim();
  if (trimmed === '') throw new Error('方法描述符不能为空');
  if (trimmed.charAt(0) !== '(') {
    throw new Error(`方法描述符「${trimmed}」必须以 ( 开头`);
  }
  const closeIndex = trimmed.indexOf(')');
  if (closeIndex === -1) {
    throw new Error(`方法描述符「${trimmed}」缺少右括号 )`);
  }

  const parameters: JvmType[] = [];
  let index = 1;
  while (index < closeIndex) {
    const parsed = parseSingleFieldDescriptor(trimmed, index);
    parameters.push(parsed.type);
    index = parsed.next;
  }
  if (index !== closeIndex) {
    throw new Error(`方法描述符「${trimmed}」括号内存在无法解析的字符`);
  }

  const returnStart = closeIndex + 1;
  if (returnStart >= trimmed.length) {
    throw new Error(`方法描述符「${trimmed}」缺少返回类型`);
  }
  const returnParsed = parseSingleFieldDescriptor(trimmed, returnStart);
  if (returnParsed.next !== trimmed.length) {
    throw new Error(`方法描述符「${trimmed}」返回类型之后存在多余字符`);
  }

  return {
    descriptor: trimmed,
    parameters,
    returnType: returnParsed.type,
  };
}

export interface MethodDescriptorInput {
  /** 参数的源码类型名列表，如 ['java.lang.String', 'int'] */
  parameterTypes: string[];
  /** 返回值源码类型名，void 方法传 'void' */
  returnType: string;
}

/** 由源码风格的参数与返回类型生成方法描述符 */
export function buildMethodDescriptor(input: MethodDescriptorInput): MethodDescriptor {
  if (input.parameterTypes.length > 255) {
    throw new Error('方法参数数量不能超过 255');
  }
  const parameters = input.parameterTypes.map((name) =>
    buildFieldDescriptor({ sourceName: name }),
  );
  const returnType = buildFieldDescriptor({ sourceName: input.returnType });
  const descriptor = `(${parameters.map((type) => type.descriptor).join('')})${returnType.descriptor}`;
  return { descriptor, parameters, returnType };
}
