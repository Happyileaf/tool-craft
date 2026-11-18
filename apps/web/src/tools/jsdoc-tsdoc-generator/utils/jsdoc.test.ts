import { describe, expect, it } from 'vitest';
import {
  compareDocWithSignature,
  generateJsdoc,
  parseFunctionSignature,
  parseJsdoc,
} from './jsdoc';

describe('parseFunctionSignature', () => {
  it('parses a typed function declaration with async and generics', () => {
    const sig = parseFunctionSignature(
      'async function fetchJson<T>(url: string, init?: RequestInit): Promise<T>',
    );
    expect(sig.name).toBe('fetchJson');
    expect(sig.isAsync).toBe(true);
    expect(sig.typeParams).toEqual(['T']);
    expect(sig.params).toEqual([
      { name: 'url', type: 'string', optional: false, rest: false, defaultValue: undefined },
      { name: 'init', type: 'RequestInit', optional: true, rest: false, defaultValue: undefined },
    ]);
    expect(sig.returnType).toBe('Promise<T>');
  });

  it('parses arrow functions with default values and rest params', () => {
    const sig = parseFunctionSignature(
      'const clamp = (value: number, min = 0, ...bounds: number[]): number =>',
    );
    expect(sig.name).toBe('clamp');
    expect(sig.isAsync).toBe(false);
    expect(sig.params[0]?.optional).toBe(false);
    expect(sig.params[1]).toMatchObject({
      name: 'min',
      optional: true,
      defaultValue: '0',
    });
    expect(sig.params[2]).toMatchObject({ name: 'bounds', rest: true, type: 'number[]' });
    expect(sig.returnType).toBe('number');
  });

  it('parses method shorthand and multi-type-parameter generics', () => {
    const sig = parseFunctionSignature(
      'merge<K extends string, V>(target: Record<K, V>, source: Partial<Record<K, V>>): Record<K, V> {',
    );
    expect(sig.name).toBe('merge');
    expect(sig.typeParams).toEqual(['K', 'V']);
    expect(sig.params[0]?.type).toBe('Record<K, V>');
    expect(sig.params[1]?.type).toBe('Partial<Record<K, V>>');
    expect(sig.returnType).toBe('Record<K, V>');
  });

  it('handles object-type return annotations containing braces', () => {
    const sig = parseFunctionSignature(
      'function pair(a: number, b: string): { x: number; y: string } {',
    );
    expect(sig.returnType).toBe('{ x: number; y: string }');
  });

  it('supports untyped parameters and empty param lists', () => {
    const sig = parseFunctionSignature('function log(message) {');
    expect(sig.params).toEqual([
      { name: 'message', type: undefined, optional: false, rest: false, defaultValue: undefined },
    ]);
    expect(sig.returnType).toBeUndefined();
    const noParams = parseFunctionSignature('function ping(): void {');
    expect(noParams.params).toEqual([]);
    expect(noParams.returnType).toBe('void');
  });

  it('rejects malformed signatures', () => {
    expect(() => parseFunctionSignature('')).toThrow('请粘贴函数签名');
    expect(() => parseFunctionSignature('const x = 1;')).toThrow('参数列表括号');
    expect(() => parseFunctionSignature('function foo(a: string')).toThrow('括号不配对');
  });
});

describe('generateJsdoc', () => {
  const sig = parseFunctionSignature(
    'async function fetchJson<T>(url: string, init?: RequestInit, ...tags: string[]): Promise<T>',
  );

  it('generates JSDoc with brace types and Promise-wrapped async return', () => {
    const block = generateJsdoc(sig, { dialect: 'jsdoc', includeDescription: true });
    expect(block.startsWith('/**\n * <在此填写函数摘要描述>\n *\n')).toBe(true);
    expect(block).toContain('@template T <类型参数说明>');
    expect(block).toContain('@param {string} url - <参数说明>');
    expect(block).toContain('@param {RequestInit} [init] - <参数说明>');
    // 剩余参数按 JSDoc 惯例不标可选，类型本身已是数组
    expect(block).toContain('@param {string[]} tags - <参数说明>');
    // 已是 Promise<T> 不应再包一层
    expect(block).toContain('@returns {Promise<T>} <返回值说明>');
    expect(block.endsWith(' */')).toBe(true);
  });

  it('generates TSDoc without redundant inline types and with typeParam/remarks', () => {
    const block = generateJsdoc(sig, { dialect: 'tsdoc', includeDescription: false });
    expect(block).not.toContain('{string}');
    expect(block).toContain('@typeParam T - <类型参数说明>');
    expect(block).toContain('@param ...tags - <参数说明>');
    expect(block).toContain('@param init - <参数说明>（可选）');
    expect(block).toContain('@returns <返回值说明>');
    expect(block).toContain('@remarks <补充说明，可选>');
  });

  it('wraps non-Promise return types in Promise for async JSDoc and skips void returns', () => {
    const asyncVoid = parseFunctionSignature('async function save(): void {');
    const voidBlock = generateJsdoc(asyncVoid, { dialect: 'jsdoc', includeDescription: false });
    expect(voidBlock).not.toContain('@returns');

    const asyncNumber = parseFunctionSignature('async function count(): number {');
    const block = generateJsdoc(asyncNumber, { dialect: 'jsdoc', includeDescription: false });
    expect(block).toContain('@returns {Promise<number>} <返回值说明>');
  });

  it('omits description line and blank separator when disabled', () => {
    const simple = parseFunctionSignature('function add(a: number, b: number): number {');
    const block = generateJsdoc(simple, { dialect: 'jsdoc', includeDescription: false });
    expect(block.split('\n')[0]).toBe('/**');
    expect(block.split('\n')[1]).toBe(' * @param {number} a - <参数说明>');
  });
});

describe('parseJsdoc', () => {
  const block = `/**
 * Fetch JSON from a URL.
 *
 * @template T the response payload type
 * @param {string} url - target URL
 * @param {RequestInit} [init] - optional request options
 * @param {...string} tags extra path tags
 * @returns {Promise<T>} parsed payload
 * @throws {Error} when the response is not ok
 * @since 1.2.0
 */`;

  it('extracts summary, params, returns, throws, type params and other tags', () => {
    const doc = parseJsdoc(block);
    expect(doc.summary).toBe('Fetch JSON from a URL.');
    expect(doc.params).toEqual([
      { name: 'url', type: 'string', description: 'target URL', optional: false },
      { name: 'init', type: 'RequestInit', description: 'optional request options', optional: true },
      { name: 'tags', type: '...string', description: 'extra path tags', optional: false },
    ]);
    expect(doc.returns).toEqual({ type: 'Promise<T>', description: 'parsed payload' });
    expect(doc.throws).toEqual([{ type: 'Error', description: 'when the response is not ok' }]);
    expect(doc.typeParams).toEqual([{ name: 'T', description: 'the response payload type' }]);
    expect(doc.otherTags).toEqual([{ tag: 'since', text: '1.2.0' }]);
  });

  it('supports TSDoc param syntax without brace types and folded continuation lines', () => {
    const doc = parseJsdoc(`/**
 * Build a label.
 *
 * @param name - the entity name,
 *   required for display
 * @returns the formatted label
 */`);
    expect(doc.params).toEqual([
      { name: 'name', type: undefined, description: 'the entity name, required for display', optional: false },
    ]);
    expect(doc.returns).toEqual({ type: undefined, description: 'the formatted label' });
  });

  it('rejects input without a doc block and bad param names', () => {
    expect(() => parseJsdoc('just text')).toThrow('未找到');
    expect(() => parseJsdoc('/** @param {string} */')).toThrow('无法解析 @param');
  });
});

describe('compareDocWithSignature', () => {
  const sig = parseFunctionSignature(
    'function update(id: string, name?: string, age: number): boolean',
  );

  it('reports missing and extra params plus missing returns', () => {
    const doc = parseJsdoc(`/**
 * @param {string} id - identifier
 * @param {string} ghost - not in signature
 */`);
    const report = compareDocWithSignature(doc, sig);
    expect(report.missingParams).toEqual(['name', 'age']);
    expect(report.extraParams).toEqual(['ghost']);
    expect(report.missingReturns).toBe(true);
    expect(report.warnings.some((line) => line.includes('@returns'))).toBe(true);
  });

  it('is clean for a fully aligned doc and flags ordering issues', () => {
    const aligned = parseJsdoc(`/**
 * @param {string} id - identifier
 * @param {string} [name] - optional name
 * @param {number} age - age value
 * @returns {boolean} success flag
 */`);
    const report = compareDocWithSignature(aligned, sig);
    expect(report.missingParams).toEqual([]);
    expect(report.extraParams).toEqual([]);
    expect(report.missingReturns).toBe(false);
    expect(report.warnings).toEqual([]);

    const reordered = parseJsdoc(`/**
 * @param {string} name - name first
 * @param {string} id - identifier
 * @param {number} age - age
 * @returns {boolean} ok
 */`);
    const reorderedReport = compareDocWithSignature(reordered, sig);
    expect(reorderedReport.warnings.some((line) => line.includes('顺序不一致'))).toBe(true);
  });

  it('flags missing type parameters and unmarked optional params', () => {
    const genericSig = parseFunctionSignature('function wrap<T>(value: T, label?: string): T');
    const doc = parseJsdoc(`/**
 * @param value - payload
 * @param label - label text
 * @returns wrapped value
 */`);
    const report = compareDocWithSignature(doc, genericSig);
    expect(report.missingTypeParams).toEqual(['T']);
    expect(report.warnings.some((line) => line.includes('类型参数'))).toBe(true);
    expect(report.warnings.some((line) => line.includes('label') && line.includes('可选'))).toBe(true);
  });

  it('round-trips generated JSDoc against the same signature with no drift', () => {
    const block = generateJsdoc(sig, { dialect: 'jsdoc', includeDescription: true });
    const report = compareDocWithSignature(parseJsdoc(block), sig);
    expect(report.missingParams).toEqual([]);
    expect(report.extraParams).toEqual([]);
    expect(report.missingReturns).toBe(false);
    expect(report.warnings).toEqual([]);
  });
});
