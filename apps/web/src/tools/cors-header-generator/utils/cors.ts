/**
 * CORS 响应头拼装与策略校验纯函数（零依赖）
 *
 * 依据 Fetch 标准 / MDN CORS 指南：
 * - Access-Control-Allow-Origin 单值，凭证请求下不能为通配 "*"
 * - Access-Control-Allow-Credentials 仅在显式启用时输出
 * - Vary: Origin 在反射具体源时必须输出，避免缓存串源
 * - 预检相关头（Allow-Methods / Allow-Headers / Max-Age）只作用于 OPTIONS 预检
 */

export interface CorsConfig {
  /** 允许的来源：'*' 通配、'reflect' 反射请求 Origin、或具体 origin 列表 */
  originMode: "wildcard" | "reflect" | "list";
  /** originMode = list 时的具体来源（每行一个） */
  origins: string[];
  /** 是否允许凭证（Cookie / Authorization 等） */
  credentials: boolean;
  /** 允许的 HTTP 方法 */
  methods: string[];
  /** 允许的请求头（除 CORS 安全头外） */
  allowedHeaders: string[];
  /** 预检结果缓存秒数；null 表示不输出 Max-Age */
  maxAge: number | null;
  /** 是否输出暴露给 JS 的响应头 */
  exposeHeaders: string[];
}

export interface CorsResult {
  /** 实际响应（简单请求）头，按头名字典排列 */
  responseHeaders: Record<string, string>;
  /** 仅预检 OPTIONS 响应需要追加的头 */
  preflightHeaders: Record<string, string>;
  /** 可直接粘贴的 nginx add_header 片段 */
  nginxSnippet: string;
  warnings: string[];
  errors: string[];
}

const ORIGIN_REGEX = /^https?:\/\/[\w.-]+(:\d{1,5})?$/;

/** 校验单个 origin 语法（scheme://host[:port]） */
export function isValidOrigin(origin: string): boolean {
  return ORIGIN_REGEX.test(origin.trim());
}

function normalizeList(list: string[]): string[] {
  return list.map((item) => item.trim()).filter((item) => item.length > 0);
}

function toNginx(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `add_header ${key} "${value}" always;`)
    .join("\n");
}

export function generateCorsHeaders(config: CorsConfig): CorsResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const origins = normalizeList(config.origins);
  const methods = normalizeList(config.methods);
  const allowedHeaders = normalizeList(config.allowedHeaders);
  const exposeHeaders = normalizeList(config.exposeHeaders);

  // 凭证与通配源互斥（Fetch 标准硬性约束）
  if (config.credentials && config.originMode === "wildcard") {
    errors.push(
      '凭证请求（Allow-Credentials: true）下 Access-Control-Allow-Origin 不能为通配 "*"，请改为反射 Origin 或白名单',
    );
  }
  if (config.originMode === "list" && origins.length === 0) {
    errors.push("白名单模式至少需要一个合法 Origin");
  }
  for (const origin of origins) {
    if (!isValidOrigin(origin)) {
      errors.push(
        `「${origin}」不是合法的 Origin（应为 http(s)://host[:port]，不含路径）`,
      );
    }
  }
  if (methods.length === 0) {
    warnings.push(
      "未配置允许方法，预检响应将不含 Access-Control-Allow-Methods",
    );
  }
  if (config.maxAge !== null && config.maxAge < 0) {
    errors.push("Max-Age 不能为负数");
  }

  const responseHeaders: Record<string, string> = {};
  const preflightHeaders: Record<string, string> = {};

  if (errors.length === 0) {
    if (config.originMode === "wildcard") {
      responseHeaders["Access-Control-Allow-Origin"] = "*";
    } else if (config.originMode === "reflect") {
      // 反射具体源时必须带 Vary: Origin
      responseHeaders["Access-Control-Allow-Origin"] = "$http_origin";
      responseHeaders.Vary = "Origin";
    } else {
      responseHeaders["Access-Control-Allow-Origin"] = origins[0]!;
      responseHeaders.Vary = "Origin";
      if (origins.length > 1) {
        warnings.push(
          `Access-Control-Allow-Origin 只能返回单值，已取白名单首个 ${origins[0]}；多源场景需在服务端按请求 Origin 动态匹配（nginx 片段用 map 实现）`,
        );
      }
    }

    if (config.credentials) {
      responseHeaders["Access-Control-Allow-Credentials"] = "true";
    }
    if (exposeHeaders.length > 0) {
      responseHeaders["Access-Control-Expose-Headers"] =
        exposeHeaders.join(", ");
    }

    if (methods.length > 0) {
      preflightHeaders["Access-Control-Allow-Methods"] = methods.join(", ");
    }
    if (allowedHeaders.length > 0) {
      preflightHeaders["Access-Control-Allow-Headers"] =
        allowedHeaders.join(", ");
    } else {
      warnings.push("未配置 Allow-Headers，带自定义请求头的预检会失败");
    }
    if (config.maxAge !== null) {
      preflightHeaders["Access-Control-Max-Age"] = String(config.maxAge);
    }
  }

  const nginxSnippet =
    errors.length === 0
      ? [toNginx(responseHeaders), toNginx(preflightHeaders)]
          .filter(Boolean)
          .join("\n")
      : "";

  return { responseHeaders, preflightHeaders, nginxSnippet, warnings, errors };
}
