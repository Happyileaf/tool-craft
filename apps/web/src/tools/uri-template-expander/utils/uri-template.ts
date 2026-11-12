/**
 * RFC 6570 URI Template（Level 1–4）展开器的纯函数实现。
 *
 * 支持的表达式操作符：
 * - Level 1：无操作符简单替换 {var}
 * - Level 2：+ 保留字符展开 {+var}、# 片段展开 {#var}
 * - Level 3：. 标签展开 {.var}、/ 路径分段 {/var}、; 路径参数 {;var}、? 查询 {?var}、& 查询续接 {&var}
 * - Level 4：上述全部 + 数组/对象复合值与 explode（*）、前缀截断（:maxlen）
 *
 * 变量值类型：string | number | boolean | null | 数组 | 键值对象。
 * undefined 变量按 RFC 6570 视为未提供，不产生输出。
 */

/** RFC 6570 允许的变量值类型 */
export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | TemplateValue[]
  | { [key: string]: TemplateValue };

/** 变量名到值的映射 */
export type TemplateVariables = Record<string, TemplateValue>;

export interface ExpandResult {
  /** 展开后的 URI；存在错误时为尽力而为的部分展开结果 */
  uri: string;
  valid: boolean;
  errors: string[];
}

/** 表达式操作符定义 */
interface OperatorSpec {
  operator: string;
  /** 首分隔符：表达式至少产出一个值时的前缀 */
  first: string;
  /** 后续值之间的分隔符 */
  separator: string;
  /** 是否保留 RFC 3986 保留字符（不做 pct-encode） */
  reserved: boolean;
  /** 键值/复合值中键与值的连接符 */
  named: boolean;
  /** 命名形式（; ? &）中空值的处理：true 时输出 "key" 而非 "key=" */
  emptyName: boolean;
}

const OPERATORS: Record<string, OperatorSpec> = {
  '': { operator: '', first: '', separator: ',', reserved: false, named: false, emptyName: false },
  '+': { operator: '+', first: '', separator: ',', reserved: true, named: false, emptyName: false },
  '#': { operator: '#', first: '#', separator: ',', reserved: true, named: false, emptyName: false },
  '.': { operator: '.', first: '.', separator: '.', reserved: false, named: false, emptyName: false },
  '/': { operator: '/', first: '/', separator: '/', reserved: false, named: false, emptyName: false },
  ';': { operator: ';', first: ';', separator: ';', reserved: false, named: true, emptyName: true },
  '?': { operator: '?', first: '?', separator: '&', reserved: false, named: true, emptyName: false },
  '&': { operator: '&', first: '&', separator: '&', reserved: false, named: true, emptyName: false },
};

/** 非保留字符集（RFC 3986 unreserved） */
const UNRESERVED = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'.split(''),
);
/** 保留展开（+ / #）允许直通的字符：unreserved + sub-delims + ':' + '@' + '/' + '?' */
const RESERVED_ALLOWED = new Set(
  (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~' +
    "!$&'()*+,;=:@/?"
  ).split(''),
);

/**
 * 按 RFC 6570 Section 3.2.1 做百分号编码。
 *
 * @param text - 原始文本
 * @param reserved - true 时保留 RFC 3986 保留字符（+/# 表达式）
 */
function pctEncode(text: string, reserved: boolean): string {
  const allowed = reserved ? RESERVED_ALLOWED : UNRESERVED;
  const bytes = new TextEncoder().encode(text);
  let output = '';
  for (const byte of bytes) {
    const char = String.fromCharCode(byte);
    if (allowed.has(char)) {
      output += char;
    } else {
      output += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return output;
}

/** 把任意标量值规范化为字符串；null 按 RFC 6570 视为字符串 "null" 之外的空值处理 */
function scalarToString(value: string | number | boolean | null): string {
  if (value === null) {
    return '';
  }
  return String(value);
}

/** 变量修饰（explode 或前缀截断） */
interface Modifier {
  explode: boolean;
  prefix?: number;
}

/** 单个变量规格：名称 + 修饰 */
interface VarSpec {
  name: string;
  modifier: Modifier;
}

/** 解析表达式内部的变量规格列表，如 "path:6,dom*" */
function parseVarSpecs(body: string, errors: string[]): VarSpec[] {
  return body.split(',').map((raw) => {
    let name = raw;
    const modifier: Modifier = { explode: false };
    if (raw.endsWith('*')) {
      modifier.explode = true;
      name = raw.slice(0, -1);
    } else {
      const colonIndex = raw.indexOf(':');
      if (colonIndex >= 0) {
        name = raw.slice(0, colonIndex);
        const maxLength = Number(raw.slice(colonIndex + 1));
        if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > 9999) {
          errors.push(`非法前缀截断长度: ${raw}`);
        }
        modifier.prefix = maxLength;
      }
    }
    // RFC 6570 varname = varchar *( ["."] varchar )，varchar 含字母数字、下划线与连字符
    if (!/^[A-Za-z0-9_.-]+(?:\.[A-Za-z0-9_.-]+)*$/.test(name)) {
      errors.push(`非法变量名: ${raw}`);
    }
    return { name, modifier };
  });
}

/** 判断值是否为普通对象（非数组、非 null） */
function isRecord(value: TemplateValue): value is Record<string, TemplateValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 展开单个变量规格，返回该变量贡献的已编码片段数组（尚未用分隔符连接）。
 *
 * @returns 片段数组；变量未提供时返回空数组
 */
function expandVarSpec(
  spec: VarSpec,
  value: TemplateValue | undefined,
  op: OperatorSpec,
): string[] {
  if (value === undefined) {
    return [];
  }

  const { name, modifier } = spec;
  const encode = (text: string) => pctEncode(text, op.reserved);
  const encodeKey = (key: string) => pctEncode(key, false);

  // 复合值：数组
  if (Array.isArray(value)) {
    if (modifier.explode) {
      return value.map((item) => {
        const encoded = encode(applyPrefix(scalarToString(item as string | number | boolean | null), modifier.prefix));
        return op.named ? `${encodeKey(name)}=${encoded || ''}` : encoded;
      });
    }
    const joined = value
      .map((item) => encode(applyPrefix(scalarToString(item as string | number | boolean | null), modifier.prefix)))
      .join(',');
    return [op.named ? `${encodeKey(name)}=${joined}` : joined];
  }

  // 复合值：对象
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (modifier.explode) {
      const keyValueSeparator = op.named ? '=' : '=';
      return entries.map(([key, item]) => {
        const encodedValue = encode(scalarToString(item as string | number | boolean | null));
        if (op.named) {
          return `${encodeKey(key)}=${encodedValue}`;
        }
        return `${encodeKey(key)}${keyValueSeparator}${encodedValue}`;
      });
    }
    const flat = entries.flatMap(([key, item]) => [
      encodeKey(key),
      encode(scalarToString(item as string | number | boolean | null)),
    ]);
    const joined = flat.join(',');
    return [op.named ? `${encodeKey(name)}=${joined}` : joined];
  }

  // 标量
  const text = applyPrefix(scalarToString(value), modifier.prefix);
  const encoded = encode(text);
  if (op.named) {
    if (text === '' && op.emptyName) {
      return [encodeKey(name)];
    }
    return [`${encodeKey(name)}=${encoded}`];
  }
  return [encoded];
}

/** 应用前缀截断（仅对标量字符串有效，按 UTF-8 码点截断） */
function applyPrefix(text: string, prefix?: number): string {
  if (prefix === undefined) {
    return text;
  }
  // 使用 Array.from 按码点截断，避免切断代理对
  return Array.from(text).slice(0, prefix).join('');
}

/**
 * 展开单个 {…} 表达式。
 */
function expandExpression(expression: string, variables: TemplateVariables, errors: string[]): string {
  const inner = expression.slice(1, -1);
  const maybeOperator = inner[0];
  const op: OperatorSpec =
    maybeOperator !== undefined && OPERATORS[maybeOperator] !== undefined
      ? (OPERATORS[maybeOperator] as OperatorSpec)
      : (OPERATORS[''] as OperatorSpec);
  const body = op.operator === '' ? inner : inner.slice(1);

  const specs = parseVarSpecs(body, errors);
  const fragments: string[] = [];

  specs.forEach((spec) => {
    const value = variables[spec.name];
    const pieces = expandVarSpec(spec, value, op);
    if (pieces.length === 0) {
      return;
    }
    if (fragments.length === 0) {
      // 首个有值变量：带操作符首前缀
      fragments.push(pieces.join(op.separator));
    } else {
      // 后续变量：explode 时各值之间也用操作符分隔符
      fragments.push(pieces.join(op.separator));
    }
  });

  if (fragments.length === 0) {
    return '';
  }
  return op.first + fragments.join(op.separator);
}

/**
 * 用变量集展开 RFC 6570 URI 模板。
 *
 * @param template - URI 模板字符串，可含多个 {…} 表达式
 * @param variables - 变量名到值的映射
 * @returns 展开结果与校验错误
 */
export function expandUriTemplate(template: string, variables: TemplateVariables): ExpandResult {
  const errors: string[] = [];
  let uri = '';
  let cursor = 0;

  const expressionPattern = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = expressionPattern.exec(template)) !== null) {
    uri += template.slice(cursor, match.index);
    const expression = match[0];
    uri += expandExpression(expression, variables, errors);
    cursor = match.index + expression.length;
  }

  // 未配对的花括号
  const remainder = template.slice(cursor);
  if (remainder.includes('{') || remainder.includes('}')) {
    errors.push('存在未配对的花括号');
  }
  uri += remainder;

  return { uri, valid: errors.length === 0, errors };
}

/**
 * 提取模板中引用的全部变量名（去重，保留出现顺序）。
 */
export function extractTemplateVariables(template: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const pattern = /\{[+#./;?&]?([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    const body = match[1];
    if (body === undefined) {
      continue;
    }
    for (const raw of body.split(',')) {
      const name = raw.replace(/[*:].*$/, '');
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

/** 示例模板 */
export const SAMPLE_TEMPLATE =
  'https://api.example.com/{+version}/users/{userId}{?fields*,limit}{#section}';

/** 示例变量（JSON 字符串形式由 UI 解析后传入） */
export const SAMPLE_VARIABLES: TemplateVariables = {
  version: '/v2',
  userId: 'a b/123',
  fields: ['profile', 'email'],
  limit: 25,
  section: 'docs/intro',
};
