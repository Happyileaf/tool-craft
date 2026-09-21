/**
 * 单行差异数据结构
 */
export interface DiffLine {
  /** 该行的差异类型：equal 一致、added 新增、removed 删除 */
  type: 'equal' | 'added' | 'removed';
  /** 旧版本中的行号（从 1 开始），新增行取 null */
  oldLineNumber: number | null;
  /** 新版本中的行号（从 1 开始），删除行取 null */
  newLineNumber: number | null;
  /** 该行的原始文本内容 */
  text: string;
}

/**
 * 整段文本差异计算结果
 */
export interface DiffResult {
  /** 按合并顺序排列的差异行集合 */
  lines: DiffLine[];
  /** 新增行数 */
  addedCount: number;
  /** 删除行数 */
  removedCount: number;
  /** 相似度百分比（0 到 100 的整数） */
  similarity: number;
}

/**
 * 基于 LCS（最长公共子序列）动态规划计算两段文本的真实行级差异
 *
 * @param oldText - 旧版本原始文本
 * @param newText - 新版本修改后文本
 * @param ignoreWhitespace - 是否在比较前对每行去除首尾空白字符（不影响输出原文）
 * @returns 包含差异行集合、增删行数与相似度的计算结果
 */
export function computeLineDiff(
  oldText: string,
  newText: string,
  ignoreWhitespace: boolean,
): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const comparableOldLines = ignoreWhitespace
    ? oldLines.map((line) => line.trim())
    : oldLines;
  const comparableNewLines = ignoreWhitespace
    ? newLines.map((line) => line.trim())
    : newLines;

  const oldCount = oldLines.length;
  const newCount = newLines.length;

  const lcsTable: number[][] = Array.from({ length: oldCount + 1 }, () =>
    new Array<number>(newCount + 1).fill(0),
  );

  for (let oldIndex = oldCount - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newCount - 1; newIndex >= 0; newIndex -= 1) {
      if (
        comparableOldLines[oldIndex] === comparableNewLines[newIndex]
      ) {
        lcsTable[oldIndex]![newIndex] =
          lcsTable[oldIndex + 1]![newIndex + 1]! + 1;
      } else {
        lcsTable[oldIndex]![newIndex] = Math.max(
          lcsTable[oldIndex + 1]![newIndex]!,
          lcsTable[oldIndex]![newIndex + 1]!,
        );
      }
    }
  }

  const lines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let addedCount = 0;
  let removedCount = 0;
  let equalCount = 0;

  while (oldIndex < oldCount && newIndex < newCount) {
    if (comparableOldLines[oldIndex] === comparableNewLines[newIndex]) {
      lines.push({
        type: 'equal',
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
        text: newLines[newIndex]!,
      });
      equalCount += 1;
      oldIndex += 1;
      newIndex += 1;
    } else if (
      lcsTable[oldIndex + 1]![newIndex]! >=
      lcsTable[oldIndex]![newIndex + 1]!
    ) {
      lines.push({
        type: 'removed',
        oldLineNumber: oldIndex + 1,
        newLineNumber: null,
        text: oldLines[oldIndex]!,
      });
      removedCount += 1;
      oldIndex += 1;
    } else {
      lines.push({
        type: 'added',
        oldLineNumber: null,
        newLineNumber: newIndex + 1,
        text: newLines[newIndex]!,
      });
      addedCount += 1;
      newIndex += 1;
    }
  }

  while (oldIndex < oldCount) {
    lines.push({
      type: 'removed',
      oldLineNumber: oldIndex + 1,
      newLineNumber: null,
      text: oldLines[oldIndex]!,
    });
    removedCount += 1;
    oldIndex += 1;
  }

  while (newIndex < newCount) {
    lines.push({
      type: 'added',
      oldLineNumber: null,
      newLineNumber: newIndex + 1,
      text: newLines[newIndex]!,
    });
    addedCount += 1;
    newIndex += 1;
  }

  const similarity = Math.round(
    (equalCount / Math.max(oldCount, newCount, 1)) * 100,
  );

  return { lines, addedCount, removedCount, similarity };
}
