import { describe, expect, it } from 'vitest';
import {
  StackParseError,
  parseErrorStack,
  stackToJson,
  type StackDialect,
} from './stack';
import { FIREFOX_SAMPLE, SAFARI_SAMPLE, V8_SAMPLE } from '../constants';

describe('V8 / Node.js 方言', () => {
  it('识别方言、错误名、帧数与首末帧字段（验收点①）', () => {
    const result = parseErrorStack(V8_SAMPLE);
    expect(result.dialect).toBe('v8');
    expect(result.name).toBe('TypeError');
    expect(result.message).toContain("reading 'id'");
    expect(result.frames).toHaveLength(6);

    const first = result.frames[0];
    expect(first?.functionName).toBe('foo');
    expect(first?.filePath).toBe('/app/src/a.js');
    expect(first?.line).toBe(10);
    expect(first?.column).toBe(20);

    const last = result.frames[result.frames.length - 1];
    expect(last?.filePath).toBe('node:internal/process/task_queues');
    expect(last?.isInternal).toBe(true);
    expect(last?.line).toBe(96);
    expect(last?.column).toBe(5);
  });

  it('匿名帧、async 帧、eval 帧标记正确（验收点②）', () => {
    const result = parseErrorStack(V8_SAMPLE);
    const anonymous = result.frames.find((frame) => frame.functionName === 'Object.<anonymous>');
    expect(anonymous?.filePath).toBe('/app/src/b.js');
    expect(anonymous?.line).toBe(3);

    const asyncFrame = result.frames.find((frame) => frame.functionName === 'loadUser');
    expect(asyncFrame?.isAsync).toBe(true);
    expect(asyncFrame?.line).toBe(42);

    const ctorFrame = result.frames.find((frame) => frame.functionName === 'Constructor.new Service');
    expect(ctorFrame?.filePath).toBe('/app/src/service/base.js');

    const evalFrame = result.frames.find((frame) => frame.isEval);
    expect(evalFrame?.functionName).toBe('eval');
    expect(evalFrame?.line).toBe(1);
    expect(evalFrame?.column).toBe(30);
  });

  it('message 含冒号时仅在第一个冒号拆分 name（验收点⑦）', () => {
    const result = parseErrorStack(V8_SAMPLE);
    expect(result.name).toBe('TypeError');
    expect(result.message).toContain(': payload.id missing');
  });

  it('无函数名的裸帧解析为 <anonymous>', () => {
    const result = parseErrorStack('Error: boom\n    at /app/x.js:1:1');
    expect(result.frames[0]?.functionName).toBe('<anonymous>');
    expect(result.frames[0]?.filePath).toBe('/app/x.js');
  });

  it('native code 帧标记 isNative 且无位置信息', () => {
    const result = parseErrorStack('Error: x\n    at Array.forEach (native code)');
    const frame = result.frames[0];
    expect(frame?.isNative).toBe(true);
    expect(frame?.filePath).toBeNull();
    expect(frame?.line).toBeNull();
  });
});

describe('Firefox 方言', () => {
  it('识别方言且帧字段与 V8 等价（验收点①）', () => {
    const result = parseErrorStack(FIREFOX_SAMPLE);
    expect(result.dialect).toBe('firefox');
    expect(result.name).toBe('TypeError');
    expect(result.frames.length).toBeGreaterThanOrEqual(4);

    const first = result.frames[0];
    expect(first?.functionName).toBe('foo');
    expect(first?.filePath).toBe('/app/src/a.js');
    expect(first?.line).toBe(10);
    expect(first?.column).toBe(20);

    const second = result.frames[1];
    expect(second?.functionName).toBe('bar');
    expect(second?.filePath).toBe('/app/src/b.js');
  });

  it('匿名帧（@ 前无函数名）解析为 <anonymous>', () => {
    const result = parseErrorStack(FIREFOX_SAMPLE);
    const anon = result.frames.find((frame) => frame.filePath === '/app/src/anonymous.js');
    expect(anon?.functionName).toBe('<anonymous>');
    expect(anon?.line).toBe(8);
  });

  it('列号缺省时 column 为 null 且不报错（验收点③）', () => {
    const result = parseErrorStack(FIREFOX_SAMPLE);
    const last = result.frames[result.frames.length - 1];
    expect(last?.functionName).toBe('loadConfig');
    expect(last?.filePath).toBe('file:///opt/app/src/config.js');
    expect(last?.line).toBe(100);
    expect(last?.column).toBeNull();
  });
});

describe('Safari / JSC 方言', () => {
  it('识别方言，eval 与 native 帧正确标记且不要求行列（验收点①②）', () => {
    const result = parseErrorStack(SAFARI_SAMPLE);
    expect(result.dialect).toBe('safari');
    expect(result.name).toBe('TypeError');

    const first = result.frames[0];
    expect(first?.functionName).toBe('foo');
    expect(first?.filePath).toBe('/app/src/a.js');
    expect(first?.line).toBe(10);
    expect(first?.column).toBe(20);

    const evalFrame = result.frames.find((frame) => frame.isEval);
    expect(evalFrame?.functionName).toBe('evalCode');
    expect(evalFrame?.filePath).toBe('/app/src/eval.js');

    const nativeFrame = result.frames.find((frame) => frame.isNative);
    expect(nativeFrame?.functionName).toBe('forEach');
    expect(nativeFrame?.line).toBeNull();
    expect(nativeFrame?.column).toBeNull();
  });

  it('首行仅 message 无错误名时 name 为 null', () => {
    const result = parseErrorStack('something broke\nfoo@/app/a.js:1:2');
    expect(result.dialect).toBe('firefox');
    expect(result.name).toBeNull();
    expect(result.message).toBe('something broke');
  });
});

describe('边界场景', () => {
  it('空串抛中文错误（验收点④）', () => {
    expect(() => parseErrorStack('')).toThrow(StackParseError);
    expect(() => parseErrorStack('   \n ')).toThrow(/为空/);
  });

  it('无任何可识别帧时返回空 frames 并给警告（验收点④）', () => {
    const result = parseErrorStack('just some random log line\nnot a stack at all');
    expect(result.frames).toEqual([]);
    expect(result.dialect).toBe('unknown');
    expect(result.warnings.some((warning) => warning.includes('未识别'))).toBe(true);
    expect(result.message).toContain('random log');
  });

  it('首帧之后的怪行保留为 unparsed 帧且不丢失', () => {
    const result = parseErrorStack(
      'Error: x\n    at foo (/app/a.js:1:2)\nsome weird continuation line',
    );
    const weird = result.frames.find((frame) => frame.unparsed);
    expect(weird?.raw).toContain('weird');
    expect(weird?.functionName).toBeNull();
  });

  it('Windows 反斜杠路径与 file:// URL 保留原样（验收点⑤）', () => {
    const win = parseErrorStack('Error: x\n    at foo (C:\\dir\\file.js:10:5)');
    expect(win.frames[0]?.filePath).toBe('C:\\dir\\file.js');
    expect(win.frames[0]?.line).toBe(10);
    expect(win.frames[0]?.column).toBe(5);

    const fileUrl = parseErrorStack('Error: x\nfoo@file:///opt/app/a.js:4:8');
    expect(fileUrl.frames[0]?.filePath).toBe('file:///opt/app/a.js');
  });

  it('source map 查询串 ?abc 保留在文件路径中', () => {
    const result = parseErrorStack('Error: x\n    at foo (/app/a.js?abc=1:2:3)');
    expect(result.frames[0]?.filePath).toBe('/app/a.js?abc=1');
  });

  it('多行 message 合并（验收点⑥）', () => {
    const result = parseErrorStack(
      'Error: first line\nCaused by: second line\n    at foo (/app/a.js:1:2)',
    );
    expect(result.message).toBe('first line\nCaused by: second line');
    expect(result.frames).toHaveLength(1);
  });

  it('node_modules 帧标记 isNodeModules', () => {
    const result = parseErrorStack(
      'Error: x\n    at bar (/app/node_modules/lib/index.js:9:9)',
    );
    expect(result.frames[0]?.isNodeModules).toBe(true);
  });
});

describe('手动方言覆盖与 JSON 输出', () => {
  it('dialectHint 强制按指定方言解析', () => {
    const text = 'foo@/app/a.js:1:2';
    const forced = parseErrorStack(text, 'safari');
    expect(forced.dialect).toBe('safari');
    expect(forced.frames[0]?.functionName).toBe('foo');
  });

  it('结构化结果可被 JSON.parse 还原且字段固定（验收点 JSON）', () => {
    const result = parseErrorStack(V8_SAMPLE);
    const json = stackToJson(result);
    const restored = JSON.parse(json) as ReturnType<typeof parseErrorStack>;
    expect(restored.dialect).toBe('v8');
    expect(restored.frames).toHaveLength(result.frames.length);
    const keys = Object.keys(restored.frames[0]!).sort();
    expect(keys).toEqual(
      [
        'column',
        'filePath',
        'functionName',
        'isAsync',
        'isEval',
        'isInternal',
        'isNative',
        'isNodeModules',
        'line',
        'raw',
        'unparsed',
      ].sort(),
    );
  });

  it('dialect 类型联合覆盖四种取值', () => {
    const dialects: StackDialect[] = ['v8', 'firefox', 'safari', 'unknown'];
    expect(dialects).toHaveLength(4);
  });
});
