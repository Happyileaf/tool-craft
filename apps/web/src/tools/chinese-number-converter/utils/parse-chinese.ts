/**
 * 中文数字 → 阿拉伯数字（零依赖纯函数）
 *
 * 支持：
 * - 小写（零一二…、十百千万亿）与财务大写（零壹贰…、拾佰仟萬億）两套字形，可混用
 * - 口语简式：「两千三」=2300、「一万两千三」=12300（省略末位节单位，按口语习惯解释）
 * - 负数（负）、小数（点）、金额用字（元、角、分、整）
 * - 连续零占位；最大 16 位整数（千万亿以内）
 *
 * 口语简式存在固有歧义（「两千三」在部分语境可指 2003），解析器按普通话主流习惯
 * 解释为 2300，并在 notes 中给出说明。
 */

/** 数字字符（含「两/兩」）→ 数值 */
const DIGIT_VALUE = new Map<string, number>([
  ['零', 0],
  ['〇', 0],
  ['一', 1],
  ['壹', 1],
  ['二', 2],
  ['贰', 2],
  ['貳', 2],
  ['两', 2],
  ['兩', 2],
  ['三', 3],
  ['叁', 3],
  ['參', 3],
  ['四', 4],
  ['肆', 4],
  ['五', 5],
  ['伍', 5],
  ['六', 6],
  ['陆', 6],
  ['陸', 6],
  ['七', 7],
  ['柒', 7],
  ['八', 8],
  ['捌', 8],
  ['九', 9],
  ['玖', 9],
]);

/** 小单位（十/拾=10、百/佰=100、千/仟=1000） */
const SMALL_UNIT_VALUE = new Map<string, number>([
  ['十', 10],
  ['拾', 10],
  ['百', 100],
  ['佰', 100],
  ['千', 1000],
  ['仟', 1000],
]);

/** 节单位 */
const WAN_CHARS = new Set(['万', '萬']);
const YI_CHARS = new Set(['亿', '億']);

/** 金额用字：解析时剥离（角分除外，见下方小数处理） */
const MONEY_CHARS = new Set(['元', '圆', '圓', '整', '正']);

/** 小数部分最大位数（角、分） */
const MAX_FRACTION_DIGITS = 2;

export interface ParseChineseOptions {
  /**
   * 输入是否按金额文本解析：
   * - 'money'：允许并解析「元 / 角 / 分 / 整」用字
   * - 'number'：拒绝金额用字，仅接受「点」小数
   * - 'auto'（默认）：出现金额用字时按金额解析
   */
  mode?: 'auto' | 'money' | 'number';
}

export interface ChineseNumberResult {
  /** 解析得到的规范阿拉伯数字字符串 */
  value: string;
  /** 解析过程中的提示（如口语简式解释） */
  notes: string[];
}

/**
 * 解析中文数字字符串为阿拉伯数字。
 *
 * @param input - 中文数字文本
 * @param options - 解析模式
 * @returns 规范数字字符串与提示
 * @throws 空输入、含非法字符、结构不合法或超范围时抛出错误
 */
export function parseChineseNumber(
  input: string,
  options: ParseChineseOptions = {},
): ChineseNumberResult {
  const mode = options.mode ?? 'auto';
  const notes: string[] = [];
  let text = input.replace(/\s+/g, '');

  if (text === '') {
    throw new Error('内容不能为空');
  }

  let negative = false;
  if (text.startsWith('负') || text.startsWith('負')) {
    negative = true;
    text = text.slice(1);
  }
  if (text === '') {
    throw new Error('负号后缺少数字');
  }

  // 判断是否金额形式
  const hasMoneyChar = [...text].some(
    (ch) => MONEY_CHARS.has(ch) || ch === '角' || ch === '分',
  );
  const moneyMode = mode === 'money' || (mode === 'auto' && hasMoneyChar);
  if (mode === 'number' && hasMoneyChar) {
    throw new Error('当前为数字模式，请去除「元 / 角 / 分 / 整」等金额用字');
  }

  // 拆分整数段与小数段
  let integerPart = text;
  let fractionDigits: number[] = [];

  if (moneyMode) {
    // 金额解析：先剥离「整/正」，再以「元」为整数与角分的分界
    const cleaned = [...text].filter((ch) => ch !== '整' && ch !== '正').join('');
    const yuanIndex = findFirst(cleaned, ['元', '圆', '圓']);
    let head: string;
    let tail: string;
    if (yuanIndex >= 0) {
      head = cleaned.slice(0, yuanIndex);
      tail = cleaned.slice(yuanIndex + 1);
      if (findFirst(tail, ['元', '圆', '圓']) >= 0) {
        throw new Error('「元」只能出现一次');
      }
    } else {
      // 无「元」：含角/分时整数部分为 0（如「肆角伍分」「伍分」），否则按普通整数解析
      const jiaoIndex = cleaned.indexOf('角');
      const fenIndex = cleaned.indexOf('分');
      if (jiaoIndex >= 0) {
        head = '';
        tail = cleaned;
      } else if (fenIndex >= 0) {
        head = '';
        tail = cleaned;
      } else {
        head = cleaned;
        tail = '';
      }
    }
    integerPart = head;
    fractionDigits = parseMoneyTail(tail);
  } else {
    const dotIndex = findFirst(integerPart, ['点', '點']);
    if (dotIndex >= 0) {
      const fracText = integerPart.slice(dotIndex + 1);
      integerPart = integerPart.slice(0, dotIndex);
      if (fracText === '') {
        throw new Error('小数点「点」后缺少数字');
      }
      for (const ch of fracText) {
        const digit = DIGIT_VALUE.get(ch);
        if (digit === undefined) {
          throw new Error(`小数部分包含非数字汉字「${ch}」`);
        }
        fractionDigits.push(digit);
      }
      if (fractionDigits.length > MAX_FRACTION_DIGITS) {
        throw new Error(`小数部分最多支持 ${MAX_FRACTION_DIGITS} 位（对应角、分）`);
      }
    }
  }

  if (integerPart === '' && fractionDigits.some((d) => d > 0)) {
    // 纯角分：整数为 0
    integerPart = '零';
  }
  if (integerPart === '') {
    throw new Error('未能解析出任何整数部分');
  }

  const { value: intValue, colloquial } = parseInteger(integerPart);
  if (colloquial) {
    notes.push(
      '检测到口语简式（如「两千三」），已按普通话主流习惯解释为省略末位节单位（两千三 = 2300）；如需表示 2003，请写作「两千零三」',
    );
  }

  let value = intValue;
  if (fractionDigits.some((d) => d > 0)) {
    while (fractionDigits.length < MAX_FRACTION_DIGITS) fractionDigits.push(0);
    const frac = fractionDigits.join('').replace(/0+$/, '');
    value = `${intValue}.${frac}`;
  }

  if (negative) value = `-${value}`;
  return { value, notes };
}

/** 首次出现任一字符的位置，均不存在返回 -1 */
function findFirst(text: string, chars: string[]): number {
  let best = -1;
  for (const ch of chars) {
    const idx = text.indexOf(ch);
    if (idx >= 0 && (best < 0 || idx < best)) best = idx;
  }
  return best;
}

/** 角/分标记首次出现的位置 */
function tailIndex(text: string): number {
  const jiao = text.indexOf('角');
  const fen = text.indexOf('分');
  if (jiao < 0) return fen;
  if (fen < 0) return jiao;
  return Math.min(jiao, fen);
}

/**
 * 解析金额尾部「X角Y分」为两个小数位数字
 *
 * @param tail - 已剥离「元 / 整」的尾部文本，如「肆角伍分」「零伍分」「伍分」
 * @returns 长度 1–2 的小数数字数组
 */
function parseMoneyTail(tail: string): number[] {
  if (tail === '') return [];
  const jiaoIndex = tail.indexOf('角');
  const fenIndex = tail.indexOf('分');
  if (jiaoIndex < 0 && fenIndex < 0) {
    throw new Error(`金额尾部「${tail}」无法识别（应包含「角」或「分」）`);
  }

  let jiao = 0;
  let fen = 0;
  if (jiaoIndex >= 0) {
    const jiaoText = tail.slice(0, jiaoIndex);
    jiao = singleDigit(jiaoText, '角');
  }
  if (fenIndex >= 0) {
    const fenStart = jiaoIndex >= 0 ? jiaoIndex + 1 : 0;
    let fenText = tail.slice(fenStart, fenIndex);
    // 允许「…元零伍分」中角位为空时用零连接
    if (jiaoIndex < 0) fenText = fenText.replace(/^零+/, '');
    fen = singleDigit(fenText, '分');
  }

  // 顺序校验：角必须在分之前，且分之后不得有多余字符
  if (jiaoIndex >= 0 && fenIndex >= 0 && jiaoIndex > fenIndex) {
    throw new Error('金额尾部「角」必须位于「分」之前');
  }
  const lastMark = Math.max(jiaoIndex, fenIndex);
  if (lastMark !== tail.length - 1) {
    throw new Error(`金额尾部包含多余字符「${tail.slice(lastMark + 1)}」`);
  }

  if (jiaoIndex < 0 && fenIndex >= 0) {
    // 纯分：补齐角位
    return [0, fen];
  }
  if (fenIndex >= 0) return [jiao, fen];
  return [jiao];
}

/** 解析单位前的单数字文本，空串按缺省 0 处理（仅角位允许缺省） */
function singleDigit(text: string, unit: string): number {
  if (text === '') {
    if (unit === '角') return 0;
    throw new Error('「分」前缺少数字');
  }
  if (text.length > 1 || DIGIT_VALUE.get(text[0] as string) === undefined) {
    throw new Error(`「${unit}」前必须恰好是一个数字汉字`);
  }
  return DIGIT_VALUE.get(text[0] as string) as number;
}

/**
 * 解析整数段（节层级结构：亿 > 万 > 节内十百千）
 *
 * @returns 十进制整数字符串与是否命中口语简式
 */
function parseInteger(text: string): { value: string; colloquial: boolean } {
  // 先按「亿 / 億」切分
  const yiParts = splitBySection(text, YI_CHARS, '亿');
  let total = BigInt(0);
  let colloquial = false;
  for (const segment of yiParts) {
    if (segment === null) {
      // 亿段：total × 10^8
      if (total === BigInt(0)) total = BigInt(1); // 「亿」单独出现以「一亿」理解
      total *= BigInt(100_000_000);
    } else {
      const wan = parseWanSection(segment);
      if (wan.colloquial) colloquial = true;
      total += wan.value;
    }
  }

  const result = total.toString();
  if (total < BigInt(0) || result.length > 16) {
    throw new Error('数值超出支持范围（最大 16 位整数，即千万亿以内）');
  }
  return { value: result, colloquial };
}

/**
 * 按节单位字符切分文本。
 *
 * 返回数组按从左到右顺序；节单位本身以 null 占位，
 * 例如「一亿二千万」→ ['一', null, '二千万']。
 */
function splitBySection(
  text: string,
  sectionChars: Set<string>,
  sectionName: string,
): (string | null)[] {
  const parts: (string | null)[] = [];
  let buffer = '';
  for (const ch of text) {
    if (sectionChars.has(ch)) {
      if (buffer === '') {
        throw new Error(`「${sectionName}」前缺少数字`);
      }
      parts.push(buffer);
      parts.push(null);
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  if (buffer !== '') parts.push(buffer);
  return parts;
}

/**
 * 解析「万」节段（含至多一个万），返回该段数值
 */
function parseWanSection(text: string): { value: bigint; colloquial: boolean } {
  const wanIdx = [...text].findIndex((ch) => WAN_CHARS.has(ch));
  if (wanIdx < 0) {
    const parsed = parseSmallSection(text);
    return { value: BigInt(parsed.value), colloquial: parsed.colloquial };
  }
  if ([...text].filter((ch) => WAN_CHARS.has(ch)).length > 1) {
    throw new Error('同一数字段中「万」不能重复出现（更大的量级请使用「亿」）');
  }
  const head = text.slice(0, wanIdx);
  const rest = text.slice(wanIdx + 1);
  if (head === '') {
    throw new Error('「万」前缺少数字');
  }
  const high = parseSmallSection(head);
  if (high.value >= 10000) {
    throw new Error('「万」之前的数字不能超过节范围（应小于一万）');
  }
  let value = BigInt(high.value) * BigInt(10_000);
  let colloquial = high.colloquial;
  if (rest !== '') {
    const low = parseSmallSection(rest, high.value > 0);
    if (low.colloquial) colloquial = true;
    value += BigInt(low.value);
  }
  return { value, colloquial };
}

/**
 * 解析 0–9999 的节内数字（支持十/百/千与口语简式）
 *
 * @param text - 节内文本
 * @param hasHigherSection - 本节是否为万/亿之后的低位节（影响末位裸数字解释）
 */
function parseSmallSection(
  text: string,
  hasHigherSection = false,
): { value: number; colloquial: boolean } {
  if (text === '') {
    throw new Error('数字段为空');
  }
  if (text === '零') return { value: 0, colloquial: false };

  let total = 0;
  let current: number | null = null;
  let seenZero = false;
  let lastUnit = 0;
  let colloquial = false;
  // 节首位置：仅在尚未消费任何数字/单位时允许「十二」省略「一」
  let atStart = true;

  for (const ch of text) {
    if (ch === '零' || ch === '〇') {
      if (current !== null) {
        total += current;
        current = null;
      }
      seenZero = true;
      atStart = false;
      continue;
    }
    const digit = DIGIT_VALUE.get(ch);
    if (digit !== undefined) {
      if (current !== null) {
        throw new Error(`数字「${ch}」前缺少数位单位（十/百/千）`);
      }
      current = digit;
      atStart = false;
      continue;
    }
    const unit = SMALL_UNIT_VALUE.get(ch);
    if (unit !== undefined) {
      if (current === null) {
        // 仅允许节首的「十二 / 拾贰」省略「一」；「一百十」等写法不合法
        if ((ch === '十' || ch === '拾') && atStart) {
          current = 1;
        } else {
          throw new Error(`单位「${ch}」前缺少数字`);
        }
      }
      total += current * unit;
      lastUnit = unit;
      current = null;
      seenZero = false;
      atStart = false;
      continue;
    }
    throw new Error(`无法识别的汉字「${ch}」`);
  }

  if (current !== null) {
    // 末位裸数字
    if (seenZero) {
      // 「一百零三」：零后的裸数字按个位
      total += current;
    } else if (lastUnit >= 1000) {
      // 「两千三」= 2300：口语省略「百」
      total += current * (lastUnit / 10);
      colloquial = true;
    } else if (lastUnit === 100) {
      // 「两百三」= 230：口语省略「十」
      total += current * 10;
      colloquial = true;
    } else if (lastUnit === 10) {
      // 「二十三」「二十三」的末位按个位
      total += current;
    } else if (hasHigherSection) {
      // 「一万二」：低位节起始的裸数字按千位（口语，=12000）
      total += current * 1000;
      colloquial = true;
    } else {
      // 纯裸数字（如「五」）按个位
      total += current;
    }
  }

  if (total >= 10000) {
    throw new Error('节内数字超出 0–9999 范围（「万」以上请使用万 / 亿节单位）');
  }
  return { value: total, colloquial };
}
