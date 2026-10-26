/**
 * CSS 选择器权重（specificity）计算纯函数集合，不依赖 DOM 与 React；
 * 输出标准三元组 (a, b, c)：a = ID 数，b = 类 / 属性 / 伪类数，c = 类型 / 伪元素数。
 * 无法解析为合法选择器时返回 invalid，由调用方渲染提示
 */
import {
  LEGACY_PSEUDO_ELEMENTS,
  MAX_ARG_PSEUDO_CLASSES,
  NTH_OF_PSEUDO_CLASSES,
} from '../constants';

/** 权重三元组 */
export interface Specificity {
  /** ID 选择器数量 */
  a: number;
  /** 类、属性选择器与伪类数量 */
  b: number;
  /** 类型选择器与伪元素数量 */
  c: number;
}

/** 单条选择器解析结果 */
export interface SpecificityResult {
  /** 输入文本（已 trim） */
  selector: string;
  /** 是否为可解析的合法选择器 */
  valid: boolean;
  /** 权重三元组（valid 为 false 时为 null） */
  specificity: Specificity | null;
  /** 校验失败原因（valid 为 false 时存在） */
  reason?: string;
}

/** 零权重常量 */
const ZERO: Specificity = { a: 0, b: 0, c: 0 };

/**
 * 逐项相加两个权重三元组
 *
 * @param x - 第一个权重
 * @param y - 第二个权重
 * @returns 相加后的新三元组
 */
export function addSpecificity(x: Specificity, y: Specificity): Specificity {
  return { a: x.a + y.a, b: x.b + y.b, c: x.c + y.c };
}

/**
 * 取两个权重三元组中权重更高者（逐项比较）
 *
 * @param x - 第一个权重
 * @param y - 第二个权重
 * @returns 权重更高者；相等时返回前者
 */
export function maxSpecificity(x: Specificity, y: Specificity): Specificity {
  if (x.a !== y.a) {
    return x.a > y.a ? x : y;
  }
  if (x.b !== y.b) {
    return x.b > y.b ? x : y;
  }
  return x.c >= y.c ? x : y;
}

/**
 * 按级联规则比较两个权重：返回 1 表示 x 更高，-1 表示 y 更高，0 表示相等
 *
 * @param x - 第一个权重
 * @param y - 第二个权重
 * @returns 比较结果
 */
export function compareSpecificity(x: Specificity, y: Specificity): number {
  if (x.a !== y.a) {
    return x.a > y.a ? 1 : -1;
  }
  if (x.b !== y.b) {
    return x.b > y.b ? 1 : -1;
  }
  if (x.c !== y.c) {
    return x.c > y.c ? 1 : -1;
  }
  return 0;
}

/**
 * 在顶层按逗号切分选择器列表，忽略括号内与字符串内的逗号
 *
 * @param input - 选择器列表原文
 * @returns 各段选择器文本
 */
function splitSelectorList(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote !== null) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth += 1;
    } else if (ch === ')' || ch === ']') {
      depth -= 1;
    } else if (ch === ',' && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

/**
 * 提取从开括号位置起、与之配对的括号内部文本，返回内部文本与结束位置
 *
 * @param input - 输入文本
 * @param openIndex - 开括号 `(` 的下标
 * @returns `内容文本与结束下标；括号不配对时为 null`
 */
function readBalancedParens(
  input: string,
  openIndex: number,
): { content: string; closeIndex: number } | null {
  let depth = 0;
  let quote: string | null = null;
  for (let i = openIndex; i < input.length; i += 1) {
    const ch = input[i];
    if (quote !== null) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        return { content: input.slice(openIndex + 1, i), closeIndex: i };
      }
    }
  }
  return null;
}

/**
 * 读取从 index 起的一个 CSS 标识符（含反斜杠转义），返回标识符文本与下一个下标
 *
 * @param input - 输入文本
 * @param start - 起始下标（指向标识符首字符）
 * @returns 标识符与结束后下标；首字符不可作为标识符开头时为 null
 */
function readIdentifier(input: string, start: number): { name: string; next: number } | null {
  let i = start;
  let name = '';
  let consumed = false;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '\\' && i + 1 < input.length) {
      name += ch + input[i + 1];
      i += 2;
      consumed = true;
      continue;
    }
    if (
      ch === undefined ||
      ch === '.' ||
      ch === '#' ||
      ch === '[' ||
      ch === ']' ||
      ch === ':' ||
      ch === '(' ||
      ch === ')' ||
      ch === ' ' ||
      ch === '\t' ||
      ch === '\n' ||
      ch === '\r' ||
      ch === '>' ||
      ch === '+' ||
      ch === '~' ||
      ch === ',' ||
      ch === '|' ||
      ch === '*' ||
      ch === '&'
    ) {
      break;
    }
    name += ch;
    i += 1;
    consumed = true;
  }
  return consumed ? { name, next: i } : null;
}

/**
 * 递归解析单个复杂选择器（不含顶层逗号），累加其权重
 */
class SelectorParser {
  private index = 0;

  constructor(
    private readonly input: string,
    private readonly allowLeadingCombinator = false,
  ) {}

  /**
   * 解析入口
   *
   * @returns 权重三元组；选择器非法时为 null
   */
  parse(): Specificity | null {
    let total: Specificity = { ...ZERO };
    this.skipWhitespace();
    if (this.index >= this.input.length) {
      return null;
    }
    if (this.isCombinatorAt(this.index)) {
      if (!this.allowLeadingCombinator) {
        return null;
      }
      this.index += 1;
      this.skipWhitespace();
    }
    while (this.index < this.input.length) {
      const compound = this.parseCompound();
      if (compound === null) {
        return null;
      }
      total = addSpecificity(total, compound);
      const beforeGap = this.index;
      this.skipWhitespace();
      if (this.index >= this.input.length) {
        break;
      }
      if (this.isCombinatorAt(this.index)) {
        this.index += 1;
        this.skipWhitespace();
        if (this.index >= this.input.length) {
          return null;
        }
      } else if (this.index === beforeGap) {
        return null;
      }
    }
    return total;
  }

  /**
   * 跳过空白字符
   */
  private skipWhitespace(): void {
    while (this.index < this.input.length) {
      const ch = this.input[this.index];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.index += 1;
      } else {
        break;
      }
    }
  }

  /**
   * 判断指定下标是否为组合子（`>` / `+` / `~`）
   *
   * @param position - 待判断的下标
   * @returns 是否为显式组合子
   */
  private isCombinatorAt(position: number): boolean {
    const ch = this.input[position];
    return ch === '>' || ch === '+' || ch === '~';
  }

  /**
   * 解析一个 compound selector（一个组合子片段内的类型选择器 + 若干简单选择器）
   *
   * @returns 该片段权重；非法时为 null
   */
  private parseCompound(): Specificity | null {
    let spec: Specificity = { ...ZERO };
    let sawToken = false;

    const parseTypePart = (): Specificity | null => {
      const ch = this.input[this.index];
      if (ch === '*') {
        this.index += 1;
        sawToken = true;
        return { ...ZERO };
      }
      if (ch === '&') {
        this.index += 1;
        sawToken = true;
        return { ...ZERO };
      }
      if (ch === '|') {
        return null;
      }
      const identifier = readIdentifier(this.input, this.index);
      if (identifier !== null) {
        this.index = identifier.next;
        sawToken = true;
        if (this.input[this.index] === '|') {
          this.index += 1;
          const right = readIdentifier(this.input, this.index);
          if (right === null) {
            return null;
          }
          this.index = right.next;
        }
        return { a: 0, b: 0, c: 1 };
      }
      return { ...ZERO };
    };

    const typeSpec = parseTypePart();
    if (typeSpec === null) {
      return null;
    }
    spec = addSpecificity(spec, typeSpec);

    while (this.index < this.input.length) {
      const ch = this.input[this.index];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '>' || ch === '+' || ch === '~') {
        break;
      }
      if (ch === '.') {
        const identifier = readIdentifier(this.input, this.index + 1);
        if (identifier === null) {
          return null;
        }
        this.index = identifier.next;
        spec.b += 1;
        sawToken = true;
      } else if (ch === '#') {
        const identifier = readIdentifier(this.input, this.index + 1);
        if (identifier === null) {
          return null;
        }
        this.index = identifier.next;
        spec.a += 1;
        sawToken = true;
      } else if (ch === '[') {
        const end = this.scanAttributeSelector();
        if (end === null) {
          return null;
        }
        this.index = end;
        spec.b += 1;
        sawToken = true;
      } else if (ch === ':') {
        const pseudo = this.parsePseudo();
        if (pseudo === null) {
          return null;
        }
        spec = addSpecificity(spec, pseudo);
        sawToken = true;
      } else if (ch === '*' || ch === '&') {
        this.index += 1;
        sawToken = true;
      } else {
        return null;
      }
    }

    if (!sawToken) {
      return null;
    }
    return spec;
  }

  /**
   * 从 `[` 起扫描到配对的 `]`，处理引号与转义
   *
   * @returns `]` 之后的下标；不配对时为 null
   */
  private scanAttributeSelector(): number | null {
    let i = this.index + 1;
    let quote: string | null = null;
    while (i < this.input.length) {
      const ch = this.input[i];
      if (quote !== null) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === quote) {
          quote = null;
        }
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === ']') {
        return i + 1;
      }
      i += 1;
    }
    return null;
  }

  /**
   * 解析一个伪类或伪元素（当前下标指向 `:`）
   *
   * @returns 该伪选择器权重；非法时为 null
   */
  private parsePseudo(): Specificity | null {
    let isElement = false;
    this.index += 1;
    if (this.input[this.index] === ':') {
      isElement = true;
      this.index += 1;
    }
    const identifier = readIdentifier(this.input, this.index);
    if (identifier === null) {
      return null;
    }
    const name = identifier.name.toLowerCase();
    this.index = identifier.next;

    if (this.input[this.index] !== '(') {
      if (!isElement && LEGACY_PSEUDO_ELEMENTS.includes(name)) {
        return { a: 0, b: 0, c: 1 };
      }
      return isElement ? { a: 0, b: 0, c: 1 } : { a: 0, b: 1, c: 0 };
    }

    const balanced = readBalancedParens(this.input, this.index);
    if (balanced === null) {
      return null;
    }
    this.index = balanced.closeIndex + 1;
    const content = balanced.content.trim();

    if (isElement) {
      return { a: 0, b: 0, c: 1 };
    }

    if (name === 'where') {
      return { ...ZERO };
    }

    if (MAX_ARG_PSEUDO_CLASSES.includes(name)) {
      const selectors = splitSelectorList(content);
      if (selectors.length === 0) {
        return null;
      }
      let max: Specificity | null = null;
      for (const selector of selectors) {
        const parsed = new SelectorParser(selector, name === 'has').parse();
        if (parsed === null) {
          return null;
        }
        max = max === null ? parsed : maxSpecificity(max, parsed);
      }
      return max ?? { ...ZERO };
    }

    if (NTH_OF_PSEUDO_CLASSES.includes(name)) {
      const ofIndex = findTopLevelOf(content);
      let spec: Specificity = { a: 0, b: 1, c: 0 };
      if (ofIndex !== -1) {
        const filterText = content.slice(ofIndex + 2).trim();
        const filterSpec = filterText === '' ? null : new SelectorParser(filterText).parse();
        if (filterSpec === null) {
          return null;
        }
        if (filterSpec) {
          spec = addSpecificity(spec, filterSpec);
        }
      }
      return spec;
    }

    return { a: 0, b: 1, c: 0 };
  }
}

/**
 * 在 An+B of S 语法的参数中定位顶层关键字 `of` 的位置（忽略括号与字符串）
 *
 * @param content - 伪类参数文本
 * @returns `of` 的起始下标；不存在时为 -1
 */
function findTopLevelOf(content: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    if (quote !== null) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth += 1;
    } else if (ch === ')' || ch === ']') {
      depth -= 1;
    } else if (
      depth === 0 &&
      ch === 'o' &&
      content[i + 1] === 'f' &&
      isBoundary(content[i - 1]) &&
      isBoundary(content[i + 2])
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * 判断字符是否为标识符边界（空白或 undefined）
 *
 * @param ch - 待判断字符
 * @returns 是否为边界
 */
function isBoundary(ch: string | undefined): boolean {
  return ch === undefined || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

/**
 * 计算单个选择器（可为逗号分隔的选择器列表）的权重；
 * 列表权重取各段最高，任一段非法则整体非法
 *
 * @param input - 选择器文本
 * @returns 解析结果，含权重三元组或失败原因
 */
export function calculateSpecificity(input: string): SpecificityResult {
  const selector = input.trim();
  if (selector === '') {
    return { selector, valid: false, specificity: null, reason: '选择器为空' };
  }
  const segments = splitSelectorList(selector);
  if (segments.length === 0) {
    return { selector, valid: false, specificity: null, reason: '选择器为空' };
  }
  let best: Specificity | null = null;
  for (const segment of segments) {
    const parsed = new SelectorParser(segment).parse();
    if (parsed === null) {
      return { selector, valid: false, specificity: null, reason: '无法解析为合法 CSS 选择器' };
    }
    best = best === null ? parsed : maxSpecificity(best, parsed);
  }
  return { selector, valid: true, specificity: best };
}

/**
 * 批量计算多行选择器的权重，忽略空行
 *
 * @param text - 多行文本，每行一个选择器
 * @returns 每行的解析结果
 */
export function calculateSpecificityLines(text: string): SpecificityResult[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => calculateSpecificity(line));
}

/**
 * 将权重三元组格式化为 `(a, b, c)` 文本
 *
 * @param specificity - 权重三元组
 * @returns 形如 `(1, 2, 3)` 的字符串
 */
export function formatSpecificity(specificity: Specificity): string {
  return `(${specificity.a}, ${specificity.b}, ${specificity.c})`;
}
