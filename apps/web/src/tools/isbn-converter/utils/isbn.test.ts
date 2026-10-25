import { describe, expect, it } from 'vitest';
import { inspectIsbn, inspectIsbnBatch, isbn10CheckDigit, isbn13CheckDigit } from './isbn';

const PRAGMATIC_ISBN10 = '020161622X';
const PRAGMATIC_ISBN13 = '9780201616224';
const CLEAN_CODE_ISBN13 = '9780132350884';

function makeIsbn13(body: string): string {
  return body + isbn13CheckDigit(body);
}

function makeIsbn10(body: string): string {
  return body + isbn10CheckDigit(body);
}

describe('isbn check digits', () => {
  it('ISBN-10 校验位按 10..2 加权模 11，10 记为 X', () => {
    expect(isbn10CheckDigit('020161622')).toBe('X');
    expect(isbn10CheckDigit('013235088')).toBe('2');
  });

  it('ISBN-13 校验位按 1/3 交替加权模 10', () => {
    expect(isbn13CheckDigit('978020161622')).toBe('4');
    expect(isbn13CheckDigit('978013235088')).toBe('4');
  });
});

describe('inspectIsbn', () => {
  it('校验合法 ISBN-10（含末位 X）并给出各展示形式', () => {
    const result = inspectIsbn(PRAGMATIC_ISBN10);
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('isbn10');
    expect(result.compact).toBe(PRAGMATIC_ISBN10);
    expect(result.isbn10).toBe(PRAGMATIC_ISBN10);
    expect(result.isbn13).toBe(PRAGMATIC_ISBN13);
    expect(result.formatted10).toBe('0-20161622-X');
    expect(result.formatted13).toBe('978-0-20161622-4');
  });

  it('把合法 ISBN-10 转换为以 978 开头的 ISBN-13 并重算校验位', () => {
    const result = inspectIsbn('0132350882');
    expect(result.valid).toBe(true);
    expect(result.isbn13).toBe(CLEAN_CODE_ISBN13);
    expect(result.formatted13).toBe('978-0-13235088-4');
  });

  it('校验合法 978 前缀 ISBN-13 并可反向转换为 ISBN-10', () => {
    const result = inspectIsbn(PRAGMATIC_ISBN13);
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('isbn13');
    expect(result.isbn10).toBe(PRAGMATIC_ISBN10);
    expect(result.formatted13).toBe('978-0-20161622-4');
    expect(result.formatted10).toBe('0-20161622-X');
  });

  it('接受 979 前缀 ISBN-13 且不可转回 ISBN-10', () => {
    const compact = makeIsbn13('979898765432');
    const result = inspectIsbn(`979-8-9876543-2-${compact.slice(12)}`);
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('isbn13');
    expect(result.compact).toBe(compact);
    expect(result.isbn13).toBe(compact);
    expect(result.isbn10).toBeNull();
    expect(result.formatted10).toBeNull();
    expect(result.formatted13).toBe(`979-8-98765432-${compact.slice(12)}`);
  });

  it('容忍连字符、空格与小写 x 并正确规范化', () => {
    const result = inspectIsbn(` ${PRAGMATIC_ISBN10.slice(0, 9).replace(/(\d)(?=\d)/g, '$1-').toLowerCase()}x `);
    expect(result.valid).toBe(true);
    expect(result.compact).toBe(PRAGMATIC_ISBN10);
    expect(result.isbn13).toBe(PRAGMATIC_ISBN13);
  });

  it('识别 1/2/3 位组区号（中国 7、印度 81、台湾 986）', () => {
    const china = inspectIsbn('9787111407010');
    expect(china.valid).toBe(true);
    expect(china.formatted13).toBe('978-7-11140701-0');

    const indiaBody = '978817656576';
    const indiaCompact = makeIsbn13(indiaBody);
    const india = inspectIsbn(indiaCompact);
    expect(india.formatted13).toBe(`978-81-7656576-${indiaCompact.slice(12)}`);
    expect(india.formatted10).toBe(`81-7656576-${isbn10CheckDigit('817656576')}`);

    const taiwanBody = '978986779452';
    const taiwanCompact = makeIsbn13(taiwanBody);
    const taiwan = inspectIsbn(taiwanCompact);
    expect(taiwan.formatted13).toBe(`978-986-779452-${taiwanCompact.slice(12)}`);
  });

  it('979 法语区 2 位组号（10–12）正常分组', () => {
    const compact = makeIsbn13('979101234567');
    const result = inspectIsbn(compact);
    expect(result.valid).toBe(true);
    expect(result.formatted13).toBe(`979-10-1234567-${compact.slice(12)}`);
  });

  it('校验位错误时指出期望校验位与错误位置', () => {
    const bad = makeIsbn10('020161622').slice(0, 9) + '0';
    const result = inspectIsbn(bad);
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('isbn10');
    expect(result.error).toContain('应为 X');
    expect(result.errorPosition).toBe(9);
  });

  it('ISBN-10 的 X 出现在非末位时判为非法并定位', () => {
    const result = inspectIsbn('0X0161622X');
    expect(result.valid).toBe(false);
    expect(result.errorPosition).toBe(1);
    expect(result.error).toMatch(/末位/);
  });

  it('ISBN-13 含 X 时判为非法', () => {
    const result = inspectIsbn('978020161622X');
    expect(result.valid).toBe(false);
    expect(result.kind).toBe('isbn13');
    expect(result.error).toMatch(/只能包含数字/);
  });

  it('包含非法字符时报错并给出原始位置', () => {
    const result = inspectIsbn('0-2016-A622-X');
    expect(result.valid).toBe(false);
    expect(result.errorPosition).toBe(7);
    expect(result.error).toContain('A');
  });

  it('长度既不是 10 也不是 13 时报长度错误', () => {
    const result = inspectIsbn('020161622');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('9 位');
    const tooLong = inspectIsbn('97802016162240');
    expect(tooLong.valid).toBe(false);
    expect(tooLong.error).toContain('14 位');
  });

  it('ISBN-13 非 978/979 前缀时报前缀错误', () => {
    const result = inspectIsbn('9770201616225');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/978 或 979/);
  });
});

describe('inspectIsbnBatch', () => {
  it('批量解析并按换算后的 ISBN-13 去重（ISBN-10 与 ISBN-13 视为同一条）', () => {
    const batch = inspectIsbnBatch(
      `${PRAGMATIC_ISBN10}
       ${PRAGMATIC_ISBN13}
       978-0-201-61622-4
       ${CLEAN_CODE_ISBN13}
       not-an-isbn`,
    );
    expect(batch.summary.total).toBe(5);
    expect(batch.summary.valid).toBe(4);
    expect(batch.summary.invalid).toBe(1);
    expect(batch.summary.unique).toBe(2);
    expect(batch.summary.duplicate).toBe(2);
    expect(batch.items[1]?.isDuplicate).toBe(true);
    expect(batch.items[2]?.isDuplicate).toBe(true);
  });

  it('空输入返回空结果与零值统计', () => {
    const batch = inspectIsbnBatch('  \n  ');
    expect(batch.items).toHaveLength(0);
    expect(batch.summary).toEqual({
      total: 0,
      valid: 0,
      invalid: 0,
      unique: 0,
      duplicate: 0,
    });
  });
});
