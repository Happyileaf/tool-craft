/**
 * JSON ↔ application/x-www-form-urlencoded 双向转换（零依赖纯函数）
 *
 * - 编码：标量按字符串编码；数组在 bracket/dot 风格下用显式索引（a[0]=1、a[1]=2），
 *   PHP 风格下叶子标量用 a[]=1、数组里的对象用 a[0][b]；对象用 a[b]=1 或 a.b=1 展开。
 * - 解码：百分号解码（+ → 空格），重复键聚合为数组，并按 bracket / php / dot 路径还原嵌套结构。
 *
 * 依据 RFC 3986：除 unreserved（A-Z a-z 0-9 - _ . ~）外全部百分号编码；
 * application/x-www-form-urlencoded 惯例中空格编码为 +（可切换为 %20）。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type SpaceEncoding = 'plus' | 'percent';
export type NestStyle = 'bracket' | 'php' | 'dot';

export interface EncodeOptions {
  /** 空格编码形式：'+'（表单惯例，默认）或 '%20'（严格 RFC 3986） */
  space: SpaceEncoding;
  /** 嵌套对象 / 数组的展开风格 */
  nestStyle: NestStyle;
}

export const DEFAULT_ENCODE_OPTIONS: EncodeOptions = {
  space: 'plus',
  nestStyle: 'bracket',
};

export interface Pair {
  key: string;
  value: string;
}

export interface EncodeResult {
  output: string;
  pairs: Pair[];
  error: string | null;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** RFC 3986 unreserved 字符以外全部百分号编码；encodeURIComponent 不转义 !'()*，需补齐 */
export function percentEncode(input: string): string {
  return encodeURIComponent(input)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%7E/g, '~');
}

/** 表单编码：先做 RFC 3986 百分号编码，再按惯例把 %20 换成 + */
export function encodeFormComponent(input: string, space: SpaceEncoding = 'plus'): string {
  const encoded = percentEncode(input);
  return space === 'plus' ? encoded.replace(/%20/g, '+') : encoded;
}

/** 表单解码：+ → 空格，再 percent-decode；畸形 % 序列会抛出 URIError */
export function decodeFormComponent(input: string): string {
  return decodeURIComponent(input.replace(/\+/g, ' '));
}

function scalarToString(value: string | number | boolean | null): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/** 按风格把路径拼成原始（未百分号编码的）表单键 */
function composeKey(path: Array<{ seg: string; append: boolean }>, nestStyle: NestStyle): string {
  if (path.length === 0) return '';
  const head = path[0]?.seg ?? '';
  if (nestStyle === 'dot') {
    return head + path.slice(1).map((p) => `.${p.seg}`).join('');
  }
  let key = head;
  for (const p of path.slice(1)) {
    key += p.append ? '[]' : `[${p.seg}]`;
  }
  return key;
}

/**
 * JSON 对象 → application/x-www-form-urlencoded
 * 顶层须为对象（数组也接受，按索引 0..n 作键）；undefined / 函数等非 JSON 值经 JSON 往返拒绝。
 */
export function jsonToForm(input: unknown, options: EncodeOptions = DEFAULT_ENCODE_OPTIONS): EncodeResult {
  let root: JsonValue;
  try {
    root = JSON.parse(JSON.stringify(input)) as JsonValue;
  } catch (e) {
    return { output: '', pairs: [], error: `输入不是合法的 JSON 可序列化值：${(e as Error).message}` };
  }

  if (root === null || typeof root !== 'object') {
    return { output: '', pairs: [], error: '顶层必须是 JSON 对象（或数组），标量无法构成键值对' };
  }

  const pairs: Pair[] = [];

  const emit = (path: Array<{ seg: string; append: boolean }>, rawValue: string) => {
    pairs.push({
      key: encodeFormComponent(composeKey(path, options.nestStyle), options.space),
      value: encodeFormComponent(rawValue, options.space),
    });
  };

  const walk = (value: JsonValue, path: Array<{ seg: string; append: boolean }>): string | null => {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      if (path.length === 0) return '顶层标量无法编码';
      emit(path, scalarToString(value));
      return null;
    }
    if (Array.isArray(value)) {
      if (path.length === 0) {
        for (let i = 0; i < value.length; i += 1) {
          const err = walk(value[i] ?? null, [{ seg: String(i), append: false }]);
          if (err) return err;
        }
        return null;
      }
      for (let i = 0; i < value.length; i += 1) {
        const item = value[i] ?? null;
        const isLeafScalar =
          item === null || ['string', 'number', 'boolean'].includes(typeof item);
        if (options.nestStyle === 'php' && isLeafScalar) {
          // PHP：数组叶子标量用 a[]= 追加
          const err = walk(item, [...path, { seg: '', append: true }]);
          if (err) return err;
        } else {
          // bracket / dot，以及 PHP 下数组元素为对象/数组时，用显式索引
          const err = walk(item, [...path, { seg: String(i), append: false }]);
          if (err) return err;
        }
      }
      return null;
    }

    const entries = Object.entries(value);
    for (const [k, v] of entries) {
      const err = walk(v, [...path, { seg: k, append: false }]);
      if (err) return err;
    }
    return null;
  };

  const err = walk(root, []);
  if (err) return { output: '', pairs: [], error: err };

  return {
    output: pairs.map((p) => `${p.key}=${p.value}`).join('&'),
    pairs,
    error: null,
  };
}

export interface ParseOptions {
  /** 嵌套还原风格：flat 全部平铺、bracket（a[0]/a[b]）、php（a[] 追加）、dot（a.b） */
  nestStyle: 'flat' | 'bracket' | 'php' | 'dot';
}

export const DEFAULT_PARSE_OPTIONS: ParseOptions = { nestStyle: 'bracket' };

export interface ParseResult {
  output: string;
  value: unknown;
  pairs: Pair[];
  error: string | null;
}

type Token = { kind: 'name'; value: string } | { kind: 'append' };

/** 把原始键解析为 token 路径；dot 按点切分，bracket/php 按方括号切分，[] 为 append */
function tokenizeKey(key: string, nestStyle: 'bracket' | 'php' | 'dot'): Token[] | null {
  if (nestStyle === 'dot') {
    if (key === '') return [];
    return key.split('.').map((seg) => ({ kind: 'name' as const, value: seg }));
  }
  const open = key.indexOf('[');
  if (open === -1) return [{ kind: 'name', value: key }];
  const head = key.slice(0, open);
  const tail = key.slice(open);
  const tokens: Token[] = [{ kind: 'name', value: head }];
  const re = /\[([^\]]*)\]/g;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tail)) !== null) {
    if (m.index !== lastEnd) return null;
    lastEnd = m.index + m[0].length;
    if (m[1] === '') {
      tokens.push({ kind: 'append' });
    } else {
      tokens.push({ kind: 'name', value: m[1] ?? '' });
    }
  }
  if (lastEnd !== tail.length) return null;
  return tokens;
}

/**
 * application/x-www-form-urlencoded → JSON
 * 两遍处理：先解码并按路径推断容器类型（数字键集合→数组，否则对象；append 强制数组），
 * 再写入值；重复叶子键聚合为数组。
 */
export function formToJson(input: string, options: ParseOptions = DEFAULT_PARSE_OPTIONS): ParseResult {
  const pairs: Pair[] = [];
  const trimmed = input.trim();
  const segments = trimmed === '' ? [] : trimmed.split('&');

  for (const seg of segments) {
    if (seg === '') continue;
    const eq = seg.indexOf('=');
    const rawKey = eq === -1 ? seg : seg.slice(0, eq);
    const rawValue = eq === -1 ? '' : seg.slice(eq + 1);
    try {
      pairs.push({ key: decodeFormComponent(rawKey), value: decodeFormComponent(rawValue) });
    } catch (e) {
      return { output: '', value: null, pairs, error: `存在非法的百分号编码：${(e as Error).message}` };
    }
  }

  if (options.nestStyle === 'flat') {
    const result: Record<string, string | string[]> = {};
    for (const { key, value } of pairs) {
      if (key in result) {
        const existing = result[key];
        result[key] = Array.isArray(existing) ? [...existing, value] : [existing ?? '', value];
      } else {
        result[key] = value;
      }
    }
    return { output: JSON.stringify(result, null, 2), value: result, pairs, error: null };
  }

  interface PathEntry {
    tokens: Token[];
    value: string;
    rawKey: string;
  }
  const paths: PathEntry[] = [];
  for (const { key, value } of pairs) {
    const tokens = tokenizeKey(key, options.nestStyle);
    if (!tokens || tokens.length === 0 || tokens[0]?.kind === 'append') {
      return { output: '', value: null, pairs, error: `键「${key}」的路径结构不合法` };
    }
    if (options.nestStyle !== 'php' && tokens.some((t) => t.kind === 'append')) {
      return {
        output: '',
        value: null,
        pairs,
        error: `键「${key}」含空括号 []，请改用 PHP 风格解析`,
      };
    }
    paths.push({ tokens, value, rawKey: key });
  }

  // 容器节点：键为 token 路径前缀（用 \0 连接），记录「是否被要求为数组」与子键集合
  const containerIsArray = new Map<string, boolean>();
  const containerChildren = new Map<string, Set<string>>();
  const keyOf = (tokens: Token[]): string =>
    tokens
      .map((t) => (t.kind === 'append' ? '[]' : t.value))
      .join('\0');

  for (const entry of paths) {
    const ts = entry.tokens;
    for (let depth = 0; depth < ts.length - 1; depth += 1) {
      const prefix = keyOf(ts.slice(0, depth + 1));
      const child = ts[depth + 1];
      if (!child) continue;
      if (child.kind === 'append') {
        containerIsArray.set(prefix, true);
      } else {
        const set = containerChildren.get(prefix) ?? new Set<string>();
        set.add(child.value);
        containerChildren.set(prefix, set);
      }
    }
  }

  // 子键全部为非负整数字符串 → 数组容器（[] append 已强制为数组）
  const isArrayContainer = (prefix: string): boolean => {
    if (containerIsArray.get(prefix) === true) return true;
    const children = containerChildren.get(prefix);
    if (!children || children.size === 0) return false;
    return [...children].every((c) => /^\d+$/.test(c));
  };

  const root: { [key: string]: JsonValue } = {};

  const setLeaf = (target: { [key: string]: JsonValue }, key: string, value: string) => {
    if (key in target) {
      const existing = target[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else if (typeof existing === 'object' && existing !== null) {
        throw new Error('与既有嵌套结构冲突');
      } else {
        target[key] = [existing ?? '', value];
      }
    } else {
      target[key] = value;
    }
  };

  try {
    for (const entry of paths) {
      const ts = entry.tokens;
      let cur: JsonValue = root;

      for (let i = 0; i < ts.length; i += 1) {
        const token = ts[i];
        if (!token) break;
        const isLast = i === ts.length - 1;

        if (isLast) {
          if (token.kind === 'append') {
            if (!Array.isArray(cur)) throw new Error('与既有结构冲突');
            (cur as JsonValue[]).push(entry.value);
          } else if (Array.isArray(cur)) {
            // 父级是数组：叶子键必须是数字索引，缺位补空串；重复键聚合为数组
            if (!/^\d+$/.test(token.value)) throw new Error('与既有结构冲突');
            const idx = Number(token.value);
            while (cur.length < idx) cur.push('');
            if (cur.length === idx) {
              cur.push(entry.value);
            } else {
              setLeaf(cur as unknown as { [key: string]: JsonValue }, token.value, entry.value);
            }
          } else {
            setLeaf(cur as { [key: string]: JsonValue }, token.value, entry.value);
          }
          break;
        }

        // 进入下一层容器：判断「当前 token 所指节点」是否为数组
        const nodePrefix = keyOf(ts.slice(0, i + 1));
        const childArray = isArrayContainer(nodePrefix);

        if (Array.isArray(cur)) {
          if (token.kind !== 'name' || !/^\d+$/.test(token.value)) {
            throw new Error('与既有结构冲突');
          }
          const idx = Number(token.value);
          while (cur.length < idx) cur.push('');
          const existing = cur[idx];
          if (existing === undefined || existing === '' || existing === null) {
            cur[idx] = childArray ? [] : {};
          } else if (typeof existing !== 'object') {
            throw new Error('与既有嵌套结构冲突');
          }
          cur = cur[idx] ?? (childArray ? [] : {});
        } else {
          const obj = cur as { [key: string]: JsonValue };
          if (token.kind === 'append') throw new Error('与既有结构冲突');
          const k = token.value;
          if (!(k in obj) || obj[k] === '' || obj[k] === null) {
            obj[k] = childArray ? [] : {};
          } else if (typeof obj[k] !== 'object') {
            throw new Error('与既有嵌套结构冲突');
          }
          cur = obj[k] ?? (childArray ? [] : {});
        }
      }
    }
  } catch (e) {
    return {
      output: '',
      value: null,
      pairs,
      error: `键值组合存在类型冲突：${(e as Error).message}`,
    };
  }

  return { output: JSON.stringify(root, null, 2), value: root, pairs, error: null };
}
