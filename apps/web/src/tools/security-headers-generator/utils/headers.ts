/**
 * 安全响应头生成内核：根据用户选择构造 6 类核心安全响应头的值，
 * 并对不安全组合给出明确告警。纯字符串处理，零依赖、可单测。
 */

import { HSTS_PRELOAD_MIN_AGE } from '../constants';

/** Permissions-Policy 单个特性的授权级别 */
export type PermissionAllow = 'none' | 'self' | 'any';

/** CSP 单条指令配置 */
export interface CspDirectiveConfig {
  /** 指令名，如 default-src */
  name: string;
  /** 源列表（已带引号的关键字原样保留，如 'self'） */
  sources: string[];
}

/** 完整的安全头生成配置 */
export interface SecurityHeadersConfig {
  /** HSTS max-age（秒）；null 表示不启用 */
  hstsMaxAge: number | null;
  /** HSTS includeSubDomains */
  hstsIncludeSubDomains: boolean;
  /** HSTS preload */
  hstsPreload: boolean;
  /** X-Frame-Options 值；null 表示不启用 */
  xFrameOptions: 'DENY' | 'SAMEORIGIN' | null;
  /** X-Content-Type-Options 固定 nosniff；false 表示不输出 */
  contentTypeNosniff: boolean;
  /** Referrer-Policy 值；null 表示不启用 */
  referrerPolicy: string | null;
  /** COOP 值；null 表示不启用 */
  coop: string | null;
  /** Permissions-Policy 特性授权表 */
  permissions: Record<string, PermissionAllow>;
  /** CSP 指令列表 */
  cspDirectives: CspDirectiveConfig[];
  /** CSP 是否使用 report-only 形态（输出 Content-Security-Policy-Report-Only） */
  cspReportOnly: boolean;
}

/** 单条输出的响应头 */
export interface HeaderEntry {
  name: string;
  value: string;
}

/** 生成结果 */
export interface BuildResult {
  headers: HeaderEntry[];
  /** 告警（仍会生成头，但需要用户确认风险） */
  warnings: string[];
}

/**
 * 构造 Strict-Transport-Security 值
 */
export function buildHsts(maxAge: number | null, includeSubDomains: boolean, preload: boolean): string | null {
  if (maxAge === null) {
    return null;
  }
  const parts = [`max-age=${maxAge}`];
  if (includeSubDomains) {
    parts.push('includeSubDomains');
  }
  if (preload) {
    parts.push('preload');
  }
  return parts.join('; ');
}

/**
 * 构造 Permissions-Policy 值：camera=(), geolocation=(self), payment=*
 */
export function buildPermissionsPolicy(permissions: Record<string, PermissionAllow>): string {
  return Object.entries(permissions)
    .map(([feature, allow]) => {
      if (allow === 'none') {
        return `${feature}=()`;
      }
      if (allow === 'self') {
        return `${feature}=(self)`;
      }
      return `${feature}=*`;
    })
    .join(', ');
}

/**
 * 构造 Content-Security-Policy 值，逐指令拼接
 */
export function buildCsp(directives: CspDirectiveConfig[]): string {
  return directives
    .filter((directive) => directive.sources.length > 0)
    .map((directive) => `${directive.name} ${directive.sources.join(' ')}`)
    .join('; ');
}

/**
 * 根据完整配置生成响应头列表与告警
 */
export function buildSecurityHeaders(config: SecurityHeadersConfig): BuildResult {
  const headers: HeaderEntry[] = [];
  const warnings: string[] = [];

  // 1. HSTS
  const hsts = buildHsts(config.hstsMaxAge, config.hstsIncludeSubDomains, config.hstsPreload);
  const maxAge = config.hstsMaxAge;
  if (hsts !== null && maxAge !== null) {
    headers.push({ name: 'Strict-Transport-Security', value: hsts });
    if (maxAge === 0) {
      warnings.push('HSTS max-age=0 表示「删除 HSTS 策略」，仅用于应急回退，不要作为长期配置。');
    }
    if (config.hstsPreload) {
      if (maxAge < HSTS_PRELOAD_MIN_AGE) {
        warnings.push(
          `preload 标记要求 max-age 至少 ${HSTS_PRELOAD_MIN_AGE}（1 年）且通常需要 includeSubDomains；当前为 ${config.hstsMaxAge}，浏览器不会接受预加载提交。`,
        );
      }
      if (!config.hstsIncludeSubDomains) {
        warnings.push('preload 提交通常要求同时包含 includeSubDomains，请确认所有子域都已支持 HTTPS。');
      }
    }
  }

  // 2. X-Frame-Options
  if (config.xFrameOptions !== null) {
    headers.push({ name: 'X-Frame-Options', value: config.xFrameOptions });
  }

  // 3. X-Content-Type-Options
  if (config.contentTypeNosniff) {
    headers.push({ name: 'X-Content-Type-Options', value: 'nosniff' });
  }

  // 4. Referrer-Policy
  if (config.referrerPolicy !== null) {
    headers.push({ name: 'Referrer-Policy', value: config.referrerPolicy });
    if (config.referrerPolicy === 'unsafe-url') {
      warnings.push('Referrer-Policy: unsafe-url 会向任意第三方泄露完整 URL（含查询参数），仅限明确需要的场景。');
    }
    if (config.referrerPolicy === 'no-referrer-when-downgrade') {
      warnings.push('no-referrer-when-downgrade 是浏览器旧默认值，会向同源/跨源 HTTPS 请求发送完整 URL；现代推荐 strict-origin-when-cross-origin。');
    }
  }

  // 5. COOP
  if (config.coop !== null) {
    headers.push({ name: 'Cross-Origin-Opener-Policy', value: config.coop });
  }

  // 6. Permissions-Policy
  const permissionValue = buildPermissionsPolicy(config.permissions);
  if (permissionValue) {
    headers.push({ name: 'Permissions-Policy', value: permissionValue });
    const anyFeatures = Object.entries(config.permissions)
      .filter(([, allow]) => allow === 'any')
      .map(([feature]) => feature);
    if (anyFeatures.length > 0) {
      warnings.push(`以下 Permissions-Policy 特性对任意来源开放（*）：${anyFeatures.join('、')}；如非业务必需建议改为 () 或 (self)。`);
    }
  }

  // 7. CSP
  const cspValue = buildCsp(config.cspDirectives);
  if (cspValue) {
    headers.push({
      name: config.cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
      value: cspValue,
    });

    const directiveMap = new Map(config.cspDirectives.map((directive) => [directive.name, directive.sources]));
    const hasDefault = (directiveMap.get('default-src')?.length ?? 0) > 0;
    if (!hasDefault) {
      warnings.push('CSP 未设置 default-src：未显式声明的指令（如 script-src、object-src 等）将不做限制，建议设置一个保守的默认值。');
    }
    const scriptSources = directiveMap.get('script-src') ?? [];
    if (scriptSources.includes("'unsafe-inline'")) {
      warnings.push("script-src 含 'unsafe-inline'：会显著削弱 XSS 防护，生产环境建议改用 nonce 或 hash。");
    }
    if (scriptSources.includes("'unsafe-eval'")) {
      warnings.push("script-src 含 'unsafe-eval'：允许字符串求值（eval / new Function），可能引入 XSS 风险。");
    }
    if (scriptSources.includes('https:') || scriptSources.includes('*')) {
      warnings.push("script-src 允许 'https:' 或 '*' 等价于信任任意 HTTPS 源的脚本，配合 CDN 投毒风险较大，建议枚举具体域名。");
    }
    const objectSources = directiveMap.get('object-src');
    if (objectSources === undefined) {
      warnings.push("未设置 object-src：建议显式 object-src 'none' 以阻止 <object>/<embed> 插件内容。");
    }
    const frameAncestors = directiveMap.get('frame-ancestors');
    if (frameAncestors && config.xFrameOptions !== null) {
      // 信息性提示：CSP Level 2 与 XFO 同时存在时现代浏览器以 CSP 为准
      const allows = frameAncestors.join(' ');
      if (!["'none'", "'self'"].includes(allows)) {
        warnings.push('frame-ancestors 与 X-Frame-Options 同时下发且允许来源不同：现代浏览器以 frame-ancestors 为准，旧浏览器只认 X-Frame-Options，请确认二者意图一致。');
      }
    }
  }

  return { headers, warnings };
}

/**
 * 把响应头列表渲染为 Nginx add_header 配置片段
 */
export function renderNginx(headers: HeaderEntry[]): string {
  return headers.map((header) => `add_header ${header.name} "${header.value}" always;`).join('\n');
}

/**
 * 把响应头列表渲染为 Apache .htaccess / vhost 配置片段
 */
export function renderApache(headers: HeaderEntry[]): string {
  return headers
    .map((header) => `Header always set ${header.name} "${header.value.replace(/"/g, '\\"')}"`)
    .join('\n');
}
