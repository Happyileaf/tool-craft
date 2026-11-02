import type { GitObjectType, HashFormat } from './utils/git-object';

/** 对象类型选项 */
export const TYPE_OPTIONS: { value: GitObjectType; label: string; hint: string }[] = [
  {
    value: 'blob',
    label: 'blob（文件内容）',
    hint: '内容前拼接 blob <字节长度>\\0，等价 git hash-object',
  },
  {
    value: 'tree',
    label: 'tree（目录）',
    hint: '每行「模式 名称 对象哈希」，自动二进制规范化与 Git 排序',
  },
  {
    value: 'commit',
    label: 'commit（提交）',
    hint: '对规范化后的 commit 原始文本拼接 commit <长度>\\0',
  },
  {
    value: 'tag',
    label: 'tag（附注标签）',
    hint: '对 annotated tag 原始文本拼接 tag <长度>\\0',
  },
];

/** 哈希格式选项 */
export const FORMAT_OPTIONS: { value: HashFormat; label: string }[] = [
  { value: 'sha1', label: 'SHA-1（默认 Git）' },
  { value: 'sha256', label: 'SHA-256（object-format=sha256）' },
];

export const DEFAULT_TYPE: GitObjectType = 'blob';
export const DEFAULT_FORMAT: HashFormat = 'sha1';

/** 各类型的默认示例输入 */
export const SAMPLE_INPUTS: Record<GitObjectType, string> = {
  blob: 'hello',
  tree: [
    '040000 a.dir d0fd48f8a028d89b630a5c6bb9f94b12ff4c3853',
    '100644 a.txt ce013625030ba8dba906f756967f9e9ca394464a',
    '100644 a.txt2 cc628ccd10742baea8241c5924df992b5c019f71',
  ].join('\n'),
  commit: [
    'tree fc5f8769180d438e4aa0a111b529039629110456',
    'author Happyileaf <997401767@qq.com> 1793594207 +0800',
    'committer trae-solo-agent [origin=scheduled_task] <solo-agent@trae.ai> 1793594207 +0800',
    '',
    'Initial commit',
    '',
  ].join('\n'),
  tag: [
    'object 40da113fbadf8c5dbf6586ad5e73b3248d148751',
    'type commit',
    'tag v1.0',
    'tagger t <t@t.com> 1700000000 +0000',
    '',
    'Release 1.0',
    '',
  ].join('\n'),
};

/** tree 模式支持的模式速查 */
export const TREE_MODE_HINT =
  '支持模式：100644 普通文件 / 100755 可执行文件 / 120000 符号链接 / 40000 或 040000 目录 / 160000 子模块';
