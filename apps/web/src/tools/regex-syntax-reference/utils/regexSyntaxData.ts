/**
 * JavaScript 风格正则表达式语法参考的结构化静态数据。
 *
 * 每个条目的 pattern / flags 都可直接交给原生 RegExp 运行，
 * matchExamples 应为命中样例、notMatchExamples 应为不命中样例；
 * 组件与单测会用原生 RegExp 实测，保证文档与运行时行为一致。
 */

/** 语法分类标识 */
export type RegexCategoryId =
  | 'character-class'
  | 'quantifier'
  | 'anchor'
  | 'group'
  | 'assertion'
  | 'alternation-escape'
  | 'flag'
  | 'unicode-property';

/** 分类元信息 */
export interface RegexCategory {
  id: RegexCategoryId;
  /** 中文分类名 */
  label: string;
  /** 英文分类名 */
  labelEn: string;
  /** 分类说明 */
  description: string;
}

/** 单条语法参考条目 */
export interface RegexSyntaxEntry {
  /** 唯一 id */
  id: string;
  /** 所属分类 */
  category: RegexCategoryId;
  /** 语法符号，如 \\d、^、(?=...) */
  syntax: string;
  /** 名称 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 含义解释 */
  explanation: string;
  /** 可运行的正则 pattern（不含外层 / /） */
  pattern: string;
  /** 运行标志位 */
  flags: string;
  /** 应命中的样例字符串 */
  matchExamples: string[];
  /** 不应命中的样例字符串 */
  notMatchExamples: string[];
  /** 检索关键字（补充名称/语法之外的词） */
  keywords: string[];
}

/** 8 个语法分类 */
export const REGEX_CATEGORIES: RegexCategory[] = [
  {
    id: 'character-class',
    label: '字符类',
    labelEn: 'Character Classes',
    description: '匹配某一类字符，大写形式通常是对应小写类的反义。',
  },
  {
    id: 'quantifier',
    label: '量词',
    labelEn: 'Quantifiers',
    description: '限定前一元素出现的次数，默认贪婪，加 ? 转为惰性。',
  },
  {
    id: 'anchor',
    label: '锚点与边界',
    labelEn: 'Anchors & Boundaries',
    description: '不消耗字符，只断言位置（行首、行尾、单词边界等）。',
  },
  {
    id: 'group',
    label: '分组与引用',
    labelEn: 'Groups & References',
    description: '捕获或非捕获地组合子表达式，并可反向引用已捕获内容。',
  },
  {
    id: 'assertion',
    label: '环视断言',
    labelEn: 'Lookaround Assertions',
    description: '前瞻或后顾某模式是否出现，断言本身不消耗字符。',
  },
  {
    id: 'alternation-escape',
    label: '交替与转义',
    labelEn: 'Alternation & Escapes',
    description: '多分支选择、特殊字符转义与字面量匹配。',
  },
  {
    id: 'flag',
    label: '标志位',
    labelEn: 'Flags',
    description: '修饰整个正则的匹配行为，写在闭合斜杠之后。',
  },
  {
    id: 'unicode-property',
    label: 'Unicode 属性转义',
    labelEn: 'Unicode Property Escapes',
    description: '在 u 标志下按 Unicode 通用类别、脚本或属性匹配字符。',
  },
];

/** 语法条目（40 条，覆盖 8 个分类） */
export const REGEX_ENTRIES: RegexSyntaxEntry[] = [
  // ---- 字符类 ----
  {
    id: 'dot',
    category: 'character-class',
    syntax: '.',
    name: '任意字符',
    nameEn: 'Any character',
    explanation: '匹配除行终止符之外的任意单个字符；s 标志下也匹配换行符。',
    pattern: 'a.c',
    flags: '',
    matchExamples: ['abc', 'a c', 'a1c'],
    notMatchExamples: ['ac', 'abbc'],
    keywords: ['dot', '通配', '点'],
  },
  {
    id: 'digit',
    category: 'character-class',
    syntax: '\\d',
    name: '数字字符',
    nameEn: 'Digit',
    explanation: '等价于 [0-9]；u 标志下默认仍为 ASCII 数字，匹配 Unicode 数字需用 \\p{N}。',
    pattern: '\\d+',
    flags: '',
    matchExamples: ['123', 'a42b'],
    notMatchExamples: ['abc', '十二'],
    keywords: ['digit', '数字'],
  },
  {
    id: 'not-digit',
    category: 'character-class',
    syntax: '\\D',
    name: '非数字字符',
    nameEn: 'Non-digit',
    explanation: '\\d 的反义，匹配任意非数字字符。',
    pattern: '\\D+',
    flags: '',
    matchExamples: ['abc', 'a-b'],
    notMatchExamples: ['123'],
    keywords: ['non-digit', '非数字'],
  },
  {
    id: 'word',
    category: 'character-class',
    syntax: '\\w',
    name: '单词字符',
    nameEn: 'Word character',
    explanation: '等价于 [A-Za-z0-9_]，注意下划线也算单词字符。',
    pattern: '\\w+',
    flags: '',
    matchExamples: ['hello_1', 'ABC'],
    notMatchExamples: ['!!!', '你好'],
    keywords: ['word', '单词'],
  },
  {
    id: 'not-word',
    category: 'character-class',
    syntax: '\\W',
    name: '非单词字符',
    nameEn: 'Non-word character',
    explanation: '\\w 的反义，匹配字母数字下划线之外的字符。',
    pattern: '\\W',
    flags: '',
    matchExamples: ['!', ' '],
    notMatchExamples: ['a', '9', '_'],
    keywords: ['non-word', '非单词'],
  },
  {
    id: 'space',
    category: 'character-class',
    syntax: '\\s',
    name: '空白字符',
    nameEn: 'Whitespace',
    explanation: '匹配空格、制表符 \\t、换行 \\n、回车 \\r、换页 \\f 等空白。',
    pattern: 'a\\sb',
    flags: '',
    matchExamples: ['a b', 'a\tb'],
    notMatchExamples: ['ab', 'a-b'],
    keywords: ['space', 'whitespace', '空白'],
  },
  {
    id: 'not-space',
    category: 'character-class',
    syntax: '\\S',
    name: '非空白字符',
    nameEn: 'Non-whitespace',
    explanation: '\\s 的反义，匹配任意非空白字符。',
    pattern: '\\S+',
    flags: '',
    matchExamples: ['abc', 'a1'],
    notMatchExamples: ['   ', '\t\n'],
    keywords: ['non-space', '非空白'],
  },
  {
    id: 'custom-class',
    category: 'character-class',
    syntax: '[...]',
    name: '自定义字符类',
    nameEn: 'Character set',
    explanation: '匹配方括号内任意一个字符；^ 开头表示取反，- 表示范围。',
    pattern: '[aeiou]',
    flags: '',
    matchExamples: ['apple', 'echo'],
    notMatchExamples: ['sky', 'rhythm'],
    keywords: ['bracket', 'set', '字符集', '方括号'],
  },
  {
    id: 'negated-class',
    category: 'character-class',
    syntax: '[^...]',
    name: '取反字符类',
    nameEn: 'Negated character set',
    explanation: '匹配任何不在方括号内的字符。',
    pattern: '[^0-9]+',
    flags: '',
    matchExamples: ['abc', 'a!b'],
    notMatchExamples: ['123'],
    keywords: ['negated', '取反'],
  },

  // ---- 量词 ----
  {
    id: 'star',
    category: 'quantifier',
    syntax: '*',
    name: '零次或多次',
    nameEn: 'Zero or more',
    explanation: '前一元素可出现 0 次或多次，默认贪婪。',
    pattern: 'ab*c',
    flags: '',
    matchExamples: ['ac', 'abc', 'abbbc'],
    notMatchExamples: ['aXc'],
    keywords: ['star', 'asterisk'],
  },
  {
    id: 'plus',
    category: 'quantifier',
    syntax: '+',
    name: '一次或多次',
    nameEn: 'One or more',
    explanation: '前一元素至少出现 1 次，默认贪婪。',
    pattern: 'ab+c',
    flags: '',
    matchExamples: ['abc', 'abbbc'],
    notMatchExamples: ['ac'],
    keywords: ['plus'],
  },
  {
    id: 'optional',
    category: 'quantifier',
    syntax: '?',
    name: '零次或一次',
    nameEn: 'Optional',
    explanation: '前一元素可选，出现 0 次或 1 次。',
    pattern: 'colou?r',
    flags: '',
    matchExamples: ['color', 'colour'],
    notMatchExamples: ['colouur'],
    keywords: ['optional', '可选'],
  },
  {
    id: 'exact-count',
    category: 'quantifier',
    syntax: '{n}',
    name: '恰好 n 次',
    nameEn: 'Exactly n times',
    explanation: '前一元素恰好出现 n 次。',
    pattern: '\\d{3}',
    flags: '',
    matchExamples: ['123', 'abc456'],
    notMatchExamples: ['12', 'ab'],
    keywords: ['count', '次数'],
  },
  {
    id: 'range-count',
    category: 'quantifier',
    syntax: '{n,m}',
    name: 'n 到 m 次',
    nameEn: 'Between n and m times',
    explanation: '前一元素出现 n 到 m 次（含边界），默认贪婪。',
    pattern: 'a{2,4}',
    flags: '',
    matchExamples: ['aa', 'aaa', 'aaaa'],
    notMatchExamples: ['a', 'b'],
    keywords: ['range', '范围'],
  },
  {
    id: 'at-least',
    category: 'quantifier',
    syntax: '{n,}',
    name: '至少 n 次',
    nameEn: 'At least n times',
    explanation: '前一元素出现 n 次或更多。',
    pattern: 'a{2,}',
    flags: '',
    matchExamples: ['aa', 'aaaaaa'],
    notMatchExamples: ['a'],
    keywords: ['at-least', '至少'],
  },
  {
    id: 'lazy',
    category: 'quantifier',
    syntax: '*? / +? / ??',
    name: '惰性量词',
    nameEn: 'Lazy quantifier',
    explanation: '在量词后加 ? 改为惰性，尽可能少匹配而非尽可能多。',
    pattern: '<.+?>',
    flags: '',
    matchExamples: ['<a><b>'],
    notMatchExamples: ['plain text'],
    keywords: ['lazy', 'non-greedy', '惰性', '非贪婪'],
  },

  // ---- 锚点 ----
  {
    id: 'start',
    category: 'anchor',
    syntax: '^',
    name: '行首',
    nameEn: 'Start of line',
    explanation: '断言位于字符串开头；m 标志下匹配每一行行首。',
    pattern: '^Hello',
    flags: '',
    matchExamples: ['Hello world'],
    notMatchExamples: ['Say Hello'],
    keywords: ['start', '开头', '行首'],
  },
  {
    id: 'end',
    category: 'anchor',
    syntax: '$',
    name: '行尾',
    nameEn: 'End of line',
    explanation: '断言位于字符串结尾；m 标志下匹配每一行行尾。',
    pattern: 'world$',
    flags: '',
    matchExamples: ['hello world'],
    notMatchExamples: ['world hello'],
    keywords: ['end', '结尾', '行尾'],
  },
  {
    id: 'word-boundary',
    category: 'anchor',
    syntax: '\\b',
    name: '单词边界',
    nameEn: 'Word boundary',
    explanation: '断言单词字符与非单词字符之间的位置，不消耗字符。',
    pattern: '\\bcat\\b',
    flags: '',
    matchExamples: ['the cat sat'],
    notMatchExamples: ['concatenate'],
    keywords: ['boundary', '边界'],
  },
  {
    id: 'not-word-boundary',
    category: 'anchor',
    syntax: '\\B',
    name: '非单词边界',
    nameEn: 'Non-word boundary',
    explanation: '\\b 的反义，断言两侧同为单词字符或同为非单词字符。',
    pattern: '\\Bcat\\B',
    flags: '',
    matchExamples: ['concatenate'],
    notMatchExamples: ['the cat sat'],
    keywords: ['non-boundary', '非边界'],
  },

  // ---- 分组与引用 ----
  {
    id: 'capturing-group',
    category: 'group',
    syntax: '(...)',
    name: '捕获组',
    nameEn: 'Capturing group',
    explanation: '分组并捕获子匹配，可通过编号或替换字符串引用。',
    pattern: '(ab)+',
    flags: '',
    matchExamples: ['ab', 'abab'],
    notMatchExamples: ['a', 'ba'],
    keywords: ['capture', '捕获'],
  },
  {
    id: 'non-capturing-group',
    category: 'group',
    syntax: '(?:...)',
    name: '非捕获组',
    nameEn: 'Non-capturing group',
    explanation: '仅分组不分配捕获编号，性能与引用更清晰。',
    pattern: '(?:ab)+c',
    flags: '',
    matchExamples: ['abc', 'ababc'],
    notMatchExamples: ['c'],
    keywords: ['non-capture', '非捕获'],
  },
  {
    id: 'named-group',
    category: 'group',
    syntax: '(?<name>...)',
    name: '命名捕获组',
    nameEn: 'Named capturing group',
    explanation: '为捕获组命名，通过 groups.name 读取，避免依赖编号。',
    pattern: '(?<year>\\d{4})-(?<month>\\d{2})',
    flags: '',
    matchExamples: ['2026-11'],
    notMatchExamples: ['26-11'],
    keywords: ['named', '命名'],
  },
  {
    id: 'backreference',
    category: 'group',
    syntax: '\\1 / \\k<name>',
    name: '反向引用',
    nameEn: 'Backreference',
    explanation: '引用之前捕获组匹配到的实际文本，命名组用 \\k<name>。',
    pattern: '(\\w+)\\s\\1',
    flags: '',
    matchExamples: ['abc abc'],
    notMatchExamples: ['abc def'],
    keywords: ['backreference', 'backref', '反向引用'],
  },

  // ---- 环视断言 ----
  {
    id: 'positive-lookahead',
    category: 'assertion',
    syntax: '(?=...)',
    name: '正向前瞻',
    nameEn: 'Positive lookahead',
    explanation: '断言右侧能匹配该模式，断言本身不消耗字符。',
    pattern: '\\d+(?=px)',
    flags: '',
    matchExamples: ['12px'],
    notMatchExamples: ['12em'],
    keywords: ['lookahead', '前瞻', 'look'],
  },
  {
    id: 'negative-lookahead',
    category: 'assertion',
    syntax: '(?!...)',
    name: '负向前瞻',
    nameEn: 'Negative lookahead',
    explanation: '断言右侧不能匹配该模式。',
    pattern: 'a(?!b)',
    flags: '',
    matchExamples: ['ac', 'xa'],
    notMatchExamples: ['ab'],
    keywords: ['negative lookahead', '负前瞻', 'look'],
  },
  {
    id: 'positive-lookbehind',
    category: 'assertion',
    syntax: '(?<=...)',
    name: '正向后顾',
    nameEn: 'Positive lookbehind',
    explanation: '断言左侧已匹配该模式；ES2018 起在 JS 中支持，旧环境可能不兼容。',
    pattern: '(?<=\\$)\\d+',
    flags: '',
    matchExamples: ['$99'],
    notMatchExamples: ['€99'],
    keywords: ['lookbehind', '后顾', 'look'],
  },
  {
    id: 'negative-lookbehind',
    category: 'assertion',
    syntax: '(?<!...)',
    name: '负向后顾',
    nameEn: 'Negative lookbehind',
    explanation: '断言左侧未匹配该模式；同样依赖 ES2018 lookbehind 支持。',
    pattern: '(?<!\\$)\\d',
    flags: '',
    matchExamples: ['€9'],
    notMatchExamples: ['$9'],
    keywords: ['negative lookbehind', '负后顾', 'look'],
  },

  // ---- 交替与转义 ----
  {
    id: 'alternation',
    category: 'alternation-escape',
    syntax: '|',
    name: '交替（或）',
    nameEn: 'Alternation',
    explanation: '在多个分支中任选其一匹配，优先级最低，常用括号限定范围。',
    pattern: 'cat|dog',
    flags: '',
    matchExamples: ['cat', 'dog'],
    notMatchExamples: ['fish'],
    keywords: ['or', 'alternation', '或', '交替'],
  },
  {
    id: 'escape',
    category: 'alternation-escape',
    syntax: '\\',
    name: '转义符',
    nameEn: 'Escape',
    explanation: '把 . * + ? 等特殊字符转义为字面量，或赋予普通字母特殊含义（\\d 等）。',
    pattern: 'a\\.b',
    flags: '',
    matchExamples: ['a.b'],
    notMatchExamples: ['aXb'],
    keywords: ['escape', '转义'],
  },
  {
    id: 'literal-slash',
    category: 'alternation-escape',
    syntax: '\\/',
    name: '转义斜杠',
    nameEn: 'Escaped slash',
    explanation: '在正则字面量中需转义定界符 /，new RegExp 字符串中则无需。',
    pattern: 'https?:\\/\\/',
    flags: '',
    matchExamples: ['http://', 'https://'],
    notMatchExamples: ['ftp://'],
    keywords: ['slash', '斜杠'],
  },

  // ---- 标志位 ----
  {
    id: 'flag-g',
    category: 'flag',
    syntax: 'g',
    name: '全局匹配',
    nameEn: 'Global',
    explanation: '查找所有匹配而非在第一个匹配后停止，影响 matchAll 与 replace 行为。',
    pattern: '\\d+',
    flags: 'g',
    matchExamples: ['a1b22c333'],
    notMatchExamples: ['abc'],
    keywords: ['global', '全局', 'flag', '标志'],
  },
  {
    id: 'flag-i',
    category: 'flag',
    syntax: 'i',
    name: '忽略大小写',
    nameEn: 'Case-insensitive',
    explanation: '匹配时不区分大小写。',
    pattern: 'abc',
    flags: 'i',
    matchExamples: ['ABC', 'Abc'],
    notMatchExamples: ['xyz'],
    keywords: ['insensitive', '大小写', 'flag', '标志'],
  },
  {
    id: 'flag-m',
    category: 'flag',
    syntax: 'm',
    name: '多行模式',
    nameEn: 'Multiline',
    explanation: '让 ^ 与 $ 匹配每一行的行首行尾，而不仅是整个字符串首尾。',
    pattern: '^end$',
    flags: 'm',
    matchExamples: ['start\nend'],
    notMatchExamples: ['start end mid'],
    keywords: ['multiline', '多行', 'flag', '标志'],
  },
  {
    id: 'flag-s',
    category: 'flag',
    syntax: 's',
    name: 'dotAll 模式',
    nameEn: 'DotAll',
    explanation: '让 . 也匹配换行符等行终止符。',
    pattern: 'a.b',
    flags: 's',
    matchExamples: ['a\nb'],
    notMatchExamples: ['ab'],
    keywords: ['dotall', '换行', 'flag', '标志'],
  },
  {
    id: 'flag-u',
    category: 'flag',
    syntax: 'u',
    name: 'Unicode 模式',
    nameEn: 'Unicode',
    explanation: '启用完整 Unicode 支持，正确处理代理对并允许 \\p{...} 属性转义。',
    pattern: '😀+',
    flags: 'u',
    matchExamples: ['😀😀'],
    notMatchExamples: ['abc'],
    keywords: ['unicode', 'flag', '标志'],
  },
  {
    id: 'flag-y',
    category: 'flag',
    syntax: 'y',
    name: '粘性匹配',
    nameEn: 'Sticky',
    explanation: '仅从 lastIndex 指定位置精确匹配，不允许从更后位置开始。',
    pattern: '\\d+',
    flags: 'y',
    matchExamples: ['123abc'],
    notMatchExamples: ['abc123'],
    keywords: ['sticky', '粘性', 'flag', '标志'],
  },

  // ---- Unicode 属性转义 ----
  {
    id: 'unicode-letter',
    category: 'unicode-property',
    syntax: '\\p{L}',
    name: 'Unicode 字母',
    nameEn: 'Unicode letter',
    explanation: 'u 标志下匹配任意语言的字母（含中文等），比 \\w 覆盖更广。',
    pattern: '\\p{L}+',
    flags: 'u',
    matchExamples: ['你好', 'café'],
    notMatchExamples: ['123', '!!!'],
    keywords: ['unicode', 'letter', '字母', 'property'],
  },
  {
    id: 'unicode-number',
    category: 'unicode-property',
    syntax: '\\p{N}',
    name: 'Unicode 数字',
    nameEn: 'Unicode number',
    explanation: 'u 标志下匹配任意书写系统的数字字符，而不仅是 ASCII 0-9。',
    pattern: '\\p{N}+',
    flags: 'u',
    matchExamples: ['¹²³', '६'],
    notMatchExamples: ['abc'],
    keywords: ['unicode', 'number', '数字', 'property'],
  },
  {
    id: 'unicode-script',
    category: 'unicode-property',
    syntax: '\\p{Script=...}',
    name: '按脚本匹配',
    nameEn: 'Script property',
    explanation: '按文字脚本筛选字符，如 Script=Han 匹配汉字、Script=Greek 匹配希腊字母。',
    pattern: '\\p{Script=Han}+',
    flags: 'u',
    matchExamples: ['汉字测试'],
    notMatchExamples: ['abc', '123'],
    keywords: ['script', 'han', '脚本', '汉字', 'property'],
  },
];

/** 跨语言差异说明（仅文档，不做多语言执行） */
export interface LanguageDifference {
  /** 主题 */
  topic: string;
  /** JavaScript 行为 */
  javascript: string;
  /** 其他语言（Python/Java/PCRE 等）行为 */
  others: string;
}

export const LANGUAGE_DIFFERENCES: LanguageDifference[] = [
  {
    topic: '\\d 是否匹配 Unicode 数字',
    javascript: '默认 \\d 仅匹配 ASCII [0-9]；需用 u 标志加 \\p{N} 才能匹配其他书写系统数字。',
    others: 'Python 3 在 str 模式下 \\d 默认匹配 Unicode 数字；.NET、Java 的 \\d 也默认是 Unicode 感知的。',
  },
  {
    topic: 'lookbehind 后顾断言',
    javascript: 'ES2018 起支持 (?<=) 与 (?<!)，旧版浏览器或 Node 10 之前不支持。',
    others: 'PCRE、Java、.NET 早已有完善的定长/变长 lookbehind；Python 3.7+ 支持定长后顾。',
  },
  {
    topic: '命名捕获组语法',
    javascript: '使用 (?<name>...) 定义、\\k<name> 反向引用，结果在 groups 属性读取。',
    others: 'Python 同样用 (?P<name>...) 与 (?P=name)；PCRE/Java 支持 (?<name>...)，语法细节有差异。',
  },
  {
    topic: 'Unicode 属性转义',
    javascript: '需 u 标志，使用 \\p{L}、\\p{Script=Han} 等形式。',
    others: 'PCRE2 用 \\p{L}（无需 u 标志）；Java 支持 \\p{IsLatin} 等自有写法；Python 通过 regex 第三方库支持。',
  },
  {
    topic: '点号 . 与换行',
    javascript: '默认 . 不匹配换行，加 s 标志（dotAll）后匹配；也可用 [\\s\\S] 绕过。',
    others: 'Python/Java 用 re.DOTALL / Pattern.DOTALL 达到同样效果；PCRE 用 s 修饰符。',
  },
];
