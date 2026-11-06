/**
 * BCP 47（RFC 5646）语言标签解析核心逻辑：
 * 独立于 DOM / React 的纯函数解析器，依据 ABNF 语法与内置静态子标签表
 * 产出结构化结果与可解释的错误 / 警告，不发起任何网络请求。
 */

/** 诊断级别：error 表示标签不合法，warning 表示语法合法但存在可疑点 */
export type DiagnosticLevel = 'error' | 'warning';

/** 单条诊断信息 */
export interface BcpDiagnostic {
  level: DiagnosticLevel;
  /** 面向用户的中文说明 */
  message: string;
}

/** 扩展子标签（单字母前缀 + 后续内容序列） */
export interface BcpExtension {
  /** 单字母前缀（如 u、t），小写 */
  singleton: string;
  /** 前缀之后的全部子标签（保持原始大小写） */
  tokens: string[];
}

/** u 扩展解析出的 keyword（键 + 值序列） */
export interface BcpUnicodeKeyword {
  key: string;
  values: string[];
}

/** u 扩展的结构化解析结果 */
export interface BcpUnicodeExtension {
  attributes: string[];
  keywords: BcpUnicodeKeyword[];
}

/** 解析结果 */
export interface BcpParseResult {
  /** 是否为语法合法的 BCP 47 标签（无 error 级别诊断） */
  valid: boolean;
  /** 规范化后的标签（语言小写、脚本首字母大写、区域大写、其余小写） */
  canonical: string;
  language: string | null;
  extlangs: string[];
  script: string | null;
  region: string | null;
  variants: string[];
  extensions: BcpExtension[];
  privateUse: string[];
  /** 命中的不规则 / 常规遗留标签（grandfathered），原样返回 */
  grandfathered: string | null;
  /** u 扩展结构化结果；不存在时为 null */
  unicodeExtension: BcpUnicodeExtension | null;
  diagnostics: BcpDiagnostic[];
}

/**
 * RFC 5646 §2.2.8 登记的 grandfathered 标签（全部小写形式索引）。
 * irregular 与 regular 合并，命中即整体识别、不再拆分。
 */
const GRANDFATHERED_TAGS = new Set<string>([
  'en-gb-oed',
  'i-ami',
  'i-bnn',
  'i-default',
  'i-enochian',
  'i-hak',
  'i-klingon',
  'i-lux',
  'i-mingo',
  'i-navajo',
  'i-pwn',
  'i-tao',
  'i-tay',
  'i-tsu',
  'sgn-be-fr',
  'sgn-be-nl',
  'sgn-ch-de',
  'art-lojban',
  'cel-gaulish',
  'no-bok',
  'no-nyn',
  'zh-guoyu',
  'zh-hakka',
  'zh-min',
  'zh-min-nan',
  'zh-xiang',
]);

/** 常用主语言子标签（ISO 639-1 / 639-2 高频子集，小写） */
const COMMON_LANGUAGES = new Set<string>([
  'aa', 'ab', 'af', 'ak', 'am', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  'va', 've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
  // 常见 3 字母语言代码
  'afh', 'ain', 'arg', 'ast', 'ava', 'awa',
  'bal', 'bho', 'bis', 'bla', 'bre',
  'cos', 'cre',
  'dan',
  'epo',
  'fin', 'fiu', 'fre',
  'ger', 'gsw',
  'haw', 'hin',
  'ice', 'ing',
  'jav',
  'kor', 'kur',
  'lat', 'lav', 'lit',
  'mac', 'may', 'mon',
  'nbl', 'nep', 'nso',
  'oji',
  'pan', 'per', 'pol', 'por', 'pus',
  'san', 'scc', 'scr', 'sin', 'slo', 'slv', 'spa', 'swe',
  'tib', 'tsn', 'tso', 'tuk', 'tur',
  'urd',
  'wel', 'wln',
  'yid',
]);

/** 常用文字子标签（ISO 15924 高频子集，首字母大写） */
const COMMON_SCRIPTS = new Set<string>([
  'Arab', 'Armn', 'Beng', 'Bopo', 'Brai', 'Cyrl', 'Deva', 'Ethi', 'Geor',
  'Grek', 'Gujr', 'Guru', 'Hanb', 'Hang', 'Hani', 'Hans', 'Hant', 'Hebr',
  'Hira', 'Hrkt', 'Jpan', 'Kana', 'Khmr', 'Knda', 'Kore', 'Laoo', 'Latn',
  'Mlym', 'Mong', 'Mymr', 'Orya', 'Sinh', 'Syrc', 'Taml', 'Telu', 'Tfng',
  'Thaa', 'Thai', 'Tibt', 'Yiii', 'Zyyy', 'Zzzz',
]);

/** 常用区域子标签（ISO 3166-1 alpha-2 高频子集，大写） */
const COMMON_REGIONS = new Set<string>([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR',
  'BS', 'BT', 'BW', 'BY', 'BZ',
  'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU',
  'CV', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GH', 'GL', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IN', 'IQ', 'IR', 'IS', 'IT',
  'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KM', 'KN', 'KP', 'KR', 'KW', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MR', 'MT',
  'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NZ',
  'OM',
  'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY',
  'QA',
  'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO',
  'SR', 'SS', 'ST', 'SV', 'SY', 'SZ',
  'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TW', 'TZ',
  'UA', 'UG', 'US', 'UY', 'UZ',
  'VC', 'VE', 'VN', 'VU',
  'WS',
  'YE',
  'ZA', 'ZM', 'ZW',
]);

/** 合法子标签字符：字母或数字（RFC 5646 仅允许 ASCII 字母数字与连字符） */
const SUBTAG_PATTERN = /^[A-Za-z0-9]+$/;

/** 仅字母 */
const ALPHA_PATTERN = /^[A-Za-z]+$/;

/** 仅数字 */
const DIGIT_PATTERN = /^\d+$/;

/**
 * 把输入归一化为子标签数组：拒绝非法字符与空标签，返回 null 表示无法解析。
 *
 * @param input - 原始标签字符串
 * @returns 子标签数组或 null（含错误诊断）
 */
function splitSubtags(input: string): { subtags: string[] } | { error: string } {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { error: '请输入语言标签' };
  }
  if (trimmed.includes('_')) {
    return { error: 'BCP 47 使用连字符「-」分隔子标签，下划线「_」不合法（如应写 zh-Hans-CN 而非 zh_Hans_CN）' };
  }
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { error: '标签不能以连字符开头或结尾' };
  }
  if (trimmed.includes('--')) {
    return { error: '标签中不允许出现连续连字符「--」' };
  }
  const subtags = trimmed.split('-');
  if (subtags.some((part) => part === '')) {
    return { error: '存在空的子标签段' };
  }
  if (subtags.some((part) => !SUBTAG_PATTERN.test(part))) {
    return { error: '子标签只能包含 ASCII 字母与数字，不能出现空格、标点或非 ASCII 字符' };
  }
  if (trimmed.length > 35) {
    return { error: `标签总长度 ${trimmed.length} 超过 RFC 5646 规定的 35 字符上限` };
  }
  return { subtags };
}

/**
 * 解析 u（Unicode）扩展：属性（2–3 字母 token）与 keyword（2 字母键 + 取值序列）。
 *
 * @param tokens - u 前缀之后的子标签
 * @returns 结构化 u 扩展
 */
export function parseUnicodeExtension(tokens: string[]): BcpUnicodeExtension {
  const attributes: string[] = [];
  const keywords: BcpUnicodeKeyword[] = [];
  let current: BcpUnicodeKeyword | null = null;

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (current === null && lower.length >= 2 && lower.length <= 3 && ALPHA_PATTERN.test(token)) {
      // keyword 键固定 2 字母；2–3 字母且尚无键时视为 attribute
      if (lower.length === 2) {
        current = { key: lower, values: [] };
      } else {
        attributes.push(lower);
      }
      return;
    }
    if (lower.length === 2 && ALPHA_PATTERN.test(token)) {
      if (current) {
        keywords.push(current);
      }
      current = { key: lower, values: [] };
      return;
    }
    if (current) {
      current.values.push(lower);
    } else {
      attributes.push(lower);
    }
  });
  if (current) {
    keywords.push(current);
  }
  return { attributes, keywords };
}

/**
 * 解析 BCP 47 语言标签。
 *
 * @param input - 原始标签字符串
 * @returns 结构化解析结果（永不抛异常，错误通过 diagnostics 表达）
 */
export function parseBcp47Tag(input: string): BcpParseResult {
  const split = splitSubtags(input);
  if ('error' in split) {
    return {
      valid: false,
      canonical: '',
      language: null,
      extlangs: [],
      script: null,
      region: null,
      variants: [],
      extensions: [],
      privateUse: [],
      grandfathered: null,
      unicodeExtension: null,
      diagnostics: [{ level: 'error', message: split.error }],
    };
  }

  const subtags = split.subtags;
  const diagnostics: BcpDiagnostic[] = [];
  const lowerInput = subtags.map((part) => part.toLowerCase()).join('-');

  // grandfathered：整体识别，不再按常规语法拆分
  if (GRANDFATHERED_TAGS.has(lowerInput)) {
    return {
      valid: true,
      canonical: lowerInput,
      language: null,
      extlangs: [],
      script: null,
      region: null,
      variants: [],
      extensions: [],
      privateUse: [],
      grandfathered: lowerInput,
      unicodeExtension: null,
      diagnostics: [
        {
          level: 'warning',
          message: '这是 RFC 5646 登记的 grandfathered（遗留）标签，建议优先使用其首选现代写法（如 i-klingon → tlh）',
        },
      ],
    };
  }

  let index = 0;

  // 私有使用标签：x- 开头，整体作为 privateuse
  if (subtags[0]!.toLowerCase() === 'x') {
    if (subtags.length < 2) {
      diagnostics.push({ level: 'error', message: '私有使用标签 x- 之后至少需要一个 1–8 字符的子标签' });
    }
    const privateUse = subtags.slice(1).map((part) => part.toLowerCase());
    if (privateUse.some((part) => part.length > 8)) {
      diagnostics.push({ level: 'error', message: '私有使用子标签长度必须在 1–8 字符之间' });
    }
    return {
      valid: !diagnostics.some((item) => item.level === 'error'),
      canonical: ['x', ...privateUse].join('-'),
      language: null,
      extlangs: [],
      script: null,
      region: null,
      variants: [],
      extensions: [],
      privateUse,
      grandfathered: null,
      unicodeExtension: null,
      diagnostics,
    };
  }

  // language：2–3 字母主语言，或 4 字母保留语、5–8 字母未注册语言
  const first = subtags[index]!;
  let language: string | null = null;
  const extlangs: string[] = [];
  if (!ALPHA_PATTERN.test(first) || first.length < 2 || first.length > 8) {
    diagnostics.push({
      level: 'error',
      message: `首个子标签「${first}」不是合法的 language 子标签（应为 2–3 字母主语言，或 4–8 字母保留 / 未注册语言）`,
    });
  } else {
    language = first.toLowerCase();
    if (language.length === 2 || language.length === 3) {
      if (!COMMON_LANGUAGES.has(language)) {
        diagnostics.push({
          level: 'warning',
          message: `语言子标签「${language}」不在内置常用语言表中，请确认其 ISO 639 登记拼写`,
        });
      }
    } else {
      diagnostics.push({
        level: 'warning',
        message: `语言子标签「${language}」长度为 ${language.length} 字母，属于保留或未注册语言区间，请确认登记状态`,
      });
    }
    index += 1;

    // extlang：仅 2–3 字母主语言后允许，最多 3 个 3 字母子标签
    while (index < subtags.length && subtags[index]!.length === 3 && ALPHA_PATTERN.test(subtags[index]!) && extlangs.length < 3) {
      const candidate = subtags[index]!.toLowerCase();
      // 与后续 script(4)/region(2)/单字母扩展区分：3 字母且当前仍处于语言段才纳入
      if (extlangs.length === 0 && language.length !== 2 && language.length !== 3) {
        break;
      }
      extlangs.push(candidate);
      index += 1;
    }
    if (extlangs.length > 0 && !COMMON_LANGUAGES.has(language)) {
      diagnostics.push({
        level: 'warning',
        message: 'extlang 子标签仅在极少数登记语言中使用，现代 BCP 47 通常直接使用对应 3 字母语言代码',
      });
    }
  }

  // script：恰好 4 字母
  let script: string | null = null;
  if (index < subtags.length && ALPHA_PATTERN.test(subtags[index]!) && subtags[index]!.length === 4) {
    const raw = subtags[index]!;
    script = `${raw[0]!.toUpperCase()}${raw.slice(1).toLowerCase()}`;
    if (!COMMON_SCRIPTS.has(script)) {
      diagnostics.push({
        level: 'warning',
        message: `文字子标签「${script}」不在内置常用 ISO 15924 表中，请确认登记拼写`,
      });
    }
    index += 1;
  }

  // region：2 字母或 3 位数字
  let region: string | null = null;
  if (index < subtags.length) {
    const raw = subtags[index]!;
    const isAlpha2 = ALPHA_PATTERN.test(raw) && raw.length === 2;
    const isDigit3 = DIGIT_PATTERN.test(raw) && raw.length === 3;
    if (isAlpha2 || isDigit3) {
      region = isAlpha2 ? raw.toUpperCase() : raw;
      if (isAlpha2 && !COMMON_REGIONS.has(region)) {
        diagnostics.push({
          level: 'warning',
          message: `区域子标签「${region}」不在内置常用 ISO 3166 表中，请确认登记拼写`,
        });
      }
      if (isDigit3 && !(Number(region) >= 1 && Number(region) <= 899)) {
        diagnostics.push({
          level: 'warning',
          message: `数字区域代码「${region}」超出 UN M.49 常用分配区间（001–899）`,
        });
      }
      index += 1;
    }
  }

  const variants: string[] = [];
  const extensions: BcpExtension[] = [];
  const privateUse: string[] = [];
  const seenSingletons = new Set<string>();
  let inPrivate = false;

  while (index < subtags.length) {
    const raw = subtags[index]!;
    const lower = raw.toLowerCase();

    if (inPrivate) {
      if (raw.length > 8) {
        diagnostics.push({ level: 'error', message: `私有使用子标签「${raw}」长度超过 8 字符上限` });
      }
      privateUse.push(lower);
      index += 1;
      continue;
    }

    if (lower === 'x') {
      inPrivate = true;
      index += 1;
      continue;
    }

    // 扩展前缀：单字母或单数字
    if (raw.length === 1 && SUBTAG_PATTERN.test(raw)) {
      if (seenSingletons.has(lower)) {
        diagnostics.push({ level: 'error', message: `扩展前缀「${lower}」重复出现，每个单字母前缀在标签中只能使用一次` });
      }
      seenSingletons.add(lower);
      const tokens: string[] = [];
      index += 1;
      while (index < subtags.length && subtags[index]!.length > 1) {
        tokens.push(subtags[index]!.toLowerCase());
        index += 1;
      }
      if (tokens.length === 0) {
        diagnostics.push({ level: 'error', message: `扩展前缀「${lower}」之后缺少至少一个 2–8 字符的子标签` });
      }
      if (tokens.some((token) => token.length > 8)) {
        diagnostics.push({ level: 'error', message: `扩展「${lower}」中存在超过 8 字符的子标签` });
      }
      extensions.push({ singleton: lower, tokens });
      continue;
    }

    // variant：4–8 字母数字，或以数字开头的 4 字符
    const isVariant =
      (SUBTAG_PATTERN.test(raw) && raw.length >= 4 && raw.length <= 8) ||
      (DIGIT_PATTERN.test(raw[0]!) && raw.length === 4);
    if (isVariant) {
      if (variants.includes(lower)) {
        diagnostics.push({ level: 'error', message: `变体子标签「${lower}」重复出现` });
      }
      variants.push(lower);
      index += 1;
      continue;
    }

    diagnostics.push({
      level: 'error',
      message: `子标签「${raw}」出现在非法位置或长度不符合 BCP 47 语法（期望 variant 5–8 字符、单字母扩展前缀或 x 私有段）`,
    });
    index += 1;
  }

  // 组装规范化标签
  const canonicalParts: string[] = [];
  if (language) {
    canonicalParts.push(language);
    canonicalParts.push(...extlangs);
  }
  if (script) {
    canonicalParts.push(script);
  }
  if (region) {
    canonicalParts.push(region);
  }
  canonicalParts.push(...variants);
  extensions.forEach((ext) => {
    canonicalParts.push(ext.singleton, ...ext.tokens);
  });
  if (privateUse.length > 0) {
    canonicalParts.push('x', ...privateUse);
  }

  const unicodeExt = extensions.find((ext) => ext.singleton === 'u') ?? null;
  const unicodeExtension = unicodeExt ? parseUnicodeExtension(unicodeExt.tokens) : null;
  if (unicodeExtension && unicodeExtension.keywords.length === 0 && unicodeExtension.attributes.length === 0) {
    diagnostics.push({ level: 'warning', message: 'u 扩展没有携带任何 attribute 或 keyword' });
  }

  return {
    valid: !diagnostics.some((item) => item.level === 'error'),
    canonical: canonicalParts.join('-'),
    language,
    extlangs,
    script,
    region,
    variants,
    extensions,
    privateUse,
    grandfathered: null,
    unicodeExtension,
    diagnostics,
  };
}

/**
 * 生成 BCP 47 推荐大小写写法说明（语言小写、脚本首字母大写、区域大写）。
 *
 * @param result - 解析结果
 * @returns 规范化建议文本；无有效内容时返回空字符串
 */
export function describeCanonicalCasing(result: BcpParseResult): string {
  if (!result.canonical) {
    return '';
  }
  return '推荐写法：language 全小写、script 首字母大写（如 Hans）、region 全大写（如 CN），其余子标签小写';
}
