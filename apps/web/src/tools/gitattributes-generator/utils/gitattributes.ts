/**
 * .gitattributes 生成与校验纯函数，不依赖 DOM 与 React。
 * 规则按列表顺序输出，停用规则跳过，相同分组以 `# === 分组名 ===` 注释分隔，
 * 全局换行策略固定输出在文件首行；错误以结果对象返回而非抛出。
 */

/** 全局换行符策略 */
export type GlobalLinePolicy = 'none' | 'auto' | 'auto-lf' | 'auto-crlf';

/** 一条 .gitattributes 规则 */
export interface GitAttributeRule {
  /** 组件内使用的唯一标识 */
  id: number;
  /** 匹配 pattern，如 `*.sh`、`/LICENSE` */
  pattern: string;
  /** 属性列表，如 `['text', 'eol=lf']`；带值前缀 `linguist-language=` 等在末尾拼接取值 */
  attributes: string[];
  /** 是否启用；停用的规则不参与校验也不输出 */
  enabled: boolean;
  /** 可选分组名，同名规则输出在同一注释分组下，空字符串表示不分组 */
  group?: string;
}

/** 校验结果 */
export interface GitattributesValidation {
  /** 全部问题，按规则与属性出现顺序排列；为空表示校验通过 */
  errors: string[];
}

/** 不带取值的合法属性（取值型属性以前缀匹配） */
export const KNOWN_PLAIN_ATTRIBUTES: readonly string[] = [
  'text',
  '-text',
  'eol=lf',
  'eol=crlf',
  'working-tree-encoding',
  'binary',
  '-diff',
  'diff',
  'merge',
  '-merge',
  'linguist-vendored',
  'linguist-generated',
  'linguist-documentation',
  'linguist-detectable',
  '-linguist-detectable',
  'export-ignore',
  'export-subst',
];

/** 需要用户补全取值的属性前缀，结尾的 `=` 之后不能为空 */
export const VALUE_ATTRIBUTE_PREFIXES: readonly string[] = [
  'linguist-language=',
  'merge=',
  'diff=',
];

/** 属性固定输出顺序，未列出的属性（自定义值）排在已知属性之后 */
const ATTRIBUTE_OUTPUT_ORDER: readonly string[] = [
  'text',
  '-text',
  'binary',
  'eol=lf',
  'eol=crlf',
  'working-tree-encoding',
  'diff',
  '-diff',
  'merge',
  '-merge',
  'linguist-vendored',
  'linguist-generated',
  'linguist-documentation',
  'linguist-language=',
  'linguist-detectable',
  '-linguist-detectable',
  'export-ignore',
  'export-subst',
];

/** 全局策略到首行文本的映射，none 表示不输出 */
const GLOBAL_POLICY_LINES: Record<GlobalLinePolicy, string | null> = {
  none: null,
  auto: '* text=auto',
  'auto-lf': '* text=auto eol=lf',
  'auto-crlf': '* text=auto eol=crlf',
};

/**
 * 判断单个属性是否为受支持的属性。
 * 普通属性精确匹配已知集合，取值型属性以前缀匹配。
 *
 * @param attribute - 待判断的属性字符串
 * @returns 合法返回 true
 */
export function isKnownAttribute(attribute: string): boolean {
  if (KNOWN_PLAIN_ATTRIBUTES.includes(attribute)) {
    return true;
  }
  return VALUE_ATTRIBUTE_PREFIXES.some(
    (prefix) => attribute.startsWith(prefix) && attribute.slice(prefix.length).trim() !== '',
  );
}

/**
 * 计算属性的输出排序权重：已知属性按固定顺序，未知属性排到最后。
 *
 * @param attribute - 属性字符串
 * @returns 排序权重，数字越小越靠前
 */
function rankOf(attribute: string): number {
  const exactIndex = ATTRIBUTE_OUTPUT_ORDER.indexOf(attribute);
  if (exactIndex !== -1) {
    return exactIndex;
  }
  const prefixIndex = ATTRIBUTE_OUTPUT_ORDER.findIndex(
    (entry) => entry.endsWith('=') && attribute.startsWith(entry),
  );
  if (prefixIndex !== -1) {
    return prefixIndex;
  }
  return ATTRIBUTE_OUTPUT_ORDER.length;
}

/**
 * 校验规则列表（仅检查启用的规则）。
 * 检查项：pattern 不能为空；至少包含一个属性；
 * `linguist-language=` / `merge=` / `diff=` 后必须补全取值；
 * 不在已知集合内的非法属性报错。
 *
 * @param rules - 规则列表
 * @returns 校验结果
 */
export function validateRules(rules: GitAttributeRule[]): GitattributesValidation {
  const errors: string[] = [];

  rules.forEach((rule, index) => {
    if (!rule.enabled) {
      return;
    }
    const label = `第 ${index + 1} 条规则（pattern: ${rule.pattern.trim() || '空'}）`;
    const pattern = rule.pattern.trim();

    if (pattern === '') {
      errors.push(`${label}：pattern 不能为空`);
      return;
    }

    if (rule.attributes.length === 0) {
      errors.push(`${label}：至少选择一个属性`);
      return;
    }

    for (const attribute of rule.attributes) {
      const emptyValuePrefix = VALUE_ATTRIBUTE_PREFIXES.find(
        (prefix) => attribute === prefix || (attribute.startsWith(prefix) && attribute.slice(prefix.length).trim() === ''),
      );
      if (emptyValuePrefix) {
        errors.push(`${label}：属性「${emptyValuePrefix}」后必须填写取值`);
        continue;
      }
      if (!isKnownAttribute(attribute)) {
        errors.push(`${label}：非法属性「${attribute}」`);
      }
    }
  });

  return { errors };
}

/**
 * 生成 .gitattributes 文本。
 * 停用、pattern 为空、无属性或含非法 / 缺值属性的规则跳过；
 * 首行输出全局换行策略（none 时不输出），随后按规则顺序与分组注释拼装，
 * 同一分组的相邻规则合并到同一个 `# === 分组名 ===` 注释块下。
 *
 * @param globalPolicy - 全局换行符策略
 * @param rules - 规则列表
 * @returns .gitattributes 文本；无任何有效内容时返回空字符串
 */
export function generateGitattributes(
  globalPolicy: GlobalLinePolicy,
  rules: GitAttributeRule[],
): string {
  const blocks: string[] = [];
  const globalLine = GLOBAL_POLICY_LINES[globalPolicy];
  if (globalLine !== null) {
    blocks.push(globalLine);
  }

  let currentGroup: string | null = null;
  let currentLines: string[] = [];

  const flush = (): void => {
    if (currentLines.length > 0) {
      blocks.push(currentLines.join('\n'));
      currentLines = [];
    }
    currentGroup = null;
  };

  for (const rule of rules) {
    if (!rule.enabled || rule.pattern.trim() === '' || rule.attributes.length === 0) {
      continue;
    }
    if (rule.attributes.some((attribute) => !isKnownAttribute(attribute))) {
      continue;
    }

    const group = rule.group?.trim() ?? '';
    if (group !== currentGroup) {
      flush();
      currentGroup = group;
      if (group !== '') {
        currentLines.push(`# === ${group} ===`);
      }
    }

    const attributes = [...rule.attributes].sort((a, b) => {
      const rankDiff = rankOf(a) - rankOf(b);
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    });
    currentLines.push(`${rule.pattern.trim()} ${attributes.join(' ')}`);
  }
  flush();

  return blocks.join('\n\n');
}
