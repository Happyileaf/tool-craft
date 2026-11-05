/**
 * BCP 47（RFC 5646）语言标签解析：纯函数结构化解析与合法性诊断。
 *
 * 主解析逻辑独立实现，不依赖运行时 Intl，保证错误诊断可解释、可单测；
 * 组件层可再用浏览器原生 Intl.Locale 做交叉验证。全部为确定性纯函数：
 * 不触碰 DOM、不发起网络请求、零新增依赖。
 */

/** 诊断级别：error 表示结构非法，warning 表示可解析但存在风险或未收录 */
export type DiagnosticLevel = 'error' | 'warning';

/** 单条诊断信息 */
export interface BcpDiagnostic {
  /** 诊断级别 */
  level: DiagnosticLevel;
  /** 触发问题的子标签（可为空，表示整标签问题） */
  subtag?: string;
  /** 人类可读的原因说明 */
  message: string;
}

/** 单个常规扩展（单字母前缀 + 内容子标签） */
export interface BcpExtension {
  /** 扩展前缀字母（如 u、t） */
  singleton: string;
  /** 扩展下的原始内容子标签序列 */
  subtags: string[];
  /** 仅 u 扩展：属性子标签（首个 keyword 之前的独立子标签） */
  attributes?: string[];
  /** 仅 u 扩展：keyword 键值对（键为 2 字母，值为其后直到下一 keyword 的子标签序列） */
  keywords?: { key: string; type: string[] }[];
}

/** 结构化解析结果 */
export interface Bcp47ParseResult {
  /** 原始输入 */
  input: string;
  /** 是否为不规则 / 规则遗留标签（grandfathered） */
  grandfathered: string | null;
  /** 主语言子标签（小写形式） */
  language: string | null;
  /** extlang 子标签（3 字母，通常为空） */
  extlang: string | null;
  /** 文字脚本子标签 */
  script: string | null;
  /** 区域子标签 */
  region: string | null;
  /** 变体子标签序列 */
  variants: string[];
  /** 扩展序列（含 u 扩展的 keyword 拆分） */
  extensions: BcpExtension[];
  /** 私有使用子标签序列（x- 之后） */
  privateUse: string[];
  /** 全部诊断（结构错误与告警） */
  diagnostics: BcpDiagnostic[];
  /** 按 BCP 47 推荐大小写规范化后的标签 */
  canonical: string;
  /** 规范化建议（当原始写法与推荐写法不一致时给出原因） */
  suggestions: string[];
}

/** 常用主语言子标签 -> 英文名（数据量可控的静态表，非全量 CLDR） */
export const COMMON_LANGUAGES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  uk: 'Ukrainian',
  sv: 'Swedish',
  cs: 'Czech',
  da: 'Danish',
  fi: 'Finnish',
  el: 'Greek',
  he: 'Hebrew',
  hu: 'Hungarian',
  no: 'Norwegian',
  ro: 'Romanian',
  sk: 'Slovak',
  bg: 'Bulgarian',
  hr: 'Croatian',
  ms: 'Malay',
  ca: 'Catalan',
};

/** 常用脚本子标签 -> 英文名 */
export const COMMON_SCRIPTS: Record<string, string> = {
  Hans: 'Simplified Chinese',
  Hant: 'Traditional Chinese',
  Latn: 'Latin',
  Cyrl: 'Cyrillic',
  Arab: 'Arabic',
  Hani: 'Han (Hanzi/Kanji/Hanja)',
  Hira: 'Hiragana',
  Kana: 'Katakana',
  Hang: 'Hangul',
  Thai: 'Thai',
  Grek: 'Greek',
  Hebr: 'Hebrew',
  Deva: 'Devanagari',
};

/** 常用区域子标签 -> 英文名 */
export const COMMON_REGIONS: Record<string, string> = {
  CN: 'China',
  HK: 'Hong Kong SAR China',
  TW: 'Taiwan, Province of China',
  US: 'United States',
  GB: 'United Kingdom',
  JP: 'Japan',
  KR: 'South Korea',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  RU: 'Russia',
  AU: 'Australia',
  CA: 'Canada',
  BR: 'Brazil',
  IN: 'India',
  SG: 'Singapore',
  MO: 'Macao SAR China',
  '419': 'Latin America and the Caribbean',
};

/**
 * RFC 5646 遗留（grandfathered）标签表：不规则 + 规则标签。
 * 这些标签不满足常规 grammar 但历史上合法，需整体识别。
 */
export const GRANDFATHERED_TAGS: Record<string, string> = {
  'en-GB-oed': '规则遗留标签（Oxford English Dictionary 拼写），推荐改用 en-GB-oxendict',
  'i-ami': '不规则遗留标签（Amis）',
  'i-bnn': '不规则遗留标签（Bunun）',
  'i-default': '不规则遗留标签（默认文档语言）',
  'i-enochian': '不规则遗留标签（Enochian，非真实语言）',
  'i-hak': '不规则遗留标签（Hakka Chinese）',
  'i-klingon': '不规则遗留标签（Klingon），推荐改用 tlh',
  'i-lux': '不规则遗留标签（Luxembourgish），推荐改用 lb',
  'i-mingo': '不规则遗留标签（Mingo）',
  'i-navajo': '不规则遗留标签（Navajo），推荐改用 nv',
  'i-pwn': '不规则遗留标签（Paiwan）',
  'i-tao': '不规则遗留标签（Tao）',
  'i-tay': '不规则遗留标签（Tayal）',
  'i-tsu': '不规则遗留标签（Tsou）',
  'sgn-BE-FR': '规则遗留标签（比利时法语手语）',
  'sgn-BE-NL': '规则遗留标签（比利时弗拉芒手语）',
  'sgn-CH-DE': '规则遗留标签（瑞士德语手语）',
  'art-lojban': '规则遗留标签（Lojban），推荐改用 jbo',
  'cel-gaulish': '规则遗留标签（Gaulish）',
  'no-bok': '规则遗留标签（书面挪威语），推荐改用 nb',
  'no-nyn': '规则遗留标签（新挪威语），推荐改用 nn',
  'zh-guoyu': '规则遗留标签（国语），推荐改用 cmn',
  'zh-hakka': '规则遗留标签（客家话），推荐改用 hak',
  'zh-min': '规则遗留标签（闽语）',
  'zh-min-nan': '规则遗留标签（闽南语），推荐改用 nan',
  'zh-xiang': '规则遗留标签（湘语）',
};

const ALPHA = /^[A-Za-z]+$/;
const ALPHANUM = /^[0-9A-Za-z]+$/;
const STARTS_DIGIT = /^[0-9]/;

/**
 * 解析 BCP 47 语言标签。
 *
 * @param input - 原始语言标签字符串
 * @returns 结构化解析结果；任何非法 / 边界输入都返回结果对象并附带诊断，不抛异常
 */
export function parseBcp47(input: string): Bcp47ParseResult {
  const raw = input ?? '';
  const trimmed = raw.trim();
  const diagnostics: BcpDiagnostic[] = [];
  const suggestions: string[] = [];

  const base: Bcp47ParseResult = {
    input: raw,
    grandfathered: null,
    language: null,
    extlang: null,
    script: null,
    region: null,
    variants: [],
    extensions: [],
    privateUse: [],
    diagnostics,
    canonical: '',
    suggestions,
  };

  if (!trimmed) {
    diagnostics.push({ level: 'error', message: '输入为空，请提供语言标签，例如 zh-Hans-CN。' });
    return base;
  }

  if (trimmed.length > 3567) {
    diagnostics.push({
      level: 'error',
      message: `标签长度 ${trimmed.length} 超出 RFC 5646 允许的上限（3567 字符）。`,
    });
    return base;
  }

  // 下划线分隔属于常见错误写法，给出明确提示并容错按连字符拆分
  let working = trimmed;
  if (working.includes('_')) {
    diagnostics.push({
      level: 'error',
      subtag: working,
      message: 'BCP 47 使用连字符 “-” 分隔子标签，下划线 “_” 非法（常见于 locale 文件名 en_US）。',
    });
    working = working.replace(/_/g, '-');
    suggestions.push('将下划线 “_” 替换为连字符 “-”（如 en_US → en-US）。');
  }

  if (!/^[0-9A-Za-z-]+$/.test(working)) {
    diagnostics.push({
      level: 'error',
      subtag: working,
      message: '标签包含非法字符，仅允许 ASCII 字母、数字与连字符 “-”。',
    });
  }

  // grandfathered 整体匹配（大小写不敏感）
  const lowerTag = working.toLowerCase();
  const grandfatheredKey = Object.keys(GRANDFATHERED_TAGS).find(
    (tag) => tag.toLowerCase() === lowerTag,
  );
  if (grandfatheredKey) {
    base.grandfathered = grandfatheredKey;
    diagnostics.push({
      level: 'warning',
      subtag: grandfatheredKey,
      message: GRANDFATHERED_TAGS[grandfatheredKey] ?? '遗留（grandfathered）标签。',
    });
    base.canonical = grandfatheredKey;
    return base;
  }

  const subtags = working.split('-').filter((part) => part.length > 0);
  if (subtags.length === 0 || working.includes('--')) {
    diagnostics.push({ level: 'error', message: '存在空的子标签段（连续连字符 “--”）。' });
    return base;
  }

  let index = 0;

  // 纯私有标签 x-...
  const firstSubtag = subtags[0];
  if (firstSubtag && firstSubtag.toLowerCase() === 'x') {
    const privateUse = subtags.slice(1).map((part) => part.toLowerCase());
    if (privateUse.length === 0) {
      diagnostics.push({ level: 'error', subtag: 'x', message: '私有使用标签 x- 后至少需要一个子标签。' });
    }
    base.privateUse = privateUse;
    base.canonical = ['x', ...privateUse].join('-');
    return base;
  }

  // language：2-3 字母，或 5-8 字母；4 字母保留给脚本
  const languageRaw = subtags[index];
  if (!languageRaw || !ALPHA.test(languageRaw)) {
    diagnostics.push({
      level: 'error',
      subtag: languageRaw,
      message: '主语言子标签必须全部由字母构成；纯数字（如 419）是区域子标签，不能作为标签开头。',
    });
    base.canonical = working;
    return base;
  }
  if (languageRaw.length < 2 || languageRaw.length === 4 || languageRaw.length > 8) {
    diagnostics.push({
      level: 'error',
      subtag: languageRaw,
      message: `主语言子标签长度应为 2-3 或 5-8 个字母，当前为 ${languageRaw.length} 个。`,
    });
  }
  const language = languageRaw.toLowerCase();
  if (languageRaw !== language) {
    suggestions.push(`主语言子标签推荐全小写：${languageRaw} → ${language}。`);
  }
  if (!(language in COMMON_LANGUAGES)) {
    diagnostics.push({
      level: 'warning',
      subtag: languageRaw,
      message: '主语言子标签不在内置常用语言表中，结构可解析但请自行核对 IANA 语言子标签注册表。',
    });
  }
  base.language = language;
  index += 1;

  // extlang：至多 1 个，恰好 3 字母，且紧跟 language
  const extlangRaw = subtags[index];
  if (extlangRaw && extlangRaw.length === 3 && ALPHA.test(extlangRaw)) {
    // 仅当后面仍可能出现 script/region 时才视为 extlang；3 字母也可能是变体之外的合法位置
    base.extlang = extlangRaw.toLowerCase();
    index += 1;
  }

  // script：恰好 4 字母
  const scriptRaw = subtags[index];
  if (scriptRaw && scriptRaw.length === 4 && ALPHA.test(scriptRaw)) {
    const raw = scriptRaw;
    const script = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    if (raw !== script) {
      suggestions.push(`脚本子标签推荐首字母大写：${raw} → ${script}。`);
    }
    if (!(script in COMMON_SCRIPTS)) {
      diagnostics.push({
        level: 'warning',
        subtag: raw,
        message: '脚本子标签不在内置常用脚本表中，请核对 IANA 脚本子标签注册表。',
      });
    }
    base.script = script;
    index += 1;
  }

  // region：2 字母 或 3 位数字
  if (index < subtags.length) {
    const raw = subtags[index];
    if (raw) {
      const isAlphaRegion = raw.length === 2 && ALPHA.test(raw);
      const isDigitRegion = raw.length === 3 && /^[0-9]{3}$/.test(raw);
      if (isAlphaRegion || isDigitRegion) {
        const region = isAlphaRegion ? raw.toUpperCase() : raw;
        if (raw !== region) {
          suggestions.push(`区域子标签推荐全大写：${raw} → ${region}。`);
        }
        if (!(region in COMMON_REGIONS)) {
          diagnostics.push({
            level: 'warning',
            subtag: raw,
            message: '区域子标签不在内置常用区域表中，请核对 ISO 3166 / UN M.49 代码。',
          });
        }
        base.region = region;
        index += 1;
      } else if (raw.length === 3 && /^[0-9A-Za-z]+$/.test(raw)) {
        diagnostics.push({
          level: 'error',
          subtag: raw,
          message: '区域子标签应为 2 个字母或 3 位数字，3 位字母数字组合不合法。',
        });
      }
    }
  }

  // variants / extensions / privateuse
  const seenSingletons = new Set<string>();
  let currentExtension: BcpExtension | null = null;

  const pushVariant = (raw: string) => {
    const valid =
      (raw.length >= 5 && raw.length <= 8 && ALPHANUM.test(raw)) ||
      (raw.length === 4 && STARTS_DIGIT.test(raw) && ALPHANUM.test(raw));
    if (!valid) {
      diagnostics.push({
        level: 'error',
        subtag: raw,
        message: '变体子标签应为 5-8 位字母数字，或以数字开头的 4 位字母数字。',
      });
    } else {
      diagnostics.push({
        level: 'warning',
        subtag: raw,
        message: '变体子标签结构合法；是否已注册请核对 IANA 变体子标签表（未注册仅告警）。',
      });
    }
    base.variants.push(raw);
  };

  while (index < subtags.length) {
    const token = subtags[index];
    if (!token) {
      break;
    }

    if (token.toLowerCase() === 'x') {
      base.privateUse = subtags.slice(index + 1).map((part) => part.toLowerCase());
      if (base.privateUse.length === 0) {
        diagnostics.push({ level: 'error', subtag: 'x', message: '私有使用标记 x- 后至少需要一个子标签。' });
      }
      index = subtags.length;
      break;
    }

    // 扩展前缀：单字母数字（x 已单独处理）
    if (token.length === 1 && ALPHANUM.test(token)) {
      const singleton = token.toLowerCase();
      if (seenSingletons.has(singleton)) {
        diagnostics.push({
          level: 'error',
          subtag: token,
          message: `扩展前缀 “${singleton}” 重复出现，每个单字母前缀在标签中只能出现一次。`,
        });
      }
      seenSingletons.add(singleton);
      currentExtension = { singleton, subtags: [] };
      base.extensions.push(currentExtension);
      index += 1;
      continue;
    }

    if (currentExtension) {
      currentExtension.subtags.push(token);
      index += 1;
      continue;
    }

    pushVariant(token);
    index += 1;
  }

  // 扩展内容校验与 u 扩展 keyword 拆分
  for (const extension of base.extensions) {
    if (extension.subtags.length === 0) {
      diagnostics.push({
        level: 'error',
        subtag: extension.singleton,
        message: `扩展 “${extension.singleton}-” 后至少需要一个内容子标签。`,
      });
    }
    if (extension.singleton === 'u') {
      parseUExtension(extension, diagnostics);
    }
  }

  base.canonical = buildCanonical(base);
  return base;
}

/**
 * 拆分 u（Unicode）扩展：首个 2 字母 keyword 之前的独立子标签为 attribute，
 * 每个 2 字母 key 与其后到下一 key 之间的子标签构成 keyword。
 */
function parseUExtension(extension: BcpExtension, diagnostics: BcpDiagnostic[]): void {
  const attributes: string[] = [];
  const keywords: { key: string; type: string[] }[] = [];
  let current: { key: string; type: string[] } | null = null;

  for (const sub of extension.subtags) {
    if (sub.length === 2 && ALPHA.test(sub)) {
      current = { key: sub.toLowerCase(), type: [] };
      keywords.push(current);
    } else if (current) {
      current.type.push(sub.toLowerCase());
    } else {
      // 出现在第一个 keyword 之前的独立子标签为 attribute
      attributes.push(sub.toLowerCase());
    }
  }

  for (const keyword of keywords) {
    if (keyword.type.length === 0) {
      diagnostics.push({
        level: 'warning',
        subtag: keyword.key,
        message: `u 扩展 keyword “${keyword.key}” 未提供取值（type），将按布尔型开关处理。`,
      });
    }
  }
  extension.attributes = attributes;
  extension.keywords = keywords;
}

/**
 * 依据解析结果按 BCP 47 推荐大小写重建规范化标签：
 * language 小写、script 首字母大写、region 大写、其余小写、扩展前缀小写。
 */
function buildCanonical(result: Bcp47ParseResult): string {
  if (result.grandfathered) {
    return result.grandfathered;
  }
  const parts: string[] = [];
  if (result.language) {
    parts.push(result.language);
    if (result.extlang) {
      parts.push(result.extlang);
    }
    if (result.script) {
      parts.push(result.script);
    }
    if (result.region) {
      parts.push(result.region);
    }
    parts.push(...result.variants.map((variant) => variant.toLowerCase()));
    for (const extension of result.extensions) {
      parts.push(extension.singleton, ...extension.subtags.map((sub) => sub.toLowerCase()));
    }
    if (result.privateUse.length > 0) {
      parts.push('x', ...result.privateUse);
    }
  } else if (result.privateUse.length > 0) {
    parts.push('x', ...result.privateUse);
  }
  return parts.join('-');
}

/**
 * 使用浏览器原生 Intl.Locale 对标签做交叉验证（仅在运行时支持时调用）。
 *
 * @param tag - 规范化后的标签
 * @returns 原生解析出的 language/script/region；不支持或解析失败时返回 null
 */
export function crossValidateWithIntl(
  tag: string,
): { language: string | undefined; script: string | undefined; region: string | undefined } | null {
  if (typeof Intl === 'undefined' || typeof Intl.Locale !== 'function') {
    return null;
  }
  try {
    const locale = new Intl.Locale(tag);
    return {
      language: locale.language,
      script: locale.script,
      region: locale.region,
    };
  } catch {
    return null;
  }
}
