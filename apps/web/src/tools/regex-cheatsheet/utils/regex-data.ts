/**
 * 正则表达式语法速查的静态数据集。
 * 每条记录都带有可由浏览器原生 RegExp 直接运行的 pattern 与
 * 匹配 / 不匹配样例，页面渲染时实时验证，避免文档与运行时行为脱节。
 */

/** 语法条目分类 */
export type RegexCategory =
  | 'character'
  | 'quantifier'
  | 'anchor'
  | 'group'
  | 'lookaround'
  | 'alternation'
  | 'flag'
  | 'unicode';

/** 单条语法参考条目 */
export interface RegexEntry {
  /** 稳定唯一标识 */
  id: string;
  category: RegexCategory;
  /** 语法形式，如 \d、{n,m} */
  syntax: string;
  /** 中文名称 */
  name: string;
  /** 关键字（供搜索，包含常见英文术语） */
  keywords: string[];
  /** 中文解释 */
  description: string;
  /** 可运行的示例正则（不含首尾 / 与标志） */
  pattern: string;
  /** 示例正则的标志位 */
  flags?: string;
  /** 应被命中的样例字符串 */
  matchSamples: string[];
  /** 不应被命中的样例字符串 */
  rejectSamples: string[];
}

export const CATEGORY_LABELS: Record<RegexCategory, string> = {
  character: '字符类与元字符',
  quantifier: '量词（贪婪 / 惰性）',
  anchor: '锚点与边界',
  group: '分组与引用',
  lookaround: '环视断言',
  alternation: '交替与转义',
  flag: '标志位',
  unicode: 'Unicode 属性转义',
};

/**
 * 语法条目（32 条，覆盖 8 个分类）。
 * pattern 均为 JavaScript RegExp 可直接构造的源码；
 * matchSamples / rejectSamples 在测试与页面中经原生 RegExp 实测。
 */
export const REGEX_ENTRIES: readonly RegexEntry[] = [
  // —— 字符类与元字符 ——
  {
    id: 'dot',
    category: 'character',
    syntax: '.',
    name: '任意字符',
    keywords: ['dot', '任意', '通配', 'wildcard'],
    description: '匹配除换行符（\\n、\\r、行分隔符等）之外的任意单个字符；在 s（dotAll）标志下也匹配换行。',
    pattern: 'a.c',
    matchSamples: ['abc', 'a c', 'a1c'],
    rejectSamples: ['ac', 'a\nc'],
  },
  {
    id: 'digit',
    category: 'character',
    syntax: '\\d',
    name: '数字字符',
    keywords: ['digit', '数字', '[0-9]'],
    description: '等价于 [0-9]，匹配一个 ASCII 数字；大写 \\D 为其反义（非数字）。注意 JS 不带 u 标志时 \\d 不匹配全角等 Unicode 数字。',
    pattern: '\\d+',
    matchSamples: ['123', 'a42b'],
    rejectSamples: ['abc', '１２'],
  },
  {
    id: 'word',
    category: 'character',
    syntax: '\\w',
    name: '单词字符',
    keywords: ['word', '单词', '字母数字下划线'],
    description: '等价于 [A-Za-z0-9_]，匹配字母、数字与下划线；大写 \\W 匹配非单词字符。',
    pattern: '\\w+',
    matchSamples: ['hello_world', 'a1'],
    rejectSamples: ['!@#', '中文'],
  },
  {
    id: 'space',
    category: 'character',
    syntax: '\\s',
    name: '空白字符',
    keywords: ['space', '空白', 'whitespace', 'tab'],
    description: '匹配空格、制表符 \\t、换行 \\n、回车 \\r、换页 \\f、垂直制表 \\v 等空白；大写 \\S 为其反义。',
    pattern: 'a\\sb',
    matchSamples: ['a b', 'a\tb'],
    rejectSamples: ['ab', 'a-b'],
  },
  {
    id: 'char-class',
    category: 'character',
    syntax: '[...]',
    name: '字符集合',
    keywords: ['character class', '字符类', '集合', '范围'],
    description: '匹配方括号内任意一个字符，可用连字符表示范围（[a-z]），^ 开头表示取反（[^0-9]）。',
    pattern: '[aeiou]',
    matchSamples: ['apple', 'echo'],
    rejectSamples: ['sky', 'xyz'],
  },
  {
    id: 'negated-class',
    category: 'character',
    syntax: '[^...]',
    name: '取反字符集合',
    keywords: ['negated', '取反', '排除'],
    description: '匹配任何不在方括号内的单个字符，包括换行符（这是 . 与取反类的重要区别）。',
    pattern: '^[^0-9]+$',
    matchSamples: ['abc', 'a-b'],
    rejectSamples: ['123', 'a1'],
  },
  // —— 量词 ——
  {
    id: 'star',
    category: 'quantifier',
    syntax: '*',
    name: '零次或多次',
    keywords: ['star', '任意次', 'greedy'],
    description: '前置元素重复 0 次或多次，默认贪婪，尽可能多地匹配。',
    pattern: 'ab*c',
    matchSamples: ['ac', 'abc', 'abbbc'],
    rejectSamples: ['axc'],
  },
  {
    id: 'plus',
    category: 'quantifier',
    syntax: '+',
    name: '一次或多次',
    keywords: ['plus', '至少一次'],
    description: '前置元素重复 1 次或多次，默认贪婪。',
    pattern: 'ab+c',
    matchSamples: ['abc', 'abbbc'],
    rejectSamples: ['ac'],
  },
  {
    id: 'optional',
    category: 'quantifier',
    syntax: '?',
    name: '零次或一次',
    keywords: ['optional', '可选'],
    description: '前置元素出现 0 次或 1 次；置于其他量词之后时则把该量词切换为惰性模式。',
    pattern: 'colou?r',
    matchSamples: ['color', 'colour'],
    rejectSamples: ['colouur'],
  },
  {
    id: 'range-quantifier',
    category: 'quantifier',
    syntax: '{n,m}',
    name: '重复区间',
    keywords: ['range', '区间', '次数'],
    description: '{n} 恰好 n 次；{n,} 至少 n 次；{n,m} n 到 m 次，均为贪婪匹配。',
    pattern: '\\d{2,4}',
    matchSamples: ['12', '1234'],
    rejectSamples: ['1', 'abc'],
  },
  {
    id: 'lazy',
    category: 'quantifier',
    syntax: '*? / +? / {n,m}?',
    name: '惰性量词',
    keywords: ['lazy', '惰性', '非贪婪', 'non-greedy'],
    description: '在量词后加 ? 切换为惰性，尽可能少地匹配，由后续表达式继续扩展。',
    pattern: '<.+?>',
    matchSamples: ['<a><b>'],
    rejectSamples: [],
    flags: 'g',
  },
  // —— 锚点与边界 ——
  {
    id: 'start',
    category: 'anchor',
    syntax: '^',
    name: '开头锚点',
    keywords: ['start', '开头', '行首'],
    description: '匹配输入（m 标志下为每一行）的开头位置，不消耗字符。',
    pattern: '^Hello',
    matchSamples: ['Hello world'],
    rejectSamples: ['Say Hello'],
  },
  {
    id: 'end',
    category: 'anchor',
    syntax: '$',
    name: '结尾锚点',
    keywords: ['end', '结尾', '行尾'],
    description: '匹配输入（m 标志下为每一行）的结尾位置，不消耗字符。',
    pattern: 'world$',
    matchSamples: ['Hello world'],
    rejectSamples: ['world cup'],
  },
  {
    id: 'word-boundary',
    category: 'anchor',
    syntax: '\\b',
    name: '单词边界',
    keywords: ['boundary', '边界', 'word boundary'],
    description: '匹配 \\w 与 \\W 之间（或字符串首尾）的零宽位置；\\B 为非单词边界。',
    pattern: '\\bcat\\b',
    matchSamples: ['the cat sat'],
    rejectSamples: ['concatenate'],
  },
  // —— 分组与引用 ——
  {
    id: 'capturing',
    category: 'group',
    syntax: '(...)',
    name: '捕获组',
    keywords: ['capture', '捕获组', 'group'],
    description: '把内部表达式编为一个整体并捕获匹配文本，可通过序号在反向引用或替换中使用。',
    pattern: '^(ab)+$',
    matchSamples: ['abab', 'ab'],
    rejectSamples: ['aba'],
  },
  {
    id: 'non-capturing',
    category: 'group',
    syntax: '(?:...)',
    name: '非捕获组',
    keywords: ['non-capture', '非捕获', '分组不捕获'],
    description: '仅做分组与量词作用域，不保存匹配结果，性能与序号管理上更优。',
    pattern: '(?:ab)+c',
    matchSamples: ['abc', 'ababc'],
    rejectSamples: ['ac'],
  },
  {
    id: 'named-group',
    category: 'group',
    syntax: '(?<name>...)',
    name: '命名捕获组',
    keywords: ['named group', '命名组', 'ES2018'],
    description: '为捕获组指定名称，匹配结果通过 groups.name 访问，避免依赖易变的数字序号（ES2018+）。',
    pattern: '(?<year>\\d{4})-(?<month>\\d{2})',
    matchSamples: ['2026-11'],
    rejectSamples: ['26-11'],
  },
  {
    id: 'backreference',
    category: 'group',
    syntax: '\\1 / \\k<name>',
    name: '反向引用',
    keywords: ['backreference', '反向引用', 'backref'],
    description: '在同一正则中引用之前捕获组匹配到的实际文本；命名组用 \\k<name>。',
    pattern: '(\\w+)\\s\\1',
    matchSamples: ['hello hello', 'ab ab'],
    rejectSamples: ['hello world'],
  },
  // —— 环视断言 ——
  {
    id: 'lookahead',
    category: 'lookaround',
    syntax: '(?=...)',
    name: '正向先行断言',
    keywords: ['lookahead', '正向先行', '前瞻', 'look'],
    description: '要求右侧匹配括号内表达式，但不消耗字符，常用于密码强度等多条件叠加。',
    pattern: '(?=.*[A-Z]).+',
    matchSamples: ['Abc123'],
    rejectSamples: ['abc123'],
  },
  {
    id: 'negative-lookahead',
    category: 'lookaround',
    syntax: '(?!...)',
    name: '负向先行断言',
    keywords: ['negative lookahead', '负向先行', 'look'],
    description: '要求右侧不匹配括号内表达式，零宽不消耗字符。',
    pattern: 'foo(?!bar)',
    matchSamples: ['foobaz'],
    rejectSamples: ['foobar'],
  },
  {
    id: 'lookbehind',
    category: 'lookaround',
    syntax: '(?<=...)',
    name: '正向后行断言',
    keywords: ['lookbehind', '后行断言', '后顾', 'look'],
    description: '要求左侧匹配括号内表达式（ES2018+，JS 支持；Python/Java 亦支持，部分老引擎不支持）。',
    pattern: '(?<=\\$)\\d+',
    matchSamples: ['$100'],
    rejectSamples: ['€100'],
  },
  {
    id: 'negative-lookbehind',
    category: 'lookaround',
    syntax: '(?<!...)',
    name: '负向后行断言',
    keywords: ['negative lookbehind', '负向后行', 'look'],
    description: '要求左侧不匹配括号内表达式，零宽不消耗字符（ES2018+）。',
    pattern: '(?<![$€\\d])\\d+',
    matchSamples: ['￥100', 'a100'],
    rejectSamples: ['$100', '€100'],
  },
  // —— 交替与转义 ——
  {
    id: 'alternation',
    category: 'alternation',
    syntax: '|',
    name: '交替（或）',
    keywords: ['alternation', '或', 'or', '分支'],
    description: '在多个分支中择一匹配，优先级最低，常需配合括号限定作用域，如 cat|dog 与 ca(t|d)og。',
    pattern: 'cat|dog',
    matchSamples: ['cat', 'dog'],
    rejectSamples: ['fish'],
  },
  {
    id: 'escape',
    category: 'alternation',
    syntax: '\\',
    name: '转义符',
    keywords: ['escape', '转义', '特殊字符'],
    description: '把 . * + ? ( ) [ ] { } ^ $ | \\ / 等特殊字符转义为字面量；也用于 \\d \\s 等预定义类。',
    pattern: 'a\\.b',
    matchSamples: ['a.b'],
    rejectSamples: ['axb'],
  },
  // —— 标志位 ——
  {
    id: 'flag-g',
    category: 'flag',
    syntax: 'g',
    name: '全局匹配',
    keywords: ['global', '全局', '标志', 'flag'],
    description: '查找所有匹配而非在第一个结果后停止；影响 matchAll、replace 与 lastIndex 迭代行为。',
    pattern: '\\d+',
    flags: 'g',
    matchSamples: ['a1b22c333'],
    rejectSamples: ['abc'],
  },
  {
    id: 'flag-i',
    category: 'flag',
    syntax: 'i',
    name: '忽略大小写',
    keywords: ['ignorecase', '忽略大小写', '标志', 'flag'],
    description: '匹配时不区分 ASCII 字母大小写（带 u 标志时遵循 Unicode 大小写折叠）。',
    pattern: 'hello',
    flags: 'i',
    matchSamples: ['HELLO', 'Hello'],
    rejectSamples: ['hola'],
  },
  {
    id: 'flag-m',
    category: 'flag',
    syntax: 'm',
    name: '多行模式',
    keywords: ['multiline', '多行', '标志', 'flag'],
    description: '让 ^ 与 $ 匹配每一行的首尾，而不仅是整个字符串的首尾。',
    pattern: '^end$',
    flags: 'm',
    matchSamples: ['start\nend'],
    rejectSamples: ['start\nending'],
  },
  {
    id: 'flag-s',
    category: 'flag',
    syntax: 's',
    name: 'dotAll 模式',
    keywords: ['dotall', '点通配', '标志', 'flag'],
    description: '让 . 也匹配换行符（ES2018+）；旧引擎可用 [\\s\\S] 变通。',
    pattern: 'a.c',
    flags: 's',
    matchSamples: ['a\nc'],
    rejectSamples: ['ac'],
  },
  {
    id: 'flag-u',
    category: 'flag',
    syntax: 'u',
    name: 'Unicode 模式',
    keywords: ['unicode', 'unicode 模式', '标志', 'flag'],
    description: '启用完整 Unicode 解析，支持 \\p{...} 属性转义、码点转义 \\u{1F600}，并让 \\u 严格按 4 位十六进制解析。',
    pattern: '\\u{1F600}',
    flags: 'u',
    matchSamples: ['😀'],
    rejectSamples: ['abc'],
  },
  {
    id: 'flag-y',
    category: 'flag',
    syntax: 'y',
    name: '粘性匹配',
    keywords: ['sticky', '粘性', '标志', 'flag'],
    description: '仅从 lastIndex 指定位置匹配，匹配成功后自动推进 lastIndex，适合分词器 / 词法分析。',
    pattern: '\\d+',
    flags: 'y',
    matchSamples: ['123abc'],
    rejectSamples: ['a123', ' abc'],
  },
  // —— Unicode 属性转义 ——
  {
    id: 'unicode-script',
    category: 'unicode',
    syntax: '\\p{Script=...}',
    name: '文字系统属性',
    keywords: ['unicode property', '属性转义', 'script', '文字'],
    description: '按 Unicode 文字系统匹配，如 \\p{Script=Han} 匹配汉字；需 u 标志，大写 \\P 为反义。',
    pattern: '\\p{Script=Han}+',
    flags: 'u',
    matchSamples: ['正则表达式'],
    rejectSamples: ['regexp'],
  },
  {
    id: 'unicode-general',
    category: 'unicode',
    syntax: '\\p{...}',
    name: '通用类别属性',
    keywords: ['general category', '通用类别', '属性转义', 'emoji'],
    description: '按通用类别匹配，如 \\p{Number} 任意数字、\\p{Emoji} 表情，覆盖 ASCII 之外的字符；需 u 标志。',
    pattern: '\\p{Emoji}',
    flags: 'u',
    matchSamples: ['😀', '✅'],
    rejectSamples: ['a'],
  },
];

/** 语言 / 引擎差异说明（仅文档，不做多语言执行） */
export interface EngineDifference {
  topic: string;
  javascript: string;
  others: string;
}

export const ENGINE_DIFFERENCES: readonly EngineDifference[] = [
  {
    topic: '\\d 的 Unicode 范围',
    javascript: '不带 u 标志时 \\d 仅等于 [0-9]，不匹配全角数字 １２３ 等 Unicode 数字',
    others: 'Python 3 / .NET 的 \\d 默认匹配 Unicode 数字；PCRE 需显式开启 PCRE_UCP',
  },
  {
    topic: '后行断言 lookbehind',
    javascript: 'ES2018 起支持 (?<=...) 与 (?<!...)，旧版浏览器 / Safari 早期版本不支持',
    others: 'Python、Java、.NET、PCRE 早已支持；Go 标准库 regexp 至今不支持 lookaround',
  },
  {
    topic: '命名捕获组语法',
    javascript: '使用 (?<name>...) 捕获、\\k<name> 反向引用（ES2018）',
    others: 'Python 为 (?P<name>...) 与 (?P=name)；Java/PCRE 同时支持 (?<name>...) 与 \\k<name>',
  },
  {
    topic: 's（dotAll）标志',
    javascript: 'ES2018 引入；替代写法 [\\s\\S] 在所有版本可用',
    others: 'Python 用 re.DOTALL / re.S；Java 的 Pattern.DOTALL；PCRE 用 s 修饰符',
  },
  {
    topic: 'Unicode 属性转义 \\p{...}',
    javascript: '需要 u 标志，支持 Script、General_Category、Emoji 等属性',
    others: 'Java 7+、.NET、PCRE2(+u) 支持；Python 标准 re 不支持，需改用第三方 regex 库',
  },
];
