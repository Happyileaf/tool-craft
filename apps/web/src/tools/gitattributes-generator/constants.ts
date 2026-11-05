/**
 * .gitattributes 生成器内常量：全局换行策略、属性分组、二进制预设与项目模板
 */

import type { GitAttributeRule, GlobalLinePolicy } from './utils/gitattributes';

/** 通用下拉选项 */
export interface SelectOption<T extends string> {
  /** 选项值 */
  value: T;
  /** 展示文案 */
  label: string;
}

/** 全局换行符策略选项 */
export const GLOBAL_POLICY_OPTIONS: SelectOption<GlobalLinePolicy>[] = [
  { value: 'none', label: '不设置（使用 Git 默认行为）' },
  { value: 'auto', label: '* text=auto（Git 自动识别文本）' },
  { value: 'auto-lf', label: '* text=auto eol=lf（统一 LF 换行）' },
  { value: 'auto-crlf', label: '* text=auto eol=crlf（统一 CRLF 换行）' },
];

/** 单个属性选项 */
export interface AttributeOption {
  /** 写入规则的属性值；linguist-language= / merge= / diff= 为带值前缀，取值在表单中补全 */
  value: string;
  /** 展示文案 */
  label: string;
  /** 可选补充说明 */
  description?: string;
}

/** 属性分组定义 */
export interface AttributeGroupDef {
  /** 分组唯一 key */
  key: string;
  /** 分组展示名 */
  label: string;
  /** 组内属性选项 */
  options: AttributeOption[];
}

/** 规则属性多选的分组选项，顺序即多选框中的展示顺序 */
export const ATTRIBUTE_GROUPS: AttributeGroupDef[] = [
  {
    key: 'text-eol',
    label: '文本与换行',
    options: [
      { value: 'text', label: 'text（按文本处理，入库时规范化换行）' },
      { value: '-text', label: '-text（不做文本换行转换）' },
      { value: 'eol=lf', label: 'eol=lf（检出时使用 LF）' },
      { value: 'eol=crlf', label: 'eol=crlf（检出时使用 CRLF）' },
      {
        value: 'working-tree-encoding',
        label: 'working-tree-encoding（工作区编码声明）',
      },
    ],
  },
  {
    key: 'binary',
    label: '二进制 / diff / merge',
    options: [
      {
        value: 'binary',
        label: 'binary（标记为二进制文件）',
        description: 'binary 等价于 -diff -merge -text：不生成文本 diff、不参与文本合并、不做换行转换',
      },
      { value: '-diff', label: '-diff（视为二进制，不显示文本差异）' },
      { value: 'diff', label: 'diff（强制按文本生成差异）' },
      { value: 'merge', label: 'merge（参与标准文本三方合并）' },
      { value: '-merge', label: '-merge（不合并，冲突时保留当前版本）' },
    ],
  },
  {
    key: 'linguist',
    label: 'GitHub Linguist',
    options: [
      { value: 'linguist-vendored', label: 'linguist-vendored（第三方依赖，语言统计忽略）' },
      { value: 'linguist-generated', label: 'linguist-generated（生成产物，diff 默认折叠）' },
      { value: 'linguist-documentation', label: 'linguist-documentation（文档，不计入语言统计）' },
      { value: 'linguist-language=', label: 'linguist-language=XXX（强制语言，XXX 可输入）' },
      { value: 'linguist-detectable', label: 'linguist-detectable（强制纳入语言检测）' },
      { value: '-linguist-detectable', label: '-linguist-detectable（排除语言检测）' },
    ],
  },
  {
    key: 'export',
    label: '归档导出（git archive）',
    options: [
      { value: 'export-ignore', label: 'export-ignore（git archive 打包时排除）' },
      { value: 'export-subst', label: 'export-subst（导出时展开提交信息占位符）' },
    ],
  },
  {
    key: 'driver',
    label: '自定义 driver',
    options: [
      { value: 'merge=', label: 'merge=xxx（自定义合并驱动，xxx 可输入）' },
      { value: 'diff=', label: 'diff=xxx（自定义 diff 驱动，xxx 可输入）' },
    ],
  },
];

/** 二进制预设中的单条规则 */
export interface BinaryPresetRule {
  /** 匹配 pattern */
  pattern: string;
  /** 固定属性 */
  attributes: string[];
}

/** 二进制预设分组 */
export interface BinaryPreset {
  /** 预设唯一 key */
  key: string;
  /** 展示名 */
  label: string;
  /** 该预设包含的二进制规则 */
  rules: BinaryPresetRule[];
}

/** 常用二进制文件预设，点击后整体追加为可编辑规则行 */
export const BINARY_PRESETS: BinaryPreset[] = [
  {
    key: 'images',
    label: '图片',
    rules: [
      { pattern: '*.png', attributes: ['binary'] },
      { pattern: '*.jpg', attributes: ['binary'] },
      { pattern: '*.jpeg', attributes: ['binary'] },
      { pattern: '*.gif', attributes: ['binary'] },
      { pattern: '*.webp', attributes: ['binary'] },
      { pattern: '*.ico', attributes: ['binary'] },
      { pattern: '*.bmp', attributes: ['binary'] },
      { pattern: '*.tiff', attributes: ['binary'] },
    ],
  },
  {
    key: 'fonts',
    label: '字体',
    rules: [
      { pattern: '*.woff', attributes: ['binary'] },
      { pattern: '*.woff2', attributes: ['binary'] },
      { pattern: '*.ttf', attributes: ['binary'] },
      { pattern: '*.otf', attributes: ['binary'] },
      { pattern: '*.eot', attributes: ['binary'] },
    ],
  },
  {
    key: 'archives',
    label: '压缩包',
    rules: [
      { pattern: '*.zip', attributes: ['binary'] },
      { pattern: '*.tar.gz', attributes: ['binary'] },
      { pattern: '*.tgz', attributes: ['binary'] },
      { pattern: '*.gz', attributes: ['binary'] },
      { pattern: '*.bz2', attributes: ['binary'] },
      { pattern: '*.xz', attributes: ['binary'] },
      { pattern: '*.7z', attributes: ['binary'] },
      { pattern: '*.rar', attributes: ['binary'] },
    ],
  },
  {
    key: 'office',
    label: '办公文档',
    rules: [
      { pattern: '*.docx', attributes: ['binary'] },
      { pattern: '*.xlsx', attributes: ['binary'] },
      { pattern: '*.pptx', attributes: ['binary'] },
      { pattern: '*.doc', attributes: ['binary'] },
      { pattern: '*.xls', attributes: ['binary'] },
      { pattern: '*.ppt', attributes: ['binary'] },
      { pattern: '*.pdf', attributes: ['binary'] },
    ],
  },
  {
    key: 'media',
    label: '音视频',
    rules: [
      { pattern: '*.mp3', attributes: ['binary'] },
      { pattern: '*.wav', attributes: ['binary'] },
      { pattern: '*.flac', attributes: ['binary'] },
      { pattern: '*.ogg', attributes: ['binary'] },
      { pattern: '*.mp4', attributes: ['binary'] },
      { pattern: '*.avi', attributes: ['binary'] },
      { pattern: '*.mov', attributes: ['binary'] },
      { pattern: '*.mkv', attributes: ['binary'] },
    ],
  },
];

/** 项目模板中的单条规则（id 由组件填充） */
export interface TemplateRule {
  /** 匹配 pattern */
  pattern: string;
  /** 属性列表 */
  attributes: string[];
  /** 是否启用 */
  enabled: boolean;
  /** 输出时的分组注释名 */
  group: string;
}

/** 项目模板定义 */
export interface ProjectTemplate {
  /** 模板唯一 key */
  key: string;
  /** 展示名 */
  label: string;
  /** 模板说明 */
  description: string;
  /** 填充的规则集合 */
  rules: TemplateRule[];
}

/** 内置项目模板，点击后整体替换当前规则列表 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: 'node',
    label: 'Node.js',
    description: '统一 LF 换行，标记 node_modules / dist 并忽略归档目录',
    rules: [
      { pattern: '*.sh', attributes: ['text', 'eol=lf'], enabled: true, group: '换行符' },
      { pattern: '*.{cmd,bat}', attributes: ['text', 'eol=crlf'], enabled: true, group: '换行符' },
      {
        pattern: '*.{js,jsx,ts,tsx,json,css,html,md,yml,yaml}',
        attributes: ['text', 'eol=lf'],
        enabled: true,
        group: '换行符',
      },
      { pattern: 'node_modules/', attributes: ['linguist-vendored'], enabled: true, group: 'Linguist' },
      { pattern: 'dist/', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
      { pattern: 'coverage/', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
      { pattern: '.github/', attributes: ['export-ignore'], enabled: true, group: '归档导出' },
    ],
  },
  {
    key: 'python',
    label: 'Python',
    description: '源码统一 LF，虚拟环境标记 vendored，文档与生成文件分类',
    rules: [
      { pattern: '*.py', attributes: ['text', 'eol=lf'], enabled: true, group: '换行符' },
      { pattern: '*.sh', attributes: ['text', 'eol=lf'], enabled: true, group: '换行符' },
      { pattern: '*.{cmd,bat}', attributes: ['text', 'eol=crlf'], enabled: true, group: '换行符' },
      { pattern: '.venv/', attributes: ['linguist-vendored'], enabled: true, group: 'Linguist' },
      { pattern: 'venv/', attributes: ['linguist-vendored'], enabled: true, group: 'Linguist' },
      { pattern: '*_pb2.py', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
      { pattern: 'docs/', attributes: ['linguist-documentation'], enabled: true, group: 'Linguist' },
      { pattern: '*.whl', attributes: ['binary'], enabled: true, group: '二进制文件' },
    ],
  },
  {
    key: 'unity',
    label: 'Unity',
    description: 'C# 与 YAML 资源走文本合并驱动，美术资源标记二进制',
    rules: [
      { pattern: '*.cs', attributes: ['text', 'eol=lf'], enabled: true, group: 'Unity 文本资源' },
      { pattern: '*.meta', attributes: ['text', 'eol=lf'], enabled: true, group: 'Unity 文本资源' },
      {
        pattern: '*.unity',
        attributes: ['merge=unityyamlmerge', 'eol=lf'],
        enabled: true,
        group: 'Unity 文本资源',
      },
      {
        pattern: '*.prefab',
        attributes: ['merge=unityyamlmerge', 'eol=lf'],
        enabled: true,
        group: 'Unity 文本资源',
      },
      {
        pattern: '*.asset',
        attributes: ['merge=unityyamlmerge', 'eol=lf'],
        enabled: true,
        group: 'Unity 文本资源',
      },
      { pattern: '*.png', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: '*.jpg', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: '*.wav', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: '*.fbx', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: 'Library/', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
      { pattern: 'Temp/', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
    ],
  },
  {
    key: 'web',
    label: '通用 Web',
    description: '前端文本统一 LF，图片字体标记二进制，sourcemap 不进归档',
    rules: [
      {
        pattern: '*.{html,css,js,json,svg,md}',
        attributes: ['text', 'eol=lf'],
        enabled: true,
        group: '换行符',
      },
      { pattern: '*.{png,jpg,jpeg,gif,webp,ico}', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: '*.{woff,woff2,ttf,otf,eot}', attributes: ['binary'], enabled: true, group: '二进制文件' },
      { pattern: '*.map', attributes: ['export-ignore'], enabled: true, group: '归档导出' },
    ],
  },
];

/**
 * 创建一条空白规则
 *
 * @param id - 组件内唯一标识
 * @returns 空白规则
 */
export function createEmptyRule(id: number): GitAttributeRule {
  return { id, pattern: '', attributes: [], enabled: true, group: '' };
}

/** 默认示例规则 */
export function createDefaultRules(): GitAttributeRule[] {
  return [
    { id: 1, pattern: '*.sh', attributes: ['text', 'eol=lf'], enabled: true, group: '换行符' },
    { id: 2, pattern: '*.png', attributes: ['binary'], enabled: true, group: '二进制文件' },
    { id: 3, pattern: 'dist/', attributes: ['linguist-generated'], enabled: true, group: 'Linguist' },
    { id: 4, pattern: '*.bat', attributes: ['text', 'eol=crlf'], enabled: false, group: '换行符' },
  ];
}
