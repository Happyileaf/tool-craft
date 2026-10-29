import { describe, expect, it } from 'vitest';
import {
  buildHeadSnippet,
  buildManifest,
  buildManifestObject,
  isManifestUrl,
  isValidColor,
  validateManifest,
  type ManifestForm,
} from './manifest';

/** 构造全空表单 */
function createEmptyForm(): ManifestForm {
  return {
    name: '',
    shortName: '',
    description: '',
    startUrl: '',
    scope: '',
    display: '',
    orientation: '',
    themeColor: '',
    backgroundColor: '',
    lang: '',
    dir: '',
    id: '',
    categories: '',
    icons: [],
    shortcuts: [],
  };
}

describe('isManifestUrl / isValidColor', () => {
  it('接受 http(s) URL 与站内绝对路径，拒绝其他协议', () => {
    expect(isManifestUrl('https://a.com/icon.png')).toBe(true);
    expect(isManifestUrl('/icon.png')).toBe(true);
    expect(isManifestUrl('icon.png')).toBe(false);
    expect(isManifestUrl('ftp://a.com/x')).toBe(false);
  });

  it('校验常见颜色格式', () => {
    expect(isValidColor('#fff')).toBe(true);
    expect(isValidColor('#ffffff')).toBe(true);
    expect(isValidColor('#ffffffff')).toBe(true);
    expect(isValidColor('rgb(0, 0, 0)')).toBe(true);
    expect(isValidColor('rgba(0,0,0,0.5)')).toBe(true);
    expect(isValidColor('')).toBe(true);
    expect(isValidColor('not-a-color')).toBe(false);
  });
});

describe('validateManifest', () => {
  it('缺 name / start_url 与非法格式给出明确错误', () => {
    const form = createEmptyForm();
    const result = validateManifest(form);
    expect(result.errors).toContain('name（应用名称）为必填项');
    expect(result.errors).toContain('start_url（起始页）为必填项');

    form.name = 'Demo';
    form.startUrl = 'bad-url';
    form.themeColor = 'oops';
    form.icons = [{ src: 'no-protocol.png', sizes: '', type: '', purposes: [] }];
    const failed = validateManifest(form);
    expect(failed.errors).toContain('start_url 必须是 http(s) URL 或以 / 开头的站内路径');
    expect(failed.errors.some((error) => error.includes('theme_color'))).toBe(true);
    expect(failed.errors.some((error) => error.includes('第 1 个图标'))).toBe(true);
  });

  it('合法表单无错误', () => {
    const form = createEmptyForm();
    form.name = 'Demo';
    form.startUrl = '/';
    form.themeColor = '#000000';
    form.backgroundColor = '#ffffff';
    form.scope = '/';
    expect(validateManifest(form).errors).toEqual([]);
  });
});

describe('buildManifest', () => {
  it('基础字段正确映射，空值字段省略，2 空格格式化', () => {
    const form = createEmptyForm();
    form.name = 'Demo App';
    form.shortName = 'Demo';
    form.startUrl = '/';
    form.display = 'standalone';
    form.themeColor = '#000000';
    const json = buildManifest(form);
    expect(JSON.parse(json)).toEqual({
      name: 'Demo App',
      short_name: 'Demo',
      start_url: '/',
      display: 'standalone',
      theme_color: '#000000',
    });
    expect(json.startsWith('{\n  "name"')).toBe(true);
  });

  it('categories 按逗号/中文逗号/换行拆分并去空白', () => {
    const form = createEmptyForm();
    form.name = 'Demo';
    form.startUrl = '/';
    form.categories = 'productivity, 效率\nutilities，工具';
    expect(buildManifestObject(form).categories).toEqual([
      'productivity',
      '效率',
      'utilities',
      '工具',
    ]);
  });

  it('图标多行与 purpose 多值正确生成，空 src 行过滤', () => {
    const form = createEmptyForm();
    form.name = 'Demo';
    form.startUrl = '/';
    form.icons = [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purposes: ['any'] },
      { src: '/icon-mask.png', sizes: '512x512', type: 'image/png', purposes: ['maskable', 'monochrome'] },
      { src: '   ', sizes: '192x192', type: '', purposes: [] },
    ];
    const object = buildManifestObject(form);
    expect(object.icons).toEqual([
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-mask.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable monochrome',
      },
    ]);
  });

  it('shortcuts 数组正确生成，缺 name 或 url 的行过滤，空短名/空图标字段省略', () => {
    const form = createEmptyForm();
    form.name = 'Demo';
    form.startUrl = '/';
    form.shortcuts = [
      { name: 'Compose', shortName: '', url: '/compose', iconSrc: '/c.png', iconSizes: '96x96' },
      { name: 'No URL', shortName: 'x', url: '', iconSrc: '', iconSizes: '' },
      { name: 'Inbox', shortName: 'Inbox', url: '/inbox', iconSrc: '', iconSizes: '' },
    ];
    const object = buildManifestObject(form);
    expect(object.shortcuts).toEqual([
      { name: 'Compose', url: '/compose', icons: [{ src: '/c.png', sizes: '96x96' }] },
      { name: 'Inbox', short_name: 'Inbox', url: '/inbox' },
    ]);
  });

  it('全空表单输出空 JSON 对象', () => {
    expect(buildManifest(createEmptyForm())).toBe('{}');
  });
});

describe('buildHeadSnippet', () => {
  it('始终输出 manifest link，theme_color 非空时追加 meta', () => {
    const form = createEmptyForm();
    expect(buildHeadSnippet(form)).toBe('<link rel="manifest" href="/manifest.json">');

    form.themeColor = '#123456';
    expect(buildHeadSnippet(form)).toBe(
      '<link rel="manifest" href="/manifest.json">\n<meta name="theme-color" content="#123456">',
    );
  });
});
