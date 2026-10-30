/**
 * .editorconfig 生成器内常量：属性选项与常用文件类型预设
 */

import type { BaseSettings, CharsetOption, EolOption, EditorConfigModel } from './utils/editorconfig';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/** charset 支持的取值（https://editorconfig.org 官方属性） */
export const CHARSET_OPTIONS: SelectOption<CharsetOption>[] = [
  { value: 'utf-8', label: 'UTF-8（utf-8）' },
  { value: 'utf-8-bom', label: 'UTF-8 带 BOM（utf-8-bom）' },
  { value: 'utf-16be', label: 'UTF-16 大端（utf-16be）' },
  { value: 'utf-16le', label: 'UTF-16 小端（utf-16le）' },
  { value: 'latin1', label: 'Latin-1（latin1）' },
];

/** end_of_line 支持的取值 */
export const EOL_OPTIONS: SelectOption<EolOption>[] = [
  { value: 'lf', label: 'LF（Unix / macOS，lf）' },
  { value: 'crlf', label: 'CRLF（Windows，crlf）' },
  { value: 'cr', label: 'CR（经典 Mac，cr）' },
];

/** indent_style 支持的取值 */
export const INDENT_STYLE_OPTIONS: SelectOption<'space' | 'tab'>[] = [
  { value: 'space', label: '空格（space）' },
  { value: 'tab', label: '制表符（tab）' },
];

/** 布尔属性通用选项 */
export const BOOLEAN_OPTIONS: SelectOption<'true' | 'false'>[] = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

/** 预设 section 定义 */
export interface SectionPreset {
  /** 展示名称（中文） */
  label: string;
  /** section glob 头 */
  glob: string;
  /** 该预设固定输出的属性 */
  settings: BaseSettings;
}

/**
 * 常用预设：通用项 `*` 作为主表单，其余可在左侧勾选追加；
 * 同一属性在更靠后、匹配更精确的 section 中会覆盖通用值。
 */
export const PRESETS: SectionPreset[] = [
  {
    label: '通用 `*`（所有文件）',
    glob: '*',
    settings: {
      charset: 'utf-8',
      endOfLine: 'lf',
      indentStyle: 'space',
      indentSize: 2,
      insertFinalNewline: true,
      trimTrailingWhitespace: true,
      maxLineLength: 'off',
    },
  },
  {
    label: 'JavaScript / TypeScript',
    glob: '*.{js,ts,jsx,tsx}',
    settings: { indentStyle: 'space', indentSize: 2 },
  },
  {
    label: 'JSON / YAML',
    glob: '*.{json,yml,yaml}',
    settings: { indentStyle: 'space', indentSize: 2 },
  },
  {
    label: 'Markdown（保留尾随空格）',
    glob: '*.md',
    settings: { trimTrailingWhitespace: false },
  },
  {
    label: 'Makefile（必须用 Tab）',
    glob: 'Makefile',
    settings: { indentStyle: 'tab' },
  },
  {
    label: 'HTML / CSS',
    glob: '*.{html,css}',
    settings: { indentStyle: 'space', indentSize: 2 },
  },
];

/** 通用 `*` 预设（主表单） */
export const GENERIC_PRESET = PRESETS[0]!;

/** 通用预设之外、可勾选追加的预设 */
export const EXTRA_PRESETS = PRESETS.slice(1);

/** 默认模型：root=true，仅含启用的通用 `*` 段 */
export const DEFAULT_MODEL: EditorConfigModel = {
  root: true,
  sections: [
    {
      glob: GENERIC_PRESET.glob,
      settings: { ...GENERIC_PRESET.settings },
    },
  ],
};
