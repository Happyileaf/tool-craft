import { describe, expect, it } from 'vitest';
import {
  AASA_DEPLOY_PATH,
  ASSETLINKS_DEPLOY_PATH,
  buildAppId,
  DEFAULT_AASA_INPUT,
  DEFAULT_ASSETLINKS_INPUT,
  FINGERPRINT_LENGTH,
  generate,
  generateAasa,
  generateAssetLinks,
  HANDLE_ALL_URLS_RELATION,
  LOGIN_CREDENTIALS_RELATION,
  normalizeFingerprint,
  type AasaInput,
  type AssetLinksInput,
} from './universalLinks';

const VALID_FP =
  '14:6D:E9:34:97:40:E5:84:73:40:0B:6D:22:3C:0B:14:7D:61:6F:1A:2B:9E:6D:9F:9A:5C:1C:9F:C2:E9:7B:6D';

describe('buildAppId', () => {
  it('严格按 TeamID.BundleID 拼接并去除首尾空白', () => {
    expect(buildAppId({ teamId: 'ABCDE12345', bundleId: 'com.example.app' })).toBe(
      'ABCDE12345.com.example.app',
    );
    expect(buildAppId({ teamId: '  ABCDE12345  ', bundleId: ' com.example.app ' })).toBe(
      'ABCDE12345.com.example.app',
    );
  });
});

describe('normalizeFingerprint', () => {
  it('合法指纹通过并统一转大写', () => {
    const lower = VALID_FP.toLowerCase();
    const result = normalizeFingerprint(lower);
    expect(result.error).toBeNull();
    expect(result.value).toBe(VALID_FP);
    expect(result.value).toHaveLength(FINGERPRINT_LENGTH);
  });

  it('去除内部空白后仍可通过', () => {
    const spaced = VALID_FP.match(/.{1,20}/g)!.join(' ');
    expect(normalizeFingerprint(spaced).value).toBe(VALID_FP);
  });

  it('少一组时拒绝并报告组数', () => {
    const short = VALID_FP.split(':').slice(0, 31).join(':');
    const result = normalizeFingerprint(short);
    expect(result.value).toBeNull();
    expect(result.error).toContain('31 组');
  });

  it('含非十六进制字符时拒绝并指出位置', () => {
    const bad = VALID_FP.split(':');
    bad[3] = 'ZZ';
    const result = normalizeFingerprint(bad.join(':'));
    expect(result.value).toBeNull();
    expect(result.error).toContain('第 4 组');
    expect(result.error).toContain('ZZ');
  });

  it('空输入被拒绝', () => {
    expect(normalizeFingerprint('   ').error).toBe('指纹为空');
  });
});

describe('generateAasa', () => {
  it('默认输入生成合法 AASA 且 appID 严格正确', () => {
    const result = generateAasa(DEFAULT_AASA_INPUT);
    expect(result.errors).toEqual([]);
    expect(result.deployPath).toBe(AASA_DEPLOY_PATH);
    const parsed = JSON.parse(result.json!) as Record<string, unknown>;
    const details = (parsed.applinks as { details: Array<{ appIDs: string[] }> }).details;
    expect(details[0]!.appIDs).toEqual(['ABCDE12345.com.example.app']);
  });

  it('exclude 组件输出 "/" 与 exclude 键', () => {
    const input: AasaInput = {
      apps: [{ teamId: 'ABCDE12345', bundleId: 'com.example.app' }],
      components: [
        { path: '/help/*', query: '', fragment: '', comment: '', exclude: true },
      ],
      enableWebCredentials: false,
      enableAppClips: false,
    };
    const parsed = JSON.parse(generateAasa(input).json!) as {
      applinks: { details: Array<{ components: Array<Record<string, unknown>> }> };
    };
    const component = parsed.applinks.details[0]!.components[0]!;
    expect(component['/']).toBe('/help/*');
    expect(component.exclude).toBe(true);
  });

  it('query/fragment/comment 键仅在非空时输出且键序稳定', () => {
    const input: AasaInput = {
      apps: [{ teamId: 'ABCDE12345', bundleId: 'com.example.app' }],
      components: [
        { path: '/promo', query: 'campaign=summer', fragment: 'top', comment: '活动', exclude: false },
      ],
      enableWebCredentials: false,
      enableAppClips: false,
    };
    const first = generateAasa(input).json!;
    const second = generateAasa(input).json!;
    expect(first).toBe(second);
    const component = (JSON.parse(first) as {
      applinks: { details: Array<{ components: Array<Record<string, unknown>> }> };
    }).applinks.details[0]!.components[0]!;
    expect(Object.keys(component)).toEqual(['/', '?', '#', 'comment']);
    expect(component['?']).toBe('campaign=summer');
    expect(component['#']).toBe('top');
  });

  it('webcredentials 与 appclips 开关生效', () => {
    const on = generateAasa({ ...DEFAULT_AASA_INPUT, enableAppClips: true });
    const parsed = JSON.parse(on.json!) as Record<string, unknown>;
    expect(parsed.webcredentials).toBeDefined();
    expect(parsed.appclips).toBeDefined();

    const off = generateAasa({ ...DEFAULT_AASA_INPUT, enableWebCredentials: false, enableAppClips: false });
    const offParsed = JSON.parse(off.json!) as Record<string, unknown>;
    expect(offParsed.webcredentials).toBeUndefined();
    expect(offParsed.appclips).toBeUndefined();
  });

  it('多个 appID 去重，空白条目被忽略', () => {
    const input: AasaInput = {
      apps: [
        { teamId: 'ABCDE12345', bundleId: 'com.example.app' },
        { teamId: 'ABCDE12345', bundleId: 'com.example.app' },
        { teamId: 'TEAM999999', bundleId: 'com.example.share' },
      ],
      components: [],
      enableWebCredentials: false,
      enableAppClips: false,
    };
    const parsed = JSON.parse(generateAasa(input).json!) as {
      applinks: { details: Array<{ appIDs: string[] }> };
    };
    expect(parsed.applinks.details[0]!.appIDs).toEqual([
      'ABCDE12345.com.example.app',
      'TEAM999999.com.example.share',
    ]);
  });

  it('Team ID / Bundle ID 非法时返回字段级错误且不产出 JSON', () => {
    const bad = generateAasa({
      apps: [{ teamId: 'bad', bundleId: 'no_dot' }],
      components: [],
      enableWebCredentials: false,
      enableAppClips: false,
    });
    expect(bad.json).toBeNull();
    expect(bad.errors.some((e) => e.includes('Team ID'))).toBe(true);
    expect(bad.errors.some((e) => e.includes('Bundle ID'))).toBe(true);
  });

  it('无任何 appID 时拒绝', () => {
    const result = generateAasa({
      apps: [],
      components: [],
      enableWebCredentials: false,
      enableAppClips: false,
    });
    expect(result.json).toBeNull();
    expect(result.errors.join(' ')).toContain('至少需要一条');
  });
});

describe('generateAssetLinks', () => {
  it('输出含固定 relation、package_name 与指纹数组且可被 JSON.parse', () => {
    const result = generateAssetLinks(DEFAULT_ASSETLINKS_INPUT);
    expect(result.errors).toEqual([]);
    expect(result.deployPath).toBe(ASSETLINKS_DEPLOY_PATH);
    const parsed = JSON.parse(result.json!) as Array<{
      relation: string[];
      target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
    }>;
    expect(parsed[0]!.relation).toEqual([HANDLE_ALL_URLS_RELATION]);
    expect(parsed[0]!.target.namespace).toBe('android_app');
    expect(parsed[0]!.target.package_name).toBe('com.example.android');
    expect(parsed[0]!.target.sha256_cert_fingerprints).toEqual([VALID_FP]);
  });

  it('开启凭据关联后追加 get_login_credentials', () => {
    const input: AssetLinksInput = { ...DEFAULT_ASSETLINKS_INPUT, enableLoginCredentials: true };
    const parsed = JSON.parse(generateAssetLinks(input).json!) as Array<{ relation: string[] }>;
    expect(parsed[0]!.relation).toEqual([HANDLE_ALL_URLS_RELATION, LOGIN_CREDENTIALS_RELATION]);
  });

  it('多条指纹去重、小写转大写，空行忽略', () => {
    const input: AssetLinksInput = {
      packageName: 'com.example.android',
      fingerprints: [VALID_FP.toLowerCase(), VALID_FP, '   '],
      enableLoginCredentials: false,
    };
    const parsed = JSON.parse(generateAssetLinks(input).json!) as Array<{
      target: { sha256_cert_fingerprints: string[] };
    }>;
    expect(parsed[0]!.target.sha256_cert_fingerprints).toEqual([VALID_FP]);
  });

  it('非法指纹与非法包名返回错误且不产出 JSON', () => {
    const result = generateAssetLinks({
      packageName: 'Invalid_Package',
      fingerprints: ['ab:cd'],
      enableLoginCredentials: false,
    });
    expect(result.json).toBeNull();
    expect(result.errors.some((e) => e.includes('package_name'))).toBe(true);
    expect(result.errors.some((e) => e.includes('指纹'))).toBe(true);
  });

  it('无有效指纹时拒绝', () => {
    const result = generateAssetLinks({
      packageName: 'com.example.android',
      fingerprints: [],
      enableLoginCredentials: false,
    });
    expect(result.json).toBeNull();
    expect(result.errors.join(' ')).toContain('至少需要一条');
  });
});

describe('generate 双平台与稳定性', () => {
  it('同时返回双平台结果与正确部署路径', () => {
    const result = generate(DEFAULT_AASA_INPUT, DEFAULT_ASSETLINKS_INPUT);
    expect(result.ios.deployPath).toBe(AASA_DEPLOY_PATH);
    expect(result.android.deployPath).toBe(ASSETLINKS_DEPLOY_PATH);
    expect(JSON.parse(result.ios.json!)).toBeTruthy();
    expect(JSON.parse(result.android.json!)).toBeTruthy();
  });

  it('重复生成 diff 为空（确定性键序与 2 空格缩进）', () => {
    const a = generate(DEFAULT_AASA_INPUT, DEFAULT_ASSETLINKS_INPUT);
    const b = generate(DEFAULT_AASA_INPUT, DEFAULT_ASSETLINKS_INPUT);
    expect(a.ios.json).toBe(b.ios.json);
    expect(a.android.json).toBe(b.android.json);
    expect(a.ios.json).toContain('\n  ');
  });
});
