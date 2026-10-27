export interface CharFrequency {
  char: string;
  count: number;
  probability: number;
}

export interface EntropyResult {
  length: number;
  uniqueCount: number;
  entropy: number;
  maxEntropy: number;
  normalizedEntropy: number;
  minBits: number;
  frequencies: CharFrequency[];
}

const EMPTY_RESULT: EntropyResult = {
  length: 0,
  uniqueCount: 0,
  entropy: 0,
  maxEntropy: 0,
  normalizedEntropy: 0,
  minBits: 0,
  frequencies: [],
};

/**
 * 计算文本的 Shannon 信息熵与字符频率分布。
 *
 * 字符按 Unicode code point 切分（Array.from 正确处理代理对，emoji 计为一个字符）；
 * 空白与换行同样计入。
 *
 * @param text - 输入文本
 * @returns 长度、唯一字符数、信息熵、最大熵、归一化熵、最小编码位数及频率分布
 */
export function analyzeEntropy(text: string): EntropyResult {
  const chars = Array.from(text);
  const length = chars.length;

  if (length === 0) {
    return EMPTY_RESULT;
  }

  const counts = new Map<string, number>();
  for (const char of chars) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  const frequencies: CharFrequency[] = [];
  for (const [char, count] of counts) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
    frequencies.push({ char, count, probability });
  }

  frequencies.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.char < b.char ? -1 : a.char > b.char ? 1 : 0;
  });

  const uniqueCount = counts.size;
  const maxEntropy = uniqueCount > 1 ? Math.log2(uniqueCount) : 0;
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
  const minBits = Math.ceil(entropy * length);

  return {
    length,
    uniqueCount,
    entropy,
    maxEntropy,
    normalizedEntropy,
    minBits,
    frequencies,
  };
}
