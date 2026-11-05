import { describe, it, expect } from 'vitest';
import {
  sourceNameToInternal,
  internalToSourceName,
  parseFieldDescriptor,
  buildFieldDescriptor,
  parseMethodDescriptor,
  buildMethodDescriptor,
} from './jvmDescriptor';

describe('内部名 / 源码类名互转', () => {
  it('converts dotted source names to slash/$ binary names', () => {
    expect(sourceNameToInternal('java.util.Map.Entry')).toBe('java/util/Map$Entry');
    expect(sourceNameToInternal('java.lang.String')).toBe('java/lang/String');
    expect(sourceNameToInternal('com.example.Outer.Inner.Deep')).toBe(
      'com/example/Outer$Inner$Deep',
    );
    expect(sourceNameToInternal('Runnable')).toBe('Runnable');
  });

  it('converts binary names back to dotted source names', () => {
    expect(internalToSourceName('java/util/Map$Entry')).toBe('java.util.Map.Entry');
    expect(internalToSourceName('java/lang/String')).toBe('java.lang.String');
    expect(internalToSourceName('Runnable')).toBe('Runnable');
  });

  it('round-trips representative class names', () => {
    const sourceNames = [
      'java.util.HashMap',
      'java.util.Map.Entry',
      'com.acme.Outer.Inner',
      'java.util.function.Function',
    ];
    for (const name of sourceNames) {
      expect(internalToSourceName(sourceNameToInternal(name))).toBe(name);
    }
    // 内部名里的匿名类 $1 同样可还原为点分形式
    expect(internalToSourceName('com/acme/Outer$1')).toBe('com.acme.Outer.1');
  });

  it('rejects malformed internal names', () => {
    expect(() => internalToSourceName('java//lang/String')).toThrow(/连续/);
    expect(() => internalToSourceName('/java/lang/String')).toThrow(/开头或结尾/);
    expect(() => internalToSourceName('java/lang/String;')).toThrow(/保留字符/);
    expect(() => internalToSourceName('java/lang/')).toThrow(/开头或结尾/);
    expect(() => internalToSourceName('java/1lang/X')).toThrow(/命名规则/);
  });

  it('rejects empty class names', () => {
    expect(() => sourceNameToInternal('   ')).toThrow(/不能为空/);
  });
});

describe('字段描述符', () => {
  it('parses all eight primitive descriptors plus void', () => {
    const cases: Array<[string, string]> = [
      ['B', 'byte'],
      ['C', 'char'],
      ['D', 'double'],
      ['F', 'float'],
      ['I', 'int'],
      ['J', 'long'],
      ['S', 'short'],
      ['Z', 'boolean'],
      ['V', 'void'],
    ];
    for (const [descriptor, source] of cases) {
      const type = parseFieldDescriptor(descriptor);
      expect(type.sourceName).toBe(source);
      expect(type.arrayDimensions).toBe(0);
      expect(type.isReference).toBe(false);
    }
  });

  it('parses reference and array descriptors per JVMS §4.3.2', () => {
    const ref = parseFieldDescriptor('Ljava/lang/String;');
    expect(ref.sourceName).toBe('java.lang.String');
    expect(ref.baseType).toBe('java/lang/String');
    expect(ref.isReference).toBe(true);

    const array2 = parseFieldDescriptor('[[Ljava/lang/String;');
    expect(array2.sourceName).toBe('java.lang.String[][]');
    expect(array2.arrayDimensions).toBe(2);
    expect(array2.isReference).toBe(true);

    const primitiveArray = parseFieldDescriptor('[I');
    expect(primitiveArray.sourceName).toBe('int[]');
    expect(primitiveArray.arrayDimensions).toBe(1);

    const deepArray = parseFieldDescriptor('[[[Z');
    expect(deepArray.sourceName).toBe('boolean[][][]');
    expect(deepArray.arrayDimensions).toBe(3);
  });

  it('builds descriptors from source type names', () => {
    expect(buildFieldDescriptor({ sourceName: 'int' }).descriptor).toBe('I');
    expect(buildFieldDescriptor({ sourceName: 'java.lang.String' }).descriptor).toBe(
      'Ljava/lang/String;',
    );
    expect(buildFieldDescriptor({ sourceName: 'int[][]' }).descriptor).toBe('[[I');
    expect(buildFieldDescriptor({ sourceName: 'java.util.Map.Entry[]' }).descriptor).toBe(
      '[Ljava/util/Map$Entry;',
    );
  });

  it('parse and build are inverse operations', () => {
    const descriptors = ['I', 'Z', 'Ljava/lang/Object;', '[[D', '[Ljava/util/List;'];
    for (const descriptor of descriptors) {
      const parsed = parseFieldDescriptor(descriptor);
      const rebuilt = buildFieldDescriptor({ sourceName: parsed.sourceName });
      expect(rebuilt.descriptor).toBe(descriptor);
    }
  });

  it('reports concrete errors for illegal descriptors', () => {
    expect(() => parseFieldDescriptor('Ljava/lang/String')).toThrow(/;/);
    expect(() => parseFieldDescriptor('[')).toThrow(/意外结束/);
    expect(() => parseFieldDescriptor('X')).toThrow(/不是合法的字段类型标记/);
    expect(() => parseFieldDescriptor('II')).toThrow(/多余字符/);
    expect(() => buildFieldDescriptor({ sourceName: 'int[]x' })).toThrow(/方括号/);
  });
});

describe('方法描述符', () => {
  it('parses the idea acceptance vector (Ljava/lang/String;I)V', () => {
    const method = parseMethodDescriptor('(Ljava/lang/String;I)V');
    expect(method.parameters).toHaveLength(2);
    expect(method.parameters[0]?.sourceName).toBe('java.lang.String');
    expect(method.parameters[1]?.sourceName).toBe('int');
    expect(method.returnType.sourceName).toBe('void');
    expect(method.returnType.descriptor).toBe('V');
  });

  it('parses no-arg, array-arg and reference-return descriptors', () => {
    const noArg = parseMethodDescriptor('()V');
    expect(noArg.parameters).toEqual([]);
    expect(noArg.returnType.sourceName).toBe('void');

    const arrays = parseMethodDescriptor('([[I[Ljava/lang/String;)[D');
    expect(arrays.parameters[0]?.sourceName).toBe('int[][]');
    expect(arrays.parameters[1]?.sourceName).toBe('java.lang.String[]');
    expect(arrays.returnType.sourceName).toBe('double[]');

    const returns = parseMethodDescriptor('(JZ)Ljava/util/List;');
    expect(returns.parameters.map((p) => p.sourceName)).toEqual(['long', 'boolean']);
    expect(returns.returnType.sourceName).toBe('java.util.List');
  });

  it('builds method descriptors from source-style signatures', () => {
    const built = buildMethodDescriptor({
      parameterTypes: ['java.lang.String', 'int'],
      returnType: 'void',
    });
    expect(built.descriptor).toBe('(Ljava/lang/String;I)V');

    expect(
      buildMethodDescriptor({ parameterTypes: [], returnType: 'int' }).descriptor,
    ).toBe('()I');
    expect(
      buildMethodDescriptor({
        parameterTypes: ['byte[]', 'java.util.Map.Entry'],
        returnType: 'java.lang.Object[][]',
      }).descriptor,
    ).toBe('([BLjava/util/Map$Entry;)[[Ljava/lang/Object;');
  });

  it('parse and build round-trip method descriptors', () => {
    const samples = [
      '()V',
      '(Ljava/lang/String;I)V',
      '([[I[Ljava/lang/String;)[D',
      '(JZ)Ljava/util/List;',
      '(B C D F I J S Z)V'.replace(/ /g, ''),
    ];
    for (const descriptor of samples) {
      const parsed = parseMethodDescriptor(descriptor);
      const rebuilt = buildMethodDescriptor({
        parameterTypes: parsed.parameters.map((p) => p.sourceName),
        returnType: parsed.returnType.sourceName,
      });
      expect(rebuilt.descriptor).toBe(descriptor);
    }
  });

  it('rejects malformed method descriptors with targeted messages', () => {
    expect(() => parseMethodDescriptor('V)V')).toThrow(/以 \( 开头/);
    expect(() => parseMethodDescriptor('(I')).toThrow(/右括号/);
    expect(() => parseMethodDescriptor('(I)')).toThrow(/返回类型/);
    expect(() => parseMethodDescriptor('(X)V')).toThrow(/不是合法的字段类型标记/);
  });
});
