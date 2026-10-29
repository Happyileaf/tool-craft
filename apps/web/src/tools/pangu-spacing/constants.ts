/** 默认混排样例 */
export const DEFAULT_INPUT = `使用React构建界面，覆盖率80%以上。

调用\`fooBar()\`函数处理数据，详情见https://example.com/docs查看。

\`\`\`
const 使用React构建 = true;
\`\`\`
`;

/** 处理模式 */
export type PanguMode = 'add' | 'remove';

/** 模式选项 */
export const MODE_OPTIONS: { label: string; value: PanguMode }[] = [
  { label: '自动留白', value: 'add' },
  { label: '移除留白', value: 'remove' },
];

/** 模式说明 */
export const MODE_DESCRIPTIONS: Record<PanguMode, string> = {
  add: '在中文（含日文假名、全角标点）与英文 / 数字的交界处插入一个空格；围栏代码块、行内代码与 URL 内部保持原样。',
  remove: '仅移除中文与英文 / 数字之间的空格，中文词语之间或代码、URL 内部的空格不受影响。',
};
