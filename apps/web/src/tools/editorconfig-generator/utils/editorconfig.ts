/**
 * .editorconfig 生成与反向解析（零依赖纯函数）
 *
 * 文件格式（INI 风格，参见 https://editorconfig.org）：
 * - 可选首行 `root = true`，仅允许出现在任何 section 之前；
 * - 每个 section 由 glob 头 `[glob]` 与若干 `key = value` 属性行组成；
 * - `#` / `;` 开头为注释，section 之间以空行分隔。
 *
 * 本模块不触碰 DOM 与 React，错误与告警以结果对象返回而非抛出。
 */

export type CharsetOption = 'utf-8' | 'utf-8-bom' | 'utf-16be' | 'utf-16le' | 'latin1';

export type EolOption = 'lf' | 'crlf' | 'cr';

/** 单个 glob section 下的属性集合，undefined 表示不输出该项 */
export interface BaseSettings {
  charset?: CharsetOption;
  endOfLine?: EolOption;
  indentStyle?: 'space' | 'tab';
  indentSize?: number | 'tab';
  tabWidth?: number;
  insertFinalNewline?: boolean;
  trimTrailingWhitespace?: boolean;
  maxLineLength?: number | 'off';
}

export interface ConfigSection {
  glob: string;
  settings: BaseSettings;
}

export interface EditorConfigModel {
  root: boolean;
  sections: ConfigSection[];
}

export interface GenerateResult {
  /** 序列化后的 .editorconfig 文本；存在校验错误时为空字符串 */
  output: string;
  valid: boolean;
  error: string | null;
  warnings: string[];
}

export interface ParseResult {
  model: EditorConfigModel;
  valid: boolean;
  error: string | null;
  warnings: string[];
}

/** 内部 camelCase 属性名 → 文件中的属性名 */
export const KEY_MAP = {
  charset: 'charset',
  endOfLine: 'end_of_line',
  indentStyle: 'indent_style',
  indentSize: 'indent_size',
  tabWidth: 'tab_width',
  insertFinalNewline: 'insert_final_newline',
  trimTrailingWhitespace: 'trim_trailing_whitespace',
  maxLineLength: 'max_line_length',
} as const;

/** 属性固定输出顺序 */
const SETTING_KEYS = [
  'charset',
  'endOfLine',
  'indentStyle',
  'indentSize',
  'tabWidth',
  'insertFinalNewline',
  'trimTrailingWhitespace',
  'maxLineLength',
] as const satisfies ReadonlyArray<keyof BaseSettings>;

/** 文件属性名 → 内部 camelCase 属性名 */
const REVERSE_KEY_MAP: Record<string, keyof BaseSettings> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([camel, snake]) => [snake, camel as keyof BaseSettings]),
);

function formatValue(value: boolean | number | string): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/** 判断一个值是否为有效正整数（字符串数字同样接受） */
function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/**
 * 将模型序列化为 .editorconfig 文本。
 * root=true 时首行输出 `root = true`；section 间空行分隔；
 * 属性按 KEY_MAP 固定顺序输出，undefined 的属性跳过。
 */
export function generateEditorConfig(model: EditorConfigModel): GenerateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenGlobs = new Set<string>();

  model.sections.forEach((section, index) => {
    const where = `第 ${index + 1} 段「[${section.glob}]」`;
    if (section.glob.trim() === '') {
      errors.push(`${where}：glob 不能为空`);
    }
    if (/[\r\n]/.test(section.glob)) {
      errors.push(`${where}：glob 不能包含换行符`);
    }
    if (section.glob.trim() !== '' && seenGlobs.has(section.glob)) {
      warnings.push(`glob「${section.glob}」出现了多个 section，后者会叠加/覆盖同名属性`);
    }
    seenGlobs.add(section.glob);

    const { indentSize, tabWidth, maxLineLength } = section.settings;
    if (
      typeof indentSize === 'number' &&
      (!isPositiveInteger(indentSize) || indentSize > 24)
    ) {
      errors.push(`${where}：indent_size 必须是 1..24 的整数（或 tab）`);
    }
    if (typeof tabWidth === 'number' && (!isPositiveInteger(tabWidth) || tabWidth > 24)) {
      errors.push(`${where}：tab_width 必须是 1..24 的整数`);
    }
    if (typeof maxLineLength === 'number' && !isPositiveInteger(maxLineLength)) {
      errors.push(`${where}：max_line_length 必须是 ≥1 的整数（或 off）`);
    }
  });

  if (errors.length > 0) {
    return { output: '', valid: false, error: errors[0]!, warnings };
  }

  const blocks: string[] = [];
  let propertyCount = 0;
  if (model.root) {
    blocks.push('root = true');
  }

  model.sections.forEach((section) => {
    const lines: string[] = [`[${section.glob}]`];
    SETTING_KEYS.forEach((key) => {
      const value = section.settings[key];
      if (value === undefined) return;
      propertyCount += 1;
      lines.push(`${KEY_MAP[key]} = ${formatValue(value)}`);
    });
    blocks.push(lines.join('\n'));
  });

  if (model.sections.length === 0 || propertyCount === 0) {
    warnings.push('当前没有任何 section 属性，生成的配置不会对编辑器生效');
  }

  return { output: blocks.join('\n\n'), valid: true, error: null, warnings };
}

/** 解析字符串值：true/false → 布尔，纯数字 → number，其余原样保留 */
function parseRawValue(raw: string): boolean | number | string {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

/**
 * 反向解析 .editorconfig 文本：
 * 识别 section 之前的 `root = true/false`、`[glob]` 头与 `key = value` 属性；
 * 忽略注释行（# / ;）与空行；未知 key、畸形行仅告警跳过，不抛异常。
 */
export function parseEditorConfig(text: string): ParseResult {
  const warnings: string[] = [];
  const sections: ConfigSection[] = [];
  let root = false;
  let current: ConfigSection | null = null;
  let rootSeen = false;
  let rootAfterSection = false;

  text.split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      return;
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const glob = trimmed.slice(1, -1).trim();
      if (glob === '') {
        warnings.push(`第 ${lineIndex + 1} 行：section 的 glob 为空`);
      }
      current = { glob, settings: {} };
      sections.push(current);
      return;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      warnings.push(`第 ${lineIndex + 1} 行：无法识别的内容「${trimmed}」，已忽略`);
      return;
    }

    const key = trimmed.slice(0, equalIndex).trim().toLowerCase();
    const rawValue = trimmed.slice(equalIndex + 1).trim();

    if (key === 'root') {
      rootSeen = true;
      if (sections.length > 0 && !rootAfterSection) {
        warnings.push(`第 ${lineIndex + 1} 行：root 仅在首个 section 之前有效，此处已忽略`);
        rootAfterSection = true;
      }
      if (rawValue === 'true' && sections.length === 0) {
        root = true;
      } else if (rawValue !== 'false' && rawValue !== 'true') {
        warnings.push(`第 ${lineIndex + 1} 行：root 只接受 true/false`);
      }
      return;
    }

    if (rawValue === '') {
      warnings.push(`第 ${lineIndex + 1} 行：属性「${key}」缺少取值，已忽略`);
      return;
    }

    if (!current) {
      warnings.push(`第 ${lineIndex + 1} 行：属性「${key}」出现在任何 section 之外，已忽略`);
      return;
    }

    const settingKey = REVERSE_KEY_MAP[key];
    if (!settingKey) {
      warnings.push(`第 ${lineIndex + 1} 行：未知属性「${key}」，已忽略`);
      return;
    }

    const parsed = parseRawValue(rawValue);
    // 类型在读取侧按属性约定使用；indent_size 的特殊值 'tab' 原样保留
    current.settings[settingKey] = parsed as never;
  });

  if (rootSeen && sections.length === 0) {
    warnings.push('仅包含 root 声明，没有任何 section');
  }

  return { model: { root, sections }, valid: true, error: null, warnings };
}
