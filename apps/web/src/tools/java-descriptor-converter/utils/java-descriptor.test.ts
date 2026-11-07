import { describe, it, expect } from 'vitest';
import {
  buildMethodDescriptor,
  fieldDescriptorToSource,
  internalNameToSource,
  methodDescriptorToSignature,
  parseFieldDescriptor,
  parseMethodDescriptor,
  parseSourceType,
  sourceToFieldDescriptor,
  sourceToInternalName,
  typeToDescriptor,
  typeToSource,
} from './java-descriptor';

describe('内部名 ↔ 源码类名', () => {
  it('内部名转源码类名，含内部类 $', () => {
    expect(internalNameToSource('java/util/Map$Entry')).toBe('java.util.Map.Entry');
    expect(internalNameToSource('java/lang/String')).toBe('java.lang.String');
    expect(internalNameToSource('  com/acme/Foo  ')).toBe('com.acme.Foo');
  });

  it('源码类名转内部名（点号统一映射为斜杠；嵌套类按 JVMS 二进制名以 $ 显式书写）', () => {
    // 源码全限定名的点号同时承担包分隔与嵌套类分隔，无歧义信息时统一映射为 /
    expect(sourceToInternalName('java.util.Map.Entry')).toBe('java/util/Map/Entry');
    expect(sourceToInternalName('java.lang.String')).toBe('java/lang/String');
    // 已知嵌套类时按 JVMS 二进制名显式写 $（点号仍映射为包分隔斜杠）
    expect(sourceToInternalName('java.util.Map$Entry')).toBe('java/util/Map$Entry');
  });

  it('非法分隔与描述符字符报错', () => {
    expect(() => internalNameToSource('')).toThrow('不能为空');
    expect(() => internalNameToSource('/a/B')).toThrow('斜杠');
    expect(() => internalNameToSource('a//B')).toThrow('斜杠');
    expect(() => internalNameToSource('a/B;')).toThrow('描述符字符');
    expect(() => sourceToInternalName('a..B')).toThrow('点号');
  });
});

describe('字段描述符解析', () => {
  it('原始类型', () => {
    expect(parseFieldDescriptor('I')).toMatchObject({ isPrimitive: true, primitive: 'int', arrayDimensions: 0 });
    expect(parseFieldDescriptor('Z').primitive).toBe('boolean');
    expect(parseFieldDescriptor('J').primitive).toBe('long');
    expect(parseFieldDescriptor('V').primitive).toBe('void');
  });

  it('引用类型与数组', () => {
    expect(parseFieldDescriptor('Ljava/lang/String;')).toMatchObject({
      isPrimitive: false,
      className: 'java.lang.String',
      arrayDimensions: 0,
    });
    expect(parseFieldDescriptor('[[Ljava/lang/String;')).toMatchObject({
      className: 'java.lang.String',
      arrayDimensions: 2,
    });
    expect(parseFieldDescriptor('[I')).toMatchObject({ primitive: 'int', arrayDimensions: 1 });
    expect(parseFieldDescriptor('[Z').arrayDimensions).toBe(1);
  });

  it('转源码写法', () => {
    expect(fieldDescriptorToSource('[[Ljava/lang/String;')).toBe('java.lang.String[][]');
    expect(fieldDescriptorToSource('[I')).toBe('int[]');
    expect(fieldDescriptorToSource('D')).toBe('double');
  });

  it('非法描述符给出位置信息', () => {
    expect(() => parseFieldDescriptor('')).toThrow('不能为空');
    expect(() => parseFieldDescriptor('[')).toThrow('元素类型');
    expect(() => parseFieldDescriptor('Lfoo/')).toThrow('分号');
    expect(() => parseFieldDescriptor('L;')).toThrow('类名为空');
    expect(() => parseFieldDescriptor('X')).toThrow('非法描述符字符');
    expect(() => parseFieldDescriptor('II')).toThrow('多余字符');
    expect(() => parseFieldDescriptor('[V')).toThrow('void');
  });
});

describe('源码类型解析与往返', () => {
  it('解析源码数组', () => {
    expect(parseSourceType('int[]')).toMatchObject({ primitive: 'int', arrayDimensions: 1 });
    expect(parseSourceType('java.lang.String[][]').className).toBe('java.lang.String');
  });

  it('源码 → 描述符 → 源码 往返一致', () => {
    const samples = ['int', 'boolean', 'long[]', 'java.lang.String', 'java.util.List[][]', 'byte[][][]'];
    for (const sample of samples) {
      const descriptor = sourceToFieldDescriptor(sample);
      expect(fieldDescriptorToSource(descriptor)).toBe(sample);
    }
  });

  it('结构化类型渲染', () => {
    const type = parseFieldDescriptor('[[Ljava/util/List;');
    expect(typeToDescriptor(type)).toBe('[[Ljava/util/List;');
    expect(typeToSource(type)).toBe('java.util.List[][]');
  });

  it('错误的数组括号位置报错', () => {
    expect(() => parseSourceType('int[')).toThrow('方括号');
    expect(() => parseSourceType('int[]x')).toThrow('方括号');
    expect(() => parseSourceType('void[]')).toThrow('void');
  });
});

describe('方法描述符（JVMS §4.3.3）', () => {
  it('解析参数与返回类型', () => {
    const parsed = parseMethodDescriptor('(Ljava/lang/String;I)V');
    expect(parsed.parameters).toHaveLength(2);
    expect(parsed.parameters[0]!.className).toBe('java.lang.String');
    expect(parsed.parameters[1]!).toMatchObject({ primitive: 'int' });
    expect(parsed.returnType.primitive).toBe('void');
  });

  it('无参、数组参数与引用返回', () => {
    const noArg = parseMethodDescriptor('()Ljava/lang/String;');
    expect(noArg.parameters).toHaveLength(0);
    expect(noArg.returnType.className).toBe('java.lang.String');

    const arrays = parseMethodDescriptor('([I[[Z)D');
    expect(arrays.parameters[0]).toMatchObject({ primitive: 'int', arrayDimensions: 1 });
    expect(arrays.parameters[1]).toMatchObject({ primitive: 'boolean', arrayDimensions: 2 });
    expect(arrays.returnType.primitive).toBe('double');
  });

  it('生成与可读签名', () => {
    expect(buildMethodDescriptor(['java.lang.String', 'int'], 'void')).toBe('(Ljava/lang/String;I)V');
    expect(buildMethodDescriptor([], 'java.lang.String')).toBe('()Ljava/lang/String;');
    expect(buildMethodDescriptor(['int[]', 'boolean'], 'long')).toBe('([IZ)J');
    expect(methodDescriptorToSignature('(Ljava/lang/String;I)V')).toBe(
      '(java.lang.String, int) -> void',
    );
  });

  it('非法方法描述符报错', () => {
    expect(() => parseMethodDescriptor('')).toThrow('不能为空');
    expect(() => parseMethodDescriptor('V)V')).toThrow('"("');
    expect(() => parseMethodDescriptor('(I')).toThrow('")"');
    expect(() => parseMethodDescriptor('(V)V')).toThrow('非法参数类型');
    expect(() => parseMethodDescriptor('(I)')).toThrow('返回类型');
    expect(() => parseMethodDescriptor('(Ljava/lang/StringI)V')).toThrow('分号');
  });
});
