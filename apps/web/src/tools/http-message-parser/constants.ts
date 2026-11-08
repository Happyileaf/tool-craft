/** 请求方向默认报文（CRLF 形态的等价 LF 文本，解析器兼容并告警）。 */
export const DEFAULT_REQUEST = `GET /search?q=hello%20world&page=2&lang=zh HTTP/1.1
Host: example.com
User-Agent: curl/8.0
Accept: application/json
Cookie: sid=abc123; theme=dark
Authorization: Basic YWxpY2U6c2VjcmV0

`;

/** 响应方向默认报文。 */
export const DEFAULT_RESPONSE = `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 25
Set-Cookie: sid=xyz; Path=/; HttpOnly; Secure; SameSite=Lax
Cache-Control: no-cache, no-store, max-age=0

{"ok":true,"name":"trae"}`;

export type SideOption = 'request' | 'response' | 'auto';

export const SIDE_OPTIONS: { value: SideOption; label: string }[] = [
  { value: 'auto', label: '自动识别' },
  { value: 'request', label: '请求报文' },
  { value: 'response', label: '响应报文' },
];
