/**
 * BBCode ↔ HTML 双向转换器静态配置
 *
 * 设计说明：
 * - 纯字符串映射 + 确定性解析，零运行时依赖，全部逻辑在浏览器主线程完成
 * - 覆盖论坛最常见标签：b/i/u/s、url、img、quote、list、code、color、size
 * - 文本节点统一做 HTML 实体转义 / 还原，防止标记注入
 */

/** 转换方向 */
export type ConvertDirection = 'bbcode2html' | 'html2bbcode';

/** 方向选项（供 Segmented 使用） */
export const DIRECTION_OPTIONS: ReadonlyArray<{ id: ConvertDirection; name: string }> = [
  { id: 'bbcode2html', name: 'BBCode → HTML' },
  { id: 'html2bbcode', name: 'HTML → BBCode' },
];

/** BBCode 字号档位（1–7）到 HTML 像素字号的映射 */
export const BBCODE_SIZE_TO_PX: Record<number, number> = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
  6: 24,
  7: 32,
};

/** HTML 像素字号反向取最近的 BBCode 字号档位 */
export const PX_TO_BBCODE_SIZE: Array<{ px: number; size: number }> = [
  { px: 10, size: 1 },
  { px: 12, size: 2 },
  { px: 14, size: 3 },
  { px: 16, size: 4 },
  { px: 18, size: 5 },
  { px: 24, size: 6 },
  { px: 32, size: 7 },
];

/** 允许出现在 [color=...] 中的颜色值白名单（命名色），其余值按十六进制校验 */
export const NAMED_COLORS: ReadonlySet<string> = new Set([
  'black',
  'silver',
  'gray',
  'white',
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
  'orange',
]);

/** 默认样例输入：覆盖嵌套样式、带参标签、列表与代码块 */
export const DEFAULT_BBCODE = `[b]加粗文本[/b] 与 [i]斜体[/i] 与 [u]下划线[/u] 与 [s]删除线[/s]

[url=https://example.com]示例链接[/url]，无参数链接：[url]https://example.org[/url]

[quote=Alice]
这是一段引用，支持 [b]嵌套[/b] 标记。
[/quote]

[list]
[*]无序列表第一项
[*]第二项包含 [color=red]红色文字[/color]
[*]第三项字号 [size=5]较大[/size]
[/list]

[list=1]
[*]有序列表第一项
[*]有序列表第二项
[/list]

[img]https://example.com/banner.png[/img]

[code]const greet = (name) => \`Hello, \${name}!\`;[/code]`;

/** 与 DEFAULT_BBCODE 等价的 HTML 样例，供反向转换演示 */
export const DEFAULT_HTML = `<p><strong>加粗文本</strong> 与 <em>斜体</em> 与 <u>下划线</u> 与 <del>删除线</del></p>
<p><a href="https://example.com">示例链接</a>，无参数链接：<a href="https://example.org">https://example.org</a></p>
<blockquote><p>Alice 写道：</p><p>这是一段引用，支持 <strong>嵌套</strong> 标记。</p></blockquote>
<ul>
<li>无序列表第一项</li>
<li>第二项包含 <span style="color:red">红色文字</span></li>
<li>第三项字号 <span style="font-size:18px">较大</span></li>
</ul>
<ol>
<li>有序列表第一项</li>
<li>有序列表第二项</li>
</ol>
<p><img src="https://example.com/banner.png" alt="" /></p>
<pre><code>const greet = (name) => \`Hello, \${name}!\`;</code></pre>`;
