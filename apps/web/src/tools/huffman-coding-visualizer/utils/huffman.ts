/**
 * 哈夫曼（Huffman）编码纯函数实现（零依赖）。
 *
 * 流程：频次统计 / 频次表解析 → 贪心合并建树（数组排序模拟优先队列）→
 * 遍历树生成前缀码 → 编码比特串与字节对齐十六进制 → WPL / 平均码长 / 节省比例。
 * 本模块不触碰 DOM 与 React，所有非法输入均以结果对象的 error 字段返回而非抛出。
 */

export type InputMode = 'text' | 'table';

export interface SymbolWeight {
  symbol: string;
  weight: number;
}

export interface HuffmanNode {
  /** 叶子为 0 基序号；内部节点为 1 基合并轮次（展示为 N{id}） */
  id: number;
  weight: number;
  /** 叶子节点的符号；内部节点为 null */
  symbol: string | null;
  /** 插入序，同权重时作为确定性 tie-break 依据 */
  order: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

export interface MergeStep {
  /** 第几轮合并，从 1 开始 */
  round: number;
  leftLabel: string;
  rightLabel: string;
  leftWeight: number;
  rightWeight: number;
  resultLabel: string;
  resultWeight: number;
  /** 面向教学展示的可读描述 */
  description: string;
}

export interface CodeEntry {
  symbol: string;
  weight: number;
  code: string;
  codeLength: number;
}

export interface TreeLine {
  depth: number;
  /** 进入该节点的边：左 0 / 右 1，根节点为 null */
  edge: '0' | '1' | null;
  label: string;
  weight: number;
  leaf: boolean;
}

export interface HexResult {
  hex: string;
  /** 末尾补 0 的填充位数 */
  paddingBits: number;
  /** 填充后的完整比特串 */
  paddedBits: string;
}

export interface HuffmanResult {
  error: string | null;
  frequencies: SymbolWeight[];
  root: HuffmanNode | null;
  codes: CodeEntry[];
  codeMap: Map<string, string>;
  steps: MergeStep[];
  treeLines: TreeLine[];
  treeText: string;
  symbolCount: number;
  totalWeight: number;
  /** 加权路径长度 WPL = Σ频次 × 码长 */
  wpl: number;
  /** 平均码长 = WPL / 总频次 */
  averageCodeLength: number;
  /** 等长编码每个符号所需位数 ⌈log2(k)⌉ */
  fixedCodeLength: number;
  /** 等长编码总比特数 */
  fixedTotalBits: number;
  /** 哈夫曼编码总比特数 */
  totalBits: number;
  /** 相对等长编码的节省比例（0-1） */
  savingRatio: number;
  /** 整段输入的编码比特串 */
  encodedBits: string;
  hex: HexResult | null;
}

export interface ParseResult {
  entries: SymbolWeight[];
  error: string | null;
  /** 出错行号（1 基），无错误为 null */
  errorLine: number | null;
}

const EMPTY_RESULT: HuffmanResult = {
  error: null,
  frequencies: [],
  root: null,
  codes: [],
  codeMap: new Map<string, string>(),
  steps: [],
  treeLines: [],
  treeText: '',
  symbolCount: 0,
  totalWeight: 0,
  wpl: 0,
  averageCodeLength: 0,
  fixedCodeLength: 0,
  fixedTotalBits: 0,
  totalBits: 0,
  savingRatio: 0,
  encodedBits: '',
  hex: null,
};

/** 将空白 / 控制字符转换为可读标签，保证合并步骤与树形展示无歧义。 */
export function displaySymbol(symbol: string): string {
  switch (symbol) {
    case ' ':
      return '空格';
    case '\t':
      return '制表符';
    case '\n':
      return '换行';
    case '\r':
      return '回车';
    default:
      return symbol;
  }
}

function nodeLabel(node: HuffmanNode): string {
  return node.symbol !== null ? displaySymbol(node.symbol) : `N${node.id}`;
}

/**
 * 统计文本中各 Unicode 字符（按 code point 切分，正确处理代理对）的出现次数，
 * 保留首次出现顺序，保证后续 tie-break 的确定性。
 */
export function countFrequencies(text: string): SymbolWeight[] {
  const counts = new Map<string, number>();
  for (const char of Array.from(text)) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  return Array.from(counts, ([symbol, weight]) => ({ symbol, weight }));
}

/**
 * 解析「符号,频次」多行频次表。
 * 空行忽略；错误（缺逗号、非数字、负数 / 小数 / 零、重复符号、整表为空）以中文消息返回。
 */
export function parseFrequencyTable(raw: string): ParseResult {
  const entries: SymbolWeight[] = [];
  const seen = new Set<string>();
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      continue;
    }
    const lineNo = i + 1;
    const comma = line.indexOf(',');
    if (comma === -1) {
      return { entries: [], error: `第 ${lineNo} 行：缺少逗号分隔符，格式应为「符号,频次」`, errorLine: lineNo };
    }
    const symbol = line.slice(0, comma).trim();
    const freqText = line.slice(comma + 1).trim();
    if (symbol === '') {
      return { entries: [], error: `第 ${lineNo} 行：符号不能为空`, errorLine: lineNo };
    }
    if (freqText === '' || !/^\d+$/.test(freqText)) {
      if (freqText.startsWith('-')) {
        return { entries: [], error: `第 ${lineNo} 行：符号「${displaySymbol(symbol)}」的频次不能为负数`, errorLine: lineNo };
      }
      return {
        entries: [],
        error: `第 ${lineNo} 行：符号「${displaySymbol(symbol)}」的频次「${freqText}」不是合法正整数`,
        errorLine: lineNo,
      };
    }
    const weight = Number(freqText);
    if (weight === 0) {
      return { entries: [], error: `第 ${lineNo} 行：符号「${displaySymbol(symbol)}」的频次必须大于 0`, errorLine: lineNo };
    }
    if (seen.has(symbol)) {
      return { entries: [], error: `第 ${lineNo} 行：符号「${displaySymbol(symbol)}」重复定义`, errorLine: lineNo };
    }
    seen.add(symbol);
    entries.push({ symbol, weight });
  }

  if (entries.length === 0) {
    return { entries: [], error: '频次表为空，请至少输入一行「符号,频次」', errorLine: null };
  }
  return { entries, error: null, errorLine: null };
}

/** ⌈log2(n)⌉，n ≥ 1；用移位循环避免浮点误差。 */
function ceilLog2(n: number): number {
  let bits = 0;
  let value = 1;
  while (value < n) {
    value *= 2;
    bits += 1;
  }
  return bits;
}

/**
 * 贪心构建哈夫曼树：每轮取权重最小的两个节点合并；
 * 同权重按插入序 order 升序 tie-break，左子为较小节点（边 0），右子次之（边 1）。
 * 优先队列以数组 + 排序模拟，零额外依赖。
 */
function buildTree(entries: SymbolWeight[]): { root: HuffmanNode; steps: MergeStep[] } {
  const forest: HuffmanNode[] = entries.map((entry, index) => ({
    id: index,
    weight: entry.weight,
    symbol: entry.symbol,
    order: index,
    left: null,
    right: null,
  }));
  const steps: MergeStep[] = [];
  let orderSeq = forest.length;
  let round = 0;

  while (forest.length > 1) {
    forest.sort((a, b) => (a.weight !== b.weight ? a.weight - b.weight : a.order - b.order));
    const left = forest.shift();
    const right = forest.shift();
    if (!left || !right) {
      break;
    }
    round += 1;
    const merged: HuffmanNode = {
      id: round,
      weight: left.weight + right.weight,
      symbol: null,
      order: orderSeq,
      left,
      right,
    };
    orderSeq += 1;
    steps.push({
      round,
      leftLabel: nodeLabel(left),
      rightLabel: nodeLabel(right),
      leftWeight: left.weight,
      rightWeight: right.weight,
      resultLabel: `N${round}`,
      resultWeight: merged.weight,
      description: `第${round}轮：合并 ${nodeLabel(left)}(${left.weight}) 与 ${nodeLabel(
        right,
      )}(${right.weight}) → N${round}(${merged.weight})`,
    });
    forest.push(merged);
  }

  const root = forest[0];
  if (!root) {
    throw new Error('哈夫曼树构建失败：节点为空');
  }
  return { root, steps };
}

/** 深度优先遍历生成前缀码；单符号树无前缀路径，约定码字为 "0"。 */
function collectCodes(root: HuffmanNode): CodeEntry[] {
  const entries: CodeEntry[] = [];
  const walk = (node: HuffmanNode, prefix: string): void => {
    if (node.symbol !== null) {
      entries.push({
        symbol: node.symbol,
        weight: node.weight,
        code: prefix === '' ? '0' : prefix,
        codeLength: prefix === '' ? 1 : prefix.length,
      });
      return;
    }
    if (node.left) {
      walk(node.left, `${prefix}0`);
    }
    if (node.right) {
      walk(node.right, `${prefix}1`);
    }
  };
  walk(root, '');
  return entries;
}

/** 生成缩进树形结构（结构化行 + 带 ├─/└─ 连接符的文本）。 */
function renderTree(root: HuffmanNode): { treeLines: TreeLine[]; treeText: string } {
  const treeLines: TreeLine[] = [];
  const textLines: string[] = [];

  const walk = (node: HuffmanNode, depth: number, edge: '0' | '1' | null, prefix: string, isLast: boolean): void => {
    const label = nodeLabel(node);
    const leaf = node.symbol !== null;
    treeLines.push({ depth, edge, label, weight: node.weight, leaf });
    if (depth === 0) {
      textLines.push(`${label}(${node.weight})`);
    } else {
      textLines.push(`${prefix}${isLast ? '└─' : '├─'}${edge ?? ''} ${label}(${node.weight})`);
    }
    const childPrefix = depth === 0 ? '' : `${prefix}${isLast ? '   ' : '│  '}`;
    if (node.left) {
      walk(node.left, depth + 1, '0', childPrefix, node.right === null);
    }
    if (node.right) {
      walk(node.right, depth + 1, '1', childPrefix, true);
    }
  };

  walk(root, 0, null, '', true);
  return { treeLines, treeText: textLines.join('\n') };
}

/**
 * 比特串按 8 位对齐转十六进制：末尾补 0 至字节整数倍，
 * 返回十六进制串、填充位数与填充后的比特串。
 */
export function bitsToHex(bits: string): HexResult {
  const paddingBits = bits.length === 0 ? 0 : (8 - (bits.length % 8)) % 8;
  const paddedBits = `${bits}${'0'.repeat(paddingBits)}`;
  const bytes: string[] = [];
  for (let i = 0; i < paddedBits.length; i += 8) {
    const byte = paddedBits.slice(i, i + 8);
    bytes.push(Number.parseInt(byte || '0', 2).toString(16).padStart(2, '0').toUpperCase());
  }
  return { hex: bytes.join(' '), paddingBits, paddedBits };
}

/**
 * 使用码表编码文本；任一字符不在码表中即返回中文错误（不抛异常）。
 */
export function encodeText(text: string, codeMap: Map<string, string>): { bits: string; error: string | null } {
  const parts: string[] = [];
  for (const char of Array.from(text)) {
    const code = codeMap.get(char);
    if (code === undefined) {
      return { bits: parts.join(''), error: `字符「${displaySymbol(char)}」不在码表中，无法编码` };
    }
    parts.push(code);
  }
  return { bits: parts.join(''), error: null };
}

/**
 * 按哈夫曼树对比特串解码；末尾若残留无法构成完整码字的比特，
 * 返回已解码部分并附带说明（典型为字节对齐的填充 0）。
 */
export function decodeBits(bits: string, root: HuffmanNode | null): { text: string; error: string | null } {
  if (!root) {
    return { text: '', error: '哈夫曼树为空，无法解码' };
  }
  // 单符号树：码字约定为 "0"，每个比特对应一次该符号
  if (root.symbol !== null) {
    return { text: root.symbol.repeat(bits.length), error: null };
  }
  const chars: string[] = [];
  let node: HuffmanNode = root;
  for (let i = 0; i < bits.length; i += 1) {
    const bit = bits[i];
    const next = bit === '0' ? node.left : node.right;
    // 走到叶子后下一轮已复位为 root，root 必有两个孩子，缺失只可能出现在畸形树
    if (!next) {
      return {
        text: chars.join(''),
        error: `第 ${i + 1} 位比特「${bit ?? ''}」在哈夫曼树中没有对应分支，已返回可解码部分`,
      };
    }
    node = next;
    if (node.symbol !== null) {
      chars.push(node.symbol);
      node = root;
    }
  }
  if (node !== root) {
    return {
      text: chars.join(''),
      error: '末尾存在无法构成完整码字的多余比特（可能是字节对齐的填充 0），已返回可解码部分',
    };
  }
  return { text: chars.join(''), error: null };
}

/** 由合法频次表构建完整分析结果；空表返回带错误的结果对象。 */
export function buildHuffman(entries: SymbolWeight[]): HuffmanResult {
  if (entries.length === 0) {
    return { ...EMPTY_RESULT, error: '频次表为空，无法构建哈夫曼树' };
  }

  const { root, steps } = buildTree(entries);
  const codeEntries = collectCodes(root);
  const codeMap = new Map(codeEntries.map((entry) => [entry.symbol, entry.code]));
  const { treeLines, treeText } = renderTree(root);

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const wpl = codeEntries.reduce((sum, entry) => sum + entry.weight * entry.codeLength, 0);
  const totalBits = codeEntries.reduce((sum, entry) => sum + entry.weight * entry.codeLength, 0);
  const fixedCodeLength = entries.length === 1 ? 1 : ceilLog2(entries.length);
  const fixedTotalBits = totalWeight * fixedCodeLength;
  const savingRatio = fixedTotalBits > 0 ? (fixedTotalBits - totalBits) / fixedTotalBits : 0;

  // 频次表模式下的编码比特串：每个符号按频次重复展开
  const expandedParts: string[] = [];
  for (const entry of entries) {
    const code = codeMap.get(entry.symbol) ?? '';
    for (let i = 0; i < entry.weight; i += 1) {
      expandedParts.push(code);
    }
  }
  const encodedBits = expandedParts.join('');

  return {
    error: null,
    frequencies: entries,
    root,
    codes: codeEntries,
    codeMap,
    steps,
    treeLines,
    treeText,
    symbolCount: entries.length,
    totalWeight,
    wpl,
    averageCodeLength: totalWeight > 0 ? wpl / totalWeight : 0,
    fixedCodeLength,
    fixedTotalBits,
    totalBits,
    savingRatio,
    encodedBits,
    hex: bitsToHex(encodedBits),
  };
}

/** 文本模式入口：自动统计字符频次后建树，并编码原始文本。 */
export function analyzeText(text: string): HuffmanResult {
  if (text.length === 0) {
    return { ...EMPTY_RESULT, error: '输入文本为空，请输入至少一个字符' };
  }
  const entries = countFrequencies(text);
  const result = buildHuffman(entries);
  const encoded = encodeText(text, result.codeMap);
  result.encodedBits = encoded.bits;
  result.hex = bitsToHex(encoded.bits);
  return result;
}

/** 频次表模式入口：解析「符号,频次」文本，合法后建树。 */
export function analyzeTable(raw: string): HuffmanResult {
  const parsed = parseFrequencyTable(raw);
  if (parsed.error) {
    return { ...EMPTY_RESULT, error: parsed.error };
  }
  return buildHuffman(parsed.entries);
}
