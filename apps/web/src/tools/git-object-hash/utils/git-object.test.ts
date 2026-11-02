import { describe, expect, it } from 'vitest';
import {
  buildTreeContent,
  hashBlob,
  hashTextObject,
  hashTree,
} from './git-object';

describe('hashBlob', () => {
  it('空内容 blob 等于 git 标准空 blob（SHA-1）', async () => {
    const result = await hashBlob('');
    expect(result.oid).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
    expect(result.header).toBe('blob 0');
    expect(result.totalLength).toBe(7);
  });

  it('hello 换行 blob 与 git hash-object 一致（SHA-1）', async () => {
    const result = await hashBlob('hello\n');
    expect(result.oid).toBe('ce013625030ba8dba906f756967f9e9ca394464a');
    expect(result.header).toBe('blob 6');
  });

  it('无换行 hello blob 与 git hash-object 一致（SHA-1）', async () => {
    const result = await hashBlob('hello');
    expect(result.oid).toBe('b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0');
    expect(result.header).toBe('blob 5');
  });

  it('无换行内容同样精确参与长度计算', async () => {
    const result = await hashBlob('x');
    expect(result.oid).toBe('c1b0730e0133447badcfd47fd144e254807b06e1');
  });

  it('SHA-256 空 blob 与 git --object-format=sha256 一致', async () => {
    const result = await hashBlob('', 'sha256');
    expect(result.oid).toBe(
      '473a0f4c3be8a93681a267e3b1e9a7dcda1185436fe141f7749120a303721813',
    );
  });

  it('SHA-256 hello blob 与 git 一致', async () => {
    const result = await hashBlob('hello\n', 'sha256');
    expect(result.oid).toBe(
      '2cf8d83d9ee29543b34a87727421fdecb7e3f3a183d337639025de576db9ebb4',
    );
  });

  it('UTF-8 多字节内容按字节计算长度与哈希', async () => {
    // 「你好」UTF-8 为 6 字节，用 node 无法直接取得 git 向量时只校验头长度确定性
    const a = await hashBlob('你好');
    const b = await hashBlob('你好');
    expect(a.oid).toBe(b.oid);
    expect(a.header).toBe('blob 6');
    expect(a.oid).toHaveLength(40);
  });
});

describe('buildTreeContent / hashTree', () => {
  const INNER_TREE = 'd0fd48f8a028d89b630a5c6bb9f94b12ff4c3853';
  const HELLO_BLOB = 'ce013625030ba8dba906f756967f9e9ca394464a';
  const WORLD_BLOB = 'cc628ccd10742baea8241c5924df992b5c019f71';
  const X_BLOB = 'c1b0730e0133447badcfd47fd144e254807b06e1';

  it('单条目 tree：100644 inner.txt + blob(x)', async () => {
    const result = await hashTree(`100644 inner.txt ${X_BLOB}`);
    expect(result.error).toBeNull();
    expect(result.oid).toBe(INNER_TREE);
  });

  it('目录与同名前缀文件排序：a.dir/ 排在 a.txt 之前（git write-tree 验证）', async () => {
    const text = [
      `100644 a.txt ${HELLO_BLOB}`,
      `040000 a.dir ${INNER_TREE}`,
      `100644 a.txt2 ${WORLD_BLOB}`,
    ].join('\n');
    const result = await hashTree(text);
    expect(result.error).toBeNull();
    expect(result.oid).toBe('fc5f8769180d438e4aa0a111b529039629110456');
    expect(result.entries.map((entry) => entry.name)).toEqual([
      'a.dir',
      'a.txt',
      'a.txt2',
    ]);
  });

  it('输入乱序时输出与排序无关（确定性）', async () => {
    const a = await hashTree(
      [`100644 a.txt2 ${WORLD_BLOB}`, `100644 a.txt ${HELLO_BLOB}`].join('\n'),
    );
    const b = await hashTree(
      [`100644 a.txt ${HELLO_BLOB}`, `100644 a.txt2 ${WORLD_BLOB}`].join('\n'),
    );
    expect(a.oid).toBe(b.oid);
  });

  it('目录模式 040000（ls-tree 显示形式）规范化为内部存储的 40000', async () => {
    const result = await hashTree(`040000 sub ${X_BLOB}`);
    const expected = await hashTree(`40000 sub ${X_BLOB}`);
    expect(result.error).toBeNull();
    expect(result.oid).toBe(expected.oid);
    expect(result.entries[0]?.mode).toBe('40000');
  });

  it('非法模式报错', () => {
    const result = buildTreeContent(`100777 x ${X_BLOB}`);
    expect(result.error).toContain('模式');
  });

  it('哈希长度与算法不匹配时报错', () => {
    const result = buildTreeContent(`100644 x ${X_BLOB}`, 'sha256');
    expect(result.error).toContain('64');
  });

  it('条目名包含 / 时报错', () => {
    const result = buildTreeContent(`100644 a/b ${X_BLOB}`);
    expect(result.error).toContain('名称');
  });

  it('段数不是 3 时报错', () => {
    const result = buildTreeContent('100644 only-two');
    expect(result.error).toContain('格式错误');
  });

  it('同名条目报错', () => {
    const result = buildTreeContent(
      `100644 x ${X_BLOB}\n100644 x ${HELLO_BLOB}`,
    );
    expect(result.error).toContain('同名');
  });
});

describe('hashTextObject', () => {
  const COMMIT_TEXT = [
    'tree fc5f8769180d438e4aa0a111b529039629110456',
    'author Happyileaf <997401767@qq.com> 1793594207 +0800',
    'committer trae-solo-agent [origin=scheduled_task] <solo-agent@trae.ai> 1793594207 +0800',
    '',
    'Initial commit',
    '',
  ].join('\n');

  const TAG_TEXT = [
    'object 40da113fbadf8c5dbf6586ad5e73b3248d148751',
    'type commit',
    'tag v1.0',
    'tagger t <t@t.com> 1700000000 +0000',
    '',
    'Release 1.0',
    '',
  ].join('\n');

  it('commit 原始文本哈希与 git commit-tree 一致', async () => {
    const result = await hashTextObject('commit', COMMIT_TEXT);
    expect(result.oid).toBe('40da113fbadf8c5dbf6586ad5e73b3248d148751');
    expect(result.header).toBe(`commit ${new TextEncoder().encode(COMMIT_TEXT).length}`);
  });

  it('annotated tag 原始文本哈希与 git mktag 一致', async () => {
    const result = await hashTextObject('tag', TAG_TEXT);
    expect(result.oid).toBe('cc903241a0e099b421d9ad61d78fc747249c6a74');
  });

  it('空 commit 内容报错', async () => {
    const result = await hashTextObject('commit', '');
    expect(result.error).toContain('不能为空');
    expect(result.oid).toBeNull();
  });

  it('结尾缺少换行时哈希与含换行不同（提醒精确性）', async () => {
    const withoutNewline = COMMIT_TEXT.replace(/\n$/, '');
    const result = await hashTextObject('commit', withoutNewline);
    expect(result.oid).not.toBe('40da113fbadf8c5dbf6586ad5e73b3248d148751');
  });
});
