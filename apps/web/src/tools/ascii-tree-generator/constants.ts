/**
 * ASCII 文件树生成器常量
 */

/** 默认样例输入 */
export const SAMPLE_INPUT = `src/index.ts
src/utils/format.ts
src/utils/tree.ts
src/components/Button.tsx
package.json
README.md
docs/guide.md`;

/** 默认根名 */
export const DEFAULT_ROOT_NAME = 'project';

/** 排序选项 */
export const SORT_OPTIONS = [
  { label: '字典序（目录优先）', value: 'alpha' },
  { label: '保持输入顺序', value: 'input' },
] as const;

/** 深度快捷选项 */
export const DEPTH_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '1 层', value: 1 },
  { label: '2 层', value: 2 },
  { label: '3 层', value: 3 },
  { label: '5 层', value: 5 },
] as const;
