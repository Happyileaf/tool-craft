import { describe, expect, it } from 'vitest';
import {
  detectEngine,
  filterFrames,
  parseStack,
  serializeResult,
} from './stack';

const V8_STACK = `TypeError: Cannot read properties of undefined (reading 'id')
    at foo (/app/src/a.js:10:20)
    at Object.<anonymous> (/app/src/b.js:3:5)
    at node:internal/process/task_queues:96:5`;

const FIREFOX_STACK = `foo@/app/src/a.js:10:20
bar@/app/src/b.js:3:5`;

const SAFARI_STACK = `foo@https://example.com/app.js:10:20
bar@eval code:3:8
eval@[native code]
asyncFunctionResume@[native code]`;

describe('引擎自动识别', () => {
  it('V8 / Firefox / JSC 三方言判定', () => {
    expect(detectEngine(V8_STACK.split('\n'))).toBe('v8');
    expect(detectEngine(FIREFOX_STACK.split('\n'))).toBe('firefox');
    expect(detectEngine(SAFARI_STACK.split('\n'))).toBe('jsc');
    expect(detectEngine(['some random message'])).toBe('unknown');
  });
});

describe('V8 解析', () => {
  it('错误头、三帧字段与 node: 内置标签', () => {
    const result = parseStack(V8_STACK);
    expect(result.engine).toBe('v8');
    expect(result.header?.name).toBe('TypeError');
    expect(result.header?.message).toContain("Cannot read properties of undefined");
    expect(result.frames).toHaveLength(3);

    const first = result.frames[0];
    expect(first?.functionName).toBe('foo');
    expect(first?.file).toBe('/app/src/a.js');
    expect(first?.line).toBe(10);
    expect(first?.column).toBe(20);
    expect(first?.flags.nodeInternal).toBe(false);

    const second = result.frames[1];
    expect(second?.functionName).toBe('Object.<anonymous>');
    expect(second?.file).toBe('/app/src/b.js');

    const third = result.frames[2];
    expect(third?.flags.nodeInternal).toBe(true);
    expect(third?.file).toBe('node:internal/process/task_queues');
    expect(third?.line).toBe(96);
    expect(third?.column).toBe(5);

    expect(result.firstUserFrameIndex).toBe(0);
  });

  it('匿名帧、async、new 构造、eval 嵌套与 native 帧', () => {
    const stack = [
      'Error: boom',
      '    at /app/x.js:1:1',
      '    at async main (/app/main.ts:8:3)',
      '    at new Widget (/app/widget.ts:2:9)',
      '    at eval (eval at prepare (/app/loader.js:4:5), /app/gen.js:6:7)',
      '    at Array.forEach (native)',
    ].join('\n');
    const result = parseStack(stack);
    expect(result.frames).toHaveLength(5);

    expect(result.frames[0]?.functionName).toBe('<anonymous>');
    expect(result.frames[0]?.file).toBe('/app/x.js');

    expect(result.frames[1]?.flags.async).toBe(true);
    expect(result.frames[1]?.functionName).toBe('main');

    expect(result.frames[2]?.flags.constructor).toBe(true);
    expect(result.frames[2]?.functionName).toBe('Widget');

    const evalFrame = result.frames[3];
    expect(evalFrame?.flags.eval).toBe(true);
    expect(evalFrame?.file).toBe('/app/gen.js');
    expect(evalFrame?.line).toBe(6);
    expect(evalFrame?.column).toBe(7);

    const nativeFrame = result.frames[4];
    expect(nativeFrame?.flags.native).toBe(true);
    expect(nativeFrame?.file).toBeNull();
    expect(nativeFrame?.line).toBeNull();
  });

  it('缺列号时 column 为 null 且不报错', () => {
    const result = parseStack('Error: x\n    at foo (/app/a.js:10)');
    expect(result.frames[0]?.line).toBe(10);
    expect(result.frames[0]?.column).toBeNull();
  });
});

describe('Firefox 解析', () => {
  it('字段与 V8 示例等价', () => {
    const result = parseStack(FIREFOX_STACK);
    expect(result.engine).toBe('firefox');
    expect(result.frames).toHaveLength(2);
    expect(result.frames[0]).toMatchObject({
      functionName: 'foo',
      file: '/app/src/a.js',
      line: 10,
      column: 20,
    });
    expect(result.frames[1]).toMatchObject({
      functionName: 'bar',
      file: '/app/src/b.js',
      line: 3,
      column: 5,
    });
  });
});

describe('Safari / JSC 解析', () => {
  it('eval code 与 native code 帧打 flag 且无位置也不报错', () => {
    const result = parseStack(SAFARI_STACK);
    expect(result.engine).toBe('jsc');
    expect(result.frames).toHaveLength(4);

    expect(result.frames[1]?.flags.eval).toBe(true);
    expect(result.frames[1]?.file).toBe('eval code');
    expect(result.frames[1]?.line).toBe(3);

    const nativeEval = result.frames[2];
    expect(nativeEval?.flags.native).toBe(true);
    expect(nativeEval?.functionName).toBe('eval');
    expect(nativeEval?.file).toBeNull();

    expect(result.frames[3]?.flags.native).toBe(true);
    expect(result.frames[3]?.functionName).toBe('asyncFunctionResume');
  });
});

describe('过滤与首帧', () => {
  it('隐藏 node: 内置后剩 2 帧；仅看用户代码排除内置与 node_modules', () => {
    const withModules = [
      V8_STACK,
      '    at run (/app/node_modules/lib/index.js:1:1)',
    ].join('\n');
    const result = parseStack(withModules);
    expect(result.frames).toHaveLength(4);
    expect(result.frames[3]?.flags.nodeModules).toBe(true);

    const hideInternal = filterFrames(result.frames, { hideNodeInternal: true });
    expect(hideInternal).toHaveLength(3);

    const userOnly = filterFrames(result.frames, { userOnly: true });
    expect(userOnly.map((f) => f.functionName)).toEqual(['foo', 'Object.<anonymous>']);
    expect(result.firstUserFrameIndex).toBe(0);
  });

  it('关键字过滤命中函数名或文件', () => {
    const result = parseStack(V8_STACK);
    expect(filterFrames(result.frames, { keyword: 'a.js' })).toHaveLength(1);
    expect(filterFrames(result.frames, { keyword: 'nope' })).toHaveLength(0);
  });
});

describe('边界情况', () => {
  it('空输入给空结果而非异常', () => {
    const result = parseStack('');
    expect(result.frames).toHaveLength(0);
    expect(result.header).toBeNull();
    expect(result.engine).toBe('unknown');
    expect(result.firstUserFrameIndex).toBeNull();
  });

  it('无法识别的怪行保留 raw 并标记 unparsed，不丢失', () => {
    const result = parseStack('Error: x\n    at ??? weird frame without location\n    at ok (/app/ok.js:1:2)');
    expect(result.frames).toHaveLength(2);
    expect(result.frames[0]?.flags.unparsed).toBe(true);
    expect(result.frames[0]?.raw).toContain('weird frame');
    expect(result.frames[1]?.flags.unparsed).toBe(false);
    expect(result.frames[1]?.functionName).toBe('ok');
  });

  it('Caused by 等附加消息行被保留', () => {
    const result = parseStack('Error: outer\n    at foo (/a.js:1:1)\nCaused by: Error: inner');
    expect(result.header?.name).toBe('Error');
    expect(result.extraMessages).toContain('Caused by: Error: inner');
  });

  it('序列化 JSON 可被 JSON.parse 还原且字段固定', () => {
    const result = parseStack(V8_STACK);
    const json = serializeResult(result);
    const restored = JSON.parse(json) as {
      engine: string;
      frames: Array<Record<string, unknown>>;
    };
    expect(restored.engine).toBe('v8');
    expect(restored.frames).toHaveLength(3);
    expect(Object.keys(restored.frames[0] as Record<string, unknown>).sort()).toEqual(
      ['column', 'file', 'flags', 'functionName', 'index', 'line', 'raw'].sort(),
    );
  });

  it('手动指定引擎覆盖自动判定', () => {
    const result = parseStack(FIREFOX_STACK, 'v8');
    // V8 语法下 @ 行无法成为帧，落入消息
    expect(result.engine).toBe('v8');
    expect(result.frames).toHaveLength(0);
  });
});
