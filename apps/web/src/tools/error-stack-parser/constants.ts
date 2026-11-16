/** 错误堆栈解析器的常量与三种引擎方言样例 */

export type SampleKey = 'v8' | 'firefox' | 'safari';

export const SAMPLE_OPTIONS: Array<{ value: SampleKey; label: string }> = [
  { value: 'v8', label: '填充 V8 / Node.js 示例' },
  { value: 'firefox', label: '填充 Firefox 示例' },
  { value: 'safari', label: '填充 Safari 示例' },
];

export const DIALECT_TAG_COLOR: Record<string, string> = {
  v8: 'blue',
  firefox: 'orange',
  safari: 'green',
  unknown: 'default',
};

export const DIALECT_LABEL: Record<string, string> = {
  v8: 'V8（Chrome / Node.js）',
  firefox: 'Firefox（SpiderMonkey）',
  safari: 'Safari（JavaScriptCore）',
  unknown: '未知方言',
};

export const DIALECT_RADIO_OPTIONS = [
  { value: 'unknown', label: '自动识别' },
  { value: 'v8', label: 'V8' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
];

/** V8 / Node.js 典型堆栈（含匿名、async、eval、node: 内置帧与含冒号 message） */
export const V8_SAMPLE = `TypeError: Cannot read properties of undefined (reading 'id'): payload.id missing
    at foo (/app/src/a.js:10:20)
    at Object.<anonymous> (/app/src/b.js:3:5)
    at async loadUser (/app/src/service/user.js:42:9)
    at Constructor.new Service (/app/src/service/base.js:7:13)
    at eval (eval at buildHandler (/app/src/eval-wrapper.js:20:12), <anonymous>:1:30)
    at node:internal/process/task_queues:96:5`;

/** Firefox（SpiderMonkey）典型堆栈，末帧缺列号 */
export const FIREFOX_SAMPLE = `TypeError: this.init is not a function
foo@/app/src/a.js:10:20
bar@/app/src/b.js:3:5
@/app/src/anonymous.js:8:1
loadConfig@file:///opt/app/src/config.js:100`;

/** Safari（JavaScriptCore）典型堆栈，含 (eval) 与 [native code] */
export const SAFARI_SAMPLE = `TypeError: undefined is not an object (evaluating 'a.b')
foo@/app/src/a.js:10:20
bar@/app/src/b.js:3:5
evalCode@/app/src/eval.js:2:8 (eval)
forEach@[native code]`;

export const SAMPLE_MAP: Record<SampleKey, string> = {
  v8: V8_SAMPLE,
  firefox: FIREFOX_SAMPLE,
  safari: SAFARI_SAMPLE,
};

export const STACK_PLACEHOLDER = '粘贴 Error.stack 原始文本（支持 V8 / Firefox / Safari 三种方言，自动识别）';
