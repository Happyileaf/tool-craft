import { describe, expect, it } from 'vitest';
import {
  isHunkHeader,
  normalizePatchPath,
  parseHunkRange,
  parsePatch,
} from './patch';

describe('parsePatch 单文件单 hunk 增删统计', () => {
  it('正确统计新增、删除与上下文，剥离 a/ b/ 前缀', () => {
    const patch = [
      'diff --git a/src/app.ts b/src/app.ts',
      'index 1111111..2222222 100644',
      '--- a/src/app.ts',
      '+++ b/src/app.ts',
      '@@ -1,3 +1,3 @@',
      ' keep',
      '-old',
      '+new',
      ' tail',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    expect(result.fileCount).toBe(1);
    expect(result.totalAdditions).toBe(1);
    expect(result.totalDeletions).toBe(1);
    expect(result.hunkCount).toBe(1);
    const file = result.files[0]!;
    expect(file.oldPath).toBe('src/app.ts');
    expect(file.newPath).toBe('src/app.ts');
    expect(file.type).toBe('modified');
    expect(file.hunks[0]!.oldRange).toEqual({ start: 1, count: 3 });
    expect(file.hunks[0]!.newRange).toEqual({ start: 1, count: 3 });
    expect(file.hunks[0]!.lines.map((line) => line.kind)).toEqual([
      'context',
      'remove',
      'add',
      'context',
    ]);
  });
});

describe('parsePatch 多文件', () => {
  it('两个文件分别统计，总计累加', () => {
    const patch = [
      'diff --git a/a.txt b/a.txt',
      '--- a/a.txt',
      '+++ b/a.txt',
      '@@ -1 +1 @@',
      '-x',
      '+y',
      'diff --git a/b.txt b/b.txt',
      '--- /dev/null',
      '+++ b/b.txt',
      '@@ -0,0 +1 @@',
      '+hello',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    expect(result.fileCount).toBe(2);
    expect(result.totalAdditions).toBe(2);
    expect(result.totalDeletions).toBe(1);
    expect(result.hunkCount).toBe(2);
    expect(result.files[0]!.additions).toBe(1);
    expect(result.files[1]!.additions).toBe(1);
  });
});

describe('parsePatch new file mode', () => {
  it('识别新文件与类型 added', () => {
    const patch = [
      'diff --git a/new.ts b/new.ts',
      'new file mode 100644',
      'index 0000000..abcdef0',
      '--- /dev/null',
      '+++ b/new.ts',
      '@@ -0,0 +1,2 @@',
      '+one',
      '+two',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    const file = result.files[0]!;
    expect(file.type).toBe('added');
    expect(file.newFileMode).toBe('100644');
    expect(file.oldPath).toBeNull();
    expect(file.newPath).toBe('new.ts');
    expect(file.additions).toBe(2);
  });
});

describe('parsePatch deleted file mode', () => {
  it('识别删除文件与类型 deleted，/dev/null 新路径为 null', () => {
    const patch = [
      'diff --git a/old.ts b/old.ts',
      'deleted file mode 100644',
      'index abcdef0..0000000',
      '--- a/old.ts',
      '+++ /dev/null',
      '@@ -1,2 +0,0 @@',
      '-one',
      '-two',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    const file = result.files[0]!;
    expect(file.type).toBe('deleted');
    expect(file.deletedFileMode).toBe('100644');
    expect(file.oldPath).toBe('old.ts');
    expect(file.newPath).toBeNull();
    expect(file.deletions).toBe(2);
  });
});

describe('parsePatch rename from/to', () => {
  it('识别重命名、相似度 index 与类型 renamed', () => {
    const patch = [
      'diff --git a/old-name.md b/new-name.md',
      'similarity index 92%',
      'rename from old-name.md',
      'rename to new-name.md',
      'index 1111111..2222222 100644',
      '--- a/old-name.md',
      '+++ b/new-name.md',
      '@@ -1,3 +1,3 @@',
      ' a',
      '-b',
      '+B',
      ' c',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    const file = result.files[0]!;
    expect(file.type).toBe('renamed');
    expect(file.renameFrom).toBe('old-name.md');
    expect(file.renameTo).toBe('new-name.md');
    expect(file.similarity).toBe(92);
    expect(file.indexLine).toBe('1111111..2222222 100644');
  });
});

describe('parsePatch 多个 hunk 与省略行数边界', () => {
  it('解析两个 hunk 的范围，省略 ,count 时行数按 1 处理', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '@@ -1 +1 @@',
      '-a',
      '+A',
      '@@ -10,2 +10,2 @@ function foo()',
      ' x',
      ' y',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    const hunks = result.files[0]!.hunks;
    expect(hunks).toHaveLength(2);
    expect(hunks[0]!.oldRange).toEqual({ start: 1, count: 1 });
    expect(hunks[0]!.newRange).toEqual({ start: 1, count: 1 });
    expect(hunks[1]!.oldRange).toEqual({ start: 10, count: 2 });
    expect(hunks[1]!.newRange).toEqual({ start: 10, count: 2 });
    expect(hunks[1]!.section).toBe('function foo()');
  });
});

describe('parsePatch No newline at end of file', () => {
  it('反斜杠标记行不计入任何统计与行数校验', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '@@ -1 +1 @@',
      '-old',
      '\\ No newline at end of file',
      '+new',
      '\\ No newline at end of file',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toEqual([]);
    const hunk = result.files[0]!.hunks[0]!;
    expect(hunk.lines).toHaveLength(4);
    expect(hunk.lines.filter((line) => line.kind === 'no-newline')).toHaveLength(2);
    expect(result.totalAdditions).toBe(1);
    expect(result.totalDeletions).toBe(1);
  });
});

describe('parsePatch /dev/null 路径', () => {
  it('新旧两侧 /dev/null 均归一为 null', () => {
    expect(normalizePatchPath('/dev/null')).toBeNull();
    expect(normalizePatchPath(' b/src/x.ts ')).toBe('src/x.ts');
    const patch = [
      'diff --git a/g b/g',
      'new file mode 100755',
      '--- /dev/null',
      '+++ b/g',
      '@@ -0,0 +1 @@',
      '+z',
    ].join('\n');
    const result = parsePatch(patch);
    expect(result.files[0]!.oldPath).toBeNull();
    expect(result.files[0]!.newPath).toBe('g');
  });
});

describe('parsePatch 畸形：无 hunk 头的 + 行', () => {
  it('带行号报错且不中断后续解析', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '+orphan',
      '@@ -1 +1 @@',
      '-a',
      '+b',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors.some((error) => error.line === 4 && error.message.includes('hunk 头'))).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.hunks).toHaveLength(1);
  });
});

describe('parsePatch 畸形：hunk 行数声明不符', () => {
  it('旧侧与新侧计数不符分别在 hunk 头行报错', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '@@ -1,5 +1,2 @@',
      ' ctx',
      '+x',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.line).toBe(4);
    expect(result.errors[0]!.message).toContain('旧侧声明 5 行，实际 1 行');
  });
});

describe('parsePatch 畸形：坏前缀', () => {
  it('hunk 内非法前缀字符报错定位到该行', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '@@ -1,2 +1,2 @@',
      ' ok',
      '?bad',
      ' ok2',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.line).toBe(6);
    expect(result.errors[0]!.message).toContain('坏行前缀');
  });
});

describe('parsePatch 畸形：半截 @@ 头', () => {
  it('残缺 hunk 头报错且不建立 hunk', () => {
    const patch = [
      'diff --git a/f b/f',
      '--- a/f',
      '+++ b/f',
      '@@ -1,2 +1,2',
      ' ok',
    ].join('\n');

    const result = parsePatch(patch);
    expect(result.errors.some((error) => error.line === 4 && error.message.includes('hunk 头'))).toBe(true);
    expect(result.files[0]!.hunks).toHaveLength(0);
  });
});

describe('parsePatch 空输入', () => {
  it('空字符串与纯空白返回空结果且不报错', () => {
    const empty = parsePatch('');
    expect(empty).toEqual({
      files: [],
      fileCount: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      hunkCount: 0,
      errors: [],
    });
    const blank = parsePatch('   \n  \n');
    expect(blank.fileCount).toBe(0);
    expect(blank.errors).toEqual([]);
  });
});

describe('parsePatch 文件头缺失', () => {
  it('游离 + / - 行自动合成文件并标记 headerMissing', () => {
    const result = parsePatch('+lonely\n-line');
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]!.message).toContain('文件头缺失');
    expect(result.errors.slice(1).every((error) => error.message.includes('hunk 头'))).toBe(true);
    expect(result.files[0]!.headerMissing).toBe(true);
  });
});

describe('辅助函数', () => {
  it('isHunkHeader 与 parseHunkRange 行为正确', () => {
    expect(isHunkHeader('@@ -1 +1 @@')).toBe(true);
    expect(isHunkHeader('@@ broken')).toBe(true);
    expect(isHunkHeader('+not hunk')).toBe(false);
    expect(parseHunkRange('@@ -1,3 +2,4 @@ main')).toEqual({
      oldRange: { start: 1, count: 3 },
      newRange: { start: 2, count: 4 },
      section: 'main',
    });
    expect(parseHunkRange('@@ -1 +1 @@')).toEqual({
      oldRange: { start: 1, count: 1 },
      newRange: { start: 1, count: 1 },
      section: '',
    });
    // 省略 ,count 时行数按 1 处理，属于合法头
    expect(parseHunkRange('@@ -1,2 +1 @@')).toEqual({
      oldRange: { start: 1, count: 2 },
      newRange: { start: 1, count: 1 },
      section: '',
    });
    expect(parseHunkRange('@@ -1,2 +1')).toBeNull();
  });
});
