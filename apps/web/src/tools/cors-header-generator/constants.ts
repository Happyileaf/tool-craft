export type OriginMode = "wildcard" | "reflect" | "list";

export interface OriginModeOption {
  value: OriginMode;
  label: string;
  hint: string;
}

export const ORIGIN_MODE_OPTIONS: OriginModeOption[] = [
  { value: "wildcard", label: "通配 *", hint: "Allow-Origin: *，与凭证互斥" },
  {
    value: "reflect",
    label: "反射请求 Origin",
    hint: "回显 $http_origin，自动带 Vary: Origin",
  },
  {
    value: "list",
    label: "白名单",
    hint: "仅允许列出的 Origin，服务端按请求匹配",
  },
];

export const COMMON_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export const DEFAULT_METHODS = "GET, POST, OPTIONS";
export const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization";
export const DEFAULT_MAX_AGE = "86400";
