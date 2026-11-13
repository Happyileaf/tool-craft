/**
 * Porter Stemming Algorithm（Porter, 1980）的确定性 TypeScript 实现。
 *
 * 纯函数、零 DOM 依赖、零数据依赖：仅依赖约 60 条后缀规则与
 * C/VC 音节度量（measure）。规则与步骤编号严格对应原论文
 * "An algorithm for suffix stripping"（1980）。
 */

/** 元音字母集合（Porter 定义的 a e i o u，y 按上下文判定） */
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * 判断下标处字符是否为元音。
 * Porter 规则：a/e/i/o/u 恒为元音；y 仅当其紧邻前一个字母为辅音时按元音处理
 * （词首 y 为辅音，元音后的 y 也是辅音，如 try、enjoy）。
 *
 * @param word - 小写字符数组
 * @param index - 待判定下标
 * @returns 是否为元音
 */
function isVowel(word: string[], index: number): boolean {
  const char = word[index];
  if (char === undefined) {
    return false;
  }
  if (VOWELS.has(char)) {
    return true;
  }
  if (char === 'y' && index > 0) {
    const prev = word[index - 1];
    return prev !== undefined && !VOWELS.has(prev) && prev !== 'y';
  }
  return false;
}

/**
 * 计算 Porter 音节度量 m：将词表示为 [C](VC){m}[V] 形式后 VC 序列的重复次数。
 * 以状态机扫描：每发生一次「元音段 → 辅音」的闭合即完成一组 VC，m 加一。
 *
 * @param word - 小写字符数组
 * @returns 度量值 m（非负整数）
 */
function measure(word: string[]): number {
  let count = 0;
  let inVowelRegion = false;
  for (let i = 0; i < word.length; i += 1) {
    if (isVowel(word, i)) {
      inVowelRegion = true;
    } else if (inVowelRegion) {
      // 元音段后遇到首个辅音：一组 VC 闭合
      count += 1;
      inVowelRegion = false;
    }
  }
  return count;
}

/**
 * 判断词干（0..length-1 范围）中是否包含元音。
 *
 * @param word - 小写字符数组
 * @returns 是否含元音（含按元音处理的 y）
 */
function containsVowel(word: string[]): boolean {
  for (let i = 0; i < word.length; i += 1) {
    if (isVowel(word, i)) {
      return true;
    }
  }
  return false;
}

/**
 * 判断是否以双辅音结尾（如 -tt、-ss），且两个辅音相同。
 *
 * @param word - 小写字符数组
 * @returns 是否双辅音结尾
 */
function endsDoubleConsonant(word: string[]): boolean {
  const len = word.length;
  if (len < 2) {
    return false;
  }
  const last = word[len - 1];
  const prev = word[len - 2];
  return last !== undefined && prev !== undefined && last === prev && !isVowel(word, len - 1);
}

/**
 * 判断结尾是否为辅音-元音-辅音（CVC）结构，且末位辅音不是 w / x / y。
 * 三位均通过 isVowel 统一判定（y 按其上下文规则处理）：
 * 首尾为辅音、中间为元音，且末位不属于 w/x/y。这是 Porter *o / *d 条件。
 *
 * @param word - 小写字符数组
 * @returns 是否满足 CVC 且末位合法
 */
function endsCvc(word: string[]): boolean {
  const len = word.length;
  if (len < 3) {
    return false;
  }
  const c2 = word[len - 1];
  if (c2 === undefined || isVowel(word, len - 1) || c2 === 'w' || c2 === 'x' || c2 === 'y') {
    return false;
  }
  return !isVowel(word, len - 3) && isVowel(word, len - 2);
}

/**
 * 判断字符数组是否以指定后缀结尾。
 *
 * @param word - 小写字符数组
 * @param suffix - 后缀字符串
 * @returns 是否匹配
 */
function hasSuffix(word: string[], suffix: string): boolean {
  if (suffix.length > word.length) {
    return false;
  }
  const start = word.length - suffix.length;
  for (let i = 0; i < suffix.length; i += 1) {
    if (word[start + i] !== suffix[i]) {
      return false;
    }
  }
  return true;
}

/**
 * 去掉词尾指定长度的后缀，返回新的字符数组（不修改入参）。
 *
 * @param word - 小写字符数组
 * @param suffixLength - 要移除的后缀长度
 * @returns 移除后缀后的新数组
 */
function removeSuffix(word: string[], suffixLength: number): string[] {
  return word.slice(0, word.length - suffixLength);
}

/**
 * 在字符数组尾部追加替换字符串，返回新数组。
 *
 * @param word - 小写字符数组
 * @param replacement - 替换后缀
 * @returns 追加后的新数组
 */
function appendSuffix(word: string[], replacement: string): string[] {
  return [...word, ...replacement.split('')];
}

/**
 * 步骤 1a：处理复数与基础屈折后缀。
 * - SSES → SS；IES → I；SS 保留；末尾单个 S 删除
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step1a(word: string[]): string[] {
  if (hasSuffix(word, 'sses')) {
    return removeSuffix(word, 4).concat(['s', 's']);
  }
  if (hasSuffix(word, 'ies')) {
    return removeSuffix(word, 3).concat(['i']);
  }
  if (hasSuffix(word, 'ss')) {
    return word;
  }
  if (hasSuffix(word, 's')) {
    return removeSuffix(word, 1);
  }
  return word;
}

/**
 * 步骤 1b：处理进行时 / 过去时后缀，并在满足条件时补 e。
 * EED/EE 按 m 判定；ED/ING 要求词干含元音，移除后按末尾形态归整。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step1b(word: string[]): string[] {
  if (hasSuffix(word, 'eed')) {
    const stem = removeSuffix(word, 3);
    if (measure(stem) > 0) {
      return appendSuffix(stem, 'ee');
    }
    return word;
  }
  if (hasSuffix(word, 'ed')) {
    const stem = removeSuffix(word, 2);
    if (containsVowel(stem)) {
      return normalizeAfterEdIng(stem);
    }
    return word;
  }
  if (hasSuffix(word, 'ing')) {
    const stem = removeSuffix(word, 3);
    if (containsVowel(stem)) {
      return normalizeAfterEdIng(stem);
    }
    return word;
  }
  return word;
}

/**
 * 步骤 1b 移除 ed/ing 后的词干归整：AT/BL/IZ 补 e，双辅音缩减，短词补 e。
 *
 * @param stem - 移除 ed/ing 后的词干
 * @returns 归整后的数组
 */
function normalizeAfterEdIng(stem: string[]): string[] {
  if (hasSuffix(stem, 'at') || hasSuffix(stem, 'bl') || hasSuffix(stem, 'iz')) {
    return appendSuffix(stem, 'e');
  }
  if (endsDoubleConsonant(stem)) {
    const last = stem[stem.length - 1];
    if (last !== 'l' && last !== 's' && last !== 'z') {
      return removeSuffix(stem, 1);
    }
    return stem;
  }
  if (isShortStem(stem)) {
    return appendSuffix(stem, 'e');
  }
  return stem;
}

/**
 * 步骤 1c：末尾 y 且词干含元音时转为 i。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step1c(word: string[]): string[] {
  if (hasSuffix(word, 'y')) {
    const stem = removeSuffix(word, 1);
    if (containsVowel(stem)) {
      return appendSuffix(stem, 'i');
    }
  }
  return word;
}

/** 步骤 2 规则表：(后缀, 替换)，要求移除后缀后的词干 m > 0，自上而下首条命中即止 */
const STEP2_RULES: ReadonlyArray<readonly [string, string]> = [
  ['ational', 'ate'],
  ['tional', 'tion'],
  ['enci', 'ence'],
  ['anci', 'ance'],
  ['izer', 'ize'],
  ['abli', 'able'],
  ['alli', 'al'],
  ['entli', 'ent'],
  ['eli', 'e'],
  ['ousli', 'ous'],
  ['ization', 'ize'],
  ['ation', 'ate'],
  ['ator', 'ate'],
  ['alism', 'al'],
  ['iveness', 'ive'],
  ['fulness', 'ful'],
  ['ousness', 'ous'],
  ['aliti', 'al'],
  ['iviti', 'ive'],
  ['biliti', 'ble'],
];

/**
 * 步骤 2：对 m > 0 的词干应用常见形容词/名词派生后缀映射，首条匹配生效。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step2(word: string[]): string[] {
  for (const [suffix, replacement] of STEP2_RULES) {
    if (hasSuffix(word, suffix)) {
      const stem = removeSuffix(word, suffix.length);
      if (measure(stem) > 0) {
        return appendSuffix(stem, replacement);
      }
      return word;
    }
  }
  return word;
}

/** 步骤 3 规则表：(后缀, 替换)，要求移除后缀后的词干 m > 0 */
const STEP3_RULES: ReadonlyArray<readonly [string, string]> = [
  ['icate', 'ic'],
  ['ative', ''],
  ['alize', 'al'],
  ['iciti', 'ic'],
  ['ical', 'ic'],
  ['ful', ''],
  ['ness', ''],
];

/**
 * 步骤 3：处理 icate/ative/alize 等后缀，要求词干 m > 0，首条匹配生效。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step3(word: string[]): string[] {
  for (const [suffix, replacement] of STEP3_RULES) {
    if (hasSuffix(word, suffix)) {
      const stem = removeSuffix(word, suffix.length);
      if (measure(stem) > 0) {
        return appendSuffix(stem, replacement);
      }
      return word;
    }
  }
  return word;
}

/** 步骤 4 的 -ion 以外后缀表，要求移除后词干 m > 1；按长度降序排列，保证最长后缀优先匹配 */
const STEP4_SUFFIXES: readonly string[] = [
  'ement',
  'able',
  'ible',
  'ment',
  'ance',
  'ence',
  'ant',
  'ent',
  'ism',
  'ate',
  'iti',
  'ous',
  'ive',
  'ize',
  'al',
  'er',
  'ic',
  'ou',
];

/**
 * 步骤 4：剥离名词/形容词残留后缀，要求词干 m > 1；
 * -ion 仅当其前为 s 或 t 时移除。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step4(word: string[]): string[] {
  if (hasSuffix(word, 'ion')) {
    const stem = removeSuffix(word, 3);
    const before = stem[stem.length - 1];
    if (measure(stem) > 1 && (before === 's' || before === 't')) {
      return stem;
    }
    return word;
  }
  for (const suffix of STEP4_SUFFIXES) {
    if (hasSuffix(word, suffix)) {
      const stem = removeSuffix(word, suffix.length);
      if (measure(stem) > 1) {
        return stem;
      }
      return word;
    }
  }
  return word;
}

/**
 * 判断是否为 Porter 定义的「短词干」（*d / *o 条件）：音节度量 m = 1，
 * 且词干以严格 CVC 结构结尾（末位辅音不是 w/x/y），如 agre、ceas。
 *
 * @param word - 小写字符数组
 * @returns 是否为短词干
 */
function isShortStem(word: string[]): boolean {
  return measure(word) === 1 && endsCvc(word);
}

/**
 * 步骤 5a：移除末尾 e。规则：去掉 e 后词干 m > 1 时删除；
 * m = 1 且词干不满足短词干条件（*d：m=1 且以 CVC 结尾）时删除，否则保留。
 * 因此 agre/ceas 这类 CVC 短词干保留 e，而 relat/troubl 等去掉 e。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step5a(word: string[]): string[] {
  if (hasSuffix(word, 'e')) {
    const stem = removeSuffix(word, 1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !isShortStem(stem))) {
      return stem;
    }
  }
  return word;
}

/**
 * 步骤 5b：m > 1 时将末尾双 l 缩减为单 l。
 *
 * @param word - 小写字符数组
 * @returns 处理后的数组
 */
function step5b(word: string[]): string[] {
  if (measure(word) > 1 && endsDoubleConsonant(word) && word[word.length - 1] === 'l') {
    return removeSuffix(word, 1);
  }
  return word;
}

/**
 * 对单个英文单词执行完整 Porter 1980 词干提取。
 * 输入会被转为小写；长度 ≤ 2 的词按原论文约定直接返回小写形式。
 *
 * @param input - 原始单词（允许含大小写）
 * @returns 提取后的词干
 */
export function stemWord(input: string): string {
  const word = input.toLowerCase().split('');
  if (word.length <= 2) {
    return word.join('');
  }
  const stepped = [step1a, step1b, step1c, step2, step3, step4, step5a, step5b].reduce(
    (current, step) => step(current),
    word,
  );
  return stepped.join('');
}

/** 单个词条的词干归并结果 */
export interface StemGroup {
  /** 归并后的词干 */
  stem: string;
  /** 归并到该词干的全部原始词形（按首次出现顺序、去重） */
  forms: string[];
  /** 该词干在输入文本中的总出现次数 */
  count: number;
}

/** 批处理整体结果 */
export interface StemBatchResult {
  /** 有效单词总数（词次，tokens） */
  totalTokens: number;
  /** 不同词干数量 */
  uniqueStems: number;
  /** 按出现次数降序、次数相同按词干字母序排列的归并分组 */
  groups: StemGroup[];
}

/**
 * 从任意英文文本中切分单词：连续的字母/撇号序列视为一个词，
 * 数字、标点与空白均作为分隔符。内部转小写后再提取词干。
 *
 * @param text - 原始文本
 * @returns 切分得到的小写单词数组（保持出现顺序）
 */
export function tokenizeEnglish(text: string): string[] {
  return text.match(/[a-zA-Z']+/g) ?? [];
}

/**
 * 批量词干提取与词形归并：对文本分词后逐词提取词干，
 * 输出「词干 → 原始词形列表 / 出现次数」分组。
 *
 * @param text - 待处理的英文文本
 * @returns 归并分组与统计信息
 */
export function stemText(text: string): StemBatchResult {
  const tokens = tokenizeEnglish(text);
  const groupMap = new Map<string, StemGroup>();
  for (const token of tokens) {
    const lower = token.toLowerCase();
    const stem = stemWord(lower);
    const existing = groupMap.get(stem);
    if (existing === undefined) {
      groupMap.set(stem, { stem, forms: [lower], count: 1 });
    } else {
      existing.count += 1;
      if (!existing.forms.includes(lower)) {
        existing.forms.push(lower);
      }
    }
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.stem.localeCompare(b.stem);
  });
  return {
    totalTokens: tokens.length,
    uniqueStems: groups.length,
    groups,
  };
}

/**
 * 将归并结果导出为 CSV 文本（带表头，词形列表以分号连接）。
 *
 * @param groups - 词干归并分组
 * @returns CSV 字符串
 */
export function groupsToCsv(groups: StemGroup[]): string {
  const header = 'stem,count,forms';
  const rows = groups.map((group) => {
    const forms = group.forms.join(';').replace(/"/g, '""');
    return `${group.stem},${group.count},"${forms}"`;
  });
  return [header, ...rows].join('\n');
}
