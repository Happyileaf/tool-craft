/**
 * INI ↔ JSON 转换工具内常量
 */

/** 方向：INI 转 JSON */
export const DIRECTION_INI_TO_JSON = 'ini-to-json' as const;

/** 方向：JSON 转 INI */
export const DIRECTION_JSON_TO_INI = 'json-to-ini' as const;

/** 示例一：常见应用配置 */
export const APP_SAMPLE = `; 应用配置示例
app.name = Demo 应用
app.port = 8080
debug = true

[server]
host = 127.0.0.1
port = 3000
retries = 3

[database]
driver = postgres
host = db.internal
port = 5432
ssl = false`;

/** 示例二：点号嵌套键（需开启点号嵌套选项） */
export const DOT_SAMPLE = `[server.tls]
enabled = true
cert = /etc/ssl/cert.pem

[server.timeout]
connect = 5
read = 30`;

/** 示例三：JSON 输入示例 */
export const JSON_SAMPLE = `{
  "app.name": "Demo 应用",
  "debug": true,
  "server": {
    "host": "127.0.0.1",
    "port": 3000
  },
  "tags": ["web", "config"]
}`;

/** 示例按钮配置 */
export const SAMPLE_OPTIONS: Array<{ label: string; value: string; direction: string }> = [
  { label: '应用配置（INI）', value: APP_SAMPLE, direction: DIRECTION_INI_TO_JSON },
  { label: '点号分节（INI）', value: DOT_SAMPLE, direction: DIRECTION_INI_TO_JSON },
  { label: 'JSON 输入', value: JSON_SAMPLE, direction: DIRECTION_JSON_TO_INI },
];
