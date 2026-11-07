/**
 * Java 字节码名称与描述符（JVMS §4.2 / §4.3 / §4.3.3）双向转换纯函数。
 *
 * 全部函数不依赖 DOM，可在主线程直接运行；非法输入抛出带位置信息的 Error。
 */

/** 原始类型描述符单字符 →  Java 源码类型关键字 */
const PRIMITIVE_TO_SOURCE: Record<string, string> = {
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

/** Java 源码原始类型关键字 → 描述符单字符 */
const SOURCE_TO_PRIMITIVE: Record<string, string> = Object.fromEntries(
  Object.entries(PRIMITIVE_TO_SOURCE).map(([descriptor, source]) => [source, descriptor]),
);

/** 一个解析后的 Java 类型：原始类型或引用类型（含数组维度） */
export interface JavaType {
  /** 数组维度，0 表示非数组 */
  arrayDimensions: number;
  /** 是否为原始类型（含 void）；false 表示引用类型 */
  isPrimitive: boolean;
  /** 原始类型关键字（isPrimitive 为 true 时），如 "int"、"void" */
  primitive?: string;
  /** 引用类型的源码全限定名（isPrimitive 为 false 时），点号分隔，如 "java.util.Map.Entry" */
  className?: string;
}

/**
 * 内部名（binary name，斜杠分隔）转源码类名（点号分隔）。
 *
 * @param internalName - JVM 内部名，如 `java/util/Map$Entry`
 * @returns 源码全限定名，如 `java.util.Map.Entry`
 * @throws 输入为空或含非法字符时抛错
 */
export function internalNameToSource(internalName: string): string {
  const trimmed = internalName.trim();
  if (!trimmed) {
    throw new Error('内部名不能为空');
  }
  if (trimmed.startsWith('/') || trimmed.endsWith('/') || trimmed.includes('//')) {
    throw new Error('内部名含非法的斜杠分隔（空段或首尾斜杠）');
  }
  if (/[;.\[]/.test(trimmed)) {
    throw new Error('内部名只能包含标识符、$ 与 / 分隔符，不能出现 ; . [ 等描述符字符');
  }
  // JVMS 二进制名以 / 分隔包/类、以 $ 标记嵌套类；源码写法两者都渲染为点号
  return trimmed.replace(/[/$]/g, '.');
}

/**
 * 源码类名（点号分隔）转内部名（斜杠分隔）。
 *
 * @param sourceName - 源码全限定名，如 `java.util.Map.Entry`
 * @returns JVM 内部名，如 `java/util/Map$Entry`
 * @throws 输入为空或含非法字符时抛错
 */
export function sourceToInternalName(sourceName: string): string {
  const trimmed = sourceName.trim();
  if (!trimmed) {
    throw new Error('类名不能为空');
  }
  if (trimmed.startsWith('.') || trimmed.endsWith('.') || trimmed.includes('..')) {
    throw new Error('类名含非法的点号分隔（空段或首尾点号）');
  }
  if (/[;/\[]/.test(trimmed)) {
    throw new Error('源码类名不能出现 ; / [ 等描述符字符');
  }
  return trimmed.replace(/\./g, '/');
}

/**
 * 解析单个字段描述符（可能带数组前缀），返回结构化类型。
 *
 * @param descriptor - 字段描述符，如 `[[Ljava/lang/String;`、`I`、`Z`
 * @returns 解析后的类型结构
 * @throws 描述符非法时抛出含字符位置的错误
 */
export function parseFieldDescriptor(descriptor: string): JavaType {
  const input = descriptor.trim();
  if (!input) {
    throw new Error('描述符不能为空');
  }
  let index = 0;
  let arrayDimensions = 0;
  while (index < input.length && input[index] === '[') {
    arrayDimensions += 1;
    index += 1;
    if (arrayDimensions > 255) {
      throw new Error(`数组维度不能超过 255（位置 ${index}）`);
    }
  }
  if (index >= input.length) {
    throw new Error(`描述符在位置 ${index} 处缺少元素类型`);
  }
  const marker = input[index] as string;

  if (marker === 'L') {
    const end = input.indexOf(';', index);
    if (end === -1) {
      throw new Error(`引用类型描述符缺少结尾分号（从位置 ${index} 开始）`);
    }
    const internal = input.slice(index + 1, end);
    if (!internal) {
      throw new Error(`引用类型类名为空（位置 ${index}）`);
    }
    if (internal.startsWith('/') || internal.endsWith('/') || internal.includes('//')) {
      throw new Error(`引用类型内部名含非法斜杠分隔（位置 ${index}）`);
    }
    if (/[;[\].]/.test(internal)) {
      throw new Error(`引用类型内部名含非法字符（位置 ${index}）`);
    }
    if (end !== input.length - 1) {
      throw new Error(`描述符在位置 ${end + 1} 之后存在多余字符`);
    }
    return {
      arrayDimensions,
      isPrimitive: false,
      className: internalNameToSource(internal),
    };
  }

  const primitive = PRIMITIVE_TO_SOURCE[marker];
  if (!primitive) {
    throw new Error(`位置 ${index} 处出现非法描述符字符 "${marker}"`);
  }
  if (index !== input.length - 1) {
    throw new Error(`描述符在位置 ${index + 1} 之后存在多余字符`);
  }
  if (primitive === 'void' && arrayDimensions > 0) {
    throw new Error('void 不能作为数组元素类型');
  }
  return { arrayDimensions, isPrimitive: true, primitive };
}

/**
 * 把结构化类型渲染为 Java 源码写法（数组后缀放变量名一侧）。
 *
 * @param type - 解析后的类型
 * @returns 源码类型，如 `java.lang.String[][]`、`int[]`
 */
export function typeToSource(type: JavaType): string {
  const base = type.isPrimitive ? type.primitive : type.className;
  return `${base}${'[]'.repeat(type.arrayDimensions)}`;
}

/**
 * 把结构化类型渲染为字段描述符。
 *
 * @param type - 解析后的类型
 * @returns 字段描述符，如 `[[Ljava/lang/String;`、`I`
 */
export function typeToDescriptor(type: JavaType): string {
  const arrayPrefix = '['.repeat(type.arrayDimensions);
  if (type.isPrimitive) {
    const marker = SOURCE_TO_PRIMITIVE[type.primitive ?? ''];
    if (!marker) {
      throw new Error(`未知原始类型 ${type.primitive}`);
    }
    return `${arrayPrefix}${marker}`;
  }
  return `${arrayPrefix}L${sourceToInternalName(type.className ?? '')};`;
}

/** 字段描述符 → Java 源码类型的便捷封装。 */
export function fieldDescriptorToSource(descriptor: string): string {
  return typeToSource(parseFieldDescriptor(descriptor));
}

/** Java 源码类型 → 字段描述符的便捷封装。 */
export function sourceToFieldDescriptor(sourceType: string): string {
  return typeToDescriptor(parseSourceType(sourceType));
}

/**
 * 解析 Java 源码类型写法（支持 `int[]`、`java.lang.String[][]`）。
 *
 * @param sourceType - 源码类型
 * @returns 结构化类型
 */
export function parseSourceType(sourceType: string): JavaType {
  const trimmed = sourceType.trim();
  if (!trimmed) {
    throw new Error('类型不能为空');
  }
  let base = trimmed;
  let arrayDimensions = 0;
  while (base.endsWith('[]')) {
    arrayDimensions += 1;
    base = base.slice(0, -2).trim();
    if (arrayDimensions > 255) {
      throw new Error('数组维度不能超过 255');
    }
  }
  if (base.includes('[')) {
    throw new Error('数组方括号只能成对出现在类型末尾');
  }
  const primitive = SOURCE_TO_PRIMITIVE[base];
  if (primitive) {
    if (base === 'void' && arrayDimensions > 0) {
      throw new Error('void 不能作为数组元素类型');
    }
    return { arrayDimensions, isPrimitive: true, primitive: base };
  }
  if (base.startsWith('.') || base.endsWith('.') || base.includes('..')) {
    throw new Error('类名含非法的点号分隔');
  }
  if (/[;/\[\]]/.test(base)) {
    throw new Error('类名含非法字符');
  }
  return { arrayDimensions, isPrimitive: false, className: base };
}

/** 解析后的方法描述符 */
export interface MethodDescriptor {
  /** 参数类型列表（按声明顺序） */
  parameters: JavaType[];
  /** 返回类型 */
  returnType: JavaType;
}

/**
 * 解析方法描述符（JVMS §4.3.3），如 `(Ljava/lang/String;I)V`。
 *
 * @param descriptor - 方法描述符
 * @returns 参数与返回类型结构
 * @throws 描述符非法时抛出含位置的错误
 */
export function parseMethodDescriptor(descriptor: string): MethodDescriptor {
  const input = descriptor.trim();
  if (!input) {
    throw new Error('方法描述符不能为空');
  }
  if (input[0] !== '(') {
    throw new Error('方法描述符必须以 "(" 开头');
  }
  const closeParen = input.indexOf(')');
  if (closeParen === -1) {
    throw new Error('方法描述符缺少 ")"');
  }
  const parameters: JavaType[] = [];
  let cursor = 1;
  while (cursor < closeParen) {
    const consumed = consumeOneType(input, cursor, closeParen);
    parameters.push(consumed.type);
    cursor = consumed.next;
  }
  if (cursor !== closeParen) {
    throw new Error(`参数列表解析在位置 ${cursor} 与 ")" 不一致`);
  }
  const returnSection = input.slice(closeParen + 1);
  if (!returnSection) {
    throw new Error('方法描述符缺少返回类型');
  }
  const returnType = parseFieldDescriptor(returnSection);
  return { parameters, returnType };
}

/**
 * 从指定位置消费一个字段类型（含数组前缀），返回类型与下一游标。
 *
 * @param input - 完整方法描述符
 * @param start - 当前元素起始下标
 * @param limit - 参数区右边界 ")" 下标
 */
function consumeOneType(input: string, start: number, limit: number): { type: JavaType; next: number } {
  let cursor = start;
  let dimensions = 0;
  while (cursor < limit && input[cursor] === '[') {
    dimensions += 1;
    cursor += 1;
  }
  if (cursor >= limit) {
    throw new Error(`位置 ${start} 的数组缺少元素类型`);
  }
  const marker = input[cursor] as string;
  if (marker === 'L') {
    const end = input.indexOf(';', cursor);
    if (end === -1 || end >= limit) {
      throw new Error(`位置 ${cursor} 的引用类型缺少结尾分号`);
    }
    const internal = input.slice(cursor + 1, end);
    const type: JavaType = {
      arrayDimensions: dimensions,
      isPrimitive: false,
      className: internalNameToSource(internal),
    };
    return { type, next: end + 1 };
  }
  const primitive = PRIMITIVE_TO_SOURCE[marker];
  if (!primitive || primitive === 'void') {
    throw new Error(`位置 ${cursor} 出现非法参数类型字符 "${marker}"`);
  }
  return {
    type: { arrayDimensions: dimensions, isPrimitive: true, primitive },
    next: cursor + 1,
  };
}

/**
 * 由参数与返回类型生成方法描述符。
 *
 * @param parameterSources - 参数的源码类型写法
 * @param returnSource - 返回类型源码写法（"void" 表示无返回值）
 * @returns 方法描述符，如 `(Ljava/lang/String;I)V`
 */
export function buildMethodDescriptor(parameterSources: string[], returnSource: string): string {
  const params = parameterSources.map((each) => typeToDescriptor(parseSourceType(each))).join('');
  const returnType = typeToDescriptor(parseSourceType(returnSource));
  return `(${params})${returnType}`;
}

/**
 * 把方法描述符渲染为可读的源码签名片段（不含方法名）。
 *
 * @param descriptor - 方法描述符
 * @returns 如 `(java.lang.String, int) -> void`
 */
export function methodDescriptorToSignature(descriptor: string): string {
  const { parameters, returnType } = parseMethodDescriptor(descriptor);
  return `(${parameters.map(typeToSource).join(', ')}) -> ${typeToSource(returnType)}`;
}
