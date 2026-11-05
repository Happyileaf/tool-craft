/**
 * Unified Diff / Git Patch 解析与统计（零依赖纯函数，不依赖 DOM 与 React）。
 *
 * 支持识别：
 * - 文件头 `diff --git a/... b/...`、`--- ` / `+++ ` 路径（自动剥离 a/ b/ 前缀，识别 /dev/null）
 * - new file mode / deleted file mode / rename from-to / copy from-to / old-new mode / 相似度 index
 * - Hunk 头 `@@ -a,b +c,d @@`（含可选上下文函数名）与体内 `+` / `-` / ` ` / `\` 行前缀
 * - 逐行畸形检测（带原始行号，不中断解析）
 */

/** 文件变更类型 */
export type ChangeType = 'added' | 'deleted' | 'modified' | 'renamed' | 'copied';

/** Hunk 体内单行的种类 */
export type DiffLineKind = 'add' | 'remove' | 'context' | 'no-newline';

/** 单个 hunk 的单边范围（起始行号与行数；行数为 0 表示纯插入/删除点） */
export interface HunkRange {
  /** 起始行号（1 起始；0 仅出现在空文件的纯插入场景） */
  start: number;
  /** 行数；hunk 头省略 `,count` 时按 1 处理 */
  count: number;
}

/** Hunk 体内的一行 */
export interface DiffLine {
  /** 行种类：新增 / 删除 / 上下文 / 文件末尾无换行标记 */
  kind: DiffLineKind;
  /** 去掉单字符前缀后的行内容（no-newline 行保留标记原文） */
  text: string;
  /** 1 起始的原始 patch 行号 */
  sourceLine: number;
  /** 旧文件行号；新增行与无换行标记为 null */
  oldLineNumber: number | null;
  /** 新文件行号；删除行与无换行标记为 null */
  newLineNumber: number | null;
}

/** 一个 hunk（@@ 块） */
export interface Hunk {
  /** 旧文件范围 */
  oldRange: HunkRange;
  /** 新文件范围 */
  newRange: HunkRange;
  /** `@@` 之后的可选上下文函数名（去空白后为空字符串表示未提供） */
  section: string;
  /** hunk 头所在的 1 起始原始行号 */
  headerLine: number;
  /** hunk 体全部行（含无换行标记行） */
  lines: DiffLine[];
}

/** 单个文件的解析结果 */
export interface FileChange {
  /** 旧文件路径；/dev/null 或缺失时为 null */
  oldPath: string | null;
  /** 新文件路径；/dev/null 或缺失时为 null */
  newPath: string | null;
  /** 变更类型 */
  type: ChangeType;
  /** 该文件包含的 hunk */
  hunks: Hunk[];
  /** 新增行数（不含无换行标记行） */
  additions: number;
  /** 删除行数（不含无换行标记行） */
  deletions: number;
  /** new file mode 后的模式值（如 100644），未出现为 null */
  newFileMode: string | null;
  /** deleted file mode 后的模式值，未出现为 null */
  deletedFileMode: string | null;
  /** old mode 模式值（权限变化），未出现为 null */
  oldMode: string | null;
  /** new mode 模式值（权限变化），未出现为 null */
  newMode: string | null;
  /** rename from 路径，未出现为 null */
  renameFrom: string | null;
  /** rename to 路径，未出现为 null */
  renameTo: string | null;
  /** copy from 路径，未出现为 null */
  copyFrom: string | null;
  /** copy to 路径，未出现为 null */
  copyTo: string | null;
  /** 相似度 index 行的百分比数值（如 92），未出现为 null */
  similarity: number | null;
  /** index 行原文（blob 哈希行），未出现为 null */
  indexLine: string | null;
  /** 是否缺少 `diff --git` 文件头（畸形场景下为 true） */
  headerMissing: boolean;
  /** `diff --git` 头所在的 1 起始原始行号；合成文件为起始内容行号 */
  headerLine: number;
}

/** 一条解析错误（不中断整体解析） */
export interface PatchError {
  /** 1 起始的原始 patch 行号 */
  line: number;
  /** 错误原因 */
  message: string;
}

/** parsePatch 的完整返回结果 */
export interface ParsedPatch {
  /** 按出现顺序排列的文件变更 */
  files: FileChange[];
  /** 变更文件总数 */
  fileCount: number;
  /** 全部文件新增行数合计 */
  totalAdditions: number;
  /** 全部文件删除行数合计 */
  totalDeletions: number;
  /** 全部文件 hunk 数合计 */
  hunkCount: number;
  /** 全部解析错误 */
  errors: PatchError[];
}

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
const DIFF_GIT_RE = /^diff --git a\/(.+) b\/(.+)$/;
const DEV_NULL = '/dev/null';

/**
 * 判断一行是否为 hunk 头（以 `@@ ` 开头）。
 * 半截 `@@`（如 `@@ -1,2 +3 @@` 缺尾或残缺）同样返回 true，由 parseHunkRange 进一步判错。
 *
 * @param line - 待判断的原始文本行
 * @returns 是 hunk 头形态时返回 true
 */
export function isHunkHeader(line: string): boolean {
  return line.startsWith('@@');
}

/**
 * 解析 hunk 头的新旧范围与可选上下文函数名。
 * 标准形态：`@@ -a,b +c,d @@ function`，`,b` / `,d` 省略时行数按 1 处理。
 *
 * @param line - hunk 头原文
 * @returns 解析结果；头残缺或数字非法时返回 null
 */
export function parseHunkRange(
  line: string,
): { oldRange: HunkRange; newRange: HunkRange; section: string } | null {
  const match = HUNK_HEADER_RE.exec(line);
  if (!match) {
    return null;
  }
  const oldStart = Number(match[1] ?? '0');
  const oldCount = match[2] === undefined ? 1 : Number(match[2]);
  const newStart = Number(match[3] ?? '0');
  const newCount = match[4] === undefined ? 1 : Number(match[4]);
  if (!Number.isFinite(oldStart) || !Number.isFinite(oldCount) || !Number.isFinite(newStart) || !Number.isFinite(newCount)) {
    return null;
  }
  return {
    oldRange: { start: oldStart, count: oldCount },
    newRange: { start: newStart, count: newCount },
    section: (match[5] ?? '').trim(),
  };
}

/**
 * 规范化 `--- ` / `+++ ` 后的路径：剥离 a/ b/ 前缀，/dev/null 归一为 null，去除可选引号。
 *
 * @param raw - 头部字段后的原始路径文本
 * @returns 可直接展示的路径；空设备或空文本返回 null
 */
export function normalizePatchPath(raw: string): string | null {
  let path = raw.trim();
  if (path === '' || path === DEV_NULL) {
    return null;
  }
  if (
    (path.startsWith('"') && path.endsWith('"') && path.length >= 2) ||
    (path.startsWith("'") && path.endsWith("'") && path.length >= 2)
  ) {
    path = path.slice(1, -1);
  }
  if (path === DEV_NULL) {
    return null;
  }
  if (path.startsWith('a/') || path.startsWith('b/')) {
    return path.slice(2);
  }
  return path;
}

/** 创建一个空白文件变更记录 */
function createFile(headerLine: number, headerMissing: boolean): FileChange {
  return {
    oldPath: null,
    newPath: null,
    type: 'modified',
    hunks: [],
    additions: 0,
    deletions: 0,
    newFileMode: null,
    deletedFileMode: null,
    oldMode: null,
    newMode: null,
    renameFrom: null,
    renameTo: null,
    copyFrom: null,
    copyTo: null,
    similarity: null,
    indexLine: null,
    headerMissing,
    headerLine,
  };
}

/**
 * 逐行确定性解析 unified diff / git patch 文本。
 * 遇到畸形内容只记录错误并继续解析，不抛出异常；空字符串返回全零空结果。
 *
 * @param text - 完整 patch 文本
 * @returns 文件变更、汇总统计与错误列表
 */
export function parsePatch(text: string): ParsedPatch {
  const errors: PatchError[] = [];
  const files: FileChange[] = [];

  if (text.trim() === '') {
    return { files, fileCount: 0, totalAdditions: 0, totalDeletions: 0, hunkCount: 0, errors };
  }

  const lines = text.split(/\r?\n/);
  // 末尾换行产生的空串不占逻辑行号
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  let current: FileChange | null = null;
  let hunk: Hunk | null = null;
  let oldCursor = 0;
  let newCursor = 0;
  let actualOld = 0;
  let actualNew = 0;

  const pushError = (line: number, message: string): void => {
    errors.push({ line, message });
  };

  const ensureFile = (lineNumber: number): FileChange => {
    if (current === null) {
      current = createFile(lineNumber, true);
      files.push(current);
      pushError(lineNumber, '文件头缺失：内容行之前未出现 diff --git 头');
    }
    return current;
  };

  const closeHunk = (): void => {
    if (hunk !== null && current !== null) {
      if (actualOld !== hunk.oldRange.count) {
        pushError(
          hunk.headerLine,
          `hunk 旧侧声明 ${hunk.oldRange.count} 行，实际 ${actualOld} 行（上下文 + 删除）`,
        );
      }
      if (actualNew !== hunk.newRange.count) {
        pushError(
          hunk.headerLine,
          `hunk 新侧声明 ${hunk.newRange.count} 行，实际 ${actualNew} 行（上下文 + 新增）`,
        );
      }
      current.hunks.push(hunk);
      hunk = null;
    }
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    const diffMatch = DIFF_GIT_RE.exec(line);
    if (diffMatch) {
      closeHunk();
      current = createFile(lineNumber, false);
      current.oldPath = diffMatch[1] ?? null;
      current.newPath = diffMatch[2] ?? null;
      files.push(current);
      return;
    }

    if (isHunkHeader(line)) {
      ensureFile(lineNumber);
      closeHunk();
      const parsed = parseHunkRange(line);
      if (parsed === null) {
        pushError(lineNumber, '半截或非法 hunk 头：应为 @@ -a,b +c,d @@ 形态');
        return;
      }
      hunk = {
        oldRange: parsed.oldRange,
        newRange: parsed.newRange,
        section: parsed.section,
        headerLine: lineNumber,
        lines: [],
      };
      oldCursor = parsed.oldRange.start;
      newCursor = parsed.newRange.start;
      actualOld = 0;
      actualNew = 0;
      return;
    }

    // 无文件上下文时的游离元数据/内容行
    if (current === null) {
      const firstChar = line.charAt(0);
      if (firstChar === '+' || firstChar === '-') {
        ensureFile(lineNumber);
        pushError(lineNumber, '缺少 hunk 头却出现变更内容行（+ / -）');
        return;
      }
      if (line.trim() === '') {
        return;
      }
      ensureFile(lineNumber);
    }

    const file = current as FileChange;

    if (line.startsWith('new file mode ')) {
      file.newFileMode = line.slice('new file mode '.length).trim();
      return;
    }
    if (line.startsWith('deleted file mode ')) {
      file.deletedFileMode = line.slice('deleted file mode '.length).trim();
      return;
    }
    if (line.startsWith('old mode ')) {
      file.oldMode = line.slice('old mode '.length).trim();
      return;
    }
    if (line.startsWith('new mode ')) {
      file.newMode = line.slice('new mode '.length).trim();
      return;
    }
    if (line.startsWith('rename from ')) {
      file.renameFrom = line.slice('rename from '.length).trim();
      return;
    }
    if (line.startsWith('rename to ')) {
      file.renameTo = line.slice('rename to '.length).trim();
      return;
    }
    if (line.startsWith('copy from ')) {
      file.copyFrom = line.slice('copy from '.length).trim();
      return;
    }
    if (line.startsWith('copy to ')) {
      file.copyTo = line.slice('copy to '.length).trim();
      return;
    }
    if (line.startsWith('similarity index ')) {
      const value = Number(line.slice('similarity index '.length).trim().replace('%', ''));
      file.similarity = Number.isFinite(value) ? value : null;
      return;
    }
    if (line.startsWith('index ')) {
      file.indexLine = line.slice('index '.length).trim();
      return;
    }
    if (line.startsWith('--- ')) {
      file.oldPath = normalizePatchPath(line.slice(4));
      return;
    }
    if (line.startsWith('+++ ')) {
      file.newPath = normalizePatchPath(line.slice(4));
      return;
    }

    // hunk 体内容
    if (hunk !== null) {
      const prefix = line.charAt(0);
      if (prefix === '+') {
        hunk.lines.push({
          kind: 'add',
          text: line.slice(1),
          sourceLine: lineNumber,
          oldLineNumber: null,
          newLineNumber: newCursor,
        });
        newCursor += 1;
        actualNew += 1;
        file.additions += 1;
        return;
      }
      if (prefix === '-') {
        hunk.lines.push({
          kind: 'remove',
          text: line.slice(1),
          sourceLine: lineNumber,
          oldLineNumber: oldCursor,
          newLineNumber: null,
        });
        oldCursor += 1;
        actualOld += 1;
        file.deletions += 1;
        return;
      }
      if (prefix === ' ') {
        hunk.lines.push({
          kind: 'context',
          text: line.slice(1),
          sourceLine: lineNumber,
          oldLineNumber: oldCursor,
          newLineNumber: newCursor,
        });
        oldCursor += 1;
        newCursor += 1;
        actualOld += 1;
        actualNew += 1;
        return;
      }
      if (line === '') {
        // git 对空上下文行的容忍写法：视为空前缀上下文行
        hunk.lines.push({
          kind: 'context',
          text: '',
          sourceLine: lineNumber,
          oldLineNumber: oldCursor,
          newLineNumber: newCursor,
        });
        oldCursor += 1;
        newCursor += 1;
        actualOld += 1;
        actualNew += 1;
        return;
      }
      if (prefix === '\\') {
        hunk.lines.push({
          kind: 'no-newline',
          text: line,
          sourceLine: lineNumber,
          oldLineNumber: null,
          newLineNumber: null,
        });
        return;
      }
      pushError(lineNumber, `坏行前缀：「${prefix}」，合法前缀为 + - 空格与反斜杠`);
      return;
    }

    // hunk 之外的游离内容行（文件存在但无活跃 hunk）
    if (line.charAt(0) === '+' || line.charAt(0) === '-') {
      pushError(lineNumber, '缺少 hunk 头却出现变更内容行（+ / -）');
      return;
    }
    if (line.trim() === '') {
      return;
    }
    pushError(lineNumber, '无法识别的 patch 行（文件头缺失或语法未知）');
  });

  closeHunk();

  for (const file of files) {
    if (file.renameFrom !== null || file.renameTo !== null) {
      file.type = 'renamed';
      if (file.oldPath === null) {
        file.oldPath = file.renameFrom;
      }
      if (file.newPath === null) {
        file.newPath = file.renameTo;
      }
    } else if (file.copyFrom !== null || file.copyTo !== null) {
      file.type = 'copied';
      if (file.oldPath === null) {
        file.oldPath = file.copyFrom;
      }
      if (file.newPath === null) {
        file.newPath = file.copyTo;
      }
    } else if (file.newFileMode !== null || file.oldPath === null) {
      file.type = 'added';
    } else if (file.deletedFileMode !== null || file.newPath === null) {
      file.type = 'deleted';
    } else {
      file.type = 'modified';
    }
  }

  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
  const hunkCount = files.reduce((sum, file) => sum + file.hunks.length, 0);

  return {
    files,
    fileCount: files.length,
    totalAdditions,
    totalDeletions,
    hunkCount,
    errors,
  };
}
