import { describe, expect, it } from 'vitest';
import {
  inferType,
  parseLogfmt,
  parseLogfmtLine,
  serializeField,
  serializeFields,
  serializeLines,
  serializeValue,
  type LogfmtField,
} from './logfmt';

/** 测试辅助：断言数组下标存在并返回该元素（配合 toHaveLength 保证安全） */
function at<T>(array: T[], index: number): T {
  const item = array[index];
  if (item === undefined) throw new Error(`index ${index} out of range`);
  return item;
}

/** 按键取字段（重复键取首个） */
function byKey(fields: LogfmtField[], key: string): LogfmtField {
  const field = fields.find((f) => f.key === key);
  if (!field) throw new Error(`field ${key} not found`);
  return field;
}

describe('parseLogfmtLine - 标准行', () => {
  it('level=info msg="server started" port=8080 debug → 4 字段，类型推断正确', () => {
    const line = parseLogfmtLine('level=info msg="server started" port=8080 debug', 1);
    expect(line.warning).toBeNull();
    expect(line.fields).toHaveLength(4);

    const level = at(line.fields, 0);
    const msg = at(line.fields, 1);
    const port = at(line.fields, 2);
    const dbg = at(line.fields, 3);
    expect(level.key).toBe('level');
    expect(level.value).toBe('info');
    expect(level.type).toBe('string');

    expect(msg.key).toBe('msg');
    expect(msg.rawValue).toBe('server started');
    expect(msg.value).toBe('server started');
    expect(msg.type).toBe('string');

    expect(port.key).toBe('port');
    expect(port.value).toBe(8080);
    expect(port.type).toBe('integer');

    expect(dbg.key).toBe('debug');
    expect(dbg.value).toBe(true);
    expect(dbg.type).toBe('boolean');
  });

  it('转义 msg="say \\"hi\\"" 正确还原', () => {
    const line = parseLogfmtLine('msg="say \\"hi\\""', 1);
    expect(line.fields).toHaveLength(1);
    expect(at(line.fields, 0).rawValue).toBe('say "hi"');
  });

  it('反斜杠与 n/t 转义', () => {
    const line = parseLogfmtLine('path="C:\\\\tmp\\\\x" tab="a\\tb"', 1);
    expect(at(line.fields, 0).rawValue).toBe('C:\\tmp\\x');
    expect(at(line.fields, 1).rawValue).toBe('a\tb');
  });

  it('= 后空值兼容，无引号含空格在首个空格截断', () => {
    const line = parseLogfmtLine('empty= name=alice extra=ignored', 1);
    expect(line.fields).toHaveLength(3);
    expect(at(line.fields, 0).key).toBe('empty');
    expect(at(line.fields, 0).rawValue).toBe('');
    expect(at(line.fields, 1).rawValue).toBe('alice');
    expect(at(line.fields, 2).rawValue).toBe('ignored');
  });

  it('重复键全部保留并按出现顺序排列', () => {
    const line = parseLogfmtLine('tag=a tag=b tag=c', 1);
    expect(line.fields.map((f) => f.rawValue)).toEqual(['a', 'b', 'c']);
  });
});

describe('parseLogfmtLine - 类型推断', () => {
  it('整数 / 浮点 / 布尔 / null / 字符串', () => {
    const line = parseLogfmtLine('i=-42 f=3.14 b1=true b2=false n=null s=hello e=1e3', 1);
    expect(byKey(line.fields, 'i').type).toBe('integer');
    expect(byKey(line.fields, 'i').value).toBe(-42);
    expect(byKey(line.fields, 'f').type).toBe('float');
    expect(byKey(line.fields, 'f').value).toBeCloseTo(3.14, 10);
    expect(byKey(line.fields, 'b1').value).toBe(true);
    expect(byKey(line.fields, 'b2').value).toBe(false);
    expect(byKey(line.fields, 'n').type).toBe('null');
    expect(byKey(line.fields, 'n').value).toBeNull();
    expect(byKey(line.fields, 's').type).toBe('string');
    expect(byKey(line.fields, 'e').type).toBe('float');
    expect(byKey(line.fields, 'e').value).toBe(1000);
  });

  it('inferType 单元边界', () => {
    expect(inferType('true').type).toBe('boolean');
    expect(inferType('123').type).toBe('integer');
    expect(inferType('.5').type).toBe('float');
    expect(inferType('1.').type).toBe('float');
    expect(inferType('007').type).toBe('integer');
    expect(inferType('').type).toBe('string');
    expect(inferType('null').type).toBe('null');
  });
});

describe('parseLogfmt - 多行与畸形告警', () => {
  it('未闭合引号带行号告警且不中断其余行', () => {
    const input = [
      'level=info msg="ok"',
      'msg="unterminated',
      'level=error code=500',
    ].join('\n');
    const result = parseLogfmt(input);
    expect(result.lines).toHaveLength(3);
    expect(result.warnings).toHaveLength(1);
    expect(at(result.warnings, 0)).toContain('第 2 行');
    // 未闭合值按行尾截断，仍产生字段
    const line2 = at(result.lines, 1);
    expect(at(line2.fields, 0).rawValue).toBe('unterminated');
    // 后续行正常解析
    expect(at(result.lines, 2).fields).toHaveLength(2);
  });

  it('空输入与空行：零值统计不抛异常', () => {
    const empty = parseLogfmt('');
    expect(empty.lines).toHaveLength(0);
    expect(empty.fieldCount).toBe(0);
    expect(empty.fieldNames).toHaveLength(0);
    expect(empty.warnings).toHaveLength(0);

    const blanks = parseLogfmt('\n  \n\n');
    expect(blanks.lines).toHaveLength(0);
  });

  it('fieldNames 去重并按首次出现顺序，fieldCount 统计全部字段', () => {
    const result = parseLogfmt('a=1 b=2\nb=3 c=4\na=5');
    expect(result.fieldNames).toEqual(['a', 'b', 'c']);
    expect(result.fieldCount).toBe(5);
  });
});

describe('序列化（反向）', () => {
  it('含空格/引号/等号的值自动加引号转义', () => {
    expect(serializeField('msg', 'hello world')).toBe('msg="hello world"');
    expect(serializeField('q', 'say "hi"')).toBe('q="say \\"hi\\""');
    expect(serializeField('eq', 'a=b')).toBe('eq="a=b"');
    expect(serializeField('path', 'C:\\tmp')).toBe('path="C:\\\\tmp"');
  });

  it('布尔 true 输出裸键，false 输出 false', () => {
    expect(serializeField('debug', true)).toBe('debug');
    expect(serializeField('debug', false)).toBe('debug=false');
    expect(serializeValue(true)).toBe('');
  });

  it('数字与空字符串', () => {
    expect(serializeField('port', 8080)).toBe('port=8080');
    expect(serializeField('ratio', 0.5)).toBe('ratio=0.5');
    expect(serializeField('empty', '')).toBe('empty=""');
    expect(serializeField('n', null)).toBe('n=null');
  });

  it('序列化往返后再次解析结果一致', () => {
    const original = 'level=info msg="say \\"hi\\"" port=8080 ratio=0.5 debug';
    const parsed = parseLogfmtLine(original, 1);
    const serialized = serializeFields(
      parsed.fields.map((f) => ({ key: f.key, value: f.value })),
    );
    const reparsed = parseLogfmtLine(serialized, 1);
    expect(reparsed.fields.map((f) => [f.key, f.rawValue])).toEqual(
      parsed.fields.map((f) => [f.key, f.rawValue]),
    );
    expect(reparsed.warning).toBeNull();
  });

  it('serializeLines 多行拼接', () => {
    const text = serializeLines([
      [
        { key: 'a', value: 1 },
        { key: 'b', value: true },
      ],
      [{ key: 'msg', value: 'x y' }],
    ]);
    expect(text).toBe('a=1 b\nmsg="x y"');
  });
});
