/**
 * CHANGELOG 生成器的静态配置与默认示例。
 */

/** 默认选项（组件初始 state） */
export const DEFAULT_OPTIONS = {
  version: '1.2.0',
  date: '',
  includeScope: true,
  includeInternal: false,
  includeHeader: false,
};

/** 示例提交批次，覆盖各分组、破坏性变更与未识别行 */
export const SAMPLE_COMMITS = [
  'a1b2c3d feat(api): add rate limiting middleware',
  'd4e5f60 feat(web): add dark mode toggle',
  '7a8b90c fix(auth): repair token refresh race',
  'abc123f perf(db): speed up hot-path queries',
  'def456a docs: rewrite integration guide',
  '123abcd chore: bump dev dependencies',
  'fedcba0 feat!: drop support for Node 14',
  '13579bd fix: patch XSS in comment renderer',
  '2468ace feat: deprecate legacy CSV export',
  '9e0f1a2 chore: remove obsolete webhook',
].join('\n');

/** 注册表 defaultSampleInput 使用的精简示例 */
export const DEFAULT_SAMPLE_INPUT = [
  'feat(api): add rate limiting middleware',
  'fix(auth): repair token refresh race',
  'feat!: drop support for Node 14',
].join('\n');

/** 分组中文说明（用于结果统计区） */
export const SECTION_LABELS: { value: string; label: string; hint: string }[] = [
  { value: 'added', label: 'Added 新增', hint: 'feat 与新增类提交' },
  { value: 'changed', label: 'Changed 变更', hint: 'perf / refactor / docs / revert 及收录的内部类型' },
  { value: 'deprecated', label: 'Deprecated 弃用', hint: '主题含弃用语义' },
  { value: 'removed', label: 'Removed 移除', hint: '主题含移除语义' },
  { value: 'fixed', label: 'Fixed 修复', hint: 'fix 缺陷修复' },
  { value: 'security', label: 'Security 安全', hint: '安全关键词或 security 类型' },
];
