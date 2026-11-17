import { describe, expect, it } from 'vitest';
import {
  bbcodeToHtml,
  convertBbcodeHtml,
  escapeHtml,
  htmlToBbcode,
  unescapeHtml,
} from './bbcode';

describe('escapeHtml / unescapeHtml', () => {
  it('转义五个 HTML 特殊字符', () => {
    expect(escapeHtml(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  });

  it('还原命名实体与数字实体', () => {
    expect(unescapeHtml('&lt;&amp;&quot;&#39;&#65;&#x42;')).toBe('<&"\'AB');
  });

  it('未知实体原样保留', () => {
    expect(unescapeHtml('&unknown;')).toBe('&unknown;');
  });
});

describe('bbcodeToHtml 基础样式标签', () => {
  it('转换 b/i/u/s', () => {
    const result = bbcodeToHtml('[b]粗[/b][i]斜[/i][u]下[/u][s]删[/s]');
    expect(result.output).toBe('<strong>粗</strong><em>斜</em><u>下</u><del>删</del>');
    expect(result.tagsHandled).toBe(4);
    expect(result.tagsDropped).toBe(0);
  });

  it('支持嵌套并对未闭合标签自动补齐', () => {
    const result = bbcodeToHtml('[b]外层[i]嵌套[/b]斜体残留');
    expect(result.output).toBe('<strong>外层<em>嵌套</em></strong>斜体残留');
  });

  it('文本节点中的尖括号被转义', () => {
    const result = bbcodeToHtml('a < b && c > d');
    expect(result.output).toBe('a &lt; b &amp;&amp; c &gt; d');
  });
});

describe('bbcodeToHtml 带参数标签', () => {
  it('转换带参与无参 url，并拦截 javascript: 协议', () => {
    const result = bbcodeToHtml(
      '[url=https://a.com]A[/url][url]https://b.org[/url][url=javascript:alert(1)]x[/url]',
    );
    expect(result.output).toContain('<a href="https://a.com">A</a>');
    expect(result.output).toContain('<a href="https://b.org">https://b.org</a>');
    // 危险协议降级为纯文本，不产生任何锚标签
    expect(result.output).toContain('x');
    expect(result.output).not.toContain('javascript:');
  });

  it('转换 img 并清洗非法 src', () => {
    const result = bbcodeToHtml('[img]https://a.com/p.png[/img][img]javascript:x[/img]');
    expect(result.output).toBe('<img src="https://a.com/p.png" alt="" /><img src="" alt="" />');
  });

  it('quote 带署名与不带署名', () => {
    expect(bbcodeToHtml('[quote=Alice]hi[/quote]').output).toBe(
      '<blockquote><p>Alice 写道：</p>hi</blockquote>',
    );
    expect(bbcodeToHtml('[quote]hi[/quote]').output).toBe('<blockquote>hi</blockquote>');
  });

  it('color 校验命名色与十六进制，非法值降级为普通 span', () => {
    expect(bbcodeToHtml('[color=red]x[/color]').output).toBe(
      '<span style="color:red">x</span>',
    );
    expect(bbcodeToHtml('[color=#ff0000]x[/color]').output).toBe(
      '<span style="color:#ff0000">x</span>',
    );
    expect(bbcodeToHtml('[color=expression(1)]x[/color]').output).toBe('<span>x</span>');
  });

  it('size 仅接受 1–7 档位并映射像素', () => {
    expect(bbcodeToHtml('[size=5]x[/size]').output).toBe(
      '<span style="font-size:18px">x</span>',
    );
    expect(bbcodeToHtml('[size=99]x[/size]').output).toBe('<span>x</span>');
  });
});

describe('bbcodeToHtml 列表与代码块', () => {
  it('转换无序列表', () => {
    const result = bbcodeToHtml('[list]\n[*]一\n[*]二\n[/list]');
    expect(result.output).toBe('<ul><li>一</li><li>二</li></ul>');
  });

  it('转换有序列表 [list=1]', () => {
    const result = bbcodeToHtml('[list=1][*]甲[*]乙[/list]');
    expect(result.output).toBe('<ol><li>甲</li><li>乙</li></ol>');
  });

  it('code 内容原样保留且内部标签不解析、实体被转义', () => {
    const result = bbcodeToHtml('[code][b]not bold[/b] <x> &[/code]');
    expect(result.output).toBe(
      '<pre><code>[b]not bold[/b] &lt;x&gt; &amp;</code></pre>',
    );
  });

  it('未知标签计入 dropped 且文本保留', () => {
    const result = bbcodeToHtml('[unknown]x[/unknown]');
    expect(result.tagsDropped).toBeGreaterThan(0);
    expect(result.output).toContain('x');
  });
});

describe('htmlToBbcode', () => {
  it('转换基础样式标签', () => {
    const result = htmlToBbcode('<strong>粗</strong><em>斜</em><u>下</u><del>删</del>');
    expect(result.output).toBe('[b]粗[/b][i]斜[/i][u]下[/u][s]删[/s]');
  });

  it('a 标签在文本与 href 相同时输出无参 url', () => {
    const same = htmlToBbcode('<a href="https://b.org">https://b.org</a>');
    expect(same.output).toBe('[url]https://b.org[/url]');
    const diff = htmlToBbcode('<a href="https://a.com">A</a>');
    expect(diff.output).toBe('[url=https://a.com]A[/url]');
  });

  it('拦截 javascript: 链接与图片', () => {
    expect(htmlToBbcode('<a href="javascript:alert(1)">x</a>').output).toBe('x');
    expect(htmlToBbcode('<img src="javascript:x" />').output).toBe('');
  });

  it('转换 img / blockquote / pre>code', () => {
    expect(htmlToBbcode('<img src="https://a.com/p.png" alt="t" />').output).toBe(
      '[img]https://a.com/p.png[/img]',
    );
    expect(htmlToBbcode('<blockquote>hi</blockquote>').output).toBe('[quote]hi[/quote]');
    expect(htmlToBbcode('<pre><code>const a = 1;</code></pre>').output).toBe(
      '[code]const a = 1;[/code]',
    );
  });

  it('转换有序与无序列表', () => {
    const ul = htmlToBbcode('<ul><li>一</li><li>二</li></ul>');
    expect(ul.output).toBe('[list][*]一[*]二[/list]');
    const ol = htmlToBbcode('<ol><li>甲</li></ol>');
    expect(ol.output).toBe('[list=1][*]甲[/list]');
  });

  it('span 样式映射为 color/size', () => {
    const result = htmlToBbcode(
      '<span style="color:red;font-size:18px">x</span>',
    );
    expect(result.output).toBe('[color=red][size=5]x[/size][/color]');
  });

  it('实体在文本节点被还原，注释被丢弃', () => {
    const result = htmlToBbcode('a &lt; b<!-- comment --> &amp; c');
    expect(result.output).toBe('a < b & c');
  });

  it('未识别标签降级保留内部文本', () => {
    const result = htmlToBbcode('<section><article>hello</article></section>');
    expect(result.output).toBe('hello');
  });
});

describe('convertBbcodeHtml 统一入口与往返', () => {
  it('按方向分派', () => {
    expect(convertBbcodeHtml('[b]x[/b]', 'bbcode2html').output).toBe('<strong>x</strong>');
    expect(convertBbcodeHtml('<b>x</b>', 'html2bbcode').output).toBe('[b]x[/b]');
  });

  it('BBCode → HTML → BBCode 往返保留核心语义', () => {
    const source = '[b]标题[/b] [url=https://a.com]链接[/url] [color=blue]蓝[/color]';
    const html = bbcodeToHtml(source).output;
    const back = htmlToBbcode(html).output;
    expect(back).toBe('[b]标题[/b] [url=https://a.com]链接[/url] [color=blue]蓝[/color]');
  });

  it('空输入返回空输出', () => {
    expect(bbcodeToHtml('').output).toBe('');
    expect(htmlToBbcode('').output).toBe('');
  });
});
