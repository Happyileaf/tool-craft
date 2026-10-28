/**
 * 数值区间展开 / 压缩（零依赖纯函数，全程 BigInt）
 *
 * 展开语法（以逗号、空白或换行分隔的 token，空白容错）：
 * - 单值：`10`、`-5`
 * - 闭区间：`1-5`、`-5--1`（负终点时第二个 - 紧贴数字）
 * - 带步长区间：`0-10:2`（步长须为正整数；终点不必恰好落在步点上）
 *
 * 压缩方向：把离散整数列表排序去重后合并为最小区间表示，
 * 连续 ≥3 个数写为 a-b，2 个连续数仍分别单列（与展开可逆）。
 *
 * 非法 token、倒置区间、非正步长均以结果对象 error 返回而非抛出。
 */

export interface RangeResult {
  values: bigint[];
  text: string;
  error: string | null;
}

/** 单次展开允许产生的元素数量安全上限 */
export const MAX_EXPANDED_VALUES = 100000;

const INTEGER_RE = /^[+-]?\d+$/;
const TOKEN_SPLIT_RE = /[,\s]+/;

/** 展开紧凑区间表达式为有序（按书写顺序）BigInt 数列 */
export function expandRanges(input: string): RangeResult {
  const empty: RangeResult = { values: [], text: '', error: null };
  const tokens = input.split(TOKEN_SPLIT_RE).filter((token) => token !== '');
  if (tokens.length === 0) {
    return { ...empty, error: '请至少输入一个数字或区间，例如 1-5, 10, 12-14' };
  }

  const values: bigint[] = [];
  for (const token of tokens) {
    const parsed = parseToken(token);
    if (parsed.error) {
      return { ...empty, error: `「${token}」${parsed.error}` };
    }
    for (const value of parsed.values) {
      values.push(value);
    }
    if (values.length > MAX_EXPANDED_VALUES) {
      return {
        ...empty,
        error: `展开结果超过安全上限 ${MAX_EXPANDED_VALUES} 个元素，请缩小区间或步长`,
      };
    }
  }
  return { values, text: values.map((v) => v.toString()).join(','), error: null };
}

interface ParsedToken {
  values: bigint[];
  error: string | null;
}

/** 解析单个 token：整数、a-b 区间、a-b:s 带步长区间 */
function parseToken(token: string): ParsedToken {
  // 单值
  if (INTEGER_RE.test(token)) {
    return { values: [BigInt(token)], error: null };
  }

  // 拆出可选步长 :s
  let body = token;
  let stepText: string | null = null;
  const colonIndex = token.indexOf(':');
  if (colonIndex !== -1) {
    body = token.slice(0, colonIndex);
    stepText = token.slice(colonIndex + 1);
    if (token.indexOf(':', colonIndex + 1) !== -1) {
      return { values: [], error: '步长只能出现一次，格式为 起-止:步长' };
    }
  }

  // 拆区间起止：定位第二个 -（允许终点为负数，如 -5--1）
  const dashIndex = findRangeDash(body);
  if (dashIndex === -1) {
    return { values: [], error: '无法识别，应为整数、a-b 区间或 a-b:s 带步长区间' };
  }
  const startText = body.slice(0, dashIndex);
  const endText = body.slice(dashIndex + 1);
  if (!INTEGER_RE.test(startText) || !INTEGER_RE.test(endText)) {
    return { values: [], error: '区间端点必须是整数，格式为 起-止' };
  }
  const start = BigInt(startText);
  const end = BigInt(endText);
  if (end < start) {
    return { values: [], error: `为倒置区间（起点 ${start} 大于终点 ${end}）` };
  }

  let step = BigInt(1);
  if (stepText !== null) {
    if (!INTEGER_RE.test(stepText)) {
      return { values: [], error: '步长必须是正整数' };
    }
    step = BigInt(stepText);
    if (step <= BigInt(0)) {
      return { values: [], error: '步长必须为正整数，不能为 0 或负数' };
    }
  }

  const values: bigint[] = [];
  for (let current = start; current <= end; current += step) {
    values.push(current);
    if (values.length > MAX_EXPANDED_VALUES) {
      return { values: [], error: `展开结果超过安全上限 ${MAX_EXPANDED_VALUES} 个元素` };
    }
  }
  return { values, error: null };
}

/**
 * 定位区间连字符：起点之后的第一个 -。
 * 起点本身可能带负号（位置 0 的 -），故先跳过开头符号再查找。
 */
function findRangeDash(body: string): number {
  if (body === '') {
    return -1;
  }
  const searchFrom = body[0] === '-' || body[0] === '+' ? 1 : 0;
  return body.indexOf('-', searchFrom);
}

/** 把离散整数列表（允许乱序、重复、逗号 / 空白 / 换行分隔）压缩为最小区间表示 */
export function collapseRanges(input: string): RangeResult {
  const tokens = input.split(TOKEN_SPLIT_RE).filter((token) => token !== '');
  if (tokens.length === 0) {
    return { values: [], text: '', error: '请至少输入一个数字，例如 5,3,1,2,4,4,6,8' };
  }
  const numbers: bigint[] = [];
  for (const token of tokens) {
    if (!INTEGER_RE.test(token)) {
      return { values: [], text: '', error: `「${token}」不是合法整数，压缩仅接受离散数字列表` };
    }
    numbers.push(BigInt(token));
  }

  const uniqueSorted = Array.from(new Set(numbers.map((n) => n.toString()))).map((text) =>
    BigInt(text),
  );
  uniqueSorted.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const segments: string[] = [];
  let index = 0;
  while (index < uniqueSorted.length) {
    const start = uniqueSorted[index] ?? BigInt(0);
    let end = start;
    let next = index + 1;
    while (next < uniqueSorted.length && (uniqueSorted[next] ?? BigInt(0)) === end + BigInt(1)) {
      end = uniqueSorted[next] ?? end;
      next += 1;
    }
    const runLength = next - index;
    if (runLength >= 3) {
      segments.push(`${start.toString()}-${end.toString()}`);
    } else {
      for (let k = index; k < next; k += 1) {
        segments.push((uniqueSorted[k] ?? BigInt(0)).toString());
      }
    }
    index = next;
  }
  return { values: uniqueSorted, text: segments.join(','), error: null };
}
