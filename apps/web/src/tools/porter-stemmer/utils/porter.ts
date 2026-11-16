/**
 * 经典 Porter Stemming Algorithm（Porter, 1980）的纯函数实现
 *
 * 严格遵循官方五步骤（1a / 1b / 1c / 2 / 3 / 4 / 5a / 5b）规则，
 * 零第三方依赖，全部计算可在浏览器本地完成。
 * 参考：Martin Porter 官方定义 https://tartarus.org/martin/PorterStemmer/
 */

/** 元音字母集合（y 的元音/辅音身份按上下文判定，见 isConsonant） */
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** 逐词提取结果 */
export interface StemEntry {
  /** 原始 token（保留大小写原貌） */
  original: string;
  /** Porter 词干（小写） */
  stem: string;
  /** token 在原文中的序号（从 0 开始） */
  index: number;
}

/** 词干归并分组 */
export interface StemGroup {
  /** Porter 词干（小写，可能不是真实单词，如 triplic） */
  stem: string;
  /** 归并到该词干的原始词形（去重，保留首次出现顺序） */
  forms: string[];
  /** 原始 token 总数（含重复） */
  count: number;
}

/** groupByStem 的选项 */
export interface GroupOptions {
  /** 是否按原始大小写精确分组，默认 false（忽略大小写归并） */
  caseSensitive?: boolean;
}

/**
 * 判断词中指定位置的字符是否为辅音
 *
 * y 在词首或紧跟辅音时视为辅音，否则视为元音
 *
 * @param word - 小写单词
 * @param index - 字符下标
 * @returns 是否为辅音
 */
function isConsonant(word: string, index: number): boolean {
  const ch = word[index];
  if (ch === undefined || VOWELS.has(ch)) {
    return false;
  }
  if (ch === 'y') {
    // 词首 y 为辅音；其余位置与前一字符「相反」：前元音则 y 辅音，前辅音则 y 元音
    if (index === 0) {
      return true;
    }
    return !isConsonant(word, index - 1);
  }
  return true;
}

/**
 * 计算词干的 measure m，即 `[C](VC){m}[V]` 形态中 VC 序列的重复次数
 *
 * @param stem - 待测量的词干
 * @returns measure 值
 */
function measure(stem: string): number {
  const length = stem.length;
  let i = 0;
  let m = 0;
  // 跳过词首的辅音序列 [C]
  while (i < length && isConsonant(stem, i)) {
    i += 1;
  }
  while (i < length) {
    // 元音序列 V
    while (i < length && !isConsonant(stem, i)) {
      i += 1;
    }
    if (i >= length) {
      break;
    }
    // 辅音序列 C，完整消费一个 VC 才计入 m
    while (i < length && isConsonant(stem, i)) {
      i += 1;
    }
    m += 1;
  }
  return m;
}

/**
 * 判断词中是否包含元音（*v* 条件）
 *
 * @param word - 小写单词
 * @returns 是否存在元音
 */
function containsVowel(word: string): boolean {
  for (let i = 0; i < word.length; i += 1) {
    if (!isConsonant(word, i)) {
      return true;
    }
  }
  return false;
}

/**
 * 判断词是否以两个相同的辅音结尾（*d 条件）
 *
 * @param word - 小写单词
 * @returns 是否双辅音结尾
 */
function endsDoubleConsonant(word: string): boolean {
  const length = word.length;
  if (length < 2) {
    return false;
  }
  const last = word[length - 1] as string;
  return last === word[length - 2] && isConsonant(word, length - 1);
}

/**
 * 判断词是否以「辅音-元音-辅音」结尾，且末尾辅音不是 w / x / y（*o 条件）
 *
 * @param word - 小写单词
 * @returns 是否满足 CVC 结尾条件
 */
function endsCvc(word: string): boolean {
  const length = word.length;
  if (length < 3) {
    return false;
  }
  const last = word[length - 1] as string;
  if (last === 'w' || last === 'x' || last === 'y') {
    return false;
  }
  return (
    isConsonant(word, length - 3) &&
    !isConsonant(word, length - 2) &&
    isConsonant(word, length - 1)
  );
}

/**
 * 若词以指定后缀结尾，则按规则替换；measure 等条件作用于去掉后缀后的词干
 *
 * @param word - 当前单词
 * @param suffix - 待匹配后缀
 * @param replacement - 替换内容
 * @param predicate - 基于剩余词干的附加条件，默认无条件替换
 * @returns 替换后的单词；不匹配时返回 null
 */
function replaceSuffix(
  word: string,
  suffix: string,
  replacement: string,
  predicate?: (stem: string) => boolean,
): string | null {
  if (!word.endsWith(suffix) || word.length <= suffix.length) {
    return null;
  }
  const stem = word.slice(0, word.length - suffix.length);
  if (predicate && !predicate(stem)) {
    return null;
  }
  return stem + replacement;
}

/**
 * Step 1b 去掉 ED / ING 后的补做规则
 *
 * - AT / BL / IZ 结尾补 E（ATE / BLE / IZE）
 * - 双辅音结尾且末字母非 L / S / Z 时去掉末字母
 * - measure 为 1 且满足 *o 时补 E
 *
 * @param word - 已去掉 ED / ING 的单词
 * @returns 补做后的单词
 */
function postStep1b(word: string): string {
  if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
    return `${word}e`;
  }
  if (endsDoubleConsonant(word)) {
    const last = word[word.length - 1] as string;
    if (last !== 'l' && last !== 's' && last !== 'z') {
      return word.slice(0, -1);
    }
    return word;
  }
  if (measure(word) === 1 && endsCvc(word)) {
    return `${word}e`;
  }
  return word;
}

/**
 * 对单个英文单词执行 Porter 词干提取
 *
 * 内部先转小写并剥离非 [a-z] 字符；空串或无字母输入返回空串；
 * 长度不超过 2 的词按官方约定原样返回。
 *
 * @param word - 原始单词
 * @returns Porter 词干
 */
export function stemWord(word: string): string {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) {
    return '';
  }
  if (cleaned.length <= 2) {
    return cleaned;
  }
  let current = cleaned;

  // Step 1a：复数后缀
  if (current.endsWith('sses')) {
    current = current.slice(0, -2);
  } else if (current.endsWith('ies')) {
    current = `${current.slice(0, -3)}i`;
  } else if (!current.endsWith('ss') && current.endsWith('s')) {
    current = current.slice(0, -1);
  }

  // Step 1b：过去式 / 进行时后缀（含补做规则）
  if (current.endsWith('eed')) {
    const stem = current.slice(0, -3);
    if (measure(stem) > 0) {
      current = `${stem}ee`;
    }
  } else if (current.endsWith('ed')) {
    const stem = current.slice(0, -2);
    if (containsVowel(stem)) {
      current = postStep1b(stem);
    }
  } else if (current.endsWith('ing')) {
    const stem = current.slice(0, -3);
    if (containsVowel(stem)) {
      current = postStep1b(stem);
    }
  }

  // Step 1c：(*v*) Y -> I
  if (current.endsWith('y')) {
    const stem = current.slice(0, -1);
    if (containsVowel(stem)) {
      current = `${stem}i`;
    }
  }

  // Step 2：(m > 0) 关联后缀替换，命中一条即结束本步骤
  const step2Rules: Array<[string, string]> = [
    ['ational', 'ate'],
    ['tional', 'tion'],
    ['enci', 'ence'],
    ['anci', 'ance'],
    ['izer', 'ize'],
    ['bli', 'ble'],
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
    ['logi', 'log'],
    ['fuli', 'ful'],
    ['ogi', 'og'],
  ];
  for (const [suffix, replacement] of step2Rules) {
    const next = replaceSuffix(current, suffix, replacement, (stem) => measure(stem) > 0);
    if (next !== null) {
      current = next;
      break;
    }
  }

  // Step 3：(m > 0) 后缀替换 / 删除
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
    const next = replaceSuffix(current, suffix, replacement, (stem) => measure(stem) > 0);
    if (next !== null) {
      current = next;
      break;
    }
  }

  // Step 4：(m > 1) 删除名词 / 形容词后缀，顺序与条件严格遵循官方 C 实现
  // 注意 ement / ment 必须排在 ent 之前，否则 ement 会被 ent 截掉词干末尾的 e
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
  let step4Done = false;
  for (const suffix of step4Suffixes) {
    let next: string | null = null;
    if (suffix === 'ent') {
      // ent 不得误匹配 ement / ment 词尾（element、document 等由 ement/ment 规则先判定）
      if (
        current.endsWith('ent') &&
        current.length > 3 &&
        !current.endsWith('ement') &&
        !current.endsWith('ment')
      ) {
        const stem = current.slice(0, -3);
        if (measure(stem) > 1) {
          next = stem;
        }
      }
    } else {
      next = replaceSuffix(current, suffix, '', (stem) => measure(stem) > 1);
    }
    if (next !== null) {
      current = next;
      step4Done = true;
      break;
    }
  }
  // ION 仅当前置字符为 s / t 时删除
  if (!step4Done && current.endsWith('ion') && current.length > 3) {
    const stem = current.slice(0, -3);
    const preceding = stem[stem.length - 1] as string;
    if ((preceding === 's' || preceding === 't') && measure(stem) > 1) {
      current = stem;
      step4Done = true;
    }
  }

  // Step 5a：词尾 E 删除（长度守卫：剩余词干至少保留 1 个字母）
  if (current.length > 1 && current.endsWith('e')) {
    const stem = current.slice(0, -1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !endsCvc(stem))) {
      current = stem;
    }
  }

  // Step 5b：(m > 1 且 *d 且末字母 L) 去掉一个 L
  if (measure(current) > 1 && endsDoubleConsonant(current) && current.endsWith('l')) {
    current = current.slice(0, -1);
  }

  return current;
}

/**
 * 按非字母边界切分文本，保留每个 token 的大小写原貌
 *
 * @param text - 原始文本
 * @returns token 序列
 */
export function tokenize(text: string): string[] {
  return text.match(/[A-Za-z]+/g) ?? [];
}

/**
 * 对整段文本逐词执行词干提取
 *
 * @param text - 原始文本
 * @returns 每个 token 一条的提取结果（含原始词形、词干与序号）
 */
export function stemText(text: string): StemEntry[] {
  return tokenize(text).map((original, index) => ({
    original,
    stem: stemWord(original),
    index,
  }));
}

/**
 * 按词干归并逐词结果
 *
 * - 默认忽略大小写：'Dog' 与 'dog' 视为同一词形，按 stem 分组
 * - caseSensitive=true：按 original 精确形式分组，不同大小写各成一组
 * - 结果按 count 降序，count 相同按首次出现顺序返回
 *
 * @param entries - stemText 的逐词结果
 * @param options - 归并选项
 * @returns 归并分组
 */
export function groupByStem(entries: StemEntry[], options: GroupOptions = {}): StemGroup[] {
  const { caseSensitive = false } = options;
  const groups = new Map<string, StemGroup>();
  const seenForms = new Map<string, Set<string>>();
  const firstSeen = new Map<string, number>();

  entries.forEach((entry, position) => {
    const key = caseSensitive ? entry.original : entry.stem;
    let group = groups.get(key);
    if (!group) {
      group = { stem: entry.stem, forms: [], count: 0 };
      groups.set(key, group);
      seenForms.set(key, new Set<string>());
      firstSeen.set(key, position);
    }
    group.count += 1;
    const formKey = caseSensitive ? entry.original : entry.original.toLowerCase();
    const formSet = seenForms.get(key) as Set<string>;
    if (!formSet.has(formKey)) {
      formSet.add(formKey);
      group.forms.push(entry.original);
    }
  });

  return [...groups.entries()]
    .sort(
      ([keyA, groupA], [keyB, groupB]) =>
        groupB.count - groupA.count ||
        (firstSeen.get(keyA) as number) - (firstSeen.get(keyB) as number),
    )
    .map(([, group]) => group);
}
