import { describe, it, expect } from 'vitest';
import {
  WEBSOCKET_GUID,
  computeAccept,
  verifyPair,
  processLines,
} from './websocket';

const RFC_KEY = 'dGhlIHNhbXBsZSBub25jZQ==';
const RFC_ACCEPT = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';

describe('computeAccept', () => {
  it('matches the RFC 6455 worked example', async () => {
    const result = await computeAccept(RFC_KEY);
    expect(result.error).toBeNull();
    expect(result.valid).toBe(true);
    expect(result.accept).toBe(RFC_ACCEPT);
  });

  it('uses the fixed RFC GUID', () => {
    expect(WEBSOCKET_GUID).toBe('258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
  });

  it('is deterministic for the same key', async () => {
    const a = await computeAccept(RFC_KEY);
    const b = await computeAccept(`  ${RFC_KEY}\n`);
    expect(a.accept).toBe(b.accept);
  });

  it('rejects malformed keys with readable errors', async () => {
    expect((await computeAccept('')).error).toMatch(/不能为空/);
    expect((await computeAccept('not-base64!!')).error).toMatch(/Base64/);
    // 长度不足（23 个字符）的 Key
    expect((await computeAccept('dGhlIHNhbXBsZSBub25jZQ=')).error).toMatch(/Base64/);
    // 等号数量错误的 Key
    expect((await computeAccept('dGhlIHNhbXBsZSBub25jZQ=X')).error).toMatch(/Base64/);
  });
});

describe('verifyPair', () => {
  it('accepts a matching RFC pair', async () => {
    const result = await verifyPair(RFC_KEY, RFC_ACCEPT);
    expect(result.match).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rejects a wrong accept value and gives the expected one', async () => {
    const result = await verifyPair(RFC_KEY, 'aaaaaaaaaaaaaaaaAAAAAAAA=');
    expect(result.match).toBe(false);
    expect(result.expected).toBe(RFC_ACCEPT);
    expect(result.error).toMatch(/不匹配/);
  });

  it('propagates invalid key errors', async () => {
    const result = await verifyPair('bad', RFC_ACCEPT);
    expect(result.match).toBe(false);
    expect(result.error).toMatch(/Base64/);
  });
});

describe('processLines', () => {
  it('computes accept values per line and keeps blanks', async () => {
    const result = await processLines(`${RFC_KEY}\n\n${RFC_KEY}`, 'compute');
    expect(result.output).toBe(`${RFC_ACCEPT}\n\n${RFC_ACCEPT}`);
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid compute lines with line numbers', async () => {
    const result = await processLines(`${RFC_KEY}\nbad`, 'compute');
    expect(result.output.split('\n')[1]).toBe('bad');
    expect(result.warnings[0]).toMatch(/第 2 行/);
  });

  it('verifies key/accept pairs', async () => {
    const ok = await processLines(`${RFC_KEY} ${RFC_ACCEPT}`, 'verify');
    expect(ok.output).toBe('匹配');
    expect(ok.warnings).toEqual([]);

    const bad = await processLines(`${RFC_KEY} wrongwrongwrongwrongwrong0=`, 'verify');
    expect(bad.output).toContain('不匹配');
    expect(bad.output).toContain(RFC_ACCEPT);
    expect(bad.warnings[0]).toMatch(/第 1 行/);
  });

  it('requires two fields in verify mode', async () => {
    const result = await processLines(RFC_KEY, 'verify');
    expect(result.warnings[0]).toMatch(/两个字段/);
  });
});
