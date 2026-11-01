import { describe, it, expect } from 'vitest';
import { parseNegotiationHeader } from './negotiation';

describe('Accept 解析与排序固定向量', () => {
  it('q 缺省为 1，按 q 降序并结合媒体范围具体度排序', () => {
    const r = parseNegotiationHeader('accept', 'text/html,text/*;q=0.9,*/*;q=0.8');
    expect(r.error).toBeNull();
    expect(r.entries.map((e) => e.token)).toEqual(['text/html', 'text/*', '*/*']);
    expect(r.entries.map((e) => e.q)).toEqual([1, 0.9, 0.8]);
    expect(r.preferred?.token).toBe('text/html');
    expect(r.preferred?.q).toBe(1);
  });

  it('具体类型优先于子类型通配，*/* 最末', () => {
    const r = parseNegotiationHeader(
      'accept',
      '*/*;q=0.8,text/*;q=0.9,application/xml;q=0.9,text/html',
    );
    const tokens = r.entries.map((e) => e.token);
    expect(tokens[0]).toBe('text/html');
    expect(tokens.indexOf('application/xml')).toBeLessThan(tokens.indexOf('text/*'));
    expect(tokens[tokens.length - 1]).toBe('*/*');
  });

  it('同具体度时 q 之外的额外参数数量多者优先，再相同保持原序', () => {
    const r = parseNegotiationHeader('accept', 'text/html;level=1,text/html;level=1;foo=bar,*/*');
    expect(r.entries[0]?.token).toBe('text/html');
    expect(r.entries[0]?.raw).toBe('text/html;level=1;foo=bar');
    expect(r.entries[1]?.raw).toBe('text/html;level=1');
  });

  it('Accept 媒体范围统一小写比较与展示，*/xml 形状非法被忽略', () => {
    const r = parseNegotiationHeader('accept', 'TEXT/HTML,*/xml,*/*');
    expect(r.entries.map((e) => e.token)).toEqual(['text/html', '*/*']);
    expect(r.error).toBeNull();
  });
});

describe('Accept-Language 解析与排序固定向量', () => {
  it('zh-CN(q=1) > zh(0.9) > en(0.8)', () => {
    const r = parseNegotiationHeader('accept-language', 'zh-CN,zh;q=0.9,en;q=0.8');
    expect(r.entries.map((e) => e.token)).toEqual(['zh-CN', 'zh', 'en']);
    expect(r.preferred?.token).toBe('zh-CN');
    expect(r.entries.map((e) => e.specificity)).toEqual([2, 1, 1]);
  });

  it('同 q 时多段语言标签优先，同段数保持原始顺序', () => {
    const r = parseNegotiationHeader('accept-language', 'en;q=0.8,en-US;q=0.8,fr;q=0.8,fr-FR;q=0.8');
    expect(r.entries.map((e) => e.token)).toEqual(['en-US', 'fr-FR', 'en', 'fr']);
  });

  it('语言标签不区分大小写比较但保留原始显示，通配 * 排末位', () => {
    const r = parseNegotiationHeader('accept-language', 'ZH-cn;q=0.5,*;q=0.5,en;q=0.5');
    expect(r.entries.map((e) => e.token)).toEqual(['ZH-cn', 'en', '*']);
  });
});

describe('q=0 拒绝语义', () => {
  it('q=0 条目标记 rejected 且不是 preferred', () => {
    const r = parseNegotiationHeader('accept-encoding', 'gzip;q=0, br');
    expect(r.preferred?.token).toBe('br');
    const gzip = r.entries.find((e) => e.token === 'gzip');
    expect(gzip?.rejected).toBe(true);
    expect(gzip?.q).toBe(0);
    expect(r.entries.map((e) => e.token)).toEqual(['br', 'gzip']);
  });

  it('全部条目 q=0 时 preferred 为 null，列表仍保留拒绝条目', () => {
    const r = parseNegotiationHeader('accept-charset', 'utf-8;q=0, iso-8859-1;q=0');
    expect(r.preferred).toBeNull();
    expect(r.entries).toHaveLength(2);
    expect(r.entries.every((e) => e.rejected)).toBe(true);
  });
});

describe('非法输入处理', () => {
  it('非法 q（;q=2、;q=abc）的条目被忽略，其余正常解析', () => {
    const r = parseNegotiationHeader('accept-encoding', 'gzip;q=2, br;q=abc, deflate');
    expect(r.entries.map((e) => e.token)).toEqual(['deflate']);
    expect(r.preferred?.token).toBe('deflate');
    expect(r.error).toBeNull();
  });

  it('q 为负数或超过 1 均忽略，q=1.0 合法', () => {
    const r = parseNegotiationHeader('accept-encoding', 'a;q=-0.1,b;q=1.01,c;q=1.0');
    expect(r.entries.map((e) => e.token)).toEqual(['c']);
  });

  it('空串不报错且 entries 为空', () => {
    const r = parseNegotiationHeader('accept', '');
    expect(r.entries).toEqual([]);
    expect(r.preferred).toBeNull();
    expect(r.error).toBeNull();
  });

  it('纯空白输入 error 非空但不抛异常', () => {
    const r = parseNegotiationHeader('accept', '   ,  ,');
    expect(r.entries).toEqual([]);
    expect(r.preferred).toBeNull();
    expect(typeof r.error).toBe('string');
    expect(r.error && r.error.length).toBeGreaterThan(0);
  });

  it('全非法输入 error 非空但不抛异常', () => {
    const r = parseNegotiationHeader('accept', 'not-a-range,;q=0.9,*/xml');
    expect(r.entries).toEqual([]);
    expect(r.error).toContain('Accept');
  });

  it('token 为空的非法条目忽略', () => {
    const r = parseNegotiationHeader('accept-charset', 'utf-8,;level=1,');
    expect(r.entries.map((e) => e.token)).toEqual(['utf-8']);
    expect(r.error).toBeNull();
  });
});

describe('Accept-Encoding / Accept-Charset 排序', () => {
  it('accept-encoding 中具名编码优先，通配 * 排末位', () => {
    const r = parseNegotiationHeader('accept-encoding', '*;q=0.5,gzip,deflate,br;q=0.9');
    expect(r.entries[r.entries.length - 1]?.token).toBe('*');
    expect(r.preferred?.token).toBe('gzip');
  });

  it('accept-charset 具名字符集优先于通配，token 统一小写', () => {
    const r = parseNegotiationHeader('accept-charset', 'UTF-8, iso-8859-1;q=0.5');
    expect(r.entries.map((e) => e.token)).toEqual(['utf-8', 'iso-8859-1']);
    expect(r.entries[0]?.note).toBe('具名值');
  });

  it('默认样例可完整解析出首选与排序', () => {
    const r = parseNegotiationHeader(
      'accept',
      'text/html,application/xhtml+xml,application/xml;q=0.9,text/*;q=0.8,*/*;q=0.7',
    );
    expect(r.error).toBeNull();
    expect(r.preferred?.token).toBe('text/html');
    expect(r.entries).toHaveLength(5);
  });
});
