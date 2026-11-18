import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPE,
  STANDARD_FIELDS,
  assertHttpStatus,
  generateProblem,
  parseProblem,
  statusPhrase,
} from './problemDetails';

describe('assertHttpStatus', () => {
  it('accepts the three-digit HTTP range and rejects everything else', () => {
    expect(assertHttpStatus(100)).toBe(100);
    expect(assertHttpStatus(599)).toBe(599);
    expect(() => assertHttpStatus(99)).toThrow('100–599');
    expect(() => assertHttpStatus(600)).toThrow('100–599');
    expect(() => assertHttpStatus(404.5)).toThrow('整数');
  });
});

describe('statusPhrase', () => {
  it('maps known statuses and leaves unknown ones undefined', () => {
    expect(statusPhrase(404)).toBe('Not Found');
    expect(statusPhrase(422)).toBe('Unprocessable Entity');
    expect(statusPhrase(418)).toBeUndefined();
  });
});

describe('generateProblem', () => {
  it('defaults type to about:blank and derives title from status', () => {
    const result = generateProblem({
      status: 404,
      detail: 'Account 1234 not found',
      extensions: [],
    });
    expect(result.object.type).toBe(DEFAULT_TYPE);
    expect(result.object.title).toBe('Not Found');
    expect(result.object.status).toBe(404);
    expect(result.compactJson).toContain('"type":"about:blank"');
    expect(result.prettyJson).toContain('\n  "status": 404');
  });

  it('keeps an explicit title even when a status phrase exists', () => {
    const result = generateProblem({
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      status: 403,
      instance: '/account/1234/msgs/abc',
      extensions: [],
    });
    expect(result.object.title).toBe('You do not have enough credit.');
    expect(result.object.instance).toBe('/account/1234/msgs/abc');
  });

  it('coerces extension values through JSON and rejects conflicts or bad names', () => {
    const result = generateProblem({
      status: 422,
      extensions: [
        { key: 'balance', value: '30' },
        { key: 'accounts', value: '["/account/1","/account/2"]' },
        { key: 'raw-note', value: 'plain text stays a string' },
      ],
    });
    expect(result.object.balance).toBe(30);
    expect(result.object.accounts).toEqual(['/account/1', '/account/2']);
    expect(result.object['raw-note']).toBe('plain text stays a string');

    expect(() =>
      generateProblem({ status: 400, extensions: [{ key: 'status', value: '1' }] }),
    ).toThrow('标准字段冲突');
    expect(() =>
      generateProblem({ status: 400, extensions: [{ key: '1bad', value: 'x' }] }),
    ).toThrow('不合法');
    expect(() =>
      generateProblem({
        status: 400,
        extensions: [
          { key: 'dup', value: '1' },
          { key: 'dup', value: '2' },
        ],
      }),
    ).toThrow('重复');
  });

  it('rejects invalid status and URI references', () => {
    expect(() => generateProblem({ status: 99, extensions: [] })).toThrow('100–599');
    expect(() => generateProblem({ type: 'not a uri', extensions: [] })).toThrow('URI 引用');
    expect(() => generateProblem({ instance: 'has space', extensions: [] })).toThrow('URI 引用');
  });

  it('round-trips every generated document through parseProblem', () => {
    const generated = generateProblem({
      type: 'https://example.com/probs/rate-limit',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Retry after 30 seconds',
      instance: '/api/jobs',
      extensions: [
        { key: 'retryAfter', value: '30' },
        { key: 'limits', value: '{"perMinute":60}' },
      ],
    });
    const parsed = parseProblem(generated.prettyJson);
    expect(parsed.standard).toEqual({
      type: 'https://example.com/probs/rate-limit',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Retry after 30 seconds',
      instance: '/api/jobs',
    });
    expect(parsed.extensions).toHaveLength(2);
    expect(parsed.object.limits).toEqual({ perMinute: 60 });
  });
});

describe('parseProblem', () => {
  const rfcExample = JSON.stringify({
    type: 'https://example.com/probs/out-of-credit',
    title: 'You do not have enough credit.',
    detail: 'Your current balance is 30, but that costs 50.',
    instance: '/account/1234/msgs/abc',
    status: 403,
    balance: 30,
    accounts: ['/account/1234', '/account/67890'],
  });

  it('splits the RFC 7807 appendix example into standard fields and extensions', () => {
    const parsed = parseProblem(rfcExample);
    expect(parsed.standard.status).toBe(403);
    expect(parsed.standard.detail).toContain('balance is 30');
    expect(parsed.extensions.map((item) => item.key)).toEqual(['balance', 'accounts']);
    expect(parsed.warnings).toEqual([]);
  });

  it('warns about missing type/status and title-phrase mismatch', () => {
    const parsed = parseProblem(JSON.stringify({ detail: 'something broke' }));
    expect(parsed.standard.type).toBe(DEFAULT_TYPE);
    expect(parsed.warnings.some((warning) => warning.includes('缺少 type'))).toBe(true);
    expect(parsed.warnings.some((warning) => warning.includes('缺少 status'))).toBe(true);

    const mismatched = parseProblem(JSON.stringify({ type: DEFAULT_TYPE, status: 404, title: 'Forbidden' }));
    expect(mismatched.warnings.some((warning) => warning.includes('不一致'))).toBe(true);

    // 自定义 type 下标题允许与状态短语不同，不应产生一致性告警
    const customType = parseProblem(
      JSON.stringify({ type: 'https://example.com/probs/x', status: 403, title: 'Custom title' }),
    );
    expect(customType.warnings.some((warning) => warning.includes('不一致'))).toBe(false);
  });

  it('rejects malformed JSON, non-object roots and invalid statuses', () => {
    expect(() => parseProblem('   ')).toThrow('请粘贴');
    expect(() => parseProblem('{not json')).toThrow('JSON 语法错误');
    expect(() => parseProblem('[1,2,3]')).toThrow('根节点必须是 JSON 对象');
    expect(() => parseProblem('null')).toThrow('根节点必须是 JSON 对象');
    expect(() => parseProblem(JSON.stringify({ status: 700 }))).toThrow('100–599');
    expect(() => parseProblem(JSON.stringify({ type: 42 }))).toThrow('type 必须是字符串');
    expect(() => parseProblem(JSON.stringify({ instance: 1 }))).toThrow('instance 必须是字符串');
  });

  it('exposes exactly the five documented standard field names', () => {
    expect([...STANDARD_FIELDS]).toEqual(['type', 'title', 'status', 'detail', 'instance']);
  });
});
