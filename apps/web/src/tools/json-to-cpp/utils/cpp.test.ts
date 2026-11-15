import { describe, expect, it } from 'vitest';
import { jsonToCpp } from './cpp';

/**
 * 去掉空白，便于断言生成的代码片段而不受缩进影响
 *
 * @param text - 源码文本
 * @returns 去除全部空白后的文本
 */
function compact(text: string): string {
  return text.replace(/\s+/g, '');
}

describe('jsonToCpp', () => {
  it('为基本类型推断生成 int32_t / std::string / bool / double 字段', () => {
    const { code } = jsonToCpp('{"id":1,"name":"a","active":true,"score":1.5}');
    expect(code).toContain('struct Root {');
    expect(compact(code)).toContain('int32_tid;');
    expect(compact(code)).toContain('std::stringname;');
    expect(compact(code)).toContain('boolactive;');
    expect(compact(code)).toContain('doublescore;');
    expect(code).toContain('#include <cstdint>');
    expect(code).toContain('#include <string>');
  });

  it('缺失字段生成 std::optional，全量出现时生成裸类型', () => {
    const partial = jsonToCpp('[{"id":1},{"id":2,"name":"b"}]');
    expect(compact(partial.code)).toContain('std::optional<std::string>name;');
    expect(compact(partial.code)).toContain('int32_tid;');

    const full = jsonToCpp('[{"id":1,"name":"a"},{"id":2,"name":"b"}]');
    expect(compact(full.code)).toContain('std::stringname;');
    expect(compact(full.code)).not.toContain('std::optional<std::string>name;');
  });

  it('内部对象数组生成 std::vector<Item> 与嵌套 struct', () => {
    const { code } = jsonToCpp('[{"x":1},{"x":2}]');
    expect(compact(code)).toContain('usingRoot=std::vector<Item>;');
    expect(code).toContain('struct Item {');
    expect(compact(code)).toContain('int32_tx;');
    expect(code).toContain('#include <vector>');
  });

  it('嵌套对象生成独立 struct 并保证依赖在前', () => {
    const { code } = jsonToCpp('{"id":1,"profile":{"email":"a@b.c","age":36}}');
    expect(code).toContain('struct Profile {');
    expect(code.indexOf('struct Profile')).toBeLessThan(code.indexOf('struct Root'));
    expect(compact(code)).toContain('Profileprofile;');
  });

  it('字段名含连字符或 C++ 关键字时规范化并给出告警', () => {
    const { code, warnings } = jsonToCpp('{"user-name":"a","class":"b"}');
    expect(compact(code)).toContain('std::stringuserName;');
    expect(compact(code)).toContain('std::stringclassValue;');
    expect(warnings.join('\n')).toContain('user-name');
    expect(warnings.join('\n')).toContain('class');
  });

  it('指定命名空间时包裹 namespace，未指定时不输出', () => {
    const withNamespace = jsonToCpp('{"id":1}', { namespace: 'demo' });
    expect(withNamespace.code).toContain('namespace demo {');
    expect(withNamespace.code).toContain('} // namespace demo');

    const withoutNamespace = jsonToCpp('{"id":1}');
    expect(withoutNamespace.code).not.toContain('namespace');
  });

  it('支持多级命名空间', () => {
    const { code } = jsonToCpp('{"id":1}', { namespace: 'demo::v1' });
    expect(code).toContain('namespace demo::v1 {');
  });

  it('非法 JSON 抛出带位置信息的错误', () => {
    expect(() => jsonToCpp('{"id": }')).toThrowError(/JSON 解析失败/);
    try {
      jsonToCpp('{"id": }');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      expect(message).toContain('第 1 行第 8 列');
    }
  });

  it('空对象与顶层数组均输出合法代码', () => {
    const empty = jsonToCpp('{}');
    expect(empty.code).toContain('struct Root {\n};');

    const array = jsonToCpp('["a","b"]');
    expect(compact(array.code)).toContain('usingRoot=std::vector<std::string>;');
  });

  it('int64_t 与超出安全范围的整数分别处理', () => {
    const int64 = jsonToCpp('{"big":2147483648}');
    expect(compact(int64.code)).toContain('int64_tbig;');

    const unsafe = jsonToCpp('{"huge":9007199254740993}');
    expect(compact(unsafe.code)).toContain('std::stringhuge;');
    expect(unsafe.warnings.join('\n')).toContain('安全整数范围');
  });

  it('null 字段生成 std::optional', () => {
    const { code } = jsonToCpp('{"id":1,"metadata":null}');
    expect(compact(code)).toContain('std::optional<std::any>metadata;');
  });

  it('空数组按策略回退并给出告警', () => {
    const vectorAny = jsonToCpp('{"list":[]}');
    expect(compact(vectorAny.code)).toContain('std::vector<std::any>list;');
    expect(vectorAny.warnings.join('\n')).toContain('数组为空');

    const any = jsonToCpp('{"list":[]}', { emptyArrayType: 'any' });
    expect(compact(any.code)).toContain('std::anylist;');
  });

  it('异构数组退化为 std::any 并告警', () => {
    const { code, warnings } = jsonToCpp('{"mixed":[1,"a"]}');
    expect(compact(code)).toContain('std::vector<std::any>mixed;');
    expect(warnings.join('\n')).toContain('不兼容类型');
  });

  it('字段名重复规范化时追加后缀避免冲突', () => {
    const { code, warnings } = jsonToCpp('{"user-name":"a","user_name":"b"}');
    expect(compact(code)).toContain('std::stringuserName;');
    expect(compact(code)).toContain('std::stringuserName2;');
    expect(warnings.join('\n')).toContain('重名');
  });

  it('空输入返回空源码，非法根名称或命名空间抛错', () => {
    expect(jsonToCpp('   ').code).toBe('');
    expect(() => jsonToCpp('{"id":1}', { rootName: '1Root' })).toThrowError(/根名称/);
    expect(() => jsonToCpp('{"id":1}', { rootName: 'class' })).toThrowError(/根名称/);
    expect(() => jsonToCpp('{"id":1}', { namespace: 'a b' })).toThrowError(/命名空间/);
  });
});
