import { describe, expect, it } from 'vitest';
import {
  MIME_ENTRIES,
  groupByPrimary,
  lookupByExtension,
  lookupByType,
  normalizeExtension,
  searchMime,
} from './mime';

describe('normalizeExtension', () => {
  it('去除空白、前导点并转小写', () => {
    expect(normalizeExtension('.JSON')).toBe('json');
    expect(normalizeExtension('  .Jpg ')).toBe('jpg');
    expect(normalizeExtension('webp')).toBe('webp');
  });

  it('空输入返回空字符串', () => {
    expect(normalizeExtension('')).toBe('');
    expect(normalizeExtension('  ')).toBe('');
  });
});

describe('lookupByExtension', () => {
  it('常见扩展名精确命中', () => {
    expect(lookupByExtension('.json')?.type).toBe('application/json');
    expect(lookupByExtension('json')?.type).toBe('application/json');
    expect(lookupByExtension('JSON')?.type).toBe('application/json');
    expect(lookupByExtension('.webp')?.type).toBe('image/webp');
    expect(lookupByExtension('.docx')?.type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('jpg 命中 image/jpeg，推荐扩展名为 jpeg 且别名含 jpg', () => {
    const entry = lookupByExtension('.jpg');
    expect(entry?.type).toBe('image/jpeg');
    expect(entry?.extensions[0]).toBe('jpeg');
    expect(entry?.extensions).toContain('jpg');
  });

  it('未知扩展名返回 null', () => {
    expect(lookupByExtension('.weird')).toBeNull();
    expect(lookupByExtension('')).toBeNull();
  });
});

describe('lookupByType', () => {
  it('MIME 精确查找（大小写不敏感、忽略参数）', () => {
    expect(lookupByType('application/json')?.extensions[0]).toBe('json');
    expect(lookupByType('Application/JSON')?.extensions[0]).toBe('json');
    expect(lookupByType('text/html; charset=utf-8')?.extensions[0]).toBe('html');
    expect(lookupByType('image/jpeg')?.extensions).toContain('jpg');
  });

  it('未知 MIME 返回 null', () => {
    expect(lookupByType('application/x-unknown')).toBeNull();
    expect(lookupByType('  ')).toBeNull();
  });

  it('无扩展名条目也能被查到', () => {
    expect(lookupByType('multipart/form-data')?.nameEn).toBe('Form Data (Multipart)');
  });
});

describe('searchMime', () => {
  it('空关键词返回全部', () => {
    expect(searchMime('')).toHaveLength(MIME_ENTRIES.length);
  });

  it('英文主类型关键词命中对应条目', () => {
    const results = searchMime('image');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((entry) => entry.primary === 'image')).toBe(true);
    expect(results.map((entry) => entry.type)).toContain('image/png');
  });

  it('中文关键词可命中（图片）', () => {
    const results = searchMime('图片');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((entry) => entry.type === 'image/webp')).toBe(true);
  });

  it('扩展名形式的搜索词等价于精确反查', () => {
    expect(searchMime('.jpg')).toHaveLength(1);
    expect(searchMime('.jpg')[0].type).toBe('image/jpeg');
  });

  it('无结果时返回空数组', () => {
    expect(searchMime('zzz-not-exist')).toHaveLength(0);
  });
});

describe('groupByPrimary', () => {
  it('按主类型分组且计数正确', () => {
    const grouped = groupByPrimary(MIME_ENTRIES);
    const total = Object.values(grouped).reduce((sum, list) => sum + (list?.length ?? 0), 0);
    expect(total).toBe(MIME_ENTRIES.length);
    expect(grouped.text?.every((entry) => entry.primary === 'text')).toBe(true);
  });

  it('分组结果与主类型过滤一致', () => {
    const grouped = groupByPrimary(searchMime('audio'));
    expect(grouped.audio?.length).toBe(5);
    expect(grouped.video).toBeUndefined();
  });
});

describe('内联安全与 charset', () => {
  it('image/png、text/plain、application/pdf 标记可内联；octet-stream 不标记', () => {
    expect(lookupByType('image/png')?.inlineSafe).toBe(true);
    expect(lookupByType('text/plain')?.inlineSafe).toBe(true);
    expect(lookupByType('application/pdf')?.inlineSafe).toBe(true);
    expect(lookupByType('application/octet-stream')?.inlineSafe).toBe(false);
    expect(lookupByType('application/json')?.inlineSafe).toBe(false);
  });

  it('charset 仅文本类条目展示', () => {
    expect(lookupByType('text/plain')?.charset).toBe('UTF-8');
    expect(lookupByType('text/css')?.charset).toBe('UTF-8');
    expect(lookupByType('application/json')?.charset).toBeUndefined();
    expect(lookupByType('image/png')?.charset).toBeUndefined();
  });
});
