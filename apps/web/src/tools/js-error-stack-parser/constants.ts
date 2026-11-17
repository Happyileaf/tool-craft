import type { StackEngine } from './utils/stack';

export const ENGINE_OPTIONS: Array<{ value: StackEngine; label: string }> = [
  { value: 'unknown', label: '自动识别' },
  { value: 'v8', label: 'V8（Chrome / Node / Electron）' },
  { value: 'firefox', label: 'Firefox（SpiderMonkey）' },
  { value: 'jsc', label: 'Safari（JavaScriptCore）' },
];

export const SAMPLE_V8 = `TypeError: Cannot read properties of undefined (reading 'id')
    at loadUser (/app/src/services/user.js:42:17)
    at async handleRequest (/app/src/routes/user.ts:18:5)
    at Object.<anonymous> (/app/src/index.js:9:3)
    at node:internal/process/task_queues:96:5`;

export const SAMPLE_FIREFOX = `TypeError: config is undefined
loadConfig@https://example.com/assets/app.js:12:9
bootstrap@https://example.com/assets/app.js:48:3
@https://example.com/assets/entry.js:2:1`;

export const SAMPLE_JSC = `TypeError: undefined is not an object (evaluating 'config.host')
loadConfig@https://example.com/assets/app.js:12:9
bootstrap@eval code:3:8
eval@[native code]
asyncFunctionResume@[native code]`;

export const SAMPLES: Array<{ key: StackEngine; label: string; text: string }> = [
  { key: 'v8', label: 'V8 示例', text: SAMPLE_V8 },
  { key: 'firefox', label: 'Firefox 示例', text: SAMPLE_FIREFOX },
  { key: 'jsc', label: 'Safari 示例', text: SAMPLE_JSC },
];
