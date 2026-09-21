/**
 * 编辑视图模式枚举
 */
export enum MarkdownModeEnum {
  /** 仅显示 Markdown 源码编辑器 */
  EDIT = 'edit',
  /** 编辑器与预览区左右分屏同时显示 */
  SPLIT = 'split',
  /** 仅显示渲染后的排版预览区 */
  PREVIEW = 'preview',
}

/**
 * 编辑视图模式对应的国际化文案键，键为模式枚举值，值为点分文案路径
 */
export const MarkdownModeLabelKeyMap: Record<MarkdownModeEnum, string> = {
  /** 仅编辑模式文案键 */
  [MarkdownModeEnum.EDIT]: 'tools.markdown.modeEdit',
  /** 分屏模式文案键 */
  [MarkdownModeEnum.SPLIT]: 'tools.markdown.modeSplit',
  /** 仅预览模式文案键 */
  [MarkdownModeEnum.PREVIEW]: 'tools.markdown.modePreview',
};

/**
 * 编辑视图模式选项数据源，供分段切换控件直接渲染
 */
export const MarkdownModeOptions = Object.values(MarkdownModeEnum).map(
  (value) => ({
    /** 模式名称的国际化文案键 */
    label: MarkdownModeLabelKeyMap[value],
    /** 模式枚举值 */
    value,
  }),
);

/**
 * 预览排版主题枚举
 */
export enum MarkdownThemeEnum {
  /** 类 GitHub 标准文档排版 */
  DEFAULT = 'default',
  /** 模拟微信公众号文章的移动端排版 */
  WECHAT = 'wechat',
}

/**
 * 预览排版主题对应的国际化文案键，键为主题枚举值，值为点分文案路径
 */
export const MarkdownThemeLabelKeyMap: Record<MarkdownThemeEnum, string> = {
  /** 标准主题文案键 */
  [MarkdownThemeEnum.DEFAULT]: 'tools.markdown.standardMode',
  /** 微信主题文案键 */
  [MarkdownThemeEnum.WECHAT]: 'tools.markdown.wechatMode',
};

/**
 * 预览排版主题选项数据源，供主题切换控件直接渲染
 */
export const MarkdownThemeOptions = Object.values(MarkdownThemeEnum).map(
  (value) => ({
    /** 主题名称的国际化文案键 */
    label: MarkdownThemeLabelKeyMap[value],
    /** 主题枚举值 */
    value,
  }),
);

/**
 * 工具首次载入时填入的中文样例，覆盖全部支持的 Markdown 语法
 */
export const DEFAULT_MARKDOWN = `# Markdown 预览工具

欢迎使用 **Markdown 在线预览**，这里可以同时体验 *斜体* 与 \`行内代码\` 的渲染效果。

## 核心语法一览

### 无序列表

- 支持 **粗体** 重点标注
- 支持 *斜体* 轻微强调
- 支持 \`行内代码\` 高亮标识符

### 有序列表

1. 在左侧输入 Markdown 源码
2. 右侧实时查看排版效果
3. 一键复制富文本或 HTML

### 代码块

\`\`\`typescript
function greet(name: string): string {
  return \`你好，\${name}！\`;
}
\`\`\`

### 引用与链接

> 简单、高效、直接——一切运算均在浏览器本地完成，数据绝不离开您的设备。

了解更多请访问 [ToolCraft 官网](https://github.com/Happyileaf/tool-craft)，也可以直接访问 https://example.com 。

---

以上即为全部常用语法的渲染示例。`;

/**
 * 快捷插入片段枚举
 */
export enum MarkdownSnippetEnum {
  /** 插入二级标题 */
  H2 = 'H2',
  /** 插入粗体文本 */
  Bold = 'Bold',
  /** 插入无序列表项 */
  List = 'List',
  /** 插入引用块 */
  Quote = 'Quote',
  /** 插入 TypeScript 代码块 */
  CodeBlock = 'CodeBlock',
}

/**
 * 快捷插入片段对应的国际化文案键，键为片段枚举值，值为点分文案路径
 */
export const MarkdownSnippetLabelKeyMap: Record<MarkdownSnippetEnum, string> = {
  /** 二级标题按钮文案键 */
  [MarkdownSnippetEnum.H2]: 'tools.markdown.snippetH2',
  /** 粗体按钮文案键 */
  [MarkdownSnippetEnum.Bold]: 'tools.markdown.snippetBold',
  /** 无序列表按钮文案键 */
  [MarkdownSnippetEnum.List]: 'tools.markdown.snippetList',
  /** 引用块按钮文案键 */
  [MarkdownSnippetEnum.Quote]: 'tools.markdown.snippetQuote',
  /** 代码块按钮文案键 */
  [MarkdownSnippetEnum.CodeBlock]: 'tools.markdown.snippetCodeBlock',
};

/**
 * 快捷插入片段选项数据源，供快捷工具栏直接渲染
 */
export const MarkdownSnippetOptions = Object.values(MarkdownSnippetEnum).map(
  (value) => ({
    /** 片段按钮的国际化文案键 */
    label: MarkdownSnippetLabelKeyMap[value],
    /** 片段枚举值 */
    value,
  }),
);
