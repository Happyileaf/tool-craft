/**
 * JSON → PHP array 字面量代码生成
 *
 * 纯函数、零依赖：解析 JSON 并输出可直接粘贴的 PHP 数组源码文本。
 * 对象 → 关联数组（'key' =>）、数组 → 索引数组，支持短数组 [] / 传统 array()
 * 与 4 空格 / Tab 缩进切换。
 */

export interface PhpGenOptions {
  /** true：[] 短数组语法；false：array() 传统语法 */
  shortSyntax: boolean;
  /** 缩进单位：4 空格或 Tab */
  indent: 'spaces' | 'tab';
  /** 结尾分号 */
  trailingSemicolon: boolean;
}

export interface PhpGenResult {
  code: string;
  warnings: string[];
}

const DEFAULT_OPTIONS: PhpGenOptions = {
  shortSyntax: true,
  indent: 'spaces',
  trailingSemicolon: true,
};

/** 按 PHP 单引号字符串规则转义：仅转义反斜杠与单引号 */
export function quotePhpString(raw: string): string {
  return `'${raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** 数字字面量：整数原样、浮点保留原始精度，无法表达时回退字符串并告警 */
function formatNumber(n: number, warnings: string[]): string {
  if (!Number.isFinite(n)) {
    warnings.push('JSON 标准不支持 Infinity/NaN，已回退为 null');
    return 'null';
  }
  if (Number.isInteger(n)) return String(n);
  const text = String(n);
  // 指数形式在 PHP 中同样合法（1.0e+21），无需特殊处理
  return text;
}

function arrayOpen(shortSyntax: boolean): string {
  return shortSyntax ? '[' : 'array(';
}

function arrayClose(shortSyntax: boolean): string {
  return shortSyntax ? ']' : ')';
}

function renderValue(
  value: unknown,
  opts: PhpGenOptions,
  depth: number,
  warnings: string[],
): string {
  const unit = opts.indent === 'tab' ? '\t' : '    ';
  const pad = unit.repeat(depth);
  const childPad = unit.repeat(depth + 1);

  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return formatNumber(value, warnings);
  if (typeof value === 'string') return quotePhpString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return arrayOpen(opts.shortSyntax) + arrayClose(opts.shortSyntax);
    const lines = value.map(
      (item) => `${childPad}${renderValue(item, opts, depth + 1, warnings)},`,
    );
    return `${arrayOpen(opts.shortSyntax)}\n${lines.join('\n')}\n${pad}${arrayClose(opts.shortSyntax)}`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return arrayOpen(opts.shortSyntax) + arrayClose(opts.shortSyntax);
    const lines = entries.map(
      ([key, val]) =>
        `${childPad}${quotePhpString(key)} => ${renderValue(val, opts, depth + 1, warnings)},`,
    );
    return `${arrayOpen(opts.shortSyntax)}\n${lines.join('\n')}\n${pad}${arrayClose(opts.shortSyntax)}`;
  }

  warnings.push(`遇到不支持的 JSON 值类型，已回退为 null`);
  return 'null';
}

export function generatePhpArray(jsonText: string, options?: Partial<PhpGenOptions>): PhpGenResult {
  const opts: PhpGenOptions = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  const trimmed = jsonText.trim();
  if (!trimmed) return { code: '', warnings };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch (err) {
    return { code: '', warnings: [`JSON 解析失败：${(err as Error).message}`] };
  }

  const body = renderValue(data, opts, 0, warnings);
  const code = `$data = ${body}${opts.trailingSemicolon ? ';' : ''}\n`;
  return { code, warnings };
}
