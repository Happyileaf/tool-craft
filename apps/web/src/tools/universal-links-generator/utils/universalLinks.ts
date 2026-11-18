/**
 * 跨平台深链关联文件生成纯函数模块。
 *
 * 依据：
 * - Apple「Supporting associated domains」：apple-app-site-association（AASA）放置于
 *   https://<域>/.well-known/apple-app-site-association，现代 applinks.details[].components 语法；
 * - Google「App Links」：assetlinks.json 放置于
 *   https://<域>/.well-known/assetlinks.json，relation 固定 delegate_permission/common.handle_all_urls，
 *   并以 SHA-256 签名指纹建立站点与 Android 应用的关联。
 *
 * 所有函数均为确定性纯函数，不发起网络请求、不依赖浏览器 API。
 */

/** iOS AASA 单个 appID 条目（Team ID + Bundle ID） */
export interface AasaAppEntry {
  /** Apple Team ID（10 位字母数字），如 ABCDE12345 */
  teamId: string;
  /** Bundle Identifier，如 com.example.app */
  bundleId: string;
}

/** applinks component 匹配规则（RFC 风格的 / ? # 三段） */
export interface AasaComponent {
  /** path 匹配，如 /help/*；留空表示不输出 "/" 键 */
  path: string;
  /** query 匹配，如 q=hello；留空表示不输出 "?" 键 */
  query: string;
  /** fragment 匹配，如 section；留空表示不输出 "#" 键 */
  fragment: string;
  /** 备注，仅作注释键，不参与系统匹配 */
  comment: string;
  /** 是否为排除规则（exclude=true 时命中即不打开 App） */
  exclude: boolean;
}

/** iOS AASA 表单输入 */
export interface AasaInput {
  /** 一个或多个 appID 条目 */
  apps: AasaAppEntry[];
  /** component 匹配规则列表 */
  components: AasaComponent[];
  /** 是否输出 webcredentials 段（密码自动填充关联） */
  enableWebCredentials: boolean;
  /** 是否输出 appclips 段（App Clip 关联） */
  enableAppClips: boolean;
}

/** Android assetlinks 表单输入 */
export interface AssetLinksInput {
  /** applicationId / package_name，如 com.example.android */
  packageName: string;
  /** 一条或多条 SHA-256 签名指纹（冒号分隔，允许小写，输出统一大写） */
  fingerprints: string[];
  /** 是否附加 get_login_credentials 关联 */
  enableLoginCredentials: boolean;
}

/** 单平台生成结果 */
export interface PlatformResult {
  /** 字段级 / 整体错误，非空时 json 为 null */
  errors: string[];
  /** 稳定键序、2 空格缩进的 JSON 文本；有错误时为 null */
  json: string | null;
  /** 应发布的 /.well-known/ 路径 */
  deployPath: string;
}

/** 整体生成结果 */
export interface GenerationResult {
  ios: PlatformResult;
  android: PlatformResult;
}

/** AASA 标准发布路径 */
export const AASA_DEPLOY_PATH = '/.well-known/apple-app-site-association';
/** assetlinks.json 标准发布路径 */
export const ASSETLINKS_DEPLOY_PATH = '/.well-known/assetlinks.json';
/** assetlinks 固定 relation */
export const HANDLE_ALL_URLS_RELATION = 'delegate_permission/common.handle_all_urls';
/** 可选的凭据关联 relation */
export const LOGIN_CREDENTIALS_RELATION = 'delegate_permission/common.get_login_credentials';
/** 合法指纹长度：32 组两位十六进制 + 31 个冒号 = 95 字符 */
export const FINGERPRINT_LENGTH = 95;
/** Team ID 为 10 位大写字母数字 */
const TEAM_ID_PATTERN = /^[A-Z0-9]{10}$/;
/** Bundle ID 仅允许字母数字、点与连字符，且点分隔的每段非空 */
const BUNDLE_ID_PATTERN = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
/** Android packageName 规则：小写字母数字、点与下划线，点分隔且每段以字母开头 */
const PACKAGE_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
/** 指纹正则：32 组两位十六进制、冒号分隔 */
const FINGERPRINT_PATTERN = /^([0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2}$/;

/** 默认 iOS 输入（内置样例） */
export const DEFAULT_AASA_INPUT: AasaInput = {
  apps: [{ teamId: 'ABCDE12345', bundleId: 'com.example.app' }],
  components: [
    { path: '/help/*', query: '', fragment: '', comment: '帮助中心全部页面', exclude: true },
    { path: '/promo/*', query: 'campaign=summer', fragment: '', comment: '夏季活动落地页', exclude: false },
  ],
  enableWebCredentials: true,
  enableAppClips: false,
};

/** 默认 Android 输入（内置样例指纹为文档示例值） */
export const DEFAULT_ASSETLINKS_INPUT: AssetLinksInput = {
  packageName: 'com.example.android',
  fingerprints: [
    '14:6D:E9:34:97:40:E5:84:73:40:0B:6D:22:3C:0B:14:7D:61:6F:1A:2B:9E:6D:9F:9A:5C:1C:9F:C2:E9:7B:6D',
  ],
  enableLoginCredentials: false,
};

/**
 * 拼接 AASA appID：`<TeamID>.<BundleID>`。
 *
 * @param entry - Team ID 与 Bundle ID
 * @returns 拼接后的 appID
 */
export function buildAppId(entry: AasaAppEntry): string {
  return `${entry.teamId.trim()}.${entry.bundleId.trim()}`;
}

/**
 * 校验并规范化单条 SHA-256 指纹：去空白、统一大写。
 *
 * @param raw - 原始输入
 * @returns 规范化结果，含错误信息（如有）
 */
export function normalizeFingerprint(raw: string): { value: string | null; error: string | null } {
  const trimmed = raw.replace(/\s+/g, '').toUpperCase();
  if (trimmed === '') {
    return { value: null, error: '指纹为空' };
  }
  if (trimmed.length !== FINGERPRINT_LENGTH) {
    const groups = trimmed.split(':').length;
    return {
      value: null,
      error: `指纹长度非法：应为 32 组两位十六进制（${FINGERPRINT_LENGTH} 字符），当前 ${groups} 组、${trimmed.length} 字符`,
    };
  }
  if (!FINGERPRINT_PATTERN.test(trimmed)) {
    const badIndex = trimmed
      .split(':')
      .findIndex((group) => !/^[0-9A-F]{2}$/.test(group));
    return {
      value: null,
      error: badIndex >= 0 ? `第 ${badIndex + 1} 组含非十六进制字符或位数错误：${trimmed.split(':')[badIndex]}` : '指纹格式非法',
    };
  }
  return { value: trimmed, error: null };
}

/** 去除字符串数组中的空白条目并去重，保持顺序 */
function dedupeNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed !== '' && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

/** 将 component 表单行转换为 AASA JSON 对象，仅输出非空键且键序稳定 */
function buildComponentObject(component: AasaComponent): Record<string, string | boolean> {
  const object: Record<string, string | boolean> = {};
  if (component.path.trim() !== '') {
    object['/'] = component.path.trim();
  }
  if (component.query.trim() !== '') {
    object['?'] = component.query.trim();
  }
  if (component.fragment.trim() !== '') {
    object['#'] = component.fragment.trim();
  }
  if (component.comment.trim() !== '') {
    object.comment = component.comment.trim();
  }
  if (component.exclude) {
    object.exclude = true;
  }
  return object;
}

/**
 * 生成 iOS apple-app-site-association 内容。
 *
 * @param input - AASA 表单输入
 * @returns 含错误信息或 JSON 文本的结果
 */
export function generateAasa(input: AasaInput): PlatformResult {
  const errors: string[] = [];
  const appIds: string[] = [];

  input.apps.forEach((entry, index) => {
    const teamId = entry.teamId.trim();
    const bundleId = entry.bundleId.trim();
    if (teamId === '' || bundleId === '') {
      errors.push(`第 ${index + 1} 条 appID 的 Team ID 与 Bundle ID 均不能为空`);
      return;
    }
    if (!TEAM_ID_PATTERN.test(teamId)) {
      errors.push(`第 ${index + 1} 条 Team ID 非法：应为 10 位大写字母数字，当前为 ${teamId}`);
    }
    if (!BUNDLE_ID_PATTERN.test(bundleId)) {
      errors.push(`第 ${index + 1} 条 Bundle ID 非法：应为点分隔标识符（如 com.example.app），当前为 ${bundleId}`);
    }
    appIds.push(buildAppId({ teamId, bundleId }));
  });

  const uniqueAppIds = Array.from(new Set(appIds));
  if (uniqueAppIds.length === 0) {
    errors.push('至少需要一条有效的 appID（Team ID + Bundle ID）');
  }

  const componentObjects = input.components
    .filter((component) => component.path.trim() !== '' || component.query.trim() !== '' || component.fragment.trim() !== '')
    .map(buildComponentObject);

  if (errors.length > 0) {
    return { errors, json: null, deployPath: AASA_DEPLOY_PATH };
  }

  const aasa: Record<string, unknown> = {
    applinks: {
      details: [
        {
          appIDs: uniqueAppIds,
          components: componentObjects,
        },
      ],
    },
  };

  if (input.enableWebCredentials) {
    aasa.webcredentials = { apps: uniqueAppIds };
  }
  if (input.enableAppClips) {
    aasa.appclips = { apps: uniqueAppIds };
  }

  return {
    errors: [],
    json: JSON.stringify(aasa, null, 2),
    deployPath: AASA_DEPLOY_PATH,
  };
}

/**
 * 生成 Android assetlinks.json 内容。
 *
 * @param input - assetlinks 表单输入
 * @returns 含错误信息或 JSON 文本的结果
 */
export function generateAssetLinks(input: AssetLinksInput): PlatformResult {
  const errors: string[] = [];
  const packageName = input.packageName.trim();

  if (packageName === '') {
    errors.push('package_name 不能为空');
  } else if (!PACKAGE_NAME_PATTERN.test(packageName)) {
    errors.push(`package_name 非法：应为小写点分隔包名（如 com.example.app），当前为 ${packageName}`);
  }

  const fingerprints: string[] = [];
  input.fingerprints.forEach((raw, index) => {
    if (raw.trim() === '') {
      return;
    }
    const normalized = normalizeFingerprint(raw);
    if (normalized.error) {
      errors.push(`第 ${index + 1} 条指纹校验失败：${normalized.error}`);
    } else if (normalized.value) {
      fingerprints.push(normalized.value);
    }
  });

  const uniqueFingerprints = dedupeNonEmpty(fingerprints);
  if (uniqueFingerprints.length === 0) {
    errors.push('至少需要一条合法的 SHA-256 签名指纹');
  }

  if (errors.length > 0) {
    return { errors, json: null, deployPath: ASSETLINKS_DEPLOY_PATH };
  }

  const relation = [HANDLE_ALL_URLS_RELATION];
  if (input.enableLoginCredentials) {
    relation.push(LOGIN_CREDENTIALS_RELATION);
  }

  const assetLinks = [
    {
      relation,
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: uniqueFingerprints,
      },
    },
  ];

  return {
    errors: [],
    json: JSON.stringify(assetLinks, null, 2),
    deployPath: ASSETLINKS_DEPLOY_PATH,
  };
}

/**
 * 一次性生成双平台关联文件。
 *
 * @param iosInput - iOS AASA 输入
 * @param androidInput - Android assetlinks 输入
 * @returns 双平台结果
 */
export function generate(iosInput: AasaInput, androidInput: AssetLinksInput): GenerationResult {
  return {
    ios: generateAasa(iosInput),
    android: generateAssetLinks(androidInput),
  };
}
