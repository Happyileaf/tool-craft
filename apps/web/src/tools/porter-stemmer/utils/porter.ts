/**
 * Porter (1980) 英文词干提取算法的确定性 TypeScript 实现。
 * 参考：M.F. Porter, "An algorithm for suffix stripping", 1980。
 * 全部为纯字符串规则运算，无外部依赖，固定输入必有固定输出。
 */

/**
 * 将单词转换为 Porter 形式串：V=元音，C=辅音。
 * 规则：a/e/i/o/u 恒为元音；词首 y 为辅音，非词首 y 的类别与前一字符相反；其余为辅音。
 */
function toForm(word: string): string {
  let form = '';
  for (let i = 0; i < word.length; i += 1) {
    const ch = word[i];
    if (ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u') {
      form += 'V';
    } else if (ch === 'y') {
      // 词首 y 为辅音；非词首 y 紧跟辅音时为元音，紧跟元音时为辅音
      form += i !== 0 && form[i - 1] === 'C' ? 'V' : 'C';
    } else {
      form += 'C';
    }
  }
  return form;
}

/** 词干的 VC 序列度量 m：形式串 [C](VC){m}[V] 中的 m，即完整 VC 交替对数量 */
function measure(stem: string): number {
  const form = toForm(stem);
  let count = 0;
  let inV = false;
  for (const ch of form) {
    if (ch === 'V') {
      inV = true;
    } else if (inV) {
      // 元音后首次遇到辅音，完成一个 VC 对
      count += 1;
      inV = false;
    }
  }
  return count;
}

/** 词干中是否包含元音 */
function containsVowel(stem: string): boolean {
  return toForm(stem).includes('V');
}

/** 词干是否以双辅音结尾（两个相同的辅音字符） */
function endsDoubleConsonant(stem: string): boolean {
  const n = stem.length;
  if (n < 2) return false;
  return stem[n - 1] === stem[n - 2] && toForm(stem).endsWith('CC');
}

/** 词干结尾是否为辅音-元音-辅音（CVC，且末位非 w/x/y） */
function endsCvc(stem: string): boolean {
  const n = stem.length;
  if (n < 3) return false;
  if (!toForm(stem).endsWith('CVC')) return false;
  const last = stem[n - 1];
  return last !== 'w' && last !== 'x' && last !== 'y';
}

/** 若 word 以 suffix 结尾且替换后剩余词干满足 cond，则执行替换，返回是否命中 */
function replaceSuffix(
  word: string,
  suffix: string,
  replacement: string,
  cond: (stem: string) => boolean,
): { hit: boolean; word: string } {
  if (!word.endsWith(suffix)) return { hit: false, word };
  const stem = word.slice(0, word.length - suffix.length);
  if (!cond(stem)) return { hit: false, word };
  return { hit: true, word: stem + replacement };
}

/** 对单个英文单词执行完整 Porter 五阶段剥离 */
export function stemWord(input: string): string {
  let word = input.toLowerCase();
  if (word.length <= 2) return word;

  // 步骤 1a
  if (word.endsWith('sses')) {
    word = word.slice(0, -2); // sses -> ss
  } else if (word.endsWith('ies')) {
    word = `${word.slice(0, -3)}i`; // ies -> i
  } else if (word.endsWith('ss')) {
    // 保留 ss
  } else if (word.endsWith('s')) {
    word = word.slice(0, -1);
  }

  // 步骤 1b 标记位：eed 之外的成功替换需要在 1b 后补做 ed/ing 收尾
  let step1bExtended = false;

  if (word.endsWith('eed')) {
    const stem = word.slice(0, -3);
    if (measure(stem) > 0) word = `${stem}ee`;
  } else if (word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    if (containsVowel(stem)) {
      word = stem;
      step1bExtended = true;
    }
  } else if (word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    if (containsVowel(stem)) {
      word = stem;
      step1bExtended = true;
    }
  }

  if (step1bExtended) {
    if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
      word += 'e';
    } else if (endsDoubleConsonant(word) && !word.endsWith('l') && !word.endsWith('s') && !word.endsWith('z')) {
      word = word.slice(0, -1);
    } else if (measure(word) === 1 && endsCvc(word)) {
      word += 'e';
    }
  }

  // 步骤 1c：含元音的词干末尾 y -> i
  if (word.endsWith('y')) {
    const stem = word.slice(0, -1);
    if (containsVowel(stem)) word = `${stem}i`;
  }

  // 步骤 2
  const step2Rules: Array<[string, string]> = [
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
  for (const [suffix, replacement] of step2Rules) {
    const r = replaceSuffix(word, suffix, replacement, (stem) => measure(stem) > 0);
    if (r.hit) {
      word = r.word;
      break;
    }
  }

  // 步骤 3
  const step3Rules: Array<[string, string]> = [
    ['icate', 'ic'],
    ['ative', ''],
    ['alize', 'al'],
    ['iciti', 'ic'],
    ['ical', 'ic'],
    ['ful', ''],
    ['ness', ''],
  ];
  for (const [suffix, replacement] of step3Rules) {
    const r = replaceSuffix(word, suffix, replacement, (stem) => measure(stem) > 0);
    if (r.hit) {
      word = r.word;
      break;
    }
  }

  // 步骤 4：在 m>1 的词干上删除后缀（ion 需前导 s/t）。
  // Porter 语义：取首个（按规范顺序）与词尾匹配的后缀，仅评估一次即结束本步。
  const step4Suffixes = [
    'al',
    'ance',
    'ence',
    'er',
    'ic',
    'able',
    'ible',
    'ant',
    'ement',
    'ment',
    'ent',
    'ou',
    'ism',
    'ate',
    'iti',
    'ous',
    'ive',
    'ize',
  ];
  if (word.endsWith('ion')) {
    const stem = word.slice(0, -3);
    if (measure(stem) > 1 && (stem.endsWith('s') || stem.endsWith('t'))) {
      word = stem;
    }
  } else {
    const suffix = step4Suffixes.find((s) => word.endsWith(s));
    if (suffix) {
      const stem = word.slice(0, -suffix.length);
      if (measure(stem) > 1) word = stem;
    }
  }

  // 步骤 5a
  if (word.endsWith('e')) {
    const stem = word.slice(0, -1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !endsCvc(stem))) {
      word = stem;
    }
  }

  // 步骤 5b：m>1 时去掉结尾双辅音中的一个 ll
  if (measure(word) > 1 && endsDoubleConsonant(word) && word.endsWith('l')) {
    word = word.slice(0, -1);
  }

  return word;
}

export interface StemToken {
  original: string;
  stem: string;
}

export interface StemGroup {
  stem: string;
  variants: string[];
  count: number;
}

export interface StemResult {
  tokens: StemToken[];
  groups: StemGroup[];
  totalTokens: number;
  uniqueStems: number;
  mergeRatio: number;
}

/** 按非字母字符分词，保留出现顺序 */
export function tokenize(text: string): string[] {
  return text.match(/[a-zA-Z]+/g) ?? [];
}

/** 对整段文本做词干提取与词形归并统计 */
export function stemText(text: string): StemResult {
  const words = tokenize(text);
  const tokens: StemToken[] = words.map((original) => ({ original, stem: stemWord(original) }));

  const groupMap = new Map<string, { variants: Map<string, number>; count: number }>();
  for (const { original, stem } of tokens) {
    const group = groupMap.get(stem) ?? { variants: new Map<string, number>(), count: 0 };
    group.variants.set(original, (group.variants.get(original) ?? 0) + 1);
    group.count += 1;
    groupMap.set(stem, group);
  }

  const groups: StemGroup[] = Array.from(groupMap.entries())
    .map(([stem, group]) => ({
      stem,
      variants: Array.from(group.variants.keys()).sort((a, b) => a.localeCompare(b)),
      count: group.count,
    }))
    .sort((a, b) => b.count - a.count || a.stem.localeCompare(b.stem));

  const totalTokens = tokens.length;
  const uniqueStems = groups.length;
  const mergeRatio = totalTokens === 0 ? 0 : 1 - uniqueStems / totalTokens;

  return { tokens, groups, totalTokens, uniqueStems, mergeRatio };
}
