import { describe, expect, it } from 'vitest';
import { buildMagnet, isMagnetParsed, parseMagnet } from './magnet';

const HASH = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HASH_UPPER = HASH.toUpperCase();

/** 取解析成功数据（失败时让用例直接报错） */
function expectParsed(input: string): ReturnType<typeof parseMagnet> & { error: null } {
  const result = parseMagnet(input);
  if (!isMagnetParsed(result)) {
    throw new Error(`expected parse success but got error: ${result.error}`);
  }
  return result;
}

describe('parseMagnet - 基本字段', () => {
  it('解析仅含 xt 的最小链接并识别 40 位 v1 info hash（统一大写）', () => {
    const result = expectParsed(`magnet:?xt=urn:btih:${HASH}`);
    expect(result.exactTopics).toEqual([`urn:btih:${HASH}`]);
    expect(result.btihV1).toBe(HASH_UPPER);
  });

  it('小写十六进制 hash 也能识别', () => {
    const result = expectParsed(`magnet:?xt=urn:btih:${'f'.repeat(40)}`);
    expect(result.btihV1).toBe('F'.repeat(40));
  });

  it('解析百分号编码的 dn（显示名）', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${HASH}&dn=Ubuntu%2024.04%20ISO`,
    );
    expect(result.displayName).toBe('Ubuntu 24.04 ISO');
  });

  it('dn 中文百分号解码', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${HASH}&dn=%E6%B5%8B%E8%AF%95%E8%B5%84%E6%BA%90`,
    );
    expect(result.displayName).toBe('测试资源');
  });

  it('多个 tr 按出现顺序全部保留', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${HASH}&tr=udp%3A%2F%2Fa.example%3A1337&tr=udp%3A%2F%2Fb.example%3A1337`,
    );
    expect(result.trackers).toEqual([
      'udp://a.example:1337',
      'udp://b.example:1337',
    ]);
  });

  it('解析 xl 文件大小、ws Web 种子、as 来源', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${HASH}&xl=1048576&ws=https%3A%2F%2Fseed.example%2Fa.iso&as=https%3A%2F%2Fmirror.example%2Fa.iso`,
    );
    expect(result.fileLength).toBe(1048576);
    expect(result.webSeeds).toEqual(['https://seed.example/a.iso']);
    expect(result.acceptableSource).toBe('https://mirror.example/a.iso');
  });

  it('kt 关键词按 + 拆分', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${HASH}&kt=linux+ubuntu+iso`,
    );
    expect(result.keywords).toEqual(['linux', 'ubuntu', 'iso']);
  });

  it('未识别参数收集到 extra', () => {
    const result = expectParsed(`magnet:?xt=urn:btih:${HASH}&so=0&x.custom=v`);
    expect(result.extra.so).toBe('0');
    expect(result.extra['x.custom']).toBe('v');
  });
});

describe('parseMagnet - 非 btih 与边界', () => {
  it('v2 / 其他 URN 保留在 exactTopics，btihV1 为 null', () => {
    const result = expectParsed(
      'magnet:?xt=urn:btmh:1220deadbeef',
    );
    expect(result.exactTopics).toEqual(['urn:btmh:1220deadbeef']);
    expect(result.btihV1).toBeNull();
  });

  it('同时含 v2 与 v1 时提取 v1 hash', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btmh:1220abcd&xt=urn:btih:${HASH}`,
    );
    expect(result.exactTopics).toHaveLength(2);
    expect(result.btihV1).toBe(HASH_UPPER);
  });

  it('32 位 Base32 hash 的 urn:btih 不匹配 v1 正则，btihV1 为 null', () => {
    const result = expectParsed(
      `magnet:?xt=urn:btih:${'A'.repeat(32)}`,
    );
    expect(result.btihV1).toBeNull();
  });

  it('前后空白被容忍', () => {
    expect(expectParsed(`  magnet:?xt=urn:btih:${HASH}  `).btihV1).toBe(HASH_UPPER);
  });

  it('xl 非数字返回错误', () => {
    expect(parseMagnet(`magnet:?xt=urn:btih:${HASH}&xl=abc`).error).toContain('xl');
  });
});

describe('parseMagnet - 错误输入', () => {
  it('空串报错', () => {
    expect(parseMagnet('').error).toContain('magnet');
  });

  it('非 magnet 协议报错', () => {
    expect(parseMagnet('https://example.com').error).toContain('magnet:?');
  });

  it('缺少查询参数报错', () => {
    expect(parseMagnet('magnet:?').error).toContain('查询参数');
  });

  it('缺少 xt 报错', () => {
    expect(parseMagnet('magnet:?dn=test').error).toContain('xt');
  });

  it('非法百分号编码报错', () => {
    expect(parseMagnet(`magnet:?xt=urn:btih:${HASH}&dn=%E4`).error).toContain(
      '百分号编码',
    );
  });
});

describe('buildMagnet - 拼装', () => {
  it('最小链接仅含 xt', () => {
    const result = buildMagnet({ exactTopics: [`urn:btih:${HASH}`] });
    expect(result.error).toBeNull();
    expect(result.uri).toBe(`magnet:?xt=urn%3Abtih%3A${HASH}`);
  });

  it('完整字段：dn、多个 tr、xl、ws、kt、as 按序拼装', () => {
    const result = buildMagnet({
      exactTopics: [`urn:btih:${HASH}`],
      displayName: 'Ubuntu 24.04 ISO',
      trackers: ['udp://a.example:1337', 'udp://b.example:1337'],
      fileLength: 1048576,
      webSeeds: ['https://seed.example/a.iso'],
      keywords: ['linux', 'ubuntu'],
      acceptableSource: 'https://mirror.example/a.iso',
    });
    expect(result.error).toBeNull();
    expect(result.uri).toContain('dn=Ubuntu%2024.04%20ISO');
    expect(result.uri).toContain('tr=udp%3A%2F%2Fa.example%3A1337');
    expect(result.uri).toContain('tr=udp%3A%2F%2Fb.example%3A1337');
    expect(result.uri).toContain('xl=1048576');
    expect(result.uri).toContain('ws=https%3A%2F%2Fseed.example%2Fa.iso');
    expect(result.uri).toContain('kt=linux+ubuntu');
    expect(result.uri).toContain('as=https%3A%2F%2Fmirror.example%2Fa.iso');
    expect(result.uri?.startsWith('magnet:?')).toBe(true);
  });

  it('没有 xt 时拒绝拼装', () => {
    expect(buildMagnet({ exactTopics: [] }).error).toContain('xt');
  });

  it('空白 xt 被过滤后为空时报错', () => {
    expect(buildMagnet({ exactTopics: ['  '] }).error).toContain('xt');
  });

  it('非法文件大小（负数 / 非整数）报错', () => {
    const base = { exactTopics: [`urn:btih:${HASH}`] };
    expect(buildMagnet({ ...base, fileLength: -1 }).error).toContain('文件大小');
    expect(buildMagnet({ ...base, fileLength: 1.5 }).error).toContain('文件大小');
  });

  it('空 tracker / 空 web seed 被跳过', () => {
    const result = buildMagnet({
      exactTopics: [`urn:btih:${HASH}`],
      trackers: ['  ', 'udp://a:1'],
      webSeeds: [''],
    });
    expect(result.uri).toBe(`magnet:?xt=urn%3Abtih%3A${HASH}&tr=udp%3A%2F%2Fa%3A1`);
  });
});

describe('往返：build → parse 语义一致', () => {
  it('拼装结果可被解析回相同字段', () => {
    const built = buildMagnet({
      exactTopics: [`urn:btih:${HASH}`],
      displayName: '测试资源 Ubuntu',
      trackers: ['udp://a.example:1337'],
      fileLength: 4096,
      keywords: ['demo', 'test'],
    });
    expect(built.uri).not.toBeNull();
    const parsed = expectParsed(built.uri ?? '');
    expect(parsed.btihV1).toBe(HASH_UPPER);
    expect(parsed.displayName).toBe('测试资源 Ubuntu');
    expect(parsed.trackers).toEqual(['udp://a.example:1337']);
    expect(parsed.fileLength).toBe(4096);
    expect(parsed.keywords).toEqual(['demo', 'test']);
  });
});
