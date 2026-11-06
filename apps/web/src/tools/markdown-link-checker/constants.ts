/**
 * Markdown 链接检查器工具内常量
 */

/** 默认示例文档，覆盖引用不一致、失效锚点、代码块跳过与多类链接 */
export const DEFAULT_MARKDOWN = `# 项目指南

## Hello World!

欢迎阅读，[快速开始][foo] 与 [常见问题][faq] 见对应章节。

紧凑引用 [docs][] 与简写 [repo] 也受支持。

- 有效锚点：[问候](#hello-world)
- 失效锚点：[不存在的章节](#missing-section)
- 外链：<https://example.com> 与裸链 https://github.com
- 邮件：<team@example.com>
- 相对链接：[安装](./install.md)
- 图片：![logo](https://example.com/logo.png)

行内代码中的 [fake](https://should-not-extract.example) 会被忽略。

\`\`\`
[code-fake](https://fence.example)
\`\`\`

[foo]: https://foo.example "Foo"
[docs]: https://docs.example
[repo]: https://repo.example
[unused]: https://unused.example
[foo]: https://duplicate.example`;

/** 输入框行数 */
export const INPUT_ROWS = 14;

/** 链接类型中文标签 */
export const LINK_TYPE_LABELS: Record<string, string> = {
  inline: '行内链接',
  reference: '引用链接',
  definition: '引用定义',
  autolink: '自动链接',
  bare: '裸 URL',
};

/** 链接分类中文标签与 Tag 颜色 */
export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  external: { label: '外链', color: 'blue' },
  relative: { label: '相对链接', color: 'cyan' },
  anchor: { label: '锚点', color: 'purple' },
  mail: { label: '邮件', color: 'green' },
  other: { label: '其他', color: 'default' },
};

/** 问题级别 Tag 颜色 */
export const SEVERITY_COLORS: Record<string, string> = {
  error: 'red',
  warning: 'gold',
  info: 'default',
};

/** 问题代码中文说明 */
export const ISSUE_CODE_LABELS: Record<string, string> = {
  'undefined-reference': '未定义引用',
  'unused-definition': '未使用定义',
  'duplicate-definition': '重复定义',
  'broken-anchor': '失效锚点',
};
